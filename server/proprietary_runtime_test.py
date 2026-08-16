from proprietary_runtime import FreshnessEnvelope, IntentShadow, QuietFailureAggregator


def main():
    shadow = IntentShadow.create(ledger_id="l1", capability="pc.script.run", actor_id="a", arguments={"id": "safe", "digest": "x"}, trust_epoch=2)
    assert shadow.matches(capability="pc.script.run", actor_id="a", arguments={"id": "safe", "digest": "x"}, trust_epoch=2)
    assert not shadow.matches(capability="pc.script.run", actor_id="a", arguments={"id": "changed", "digest": "x"}, trust_epoch=2)
    assert not shadow.matches(capability="pc.script.run", actor_id="a", arguments={"id": "safe", "digest": "x"}, trust_epoch=3)

    fresh = FreshnessEnvelope(42, "pc.metrics", 100, 200)
    assert fresh.state(150) == "fresh" and fresh.present(150)["value"] == 42
    assert fresh.state(200) == "stale" and fresh.present(200)["value"] is None
    assert fresh.state(50) == "clock_uncertain"

    agg = QuietFailureAggregator(window_ms=1000, max_groups=2)
    first = agg.record(category="network", operation="ping", detail="timeout", now_ms=0)
    second = agg.record(category="network", operation="ping", detail="timeout", now_ms=500)
    assert first.count == 1 and second.count == 2
    assert agg.flush(now_ms=1000) == []
    flushed = agg.flush(now_ms=1501)
    assert len(flushed) == 1 and flushed[0].count == 2
    print("proprietary runtime mechanisms: PASS")


if __name__ == "__main__":
    main()
