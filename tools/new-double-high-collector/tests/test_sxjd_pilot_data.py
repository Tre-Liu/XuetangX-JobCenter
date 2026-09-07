import unittest
from pathlib import Path

from new_double_high_collector.baseline import Baseline


DATA = Path(__file__).parents[1] / "data" / "live_pilot_sxjd"


class SxjdPilotDataTests(unittest.TestCase):
    def test_live_pilot_is_a_valid_four_major_group(self):
        baseline = Baseline.load(DATA)
        self.assertEqual(baseline.validate(), [])
        self.assertEqual(len(baseline.institutions), 1)
        self.assertEqual(len(baseline.groups), 1)
        self.assertEqual(len(baseline.majors), 4)


if __name__ == "__main__":
    unittest.main()
