"""Butler server immutable safety policy.

The policy is intentionally conservative and independent from UI settings.
It does not promise that a compromised operating system is recoverable.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ImmutableRule:
    rule_id: str
    title: str
    text: str


IMMUTABLE_RULES = (
    ImmutableRule(
        "MEMORY_NO_PLAINTEXT",
        "MEMORY IS NEVER PERSISTED IN PLAINTEXT",
        "Admitted memory must be encoded, encrypted, authenticated, and integrity-checked before persistence; no plaintext fallback is allowed.",
    ),
    ImmutableRule(
        "NO_PRIVATE_DATA_EXFILTRATION",
        "PRIVATE DATA NEVER LEAVES THE LOCAL TRUST BOUNDARY",
        "Memory, vault content, credentials, tokens, location, microphone data, and files cannot be sent to a developer cloud or unapproved destination.",
    ),
    ImmutableRule(
        "NO_UNTRUSTED_SIDE_EFFECTS",
        "UNTRUSTED CODE CANNOT EXECUTE OR CHANGE SECURITY STATE",
        "Scripts, downloads, installers, secret-disclosure requests, and security-policy changes fail closed until evidence and explicit intent are present.",
    ),
)


def assert_intact() -> None:
    if len(IMMUTABLE_RULES) != 3 or any(not r.rule_id or not r.title or not r.text for r in IMMUTABLE_RULES):
        raise RuntimeError("IMMUTABLE_POLICY_TAMPERED")


def public_rules() -> list[dict[str, str]]:
    assert_intact()
    return [{"id": r.rule_id, "title": r.title, "text": r.text} for r in IMMUTABLE_RULES]


__all__ = ["ImmutableRule", "IMMUTABLE_RULES", "assert_intact", "public_rules"]
