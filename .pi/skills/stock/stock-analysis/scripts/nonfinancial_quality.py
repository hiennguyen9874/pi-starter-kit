"""Quarter-aligned cash conversion, working capital and earnings bridges (nonfinancial only)."""
import math

import pandas as pd


def cash_and_earnings(frames, period):
    """Missing quarters/values stay missing; no zero-fill or vendor TTM substitution."""
    end = pd.Period(period, freq="Q")
    periods = pd.period_range(end=end, periods=9, freq="Q").astype(str)

    def series(chart, key):
        df = frames.get(chart)
        return df[key].reindex(periods) if df is not None and key in df else pd.Series(float("nan"), index=periods)

    def finite(value):
        return pd.notna(value) and math.isfinite(value)

    def put(name, value):
        if finite(value):
            result[name] = float(value)

    def ratio(a, b):
        return a / b if finite(b) and b > 0 else float("nan")

    def ttm(s, lag=0):
        window = s.iloc[-4-lag:len(s)-lag]
        return window.sum(min_count=4) if all(map(finite, window)) else float("nan")

    def days(balance, flow, lag):
        # Average of five quarter-end balances covers both endpoints of the four-quarter flow.
        stocks = balance.iloc[-5-lag:len(balance)-lag]
        return 365 * ratio(stocks.mean(skipna=False), ttm(flow, lag))

    result = {}
    cfo, investing = (series("cashFlow", k) for k in ("operating", "investing"))
    profit = series("businessResultQuarter", "netProfitParent")
    sales = series("businessResultQuarter", "netRevenue")
    cogs = series("costStructure", "cogs")
    # API variants may encode costs as consistently negative; mixed signs need review.
    obs = cogs.dropna()
    if not obs.empty and (obs <= 0).all():
        cogs = -cogs
    elif (obs < 0).any():
        cogs = cogs.where(cogs >= 0)
    put("ocfTTM", ttm(cfo))
    put("priorOcfTTM", ttm(cfo, 4))
    put("investingTTM", ttm(investing))
    put("cashFlowAfterInvestingTTM", ttm(cfo) + ttm(investing))
    put("ocfToNetProfitTTM", ratio(ttm(cfo), ttm(profit)))
    put("priorOcfToNetProfitTTM", ratio(ttm(cfo, 4), ttm(profit, 4)))
    inv, ar = (series("asset", k) for k in ("inventory", "receivables"))
    for balance, flow, label in ((inv, cogs, "inventoryDaysProxy"), (ar, sales, "receivableDaysProxy")):
        current, prior = days(balance, flow, 0), days(balance, flow, 4)
        put(label, current)
        put(label + "YoYDelta", current - prior)
    put("inventoryVsRevenueGrowthGapPp", 100 * (ratio(inv.iloc[-1], inv.iloc[-5]) - ratio(ttm(sales), ttm(sales, 4))))
    for key, label in (("inventory", "inventory"), ("receivables", "receivables")):
        s = series("asset", key)
        put(label + "ChangeQoQ", s.iloc[-1] - s.iloc[-2])
    ebt = series("ebitda", "ebt")
    for s, label in ((ebt - profit, "ebtToParentProfitResidual"),
                     (series("profitStructure", "operatingProfit"), "operatingProfit"),
                     (series("profitStructure", "financialProfit"), "financialProfit"),
                     (ebt, "ebt")):
        put(label + "Q", s.iloc[-1])
        put(label + "QYoYDelta", s.iloc[-1] - s.iloc[-5])
    return result
