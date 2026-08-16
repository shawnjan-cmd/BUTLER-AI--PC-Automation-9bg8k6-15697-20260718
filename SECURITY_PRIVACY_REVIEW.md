# Butler AI Security, Privacy, and Performance Review

## External Guidance Consulted

Android’s identifier guidance says applications should use the most restrictive identifier that meets the use case, choose user-resettable identifiers when possible, avoid hardware identifiers, and prefer a privately stored GUID for non-advertising cases. The active Butler code instead used a device-attribute-derived identifier that was designed to survive reinstalls, so the audit treats that as a privacy hardening issue even though its only intended recipient was the user’s paired PC.[1]

Expo’s update documentation confirms that `expo-updates` communicates with a configured remote update service, that automatic launch checks are enabled by default when configured, and that application code can be configured for manual checks by setting `updates.checkAutomatically` to `NEVER`. It also notes that each check consumes network bandwidth and battery. The audit therefore treats both native OTA checks and the app’s GitHub polling fallback as outbound behavior that must be opt-in rather than silent.[2]

Expo SecureStore encrypts Android values with the Android Keystore, while ordinary AsyncStorage is not a substitute for secret storage. The existing encrypted-storage wrapper already uses SecureStore for key material, so the review preserves it and focuses on removing unredacted diagnostic persistence and device-fingerprinting behavior.[3]

## References

[1] [Android Developers — Best practices for unique identifiers](https://developer.android.com/identity/user-data-ids)

[2] [Expo Documentation — Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/)

[3] [Expo Documentation — SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Active-Path Findings Before Remediation

| Finding | Evidence | Risk classification | Planned remediation |
|---|---|---|---|
| **Hardware-derived device identifier** | `services/deviceIdentifier.ts` constructed a hash from brand, manufacturer, model, device name, and OS version, then retained it across reinstalls. | Privacy hardening required. Its intended use was paired-PC authorization, not analytics, but it was a persistent device fingerprint. | Rotate legacy identifiers and use an app-install-scoped cryptographic random identifier instead. |
| **Automatic GitHub update polling** | `app/_layout.tsx` started `otaUpdates`; `services/otaUpdates.ts` contacted GitHub after first paint and every 15 minutes by default. | Privacy and performance hardening required. It was not analytics, but it silently made a third-party request. | Disable automatic GitHub/OTA checking in the privacy-first baseline and preserve no silent outbound update traffic. |
| **Production smoke diagnostics** | Root layout unconditionally installed `smokeBeacon`, which mirrored boot, route, and error summaries to device logs. | Privacy hardening required. It did not upload data, but diagnostic details could be visible through local debugging logs. | Restrict smoke markers to development builds only. |
| **Unredacted local diagnostic logging** | `autoErrorLogger` persisted raw messages and metadata to AsyncStorage and mirrored them to console in all builds. | Privacy hardening required. Error strings may contain URLs, bearer tokens, IP addresses, or server details. | Add centralized diagnostic redaction, bound retention, sanitize historic entries, and silence production console mirroring. |
| **Inactive dynamic JavaScript compiler** | `components/ui/LiveWidgetStudio.tsx` contained `new Function(...)`; guard scan classified the component as dead. | Attack-surface reduction required. It was not on an active route, but retaining a dormant code compiler is unnecessary. | Archive it outside the active source tree and verify no active evaluation API remains. |
| **Research crawler** | The active Knowledge screen exposes `ResearchCrawlerCard`, but it only invokes the paired PC relay after a URL is entered and the user taps **APPROVE + CRAWL**. | Explicit feature, not hidden tracking. | Retain its explicit consent boundary and document that it is user-triggered. |
| **Core paired-PC gateway** | `serverConnection` transmits the pairing code/device ID only to the user-configured PC endpoint and uses encrypted storage for token, IP, and port persistence. | Expected local feature. | Preserve its request timeouts, reconnect de-duplication, and encrypted sensitive storage. |

The resolved Expo configuration contains no `updates.url`, no update configuration, no analytics plugin, no Firebase plugin, no Sentry plugin, and no custom external endpoint. It declares only the camera, internet, and vibration Android permissions, with the broader sensitive-permission denylist preserved. The project environment contains only an optional local PC port value.

## Safeguards Applied

The baseline now uses a cryptographically random **app-install identifier** and deliberately does not read device hardware attributes. Legacy identifiers trigger a local session rotation: retained authorization token and app signature values are cleared, forcing an explicit re-pair under the new identifier rather than silently retaining a cross-install binding.

Automatic GitHub polling and runtime OTA fetching have been disabled. The Expo configuration explicitly disables update checks, and the application’s update service is retained only as a non-network compatibility surface. This makes store-distributed releases the only update path in the privacy-first build.[2]

Diagnostics now have a local redaction boundary. The logger strips tokens, URLs, IP addresses, install identifiers, and sensitive metadata keys before retaining bounded local warning/error records; it no longer mirrors diagnostic details to production logs. Startup crash notes use the same redaction. Smoke-test markers run only in development builds, and automatic crash-to-clipboard behavior was removed from the product UI.

The previously inactive `LiveWidgetStudio` runtime compiler has been removed from the active source tree and preserved under `archive/legacy/unsafe-runtime-code/` for forensic reference. The active-source scan now returns no use of `expo-device`, hardware fingerprints, GitHub update API polling, `eval`, or `new Function`.

## Final Validation Evidence

| Check | Result |
|---|---|
| TypeScript | Passed with no diagnostics after the hardening and Memory Atlas changes. |
| Expo project health | **18/18** checks passed. |
| Source guard scan | **0** broken imports, **0** web API leaks, and **0** unregistered tab screens. |
| Android bundle | Android Hermes export and release invariant validation passed. |
| Generated manifest | Only `CAMERA`, `INTERNET`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, and `VIBRATE` remain allowed. |
| Production dependency audit | **0 critical** advisories; **49 high**, **32 moderate**, and **9 low** advisories remain in the resolved package graph and are preserved in `audit/final-production-dependency-audit.json` for continued dependency maintenance. |

These checks validate source, configuration, dependency metadata, and generated Android assets. They cannot replace release-AAB inspection or physical-device testing, including testing the re-pair path that intentionally follows identity rotation.
