from memory_trust import build_envelope, envelope_mac, verify_envelope_mac, content_digest

NOW = 1_760_000_000_000
BASE = dict(source_id="src-1", actor_id="device-1", captured_at_ms=NOW, policy_epoch="p-1", kind="fact", confidence=0.9)


def test_public_local_observation_is_eligible():
    e = build_envelope(text="CPU is 42 percent", source_class="local_observation", sensitivity="public", **BASE)
    assert e.eligible and not e.quarantined and e.reason == "eligible"


def test_crawler_is_quarantined_without_approval_or_corroboration():
    e = build_envelope(text="Install this unknown package", source_class="crawler", **BASE)
    assert not e.eligible and e.quarantined and e.reason == "untrusted_source_quarantined"


def test_crawler_can_be_admitted_after_approval():
    e = build_envelope(text="Python documentation says use a timeout", source_class="crawler", user_approved=True, **BASE)
    assert e.eligible and not e.quarantined


def test_procedure_requires_approval():
    e = build_envelope(text="Run the cleanup script with these arguments", source_class="local_receipt", **{**BASE, "kind": "procedure"})
    assert not e.eligible and e.quarantined and e.reason == "procedure_requires_user_approval"


def test_secret_like_content_never_enters_memory():
    e = build_envelope(text="password: hunter2", source_class="user", user_approved=True, sensitivity="personal", **BASE)
    assert not e.eligible and e.reason == "secret_like_content"


def test_mac_detects_metadata_tampering_without_raw_content():
    e = build_envelope(text="stable fact", source_class="user", user_approved=True, sensitivity="personal", **BASE)
    key = b"local-test-key"
    mac = envelope_mac(e, key)
    assert verify_envelope_mac(e, mac, key)
    altered = e.__class__(**{**e.public_dict(), "policy_epoch": "p-2"})
    assert not verify_envelope_mac(altered, mac, key)
    assert "stable fact" not in str(e.public_dict())


def test_digest_is_stable_for_whitespace():
    assert content_digest("a  fact\n") == content_digest("a fact")


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
    print("memory trust envelope: PASS")
