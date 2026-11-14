"""Shared loaders + indicators for the sstock stock-analysis pipeline.

Raw files live in <workdir>/raw/<job>.json as {tool, args, isError, data} (written by fetch_stock.js).
Units coming out of sstock (see references/sstock-tools.md):
  price/MA: nghìn đồng | values/foreign/marketCap in price rows: đồng | FA money: tỷ đồng | *Pct: %.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

BIL = 1e9  # đồng -> tỷ đồng


class Work:
    def __init__(self, workdir: str | Path):
        self.dir = Path(workdir)
        self.raw = self.dir / "raw"
        mf = self.dir / "manifest.json"
        self.manifest = json.loads(mf.read_text()) if mf.exists() else {}
        self.symbol = self.manifest.get("symbol")
        self.structure = self.manifest.get("structure", "nonfinancial")

    def load(self, name: str):
        p = self.raw / f"{name}.json"
        if not p.exists():
            return None
        j = json.loads(p.read_text())
        return None if j.get("isError") else j.get("data")


# ---------- shaping ----------
def period_label(p: dict) -> str:
    return f"{p['year']}" if p.get("quarter", 0) == 0 else f"{p['year']}Q{p['quarter']}"


def fa_frames(data: dict | None) -> dict[str, pd.DataFrame]:
    """FA payload -> {chartId: DataFrame(index=period label, columns=series)} (oldest -> newest)."""
    if not data:
        return {}
    idx = [period_label(p) for p in data["periods"]]
    out = {}
    for cid, series in (data.get("charts") or {}).items():
        if not isinstance(series, dict) or not series:
            continue
        cols = {k: v for k, v in series.items() if isinstance(v, list) and len(v) == len(idx)}
        if cols:
            out[cid] = pd.DataFrame(cols, index=idx, dtype="float64")
    return out


def fa_series(frames: dict[str, pd.DataFrame], name: str, prefer: str | None = None) -> pd.Series | None:
    if prefer and prefer in frames and name in frames[prefer]:
        return frames[prefer][name]
    for df in frames.values():
        if name in df:
            return df[name]
    return None


def price_frame(data: dict | None) -> pd.DataFrame:
    if not data or not data.get("rows"):
        return pd.DataFrame()
    df = pd.DataFrame(data["rows"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.drop_duplicates("date").sort_values("date").set_index("date")
    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def flow_frame(data: dict | None) -> pd.DataFrame:
    return price_frame(data)


def axis_series(dates: list, values: list, newest_first: bool = False) -> pd.Series:
    s = pd.Series(values, index=pd.to_datetime(dates), dtype="float64")
    return s.sort_index()


# ---------- indicators ----------
def sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).mean()


def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False).mean()


def rsi(s: pd.Series, n: int = 14) -> pd.Series:
    d = s.diff()
    up = d.clip(lower=0).ewm(alpha=1 / n, adjust=False).mean()
    dn = (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False).mean()
    rs = up / dn.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def macd(s: pd.Series, fast=12, slow=26, sig=9):
    line = ema(s, fast) - ema(s, slow)
    signal = ema(line, sig)
    return line, signal, line - signal


def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    # high/low/close are raw prices; scale to adjClose so splits/dividends don't spike the range
    k = df["adjClose"] / df["close"]
    h, l, c = df["high"] * k, df["low"] * k, df["adjClose"]
    tr = pd.concat([h - l, (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False).mean()


def ret(s: pd.Series, n: int) -> float | None:
    s = s.dropna()
    if len(s) <= n:
        return None
    return float(s.iloc[-1] / s.iloc[-1 - n] - 1) * 100


def ytd(s: pd.Series) -> float | None:
    s = s.dropna()
    prev = s[s.index.year < s.index[-1].year]
    if prev.empty:
        return None
    return float(s.iloc[-1] / prev.iloc[-1] - 1) * 100


def max_drawdown(s: pd.Series) -> float:
    s = s.dropna()
    return float((s / s.cummax() - 1).min() * 100)


def percentile_of(hist: pd.Series, x: float | None) -> float | None:
    h = hist.dropna()
    if x is None or h.empty or (isinstance(x, float) and math.isnan(x)):
        return None
    return float((h < x).mean() * 100)


def pct_change(new, old):
    if new is None or old is None or old == 0 or any(isinstance(v, float) and math.isnan(v) for v in (new, old)):
        return None
    return (new / old - 1) * 100 * (1 if old > 0 else -1)


def clean(x, nd=2):
    """JSON-safe rounding (NaN -> None)."""
    if x is None:
        return None
    if isinstance(x, (np.floating, float)):
        return None if math.isnan(x) or math.isinf(x) else round(float(x), nd)
    if isinstance(x, np.bool_):
        return bool(x)
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, dict):
        return {k: clean(v, nd) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [clean(v, nd) for v in x]
    return x


def fmt(x, nd=1, suffix=""):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    return f"{x:,.{nd}f}{suffix}"


def fmt_signed(x, nd=1, suffix="%"):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return "—"
    return f"{x:+,.{nd}f}{suffix}"
