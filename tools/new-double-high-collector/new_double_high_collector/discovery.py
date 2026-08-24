from html.parser import HTMLParser
from pathlib import PurePosixPath
from urllib.parse import unquote, urljoin, urlsplit

from .models import Candidate


ATTACHMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}


def _host_allowed(host: str, official_hosts: set[str]) -> bool:
    normalized = host.lower().rstrip(".")
    return any(
        normalized == allowed.lower().rstrip(".")
        or normalized.endswith("." + allowed.lower().rstrip("."))
        for allowed in official_hosts
    )


class _LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.text_parts: list[str] = []
        self.links: list[tuple[str, str]] = []
        self._in_title = False
        self._href: str | None = None
        self._anchor_parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "title":
            self._in_title = True
        if tag.lower() == "a":
            self._href = dict(attrs).get("href")
            self._anchor_parts = []

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_title = False
        if tag.lower() == "a" and self._href:
            self.links.append((self._href, "".join(self._anchor_parts).strip()))
            self._href = None
            self._anchor_parts = []

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        self.text_parts.append(text)
        if self._in_title:
            self.title_parts.append(text)
        if self._href is not None:
            self._anchor_parts.append(text)


def discover_from_html(
    group_id: str,
    major_code: str,
    page_url: str,
    html: str,
    official_hosts: set[str],
) -> list[Candidate]:
    parser = _LinkParser()
    parser.feed(html)
    title = " ".join(parser.title_parts)
    page_text = " ".join(parser.text_parts)
    candidates: list[Candidate] = []
    seen: set[str] = set()
    for href, link_text in parser.links:
        if not href or href.lower().startswith(("javascript:", "mailto:", "tel:")):
            continue
        download_url = urljoin(page_url, href)
        parsed = urlsplit(download_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            continue
        if not _host_allowed(parsed.hostname, official_hosts):
            continue
        filename = unquote(PurePosixPath(parsed.path).name)
        if PurePosixPath(filename.lower()).suffix not in ATTACHMENT_EXTENSIONS:
            continue
        if download_url in seen:
            continue
        seen.add(download_url)
        candidates.append(
            Candidate(
                group_id=group_id,
                major_code=major_code,
                title=title,
                link_text=link_text,
                filename=filename,
                page_text=page_text,
                source_page_url=page_url,
                download_url=download_url,
            )
        )
    return candidates
