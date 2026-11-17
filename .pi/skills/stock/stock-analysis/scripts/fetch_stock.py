"""Fetch one ticker from ipython: await fetch_stock(client, "HPG", workdir).

No third-party dependencies. Raw payloads remain compatible with sstock_lib.Work.
Use only=["fa_q", ...] to refresh jobs; identity is always fetched to route FA.
"""
from __future__ import annotations

import calendar
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sstock_fetch import error_text, write_json

FA_TOOLS = {
    "nonfinancial": "get_stock_fa_nonfinancial", "bank": "get_stock_fa_bank",
    "securities": "get_stock_fa_securities", "insurance": "get_stock_fa_insurance",
}
PAGED = {"price": "get_price_history", "vnindex": "get_price_history", "active_flow": "get_active_flow"}
JOB_NAMES = {
    "company", "sector_companies", "fa_q", "fa_y", "valuation_1m", "valuation_1d",
    *PAGED, "power_rs6", "power_rs3", "stock_rrg", "peers_rrg", "elite_diag",
    "elite_sector", "sector_rrg", "sector_fa", "sector_val_all", "sector_val_hist",
    "market_state", "market_sentiment", "money_diffusion", "market_val",
}


def months_before(day, months):
    year, month = divmod(day.year * 12 + day.month - 1 - months, 12)
    return day.replace(year=year, month=month + 1,
                       day=min(day.day, calendar.monthrange(year, month + 1)[1]))


