import time
import urllib.error
import urllib.request
import urllib.robotparser
from dataclasses import dataclass
from typing import BinaryIO, Callable, Mapping, Optional
from urllib.parse import urlsplit


class RobotsDenied(RuntimeError):
    """robots.txt disallows the requested URL for this collector."""


@dataclass
class HttpResponse:
    url: str
    status: int
    headers: Mapping[str, str]
    stream: BinaryIO
    attempts: int

    def close(self) -> None:
        self.stream.close()

    def __enter__(self) -> "HttpResponse":
        return self

    def __exit__(self, _exc_type, _exc, _traceback) -> None:
        self.close()


def _origin(url: str) -> str:
    parsed = urlsplit(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def _host_allowed(host: str, allowed_hosts: set[str]) -> bool:
    normalized = host.lower().rstrip(".")
    return any(
        normalized == allowed.lower().rstrip(".")
        or normalized.endswith("." + allowed.lower().rstrip("."))
        for allowed in allowed_hosts
    )


class HttpClient:
    def __init__(
        self,
        user_agent: str,
        opener=None,
        sleeper: Callable[[float], None] = time.sleep,
        clock: Callable[[], float] = time.monotonic,
        robots_loader: Optional[Callable[[str], object]] = None,
        min_delay_seconds: float = 1.0,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.user_agent = user_agent
        self.opener = opener or urllib.request.build_opener()
        self.sleeper = sleeper
        self.clock = clock
        self.robots_loader = robots_loader or self._load_robots
        self.min_delay_seconds = min_delay_seconds
        self.timeout_seconds = timeout_seconds
        self._robots: dict[str, object] = {}
        self._last_request_at: dict[str, float] = {}

    def _load_robots(self, origin: str):
        parser = urllib.robotparser.RobotFileParser()
        parser.set_url(origin + "/robots.txt")
        try:
            parser.read()
        except (OSError, urllib.error.URLError):
            parser.parse([])
        return parser

    def allowed(self, url: str) -> bool:
        origin = _origin(url)
        parser = self._robots.get(origin)
        if parser is None:
            parser = self.robots_loader(origin)
            self._robots[origin] = parser
        return bool(parser.can_fetch(self.user_agent, url))

    def fetch(
        self,
        url: str,
        allowed_hosts: Optional[set[str]] = None,
    ) -> HttpResponse:
        parsed = urlsplit(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError(f"unsupported URL: {url}")
        if not self.allowed(url):
            raise RobotsDenied(f"robots.txt disallows {url}")

        origin = _origin(url)
        backoffs = (10, 20, 40)
        for attempt in range(1, 5):
            self._wait_for_host(origin)
            request = urllib.request.Request(
                url,
                headers={"User-Agent": self.user_agent, "Accept": "*/*"},
            )
            try:
                response = self.opener.open(request, timeout=self.timeout_seconds)
            except urllib.error.HTTPError as error:
                response = error
            final_url = response.geturl()
            final_host = urlsplit(final_url).hostname or ""
            if allowed_hosts and not _host_allowed(final_host, allowed_hosts):
                response.close()
                raise ValueError(f"redirect left official hosts: {final_url}")
            status = int(getattr(response, "status", getattr(response, "code", 0)))
            if status in {429, 503} and attempt <= len(backoffs):
                response.close()
                self.sleeper(backoffs[attempt - 1])
                continue
            return HttpResponse(
                url=final_url,
                status=status,
                headers=response.headers,
                stream=response,
                attempts=attempt,
            )
        raise AssertionError("retry loop exhausted without response")

    def _wait_for_host(self, origin: str) -> None:
        now = self.clock()
        previous = self._last_request_at.get(origin)
        if previous is not None:
            remaining = self.min_delay_seconds - (now - previous)
            if remaining > 0:
                self.sleeper(remaining)
                now += remaining
        self._last_request_at[origin] = now
