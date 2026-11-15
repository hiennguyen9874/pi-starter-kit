"""proxy_sectors.py <workdir> — benchmark a stock against proxy sectors fetched by fetch_proxy.js.

Reads raw/proxy_<id>.json, raw/sector_rrg.json and metrics.json (run_pipeline.sh first).
Writes <workdir>/proxy.md and prints it. Additive: the main pipeline never reads proxy.md.
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sstock_lib import Work, fa_frames, fa_series, fmt  # noqa: E402


def ttm_yoy(s):
    if s is None or len(s.dropna()) < 8:
        return None
    s = s.dropna()
    new, old = s.iloc[-4:].sum(), s.iloc[-8:-4].sum()
    return (new / old - 1) * 100 if old > 0 else None


def last(s):
    return None if s is None or s.dropna().empty else float(s.dropna().iloc[-1])


def main(workdir):
    w = Work(workdir)
    m = json.load(open(os.path.join(workdir, "metrics.json")))
    rrg_all = (w.load("sector_rrg") or {}).get("sectors") or []
    by_rs3 = sorted(rrg_all, key=lambda s: -(s.get("rs3") or 0))
    by_rs6 = sorted(rrg_all, key=lambda s: -(s.get("rs6") or 0))
    rank3 = {s["sectorId"]: i + 1 for i, s in enumerate(by_rs3)}
    rank6 = {s["sectorId"]: i + 1 for i, s in enumerate(by_rs6)}
    rrg_by_id = {s["sectorId"]: s for s in rrg_all}

    sym = w.symbol or (m.get("meta") or {}).get("symbol", "")
    v = m["valuation"]
    pe, pb = v["pe"]["current"], v["pb"]["current"]
    fq = fa_frames(w.load("fa_q"))
    st_gm, st_nm = last(fa_series(fq, "grossMarginTTMPct")), last(fa_series(fq, "netMarginTTMPct"))
    st_np = ttm_yoy(fa_series(fq, "netProfitParent", prefer="businessResultQuarter"))

    rows, leaders, notes = [], [], []
    for path in sorted(glob.glob(os.path.join(workdir, "raw", "proxy_*.json"))):
        d = json.load(open(path))
        sid = int(os.path.basename(path)[6:-5])
        r = rrg_by_id.get(sid, {})
        val = (d["val"].get("data") or {}).get("latest") or {}
        fa = d["fa"].get("data") or {}
        ff = fa_frames(fa)
        comp = (d["companies"].get("data") or {})
        n_comp = (comp.get("sector") or {}).get("companyCount")
        gm, nm = last(fa_series(ff, "grossMarginTTMPct")), last(fa_series(ff, "netMarginTTMPct"))
        np_yoy = ttm_yoy(fa_series(ff, "netProfitParent", prefer="businessResultQuarter"))
        spe, spb = val.get("pe"), val.get("pb")
        rows.append(
            f"| {r.get('sectorName', sid)} ({sid}) | {r.get('quadrant', '—')} | "
            f"{fmt(r.get('rs3'), 0)} (#{rank3.get(sid, '—')}) | {fmt(r.get('rs6'), 0)} (#{rank6.get(sid, '—')}) | "
            f"{fmt(r.get('vcr'), 2)} | {fmt(spe, 2)} / {fmt(val.get('avg3YPe'), 2)} | {fmt(spb, 2)} / {fmt(val.get('avg3YPb'), 2)} | "
            f"{fmt(gm)} / {fmt(nm)} | {fmt(np_yoy)} | {n_comp or '—'} | "
            f"{fmt((pe / spe - 1) * 100 if pe and spe and spe > 0 else None)} | "
            f"{fmt((pb / spb - 1) * 100 if pb and spb and spb > 0 else None)} |"
        )
        stocks = sorted((d["rrg"].get("data") or {}).get("stocks") or [], key=lambda s: -(s.get("rs3") or 0))
        top = ", ".join(f"{s['symbol']} {s['rs3']:.0f}/{s['rs6']:.0f} {s['quadrant']}" for s in stocks[:5])
        q = {}
        for s in stocks:
            q[s["quadrant"]] = q.get(s["quadrant"], 0) + 1
        leaders.append(f"- {r.get('sectorName', sid)}: {len(stocks)} mã được RRG theo dõi / {n_comp} mã niêm yết · "
                       f"góc: {q} · top RS3: {top or '—'}")
        if val.get("avg3YPe") and spe and val["avg3YPe"] > 1.6 * spe:
            notes.append(f"> ⚠️ {r.get('sectorName', sid)}: P/E TB 3 năm {val['avg3YPe']:.1f} gấp >1,6× hiện tại {spe:.1f} — TB 3 năm có thể bị méo bởi năm lợi nhuận đáy; so P/E hiện tại.")

    out = [f"# Ngành proxy — {sym}", "",
           f"{sym}: P/E {fmt(pe, 2)} · P/B {fmt(pb, 2)} · biên gộp/ròng TTM {fmt(st_gm)} / {fmt(st_nm)} · LNST TTM YoY {fmt(st_np)}", "",
           "| Ngành proxy | RRG | RS3 (hạng) | RS6 (hạng) | VCR | P/E / TB3N | P/B / TB3N | Biên gộp / ròng TTM | LNST TTM YoY % | Số DN | P/E mã vs ngành % | P/B mã vs ngành % |",
           "|---|---|---|---|---|---|---|---|---|---|---|---|", *rows, "",
           "Mã dẫn dắt trong từng ngành proxy (RS3/RS6, góc RRG):", *leaders, "", *notes]
    text = "\n".join(out).rstrip() + "\n"
    open(os.path.join(workdir, "proxy.md"), "w").write(text)
    print(text)


if __name__ == "__main__":
    main(sys.argv[1])
