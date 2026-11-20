"""Reconcile nonfinancial cash flow without assuming which vendor period is wrong."""
from datetime import date
import json
import math
import re

import pandas as pd

FIELDS = ("operating", "investing", "financing")
LABELS = {"operating": "CFO", "investing": "LCTT đầu tư", "financing": "LCTT tài chính"}
# VND billions; an investigation threshold, not accounting materiality.
ABS_TOL, REL_TOL = 1.0, 0.02


def fiscal_crosscheck(quarterly, annual, latest):
    """Compare like-named fields in complete calendar fiscal years, retaining audit values."""
    q, y = quarterly.get("cashFlow"), annual.get("cashFlow")
    end = pd.Period(latest, freq="Q")
    windows = {"currentTTM": pd.period_range(end=end, periods=4, freq="Q"),
               "priorTTM": pd.period_range(end=end-4, periods=4, freq="Q")}
    checks = []
    if q is not None and y is not None and q.index.is_unique and y.index.is_unique:
        for label in y.index:
            if not re.fullmatch(r"\d{4}", label) or int(label) > end.year:
                continue
            if int(label) == end.year and end.quarter < 4:
                continue
            periods = [f"{label}Q{i}" for i in range(1, 5)]
            for field in FIELDS:
                if field not in q or field not in y:
                    continue
                values, annual_value = q[field].reindex(periods), y.at[label, field]
                if not (all(map(math.isfinite, values)) and math.isfinite(annual_value)):
                    continue
                total = float(values.sum())
                delta = total - annual_value
                tolerance = max(ABS_TOL, REL_TOL * max(abs(total), abs(annual_value)))
                checks.append(dict(year=int(label), field=field, sumQuarter=total, annual=annual_value,
                                   delta=delta, tolerance=tolerance, mismatch=abs(delta) > tolerance))
    return {"checks": checks, "suspect": {name: sorted({c["field"] for c in checks if c["mismatch"]
             and c["year"] in {p.year for p in periods}}) for name, periods in windows.items()}}


def evidence_bridge(path, symbol, latest, as_of):
    """Use manually sourced, consistently scoped YTD values. No imputation or fuzzy date matching."""
    if not path.exists():
        return None
    try:
        src = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(src, dict) or not symbol or src["symbol"] != symbol or src["unit"] != "bil" or src["scope"] not in ("separate", "consolidated"):
            raise ValueError("symbol/unit/scope không khớp")
        if not isinstance(src["basis"], str) or not src["basis"].strip():
            raise ValueError("thiếu basis")
        cutoff = date.fromisoformat(as_of)
        end = pd.Period(latest, freq="Q")
        rows = src["periods"]
        if not isinstance(rows, dict) or not rows:
            raise ValueError("thiếu periods")
        allowed = (*FIELDS, "netProfit", "capex")
        for key, row in rows.items():
            if not re.fullmatch(r"\d{4}Q[1-4]", key) or not isinstance(row, dict):
                raise ValueError(f"kỳ không hợp lệ: {key}")
            published = date.fromisoformat(row["publishedDate"])
            if not pd.Period(key, freq="Q").end_time.date() <= published <= cutoff:
                raise ValueError(f"{key}: ngày công bố ngoài phạm vi phiên chốt")
            if not isinstance(row["source"], str) or not row["source"].strip():
                raise ValueError(f"{key}: thiếu URL/tên file và trang")
            for field in allowed:
                v = row.get(field)
                if v is not None and (type(v) not in (int, float) or not math.isfinite(v) or (field == "capex" and v < 0)):
                    raise ValueError(f"{key}.{field}: cần số hữu hạn; capex là chi dương")
        if latest not in rows:
            raise ValueError(f"thiếu kỳ mới nhất {latest}")

        def bridge(parts):
            return {f: sum(rows[p][f] * sign for p, sign in parts) for f in allowed
                    if all(rows.get(p, {}).get(f) is not None for p, _ in parts)}

        def quarter(p):
            return bridge([(str(p), 1)] + ([(str(p-1), -1)] if p.quarter > 1 else []))

        def ttm(p):
            parts = [(str(p), 1)]
            if p.quarter < 4:
                parts += [(f"{p.year-1}Q4", 1), (str(p-4), -1)]
            return bridge(parts)

        return {"scope": src["scope"], "basis": src["basis"], "sources": rows,
                "currentYTD": bridge([(latest, 1)]), "priorYTD": bridge([(str(end-4), 1)]),
                "currentQ": quarter(end), "priorQ": quarter(end-4),
                "currentTTM": ttm(end), "priorTTM": ttm(end-4)}
    except (ValueError, TypeError, KeyError, OverflowError) as exc:
        return {"error": str(exc)}


def reconcile_cash(metrics, reconciliation, evidence=None):
    """Keep suspect vendor metrics in audit output, not the score input. Mix no source scopes."""
    suspect = reconciliation["suspect"]
    quarantined = {}
    sources = {}
    definitions = {
        "ocfTTM": ("currentTTM", {"operating"}, lambda s: s.get("operating")),
        "priorOcfTTM": ("priorTTM", {"operating"}, lambda s: s.get("operating")),
        "investingTTM": ("currentTTM", {"investing"}, lambda s: s.get("investing")),
        "cashFlowAfterInvestingTTM": ("currentTTM", {"operating", "investing"},
                                      lambda s: s["operating"] + s["investing"] if "operating" in s and "investing" in s else None),
        "ocfToNetProfitTTM": ("currentTTM", {"operating"}, lambda s: ratio(s)),
        "priorOcfToNetProfitTTM": ("priorTTM", {"operating"}, lambda s: ratio(s)),
    }

    def ratio(s):
        return s["operating"] / s["netProfit"] if "operating" in s and (s.get("netProfit") or 0) > 0 else None

    for key, (window, fields, compute) in definitions.items():
        sample = (evidence or {}).get(window, {})
        value = compute(sample)
        if value is not None or fields.intersection(suspect[window]) or fields.intersection(sample):
            if key in metrics:
                quarantined[key] = metrics.pop(key)
        if value is not None:
            metrics[key] = value
            sources[key] = "company_ytd"
        elif key in metrics:
            sources[key] = "sstock_quarterly"
    sample = (evidence or {}).get("currentTTM", {})
    if "operating" in sample and "capex" in sample:
        metrics["cashFlowLessCapexTTM"] = sample["operating"] - sample["capex"]
        sources["cashFlowLessCapexTTM"] = "company_ytd"
    reconciliation.update(vendorExcluded=quarantined, metricSources=sources)
    if evidence is not None:
        reconciliation["companyEvidence"] = evidence
