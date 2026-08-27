import hashlib
import mimetypes
import os
import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, UnidentifiedImageError

from .models import DownloadRecord
from .volume_guard import VolumeGuard


MAX_FILE_SIZE = 200 * 1024 * 1024
OLE_MAGIC = bytes.fromhex("D0CF11E0A1B11AE1")


class FileSignatureMismatch(RuntimeError):
    """Downloaded bytes do not match the claimed office document type."""


class FileTooLarge(RuntimeError):
    """Downloaded file exceeds the 200 MB safety limit."""


@dataclass(frozen=True)
class StoreContext:
    record_id: str
    group_id: str
    province: str
    institution_code: str
    institution_name: str
    group_name: str
    major_code: str
    major_name: str
    grade_year: str
    document_title: str
    source_page_url: str
    download_url: str
    published_at: str
    fetched_at: str
    verification_status: str
    notes: str = ""


def image_sequence_to_pdf(pages: list[bytes]) -> bytes:
    """Assemble ordered page images into a visually faithful PDF derivative."""
    if not pages:
        raise ValueError("image sequence is empty")
    images: list[Image.Image] = []
    try:
        for page in pages:
            try:
                source = Image.open(BytesIO(page))
                source.load()
            except (OSError, UnidentifiedImageError) as error:
                raise FileSignatureMismatch("page image is invalid") from error
            images.append(source.convert("RGB"))
            source.close()
        output = BytesIO()
        images[0].save(
            output,
            format="PDF",
            save_all=True,
            append_images=images[1:],
            resolution=150.0,
            quality=95,
            subsampling=0,
        )
        return output.getvalue()
    finally:
        for image in images:
            image.close()


def _sanitize(value: str) -> str:
    cleaned = re.sub(r"[\\/\x00:]", "_", value).strip().strip(".")
    return cleaned or "未命名"


def _validate_signature(filename: str, data: bytes) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf" and not data.startswith(b"%PDF-"):
        raise FileSignatureMismatch("PDF magic is missing")
    if suffix in {".doc", ".xls"} and not data.startswith(OLE_MAGIC):
        raise FileSignatureMismatch("OLE compound-file magic is missing")
    if suffix in {".docx", ".xlsx"} and not data.startswith(b"PK\x03\x04"):
        raise FileSignatureMismatch("OOXML ZIP magic is missing")
    if suffix not in {".pdf", ".doc", ".docx", ".xls", ".xlsx"}:
        raise FileSignatureMismatch(f"unsupported extension: {suffix}")


def store_bytes(
    context: StoreContext,
    data: bytes,
    filename: str,
    root: Path,
    guard: VolumeGuard,
) -> DownloadRecord:
    guard.check()
    if len(data) > MAX_FILE_SIZE:
        raise FileTooLarge(f"file is {len(data)} bytes")
    safe_filename = _sanitize(filename)
    _validate_signature(safe_filename, data)
    digest = hashlib.sha256(data).hexdigest()
    relative_dir = Path("documents") / _sanitize(context.province)
    relative_dir /= _sanitize(
        f"{context.institution_code}_{context.institution_name}"
    )
    relative_dir /= _sanitize(context.group_name)
    relative_dir /= _sanitize(f"{context.major_code}_{context.major_name}")
    target_dir = root / relative_dir
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / safe_filename
    if target.exists():
        existing_digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if existing_digest != digest:
            target = target.with_name(
                f"{target.stem}__{digest[:8]}{target.suffix.lower()}"
            )
    part = target.with_name(target.name + ".part")
    if not target.exists():
        with part.open("wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        guard.check()
        os.replace(part, target)
    relative_path = str(target.relative_to(root))
    content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return DownloadRecord(
        record_id=context.record_id,
        group_id=context.group_id,
        major_code=context.major_code,
        major_name=context.major_name,
        grade_year=context.grade_year,
        document_title=context.document_title,
        source_page_url=context.source_page_url,
        download_url=context.download_url,
        source_domain=urlsplit(context.download_url).hostname or "",
        published_at=context.published_at,
        fetched_at=context.fetched_at,
        content_type=content_type,
        file_size_bytes=len(data),
        sha256=digest,
        relative_path=relative_path,
        version_status="current",
        verification_status=context.verification_status,
        notes=context.notes,
    )
