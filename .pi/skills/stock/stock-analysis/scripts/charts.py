"""Render the analysis charts for one fetched ticker.

usage: uv run --with pandas --with numpy --with matplotlib --with seaborn python charts.py <workdir>
writes: <workdir>/charts/*.png  (look at every PNG with the read tool before writing the report)
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

sys.path.insert(0, str(Path(__file__).parent))
from sstock_lib import BIL, Work, axis_series, fa_frames, flow_frame, macd, price_frame, rsi, sma

sns.set_theme(style="whitegrid", context="notebook", font="DejaVu Sans")
plt.rcParams.update({"figure.dpi": 110, "savefig.dpi": 130, "axes.titlesize": 11, "axes.titleweight": "bold",
                     "legend.fontsize": 7.5, "axes.labelsize": 9, "xtick.labelsize": 8, "ytick.labelsize": 8})
UP, DOWN, ACC, GREY = "#2a9d8f", "#e76f51", "#264653", "#8d99ae"
PALETTE = sns.color_palette("tab10")
QCOL = {"leading": "#2a9d8f", "improving": "#457b9d", "weakening": "#f4a261", "lagging": "#e76f51"}

# Charts stacked as composition; other money series drawn as grouped bars (<=3) or lines.
STACKED = {"asset", "capital", "costStructure", "profitStructure", "depositStructure", "loanStructure",
           "loanStructureByQuality", "loanStructureBySector", "loanStructureByType", "proprietaryTradingBreakdown",
           "fvtplBreakdown", "afsBreakdown", "htmBreakdown", "financialInvestment", "reserveStructure",
           "financialActivities"}
LINE_SERIES = {"netProfitParent", "netRevenue", "profitBeforeProvision", "totalLoans", "adjustedTotalDeposits",
               "equity", "avgEarningAssets", "avgFundingLiabilities", "cashEndOfPeriod", "marginBalance"}
KEY_CHARTS = {
    "nonfinancial": ["businessResultQuarter", "businessResults4Q", "profitMargin", "profitPerformance", "capital", "cashFlow"],
    "bank": ["businessResultQuarter", "profitability", "rateBadDebt", "costStructure", "depositStructure", "profitPerformance"],
    "securities": ["businessResultQuarter", "profitStructure", "marginLoan", "brokerageSegment", "profitPerformance", "proprietaryTradingBreakdown"],
    "insurance": ["businessResultQuarter", "profitStructure", "costRatio", "financialInvestment", "profitPerformance", "profitMargin"],
}


def save(fig, out: Path, name: str):
    out.mkdir(parents=True, exist_ok=True)
    fig.savefig(out / name, bbox_inches="tight")
    plt.close(fig)
    print("chart:", out / name)


def plot_fa(ax, df: pd.DataFrame, title: str, cid: str):
    df = df.dropna(how="all", axis=1)
    pcts = [c for c in df if c.endswith("Pct")]
    money = [c for c in df if c not in pcts]
    lines = [c for c in money if (cid in STACKED and c in LINE_SERIES) or c.lower().startswith("total")]
    parts = [c for c in money if c not in lines]
    x = np.arange(len(df))
    if cid in STACKED and parts:
        pos = np.zeros(len(df)); neg = np.zeros(len(df))
        for i, c in enumerate(parts):
            v = df[c].fillna(0).values
            base = np.where(v >= 0, pos, neg)
            ax.bar(x, v, bottom=base, color=PALETTE[i % 10], width=0.75, label=c, edgecolor="white", linewidth=0.4)
            pos += np.where(v >= 0, v, 0); neg += np.where(v < 0, v, 0)
    elif parts:
        w = 0.8 / min(len(parts), 3) if len(parts) <= 3 else None
        for i, c in enumerate(parts):
            if w:
                ax.bar(x + (i - (len(parts) - 1) / 2) * w, df[c].values, width=w, color=PALETTE[i], label=c)
            else:
                ax.plot(x, df[c].values, marker="o", ms=3, lw=1.6, color=PALETTE[i], label=c)
    for i, c in enumerate(lines):
        ax.plot(x, df[c].values, color="black" if i == 0 else PALETTE[(i + 5) % 10], marker="o", ms=3, lw=1.6, label=c)
    if money:
        ax.axhline(0, color="#555", lw=0.6)
        ax.set_ylabel("tỷ đồng")
    ax2 = None
    if pcts:
        ax2 = ax.twinx() if money else ax
        for i, c in enumerate(pcts):
            ax2.plot(x, df[c].values, ls="--" if money else "-", marker="s", ms=3, lw=1.5,
                     color=["#d62828", "#6a4c93", "#f77f00", "#1d3557"][i % 4], label=c)
        if money:
            ax2.set_ylabel("%"); ax2.grid(False)
        else:
            ax.set_ylabel("%")
        pv = df[pcts].abs().max().max()
        if pv > 300:  # growth off a near-zero base (e.g. +600% YoY) would flatten everything else
            ax2.set_ylim(-150, 300)
            ax.set_title(title + " (trục % cắt ở -150…300)")
    ax.set_xticks(x[:: max(1, len(x) // 9)])
    ax.set_xticklabels(df.index[:: max(1, len(x) // 9)], rotation=45, ha="right")
    if not ax.get_title():
        ax.set_title(title)
    h1, l1 = ax.get_legend_handles_labels()
    if ax2 is not None and ax2 is not ax:
        h2, l2 = ax2.get_legend_handles_labels(); h1 += h2; l1 += l2
    ax.legend(h1, l1, loc="upper left", ncol=2 if len(l1) > 4 else 1, framealpha=0.85)


def repair_profit_performance(frames, labels, quarterly: bool):
    """profitPerformance can come back flat-zero (seen: SSI). Replace it with ROE/ROA computed from profit,
    equity and total assets so the panel is not blank. Frames that carry real numbers are left untouched."""
    pp = frames.get("profitPerformance")
    if pp is None or pp.fillna(0).ne(0).any().any():
        return frames, labels
    get = lambda n, c=None: next((f[n] for k, f in frames.items() if n in f and (c is None or k == c)), None)
    eq, ta = get("equity", "marginLoan") if get("equity", "marginLoan") is not None else get("equity"), get("totalAssets")
    np_ = get("netProfitParentTTM") if quarterly else get("netProfitParent")
    if np_ is None or (eq is None and ta is None):
        return frames, labels
    avg = (lambda s: s.rolling(5, min_periods=5).mean()) if quarterly else (lambda s: s)
    tag = "TTM" if quarterly else ""
    fixed = pd.DataFrame(index=pp.index)
    if eq is not None:
        fixed[f"roe{tag}DerivedPct"] = np_ / avg(eq).replace(0, np.nan) * 100
    if ta is not None:
        fixed[f"roa{tag}DerivedPct"] = np_ / avg(ta).replace(0, np.nan) * 100
    frames = {**frames, "profitPerformance": fixed}
    labels = {**labels, "profitPerformance": "ROE/ROA tự tính (nguồn trả 0)"}
    return frames, labels


def fa_grid(frames, labels, ids, out, name, title, ncols=3):
    ids = [i for i in ids if i in frames]
    if not ids:
        return
    nrows = int(np.ceil(len(ids) / ncols))
    fig, axes = plt.subplots(nrows, ncols, figsize=(6.2 * ncols, 4.0 * nrows), squeeze=False)
    for ax, cid in zip(axes.flat, ids):
        plot_fa(ax, frames[cid], labels.get(cid, cid), cid)
    for ax in axes.flat[len(ids):]:
        ax.axis("off")
    fig.suptitle(title, fontsize=14, fontweight="bold")
    fig.tight_layout()
    save(fig, out, name)


def main(workdir):
    W = Work(workdir)
    sym, st = W.symbol, W.structure
    out = Path(workdir) / "charts"
    px, vn = price_frame(W.load("price")), price_frame(W.load("vnindex"))

    # 01 price + technicals
    if not px.empty:
        c = px["adjClose"]
        ind = pd.DataFrame({"c": c, "ma20": sma(c, 20), "ma50": sma(c, 50), "ma200": sma(c, 200), "rsi": rsi(c)})
        ml, sg, hist = macd(c)
        ind["macd"], ind["sig"], ind["hist"] = ml, sg, hist
        d = ind.iloc[-500:]; p = px.loc[d.index]
        fig, ax = plt.subplots(4, 1, figsize=(14, 11), sharex=True, gridspec_kw={"height_ratios": [3.2, 1.1, 1, 1]})
        ax[0].plot(d.index, d["c"], color=ACC, lw=1.4, label="Giá (điều chỉnh)")
        for k, col in (("ma20", "#f4a261"), ("ma50", "#2a9d8f"), ("ma200", "#e63946")):
            ax[0].plot(d.index, d[k], lw=1.1, color=col, label=k.upper())
        w52 = c.iloc[-252:]
        ax[0].axhline(w52.max(), ls=":", color=GREY, lw=1); ax[0].axhline(w52.min(), ls=":", color=GREY, lw=1)
        ax[0].annotate(f"Đỉnh 52T {w52.max():.2f}", (w52.index[0], w52.max()), fontsize=8, color="#555", va="bottom")
        ax[0].annotate(f"Đáy 52T {w52.min():.2f}", (w52.index[0], w52.min()), fontsize=8, color="#555", va="top")
        ax[0].annotate(f"{c.iloc[-1]:.2f}", (d.index[-1], c.iloc[-1]), fontsize=9, fontweight="bold", color=ACC,
                       xytext=(5, 0), textcoords="offset points")
        ax[0].set_title(f"{sym} — Giá & đường trung bình (nghìn đồng), {d.index[0].date()} → {d.index[-1].date()}")
        ax[0].legend(loc="upper left", ncol=5)
        val = p["totalValue"] / BIL
        ax[1].bar(d.index, val, color=np.where(p["changePct"] >= 0, UP, DOWN), width=1.2, linewidth=0)
        ax[1].plot(d.index, val.rolling(20).mean(), color="black", lw=1, label="TB20")
        ax[1].set_ylabel("GTGD (tỷ)"); ax[1].legend(loc="upper left")
        ax[2].plot(d.index, d["rsi"], color="#6a4c93", lw=1.1)
        ax[2].axhspan(30, 70, color="#6a4c93", alpha=0.06)
        for y in (30, 50, 70):
            ax[2].axhline(y, ls="--" if y != 50 else ":", color=GREY, lw=0.8)
        ax[2].set_ylim(10, 90); ax[2].set_ylabel("RSI14")
        ax[3].bar(d.index, d["hist"], color=np.where(d["hist"] >= 0, UP, DOWN), width=1.0)
        ax[3].plot(d.index, d["macd"], color=ACC, lw=1, label="MACD")
        ax[3].plot(d.index, d["sig"], color="#f4a261", lw=1, label="Signal")
        ax[3].set_ylabel("MACD"); ax[3].legend(loc="upper left")
        ax[3].xaxis.set_major_formatter(mdates.DateFormatter("%m/%y"))
        fig.tight_layout(); save(fig, out, "01_price_technical.png")

    # 02 relative performance + power scores
    fig, ax = plt.subplots(2, 1, figsize=(14, 8))
    if not px.empty and not vn.empty:
        j = pd.concat([px["adjClose"], vn["close"]], axis=1, keys=[sym, "VNINDEX"]).dropna().iloc[-252:]
        n = j / j.iloc[0] * 100
        ax[0].plot(n.index, n[sym], color=ACC, lw=1.6, label=sym)
        ax[0].plot(n.index, n["VNINDEX"], color=GREY, lw=1.4, label="VNINDEX")
        ax[0].fill_between(n.index, n[sym], n["VNINDEX"], where=n[sym] >= n["VNINDEX"], color=UP, alpha=0.15)
        ax[0].fill_between(n.index, n[sym], n["VNINDEX"], where=n[sym] < n["VNINDEX"], color=DOWN, alpha=0.15)
        ax[0].axhline(100, color="#555", lw=0.6)
        ax[0].set_title(f"Hiệu suất 1 năm (gốc 100): {sym} {n[sym].iloc[-1]-100:+.1f}% vs VNINDEX {n['VNINDEX'].iloc[-1]-100:+.1f}%")
        ax[0].legend(loc="upper left")
    for rt, ls in (("rs6", "-"), ("rs3", "--")):
        ps = W.load(f"power_{rt}")
        if ps and ps.get("stock"):
            s = axis_series(ps["stock"]["dates"], ps["stock"]["scores"])
            se = axis_series(ps["sectorPower"]["dates"], ps["sectorPower"]["scores"])
            ax[1].plot(s.index, s, ls=ls, color=ACC, lw=1.3, label=f"{sym} {rt.upper()}")
            ax[1].plot(se.index, se, ls=ls, color="#f4a261", lw=1.1, label=f"Ngành {rt.upper()}")
    ax[1].axhline(50, color="#555", lw=0.6); ax[1].axhline(80, color=UP, lw=0.6, ls=":")
    ax[1].set_ylim(0, 100); ax[1].set_title("Sức mạnh cổ phiếu vs ngành (0-100, xếp hạng toàn thị trường)")
    ax[1].legend(loc="upper left", ncol=4)
    fig.tight_layout(); save(fig, out, "02_relative_strength.png")

    # 03 money flow
    af = flow_frame(W.load("active_flow"))
    if not px.empty:
        d = px.iloc[-250:]
        fig, ax = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
        nf = d["netForeignValue"] / BIL
        ax[0].bar(d.index, nf, color=np.where(nf >= 0, UP, DOWN), width=1.0)
        a0 = ax[0].twinx(); a0.plot(d.index, nf.cumsum(), color="black", lw=1.3); a0.set_ylabel("lũy kế (tỷ)"); a0.grid(False)
        ax[0].set_title(f"Khối ngoại mua/bán ròng (tỷ) — 250 phiên: {nf.sum():+,.0f} tỷ, 20 phiên: {nf.iloc[-20:].sum():+,.0f} tỷ")
        if not af.empty:
            a = (af["net"] / BIL).reindex(d.index)
            ax[1].bar(d.index, a, color=np.where(a >= 0, UP, DOWN), width=1.0)
            a1 = ax[1].twinx(); a1.plot(d.index, a.fillna(0).cumsum(), color="black", lw=1.3); a1.set_ylabel("lũy kế (tỷ)"); a1.grid(False)
            ax[1].set_title(f"Mua - bán chủ động (tỷ) — 20 phiên: {a.iloc[-20:].sum():+,.0f} tỷ, 60 phiên: {a.iloc[-60:].sum():+,.0f} tỷ")
        if "proprietaryTradingValue" in d and d["proprietaryTradingValue"].notna().any():
            pt = d["proprietaryTradingValue"] / BIL
            ax[2].bar(d.index, pt, color=np.where(pt >= 0, UP, DOWN), width=1.0)
            a2 = ax[2].twinx(); a2.plot(d.index, pt.fillna(0).cumsum(), color="black", lw=1.3); a2.set_ylabel("lũy kế (tỷ)"); a2.grid(False)
            ax[2].set_title(f"Tự doanh ròng (tỷ) — 20 phiên: {pt.iloc[-20:].sum():+,.0f} tỷ")
        ax[2].xaxis.set_major_formatter(mdates.DateFormatter("%m/%y"))
        fig.tight_layout(); save(fig, out, "03_money_flow.png")

    # 04/05/06 fundamentals
    fqd, fyd = W.load("fa_q"), W.load("fa_y")
    fq, fy = fa_frames(fqd), fa_frames(fyd)
    labels = (fqd or {}).get("chartLabels", {})
    fq, labels = repair_profit_performance(fq, labels, quarterly=True)
    fy, labels_y = repair_profit_performance(fy, (fyd or {}).get("chartLabels", {}), quarterly=False)
    fa_grid(fq, labels, KEY_CHARTS.get(st, []), out, "04_fa_key.png", f"{sym} — Chỉ tiêu cơ bản chính (theo quý)")
    fa_grid(fq, labels, list(fq.keys()), out, "05_fa_dashboard.png", f"{sym} — Toàn bộ chart phân tích cơ bản (theo quý)", ncols=4)
    fa_grid(fy, labels_y, [c for c in KEY_CHARTS.get(st, []) if not c.startswith("businessResults")], out, "06_fa_annual.png", f"{sym} — Chỉ tiêu cơ bản theo năm")

    # 07 valuation
    v = W.load("valuation_1m")
    if v:
        dates = v["dates"]
        fig, ax = plt.subplots(2, 2, figsize=(15, 9))
        sh = W.load("sector_val_hist") or {}
        sec = pd.DataFrame(sh.get("history", []))
        if len(sec):
            sec["date"] = pd.to_datetime(sec["date"]); sec = sec.set_index("date").sort_index()
        for i, (k, lab) in enumerate((("pe", "P/E"), ("pb", "P/B"))):
            s = axis_series(dates, v["charts"][k][k])
            a3 = axis_series(dates, v["charts"][k][f"avg3Y{k.capitalize()}"])
            sp = s[s > 0]
            med = sp.median()
            cap = sp.quantile(0.95) * 1.3
            s = s.where((s > 0) & (s <= cap))  # loss periods / exploding P/E become gaps, not spikes
            a = ax[0, i]
            a.plot(s.index, s.clip(upper=cap), color=ACC, lw=1.5, label=f"{lab} {sym}")
            a.plot(a3.index, a3.clip(upper=cap), color="#f4a261", lw=1.2, ls="--", label="TB 3 năm (website)")
            a.axhline(med, color=UP, lw=1, label=f"Trung vị 10N {med:.2f}")
            q1, q3 = sp.quantile(0.25), sp.quantile(0.75)
            a.axhspan(q1, q3, color=UP, alpha=0.08, label=f"IQR {q1:.2f}–{q3:.2f}")
            a.set_ylim(0, cap)
            a.set_title(f"{lab} 10 năm — hiện tại {s.dropna().iloc[-1]:.2f}" + (" (bỏ kỳ lỗ / vượt p95×1.3)" if s.isna().any() else ""))
            a.legend(loc="upper left")
            b = ax[1, i]
            b.plot(s.index, s.clip(upper=cap), color=ACC, lw=1.5, label=f"{lab} {sym}")
            if len(sec):
                b.plot(sec.index, sec[k].where((sec[k] > 0) & (sec[k] <= cap)), color="#e76f51", lw=1.3, label=f"{lab} ngành {sh.get('sectorName','')}")
            mvd = W.load("market_val")
            if mvd:
                b.plot(axis_series(mvd["dates"], mvd["series"][k]), color=GREY, lw=1.2, label=f"{lab} VNINDEX")
            b.set_ylim(0, cap); b.set_title(f"{lab}: cổ phiếu vs ngành vs thị trường"); b.legend(loc="upper left")
        fig.tight_layout(); save(fig, out, "07_valuation.png")

    # 08 RRG: sectors + peers
    srrg = (W.load("sector_rrg") or {}).get("sectors", [])
    peers = (W.load("peers_rrg") or {}).get("stocks", [])
    srow = next(iter((W.load("stock_rrg") or {}).get("stocks", [])), None)
    if srrg:
        fig, ax = plt.subplots(1, 2, figsize=(16, 7.5))
        sid = W.manifest.get("sectorId")
        for a in ax:
            a.axhline(50, color="#555", lw=0.7); a.axvline(50, color="#555", lw=0.7)
            a.set_xlim(0, 100); a.set_ylim(0, 100); a.set_xlabel("RS6 (dài hạn)"); a.set_ylabel("RS3 (động lượng)")
            for (x, y, t) in ((97, 97, "LEADING"), (3, 97, "IMPROVING"), (97, 3, "WEAKENING"), (3, 3, "LAGGING")):
                a.text(x, y, t, ha="right" if x > 50 else "left", va="top" if y > 50 else "bottom", fontsize=9, color=GREY, fontweight="bold")
        for s in srrg:
            hl = s["sectorId"] == sid
            ax[0].scatter(s["rs6"], s["rs3"], s=60 + (s.get("gtgd20") or 0) / 2e10, color=QCOL.get(s["quadrant"], GREY),
                          alpha=0.95 if hl else 0.45, edgecolor="black" if hl else "white", lw=1.6 if hl else 0.5, zorder=3 if hl else 2)
            ax[0].annotate(s["sectorName"], (s["rs6"], s["rs3"]), fontsize=7 if not hl else 9,
                           fontweight="bold" if hl else None, xytext=(3, 3), textcoords="offset points")
            if hl and s.get("tail"):
                t = pd.DataFrame(s["tail"]).sort_values("weeksAgo", ascending=False)
                ax[0].plot(t["rs6"], t["rs3"], color="black", lw=1, marker=".", alpha=0.7)
        ax[0].set_title(f"RRG ngành ({len(srrg)} ngành) — đường đen: quỹ đạo ngành của {sym}")
        for s in peers:
            me = s["symbol"] == W.symbol
            ax[1].scatter(s["rs6"], s["rs3"], s=50 + (s.get("gtgdAvg20") or 0) / 2e9, color=QCOL.get(s["quadrant"], GREY),
                          edgecolor="black" if me else "white", lw=1.8 if me else 0.5, alpha=0.9, zorder=3)
            ax[1].annotate(s["symbol"], (s["rs6"], s["rs3"]), fontsize=8 if not me else 10, fontweight="bold" if me else None,
                           xytext=(4, 3), textcoords="offset points")
        if srow and srow.get("tail"):
            t = pd.DataFrame(srow["tail"]).sort_values("weeksAgo", ascending=False)
            ax[1].plot(t["rs6"], t["rs3"], color="black", lw=1, marker=".", alpha=0.7, label=f"Quỹ đạo {W.symbol}")
            ax[1].legend(loc="lower right")
        ax[1].set_title(f"RRG cổ phiếu cùng ngành (bubble = GTGD20)")
        fig.tight_layout(); save(fig, out, "08_rrg.png")

    # 09 market context
    ms = W.load("market_state") or {}
    sent, dif = W.load("market_sentiment") or {}, W.load("money_diffusion") or {}
    if not vn.empty:
        fig, ax = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
        d = vn.iloc[-250:]
        ax[0].plot(d.index, d["close"], color=ACC, lw=1.4)
        rec = pd.DataFrame(ms.get("recent", []))
        if len(rec):
            rec["date"] = pd.to_datetime(rec["date"]); rec = rec.set_index("date").sort_index()
            colors = {"uptrend": UP, "pressure": "#f4a261", "downtrend": DOWN}
            seg = (rec["state"] != rec["state"].shift()).cumsum()
            ends = list(rec.index[1:]) + [rec.index[-1] + pd.Timedelta(days=1)]
            rec["end"] = ends
            for _, g in rec.groupby(seg):
                ax[0].axvspan(g.index[0], g["end"].iloc[-1], color=colors.get(g["state"].iloc[0], GREY), alpha=0.18, lw=0)
            from matplotlib.patches import Patch
            ax[0].legend(handles=[Patch(color=c, alpha=0.3, label=k) for k, c in colors.items()], loc="upper left")
        cur = ms.get("current", {})
        ax[0].set_title(f"VNINDEX & trạng thái thị trường — hiện tại: {cur.get('state')} ({cur.get('daysInCurrent')} phiên, tin cậy {cur.get('confidenceScore')})")
        if sent.get("series"):
            s = sent["series"]
            for k, lab, col in (("shortTerm", "Ngắn hạn", "#457b9d"), ("midTerm", "Trung hạn", "#1d3557")):
                ax[1].plot(pd.to_datetime(s["dates"]), s[k]["score"], label=lab, color=col, lw=1.2)
            for y in (20, 40, 60, 80):
                ax[1].axhline(y, color=GREY, lw=0.5, ls=":")
            ax[1].set_ylim(0, 100); ax[1].legend(loc="upper left"); ax[1].set_title("Tâm lý thị trường (0-100)")
        if dif.get("series"):
            s = dif["series"]
            for k, lab, col in (("smallCap", "Vốn hóa nhỏ", "#f4a261"), ("midCap", "Vốn hóa vừa", "#2a9d8f"), ("largeCap", "Vốn hóa lớn", "#264653")):
                ax[2].plot(pd.to_datetime(s["dates"]), s[k]["score"], label=lab, color=col, lw=1.1)
            ax[2].set_ylim(0, 100); ax[2].legend(loc="upper left"); ax[2].set_title("Dòng tiền lan tỏa theo nhóm vốn hóa (0-100)")
        ax[2].xaxis.set_major_formatter(mdates.DateFormatter("%m/%y"))
        fig.tight_layout(); save(fig, out, "09_market.png")


if __name__ == "__main__":
    main(sys.argv[1])
