"""Fetch business-segment benchmarks after fetch_stock, using the same client."""
from pathlib import Path

from sstock_fetch import write_json


async def fetch_proxy(client, out_dir, sector_ids):
    ids = list(dict.fromkeys(int(value) for value in sector_ids))
    if not ids or any(value <= 0 for value in ids):
        raise ValueError("sector_ids must contain positive sector IDs")
    out = Path(out_dir).expanduser().resolve()
    summary = {}
    for sector_id in ids:
        specs = {
            "rrg": ("get_stock_rrg", {"sectorId": sector_id}),
            "val": ("get_sector_valuation", {"sectorId": sector_id}),
            "fa": ("get_sector_fa", {"sector": str(sector_id), "unit": "Q"}),
            "companies": ("get_sector_companies", {"sector": str(sector_id)}),
        }
        results = {}
        for name, (tool, args) in specs.items():
            results[name] = await client.call(tool, args)
        write_json(out / "raw" / f"proxy_{sector_id}.json", results)
        summary[sector_id] = {name: "ERR" if result["isError"] else "ok"
                              for name, result in results.items()}
    return summary
