"""Offline regressions: TNG cash/rights, missing periods and data coverage."""
import json
from pathlib import Path
import sys
from contextlib import redirect_stdout
from io import StringIO
from tempfile import TemporaryDirectory
import unittest

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from analyze import balance_sheet_events, main, scorecard
from cashflow_checks import evidence_bridge, fiscal_crosscheck, reconcile_cash
from cross_checks import book_basis_check, sector_fundamentals


class CashflowTests(unittest.TestCase):
    def setUp(self):
        self.quarters = [f"2025Q{i}" for i in range(1, 5)]
        self.fq = {"cashFlow": pd.DataFrame({"operating": [-556.86, -9.27, 221.87, 763.46],
                                            "investing": [11, 12, 13, 14], "financing": [1, 1, 1, 1]}, index=self.quarters)}
        self.fy = {"cashFlow": pd.DataFrame({"operating": [-259.49], "investing": [50.5], "financing": [4]}, index=["2025"])}
        self.evidence = {"symbol": "TNG", "unit": "bil", "scope": "separate", "basis": "BCTC riêng; số lũy kế",
                         "periods": {key: {"source": "BCTC TNG, trang 5", "publishedDate": day, "operating": cfo,
                                            "netProfit": profit, "capex": capex} for key, day, cfo, profit, capex in [
                             ("2025Q3", "2025-10-17", -344.256, 280.379, 77.812),
                             ("2025Q4", "2026-01-15", -259.486, 391.969, 79.566),
                             ("2026Q2", "2026-07-23", -870.323, 210.106, 62.031),
                             ("2026Q3", "2026-10-20", -695.529, 361.637, 66.852)]}}

    def bridge(self, end="2026Q3", cutoff="2026-11-19"):
        with TemporaryDirectory() as wd:
            f = Path(wd) / "cashflow_evidence.json"
            f.write_text(json.dumps(self.evidence), encoding="utf-8")
            return evidence_bridge(f, "TNG", end, cutoff)

    def test_year_conflict_quarantines_only_dependent_metrics(self):
        rec = fiscal_crosscheck(self.fq, self.fy, "2026Q3")
        cfo, = [x for x in rec["checks"] if x["mismatch"]]
        self.assertAlmostEqual(cfo["sumQuarter"], 419.2)
        self.assertEqual(rec["suspect"], {"currentTTM": ["operating"], "priorTTM": ["operating"]})
        vendor = {"ocfTTM": 67.93, "ocfToNetProfitTTM": 0.14, "cashFlowAfterInvestingTTM": -300, "investingTTM": -245}
        reconcile_cash(vendor, rec)
        self.assertEqual(vendor, {"investingTTM": -245})
        self.assertEqual(rec["vendorExcluded"]["ocfTTM"], 67.93)
        # Only the previous window still intersects FY25 once FY26 is complete.
        self.assertEqual(fiscal_crosscheck(self.fq, self.fy, "2026Q4")["suspect"],
                         {"currentTTM": [], "priorTTM": ["operating"]})

    def test_missing_quarter_and_unfinished_year_do_not_fabricate_checks(self):
        self.assertEqual(fiscal_crosscheck(self.fq, self.fy, "2025Q3")["checks"], [])
        self.fq["cashFlow"].loc["2025Q2", "operating"] = float("nan")
        self.fq["cashFlow"] = self.fq["cashFlow"].drop("2025Q4")
        self.assertEqual(fiscal_crosscheck(self.fq, self.fy, "2026Q3")["checks"], [])

    def test_same_scope_ytd_bridge_for_quarter_and_ttm(self):
        source = self.bridge()
        self.assertAlmostEqual(source["currentQ"]["operating"], 174.794)
        self.assertAlmostEqual(source["currentTTM"]["operating"], -610.759)
        self.assertAlmostEqual(source["currentTTM"]["netProfit"], 473.227)
        self.assertEqual(source["priorTTM"], {})
        rec = fiscal_crosscheck(self.fq, self.fy, "2026Q3")
        d = {"ocfToNetProfitTTM": 0.14}
        reconcile_cash(d, rec, source)
        self.assertAlmostEqual(d["ocfToNetProfitTTM"], -1.2906, places=4)
        self.assertAlmostEqual(d["cashFlowLessCapexTTM"], -679.365)
        self.assertEqual(rec["metricSources"]["ocfToNetProfitTTM"], "company_ytd")
        del self.evidence["periods"]["2025Q3"]["netProfit"]
        d = {"ocfTTM": 67.93, "ocfToNetProfitTTM": 1.2}
        reconcile_cash(d, fiscal_crosscheck({}, {}, "2026Q3"), self.bridge())
        self.assertEqual(d["ocfTTM"], -610.759)
        self.assertNotIn("ocfToNetProfitTTM", d)

    def test_document_cutoff_and_amount_validation(self):
        self.assertIn("error", self.bridge(cutoff="2026-10-19"))
        self.evidence["periods"]["2026Q3"]["capex"] = -5
        self.assertIn("error", self.bridge())
        self.evidence["periods"]["2026Q3"]["capex"] = None
        self.assertNotIn("capex", self.bridge()["currentTTM"])


