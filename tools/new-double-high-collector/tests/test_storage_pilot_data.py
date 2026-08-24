import unittest
from pathlib import Path

from new_double_high_collector.baseline import Baseline


DATA = Path(__file__).parents[1] / "data" / "storage_pilot"


class StoragePilotDataTests(unittest.TestCase):
    def test_storage_pilot_has_one_verified_group_and_five_members(self):
        baseline = Baseline.load(DATA)
        self.assertEqual(baseline.validate(), [])
        self.assertEqual(len(baseline.institutions), 1)
        self.assertEqual(len(baseline.groups), 1)
        self.assertEqual(len(baseline.majors), 5)


if __name__ == "__main__":
    unittest.main()
