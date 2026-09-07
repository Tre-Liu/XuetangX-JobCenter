import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from new_double_high_collector.volume_guard import (
    DiskSpaceStop,
    VolumeDisconnected,
    VolumeGuard,
    ensure_disk_space,
)


class VolumeGuardTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.volume = self.root / "volume"
        self.volume.mkdir()
        self.alerts = self.root / "runtime" / "alerts.jsonl"
        self.notifications = []

    def tearDown(self):
        self.tempdir.cleanup()

    def test_initializes_persistent_marker_and_identity(self):
        guard = VolumeGuard(
            self.volume,
            self.alerts,
            notifier=self.notifications.append,
        )

        identity = guard.initialize()

        marker_path = self.volume / ".renpei-volume-id"
        self.assertTrue(marker_path.exists())
        self.assertEqual(marker_path.read_text(encoding="utf-8").strip(), identity.marker)
        self.assertEqual(identity.st_dev, self.volume.stat().st_dev)
        self.assertEqual(identity.mount_path, str(self.volume))

    def test_rejects_same_path_on_different_device(self):
        guard = VolumeGuard(
            self.volume,
            self.alerts,
            notifier=self.notifications.append,
        )
        guard.initialize()
        original_stat = Path.stat

        def changed_stat(path):
            value = original_stat(path)
            if path == self.volume:
                return SimpleNamespace(st_dev=value.st_dev + 1, st_mode=value.st_mode)
            return value

        with mock.patch.object(Path, "stat", autospec=True, side_effect=changed_stat):
            with self.assertRaises(VolumeDisconnected):
                guard.check()

    def test_disconnect_writes_local_alert_and_notifies(self):
        guard = VolumeGuard(
            self.volume,
            self.alerts,
            notifier=self.notifications.append,
        )
        guard.initialize()
        (self.volume / ".renpei-volume-id").unlink()

        with self.assertRaises(VolumeDisconnected):
            guard.check()

        events = [
            json.loads(line)
            for line in self.alerts.read_text(encoding="utf-8").splitlines()
        ]
        self.assertEqual(events[-1]["event_type"], "storage_disconnected")
        self.assertEqual(len(self.notifications), 1)
        self.assertIn("外接硬盘已断联", self.notifications[0])

    def test_notification_failure_does_not_hide_disconnect(self):
        def broken_notifier(_message):
            raise OSError("notification unavailable")

        guard = VolumeGuard(self.volume, self.alerts, notifier=broken_notifier)
        guard.initialize()
        (self.volume / ".renpei-volume-id").write_text("wrong", encoding="utf-8")

        with self.assertRaises(VolumeDisconnected):
            guard.check()

        self.assertIn("storage_disconnected", self.alerts.read_text(encoding="utf-8"))

    def test_disk_guard_stops_below_thirty_gib(self):
        with mock.patch(
            "shutil.disk_usage",
            return_value=SimpleNamespace(total=100, used=80, free=20 * 1024**3),
        ):
            with self.assertRaises(DiskSpaceStop):
                ensure_disk_space(self.volume, 30 * 1024**3)

    def test_smoke_test_writes_renames_hashes_and_removes_file(self):
        guard = VolumeGuard(
            self.volume,
            self.alerts,
            notifier=self.notifications.append,
        )
        guard.initialize()

        digest = guard.smoke_test()

        self.assertEqual(
            digest,
            "2ff621f1ab51a3bd712542d51e00d5848220e8882b3079132e1cb9e2ced6bbf1",
        )
        self.assertFalse(any(path.name.startswith(".renpei-smoke") for path in self.volume.iterdir()))


if __name__ == "__main__":
    unittest.main()
