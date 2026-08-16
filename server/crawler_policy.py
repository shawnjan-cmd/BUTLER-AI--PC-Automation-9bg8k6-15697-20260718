"""Robots-aware crawler admission for Butler's PC-local research worker."""
from __future__ import annotations

from dataclasses import dataclass
import threading
import time
from urllib.parse import urlparse, urljoin
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    delay_s: float
    robots_url: str
    fetched_at_ms: int
    reason: str


class RobotsPolicyCache:
    def __init__(self, user_agent: str = "Butler-AI/7.0", ttl_s: int = 21600, timeout_s: float = 5.0):
        self.user_agent = user_agent
        self.ttl_s = max(60, int(ttl_s))
        self.timeout_s = max(0.5, float(timeout_s))
        self._cache: dict[str, tuple[RobotFileParser, int, float]] = {}
        self._lock = threading.Lock()

    def _load(self, origin: str) -> tuple[RobotFileParser, int]:
        now = time.time()
        with self._lock:
            cached = self._cache.get(origin)
            if cached and now - cached[2] < self.ttl_s:
                return cached[0], int(cached[1])
        robots_url = urljoin(origin, "/robots.txt")
        parser = RobotFileParser(robots_url)
        fetched_ms = int(now * 1000)
        try:
            req = Request(robots_url, headers={"User-Agent": self.user_agent})
            with urlopen(req, timeout=self.timeout_s) as response:
                parser.parse(response.read(256_000).decode("utf-8", "replace").splitlines())
        except Exception:
            # A robots fetch failure is not a security authorization. Use a
            # conservative short-lived allow decision and let the caller’s
            # domain/host and resource policies remain authoritative.
            parser.parse([])
        with self._lock:
            self._cache[origin] = (parser, fetched_ms, now)
        return parser, fetched_ms

    def decide(self, url: str) -> PolicyDecision:
        parsed = urlparse(str(url or ""))
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            return PolicyDecision(False, 0.0, "", 0, "invalid_url")
        origin = f"{parsed.scheme}://{parsed.netloc}"
        parser, fetched_ms = self._load(origin)
        allowed = bool(parser.can_fetch(self.user_agent, url))
        delay = parser.crawl_delay(self.user_agent)
        request_rate = parser.request_rate(self.user_agent)
        if request_rate and request_rate.requests > 0:
            delay = max(float(delay or 0), float(request_rate.seconds) / float(request_rate.requests))
        delay = min(300.0, max(0.0, float(delay or 0.0)))
        return PolicyDecision(allowed, delay, urljoin(origin, "/robots.txt"), fetched_ms, "allowed" if allowed else "robots_disallow")
