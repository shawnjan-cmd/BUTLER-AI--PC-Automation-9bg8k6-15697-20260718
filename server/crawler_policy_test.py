import time
from crawler_policy import RobotsPolicyCache


def test_policy_parser_respects_disallow_and_delay():
    cache = RobotsPolicyCache()
    parser = cache
    # Use the private cache seam with a deterministic parser substitute.
    class FakeRobots:
        def can_fetch(self, agent, url): return "/private" not in url
        def crawl_delay(self, agent): return 2
        def request_rate(self, agent): return None
    cache._cache["https://example.test"] = (FakeRobots(), 1000, time.time())
    allowed = cache.decide("https://example.test/public/page")
    denied = cache.decide("https://example.test/private/page")
    assert allowed.allowed and allowed.delay_s == 2.0 and allowed.reason == "allowed"
    assert not denied.allowed and denied.reason == "robots_disallow"


def test_request_rate_sets_minimum_delay():
    cache = RobotsPolicyCache()
    class FakeRobots:
        def can_fetch(self, agent, url): return True
        def crawl_delay(self, agent): return None
        def request_rate(self, agent):
            return type("Rate", (), {"requests": 1, "seconds": 10})()
    cache._cache["https://example.test"] = (FakeRobots(), 1000, time.time())
    assert cache.decide("https://example.test/a").delay_s == 10.0


def test_invalid_url_fails_closed():
    decision = RobotsPolicyCache().decide("file:///etc/passwd")
    assert not decision.allowed and decision.reason == "invalid_url"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
    print("crawler policy: PASS")