class PipelineOutputTests(unittest.TestCase):
    def setUp(self):
        tmp = TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.work = Path(tmp.name)
        (self.work / "raw").mkdir()
        (self.work / "manifest.json").write_text(json.dumps({"symbol": "TEST", "structure": "nonfinancial"}))
        self.dates = pd.bdate_range(end="2026-02-02", periods=21).strftime("%Y-%m-%d").tolist()
        self.prices = [dict(date=d, close=10, adjClose=10, changePct=0, high=11, low=9,
                            marketCap=10**9, totalValue=10**9, netForeignValue=0) for d in self.dates]
        self.write_raw("price", {"rows": self.prices})

    def write_raw(self, name, payload):
        (self.work / "raw" / f"{name}.json").write_text(json.dumps({"data": payload}))

    def compute(self):
        with redirect_stdout(StringIO()):
            main(self.work)
        return json.loads((self.work / "metrics.json").read_text()), (self.work / "tables.md").read_text()

    def test_cash_gap_does_not_resurface_quarantined_investing(self):
        self.write_raw("fa_q", {"periods": [{"year": 2025, "quarter": i} for i in range(1, 5)],
                                "charts": {"asset": {"cashBank": [50] * 4, "totalAssets": [100] * 4},
                                           "cashFlow": {"cashEndOfPeriod": [10] * 4, "investing": [-249] * 4}}})
        self.write_raw("fa_y", {"periods": [{"year": 2025}], "charts": {"cashFlow": {"investing": [-206.09]}}})
        m, table = self.compute()
        self.assertNotIn("investingTTM", m["fa"]["derived"])
        self.assertIn("cashBank 50", table)
        self.assertNotIn("LCTT đầu tư 4Q", table)
        evidence = dict(symbol="TEST", unit="bil", scope="separate", basis="BCTC riêng", periods={
            "2025Q4": dict(publishedDate="2026-01-15", source="BCTC, trang 5", investing=-206.09)})
        (self.work / "cashflow_evidence.json").write_text(json.dumps(evidence))
        m, table = self.compute()
        self.assertEqual(m["fa"]["derived"]["investingTTM"], -206.09)
        self.assertIn("LCTT đầu tư 4Q -206.09 tỷ (BCTC gốc)", table)
        self.assertNotIn("LCTT đầu tư 4Q -996", table)

    def test_flow_coverage_requires_all_sessions_but_accepts_measured_zero(self):
        rows = [dict(date=d, net=0, buy=1, sell=1) for d in self.dates]
        rows.append(dict(date="2026-02-03", net=10**9, buy=10**9, sell=0))
        self.write_raw("active_flow", {"rows": rows})
        m, _ = self.compute()
        self.assertEqual(m["flows"]["foreign_net_20_bil"], 0)
        self.assertEqual(m["flows"]["active_net_20_bil"], 0)
        self.assertEqual(m["signals"]["coverage"]["Dòng tiền"]["available"], 2)

        for row in self.prices:
            row["netForeignValue"] = None
        self.write_raw("price", {"rows": self.prices})
        self.write_raw("active_flow", {"rows": rows[:5] + rows[6:]})  # gap inside the 20-session window
        m, table = self.compute()
        self.assertIsNone(m["flows"]["foreign_net_20_bil"])
        self.assertIsNone(m["flows"]["active_net_20_bil"])
        self.assertIsNone(m["flows"]["active_ratio_20"])
        self.assertEqual(m["signals"]["coverage"]["Dòng tiền"]["available"], 0)
        self.assertIn("Khối ngoại ròng 20 phiên (tỷ)=— (không chấm)", table)


