from bounded_retry import decide_retry, CircuitState


def test_transient_idempotent_retry():
    d = decide_retry(attempt=0, max_attempts=3, failure_class="timeout", idempotent=True, jitter_fraction=0.2)
    assert d.retry and d.attempt == 1 and d.delay_s == 0.3


def test_non_idempotent_fails_fast():
    d = decide_retry(attempt=0, max_attempts=3, failure_class="timeout", idempotent=False)
    assert not d.retry and d.reason == "non_idempotent_operation"


def test_non_transient_fails_fast():
    d = decide_retry(attempt=0, max_attempts=3, failure_class="permission_denied", idempotent=True)
    assert not d.retry and d.reason == "non_transient_failure"


def test_budget_and_delay_cap():
    assert not decide_retry(attempt=2, max_attempts=3, failure_class="timeout", idempotent=True).retry
    d = decide_retry(attempt=4, max_attempts=10, failure_class="timeout", idempotent=True, base_delay_s=1, max_delay_s=3)
    assert d.retry and d.delay_s == 3.0


def test_circuit_opens_and_resets():
    c = CircuitState()
    c.record_failure(1000, threshold=2, cooldown_ms=100)
    assert not c.is_open(1050)
    c.record_failure(1050, threshold=2, cooldown_ms=100)
    assert c.is_open(1100)
    c.record_success()
    assert not c.is_open(1100) and c.failures == 0


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
    print("bounded retry policy: PASS")
