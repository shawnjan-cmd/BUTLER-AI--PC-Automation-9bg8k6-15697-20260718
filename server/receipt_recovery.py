"""Receipt-carried recovery: bounded, auditable recovery without mutating failures."""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json


class RecoveryDenied(Exception):
    pass


@dataclass(frozen=True)
class RecoveryReceipt:
    recovery_id: str
    failed_receipt_id: str
    failed_receipt_digest: str
    attempt: int
    action: str
    state: str
    reason: str
    previous_recovery_digest: str | None
    digest: str


class ReceiptRecovery:
    def __init__(self, *, max_attempts: int = 2) -> None:
        self.max_attempts = max(1, max_attempts)
        self._by_failure: dict[str, list[RecoveryReceipt]] = {}

    @staticmethod
    def _digest(payload: dict) -> str:
        return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

    def begin(self, *, failed_receipt_id: str, failed_receipt_digest: str, action: str, reason: str) -> RecoveryReceipt:
        if not failed_receipt_id or len(failed_receipt_digest) != 64 or not action or not reason:
            raise RecoveryDenied("recovery requires an immutable failed receipt reference")
        history = self._by_failure.setdefault(failed_receipt_id, [])
        if len(history) >= self.max_attempts:
            raise RecoveryDenied("recovery retry budget exhausted")
        attempt = len(history) + 1
        previous = history[-1].digest if history else None
        payload = {"failedReceiptId": failed_receipt_id, "failedReceiptDigest": failed_receipt_digest, "attempt": attempt, "action": action, "state": "started", "reason": reason, "previous": previous}
        receipt = RecoveryReceipt(f"recovery_{failed_receipt_id}_{attempt}", failed_receipt_id, failed_receipt_digest, attempt, action, "started", reason, previous, self._digest(payload))
        history.append(receipt)
        return receipt

    def finish(self, receipt: RecoveryReceipt, *, state: str, reason: str) -> RecoveryReceipt:
        if receipt.state != "started" or state not in {"recovered", "abandoned", "failed"}:
            raise RecoveryDenied("invalid recovery terminal transition")
        history = self._by_failure.get(receipt.failed_receipt_id, [])
        if not history or history[-1].digest != receipt.digest:
            raise RecoveryDenied("recovery receipt is not the current immutable head")
        payload = {"failedReceiptId": receipt.failed_receipt_id, "failedReceiptDigest": receipt.failed_receipt_digest, "attempt": receipt.attempt, "action": receipt.action, "state": state, "reason": reason, "previous": receipt.digest}
        finished = RecoveryReceipt(receipt.recovery_id, receipt.failed_receipt_id, receipt.failed_receipt_digest, receipt.attempt, receipt.action, state, reason, receipt.digest, self._digest(payload))
        history[-1] = finished
        return finished

    def history(self, failed_receipt_id: str) -> tuple[RecoveryReceipt, ...]:
        return tuple(self._by_failure.get(failed_receipt_id, ()))
