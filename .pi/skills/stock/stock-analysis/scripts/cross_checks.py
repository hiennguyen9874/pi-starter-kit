"""Fiscal-window and valuation-basis checks shared by stock analyses."""
import math

import pandas as pd

from sstock_lib import fa_series, pct_change, valuation_at_close


def sector_fundamentals(stock, sector, period):
    """Require same ending quarter and contiguous windows; never join away gaps."""
    periods = pd.period_range(end=period, periods=8, freq="Q").astype(str)
    out = {}
    for name in ("netRevenue", "netProfitParent", "totalOperatingIncome", "operatingRevenue",
                 "grossMarginPct", "netMarginPct", "grossMarginTTMPct", "netMarginTTMPct"):
        a, b = (fa_series(f, name) for f in (stock, sector))
        if a is None or b is None or not a.index.is_unique or not b.index.is_unique:
            continue
        a, b = a.reindex(periods), b.reindex(periods)
        if name.endswith("Pct"):
            if all(map(math.isfinite, (a.iloc[-1], b.iloc[-1]))):
                out[f"stock_{name}"], out[f"sector_{name}"] = a.iloc[-1], b.iloc[-1]
            continue
        current = [s.iloc[-4:].sum() for s in (a, b)]
        if not all(map(math.isfinite, (*a.iloc[-4:], *b.iloc[-4:]))):
            continue
        if current[1] > 0:
            out[f"{name}_share_ttm_pct"] = 100 * current[0] / current[1]
        if all(map(math.isfinite, (*a, *b))):
            for label, s, now in zip(("stock", "sector"), (a, b), current):
                value = pct_change(now, s.iloc[:4].sum())
                if value is not None:
                    out[f"{label}_{name}_ttm_yoy_pct"] = value
    return out


def book_basis_check(daily, as_of, price, fa, snapshot):
    """Screen approximate equity against dated BVPS; do not substitute into the vendor history."""
    period = fa.get("latest_period")
    bvps = valuation_at_close(daily, "pb", as_of, field="bvps")
    eq, capital, shares = (fa.get("derived", {}).get("equityApprox"), fa.get("charterCapital_latest"),
                           snapshot.get("sharesOutstanding"))
    if not period or not as_of or not all(isinstance(v, (int, float)) and math.isfinite(v) and v > 0
                                          for v in (bvps, eq, capital, shares, price)):
        return None
    # Only test the approximation if the share count and same-quarter charter capital align at 10,000 VND par.
    if pd.Period(period, freq="Q").end_time.date() > pd.Timestamp(as_of).date() or abs(shares / (capital * 1e5) - 1) > 0.01:
        return None
    approx = eq * 1e9 / shares
    gap = (bvps / approx - 1) * 100
    return {"period": period, "date": as_of, "vendorBvpsDong": bvps, "approxBvpsDong": approx,
            "approxPb": price * 1000 / approx, "gapPct": gap, "mismatch": abs(gap) >= 10}
