# Butler AI — Android and Google Play Release Checklist

This is an Android-native Expo/React Native application paired with a user-controlled Python PC server. It is not a web application.

## Release blockers

- Confirm the app has no Gemini, Groq, OpenAI, Supabase, analytics, advertising, or cloud-AI runtime path.
- Confirm all user-facing privacy and Data Safety disclosures describe the actual shipped behavior.
- Confirm there are no mock chat messages, fake system metrics, placeholder credentials, or hardcoded LAN addresses.
- Confirm encryption claims are backed by implemented AES-GCM or platform-secure-storage code and runtime tests; do not claim “bulletproof” or independently audited security without evidence.
- Confirm the Python server validates every automation request, uses explicit user confirmation for sensitive actions, denies unsafe downloads/executable installation, and records redacted audit events.

## Android checks

- Build and test an Android artifact on the supported Expo SDK and target API level.
- Request only permissions used by shipped features. Camera access must be limited to QR pairing and must not save or upload camera frames.
- Do not use background automation, hidden scheduled actions, or deceptive notification behavior. User actions must be visible and attributable.
- Verify small-screen layouts, keyboard behavior, safe areas, reduced-motion behavior, offline states, and empty states.
- Verify the privacy policy URL is publicly accessible and matches the final app behavior before submission.

## Local-only AI checks

- Ollama is configured on the paired PC, with a model selected according to available resources.
- If Ollama is unavailable, the UI explains how to recover and never falls back to an internet provider.
- Chat and memory remain on the paired PC unless the user explicitly exports them.

Review current Google Play requirements immediately before submission; this checklist is not a substitute for the Play Console declarations or an independent security audit.
