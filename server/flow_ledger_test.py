from flow_ledger import FlowLedger, IntegrityError, ReplayError, StageError


def main() -> None:
    now = [1_000_000]
    ledger = FlowLedger(now_ms=lambda: now[0])
    intent = ledger.begin_intent(actor_id="device-a", capability="pc.script.run", request={"script_id": "safe-1", "token": "do-not-store"})
    safety = ledger.record_safety(intent, actor_id="device-a", decision="allow", policy_version="safety-1")
    approval_event, approval = ledger.approve(safety, actor_id="device-a", capability="pc.script.run", intent_digest=intent["payload_digest"])
    approval_token = ledger.approval_token(approval)
    assert ledger.approval_from_token(approval_token) == approval
    try:
        ledger.approval_from_token(approval_token[:-1] + ("0" if approval_token[-1] != "0" else "1"))
    except IntegrityError:
        pass
    else:
        raise AssertionError("tampered approval token was accepted")
    execution = ledger.execute(approval_event, approval, actor_id="device-a", capability="pc.script.run", intent_digest=intent["payload_digest"], result={"exit_code": 0})
    receipt = ledger.receipt(execution, actor_id="device-a", outcome="succeeded", deletion_status="not_applicable")
    assert receipt["stage"] == "receipt"
    assert ledger.verify(intent["ledger_id"])
    assert all("do-not-store" not in str(event) for event in ledger.events(intent["ledger_id"]))

    try:
        ledger.execute(approval_event, approval, actor_id="device-a", capability="pc.script.run", intent_digest=intent["payload_digest"], result={"exit_code": 0})
    except ReplayError:
        pass
    else:
        raise AssertionError("single-use approval was replayable")

    now[0] += 1_000_000
    intent2 = ledger.begin_intent(actor_id="device-a", capability="pc.file.delete", request={"path": "x"})
    safety2 = ledger.record_safety(intent2, actor_id="device-a", decision="allow", policy_version="safety-1")
    approval_event2, approval2 = ledger.approve(safety2, actor_id="device-a", capability="pc.file.delete", intent_digest=intent2["payload_digest"], ttl_ms=1)
    now[0] += 31_000
    try:
        ledger.execute(approval_event2, approval2, actor_id="device-a", capability="pc.file.delete", intent_digest=intent2["payload_digest"], result={})
    except ReplayError:
        pass
    else:
        raise AssertionError("expired approval was accepted")

    try:
        ledger.approve(intent, actor_id="device-a", capability="pc.script.run", intent_digest=intent["payload_digest"])
    except StageError:
        pass
    else:
        raise AssertionError("out-of-order approval was accepted")

    tampered = ledger.events(intent["ledger_id"])
    tampered[1]["payload"]["decision"] = "deny"
    ledger._events[intent["ledger_id"]][1]["payload"]["decision"] = "deny"
    try:
        ledger.verify(intent["ledger_id"])
    except IntegrityError:
        pass
    else:
        raise AssertionError("tampered receipt chain verified")
    print("flow ledger invariants: PASS")


if __name__ == "__main__":
    main()