class CrossChecks(unittest.TestCase):
    def test_industry_windows_cannot_skip_a_quarter_or_mix_periods(self):
        idx = pd.period_range("2024Q4", periods=8, freq="Q").astype(str)
        df = pd.DataFrame({"netRevenue": range(10, 18), "grossMarginPct": 12, "grossMarginTTMPct": 15}, index=idx)
        peer = df * 2
        compared = sector_fundamentals({"p": df}, {"p": peer}, idx[-1])
        self.assertEqual(compared["netRevenue_share_ttm_pct"], 50)
        self.assertEqual(compared["sector_grossMarginPct"], 24)
        self.assertEqual(compared["sector_grossMarginTTMPct"], 30)
        self.assertEqual(sector_fundamentals({"p": df}, {"p": peer.drop(idx[-1])}, idx[-1]), {})
        gap = sector_fundamentals({"p": df}, {"p": peer.drop(idx[2])}, idx[-1])
        self.assertEqual(gap["netRevenue_share_ttm_pct"], 50)
        self.assertNotIn("sector_netRevenue_ttm_yoy_pct", gap)

    def test_valuation_basis_uses_exact_day_and_compatible_shares(self):
        daily = {"dates": ["2026-11-19"], "charts": {"pb": {"bvps": [13863]}}}
        fa = {"latest_period": "2026Q3", "charterCapital_latest": 1287.31, "derived": {"equityApprox": 2035.27}}
        snapshot = {"sharesOutstanding": 128731266}
        check = book_basis_check(daily, "2026-11-19", 16.8, fa, snapshot)
        self.assertTrue(check["mismatch"])
        self.assertAlmostEqual(check["approxPb"], 1.06, places=2)
        self.assertIsNone(book_basis_check(daily, "2026-11-20", 16.8, fa, snapshot))
        self.assertIsNone(book_basis_check(daily, "2026-11-19", 16.8, fa, {"sharesOutstanding": 10}))

    def test_score_distinguishes_unavailable_from_observed_neutral(self):
        M = dict(meta={"structure": "nonfinancial"}, price={}, flows={}, rs={}, elite={}, sector={}, market={},
                 fa={"derived": {"netDebtToEquityPct": 50}}, valuation={"pb": {"pctile10y": 10}, "bookBasisCheck": {"mismatch": True}})
        sc = scorecard(M)
        self.assertEqual(sc["coverage"]["Chất lượng"], {"available": 1, "total": 3})
        self.assertEqual(sc["coverage"]["Định giá"], {"available": 0, "total": 3})
        self.assertEqual(sc["total"], 0)

    def test_rights_heuristic_does_not_confirm_source_of_funds(self):
        idx = ["2025Q3", "2025Q4"]
        frames = {"capital": pd.DataFrame({"charterCapital": [1226.01, 1287.31]}, index=idx),
                  "cashFlow": pd.DataFrame({"financing": [10, 193.74]}, index=idx)}
        action = {"date": "2025-09-24", "factor": 1.025, "prev_close": 20.5}
        balance_sheet_events(frames, actions=[action])
        self.assertIn("giả thuyết", action["kind"])
        self.assertIn("ESOP", action["kind"])
        self.assertNotIn("có tiền mới", action["kind"])
