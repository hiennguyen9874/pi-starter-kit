"""Offline regression tests. From the repo root:
uv run -q --with pandas --with numpy python -m unittest discover -s .pi/skills/stock/stock-analysis/tests -v
"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from analyze import bank_events, derived_fa, ytd_cumulative


PERIODS = ["2025Q1", "2025Q2", "2025Q3", "2025Q4", "2026Q1", "2026Q2", "2026Q3"]


def frame(**series):
    return pd.DataFrame(series, index=PERIODS, dtype=float)


def bank_fixture():
    return {
        "capital": frame(interbankFunding=[100, 110, 120, 130, 140, 150, 180],
                         totalCapital=[500] * 7),
        "asset": frame(depositsLoansToOtherCIs=[80, 90, 100, 110, 120, 130, 155],
                       otherAssets=[10, 10, 10, 10, 20, 30, 50], totalAssets=[500] * 7),
        "rateBadDebt": frame(nplPct=[2, 2, 2, 1.3, 1.8, 1.9, 2.1],
                             llrPct=[80, 80, 80, 90, 80, 70, 57]),
        "costStructure": frame(creditProvisionExpense=[90, 90, 90, 90, 90, 90, 89]),
        "businessResultQuarter": frame(netProfitParent=[100] * 7),
        "profitStructure": frame(profitBeforeProvision=[200] * 7),
        "businessResults": frame(netProfitParentTTM=[400] * 7),
        "loanStructureByQuality": frame(substandardLoans=[40, 40, 40, 20, 30, 30, 30],
                                        doubtfulLoans=[30, 30, 30, 20, 30, 30, 30],
                                        lossLoans=[30, 30, 30, 20, 40, 40, 40],
                                        loanLossProvision=[80, 80, 80, 54, 80, 70, 57]),
    }


class BankingChecks(unittest.TestCase):
    def test_empty_payload(self):
        self.assertEqual(bank_events({}), ([], []))
        self.assertEqual(ytd_cumulative({}, "bank"), {})
        self.assertEqual(derived_fa({}, "bank"), {})

    def test_bank_only_derived_fields(self):
        data = bank_fixture()
        bank = derived_fa(data, "bank")
        self.assertAlmostEqual(bank["interbankFundingSharePct"], 36)
        self.assertAlmostEqual(bank["interbankFundingShareChg4Qpp"], 12)
        self.assertAlmostEqual(bank["netInterbankBil"], 25)
        for structure in ("nonfinancial", "securities", "insurance"):
            other = derived_fa(data, structure)
            self.assertNotIn("interbankFundingSharePct", other)
            self.assertNotIn("netInterbankBil", other)

    def test_zero_or_missing_funding_denominator(self):
        for denominator in (0, np.nan):
            data = bank_fixture()
            data["capital"].loc["2026Q3", "totalCapital"] = denominator
            self.assertNotIn("interbankFundingSharePct", derived_fa(data, "bank"))

    def test_ytd_bank_scope_and_completeness(self):
        data = bank_fixture()
        for structure in (None, "nonfinancial", "securities", "insurance"):
            self.assertNotIn("creditProvisionExpense", ytd_cumulative(data, structure))
        ytd = ytd_cumulative(data, "bank")
        self.assertEqual(ytd["profitBeforeProvision"]["value"], 600)
        self.assertEqual(ytd["creditProvisionExpense"]["prev"], 270)
        data["costStructure"].loc["2025Q2", "creditProvisionExpense"] = np.nan
        self.assertNotIn("creditProvisionExpense", ytd_cumulative(data, "bank"))

    def test_small_provision_cut_is_quantified(self):
        events, _ = bank_events(bank_fixture())
        text = "\n".join(events)
        self.assertIn("0.8% LNST quý", text)
        self.assertIn("phần hỗ trợ nhỏ", text)

    def test_no_nan_profit_percentage(self):
        data = bank_fixture()
        data["businessResultQuarter"].loc["2026Q3", "netProfitParent"] = np.nan
        events, _ = bank_events(data)
        self.assertNotIn("nan%", "\n".join(events))

    def test_llr_sensitivity_is_not_forecast(self):
        events, _ = bank_events(bank_fixture())
        sensitivity = next(e for e in events if "độ nhạy:" in e)
        self.assertIn("33 tỷ dự phòng", sensitivity)
        self.assertIn("thuế 20%", sensitivity)
        self.assertIn("không phải dự báo hay nghĩa vụ", sensitivity)

    def test_llr_basis_mismatch_skips_sensitivity(self):
        data = bank_fixture()
        data["rateBadDebt"].loc["2026Q3", "llrPct"] = 120
        events, warnings = bank_events(data)
        self.assertFalse(any("độ nhạy:" in e for e in events))
        self.assertTrue(any("LLR nguồn không khớp" in w for w in warnings))

    def test_missing_bad_debt_is_not_zero(self):
        data = bank_fixture()
        data["loanStructureByQuality"].loc["2026Q3", "lossLoans"] = np.nan
        events, _ = bank_events(data)
        self.assertFalse(any("độ nhạy:" in e for e in events))

    def test_causality_is_a_hypothesis(self):
        events, _ = bank_events(bank_fixture())
        event = next(e for e in events if "nợ nhóm 3–5" in e and "có thể" in e)
        self.assertIn("cần thuyết minh", event)
        self.assertNotIn("thấp theo mùa", event)
        asset = next(e for e in events if "tài sản khác" in e)
        self.assertIn("chưa rõ cơ cấu", asset)


if __name__ == "__main__":
    unittest.main()
