from trust_decay import TrustDecay


def main():
    decay = TrustDecay(idle_ms=100, max_auth_failures=2)
    state = decay.establish(actor_id="a", now_ms=0, policy_version="p1", topology_fingerprint="t1")
    assert state.epoch == 1
    same, reason = decay.observe(actor_id="a", now_ms=50, policy_version="p1", topology_fingerprint="t1")
    assert same.epoch == 1 and reason is None
    changed, reason = decay.observe(actor_id="a", now_ms=60, policy_version="p2", topology_fingerprint="t1")
    assert changed.epoch == 2 and reason == "policy_changed"
    decay.establish(actor_id="a", now_ms=0, policy_version="p1", topology_fingerprint="t1")
    decay.record_auth_failure(); decay.record_auth_failure()
    changed, reason = decay.observe(actor_id="a", now_ms=10, policy_version="p1", topology_fingerprint="t1")
    assert changed.epoch == 2 and reason == "auth_failure_budget"
    decay.establish(actor_id="a", now_ms=0, policy_version="p1", topology_fingerprint="t1")
    changed, reason = decay.observe(actor_id="a", now_ms=1_001, policy_version="p1", topology_fingerprint="t1")
    assert changed.epoch == 2 and reason == "idle_timeout"
    print("trust decay: PASS")


if __name__ == "__main__":
    main()
