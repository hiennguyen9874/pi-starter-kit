"""Compute metrics, scorecard and markdown tables for one fetched ticker.

usage: uv run --with pandas --with numpy python analyze.py <workdir>
writes: <workdir>/metrics.json, <workdir>/tables.md
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from sstock_lib import (BIL, Work, atr, axis_series, benchmark_prices, bogus_annual_ttm, clean, complete_window_sum, fa_frames, fa_series, flow_frame, fmt,
                        fmt_signed, macd, max_drawdown, pct_change, percentile_of, price_frame, ret, rsi, sma,
                        valuation_at_close, valuation_series, ytd)

from nonfinancial_quality import cash_and_earnings
from cashflow_checks import LABELS as CASH_LABELS, evidence_bridge, fiscal_crosscheck, reconcile_cash
from cross_checks import book_basis_check, sector_fundamentals

# KPI spec per report structure: (key, series name, preferred chart, kind, better)
#   kind: "bil" (tỷ đồng, YoY computed) | "pct" (%, change in pp) ; better: "up" | "down" | None
KPI = {
    "nonfinancial": [
        ("Doanh thu thuần (Q)", "netRevenue", "businessResultQuarter", "bil", "up"),
        ("LNST cty mẹ (Q)", "netProfitParent", "businessResultQuarter", "bil", "up"),
        ("Doanh thu TTM", "netRevenueTTM", "businessResults4Q", "bil", "up"),
        ("LNST TTM", "netProfitParentTTM", "businessResults4Q", "bil", "up"),
        ("Biên gộp (Q)", "grossMarginPct", "profitMargin", "pct", "up"),
        ("Biên gộp TTM", "grossMarginTTMPct", "profitMargin", "pct", "up"),
        ("Biên ròng TTM", "netMarginTTMPct", "profitMargin", "pct", "up"),
        ("ROE TTM", "roeTTMPct", "profitPerformance", "pct", "up"),
        ("ROA TTM", "roaTTMPct", "profitPerformance", "pct", "up"),
        ("EBITDA (Q)", "ebitda", "ebitda", "bil", "up"),
        ("Nợ vay", "debt", "capital", "bil", "down"),
        ("Nợ vay/Tổng nguồn vốn", "debtOverTotalCapitalPct", "capital", "pct", "down"),
        ("Tiền & tiền gửi (cashBank)", "cashBank", "asset", "bil", None),  # gồm tiền gửi có kỳ hạn, xem cash_gap_event
        ("Hàng tồn kho", "inventory", "asset", "bil", None),
        ("Tồn kho/Tổng TS", "inventoryOverTotalAssetsPct", "inventory", "pct", None),
        ("XDCB dở dang", "constructionWip", "asset", "bil", None),
        # backlog: tiền khách đã trả, chưa ghi nhận doanh thu (BĐS, KCN, xây dựng); appropriatedDebt gồm cả phải trả khác
        ("Người mua trả trước NH", "buyerAdvancesShort", "inventory", "bil", None),
        ("Nợ chiếm dụng", "appropriatedDebt", "capital", "bil", None),
        ("LCTT HĐKD (Q)", "operating", "cashFlow", "bil", "up"),
        ("LCTT HĐĐT (Q)", "investing", "cashFlow", "bil", None),
    ],
    "bank": [
        ("Tổng TN hoạt động (Q)", "totalOperatingIncome", "businessResultQuarter", "bil", "up"),
        ("LNST cty mẹ (Q)", "netProfitParent", "businessResultQuarter", "bil", "up"),
        ("TOI TTM", "totalOperatingIncomeTTM", "businessResults", "bil", "up"),
        ("LNST TTM", "netProfitParentTTM", "businessResults", "bil", "up"),
        ("Thu nhập lãi thuần (Q)", "netInterestIncome", "profitStructure", "bil", "up"),
        ("Thu nhập dịch vụ (Q)", "serviceIncome", "profitStructure", "bil", "up"),
        ("LN trước dự phòng (Q)", "profitBeforeProvision", "profitStructure", "bil", "up"),
        ("Chi phí dự phòng (Q)", "creditProvisionExpense", "costStructure", "bil", "down"),
        ("NIM", "nimPct", "profitability", "pct", "up"),
        ("YEA", "yeaPct", "profitability", "pct", None),
        ("COF", "cofPct", "profitability", "pct", "down"),
        ("CIR", "cirPct", "costStructure", "pct", "down"),
        ("NPL (nợ xấu)", "nplPct", "rateBadDebt", "pct", "down"),
        ("Nợ nhóm 2", "npl2Pct", "rateBadDebt", "pct", "down"),
        ("LLR (bao phủ nợ xấu)", "llrPct", "rateBadDebt", "pct", "up"),
        ("CASA", "casaPct", "depositStructure", "pct", "up"),
        ("Tiền gửi khách hàng", "customerDeposits", "capital", "bil", "up"),
        ("LDR", "ldrPct", "loanStructure", "pct", None),
        ("Tăng trưởng tín dụng", "creditGrowthPct", "asset", "pct", "up"),
        ("Tăng trưởng huy động", "depositGrowthPct", "capital", "pct", "up"),
        ("ROE TTM", "roeTTMPct", "profitPerformance", "pct", "up"),
        ("ROA TTM", "roaTTMPct", "profitPerformance", "pct", "up"),
        ("Cho vay khách hàng", "customerLoans", "asset", "bil", "up"),
    ],
    "securities": [
        ("Doanh thu hoạt động (Q)", "operatingRevenue", "businessResultQuarter", "bil", "up"),
        ("LNST cty mẹ (Q)", "netProfitParent", "businessResultQuarter", "bil", "up"),
        ("Doanh thu TTM", "operatingRevenueTTM", "businessResults", "bil", "up"),
        ("LNST TTM", "netProfitParentTTM", "businessResults", "bil", "up"),
        ("Dư nợ margin", "marginBalance", "marginLoan", "bil", None),
        ("Margin/VCSH", "marginOverEquityPct", "marginLoan", "pct", None),
        ("Doanh thu môi giới (Q)", "brokerageRevenue", "brokerageSegment", "bil", "up"),
        ("Biên gộp môi giới", "brokerageGrossMarginPct", "brokerageSegment", "pct", "up"),
        ("NIM margin", "nimPct", "marginNim", "pct", "up"),
        ("YEA margin", "yeaPct", "marginNim", "pct", None),
        ("COF", "cofPct", "marginNim", "pct", "down"),
        ("LN mảng cho vay (Q)", "loansSegment", "profitStructure", "bil", "up"),
        ("LN mảng môi giới (Q)", "brokerageSegment", "profitStructure", "bil", "up"),
        ("LN mảng FVTPL (Q)", "fvtplSegment", "profitStructure", "bil", None),
        ("LN mảng HTM (Q)", "htmSegment", "profitStructure", "bil", None),
        ("Tự doanh/Tổng TS", "proprietaryOverTotalAssetsPct", "asset", "pct", None),
        ("FVTPL cổ phiếu niêm yết", "listedEquity", "fvtplBreakdown", "bil", None),
        ("FVTPL trái phiếu", "bonds", "fvtplBreakdown", "bil", None),
        ("NAV khách hàng", "investorNav", "manageNav", "bil", None),
        ("VCSH", "equity", "marginLoan", "bil", None),
        ("Vốn góp", "contributedCapital", "capital", "bil", None),
        ("Nợ/Tổng nguồn vốn", "debtOverTotalCapitalPct", "capital", "pct", "down"),
        ("ROE TTM", "roeTTMPct", "profitPerformance", "pct", "up"),
        ("ROA TTM", "roaTTMPct", "profitPerformance", "pct", "up"),
        ("Tổng tài sản", "totalAssets", "asset", "bil", None),
    ],
    "insurance": [
        ("Doanh thu thuần (Q)", "netRevenue", "businessResultQuarter", "bil", "up"),
        ("LNST cty mẹ (Q)", "netProfitParent", "businessResultQuarter", "bil", "up"),
        ("Doanh thu TTM", "netRevenueTTM", "businessResults", "bil", "up"),
        ("LNST TTM", "netProfitParentTTM", "businessResults", "bil", "up"),
        ("LN bảo hiểm (Q)", "insuranceProfit", "profitStructure", "bil", "up"),
        ("LN tài chính (Q)", "financialProfit", "profitStructure", "bil", None),
        ("Tỷ lệ bồi thường", "lossRatioPct", "costRatio", "pct", "down"),
        ("Tỷ lệ chi phí", "expenseRatioPct", "costRatio", "pct", "down"),
        ("Combined ratio", "combinedRatioPct", "costRatio", "pct", "down"),
        ("Biên ròng TTM", "netMarginTTMPct", "profitMargin", "pct", "up"),
        ("Đầu tư TC/Tổng TS", "finInvestOverTotalAssetsPct", "asset", "pct", None),
        ("ROE TTM", "roeTTMPct", "profitPerformance", "pct", "up"),
        ("ROA TTM", "roaTTMPct", "profitPerformance", "pct", "up"),
    ],
}
# Annual table rows (series names; first match across charts)
ANNUAL = {
    "nonfinancial": ["netRevenue", "netProfitParent", "grossMarginPct", "netMarginPct", "roePct", "debt", "operating"],
    "bank": ["totalOperatingIncome", "netProfitParent", "nimPct", "nplPct", "cirPct", "roePct", "customerLoans"],
    "securities": ["operatingRevenue", "netProfitParent", "loansSegment", "brokerageSegment", "fvtplSegment",
                   "marginBalance", "equity", "contributedCapital", "totalAssets"],
    "insurance": ["netRevenue", "netProfitParent", "combinedRatioPct", "roePct", "totalAssets"],
}
SERIES_VI = {k[1]: k[0] for v in KPI.values() for k in v}
SERIES_VI.update({"roePct": "ROE", "grossMarginPct": "Biên gộp", "netMarginPct": "Biên ròng", "nimPct": "NIM",
                  "nplPct": "NPL", "cirPct": "CIR", "netRevenue": "Doanh thu thuần", "netProfitParent": "LNST cty mẹ",
                  "totalOperatingIncome": "Tổng TN hoạt động", "operatingRevenue": "Doanh thu hoạt động",
                  "operating": "LCTT HĐKD", "debt": "Nợ vay", "totalAssets": "Tổng tài sản",
                  "loansSegment": "LN mảng cho vay", "brokerageSegment": "LN mảng môi giới", "fvtplSegment": "LN mảng FVTPL",
                  "roeDerivedPct": "ROE (LNST/VCSH cuối kỳ, tự tính)",
                  "profitBeforeProvision": "LN trước dự phòng", "creditProvisionExpense": "Chi phí dự phòng"})


def kpi_block(frames, structure):
    rows = []
    for label, name, chart, kind, better in KPI.get(structure, []):
        s = fa_series(frames, name, chart)
        if s is None or s.dropna().empty:
            continue
        cur = s.iloc[-1]
        prev = s.iloc[-2] if len(s) > 1 else np.nan
        yoy_base = s.iloc[-5] if len(s) > 4 else np.nan
        if kind == "bil":
            qoq, yoy = pct_change(cur, prev), pct_change(cur, yoy_base)
        else:
            qoq = None if np.isnan(prev) or np.isnan(cur) else cur - prev
            yoy = None if np.isnan(yoy_base) or np.isnan(cur) else cur - yoy_base
        tail = s.iloc[-8:].dropna()
        suspect = bool(len(tail) >= 4 and (tail == 0).all())  # server returned a flat-zero series (seen: SSI ROE)
        rows.append({"label": label, "series": name, "kind": kind, "better": better, "period": s.index[-1], "suspect": suspect,
                     "value": cur, "qoq": qoq, "yoy": yoy, "last8": s.iloc[-8:].round(2).tolist(),
                     "last8_periods": list(s.index[-8:])})
    return rows


def derived_fa(frames, structure):
    d = {}
    if structure == "nonfinancial":
        get = lambda n, c=None: fa_series(frames, n, c)
        debt, cash = get("debt", "capital"), get("cashBank", "asset")
        eq = None
        if get("charterCapital") is not None and get("surplusRetainedFunds") is not None:
            eq = get("charterCapital") + get("surplusRetainedFunds")
        if debt is not None and cash is not None:
            nd = debt - cash
            d["netDebt"] = nd.iloc[-1]
            if eq is not None:
                d["netDebtToEquityPct"] = (nd / eq.where(eq > 0) * 100).iloc[-1]
        if eq is not None:
            d["equityApprox"] = eq.iloc[-1]
        if frames:
            latest_period = next(iter(frames.values())).index[-1]
            d.update(cash_and_earnings(frames, latest_period))
    ttm_name = {"nonfinancial": "netProfitParentTTM"}.get(structure, "netProfitParentTTM")
    s = fa_series(frames, ttm_name)
    if s is not None and len(s.dropna()) > 4:
        d["netProfitTTMYoYPct"] = pct_change(s.iloc[-1], s.iloc[-5])
    if s is not None and len(s.dropna()) > 1:  # TTM rolling over while YoY is still positive = peak/high-base warning
        d["netProfitTTMQoQPct"] = pct_change(s.iloc[-1], s.iloc[-2])
    if structure == "securities":
        # profitPerformance ROE/ROA can come back flat-zero (SSI) -> cross-check ROE from TTM profit / avg equity
        eq, cap, mb = fa_series(frames, "equity", "marginLoan"), fa_series(frames, "contributedCapital", "capital"), \
            fa_series(frames, "marginBalance", "marginLoan")
        if s is not None and eq is not None and len(eq.dropna()) >= 5:
            d["roeTTMDerivedPct"] = s.iloc[-1] / eq.iloc[-5:].mean() * 100
        if cap is not None and len(cap.dropna()) > 4:
            d["contributedCapitalYoYPct"] = pct_change(cap.iloc[-1], cap.iloc[-5])  # >0 = dilution, see references/securities.md
        if eq is not None and mb is not None:
            d["marginHeadroomBil"] = 2 * eq.iloc[-1] - mb.iloc[-1]  # room to the 200% Margin/VCSH legal cap
        # profitStructure segments are gross results; interest on borrowings, admin cost and tax sit outside them
        # (CTS 2026Q3: segments 189 vs LNST 5). The gap = what the segments must cover before profit shows up.
        ps, npq = frames.get("profitStructure"), fa_series(frames, "netProfitParent")
        if ps is not None and npq is not None:
            segs = ps[[c for c in ps.columns if c != "netProfitParent"]].sum(axis=1, min_count=1)
            gap = (segs - npq).dropna()
            if len(gap) >= 4:
                d["segmentProfitSumQ"] = segs[gap.index[-1]]
                d["unallocatedCostQ"] = gap.iloc[-1]
                d["unallocatedCostTTM"] = gap.iloc[-4:].sum()
                if len(gap) >= 5:
                    d["unallocatedCostQYoYPct"] = pct_change(gap.iloc[-1], gap.iloc[-5])
    if structure == "bank":
        # Interbank reliance: gross interbankFunding overstates the funding gap when the bank parks the same money at
        # other CIs (TPB 2026Q3: +27,267 vs +25,627), so report the share and the net position side by side.
        ib, tc = fa_series(frames, "interbankFunding", "capital"), fa_series(frames, "totalCapital", "capital")
        dep_ci = fa_series(frames, "depositsLoansToOtherCIs", "asset")
        if ib is not None and tc is not None:
            sh = (ib / tc.where(tc > 0) * 100).replace([np.inf, -np.inf], np.nan)
            if len(sh) and pd.notna(sh.iloc[-1]):
                d["interbankFundingSharePct"] = sh.iloc[-1]
                if len(sh) >= 5 and pd.notna(sh.iloc[-5]):
                    d["interbankFundingShareChg4Qpp"] = sh.iloc[-1] - sh.iloc[-5]
            if dep_ci is not None:
                net = ib - dep_ci
                if len(net) and pd.notna(net.iloc[-1]):
                    d["netInterbankBil"] = net.iloc[-1]  # >0 = net borrower; maturities/currencies may differ
    rev = next((fa_series(frames, n) for n in ("netRevenueTTM", "totalOperatingIncomeTTM", "operatingRevenueTTM")
                if fa_series(frames, n) is not None), None)
    if rev is not None and len(rev.dropna()) > 4:
        d["revenueTTMYoYPct"] = pct_change(rev.iloc[-1], rev.iloc[-5])
    return d


def ytd_cumulative(frames, structure=None):
    """Year-to-date sums vs the same quarters a year earlier. Lumpy recognisers (KCN land leases, BĐS handovers)
    swing ±50% per quarter, so 9T/26 vs 9T/25 is the fairer growth read than the single-quarter YoY."""
    out = {}
    names = ("netRevenue", "totalOperatingIncome", "operatingRevenue", "netProfitParent")
    if structure == "bank":
        names += ("profitBeforeProvision", "creditProvisionExpense")
    for name in names:
        s = fa_series(frames, name)
        if s is None or s.dropna().empty or "Q" not in str(s.index[-1]):
            continue
        y, q = int(s.index[-1][:4]), int(s.index[-1][-1])
        cur, prev = [f"{y}Q{i}" for i in range(1, q + 1)], [f"{y - 1}Q{i}" for i in range(1, q + 1)]
        if q < 2 or not all(p in s.index for p in cur + prev) or s[cur + prev].isna().any():
            continue
        out[name] = {"label": f"{3 * q}T/{y}", "value": s[cur].sum(), "prev": s[prev].sum(),
                     "yoyPct": pct_change(s[cur].sum(), s[prev].sum())}
    return out


ASSET_VI = {"cashBank": "Tiền", "receivables": "Phải thu", "inventory": "Hàng tồn kho", "fixedAssets": "TSCĐ",
            "constructionWip": "XDCB dở dang", "finInvest": "Đầu tư TC", "otherAssets": "Tài sản khác"}


def _quarter(date_str: str) -> str:
    y, m = int(date_str[:4]), int(date_str[5:7])
    return f"{y}Q{(m - 1) // 3 + 1}"


def _prev_quarter(per: str) -> str:
    y, q = int(per[:4]), int(per[-1])
    return f"{y - 1}Q4" if q == 1 else f"{y}Q{q - 1}"


def reclass_events(a, periods, tag=""):
    """Flag coincident asset moves; similar magnitude does not prove a transfer."""
    ev = []
    if a is None or "totalAssets" not in a:
        return ev
    d = a[[c for c in ASSET_VI if c in a]].diff()
    for per in periods:
        ta = a["totalAssets"].shift(1).get(per)
        if per not in d.index or not ta or pd.isna(ta):
            continue
        row = d.loc[per]
        for dec, dv in row[row < -0.05 * ta].items():
            pair = row[(row >= 0.7 * -dv) & (row <= 1.3 * -dv)]
            for inc, iv in pair.items():
                ev.append(f"{per}{tag}: {ASSET_VI[dec]} {dv:+,.0f} ↔ {ASSET_VI[inc]} {iv:+,.0f} tỷ "
                          f"(biến động đồng thời, chưa xác nhận luồng chuyển)")
            split = row[row >= 0.3 * -dv]  # one source into several lines (SZC 2022: XDCB -2,156 -> tồn kho +1,337, TS khác +1,143)
            if pair.empty and len(split) >= 2 and 0.7 * -dv <= split.sum() <= 1.5 * -dv:
                parts = " + ".join(f"{ASSET_VI[i]} {v:+,.0f}" for i, v in split.items())
                ev.append(f"{per}{tag}: {ASSET_VI[dec]} {dv:+,.0f} ↔ {parts} tỷ (nhiều khoản biến động đồng thời, chưa xác nhận luồng chuyển)")
    return ev


def annual_reclass_events(fy, quarters):
    """Nonfinancial. Reclassifications in years the quarterly window does not fully cover (17 quarters reach back ~4
    years; fa_y goes to 2018). SZC 2022: XDCB 4,856 -> 2,699 while tồn kho 7 -> 1,343, i.e. the KCN infrastructure
    moved to saleable stock before the quarterly data starts, which is why tồn kho/TTS looks structurally high."""
    a = fy.get("asset") if fy else None
    if a is None:
        return []
    qs = set(quarters or [])
    years = [y for y in a.index if not (f"{int(y) - 1}Q4" in qs and f"{y}Q4" in qs)]
    return reclass_events(a, years, tag=" (năm)")


def _rights_issue(action, per, rise, dcap, financing):
    """A capital rise whose ex-right factor is well below the rise (k-1 < 0.8×rise) with a financing inflow covering
    half the new par value is a screening clue, not evidence of proceeds (may be borrowing or ESOP). TERP identity
    P/k = (P + r·S)/(1+r)  =>  S = (P(1+r)/k − P)/r  (SZC 2024-01-05: k 1.219, r 48.7%, P 43.2 -> S ≈ 19.5)."""
    k, P = action.get("factor"), action.get("prev_close")
    if (dcap <= 0 or not k or not P or _quarter(action["date"]) not in (per, _prev_quarter(per))
            or (k - 1) >= 0.8 * rise or financing is None or pd.isna(financing) or financing < 0.5 * dcap):
        return None
    S = (P * (1 + rise) / k - P) / rise
    if not 0 < S < P:
        return None
    return (f"giả thuyết quyền mua ~{rise * 100:.0f}% giá mô hình ~{S:.1f} nghìn đ/cp (LCTT tài chính quý {financing:+,.0f} tỷ) "
            "— chỉ là mô hình TERP, cần công bố để phân biệt quyền mua và ESOP")


def balance_sheet_events(frames, n=8, actions=None, structure="nonfinancial"):
    """Flag coincident asset and capital changes; neither proves a transaction type.

    Run only capital checks for financial structures. Linking a price factor to a change in
    shares suggests a hypothesis for the relevant notice, not a confirmed right.
    """
    ev = []
    a = frames.get("asset")
    if structure == "nonfinancial":
        ev += reclass_events(a, list(a.index[-n:]) if a is not None else [])
    cap_name, cap_vi = ("contributedCapital", "Vốn góp") if structure == "securities" else ("charterCapital", "Vốn điều lệ")
    cap = fa_series(frames, cap_name, "capital")
    sur = fa_series(frames, "surplusRetainedFunds", "capital")
    npq = fa_series(frames, "netProfitParent")
    fin = fa_series(frames, "financing", "cashFlow")
    if cap is not None:
        dc = cap.diff()
        # capital lines scan every quarter on file, not just n: rare, and they explain ex-right events up to 3 years back
        # (SZC 2024-01-05 sat 11 quarters back, so the factor-only label "CP thưởng" stood uncorrected)
        for per in cap.index[1:]:
            if not pd.notna(dc.get(per)) or abs(dc[per]) < 0.005 * cap.shift(1)[per]:
                continue
            msg = f"{per}: {cap_vi} {cap.shift(1)[per]:,.0f} → {cap[per]:,.0f} tỷ ({pct_change(cap[per], cap.shift(1)[per]):+.1f}%)"
            from_lngpp = False
            if sur is not None and npq is not None and pd.notna(sur.diff().get(per)) and pd.notna(npq.get(per)):
                moved = npq[per] - sur.diff()[per]  # profit that left retained earnings this quarter
                from_lngpp = bool(dc[per] > 0 and abs(moved - dc[per]) <= 0.3 * abs(dc[per]))
                hint = ("tương thích vốn hóa LNGPP; kiểm tra cổ tức CP/thưởng" if from_lngpp
                        else "chưa rõ nguyên nhân giảm vốn" if dc[per] < 0
                        else "chưa khớp chuyển từ LNGPP; cần thuyết minh vốn")
                msg += f"; LNST quý {npq[per]:,.0f}, Δquỹ&LNGPP {sur.diff()[per]:+,.0f} → {hint} (cần tin DN)"
            rise = dc[per] / cap.shift(1)[per]
            near = [a for a in actions or [] if dc[per] > 0 and _quarter(a["date"]) in (per, _prev_quarter(per))]
            bonus = next((a for a in near if abs((a["factor"] - 1) - rise) <= max(0.25 * rise, 0.01)), None)
            if bonus:
                msg += (f"; khớp sự kiện quyền {bonus['date']} hệ số {bonus['factor']:.3f} → CP thưởng/cổ tức CP "
                        f"~{rise * 100:.0f}% là giả thuyết (cần công bố quyền)")
                # The capital change strengthens the hypothesis; a separate corporate notice settles the type.
                bonus["kind"] = f"gợi ý cổ tức CP/thưởng ~{rise * 100:.0f}% (tương thích {cap_vi.lower()} {per})"
            elif not from_lngpp:  # a rise funded from LNGPP is never a rights issue (HPG 2026Q3: +10% bonus, debt-funded inflow)
                for a in near:
                    rights = _rights_issue(a, per, rise, dc[per], fin.get(per) if fin is not None else None)
                    if rights:
                        msg += f"; khớp sự kiện quyền {a['date']} hệ số {a['factor']:.3f} → {rights}"
                        a["kind"] = f"{rights} (khớp {cap_vi.lower()} {per})"
                        break
            ev.append(msg)
    if structure == "nonfinancial":  # bank_events already carries the minority lines
        ev += minority_events(frames)
    return sorted(ev)  # "YYYYQn: ..." sorts chronologically


def minority_events(frames, n=8):
    """Material minority-interest movements warrant a reconciliation, not an ownership inference."""
    ev = []
    mi, tc = fa_series(frames, "minorityInterest", "capital"), fa_series(frames, "totalCapital", "capital")
    if mi is not None and tc is not None:
        for i in range(max(1, len(mi) - n), len(mi)):
            a, b = mi.iloc[i - 1], mi.iloc[i]
            if pd.notna(a) and pd.notna(b) and a > 0 and abs(b - a) / a >= 0.3 and abs(b - a) >= 0.003 * tc.iloc[i]:
                ev.append(f"{mi.index[i]}: lợi ích CĐ thiểu số {a:,.0f}→{b:,.0f} tỷ — đối chiếu kết quả, vốn và thay đổi sở hữu tại công ty con; cần thuyết minh")
    return ev


def cash_gap_event(frames, investing_ttm, investing_source):
    """Flag a cash classification gap; only cite investing TTM after reconciliation."""
    g = lambda n, c=None: fa_series(frames, n, c)
    cb, ce, ta = g("cashBank", "asset"), g("cashEndOfPeriod", "cashFlow"), g("totalAssets", "asset")
    if cb is None or ce is None or ta is None or not (pd.notna(cb.iloc[-1]) and pd.notna(ce.iloc[-1])):
        return []
    per, gap = cb.index[-1], cb.iloc[-1] - ce.iloc[-1]
    if gap < 0.3 * cb.iloc[-1] or gap < 0.05 * ta.iloc[-1]:
        return []
    msg = (f"{per}: cashBank {cb.iloc[-1]:,.0f} vs tiền cuối kỳ LCTT {ce.iloc[-1]:,.0f} tỷ → chênh ~{gap:,.0f} tỷ, "
           "có thể gồm tiền gửi có kỳ hạn/đầu tư ngắn hạn; đối chiếu thuyết minh")
    fixed = [s for s in (g("fixedAssets", "asset"), g("constructionWip", "asset")) if s is not None]
    if fixed and all(len(s) >= 5 and np.isfinite(s.iloc[[-5, -1]]).all() for s in fixed):
        dfix = sum(s.iloc[-1] - s.iloc[-5] for s in fixed)
        msg += f"; Δ(TSCĐ+XDCB) 4Q {dfix:+,.0f} tỷ"
    if investing_ttm is not None:
        source = "BCTC gốc" if investing_source == "company_ytd" else "SSTOCK quý"
        msg += f"; LCTT đầu tư 4Q {clean(investing_ttm, 3):+,.2f} tỷ ({source}); đối chiếu phạm vi và capex thực tế"
    return [msg]


def corporate_actions(px: pd.DataFrame) -> list[dict]:
    """Ex-right sessions: close/adjClose steps down on the first ex-date (adjClose is back-adjusted).
    factor = price adjustment ratio. A large uncorroborated factor is unclassified;
    small factors suggest possible cash dividends or small stock entitlements. A 5% stock dividend prints 1.0499x (like 10% -> 1.0999x),
    so the cash cut sits at 1.0495; balance_sheet_events relabels any factor that matches a charter-capital rise, and a
    factor well below the rise with a financing inflow as a rights issue (SZC 2024-01-05: 1.219 is not a bonus). A hint for the report, confirm with company news."""
    if px.empty or "adjClose" not in px or "close" not in px:
        return []
    r = (px["close"] / px["adjClose"]).replace([np.inf, -np.inf], np.nan).dropna()
    f = r.shift(1) / r
    ev = []
    for d, k in f[f > 1.003].items():
        prev = float(px["close"].shift(1)[d])
        cash = f" ~{prev * (1 - 1 / k) * 1000:,.0f} đ/cp"  # dividend implied by the factor: P_prev × (1 − 1/k)
        kind = ("chưa phân loại; hệ số lớn, đối chiếu vốn và thông báo GDKHQ" if k >= 1.0995  # 10% bonus prints 1.0999x
                else "gợi ý cổ tức tiền" + cash if k < 1.0495 else f"cổ tức tiền lớn ({cash.strip()}) hoặc CP thưởng nhỏ")
        ev.append({"date": str(d.date()), "factor": float(k), "prev_close": prev,
                   "close": float(px["close"][d]), "kind": kind})
    return ev


BANK_GROUPS = {"watchLoans": "nhóm 2", "substandardLoans": "nhóm 3", "doubtfulLoans": "nhóm 4", "lossLoans": "nhóm 5"}
BANK_FUNDING_VI = {"valuablePapers": "giấy tờ có giá", "interbankFunding": "liên ngân hàng", "govAndSbvDebt": "vay CP/NHNN"}


def bank_events(frames, n=4):
    """Bank only. Lines the agent must explain in step 3 (see references/banking.md):
    loan-group migration, NPL up while provision expense down YoY, LLR drops, loans funded outside customer deposits,
    QoQ profit carried by a provision cut, one-off otherIncome, loss loans rising 3+ quarters, NPL cut via VAMC sale,
    deposit run-off / CASA drop, minority-interest jumps (subsidiary stake sale/IPO). Returns (events, data-quality notes)."""
    ev, dq = [], []
    g = lambda name, c=None: fa_series(frames, name, c)
    loans, q = g("totalLoans", "loanStructure"), frames.get("loanStructureByQuality")
    if q is not None and loans is not None:
        cols = [c for c in BANK_GROUPS if c in q]
        for i in range(max(1, len(q) - n), len(q)):
            per, moves = q.index[i], []
            for c in cols:
                a, b = q[c].iloc[i - 1], q[c].iloc[i]
                if pd.notna(a) and pd.notna(b) and a > 0 and (b - a) / a >= 0.3 and (b - a) >= 0.001 * loans.get(per, np.inf):
                    moves.append(f"{BANK_GROUPS[c]} {a:,.0f}→{b:,.0f} ({pct_change(b, a):+.0f}%)")
            if moves:
                ev.append(f"{per}: nợ xấu đi theo nhóm — " + "; ".join(moves) + " tỷ")
        if "standardLoans" in q and "standardRatioPct" in q:
            cls, tl = q[["standardLoans"] + cols].iloc[-1].sum(), loans.iloc[-1]
            if tl and cls and cls / tl < 0.97:
                dq.append(f"standardRatioPct {q['standardRatioPct'].iloc[-1]:.1f}% chia cho totalLoans {tl:,.0f} tỷ, lớn hơn tổng nợ "
                          f"đã phân loại {cls:,.0f} tỷ; nhóm 1 trên nợ đã phân loại = {q['standardLoans'].iloc[-1] / cls * 100:.1f}%. "
                          "Xu hướng giảm của standardRatioPct là méo mẫu số, đọc chất lượng nợ bằng NPL/nhóm 2")
    series = {k: s for k, s in {"npl": g("nplPct"), "llr": g("llrPct"), "prov": g("creditProvisionExpense", "costStructure"),
                                     "loan": g("customerLoans", "asset"), "dep": g("customerDeposits", "capital"),
                                     **{k: g(k, "capital") for k in BANK_FUNDING_VI}}.items() if s is not None}
    j = pd.concat(series, axis=1) if series else pd.DataFrame()
    for i in range(max(1, len(j) - n), len(j)):
        per, cur, prev = j.index[i], j.iloc[i], j.iloc[i - 1]
        if {"npl", "prov"} <= set(j) and i >= 4 and cur["npl"] - prev["npl"] >= 0.1:
            py = pct_change(cur["prov"], j["prov"].iloc[i - 4])
            if py is not None and py < 0:
                # quantify: provision saved vs the same quarter last year, after 20% tax
                lift = (j["prov"].iloc[i - 4] - cur["prov"]) * 0.8
                npq_ = fa_series(frames, "netProfitParent", "businessResultQuarter")
                base = npq_.get(per) if npq_ is not None else None
                base = base if base is not None and pd.notna(base) and base > 0 else None
                tail = (f"; LNST tăng thêm nhờ dự phòng thấp ≈ {lift:,.0f} tỷ"
                        + (f" ({lift / base * 100:.1f}% LNST quý)" if base else ""))
                if base and lift < 0.05 * base:
                    tail += " — phần hỗ trợ nhỏ; đối chiếu thêm NPL/LLR để đánh giá bộ đệm"
                ev.append(f"{per}: ⚠️ NPL {prev['npl']:.2f}→{cur['npl']:.2f}% trong khi chi phí dự phòng {cur['prov']:,.0f} tỷ "
                          f"({py:+.1f}% YoY) — lợi nhuận đang được hỗ trợ bởi dự phòng thấp" + tail)
        if "llr" in j and cur["llr"] - prev["llr"] <= -10:
            ev.append(f"{per}: LLR {prev['llr']:.1f}→{cur['llr']:.1f}% ({cur['llr'] - prev['llr']:+.1f}pp) — bộ đệm dự phòng mỏng đi")
        if {"loan", "dep"} <= set(j):
            dl, dd = cur["loan"] - prev["loan"], cur["dep"] - prev["dep"]
            if dl > 0 and dd < 0.25 * dl:
                alt = [f"{BANK_FUNDING_VI[k]} {cur[k] - prev[k]:+,.0f}" for k in BANK_FUNDING_VI if k in j and cur[k] - prev[k] > 0]
                ev.append(f"{per}: cho vay KH {dl:+,.0f} tỷ nhưng tiền gửi KH {dd:+,.0f} tỷ"
                          + (f"; nguồn bù: {', '.join(alt)} tỷ" if alt else "") + " — vốn đắt hơn, theo dõi COF")
    # Profit quality QoQ: net-profit rise explained by a provision cut (after 20% tax).
    npq, pbp = g("netProfitParent", "businessResultQuarter"), g("profitBeforeProvision", "profitStructure")
    if npq is not None and "prov" in j:
        for i in range(max(1, len(j) - n), len(j)):
            per = j.index[i]
            dn = npq.get(per, np.nan) - npq.shift(1).get(per, np.nan)
            cut = (j["prov"].iloc[i - 1] - j["prov"].iloc[i]) * 0.8
            if pd.notna(dn) and pd.notna(cut) and dn > 0 and cut >= 0.5 * dn:
                pb = "" if pbp is None else f", LN trước dự phòng {pct_change(pbp.get(per), pbp.shift(1).get(per)):+.1f}%"
                npl = ("; ⚠️ cùng quý NPL tăng" if "npl" in j and j["npl"].iloc[i] - j["npl"].iloc[i - 1] >= 0.1 else "")
                ev.append(f"{per}: LNST {dn:+,.0f} tỷ QoQ, trong đó dự phòng giảm {j['prov'].iloc[i - 1]:,.0f}→"
                          f"{j['prov'].iloc[i]:,.0f} tỷ đóng góp ~{cut:,.0f} tỷ ({cut / dn * 100:.0f}%){pb}{npl}")
    # One-off income: otherIncome far above its own history (bad-debt recovery, asset sale).
    oi, toi = g("otherIncome", "profitStructure"), g("totalOperatingIncome", "businessResultQuarter")
    if oi is not None:
        for i in range(max(4, len(oi) - 8), len(oi)):
            per, v, base = oi.index[i], oi.iloc[i], oi.iloc[max(0, i - 8):i].median()
            share = v / toi.get(per) * 100 if toi is not None and toi.get(per) else None
            if pd.notna(v) and pd.notna(base) and base > 0 and v >= 2.5 * base and share is not None and share >= 10:
                ev.append(f"{per}: thu nhập khác {v:,.0f} tỷ (~{v / base:.1f}× trung vị 8 quý trước, {share:.0f}% TOI) — "
                          "khoản một lần (thu hồi nợ đã xử lý/bán tài sản?), làm cao nền so sánh cùng kỳ năm sau")
    if q is not None:
        # Loss loans (nhóm 5) creeping up quarter after quarter: slower than the +30% migration rule, same message.
        if "lossLoans" in q and len(q) >= 4:
            ll, k = q["lossLoans"], 0
            while k + 1 < len(ll) and ll.iloc[-1 - k] > ll.iloc[-2 - k] > 0:
                k += 1
            if k >= 3 and ll.iloc[-1] / ll.iloc[-1 - k] - 1 >= 0.3:
                ev.append(f"{q.index[-1]}: nợ nhóm 5 tăng {k} quý liên tiếp {ll.iloc[-1 - k]:,.0f}→{ll.iloc[-1]:,.0f} tỷ "
                          f"({pct_change(ll.iloc[-1], ll.iloc[-1 - k]):+.0f}%) — nợ mất vốn tích tụ, dự phòng sẽ phải duy trì cao")
        # VAMC: NPL falls in the quarter VAMC bonds appear/grow -> NPL cut by selling debt, not by recovery.
        if "vamcBonds" in q and "npl" in j:
            vb = q["vamcBonds"].fillna(0)
            for i in range(max(1, len(vb) - 8), len(vb)):
                per, dv = vb.index[i], vb.iloc[i] - vb.iloc[i - 1]
                if per in j.index and dv > 0.001 * (loans.get(per, np.inf) if loans is not None else np.inf):
                    k = j.index.get_loc(per)
                    dn = j["npl"].iloc[k] - j["npl"].iloc[k - 1] if k >= 1 else np.nan
                    if pd.notna(dn) and dn < 0:
                        ev.append(f"{per}: trái phiếu VAMC {vb.iloc[i - 1]:,.0f}→{vb.iloc[i]:,.0f} tỷ cùng quý NPL "
                                  f"{j['npl'].iloc[k - 1]:.2f}→{j['npl'].iloc[k]:.2f}% — NPL giảm nhờ bán nợ cho VAMC, chưa phải thu hồi")
    # Provision buffer vs bad-debt balance (nhóm 3–5). Computed from loanStructureByQuality so LLR = dự phòng / nợ xấu.
    if q is not None and len(q) and "loanLossProvision" in q and all(c in q for c in ("substandardLoans", "doubtfulLoans", "lossLoans")):
        bad = q[["substandardLoans", "doubtfulLoans", "lossLoans"]].sum(axis=1, min_count=3)
        pv = q["loanLossProvision"]
        llr_c = (pv / bad * 100).where(bad > 0)
        vb = q["vamcBonds"].fillna(0) if "vamcBonds" in q else pd.Series(0, index=q.index)
        # Falling bad-debt and provision stocks suggest a write-off; repayments/reclassification can also explain it.
        for i in range(max(1, len(q) - 8), len(q)):
            per, b0, b1, p0, p1 = q.index[i], bad.iloc[i - 1], bad.iloc[i], pv.iloc[i - 1], pv.iloc[i]
            if any(pd.isna(x) for x in (b0, b1, p0, p1)) or b0 <= 0 or p0 <= 0 or vb.iloc[i] > vb.iloc[i - 1]:
                continue
            if b1 / b0 - 1 <= -0.15 and p1 / p0 - 1 <= -0.03:
                s = (f"{per}: nợ nhóm 3–5 {b0:,.0f}→{b1:,.0f} tỷ cùng số dư dự phòng {p0:,.0f}→{p1:,.0f} tỷ — "
                     "có thể xử lý/xóa nợ bằng dự phòng; cũng có thể thu hồi/chuyển nhóm, cần thuyết minh DN")
                if "npl" in j and per in j.index:
                    k = j.index.get_loc(per)
                    if k + 1 < len(j) and j["npl"].iloc[k + 1] - j["npl"].iloc[k] >= 0.3:
                        s += f"; quý sau NPL bật lại {j['npl'].iloc[k]:.2f}→{j['npl'].iloc[k + 1]:.2f}%"
                ev.append(s)
        # (b) Gap to the best recent buffer: extra provision (and LNST after 20% tax) needed to restore it.
        hist = llr_c.iloc[-6:-1].dropna()
        reported = g("llrPct")
        comparable = (reported is None or (q.index[-1] in reported.index and pd.notna(reported.loc[q.index[-1]])
                      and abs(reported.loc[q.index[-1]] - llr_c.iloc[-1]) <= 5))
        if not comparable:
            dq.append("LLR nguồn không khớp dự phòng/nợ nhóm 3–5 (hoặc thiếu cùng kỳ); bỏ độ nhạy LLR, cần kiểm tra phạm vi")
        if comparable and len(hist) and pd.notna(llr_c.iloc[-1]) and llr_c.iloc[-1] < 100 and hist.max() - llr_c.iloc[-1] >= 10:
            tgt, per_t = hist.max(), hist.idxmax()
            need = tgt / 100 * bad.iloc[-1] - pv.iloc[-1]
            ttm = fa_series(frames, "netProfitParentTTM")
            share = (f", ~{need * 0.8 / ttm.iloc[-1] * 100:.0f}% LNST TTM" if ttm is not None and pd.notna(ttm.iloc[-1])
                     and ttm.iloc[-1] > 0 else "")
            ev.append(f"{q.index[-1]}: LLR (dự phòng/nợ nhóm 3–5) {llr_c.iloc[-1]:.0f}%, thấp hơn mức {tgt:.0f}% của {per_t} — "
                      f"độ nhạy: nếu giữ nguyên nợ nhóm 3–5 và khôi phục LLR cũ, cần thêm ≈ {need:,.0f} tỷ dự phòng "
                      f"(tác động sau thuế 20% ≈ {need * 0.8:,.0f} tỷ{share}); không phải dự báo hay nghĩa vụ trích lập")
    # Other assets are aggregated: composition needs issuer notes, not an assumption about accrued income.
    oa, ta = g("otherAssets", "asset"), g("totalAssets", "asset")
    if oa is not None and ta is not None and len(oa) >= 5 and len(ta) and oa.iloc[-5] > 0 and ta.iloc[-1] > 0:
        gr, sh = oa.iloc[-1] / oa.iloc[-5] - 1, oa.iloc[-1] / ta.iloc[-1]
        if gr >= 0.5 and sh >= 0.05:
            ev.append(f"{oa.index[-1]}: tài sản khác {oa.iloc[-5]:,.0f}→{oa.iloc[-1]:,.0f} tỷ ({gr * 100:+.0f}% YoY, {sh * 100:.1f}% tổng TS) — "
                      "chưa rõ cơ cấu (có thể gồm lãi dự thu/phải thu và khoản khác), cần thuyết minh DN")
    # Deposit run-off / CASA drop even when loans are flat (the loans-vs-deposits rule above needs loans to grow).
    casa = g("casaPct", "depositStructure")
    for i in range(max(1, len(j) - n), len(j)):
        per, cur, prev = j.index[i], j.iloc[i], j.iloc[i - 1]
        if "dep" in j and prev["dep"] and (cur["dep"] / prev["dep"] - 1) <= -0.03 and not (
                "loan" in j and cur["loan"] - prev["loan"] > 0):
            alt = [f"{BANK_FUNDING_VI[k]} {cur[k] - prev[k]:+,.0f}" for k in BANK_FUNDING_VI if k in j and cur[k] - prev[k] > 0]
            ev.append(f"{per}: tiền gửi KH {cur['dep'] - prev['dep']:+,.0f} tỷ ({pct_change(cur['dep'], prev['dep']):+.1f}% QoQ)"
                      + (f"; nguồn bù: {', '.join(alt)} tỷ" if alt else "") + " — huy động dân cư co lại, theo dõi COF")
        if casa is not None and per in casa.index:
            k = casa.index.get_loc(per)
            if k >= 1 and casa.iloc[k] - casa.iloc[k - 1] <= -3:
                ev.append(f"{per}: CASA {casa.iloc[k - 1]:.1f}→{casa.iloc[k]:.1f}% ({casa.iloc[k] - casa.iloc[k - 1]:+.1f}pp) — mất vốn rẻ, COF sẽ tăng")
    ev += minority_events(frames)
    return sorted(ev), dq  # "YYYYQn: ..." sorts chronologically


def main(workdir, output_dir=None):
    W = Work(workdir)
    sym, structure = W.symbol, W.structure
    M: dict = {"meta": {}, "price": {}, "flows": {}, "rs": {}, "elite": {}, "fa": {}, "valuation": {},
               "sector": {}, "peers": [], "market": {}, "signals": []}
    company = W.load("company") or {}
    M["meta"] = {"symbol": sym, "name": company.get("name"), "exchange": company.get("exchange"),
                 "sectorId": W.manifest.get("sectorId"), "sectorName": company.get("sectorName"),
                 "structure": structure, "fetchedAt": W.manifest.get("fetchedAt"),
                 "packageNotes": {k: j["note"] for k, j in W.manifest.get("jobs", {}).items() if j.get("note")},
                 "failedJobs": {k: j.get("err") for k, j in W.manifest.get("jobs", {}).items() if not j.get("ok")}}

    # ---------------- price & technicals ----------------
    px = price_frame(W.load("price"))
    vn = price_frame(W.load("vnindex"))
    P = M["price"]
    if not px.empty:
        c = px["adjClose"]
        last = px.iloc[-1]
        M["meta"]["asOf"] = str(px.index[-1].date())
        P.update({"date": str(px.index[-1].date()), "close": last["close"], "changePct": last["changePct"],
                  "marketCapBil": last["marketCap"] / BIL if pd.notna(last["marketCap"]) else None})
        j = benchmark_prices(c, vn["close"]) if not vn.empty else pd.DataFrame()
        P["benchmarkWindows"] = {}
        for k, n in {"1w": 5, "1m": 21, "3m": 63, "6m": 126, "1y": 252}.items():
            P[f"ret_{k}"] = ret(c, n)  # standalone stock return if benchmark is unavailable
            if len(j) > n and j.index[-1] == px.index[-1]:
                window = j.iloc[-n - 1:]
                P[f"ret_{k}"] = ret(window["stock"], n)
                P[f"vnindex_ret_{k}"] = ret(window["market"], n)
                P[f"rel_{k}"] = P[f"ret_{k}"] - P[f"vnindex_ret_{k}"]
                P["benchmarkWindows"][k] = {"from": str(window.index[0].date()), "to": P["date"], "points": len(window)}
        P["corporate_actions"] = corporate_actions(px)
        P["ret_ytd"] = ytd(c)
        if not j.empty and j.index[-1] == px.index[-1]:
            prev = j[j.index.year < j.index[-1].year]
            if not prev.empty:
                P["ret_ytd"], P["vnindex_ret_ytd"] = ytd(j["stock"]), ytd(j["market"])
                P["benchmarkWindows"]["ytd"] = {"from": str(prev.index[-1].date()), "to": P["date"]}
        w = c.iloc[-252:]
        P["high_52w"], P["low_52w"] = float(w.max()), float(w.min())
        P["from_high_pct"] = (c.iloc[-1] / w.max() - 1) * 100
        P["from_low_pct"] = (c.iloc[-1] / w.min() - 1) * 100
        for n in (20, 50, 100, 200):
            m = sma(c, n)
            P[f"ma{n}"] = m.iloc[-1]
            P[f"above_ma{n}"] = bool(c.iloc[-1] > m.iloc[-1]) if pd.notna(m.iloc[-1]) else None
        m50 = sma(c, 50)
        P["ma50_slope_20d_pct"] = pct_change(m50.iloc[-1], m50.iloc[-21]) if len(m50.dropna()) > 21 else None
        P["rsi14"] = rsi(c).iloc[-1]
        ml, sg, hist = macd(c)
        P.update({"macd": ml.iloc[-1], "macd_signal": sg.iloc[-1], "macd_hist": hist.iloc[-1],
                  "macd_hist_prev": hist.iloc[-2] if len(hist) > 1 else None})
        P["atr14_pct"] = (atr(px).iloc[-1] / c.iloc[-1]) * 100
        dr = c.pct_change()
        P["vol_annual_pct"] = dr.iloc[-252:].std() * np.sqrt(252) * 100
        P["max_drawdown_1y_pct"] = max_drawdown(c.iloc[-252:])
        val = px["totalValue"] / BIL
        P["avg_value_20_bil"] = val.iloc[-20:].mean()
        P["avg_value_60_bil"] = val.iloc[-60:].mean()
        P["value_ratio_20_60"] = P["avg_value_20_bil"] / P["avg_value_60_bil"] if P["avg_value_60_bil"] else None
        # Put-through (thỏa thuận) blocks inflate totalValue averages -> keep a matched-only baseline for breakout checks.
        if "matchedValue" in px:
            matched = (px["matchedValue"] / BIL).iloc[-20:]
            P["matched_value_bil"] = matched.iloc[-1]
            P["matched_obs_20"] = int(matched.count())
            P["avg_matched_20_bil"] = matched.mean() if P["matched_obs_20"] == 20 else None
            avg = P["avg_matched_20_bil"]
            P["matched_vs_avg_20"] = matched.iloc[-1] / avg if avg is not None and avg > 0 else None
        if "putThroughValue" in px:
            ptv = (px["putThroughValue"] / BIL).iloc[-60:]
            tot60 = val.iloc[-60:].sum()
            P["putthrough_share_60_pct"] = ptv.sum() / tot60 * 100 if tot60 and ptv.count() == val.iloc[-60:].count() == 60 else None
            if ptv.max() > 0:
                P["putthrough_max_60"] = {"date": str(ptv.idxmax().date()), "bil": ptv.max()}
        if not vn.empty:
            j = pd.concat([dr, vn["close"].pct_change()], axis=1, keys=["s", "m"]).dropna().iloc[-252:]
            P["beta_1y"] = j["s"].cov(j["m"]) / j["m"].var() if len(j) > 60 else None
            P["corr_1y"] = j["s"].corr(j["m"]) if len(j) > 60 else None

        F = M["flows"]
        if "netForeignValue" in px:
            nf = px["netForeignValue"] / BIL
            for n in (5, 20, 60, 250):
                F[f"foreign_net_{n}_bil"] = complete_window_sum(nf, n)
            if np.isfinite(nf.iloc[-1]):
                streak, sign = 0, np.sign(nf.iloc[-1])
                for v in nf.iloc[::-1]:
                    if not np.isfinite(v) or np.sign(v) != sign or sign == 0:
                        break
                    streak += 1
                F["foreign_streak_days"] = int(streak * sign)
        if "proprietaryTradingValue" in px:
            pt = px["proprietaryTradingValue"] / BIL
            for n in (5, 20, 60):
                F[f"proprietary_net_{n}_bil"] = pt.iloc[-n:].sum(min_count=1)
    af = flow_frame(W.load("active_flow"))
    if not px.empty and "net" in af:
        F = M["flows"]
        aligned = af.reindex(px.index)  # omitted sessions stay missing; ignore rows after the price cutoff
        volume = aligned["buy"] + aligned["sell"] if {"buy", "sell"} <= set(aligned) else None
        for n in (5, 20, 60, 250):
            net = complete_window_sum(aligned["net"], n)
            tot = complete_window_sum(volume, n) if volume is not None else None
            F[f"active_net_{n}_bil"] = net / BIL if net is not None else None
            F[f"active_ratio_{n}"] = net / tot if net is not None and tot is not None and tot > 0 else None

    # ---------------- RS / smart money ----------------
    R = M["rs"]
    peers = (W.load("peers_rrg") or {}).get("stocks", [])
    srow = next((s for s in peers if s["symbol"] == sym), None) or \
        next(iter((W.load("stock_rrg") or {}).get("stocks", [])), None)
    if srow:
        for k in ("rs3", "rs6", "rs3D5", "rs6D5", "quadrant", "vcr", "bubbleClass", "amfi", "amfiClass",
                  "bear20Active", "bull10Active", "lastBearDate", "lastBullDate", "gtgdTier", "inElite",
                  "entryStreak", "netForeign20"):
            if k in srow:
                R[k] = srow[k]
        R["gtgdAvg20_bil"] = (srow.get("gtgdAvg20") or 0) / BIL
        R["asOf"] = srow.get("date")
    for rt in ("rs6", "rs3"):
        ps = W.load(f"power_{rt}")
        if ps and ps.get("stock"):
            st = axis_series(ps["stock"]["dates"], ps["stock"]["scores"])
            se = axis_series(ps["sectorPower"]["dates"], ps["sectorPower"]["scores"])
            R[f"power_{rt}"] = {"now": st.iloc[-1], "5d": st.iloc[-6] if len(st) > 5 else None,
                                "20d": st.iloc[-21] if len(st) > 20 else None, "60d": st.iloc[-61] if len(st) > 60 else None,
                                "max_1y": st.iloc[-250:].max(), "min_1y": st.iloc[-250:].min(),
                                "sector_now": se.iloc[-1], "sector_20d": se.iloc[-21] if len(se) > 20 else None}
    srrg = (W.load("sector_rrg") or {}).get("sectors", [])
    if srrg:
        df = pd.DataFrame(srrg)
        df["rank_rs3"] = df["rs3"].rank(ascending=False, method="min")
        df["rank_rs6"] = df["rs6"].rank(ascending=False, method="min")
        me = df[df["sectorId"] == M["meta"]["sectorId"]]
        if len(me):
            r = me.iloc[0]
            M["sector"]["rrg"] = {k: r[k] for k in ("sectorName", "rs3", "rs6", "quadrant", "vcr", "bubbleClass",
                                                    "breadthPct", "warning", "totalMack", "stocksAboveMa50",
                                                    "streakDays", "rank_rs3", "rank_rs6")}
            M["sector"]["rrg"]["n_sectors"] = len(df)
            M["sector"]["rrg"]["warningEvents"] = r.get("warningEvents")
        M["sector"]["top_sectors_rs3"] = df.nsmallest(5, "rank_rs3")[["sectorName", "rs3", "rs6", "quadrant"]].to_dict("records")
        M["sector"]["quadrant_counts"] = df["quadrant"].value_counts().to_dict()

    # ---------------- Elite ----------------
    E = M["elite"]
    ed = W.load("elite_diag") or {}
    if ed:
        ses = ed.get("session") or {}
        E.update({"asOf": ed.get("asOf"), "openEpisode": ed.get("openEpisode"), "pillars": ses.get("pillars"),
                  "pillarsPassed": ses.get("pillarsPassed"), "missingPillars": ses.get("missingPillars"),
                  "guardsTripped": ses.get("guardsTripped"), "inExitCooldown": ses.get("inExitCooldown"),
                  "values": ses.get("values"), "persistence": (ed.get("persistence") or {}).get("qualifyingOfLast3"),
                  "notEliteReasons": ed.get("notEliteReasons")})
    eps = [e for e in (W.load("elite_sector") or {}).get("episodes", []) if e.get("y") == sym]
    if eps:
        pls = [e["pl"] for e in eps if e.get("pl") is not None]
        E["history"] = {"episodes": len(eps), "win_rate_pct": 100 * np.mean([p > 0 for p in pls]) if pls else None,
                        "avg_pl_pct": np.mean(pls) if pls else None,
                        "list": [{k: e.get(k) for k in ("edate", "xdate", "dur", "pl", "reason")} for e in eps]}
    E["sector_open"] = [e["y"] for e in (W.load("elite_sector") or {}).get("episodes", []) if not e.get("xdate")]

    # ---------------- Fundamentals ----------------
    fq = fa_frames(W.load("fa_q"))
    fy = fa_frames(W.load("fa_y"))
    FA = M["fa"]
    if fq:
        any_df = next(iter(fq.values()))
        FA["latest_period"] = any_df.index[-1]
        FA["periods"] = list(any_df.index)
        FA["kpi"] = kpi_block(fq, structure)
        FA["derived"] = derived_fa(fq, structure)
        FA["ytd"] = ytd_cumulative(fq, structure)
        if structure in ("nonfinancial", "bank", "securities"):  # bank/securities: only the capital lines can fire
            FA["bs_events"] = balance_sheet_events(fq, actions=P.get("corporate_actions"), structure=structure)
            if structure == "nonfinancial":
                FA["bs_events"] = annual_reclass_events(fy, list(any_df.index)) + FA["bs_events"]
                rec = fiscal_crosscheck(fq, fy, FA["latest_period"])
                evidence = evidence_bridge(W.dir / "cashflow_evidence.json", sym, FA["latest_period"], M["meta"].get("asOf"))
                reconcile_cash(FA["derived"], rec, evidence)
                FA["cashReconciliation"] = rec
                FA["bs_events"] += cash_gap_event(fq, FA["derived"].get("investingTTM"),
                                                  rec["metricSources"].get("investingTTM"))
        if structure == "bank":
            FA["bank_events"], FA["bank_dataQuality"] = bank_events(fq)
        cc = fa_series(fq, "charterCapital", "capital")
        if cc is not None and pd.notna(cc.get(FA["latest_period"])):
            FA["charterCapital_latest"] = float(cc[FA["latest_period"]])
    if fy:
        names = ANNUAL.get(structure, [])
        yrs = list(next(iter(fy.values())).index)
        FA["annual"] = {"years": yrs, "rows": {n: fa_series(fy, n).round(2).tolist() for n in names
                                               if fa_series(fy, n) is not None}}
        FA["annual_dataQuality"] = [f"{b['series']} theo năm ≈ {b['ratio']:.1f}× {b['twin']} — nghi lỗi nguồn (không vẽ trong 06_fa_annual), dùng {b['twin']}"
                                    for b in bogus_annual_ttm(fy)]
        if structure == "securities":
            npy, eqy = fa_series(fy, "netProfitParent"), fa_series(fy, "equity", "marginLoan")
            if npy is not None and eqy is not None:
                FA["annual"]["rows"]["roeDerivedPct"] = (npy / eqy.replace(0, np.nan) * 100).round(2).tolist()

    FA["dataQuality"] = [f"{k['label']} ({k['series']}) = 0 ở mọi kỳ gần đây — nghi lỗi dữ liệu nguồn"
                         for k in FA.get("kpi", []) if k.get("suspect")]
    dep = fa_series(fq, "depreciation", "costStructure") if fq and structure == "nonfinancial" else None
    if dep is not None and len(dep.iloc[-8:].dropna()) >= 4 and (dep.iloc[-8:].dropna() == 0).all():
        # SZC: quarterly depreciation 0 every quarter while fa_y still reports it, so ebitda == ebit
        FA["dataQuality"].append("Khấu hao quý (depreciation) = 0 ở mọi kỳ gần đây — nghi lỗi nguồn, EBITDA (Q) thực chất = EBIT")

    # sector FA share
    sfa = fa_frames(W.load("sector_fa"))
    if sfa and fq:
        SF = sector_fundamentals(fq, sfa, FA["latest_period"])
        if SF:
            SF["period"] = FA["latest_period"]
        SF["companyCount"] = (W.load("sector_fa") or {}).get("sector", {}).get("companyCount")
        M["sector"]["fa"] = SF

    # ---------------- Valuation ----------------
    V = M["valuation"]
    as_of = M["meta"].get("asOf")
    v1m, v1d = W.load("valuation_1m"), W.load("valuation_1d")
    if v1m or v1d:
        ancillary = v1m or v1d
        # Ancillary vendor fields are not the dated P/E and P/B used for scoring.
        V["snapshot"] = ancillary.get("snapshot") or {}
        for k in ("pe", "pb"):
            field = f"{k}Sstock"
            V[field] = ancillary.get(field)
            V[f"{field}FrozenSince"] = ancillary.get(f"{field}LastComputableDate")
        pe, pb = (valuation_series(v1m, k, as_of) for k in ("pe", "pb"))
        a3pe, a3pb = (valuation_series(v1m, k, as_of, f"avg3Y{k.capitalize()}").dropna() for k in ("pe", "pb"))
        cur_pe, cur_pb = (valuation_at_close(v1d, k, as_of) for k in ("pe", "pb"))
        V["currentDate"] = as_of if cur_pe is not None or cur_pb is not None else None
        dates = pe.dropna().index.union(pb.dropna().index)
        V["historyLastDate"] = str(dates[-1].date()) if len(dates) else None
        pe_raw = pe
        pe = pe[pe > 0]  # loss quarters give negative / exploding P/E: judge on positive values only
        V["pe"] = {"current": cur_pe, "avg3Y": a3pe.iloc[-1] if len(a3pe) else None,
                   "median10y": pe.median(), "mean10y": pe.mean(), "std10y": pe.std(),
                   "min10y": pe.min(), "max10y": pe.max(), "pctile10y": percentile_of(pe, cur_pe) if (cur_pe or 0) > 0 else None,
                   "negative_months": int((pe_raw <= 0).sum())}
        V["pb"] = {"current": cur_pb, "avg3Y": a3pb.iloc[-1] if len(a3pb) else None,
                   "median10y": pb.median(), "mean10y": pb.mean(), "std10y": pb.std(),
                   "min10y": pb.min(), "max10y": pb.max(), "pctile10y": percentile_of(pb, cur_pb)}
        # The website 3Y average is a mean, so a trough-earnings year (P/E) or a broken source block (P/B; seen: IDC 2023,
        # P/B 13-27 vs ~3) drags it far from typical. Flag: avg > 1.5x 10Y median, or avg > 1.3x median of the last
        # 36 months (mean >> median = outliers). outlier_months (> 3x 10Y median): trough earnings for P/E, suspect source for P/B.
        for key, s in (("pe", pe), ("pb", pb)):
            v, s = V[key], s.dropna()
            recent = s.iloc[-36:]
            outl = s[s > 3 * v["median10y"]] if pd.notna(v["median10y"]) else s.iloc[:0]
            v["outlier_months"] = [str(pd.Timestamp(d).date()) for d in outl.index]
            a3 = v["avg3Y"]  # <= 0: a loss period inside the 3Y window (FRT 2023) makes the website mean meaningless
            v["avg3Y_distorted"] = bool(a3 is not None and pd.notna(a3) and (a3 <= 0 or a3 > 1.5 * v["median10y"]
                                                                            or (len(recent) and a3 > 1.3 * recent.median())))
        # P/B outliers right after a loss year can be real: equity shrank (FRT 2024: P/B 15-18 on ~1,900 tỷ equity after
        # the 2023 loss), not a broken source block (IDC 2023). Flag the loss years so the warning names both readings.
        npy = fa_series(fy, "netProfitParent") if fy else None
        om = V["pb"]["outlier_months"]
        if om and npy is not None:
            yrs = range(int(om[0][:4]) - 1, int(om[-1][:4]) + 1)
            V["pb"]["loss_years_near_outliers"] = [str(y) for y in yrs if str(y) in npy.index and npy[str(y)] < 0]
        price = M["price"].get("close")
        if structure == "nonfinancial":
            V["bookBasisCheck"] = book_basis_check(v1d, as_of, price, FA, V["snapshot"])
        if price:
            V["implied_price"] = {}
            for k in ("pe", "pb"):
                b = V[k]
                if k == "pb" and (V.get("bookBasisCheck") or {}).get("mismatch"):
                    continue
                if b["current"] is not None and b["current"] > 0:
                    for stat in ("avg3Y", "median10y"):
                        v = b[stat]
                        if pd.notna(v) and v > 0 and not (stat == "avg3Y" and b["avg3Y_distorted"]):
                            V["implied_price"][f"at_{k}_{stat}"] = price * v / b["current"]
    sva = (W.load("sector_val_all") or {}).get("sectors", [])
    me = next((s for s in sva if s["sectorId"] == M["meta"]["sectorId"]), None)
    if me:
        V["sector"] = {k: me.get(k) for k in ("pe", "pb", "avg3YPe", "avg3YPb", "date")}
        if me.get("date") == as_of and (V.get("pe", {}).get("current") or 0) > 0 and (me.get("pe") or 0) > 0:
            V["pe_vs_sector_pct"] = (V["pe"]["current"] / me["pe"] - 1) * 100
        if me.get("date") == as_of and V.get("pb", {}).get("current") and me.get("pb"):
            V["pb_vs_sector_pct"] = (V["pb"]["current"] / me["pb"] - 1) * 100
        dfv = pd.DataFrame(sva).dropna(subset=["pe", "avg3YPe"])
        dfv["pe_disc"] = dfv["pe"] / dfv["avg3YPe"] - 1
        V["sector_pe_disc_rank"] = int((dfv["pe_disc"] < (me["pe"] / me["avg3YPe"] - 1)).sum() + 1) if me.get("avg3YPe") else None
        V["n_sectors"] = len(dfv)
    mv = (W.load("market_val") or {}).get("summary")
    if mv:
        V["market"] = {"pe": mv.get("pecurrent"), "pe_avg3Y": mv.get("peavg3Years"), "pb": mv.get("pbcurrent"),
                       "pb_avg3Y": mv.get("pbavg3Years"), "date": mv.get("lastDate")}

    # ---------------- Peers ----------------
    caps = {c["code"]: c.get("marketCap") for c in (W.load("sector_companies") or {}).get("companies", [])}
    if M["price"].get("marketCapBil") is None and caps.get(sym):  # price rows can carry marketCap = null (seen: IDC)
        M["price"]["marketCapBil"], M["price"]["marketCapSource"] = caps[sym], "sector_companies"
    pr = []
    for s in peers:
        pr.append({"symbol": s["symbol"], "exchange": s.get("exchange"), "marketCapBil": caps.get(s["symbol"]),
                   "rs3": s.get("rs3"), "rs6": s.get("rs6"), "quadrant": s.get("quadrant"), "vcr": s.get("vcr"),
                   "amfi": s.get("amfi"), "gtgdAvg20_bil": (s.get("gtgdAvg20") or 0) / BIL,
                   "changePct": s.get("changePct"), "inElite": s.get("inElite")})
    M["peers"] = sorted(pr, key=lambda r: -(r["marketCapBil"] or 0))
    if pr:
        rk = sorted(pr, key=lambda r: -(r["rs3"] or 0))
        M["rs"]["rank_in_sector_rs3"] = next((i + 1 for i, r in enumerate(rk) if r["symbol"] == sym), None)
        M["rs"]["n_peers_tracked"] = len(pr)
    sc = W.load("sector_companies") or {}
    if sc:
        M["sector"]["companyCount"] = sc.get("sector", {}).get("companyCount")
        M["sector"]["totalMarketCapBil"] = sc.get("totalMarketCap")
        if caps.get(sym) and sc.get("totalMarketCap"):
            M["sector"]["stock_cap_share_pct"] = caps[sym] / sc["totalMarketCap"] * 100

    # ---------------- Market ----------------
    MK = M["market"]
    ms = W.load("market_state") or {}
    if ms:
        cur = ms.get("current", {})
        MK["state"] = {k: cur.get(k) for k in ("date", "state", "confidenceScore", "confidenceTier", "daysInCurrent",
                                               "breadthVn100Pct", "ddCount", "ddFlag", "lastTransition")}
        MK["latestFtd"] = ms.get("latestFtd")
        MK["transitions"] = (ms.get("transitions") or [])[:4]
    for key, name in (("sentiment", "market_sentiment"), ("diffusion", "money_diffusion")):
        d = W.load(name) or {}
        if d.get("current"):
            MK[key] = {g: {"score": v.get("score"), "band": v.get("band"),
                           "chg_week": (v.get("compare") or {}).get("prevWeek", {}).get("change"),
                           "chg_month": (v.get("compare") or {}).get("prevMonth", {}).get("change")}
                       for g, v in d["current"].items()}
            if d.get("leader"):
                MK[key]["leader"] = d["leader"].get("label")

    M["signals"] = scorecard(M)
    M = clean(M, 3)
    out = Path(output_dir or workdir)
    (out / "metrics.json").write_text(json.dumps(M, ensure_ascii=False, indent=1))
    (out / "tables.md").write_text(tables_md(M))
    print(f"wrote {out/'metrics.json'} and {out/'tables.md'}")
    sc_tot = sum(g["score"] for g in M["signals"]["groups"])
    print(f"{sym} [{structure}] asOf {M['meta'].get('asOf')} | score {sc_tot:+} / ±{2*len(M['signals']['groups'])} -> {M['signals']['verdict']}")


# ---------------- scorecard ----------------
def scorecard(M):
    """Rule-based scorecard. Each check gives -1/0/+1; group score clipped to [-2, +2]. Rules: references/scorecard.md"""
    P, F, R, V, FA, MK, E = M["price"], M["flows"], M["rs"], M["valuation"], M["fa"], M["market"], M["elite"]
    groups = []

    def g(name, checks):
        pts = [c for c in checks if c is not None]
        s = int(np.clip(sum(c["pt"] for c in pts), -2, 2))
        groups.append({"group": name, "score": s, "checks": pts})

    def ck(label, value, pt, rule):
        value = clean(value, 2)
        return {"check": label, "value": value, "pt": int(pt) if value is not None else 0, "rule": rule,
                "available": value is not None}

    def tri(x, hi, lo):  # +1 if x>=hi, -1 if x<=lo
        return 0 if x is None else (1 if x >= hi else -1 if x <= lo else 0)

    g("Xu hướng giá", [
        ck("Giá vs MA50", P.get("above_ma50"), 1 if P.get("above_ma50") else -1, "+1 trên MA50 / -1 dưới"),
        ck("Giá vs MA200", P.get("above_ma200"), 1 if P.get("above_ma200") else -1, "+1 trên MA200 / -1 dưới"),
        ck("MA50 dốc 20 phiên %", P.get("ma50_slope_20d_pct"), tri(P.get("ma50_slope_20d_pct"), 1, -1), "+1 ≥+1% / -1 ≤-1%"),
    ])
    g("Động lượng", [
        ck("RSI14", P.get("rsi14"), (1 if 55 <= P["rsi14"] <= 70 else -1 if P["rsi14"] < 40 or P["rsi14"] > 80 else 0) if P.get("rsi14") is not None else 0,
           "+1 55–70 / -1 <40 hoặc >80"),
        ck("MACD vs signal & 0", P.get("macd"), (1 if P["macd"] > P["macd_signal"] and P["macd"] > 0 else
                                               -1 if P["macd"] < P["macd_signal"] and P["macd"] < 0 else 0) if P.get("macd") is not None else 0,
           "+1 MACD>signal và >0 / -1 MACD<signal và <0"),
        ck("Hiệu suất 3T vs VNINDEX (pp)", P.get("rel_3m"), tri(P.get("rel_3m"), 5, -5), "+1 ≥+5pp / -1 ≤-5pp"),
    ])
    quad = {"leading": 2, "improving": 1, "weakening": -1, "lagging": -2}.get(R.get("quadrant"), 0)
    g("Sức mạnh tương đối", [
        ck("Góc phần tư RRG", R.get("quadrant"), quad, "leading +2, improving +1, weakening -1, lagging -2"),
        ck("RS6 (Sức mạnh trung hạn)", R.get("rs6"), tri(R.get("rs6"), 70, 30), "+1 ≥70 / -1 ≤30"),
        ck("RS3 thay đổi 5 phiên", R.get("rs3D5"), tri(R.get("rs3D5"), 5, -5), "+1 ≥+5 / -1 ≤-5"),
    ])
    g("Dòng tiền", [
        ck("VCR", R.get("vcr"), tri(R.get("vcr"), 1.0, 0.8), "+1 ≥1.0 / -1 <0.8"),
        ck("AMFI", R.get("amfi"), tri(R.get("amfi"), 0.05, -0.05), "+1 >0.05 / -1 <-0.05"),
        ck("Khối ngoại ròng 20 phiên (tỷ)", F.get("foreign_net_20_bil"), tri(F.get("foreign_net_20_bil"), 1e-9, -1e-9), "+1 mua ròng / -1 bán ròng"),
        ck("Mua-bán chủ động 20 phiên (tỷ)", F.get("active_net_20_bil"), tri(F.get("active_net_20_bil"), 1e-9, -1e-9), "+1 >0 / -1 <0"),
        ck("Phân kỳ giảm AMFI (bear20)", R.get("bear20Active"), -1 if R.get("bear20Active") else 0, "-1 nếu đang active"),
    ])
    d = FA.get("derived", {})
    g("Tăng trưởng", [
        ck("LNST TTM YoY %", d.get("netProfitTTMYoYPct"), tri(d.get("netProfitTTMYoYPct"), 15, 0), "+1 ≥15% / -1 ≤0%"),
        ck("Doanh thu TTM YoY %", d.get("revenueTTMYoYPct"), tri(d.get("revenueTTMYoYPct"), 10, 0), "+1 ≥10% / -1 ≤0%"),
    ])
    kp = {k["series"]: k for k in FA.get("kpi", []) if not k.get("suspect")}
    roe = kp.get("roeTTMPct", {}).get("value")
    if roe is None:  # fall back to the plain snapshot ROE of get_stock_valuation
        roe = (V.get("snapshot") or {}).get("roe")
    qual = [ck("ROE TTM %", roe, tri(roe, 15, 8), "+1 ≥15% / -1 ≤8%")]
    st = M["meta"]["structure"]
    if st == "nonfinancial":
        nde = d.get("netDebtToEquityPct")
        qual.append(ck("Nợ vay ròng/VCSH %", nde, -tri(nde, 100, 30) if nde is not None else 0, "+1 ≤30% / -1 ≥100%"))
        o2n = d.get("ocfToNetProfitTTM")
        qual.append(ck("CFO TTM / LNST TTM", o2n, tri(o2n, 0.8, 0.3), "+1 ≥0.8 / -1 ≤0.3"))
    elif st == "bank":
        npl = kp.get("nplPct", {}).get("value")
        llr = kp.get("llrPct", {}).get("value")
        qual.append(ck("NPL %", npl, -tri(npl, 3, 1.5) if npl is not None else 0, "+1 ≤1.5% / -1 ≥3%"))
        qual.append(ck("LLR %", llr, tri(llr, 100, 60), "+1 ≥100% / -1 ≤60%"))
    elif st == "insurance":
        cr = kp.get("combinedRatioPct", {}).get("value")
        qual.append(ck("Combined ratio %", cr, -tri(cr, 105, 95) if cr is not None else 0, "+1 ≤95% / -1 ≥105%"))
    elif st == "securities":
        me = kp.get("marginOverEquityPct", {}).get("value")
        qual.append(ck("Margin/VCSH %", me, -1 if me is not None and me > 180 else 0, "-1 nếu >180% (gần trần 200%)"))
    g("Chất lượng", qual)
    pe, pb = V.get("pe", {}), V.get("pb", {})
    pe_rel = pe["current"] / pe["median10y"] if (pe.get("current") or 0) > 0 and (pe.get("median10y") or 0) > 0 else None
    pb_percentile = None if (V.get("bookBasisCheck") or {}).get("mismatch") else pb.get("pctile10y")
    g("Định giá", [
        ck("P/E / trung vị 10N (P/E>0)", pe_rel, -tri(pe_rel, 1.2, 0.8), "+1 ≤0.8x / -1 ≥1.2x"),
        ck("P/B percentile 10 năm", pb_percentile, -tri(pb_percentile, 80, 20), "+1 ≤20 / -1 ≥80"),
        ck("P/E vs ngành %", V.get("pe_vs_sector_pct"), -tri(V.get("pe_vs_sector_pct"), 30, -20) if V.get("pe_vs_sector_pct") is not None else 0, "+1 rẻ hơn ≥20% / -1 đắt hơn ≥30%"),
    ])
    state = MK.get("state", {}).get("state")
    srq = M["sector"].get("rrg", {}).get("quadrant")
    g("Bối cảnh thị trường & ngành", [
        ck("Trạng thái thị trường", state, {"uptrend": 1, "downtrend": -1}.get(state, 0), "uptrend +1 / pressure 0 / downtrend -1"),
        ck("Góc phần tư RRG ngành", srq, {"leading": 1, "improving": 1, "weakening": -1, "lagging": -1}.get(srq, 0), "leading/improving +1, weakening/lagging -1"),
        ck("Tâm lý trung hạn", MK.get("sentiment", {}).get("midTerm", {}).get("score"),
           tri(MK.get("sentiment", {}).get("midTerm", {}).get("score"), 60, 25), "+1 ≥60 / -1 ≤25"),
    ])
    total = sum(x["score"] for x in groups)
    mx = 2 * len(groups)
    verdict = ("Tích cực" if total >= 8 else "Khá tích cực" if total >= 3 else "Trung tính" if total > -3
               else "Khá tiêu cực" if total > -8 else "Tiêu cực")
    by = {x["group"]: x["score"] for x in groups}
    sub = {"Kỹ thuật & dòng tiền": sum(by.get(k, 0) for k in ("Xu hướng giá", "Động lượng", "Sức mạnh tương đối", "Dòng tiền")),
           "Cơ bản & định giá": sum(by.get(k, 0) for k in ("Tăng trưởng", "Chất lượng", "Định giá")),
           "Bối cảnh": by.get("Bối cảnh thị trường & ngành", 0)}
    coverage = {g["group"]: {"available": sum(c["available"] for c in g["checks"]), "total": len(g["checks"])} for g in groups}
    return {"groups": groups, "total": total, "max": mx, "verdict": verdict, "subtotals": sub, "coverage": coverage}


# ---------------- markdown tables ----------------
def cash_reconciliation_md(rec):
    checks = rec["checks"]
    evidence_labels = {**CASH_LABELS, "netProfit": "LNST", "capex": "Chi capex"}
    mismatches = [c for c in checks if c["mismatch"]]
    if checks:
        out = ["", f"Đối chiếu LCTT SSTOCK (cộng 4 quý vs số năm): {len(mismatches)}/{len(checks)} phép so lệch quá dung sai."]
    else:
        out = ["", "Đối chiếu LCTT: chưa có năm với đủ số quý và năm để kiểm tra."]
    for c in mismatches:
        out.append(f"- {c['year']} · {CASH_LABELS[c['field']]}: tổng quý {fmt(c['sumQuarter'], 2)} vs năm "
                   f"{fmt(c['annual'], 2)} tỷ (lệch {fmt_signed(c['delta'], 2, '')}; dung sai {fmt(c['tolerance'], 2)}).")
    if any(rec["suspect"].values()):
        out += ["> ⚠️ LCTT quý SSTOCK xung đột với số năm trong cửa sổ TTM hiện tại hoặc cùng kỳ. "
                "Tạm loại chỉ tiêu TTM bị ảnh hưởng khỏi kết luận/chấm điểm, trừ chỉ tiêu thay bằng cầu nối BCTC gốc bên dưới. "
                "Bảng quý và chart vẫn là chuỗi nguồn; chưa biết quý sai chỉ từ chênh năm."]
    e = rec.get("companyEvidence")
    if e and "error" in e:
        out.append(f"> ⚠️ cashflow_evidence.json không hợp lệ, không sử dụng: {e['error']}.")
    elif e:
        out.append(f"BCTC gốc nhập từ cashflow_evidence.json · phạm vi {e['scope']} · cơ sở {e['basis']}:")
        for key, label in (("currentQ", "Quý"), ("currentYTD", "Lũy kế"), ("currentTTM", "4 quý")):
            fields = e[key]
            prior = e[key.replace("current", "prior")]
            if fields:
                d = " · ".join(f"{evidence_labels[k]} {fmt(v, 2)}" +
                               (f" vs {fmt(prior[k], 2)} cùng kỳ" if k in prior else "") for k, v in fields.items())
                out.append(f"- {label} (tỷ): {d}")
        out.extend(f"- {p}: {row['source']} (công bố {row['publishedDate']})." for p, row in sorted(e["sources"].items()))
    return out


def tables_md(M):
    P, F, R, V, FA, MK, E, S = (M[k] for k in ("price", "flows", "rs", "valuation", "fa", "market", "elite", "sector"))
    meta = M["meta"]
    L = [f"# Bảng số liệu — {meta['symbol']} ({meta.get('name')})",
         f"Ngành: {meta.get('sectorName')} (id {meta.get('sectorId')}) · cấu trúc BCTC: {meta['structure']} · dữ liệu tới {meta.get('asOf')}", ""]
    if meta.get("failedJobs"):
        L += ["> ⚠️ Job thiếu/lấy không đủ: " + "; ".join(f"{k}: {v}" for k, v in meta["failedJobs"].items()), ""]
    if meta.get("packageNotes"):
        L += ["> Giới hạn gói: " + "; ".join(f"{k}: {v}" for k, v in meta["packageNotes"].items()), ""]
    L += ["## Giá & kỹ thuật", "| Chỉ tiêu | Giá trị |", "|---|---|",
          f"| Giá đóng cửa (nghìn đ) | {fmt(P.get('close'), 2)} ({fmt_signed(P.get('changePct'), 2)}) |",
          f"| Vốn hóa (tỷ) | {fmt(P.get('marketCapBil'), 0)}{' (nguồn: sector_companies)' if P.get('marketCapSource') else ''} |",
          f"| Đỉnh / đáy 52 tuần | {fmt(P.get('high_52w'), 2)} / {fmt(P.get('low_52w'), 2)} (cách đỉnh {fmt_signed(P.get('from_high_pct'))}) |",
          f"| MA20 / MA50 / MA200 | {fmt(P.get('ma20'), 2)} / {fmt(P.get('ma50'), 2)} / {fmt(P.get('ma200'), 2)} |",
          f"| RSI14 · MACD hist | {fmt(P.get('rsi14'))} · {fmt(P.get('macd_hist'), 3)} |",
          f"| ATR14 % · Biến động năm % · Beta 1Y | {fmt(P.get('atr14_pct'))} · {fmt(P.get('vol_annual_pct'))} · {fmt(P.get('beta_1y'), 2)} |",
          f"| Max drawdown 1Y | {fmt(P.get('max_drawdown_1y_pct'))}% |",
          f"| GTGD TB20 / TB60 (tỷ) | {fmt(P.get('avg_value_20_bil'))} / {fmt(P.get('avg_value_60_bil'))} · khớp lệnh TB20 {fmt(P.get('avg_matched_20_bil'))} · thỏa thuận {fmt(P.get('putthrough_share_60_pct'))}% GTGD 60 phiên |", ""]
    if P.get("matched_obs_20") is not None:
        L += [f"Khớp lệnh phiên chốt **{fmt(P.get('matched_value_bil'), 2)} tỷ** · "
              f"so TB20 **{fmt(P.get('matched_vs_avg_20'), 2)}x** (đủ {P['matched_obs_20']}/20 phiên có số liệu).", ""]
    pmx = P.get("putthrough_max_60") or {}
    if (P.get("putthrough_share_60_pct") or 0) >= 20:
        L += [f"> ⚠️ Thỏa thuận chiếm {fmt(P['putthrough_share_60_pct'])}% GTGD 60 phiên (lớn nhất {pmx.get('date')}: {fmt(pmx.get('bil'))} tỷ): "
              "TB20/TB60 bị thổi phồng, dùng khớp lệnh TB20 làm ngưỡng thanh khoản cho breakout.", ""]
    ca = P.get("corporate_actions") or []
    if ca:
        L += ["Sự kiện quyền (giá gốc gãy, adjClose liên tục; mọi mức giá lịch sử dùng adjClose):"] + [
            f"- {e['date']}: hệ số {e['factor']:.3f} (giá gốc {e['prev_close']:.2f} → {e['close']:.2f}) → {e['kind']} (cần tin DN)" for e in ca]
        shares, cc = (V.get("snapshot") or {}).get("sharesOutstanding"), FA.get("charterCapital_latest")
        if shares and cc and abs(shares / (cc * 1e5) - 1) > 0.05:  # vốn điều lệ (tỷ) / mệnh giá 10.000 đ = số CP
            L += ["", f"> ⚠️ Số CP lưu hành (định giá) {shares / 1e9:,.2f} tỷ cp ≠ vốn điều lệ BCTC {FA.get('latest_period')} "
                     f"{cc:,.0f} tỷ / 10.000 đ = {cc * 1e5 / 1e9:,.2f} tỷ cp. Kiểm tra mệnh giá, phạm vi và mốc số CP trước khi diễn giải EPS/P/E."]
        L.append("")
    L += ["| Kỳ | Cổ phiếu | VNINDEX | Chênh lệch (pp) |", "|---|---|---|---|"]
    for k in ("1w", "1m", "3m", "6m", "ytd", "1y"):
        L.append(f"| {k.upper()} | {fmt_signed(P.get('ret_'+k), 2)} | {fmt_signed(P.get('vnindex_ret_'+k), 2)} | "
                 f"{fmt_signed(P.get('rel_'+k) if k!='ytd' else (P.get('ret_ytd') - P.get('vnindex_ret_ytd') if P.get('ret_ytd') is not None and P.get('vnindex_ret_ytd') is not None else None), 1, '')} |")
    bw = (P.get("benchmarkWindows") or {}).get("1y")
    if bw:
        L += ["", f"Lợi suất 1N cùng lịch ({bw['points']} điểm): {bw['from']} → {bw['to']}. Dòng thiếu VNINDEX chỉ là lợi suất riêng mã."]
    else:
        L += ["", "> ⚠️ Không đủ 253 điểm chung đến phiên chốt để so lợi suất 1N với VNINDEX."]
    L += ["", "## Dòng tiền (tỷ đồng)", "| Cửa sổ | Khối ngoại ròng | Tự doanh ròng | Chủ động ròng | Tỷ lệ chủ động |", "|---|---|---|---|---|"]
    for n in (5, 20, 60, 250):
        L.append(f"| {n} phiên | {fmt_signed(F.get(f'foreign_net_{n}_bil'),1,'')} | {fmt_signed(F.get(f'proprietary_net_{n}_bil'),1,'')} | "
                 f"{fmt_signed(F.get(f'active_net_{n}_bil'),1,'')} | {fmt_signed(F.get(f'active_ratio_{n}'),3,'')} |")
    L += [f"\nChuỗi khối ngoại: {fmt(F.get('foreign_streak_days'), 0)} phiên liên tiếp (dương = mua ròng).", "",
          "## Sức mạnh tương đối & smart-money", "| Chỉ tiêu | Giá trị |", "|---|---|",
          f"| RS3 / RS6 (0-100) | {fmt(R.get('rs3'))} / {fmt(R.get('rs6'))} (Δ5 phiên: {fmt_signed(R.get('rs3D5'),1,'')} / {fmt_signed(R.get('rs6D5'),1,'')}) |",
          f"| Góc phần tư RRG | {R.get('quadrant')} |",
          f"| VCR · AMFI | {fmt(R.get('vcr'), 2)} ({R.get('bubbleClass')}) · {fmt(R.get('amfi'), 3)} ({R.get('amfiClass')}) |",
          f"| Phân kỳ bear20 / bull10 | {R.get('bear20Active')} / {R.get('bull10Active')} (gần nhất: bear {R.get('lastBearDate')}, bull {R.get('lastBullDate')}) |",
          f"| Xếp hạng RS3 trong ngành | {R.get('rank_in_sector_rs3')}/{R.get('n_peers_tracked')} mã được theo dõi |"]
    for rt in ("rs6", "rs3"):
        p = R.get(f"power_{rt}")
        if p:
            L.append(f"| Sức mạnh {rt.upper()} hiện tại / 20 phiên trước / 60 phiên trước | {fmt(p['now'])} / {fmt(p['20d'])} / {fmt(p['60d'])} (ngành {fmt(p['sector_now'])}) |")
    L += [f"| Elite | {'ĐANG MỞ' if E.get('openEpisode') else 'Không'} · {E.get('pillars')}/5 trục · thiếu: {', '.join(E.get('missingPillars') or []) or '—'} · guard: {E.get('guardsTripped') or '—'} |"]
    if any(g.get("guard") == 2 for g in E.get("guardsTripped") or []):
        L.append(f"| Elite guard-2 | cố định: mã niêm yết {meta.get('exchange')}, Elite chỉ xét HOSE, nên mã này không bao giờ vào Elite. Các trụ vẫn dùng được làm trigger xác nhận |")
    if E.get("history"):
        h = E["history"]
        L.append(f"| Lịch sử Elite | {h['episodes']} lần, thắng {fmt(h['win_rate_pct'],0)}%, TB {fmt_signed(h['avg_pl_pct'])} |")
    if FA.get("kpi"):
        per = FA["kpi"][0]["last8_periods"]
        L += ["", f"## Chỉ tiêu cơ bản theo quý (kỳ mới nhất {FA.get('latest_period')}; tiền: tỷ đồng)",
              "| Chỉ tiêu | " + " | ".join(per) + " | QoQ | YoY |", "|---" * (len(per) + 3) + "|"]
        for k in FA["kpi"]:
            vals = k["last8"] + [None] * (len(per) - len(k["last8"]))
            nd = 0 if k["kind"] == "bil" else 1
            q = fmt_signed(k["qoq"], 1, "%" if k["kind"] == "bil" else "pp")
            y = fmt_signed(k["yoy"], 1, "%" if k["kind"] == "bil" else "pp")
            L.append(f"| {k['label']} | " + " | ".join(fmt(v, nd) for v in vals) + f" | {q} | {y} |")
        if FA.get("dataQuality"):
            L += ["", "> ⚠️ Chất lượng dữ liệu: " + "; ".join(FA["dataQuality"])
                  + f". ROE snapshot (get_stock_valuation): {fmt((V.get('snapshot') or {}).get('roe'))}%"]
        rec = FA.get("cashReconciliation")
        if rec is not None:
            L += cash_reconciliation_md(rec)
        if FA.get("derived"):
            d = FA["derived"]
            quality_rows = {
                "ocfTTM": ("CFO 4 quý (tỷ)", "priorOcfTTM"),
                "ocfToNetProfitTTM": ("CFO / LNST công ty mẹ 4 quý (x)", "priorOcfToNetProfitTTM"),
                "inventoryDaysProxy": ("Số ngày tồn kho (ước tính)", "inventoryDaysProxyYoYDelta"),
                "receivableDaysProxy": ("Số ngày phải thu tổng hợp (ước tính)", "receivableDaysProxyYoYDelta"),
                "operatingProfitQ": ("Lợi nhuận hoạt động quý (tỷ)", "operatingProfitQYoYDelta"),
                "financialProfitQ": ("Lãi tài chính ròng quý (tỷ)", "financialProfitQYoYDelta"),
                "otherProfitQ": ("Lợi nhuận khác quý (tỷ)", "otherProfitQYoYDelta"),
                "ebtQ": ("Lợi nhuận trước thuế quý (tỷ)", "ebtQYoYDelta"),
                "ebtBridgeResidualQ": ("Chênh LNTT với tổng hoạt động + tài chính + khác", None),
                "ebtToParentProfitResidualQ": ("LNTT trừ LNST công ty mẹ quý (tỷ)", "ebtToParentProfitResidualQYoYDelta"),
                "investingTTM": ("LCTT đầu tư 4 quý (tỷ)", None),
                "cashFlowAfterInvestingTTM": ("CFO + LCTT đầu tư 4 quý (tỷ; không phải FCF)", None),
                "cashFlowLessCapexTTM": ("CFO trừ capex nhập từ công bố (tỷ)", None),
            } if meta["structure"] == "nonfinancial" else {}
            table_keys = set(quality_rows) | {comparison for _, comparison in quality_rows.values()}
            rest = [f"{k}={fmt(v, 2)}" for k, v in d.items() if k not in table_keys]
            if rest:
                L += ["", "Chỉ tiêu suy ra: " + " · ".join(rest)]
            if quality_rows:
                L += ["", "Chất lượng lợi nhuận & vốn lưu động:", "", "| Chỉ tiêu | Hiện tại | Đối chiếu |", "|---|---:|---:|"]
                for key, (label, comparison) in quality_rows.items():
                    sources = (rec or {}).get("metricSources", {})
                    source = sources.get(key)
                    comp = "—"
                    if comparison in d:
                        if comparison.startswith("prior"):
                            if source == sources.get(comparison):
                                comp = f"{fmt(d[comparison], 2)} cùng kỳ"
                            else:
                                comp = "Khác nguồn/cơ sở; xem đối chiếu"
                        else:
                            comp = f"{fmt_signed(d[comparison], 2, '')} YoY"
                    if source == "company_ytd" and key == "ocfToNetProfitTTM":
                        label = "CFO / LNST cùng phạm vi 4 quý (x)"
                    source_label = {"company_ytd": " · BCTC gốc", "sstock_quarterly": " · SSTOCK quý"}.get(source, "")
                    L.append(f"| {label}{source_label} | {fmt(d.get(key), 2)} | {comp} |")
            if meta["structure"] == "nonfinancial":
                if (d.get("ocfToNetProfitTTM") is not None and d["ocfToNetProfitTTM"] <= 0.3
                        and (d.get("netProfitTTMYoYPct") or 0) > 0):
                    L += ["", "> ⚠️ LNST 4 quý tăng nhưng CFO/LNST ≤0,3x; đối chiếu tồn kho, phải thu và cùng kỳ. CFO + LCTT đầu tư không phải FCF."]
                if d.get("inventoryVsRevenueGrowthGapPp", 0) >= 20:
                    L += ["", f"> ⚠️ Tăng tồn kho cuối quý vượt tăng doanh thu TTM {fmt(d['inventoryVsRevenueGrowthGapPp'])} điểm %; "
                          "kiểm tra số ngày tồn kho, cơ cấu và mùa vụ trước khi kết luận."]
        if FA.get("ytd"):
            L += ["", "Lũy kế năm so với cùng kỳ: " + " · ".join(
                f"{SERIES_VI.get(k, k)} {v['label']} {fmt(v['value'], 0)} vs {fmt(v['prev'], 0)} ({fmt_signed(v['yoyPct'])})"
                for k, v in FA["ytd"].items())]
            ttm, yt = (FA.get("derived") or {}).get("netProfitTTMYoYPct"), (FA["ytd"].get("netProfitParent") or {}).get("yoyPct")
            # gap must be material in absolute and relative terms (+90% vs +103% reads the same; +30% vs +18% does not)
            if ttm is not None and yt is not None and abs(ttm - yt) >= max(10, 0.3 * max(abs(ttm), abs(yt))):
                L += ["", f"> ⚠️ LNST TTM YoY {ttm:+.1f}% lệch lũy kế năm {yt:+.1f}% ({ttm - yt:+.1f}pp): cửa sổ TTM chứa một quý nền bất thường. "
                      "Đọc tăng trưởng theo lũy kế năm, tìm quý gây lệch trong bảng quý và ghi override ở Scorecard nếu ngưỡng chấm điểm đổi chiều."]
        if FA.get("bs_events"):
            L += ["", "Sự kiện bảng cân đối (gợi ý cần giải thích ở bước 3):"] + [f"- {e}" for e in FA["bs_events"]]
        if FA.get("bank_events"):
            L += ["", "Sự kiện ngân hàng (cần giải thích ở bước 3, xem references/banking.md):"] + [f"- {e}" for e in FA["bank_events"]]
        if FA.get("bank_dataQuality"):
            L += ["", "> ⚠️ Chất lượng dữ liệu (ngân hàng): " + "; ".join(FA["bank_dataQuality"])]
    if FA.get("annual"):
        A = FA["annual"]
        L += ["", "## Theo năm", "| Chỉ tiêu | " + " | ".join(A["years"]) + " |", "|---" * (len(A["years"]) + 1) + "|"]
        for n, vals in A["rows"].items():
            L.append(f"| {SERIES_VI.get(n, n)} | " + " | ".join(fmt(v, 1 if n.endswith('Pct') else 0) for v in vals) + " |")
        if FA.get("annual_dataQuality"):
            L += ["", "> ⚠️ Chất lượng dữ liệu (theo năm): " + "; ".join(FA["annual_dataQuality"])]
    pe, pb = V.get("pe", {}), V.get("pb", {})
    if pe:
        L += ["", "## Định giá", "| | Phiên chốt | TB 3 năm | Trung vị 10N | Min–Max 10N | Percentile 10N | Ngành | Thị trường |", "|---|---|---|---|---|---|---|---|",
              f"| P/E | {fmt(pe.get('current'),2)} | {fmt(pe.get('avg3Y'),2)} | {fmt(pe.get('median10y'),2)} | {fmt(pe.get('min10y'),1)}–{fmt(pe.get('max10y'),1)} | {fmt(pe.get('pctile10y'),0)} | {fmt(V.get('sector',{}).get('pe'),2)} (TB3N {fmt(V.get('sector',{}).get('avg3YPe'),2)}) | {fmt(V.get('market',{}).get('pe'),2)} (TB3N {fmt(V.get('market',{}).get('pe_avg3Y'),2)}) |",
              f"| P/B | {fmt(pb.get('current'),2)} | {fmt(pb.get('avg3Y'),2)} | {fmt(pb.get('median10y'),2)} | {fmt(pb.get('min10y'),2)}–{fmt(pb.get('max10y'),2)} | {fmt(pb.get('pctile10y'),0)} | {fmt(V.get('sector',{}).get('pb'),2)} (TB3N {fmt(V.get('sector',{}).get('avg3YPb'),2)}) | {fmt(V.get('market',{}).get('pb'),2)} (TB3N {fmt(V.get('market',{}).get('pb_avg3Y'),2)}) |"]
        sn = V.get("snapshot", {})
        L.append(f"\nSnapshot nguồn (không xác nhận mốc phiên) — EPS 4Q: {fmt(sn.get('eps'),0)} đ · ROE: {fmt(sn.get('roe'))}% · P/E SSTOCK (dự phóng): {fmt(V.get('peSstock'),2)} (đóng băng từ {V.get('peSstockFrozenSince')}) · P/B SSTOCK: {fmt(V.get('pbSstock'),2)} (đóng băng từ {V.get('pbSstockFrozenSince')})")
        if V.get("currentDate"):
            L.append(f"\nP/E và P/B phiên chốt lấy từ chuỗi ngày: {V['currentDate']}.")
        if pe.get("current") is None or pb.get("current") is None:
            L.append("> ⚠️ Thiếu P/E hoặc P/B có dữ liệu đúng phiên chốt; bỏ so sánh và giá tham chiếu cho bội số thiếu.")
        if V.get("historyLastDate"):
            L.append(f"Điểm cuối có dữ liệu trong chuỗi tháng (đã cắt tại phiên chốt): {V['historyLastDate']}.")
        if V.get("sector") or V.get("market"):
            L.append(f"Mốc tham chiếu ngành: {V.get('sector', {}).get('date') or '—'}; thị trường: {V.get('market', {}).get('date') or '—'}.")
        book = V.get("bookBasisCheck") or {}
        if book.get("mismatch"):
            L.append(f"> ⚠️ Cơ sở P/B lệch: BVPS ngày {book['date']} **{fmt(book['vendorBvpsDong'], 0)} đ** vs "
                     f"VCSH ước tính {book['period']}/số CP **{fmt(book['approxBvpsDong'], 0)} đ** ({fmt_signed(book['gapPct'])}); "
                     f"P/B ước tính {fmt(book['approxPb'], 2)}x. Đối chiếu BCTC gốc/phạm vi và ngày số CP. "
                     "Giữ chuỗi nguồn để truy vết, tạm bỏ điểm và giá tham chiếu dựa trên P/B.")
        ip = V.get("implied_price") or {}
        if ip:
            L.append("Giá tham chiếu (nghìn đ): " + " · ".join(f"{k}={fmt(v, 2)}" for k, v in ip.items()))
    else:
        L += ["", "## Định giá", "> ⚠️ Không có nguồn định giá cổ phiếu (valuation_1d / valuation_1m)."]
    if M["peers"]:
        L += ["", "## So sánh cùng ngành (mã được RRG theo dõi)", "| Mã | Sàn | Vốn hóa (tỷ) | RS3 | RS6 | Góc | VCR | AMFI | GTGD20 (tỷ) |", "|---|---|---|---|---|---|---|---|---|"]
        shown = M["peers"][:12]
        if not any(p["symbol"] == meta["symbol"] for p in shown):  # small caps fall below the top-12 cut (CTS rank 15)
            shown += [p for p in M["peers"] if p["symbol"] == meta["symbol"]]
        for p in shown:
            b = "**" if p["symbol"] == meta["symbol"] else ""
            L.append(f"| {b}{p['symbol']}{b} | {p['exchange']} | {fmt(p['marketCapBil'],0)} | {fmt(p['rs3'],0)} | {fmt(p['rs6'],0)} | {p['quadrant']} | {fmt(p['vcr'],2)} | {fmt(p['amfi'],3)} | {fmt(p['gtgdAvg20_bil'],1)} |")
    sr = S.get("rrg")
    if sr:
        L += ["", "## Ngành", f"RRG ngành {sr['sectorName']}: {sr['quadrant']} · RS3 {fmt(sr['rs3'])} (hạng {fmt(sr['rank_rs3'],0)}/{sr['n_sectors']}) · RS6 {fmt(sr['rs6'])} (hạng {fmt(sr['rank_rs6'],0)}) · VCR {fmt(sr['vcr'],2)} · độ rộng >MA50 {fmt(sr['breadthPct'])}% · cảnh báo {sr['warning']}"]
    if S.get("fa"):
        L.append("Tỷ trọng & so sánh ngành: " + " · ".join(f"{k}={v if k == 'period' else fmt(v, 1)}" for k, v in S["fa"].items()))
    if S.get("stock_cap_share_pct"):
        L.append(f"Tỷ trọng vốn hóa trong ngành: {fmt(S['stock_cap_share_pct'])}% của {fmt(S.get('totalMarketCapBil'),0)} tỷ ({S.get('companyCount')} DN)")
    st = MK.get("state")
    if st:
        L += ["", "## Thị trường",
              f"Trạng thái: **{st['state']}** (tin cậy {fmt(st['confidenceScore'])} – {st['confidenceTier']}, {st['daysInCurrent']} phiên) · độ rộng VN100 {st['breadthVn100Pct']}% · phiên phân phối 25p: {st['ddCount']} · FTD gần nhất: {(MK.get('latestFtd') or {}).get('date')}"]
        for key in ("sentiment", "diffusion"):
            if MK.get(key):
                L.append(f"{'Tâm lý' if key=='sentiment' else 'Lan tỏa'}: " + " · ".join(
                    f"{g}: {v['score']} ({v['band']}, Δtuần {fmt_signed(v['chg_week'],0,'')}, Δtháng {fmt_signed(v['chg_month'],0,'')})"
                    for g, v in MK[key].items() if isinstance(v, dict)) + (f" · dẫn dắt: {MK[key].get('leader')}" if MK[key].get("leader") else ""))
    sg = M["signals"]
    L += ["", f"## Scorecard: {sg['total']:+d} / ±{sg['max']} → **{sg['verdict']}**", "| Nhóm | Điểm | Chi tiết |", "|---|---|---|"]
    for gr in sg["groups"]:
        coverage = sg["coverage"][gr["group"]]
        det = "; ".join(f"{c['check']}={c['value']} ({c['pt']:+d})" if c["available"]
                        else f"{c['check']}=— (không chấm)" for c in gr["checks"])
        det = f"{coverage['available']}/{coverage['total']} có dữ liệu · " + det
        L.append(f"| {gr['group']} | {gr['score']:+d} | {det} |")
    L.append("\nTổng phụ: " + " · ".join(f"{k} {v:+d}" for k, v in sg["subtotals"].items())
             + " (Kỹ thuật ±8, Cơ bản ±6, Bối cảnh ±2)")
    if V.get("pe", {}).get("avg3Y_distorted"):
        L.append("\n> ⚠️ P/E TB 3 năm bị méo bởi giai đoạn lợi nhuận đáy hoặc kỳ lỗ (TB ≤ 0, TB > 1.5× trung vị 10N hoặc > 1.3× trung vị 36 tháng) — dùng trung vị P/E dương và P/B để định giá.")
    if V.get("pb", {}).get("avg3Y_distorted"):
        L.append("\n> ⚠️ P/B TB 3 năm bị méo (TB > 1.5× trung vị 10N hoặc > 1.3× trung vị 36 tháng) — at_pb_avg3Y đã bỏ; dùng trung vị P/B 10N kèm ROE.")
    om = V.get("pb", {}).get("outlier_months") or []
    if om:
        ly = V["pb"].get("loss_years_near_outliers") or []
        cause = (f"năm lỗ {', '.join(ly)} ngay trước/trong giai đoạn này làm VCSH co lại nên P/B cao có thể là thật "
                 "(đối chiếu VCSH theo năm), cũng có thể là lỗi nguồn" if ly else "nghi lỗi dữ liệu nguồn (VCSH)")
        L.append(f"\n> ⚠️ P/B: {len(om)} tháng > 3× trung vị 10N ({om[0]} … {om[-1]}) — {cause}; "
                 "min–max và percentile 10N có chứa các tháng này.")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    main(*sys.argv[1:])
