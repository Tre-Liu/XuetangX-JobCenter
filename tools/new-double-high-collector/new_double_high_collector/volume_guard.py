import hashlib
import json
import os
import shutil
import subprocess
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional


SMOKE_BYTES = b"renpei-volume-smoke-test\n"
MARKER_NAME = ".renpei-volume-id"


class VolumeDisconnected(RuntimeError):
    """The configured external volume is no longer the initialized device."""


class DiskSpaceStop(RuntimeError):
    """The configured volume has less free space than the safety floor."""


@dataclass(frozen=True)
class VolumeIdentity:
    marker: str
    st_dev: int
    mount_path: str


def ensure_disk_space(path: Path, minimum_free_bytes: int) -> None:
    usage = shutil.disk_usage(path)
    if usage.free < minimum_free_bytes:
        raise DiskSpaceStop(
            f"free space {usage.free} is below safety floor {minimum_free_bytes}"
        )


def notify_macos(message: str) -> None:
    safe_message = message.replace('"', "'")
    script = (
        f'display notification "{safe_message}" '
        'with title "新双高人培采集器" sound name "Basso"'
    )
    subprocess.run(
        ["osascript", "-e", script],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


class VolumeGuard:
    def __init__(
        self,
        volume_root: Path,
        alert_path: Path,
        notifier: Optional[Callable[[str], None]] = None,
    ) -> None:
        self.volume_root = volume_root
        self.alert_path = alert_path
        self.notifier = notifier or notify_macos
        self.identity: Optional[VolumeIdentity] = None
        self._alerted = False

    @property
    def marker_path(self) -> Path:
        return self.volume_root / MARKER_NAME

    def initialize(self) -> VolumeIdentity:
        if not self.volume_root.is_dir():
            raise VolumeDisconnected(f"volume path is unavailable: {self.volume_root}")
        if not self.marker_path.exists():
            marker = str(uuid.uuid4())
            with self.marker_path.open("x", encoding="utf-8") as stream:
                stream.write(marker + "\n")
                stream.flush()
                os.fsync(stream.fileno())
        marker = self.marker_path.read_text(encoding="utf-8").strip()
        if not marker:
            raise VolumeDisconnected("volume marker is empty")
        self.identity = VolumeIdentity(
            marker=marker,
            st_dev=self.volume_root.stat().st_dev,
            mount_path=str(self.volume_root),
        )
        self._alerted = False
        return self.identity

    def check(self) -> None:
        if self.identity is None:
            raise RuntimeError("volume guard must be initialized before checking")
        try:
            if not self.volume_root.is_dir():
                self._disconnect("volume path disappeared")
            current_device = self.volume_root.stat().st_dev
            if current_device != self.identity.st_dev:
                self._disconnect(
                    f"device changed from {self.identity.st_dev} to {current_device}"
                )
            if not self.marker_path.is_file():
                self._disconnect("volume marker disappeared")
            marker = self.marker_path.read_text(encoding="utf-8").strip()
            if marker != self.identity.marker:
                self._disconnect("volume marker changed")
        except VolumeDisconnected:
            raise
        except OSError as error:
            self._disconnect(f"volume access failed: {error}")

    def smoke_test(self) -> str:
        self.check()
        part_path = self.volume_root / ".renpei-smoke-test.part"
        final_path = self.volume_root / ".renpei-smoke-test"
        try:
            with part_path.open("wb") as stream:
                stream.write(SMOKE_BYTES)
                stream.flush()
                os.fsync(stream.fileno())
            self.check()
            os.replace(part_path, final_path)
            digest = hashlib.sha256(final_path.read_bytes()).hexdigest()
            if digest != hashlib.sha256(SMOKE_BYTES).hexdigest():
                raise OSError("smoke-test hash mismatch")
            return digest
        finally:
            for path in (part_path, final_path):
                try:
                    path.unlink()
                except FileNotFoundError:
                    pass

    def _disconnect(self, reason: str) -> None:
        message = f"外接硬盘已断联，采集已安全停止：{reason}"
        if not self._alerted:
            self._alerted = True
            self.alert_path.parent.mkdir(parents=True, exist_ok=True)
            event = {
                "event_type": "storage_disconnected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "volume_path": str(self.volume_root),
                "reason": reason,
            }
            with self.alert_path.open("a", encoding="utf-8") as stream:
                stream.write(json.dumps(event, ensure_ascii=False) + "\n")
            print(message, file=sys.stderr, flush=True)
            try:
                self.notifier(message)
            except Exception as error:  # notification cannot mask storage safety
                print(f"macOS通知失败：{error}", file=sys.stderr, flush=True)
        raise VolumeDisconnected(message)
