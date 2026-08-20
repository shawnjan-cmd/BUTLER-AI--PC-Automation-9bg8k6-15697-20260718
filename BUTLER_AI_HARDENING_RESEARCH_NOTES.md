# Butler AI Hardening Research Notes

## Purpose

This note preserves the external guidance used for the current logging, authorization, redirect, and Android privacy hardening pass.

## Key Findings

| Topic | Finding applied to Butler AI | Source |
|---|---|---|
| Structured security logging | Logs should include enough context to correlate an interaction, but application source, session values, access tokens, passwords, encryption keys, sensitive personal data, and other secrets should be removed, masked, hashed, or encrypted. Event data from other trust zones is untrusted and needs validation and sanitization. | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| Workflow authorization | Authorization should be deny-by-default, checked at the correct enforcement location on every request, and covered by unit and integration tests. Least privilege and safe failure are required for consequential operations. | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) |
| Navigation redirects | Do not accept an arbitrary URL as a redirect destination. Prefer fixed routes or server-side mapped identifiers; if external navigation is allowed, use an allow-list and clear confirmation. | [OWASP Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) |
| Android local data and logs | Android internal storage is app-scoped by default. External storage is untrusted and unsuitable for sensitive content. Mobile apps should minimize permissions and data collection, protect sensitive data, validate untrusted inputs, and avoid putting personal or sensitive information into device logs. | [Android Security Checklist](https://developer.android.com/privacy-and-security/security-tips) |

## Practical Butler Rules Derived from the Sources

1. Flow Ledger, approval, receipt, memory-manifest, and redirection events must have a short correlation identifier, stage, result, and source without including raw source code, raw chats, credentials, tokens, server URLs, file paths, or full outputs.
2. Consequential server endpoints must reject invalid pairing, vault lock, stale approval, immutable digest mismatch, out-of-order stage, and non-allowlisted redirect routes by default.
3. User-visible normal screens should expose only compact state labels. Expanded developer diagnostics must remain redacted and should never display cryptographic, pairing, authentication, or internal-address values.
4. App-internal navigation uses a fixed route allow-list; outside destinations require an explicit, user-visible confirmation and a trusted allow-list.
5. The audit should convert silent catches only where a failure changes user safety, execution authority, or diagnostics. Cosmetic/haptic best-effort failures remain non-blocking and must not claim success.

## References

[1] OWASP Foundation. *Logging Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

[2] OWASP Foundation. *Authorization Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

[3] OWASP Foundation. *Unvalidated Redirects and Forwards Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html

[4] Android Developers. *Security checklist*. https://developer.android.com/privacy-and-security/security-tips