async def fetch_stock(client, symbol, out_dir, *, price_years=3, only=None):
    symbol = str(symbol).strip().upper()
    if len(symbol) != 3 or not symbol.isalnum():
        raise ValueError("symbol must contain exactly three letters/digits")
    if isinstance(price_years, bool) or not isinstance(price_years, int) or price_years < 1:
        raise ValueError("price_years must be a positive integer (250 rows per page)")
    if isinstance(only, str):
        raise ValueError("only must be a collection of job names, not a string")
    selected = None if only is None else set(only)
    if selected is not None and selected - JOB_NAMES:
        raise ValueError(f"Unknown jobs: {sorted(selected - JOB_NAMES)}")
    out = Path(out_dir).expanduser().resolve()
    mf_path = out / "manifest.json"
    previous = json.loads(mf_path.read_text(encoding="utf-8")) if mf_path.exists() else {}
    if previous.get("symbol") not in (None, symbol):
        raise ValueError("out_dir already belongs to another symbol")
    manifest = {**previous, "symbol": symbol,
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "jobs": dict(previous.get("jobs", {}))}

    def summary():
        jobs = manifest["jobs"]
        return {key: manifest.get(key) for key in ("symbol", "structure", "sectorId", "sectorName")} | {
            "jobs": len(jobs),
            "failed": [f"{name}: {job.get('err', 'fetch failed')}" for name, job in jobs.items() if not job["ok"]],
            "notes": [f"{name}: {job['note']}" for name, job in jobs.items() if job.get("note")],
        }

    def save(name, result, **details):
        write_json(out / "raw" / f"{name}.json", result)
        data = result["data"]
        job = {"tool": result["tool"], "ok": not result["isError"]}
        if isinstance(data, dict) and data.get("note"):
            job["note"] = data["note"]
        if result["isError"]:
            job["err"] = error_text(data)[:200]
        job.update(details)
        manifest["jobs"][name] = job
        # Checkpoint each completed job, including early identity failures.
        write_json(mf_path, manifest)

    async def job(name, tool, args, *, always=False):
        if not always and selected is not None and name not in selected:
            return None
        result = await client.call(tool, args)
        save(name, result)
        return result

    async def paged(name, tool, ticker, pages):
        if selected is not None and name not in selected:
            return
        rows, notes, failure = [], [], None
        to = None
        for _ in range(pages):
            args = {"symbol": ticker, "limit": 250}
            if to:
                args["to"] = to
            result = await client.call(tool, args)
            data = result["data"]
            if result["isError"]:
                failure = error_text(data)[:200]
                break
            if not isinstance(data, dict) or not isinstance(data.get("rows"), list):
                failure = "response has no rows array"
                break
            if data.get("note") and data["note"] not in notes:
                notes.append(data["note"])
            page = data["rows"]
            if not page:
                break
            try:
                oldest = min(date.fromisoformat(row["date"][:10]) for row in page)
                next_to = (oldest - timedelta(days=1)).isoformat()
            except (KeyError, TypeError, ValueError) as exc:
                failure = f"invalid page dates: {exc}"
                break
            if to and next_to >= to:
                failure = "pagination did not move backwards"
                break
            rows.extend(page)
            to = next_to
            if len(page) < 250:
                break
        rows = sorted({row["date"]: row for row in rows}.values(), key=lambda row: row["date"], reverse=True)
        if failure:
            notes.append("Partial fetch: " + failure)
        data = {"symbol": ticker, "rows": rows}
        if notes:
            data["note"] = "; ".join(notes)
        details = {"rows": len(rows), "ok": bool(rows) and failure is None}
        if failure or not rows:
            details["err"] = failure or "no rows returned"
        if rows:
            details["range"] = rows[-1]["date"] + " -> " + rows[0]["date"]
        # Keep usable partial rows visible to Work.load, but flag the job for retry.
        save(name, {"tool": tool, "args": {"symbol": ticker, "pages": pages},
                    "isError": not bool(rows), "data": data}, **details)

    company = await job("company", "get_company_tool", {"symbol": symbol}, always=True)
    if company["isError"]:
        return summary()
    company_data = company["data"]
    sector_id = (company_data.get("sector_id") or company_data.get("sectorId")) if isinstance(company_data, dict) else None
    if sector_id is None:
        company = {**company, "isError": True, "data": {"_raw": "company response has no sector id"}}
        save("company", company)
        return summary()
    manifest.update(sectorId=sector_id, sectorName=company_data.get("sectorName"), exchange=company_data.get("exchange"))
    sector = await job("sector_companies", "get_sector_companies", {"sector": str(sector_id)}, always=True)
    if sector["isError"]:
        return summary()
    structure = sector["data"].get("structure") if isinstance(sector["data"], dict) else None
    if structure not in FA_TOOLS:
        save("sector_companies", {**sector, "isError": True,
                                  "data": {"_raw": f"unknown financial structure: {structure}"}})
        return summary()
    manifest["structure"] = structure
    write_json(mf_path, manifest)
    fa_tool = FA_TOOLS[structure]
    specs = [
        ("fa_q", fa_tool, {"symbol": symbol, "unit": "Q", "periods": 40}),
        ("fa_y", fa_tool, {"symbol": symbol, "unit": "Y", "periods": 10}),
        ("valuation_1m", "get_stock_valuation", {"symbol": symbol, "resolution": "1M", "charts": ["pe", "pb", "peSstock", "pbSstock"]}),
        ("valuation_1d", "get_stock_valuation", {"symbol": symbol, "resolution": "1D", "from": months_before(date.today(), 15).isoformat(), "charts": ["pe", "pb"]}),
    ]
    for name, tool, args in specs:
        await job(name, tool, args)
    for name, tool in PAGED.items():
        await paged(name, tool, "VNINDEX" if name == "vnindex" else symbol, 2 if name == "active_flow" else price_years)
    specs = [
        ("power_rs6", "get_power_scores", {"symbol": symbol, "sessions": 500, "rsType": "RS6M"}),
        ("power_rs3", "get_power_scores", {"symbol": symbol, "sessions": 500, "rsType": "RS3M"}),
        ("stock_rrg", "get_stock_rrg", {"symbols": [symbol], "tailLength": 13}),
        ("peers_rrg", "get_stock_rrg", {"sectorId": sector_id, "tailLength": 1}),
        ("elite_diag", "get_elite_diagnostic", {"symbol": symbol}),
        ("elite_sector", "get_elite_stocks", {"status": "all", "sectorId": sector_id, "fromDate": "2021-01-01", "limit": 100}),
        ("sector_rrg", "get_sector_rrg", {"tailLength": 13}),
        ("sector_fa", "get_sector_fa", {"sector": str(sector_id), "unit": "Q", "periods": 17}),
        ("sector_val_all", "get_sector_valuation", {}),
        ("sector_val_hist", "get_sector_valuation", {"sectorId": sector_id, "years": 10, "resolution": "1M"}),
        ("market_state", "get_market_state", {"sessions": 250, "includeTransitions": True}),
        ("market_sentiment", "get_market_sentiment", {"includeSeries": True}),
        ("money_diffusion", "get_money_flow_diffusion", {"includeSeries": True}),
        ("market_val", "get_market_valuation", {"basket": "VNINDEX", "resolution": "1M"}),
    ]
    for name, tool, args in specs:
        await job(name, tool, args)
    return summary()
