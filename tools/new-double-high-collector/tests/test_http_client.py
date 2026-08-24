import io
import tempfile
import unittest
from pathlib import Path

from new_double_high_collector.http_client import HttpClient, RobotsDenied


class FakeRobots:
    def __init__(self, allowed):
        self.allowed_value = allowed

    def can_fetch(self, _user_agent, _url):
        return self.allowed_value


class FakeHeaders(dict):
    def get_content_type(self):
        return self.get("Content-Type", "application/octet-stream")


class FakeUrlResponse:
    def __init__(self, url, status, body=b"", headers=None):
        self.url = url
        self.status = status
        self.headers = FakeHeaders(headers or {})
        self._stream = io.BytesIO(body)

    def read(self, size=-1):
        return self._stream.read(size)

    def geturl(self):
        return self.url

    def close(self):
        self._stream.close()


class SequenceOpener:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        return self.responses.pop(0)


class HttpClientTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)

    def tearDown(self):
        self.tempdir.cleanup()

    def test_robots_denial_prevents_request(self):
        opener = SequenceOpener([])
        client = HttpClient(
            user_agent="RenpeiCollector/1.0",
            opener=opener,
            sleeper=lambda _seconds: None,
        )
        client._robots["https://example.edu.cn"] = FakeRobots(allowed=False)

        with self.assertRaises(RobotsDenied):
            client.fetch("https://example.edu.cn/private/plan.pdf")

        self.assertEqual(opener.requests, [])

    def test_retries_503_three_times_then_returns_final_response(self):
        url = "https://example.edu.cn/plan.pdf"
        responses = [FakeUrlResponse(url, 503) for _ in range(4)]
        opener = SequenceOpener(responses)
        sleeps = []
        client = HttpClient(
            user_agent="RenpeiCollector/1.0",
            opener=opener,
            sleeper=sleeps.append,
            min_delay_seconds=0,
            robots_loader=lambda _origin: FakeRobots(allowed=True),
        )

        response = client.fetch(url)

        self.assertEqual(response.status, 503)
        self.assertEqual(response.attempts, 4)
        self.assertEqual(len(opener.requests), 4)
        self.assertEqual(sleeps, [10, 20, 40])
        response.close()

    def test_rejects_redirect_outside_allowed_official_hosts(self):
        requested = "https://example.edu.cn/plan.pdf"
        opener = SequenceOpener(
            [FakeUrlResponse("https://files.example.com/plan.pdf", 200, b"PDF")]
        )
        client = HttpClient(
            user_agent="RenpeiCollector/1.0",
            opener=opener,
            sleeper=lambda _seconds: None,
            robots_loader=lambda _origin: FakeRobots(allowed=True),
        )

        with self.assertRaises(ValueError):
            client.fetch(requested, allowed_hosts={"example.edu.cn"})

    def test_rate_limit_waits_for_one_second_between_same_host_requests(self):
        url = "https://example.edu.cn/plan.pdf"
        opener = SequenceOpener(
            [FakeUrlResponse(url, 200), FakeUrlResponse(url, 200)]
        )
        sleeps = []
        times = iter([0.0, 0.2])
        client = HttpClient(
            user_agent="RenpeiCollector/1.0",
            opener=opener,
            sleeper=sleeps.append,
            clock=lambda: next(times),
            robots_loader=lambda _origin: FakeRobots(allowed=True),
        )

        client.fetch(url).close()
        client.fetch(url).close()

        self.assertEqual(sleeps, [0.8])

    def test_fetch_sends_source_page_as_referer(self):
        url = "https://example.edu.cn/system/download.jsp?id=1"
        source_page = "https://example.edu.cn/training-plans.htm"
        opener = SequenceOpener([FakeUrlResponse(url, 200, b"%PDF")])
        client = HttpClient(
            user_agent="RenpeiCollector/1.0",
            opener=opener,
            sleeper=lambda _seconds: None,
            robots_loader=lambda _origin: FakeRobots(allowed=True),
        )

        client.fetch(url, referer=source_page).close()

        request, _timeout = opener.requests[0]
        self.assertEqual(request.get_header("Referer"), source_page)


if __name__ == "__main__":
    unittest.main()
