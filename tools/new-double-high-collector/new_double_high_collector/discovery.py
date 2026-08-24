from html.parser import HTMLParser
from pathlib import PurePosixPath
from urllib.parse import parse_qs, unquote, urljoin, urlsplit

from .models import Candidate


ATTACHMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
DISCOVERY_KEYWORDS = ("人才培养方案", "培养方案", "2025级", "2025版")


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
        self.embedded_resources: list[str] = []
        self._in_title = False
        self._href: str | None = None
        self._anchor_parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag.lower() == "title":
            self._in_title = True
        if tag.lower() == "a":
            self._href = attributes.get("href")
            self._anchor_parts = []
        if tag.lower() in {"iframe", "embed"} and attributes.get("src"):
            self.embedded_resources.append(attributes["src"])
        if tag.lower() == "object" and attributes.get("data"):
            self.embedded_resources.append(attributes["data"])

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
    resources = parser.links + [(url, "") for url in parser.embedded_resources]
    for href, link_text in resources:
        if not href or href.lower().startswith(("javascript:", "mailto:", "tel:")):
            continue
        download_url = urljoin(page_url, href)
        parsed = urlsplit(download_url)
        if not link_text and parsed.path.lower().endswith("viewer.html"):
            embedded_file = parse_qs(parsed.query).get("file", [""])[0]
            if embedded_file:
                download_url = urljoin(download_url, embedded_file)
                parsed = urlsplit(download_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            continue
        if not _host_allowed(parsed.hostname, official_hosts):
            continue
        url_filename = unquote(PurePosixPath(parsed.path).name)
        link_filename = unquote(link_text).strip()
        if PurePosixPath(url_filename.lower()).suffix in ATTACHMENT_EXTENSIONS:
            filename = url_filename
        elif PurePosixPath(link_filename.lower()).suffix in ATTACHMENT_EXTENSIONS:
            filename = link_filename
        else:
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


def discover_html_links(
    page_url: str,
    html: str,
    official_hosts: set[str],
    extra_keywords: tuple[str, ...] = (),
) -> list[str]:
    """Return bounded-crawl page links whose anchor or URL looks relevant."""
    parser = _LinkParser()
    parser.feed(html)
    keywords = DISCOVERY_KEYWORDS + extra_keywords
    links: list[str] = []
    seen: set[str] = set()
    for href, link_text in parser.links:
        if not href or href.lower().startswith(("javascript:", "mailto:", "tel:")):
            continue
        url = urljoin(page_url, href)
        parsed = urlsplit(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            continue
        if not _host_allowed(parsed.hostname, official_hosts):
            continue
        if PurePosixPath(parsed.path.lower()).suffix in ATTACHMENT_EXTENSIONS:
            continue
        evidence = unquote(url) + " " + link_text
        if not any(keyword and keyword in evidence for keyword in keywords):
            continue
        if url not in seen:
            seen.add(url)
            links.append(url)
    return links
