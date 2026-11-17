"""Offline tests for ipython fetchers; no network or real rate-limit waits.

uv run -q --with pandas --with numpy python -m unittest discover -s .pi/skills/stock/stock-analysis/tests -v
"""
import json
import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from fetch_proxy import fetch_proxy
from fetch_stock import FA_TOOLS, JOB_NAMES, fetch_stock, months_before
from sstock_fetch import SStockClient, decode_result


def envelope(data, error=False):
    return {"content": [{"type": "text", "text": json.dumps(data)}], "isError": error}


class FakeClock:
    def __init__(self):
        self.now = 0
        self.waits = []

    def __call__(self):
        return self.now

    async def sleep(self, seconds):
        self.waits.append(seconds)
        self.now += seconds


class BridgeError(Exception):
    def __init__(self, message, result=None):
        super().__init__(message)
        self.result = result


class FakePi:
    def __init__(self, handler=None, structure="nonfinancial"):
        self.handler = handler
        self.structure = structure
        self.calls = []
        self.described = []

    async def describe(self, name):
        self.described.append(name)
        return {"name": name, "parameters": {"type": "object"}, "guidelines": [], "returns": {}}

    async def tool(self, name, args):
        assert name in self.described, "describe must precede tool"
        tool = name.removeprefix("mcp__sstock__")
        self.calls.append((tool, args))
        if self.handler:
            result = self.handler(tool, args)
            if result is not None:
                if isinstance(result, Exception):
                    raise result
                return result
        if tool == "get_company_tool":
            return envelope({"sector_id": 13, "sectorName": "Điện", "exchange": "HOSE"})
        if tool == "get_sector_companies":
            return envelope({"structure": self.structure, "companies": []})
        if tool in ("get_price_history", "get_active_flow"):
            return envelope({"rows": [{"date": "2026-11-16", "close": 25, "adjClose": 25}]})
        return envelope({"note": "window limited by plan"})


def client_for(bridge, per_min=25):
    clock = FakeClock()
    return SStockClient(bridge, per_min=per_min, sleep=clock.sleep, clock=clock), clock


def page_rows(size=250, start=date(2026, 11, 16)):
    return [{"date": (start - timedelta(days=i)).isoformat(), "close": 25, "adjClose": 25}
            for i in range(size)]


class DecodeTests(unittest.TestCase):
    def test_supported_result_shapes(self):
        data = {"symbol": "HPG"}
        results = [envelope(data), json.dumps(envelope(data)), json.dumps(data), data,
                   {"content": [], "structuredContent": data},
                   {"content": [{"type": "text", "text": '{"symbol":'},
                                {"type": "text", "text": '"HPG"}'}]}]
        for result in results:
            with self.subTest(result=result):
                self.assertEqual(decode_result(result), (False, data))

    def test_plain_text_and_error(self):
        self.assertEqual(decode_result("not json"), (False, {"_raw": "not json"}))
        self.assertEqual(decode_result(envelope({"message": "denied"}, True)),
                         (True, {"message": "denied"}))

    def test_calendar_months(self):
        self.assertEqual(months_before(date(2025, 5, 31), 15), date(2024, 2, 29))


class ClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_describe_cached_and_shared_budget(self):
        bridge = FakePi()
        client, clock = client_for(bridge, per_min=2)
        for _ in range(3):
            await client.call("get_company_tool", {"symbol": "HPG"})
        self.assertEqual(len(bridge.described), 1)
        self.assertEqual(clock.waits, [61])

    async def test_retry_thrown_and_returned_429(self):
        for thrown in (False, True):
            with self.subTest(thrown=thrown):
                count = 0
                def handler(tool, args):
                    nonlocal count
                    count += 1
                    if count == 1:
                        result = envelope({"message": "429 Thử lại sau 3 giây"}, True)
                        return BridgeError("rate limited", result) if thrown else result
                    return envelope({"ok": True})
                client, clock = client_for(FakePi(handler))
                self.assertFalse((await client.call("test", {}))["isError"])
                self.assertEqual(clock.waits, [5])

    async def test_retry_exception_without_result_and_exhaustion(self):
        bridge = FakePi(lambda *_: BridgeError("HTTP 429 Retry-After: 1"))
        client, clock = client_for(bridge)
        result = await client.call("test", {})
        self.assertTrue(result["isError"])
        self.assertEqual(len(bridge.calls), 5)
        self.assertEqual(clock.waits, [3, 3, 3, 3])
        self.assertIn("5x", result["data"]["_raw"])

    async def test_permission_and_other_errors_are_not_retried(self):
        for response in [envelope({"message": "không có trong gói hiện tại"}, True),
                         BridgeError("network unavailable")]:
            bridge = FakePi(lambda *_, response=response: response)
            client, clock = client_for(bridge)
            self.assertTrue((await client.call("test", {}))["isError"])
            self.assertEqual(len(bridge.calls), 1)
            self.assertEqual(clock.waits, [])

    async def test_invalid_budget(self):
        for value in (0, 31, 1.5, True):
            with self.subTest(value=value), self.assertRaises(ValueError):
                SStockClient(FakePi(), per_min=value)


class FetchTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.work = Path(self.tmp.name) / "report"

    def load(self, name):
        return json.loads((self.work / name).read_text(encoding="utf-8"))

    async def test_full_fetch_all_structures_and_loader_contract(self):
        from sstock_lib import Work
        for structure, fa_tool in FA_TOOLS.items():
            with self.subTest(structure=structure):
                bridge = FakePi(structure=structure)
                client, _ = client_for(bridge)
                summary = await fetch_stock(client, "hpg", self.work)
                manifest = self.load("manifest.json")
                self.assertEqual(summary["failed"], [])
                self.assertEqual(summary["structure"], structure)
                self.assertEqual(set(manifest["jobs"]), JOB_NAMES)
                self.assertEqual(summary["jobs"], len(JOB_NAMES))
                self.assertIn((fa_tool, {"symbol": "HPG", "unit": "Q", "periods": 40}), bridge.calls)
                for name in JOB_NAMES:
                    raw = self.load(f"raw/{name}.json")
                    self.assertEqual(set(raw), {"tool", "args", "isError", "data"})
                work = Work(self.work)
                self.assertEqual(work.structure, structure)
                self.assertEqual(work.load("price")["rows"][0]["close"], 25)
                self.assertTrue(any("window limited" in note for note in summary["notes"]))

    async def test_only_keeps_legacy_manifest_and_unselected_raw(self):
        self.work.mkdir()
        (self.work / "raw").mkdir()
        (self.work / "raw/price.json").write_text("unchanged", encoding="utf-8")
        (self.work / "manifest.json").write_text(json.dumps({"symbol": "HPG", "jobs": {
            "price": {"tool": "get_price_history", "ok": True},
            "fa_y": {"tool": "get_stock_fa_nonfinancial", "ok": False, "err": "previous error"},
        }}), encoding="utf-8")
        bridge = FakePi()
        client, _ = client_for(bridge)
        summary = await fetch_stock(client, "HPG", self.work, only=["fa_q"])
        self.assertEqual([tool for tool, _ in bridge.calls],
                         ["get_company_tool", "get_sector_companies", "get_stock_fa_nonfinancial"])
        self.assertEqual((self.work / "raw/price.json").read_text(), "unchanged")
        self.assertEqual(summary["failed"], ["fa_y: previous error"])
        self.assertIn("price", self.load("manifest.json")["jobs"])

    async def test_identity_failures_checkpoint_and_stop(self):
        cases = [
            ("get_company_tool", envelope({"message": "unknown symbol"}, True), "company"),
            ("get_company_tool", envelope({}), "company"),
            ("get_sector_companies", envelope({"message": "unavailable"}, True), "sector_companies"),
            ("get_sector_companies", envelope({"structure": "unknown"}), "sector_companies"),
        ]
        for tool, response, job in cases:
            with self.subTest(tool=tool, response=response):
                bridge = FakePi(lambda name, args: response if name == tool else None)
                client, _ = client_for(bridge)
                summary = await fetch_stock(client, "HPG", self.work, only=[])
                self.assertTrue(any(item.startswith(job + ":") for item in summary["failed"]))
                self.assertFalse(self.load("manifest.json")["jobs"][job]["ok"])
                self.assertFalse(any("fa_" in name for name, _ in bridge.calls))

    async def test_pagination_uses_oldest_date_and_preserves_plan_note(self):
        first = page_rows()
        second = page_rows(3, date.fromisoformat(first[-1]["date"]) - timedelta(days=1))
        count = 0
        def handler(tool, args):
            nonlocal count
            if tool != "get_price_history":
                return None
            count += 1
            return envelope({"rows": list(reversed(first)) if count == 1 else second,
                             "note": "3-year plan window"})
        bridge = FakePi(handler)
        client, _ = client_for(bridge)
        summary = await fetch_stock(client, "HPG", self.work, only=["price"])
        price_calls = [args for tool, args in bridge.calls if tool == "get_price_history"]
        self.assertEqual(price_calls[1]["to"], second[0]["date"])
        raw = self.load("raw/price.json")
        self.assertEqual(len(raw["data"]["rows"]), 253)
        self.assertEqual(raw["data"]["rows"][0]["date"], first[0]["date"])
        self.assertTrue(any("3-year plan window" in note for note in summary["notes"]))

    async def test_partial_pagination_error_keeps_rows_and_flags_retry(self):
        count = 0
        def handler(tool, args):
            nonlocal count
            if tool != "get_price_history":
                return None
            count += 1
            return envelope({"rows": page_rows()}) if count == 1 else envelope({"message": "offline"}, True)
        client, _ = client_for(FakePi(handler))
        summary = await fetch_stock(client, "HPG", self.work, only=["price"])
        self.assertTrue(any(item.startswith("price:") for item in summary["failed"]))
        raw = self.load("raw/price.json")
        self.assertFalse(raw["isError"])
        self.assertEqual(len(raw["data"]["rows"]), 250)
        self.assertIn("Partial fetch", raw["data"]["note"])

    async def test_empty_or_malformed_pages_are_reported(self):
        for payload in ({"rows": []}, {"oops": []}, {"rows": [{"date": "invalid"}]}):
            with self.subTest(payload=payload):
                client, _ = client_for(FakePi(lambda tool, args: envelope(payload) if tool == "get_price_history" else None))
                summary = await fetch_stock(client, "HPG", self.work, only=["price"])
                self.assertTrue(self.load("raw/price.json")["isError"])
                self.assertTrue(any(item.startswith("price:") for item in summary["failed"]))

    async def test_nonadvancing_page_is_reported(self):
        client, _ = client_for(FakePi(lambda tool, args: envelope({"rows": page_rows()}) if tool == "get_price_history" else None))
        summary = await fetch_stock(client, "HPG", self.work, only=["price"])
        self.assertTrue(any("did not move backwards" in item for item in summary["failed"]))

    async def test_invalid_inputs_make_no_calls(self):
        bridge = FakePi()
        client, _ = client_for(bridge)
        for symbol, kwargs in [("TOOLONG", {}), ("HPG", {"price_years": 0}),
                               ("HPG", {"only": ["typo"]}), ("HPG", {"only": "fa_q"})]:
            with self.subTest(symbol=symbol, kwargs=kwargs), self.assertRaises(ValueError):
                await fetch_stock(client, symbol, self.work, **kwargs)
        self.assertEqual(bridge.calls, [])

    async def test_workdir_symbol_mismatch(self):
        self.work.mkdir()
        (self.work / "manifest.json").write_text('{"symbol":"REE"}')
        bridge = FakePi()
        client, _ = client_for(bridge)
        with self.assertRaises(ValueError):
            await fetch_stock(client, "HPG", self.work)
        self.assertEqual(bridge.calls, [])

    async def test_proxy_schema_dedup_and_failure_summary(self):
        bridge = FakePi(lambda tool, args: envelope({"message": "denied"}, True) if tool == "get_sector_fa" else None)
        client, _ = client_for(bridge)
        summary = await fetch_proxy(client, self.work, [13, "26", 13])
        self.assertEqual(len(bridge.calls), 8)
        self.assertEqual(set(summary), {13, 26})
        for sid in summary:
            raw = self.load(f"raw/proxy_{sid}.json")
            self.assertEqual(set(raw), {"rrg", "val", "fa", "companies"})
            self.assertEqual(summary[sid]["fa"], "ERR")
            self.assertEqual(summary[sid]["rrg"], "ok")
            self.assertEqual(raw["fa"]["args"]["sector"], str(sid))

    async def test_invalid_proxy_ids(self):
        bridge = FakePi()
        client, _ = client_for(bridge)
        for ids in ([], [0], [-1]):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                await fetch_proxy(client, self.work, ids)
        self.assertEqual(bridge.calls, [])


if __name__ == "__main__":
    unittest.main()
