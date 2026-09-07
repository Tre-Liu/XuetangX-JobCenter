from html.parser import HTMLParser
from html import unescape
from pathlib import PurePosixPath
import re
from urllib.parse import parse_qs, unquote, urljoin, urlsplit

from .models import Candidate


ATTACHMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"}
DISCOVERY_KEYWORDS = ("人才培养方案", "培养方案", "2025级", "2025版")
VSB_PDF_IFRAME_RE = re.compile(
    r"showVsbpdfIframe\s*\(\s*(['\"])(?P<url>[^'\"]+)\1",
    re.IGNORECASE,
)
SUDY_FILE_TITLE_RE = re.compile(
    r"(?:^|[,\s{])title\s*:\s*(['\"])(?P<title>[^'\"]+)\1",
    re.IGNORECASE,
)


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
        self.embedded_resources: list[tuple[str, str]] = []
        self.image_resources: list[str] = []
        self._in_title = False
        self._href: str | None = None
        self._anchor_parts: list[str] = []

    def parse_marked_section(self, i, report=1):
        """Skip unknown legacy-CMS marked sections without losing later links."""
        try:
            return super().parse_marked_section(i, report)
        except (NotImplementedError, UnboundLocalError):
            end = self.rawdata.find("]>", i + 3)
            return -1 if end < 0 else end + 2

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag.lower() == "title":
            self._in_title = True
        if tag.lower() == "a":
            self._href = attributes.get("href")
            self._anchor_parts = []
        if tag.lower() in {"iframe", "embed"}:
            for attribute_name in ("src", "data-src"):
                if attributes.get(attribute_name):
                    self.embedded_resources.append(
                        (attributes[attribute_name], "")
                    )
        if tag.lower() == "object" and attributes.get("data"):
            self.embedded_resources.append((attributes["data"], ""))
        if attributes.get("pdfsrc"):
            file_metadata = attributes.get("sudyfile-attr", "")
            title_match = SUDY_FILE_TITLE_RE.search(file_metadata)
            link_text = title_match.group("title").strip() if title_match else ""
            self.embedded_resources.append((attributes["pdfsrc"], link_text))
        if tag.lower() == "img" and attributes.get("src"):
            self.image_resources.append(attributes["src"])

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_title = False
        if tag.lower() == "a" and self._href:
            self.links.append((self._href, "".join(self._anchor_parts).strip()))
            self._href = None
            self._anchor_parts = []

    def handle_data(self, data):
        self.embedded_resources.extend(
            (unescape(match.group("url")), "")
            for match in VSB_PDF_IFRAME_RE.finditer(data)
        )
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
    resources = parser.links + parser.embedded_resources
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
        query_extension = parse_qs(parsed.query).get("e", [""])[0].lower()
        if PurePosixPath(url_filename.lower()).suffix in ATTACHMENT_EXTENSIONS:
            filename = url_filename
        elif PurePosixPath(link_filename.lower()).suffix in ATTACHMENT_EXTENSIONS:
            filename = link_filename
        elif query_extension in ATTACHMENT_EXTENSIONS:
            filename = f"{PurePosixPath(url_filename).stem}{query_extension}"
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


def discover_image_sequence_urls(
    page_url: str,
    html: str,
    official_hosts: set[str],
) -> list[str]:
    """Return ordered official VSB page-image URLs, deduplicated."""
    parser = _LinkParser()
    parser.feed(html)
    urls: list[str] = []
    seen: set[str] = set()
    for src in parser.image_resources:
        url = urljoin(page_url, src)
        parsed = urlsplit(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            continue
        if not _host_allowed(parsed.hostname, official_hosts):
            continue
        if not parsed.path.lower().endswith("/virtual_attach_file.vsb"):
            continue
        if "e=.png" not in unquote(parsed.query).lower():
            continue
        if url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def discover_image_sequence_from_html(
    group_id: str,
    major_code: str,
    page_url: str,
    html: str,
    official_hosts: set[str],
) -> list[Candidate]:
    """Represent a reviewed official page-image plan as one derived-PDF candidate."""
    image_urls = discover_image_sequence_urls(page_url, html, official_hosts)
    if len(image_urls) < 2:
        return []
    parser = _LinkParser()
    parser.feed(html)
    title = " ".join(parser.title_parts)
    visible_text = " ".join(parser.text_parts)
    page_text = f"{visible_text} 官网逐页图片数：{len(image_urls)}".strip()
    return [
        Candidate(
            group_id=group_id,
            major_code=major_code,
            title=title,
            link_text=title,
            filename=f"{major_code}_2025级人才培养方案_官网页面图片合成.pdf",
            page_text=page_text,
            source_page_url=page_url,
            download_url=page_url,
        )
    ]


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
