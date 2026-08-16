from capability_policy import CapabilityDenied, CapabilityRequest, load_default_policy


def rejects(policy, request):
    try:
        policy.validate(request)
    except CapabilityDenied:
        return
    raise AssertionError("request unexpectedly accepted")


def main():
    policy = load_default_policy()
    allowed = policy.validate(CapabilityRequest("pc.script.run", "device-a", True, timeout_s=60, undo_available=True))
    assert allowed.capability_id == "pc.script.run"
    rejects(policy, CapabilityRequest("unknown.capability", "device-a", True))
    rejects(policy, CapabilityRequest("pc.script.run", "device-a", False, timeout_s=60, undo_available=True))
    rejects(policy, CapabilityRequest("pc.script.run", "device-a", True, timeout_s=60, network_requested=True, undo_available=True))
    rejects(policy, CapabilityRequest("pc.script.run", "device-a", True, timeout_s=60, undo_available=False))
    rejects(policy, CapabilityRequest("pc.script.run", "device-a", True, timeout_s=901, undo_available=True))
    rejects(policy, CapabilityRequest("pc.research.crawl", "device-a", True, hosts=("bad host",)))
    crawl = policy.validate(CapabilityRequest("pc.research.crawl", "device-a", True, hosts=("example.com",), network_requested=True, timeout_s=120, undo_available=True))
    assert crawl.capability_id == "pc.research.crawl"
    print("capability policy: PASS")


if __name__ == "__main__":
    main()
