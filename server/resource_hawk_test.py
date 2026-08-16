from resource_hawk import collect_snapshot, choose_budget, ResourceHawk


def snap(cpu, ram, disk=50):
    return collect_snapshot(sampler=lambda: {"cpu_percent": cpu, "ram_percent": ram, "disk_free_percent": disk, "load_1m": 1.0, "thermal_state": "unknown", "source": "test-sensor"})


def test_unknown_capacity_is_conservative_and_not_fake():
    s = collect_snapshot(sampler=lambda: {})
    b = choose_budget(s)
    assert s.cpu_percent is None and s.ram_percent is None and b.state == "unknown" and not b.crawler_allowed


def test_dangerous_pressure_pauses_optional_work():
    b = choose_budget(snap(95, 95))
    assert b.state == "dangerous" and not b.crawler_allowed and not b.indexing_allowed


def test_chat_reservation_wins_over_optional_work():
    b = choose_budget(snap(40, 40), active_chat=True)
    assert b.state == "interactive" and b.chat_reserved and not b.crawler_allowed


def test_normal_capacity_allows_bounded_optional_work():
    b = choose_budget(snap(25, 40))
    assert b.state == "normal" and b.optional_concurrency == 2 and b.crawler_allowed


def test_recovery_hysteresis_requires_stable_samples():
    h = ResourceHawk(recovery_samples=3)
    assert h.evaluate(snap(95, 95)).state == "dangerous"
    assert h.evaluate(snap(30, 40)).state == "recovering"
    assert h.evaluate(snap(30, 40)).state == "recovering"
    assert h.evaluate(snap(30, 40)).state == "normal"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
    print("resource hawk: PASS")
