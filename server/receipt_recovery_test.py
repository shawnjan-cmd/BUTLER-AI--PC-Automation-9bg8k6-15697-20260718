from receipt_recovery import RecoveryDenied, ReceiptRecovery


def main():
    recovery = ReceiptRecovery(max_attempts=2)
    first = recovery.begin(failed_receipt_id="receipt-1", failed_receipt_digest="a" * 64, action="release_lane", reason="optional lane stalled")
    assert first.attempt == 1 and first.state == "started"
    done = recovery.finish(first, state="recovered", reason="lane cancelled")
    assert done.state == "recovered" and done.previous_recovery_digest == first.digest
    second = recovery.begin(failed_receipt_id="receipt-1", failed_receipt_digest="a" * 64, action="release_lane", reason="second bounded attempt")
    assert second.attempt == 2 and second.previous_recovery_digest == done.digest
    recovery.finish(second, state="abandoned", reason="retry budget reached")
    try:
        recovery.begin(failed_receipt_id="receipt-1", failed_receipt_digest="a" * 64, action="release_lane", reason="third attempt")
    except RecoveryDenied:
        pass
    else:
        raise AssertionError("retry budget was not enforced")
    try:
        recovery.begin(failed_receipt_id="receipt-2", failed_receipt_digest="short", action="x", reason="y")
    except RecoveryDenied:
        pass
    else:
        raise AssertionError("invalid failure digest was accepted")
    print("receipt recovery: PASS")


if __name__ == "__main__":
    main()
