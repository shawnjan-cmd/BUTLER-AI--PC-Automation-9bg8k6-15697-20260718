from crawler_epoch import make_checkpoint, is_idempotent_duplicate, checkpoint_fingerprint

BASE = dict(url="https://docs.example.test/a", content="A  page\nwith text", parser_version="parser-1", policy_epoch="policy-1", source_class="crawler", cursor="c-1", captured_at_ms=1760000000000)


def test_same_input_is_idempotent():
    a = make_checkpoint(**BASE)
    b = make_checkpoint(**BASE)
    assert a.epoch_id == b.epoch_id
    assert is_idempotent_duplicate(a, b)
    assert checkpoint_fingerprint(a) == checkpoint_fingerprint(b)


def test_content_change_is_not_duplicate():
    a = make_checkpoint(**BASE)
    b = make_checkpoint(**{**BASE, "content": "changed"})
    assert not is_idempotent_duplicate(a, b)


def test_parser_or_policy_epoch_change_is_not_duplicate():
    a = make_checkpoint(**BASE)
    assert not is_idempotent_duplicate(a, make_checkpoint(**{**BASE, "parser_version": "parser-2"}))
    assert not is_idempotent_duplicate(a, make_checkpoint(**{**BASE, "policy_epoch": "policy-2"}))


def test_cursor_is_part_of_work_identity():
    a = make_checkpoint(**BASE)
    b = make_checkpoint(**{**BASE, "cursor": "c-2"})
    assert not is_idempotent_duplicate(a, b)


def test_required_metadata_and_timestamp():
    try:
        make_checkpoint(**{**BASE, "policy_epoch": ""})
        raise AssertionError("missing policy epoch accepted")
    except ValueError:
        pass
    try:
        make_checkpoint(**{**BASE, "captured_at_ms": 0})
        raise AssertionError("invalid timestamp accepted")
    except ValueError:
        pass


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
    print("crawler epoch ledger: PASS")
