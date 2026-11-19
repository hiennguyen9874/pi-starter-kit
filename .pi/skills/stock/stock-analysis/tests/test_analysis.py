"""Offline regressions. Use the pipeline dependencies to include chart tests."""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from analyze import corporate_actions, derived_fa, scorecard
from nonfinancial_quality import cash_and_earnings
from sstock_lib import benchmark_prices, ret, valuation_at_close, valuation_series


class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.q = pd.period_range("2022Q1", periods=9, freq="Q").astype(str)
        self.frames = {}
        for key, vals in {
            "cashFlow": {"operating": 25, "investing": -4},
            "businessResultQuarter": {"netProfitParent": 20, "netRevenue": 100},
            "costStructure": {"cogs": -50},
            "asset": {"inventory": 50, "receivables": 40},
            "ebitda": {"ebt": 30},
        }.items():
            self.frames[key] = pd.DataFrame(vals, index=self.q)

    def test_complete_cash_and_earnings(self):
        d = cash_and_earnings(self.frames, self.q[-1])
        self.assertEqual(d["ocfToNetProfitTTM"], 1.25)
        self.assertEqual(d["priorOcfToNetProfitTTM"], 1.25)
        self.assertEqual(d["cashFlowAfterInvestingTTM"], 84)
        self.assertEqual(d["inventoryDaysProxy"], 91.25)
        self.assertEqual(d["ebtToParentProfitResidualQ"], 10)

    def test_missing_quarter_and_loss(self):
        self.frames["cashFlow"] = self.frames["cashFlow"].drop(self.q[-2])
        d = cash_and_earnings(self.frames, self.q[-1])
        self.assertNotIn("ocfTTM", d)
        self.assertNotIn("cashFlowAfterInvestingTTM", d)
        self.assertEqual(d["priorOcfToNetProfitTTM"], 1.25)
        self.frames["cashFlow"] = pd.DataFrame({"operating": -10}, index=self.q)
        self.frames["businessResultQuarter"]["netProfitParent"] = -20
        d = cash_and_earnings(self.frames, self.q[-1])
        self.assertEqual(d["ocfTTM"], -40)
        self.assertNotIn("ocfToNetProfitTTM", d)

    def test_nonfinancial_scope(self):
        for structure in ("bank", "securities", "insurance"):
            self.assertNotIn("inventoryDaysProxy", derived_fa(self.frames, structure))

    def test_common_dates(self):
        dates = pd.date_range("2025-01-01", periods=255)
        stock = pd.Series(range(100, 355), index=dates).drop(dates[2])
        market = pd.Series(range(200, 455), index=dates).drop(dates[4])
        j = benchmark_prices(stock, market).tail(253)
        self.assertEqual(len(j), 253)
        self.assertEqual(j.index[0], dates[0])
        self.assertEqual(j.index[-1], dates[-1])
        self.assertAlmostEqual(ret(j["stock"], 252), 254)
        self.assertAlmostEqual(ret(j["market"], 252), 127)

    def test_valuation_history_excludes_post_close_month(self):
        monthly = {
            "dates": ["2026-10-30", "2026-11-18", "2026-11-19"],
            "charts": {"pe": {"pe": [6, 7, 50], "avg3YPe": [8, 9, 40]}},
        }
        self.assertEqual(valuation_series(monthly, "pe", "2026-11-18").tolist(), [6, 7])
        self.assertEqual(valuation_series(monthly, "pe", "2026-11-18", "avg3YPe").tolist(), [8, 9])
        self.assertTrue(valuation_series(monthly, "pe", None).empty)

    def test_valuation_requires_exact_daily_point(self):
        daily = {
            "dates": ["2026-11-17", "2026-11-18", "2026-11-19"],
            "snapshot": {"pe": 5, "pb": 2},
            "charts": {"pe": {"pe": [7, 6.3, 5.8]}, "pb": {"pb": [2, None, 1.8]}},
        }
        self.assertEqual(valuation_at_close(daily, "pe", "2026-11-18"), 6.3)
        self.assertIsNone(valuation_at_close(daily, "pb", "2026-11-18"))
        self.assertIsNone(valuation_at_close(daily, "pe", "2026-11-20"))
        self.assertIsNone(valuation_at_close(None, "pe", "2026-11-18"))

    def test_unconfirmed_rights(self):
        px = pd.DataFrame({"close": [40, 36], "adjClose": [36, 36]}, index=pd.date_range("2026-01-01", periods=2))
        self.assertIn("chưa phân loại", corporate_actions(px)[0]["kind"])

    def test_negative_pe_receives_no_cheapness_credit(self):
        metrics = dict(price={}, flows={}, rs={}, elite={}, fa={}, market={}, sector={},
                       meta={"structure": "nonfinancial"}, valuation={"pe": {"current": -5, "median10y": 10}})
        self.assertEqual(scorecard(metrics)["total"], 0)


@unittest.skipUnless(all(importlib.util.find_spec(p) for p in ("matplotlib", "seaborn")), "chart dependencies not installed")
class ChartTests(unittest.TestCase):
    def test_missing_rrg_still_writes_named_placeholder(self):
        import charts

        with tempfile.TemporaryDirectory() as wd, patch.object(charts, "save", wraps=charts.save) as save:
            charts.main(wd)
            rrg, = [call.args[0] for call in save.call_args_list if call.args[2] == "08_rrg.png"]
            self.assertTrue((Path(wd) / "charts" / "08_rrg.png").stat().st_size)
            self.assertIn("sector_rrg / peers_rrg / stock_rrg", rrg.axes[0].texts[0].get_text())


if __name__ == "__main__":
    unittest.main()
