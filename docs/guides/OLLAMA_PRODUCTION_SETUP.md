# Butler AI Local-Ollama Production Guide

This project is **Android-native Expo/React Native plus a Python PC server**. AI processing is local-only: the mobile app talks to the user’s paired PC, and the PC talks to an Ollama instance on that same PC. There is no Gemini, Groq, OpenAI, Supabase relay, analytics SDK, or cloud-AI fallback in the release architecture.

## Required runtime sequence

1. Install Ollama on the user’s PC and verify that it is reachable locally.
2. Pull a model that the PC can run comfortably. The setup flow must recommend the smallest compatible model based on available memory and CPU/GPU capacity.
3. Start the Butler Python server. It must bind only to the intended LAN interface by default, create a fresh pairing secret, and require authentication before exposing automation or chat routes.
4. Pair the Android app using the QR or manual LAN flow. Store only the minimum credential material in Android secure storage.
5. The app must display truthful states: **Connected**, **Ollama unavailable**, **model unavailable**, **server locked**, or **offline**. It must never show sample replies, invented metrics, or a fake online indicator.

## Privacy and safety invariants

- Chat, memory, crawler output, scripts, and logs remain on the user-controlled PC unless the user explicitly exports them.
- No cloud fallback is permitted. If Ollama is unavailable, show a recoverable offline state instead of sending data elsewhere.
- Never place API keys, bearer tokens, passwords, QR payloads, or private memory in source code, logs, analytics, crash reports, screenshots, or error messages.
- Automation requests require explicit user action, server-side validation, allowlisting, and a visible result. Destructive, network-downloading, persistence-installing, credential-extracting, or executable-installing actions must be denied by policy.
- Any crawler or indexing worker must pause when CPU, memory, disk, or queue thresholds become unsafe and must use debounced notifications.

## Verification checklist

The next agent must run the project’s guard, TypeScript, Android export, and Python syntax checks. It must also verify that searches for `Gemini`, `Groq`, `OpenAI`, `Supabase`, `api.groq.com`, `api.openai.com`, and cloud API-key prefixes return no runtime implementation hits. Documentation may mention removed providers only in migration history, never as an active option.

A failed Ollama connection is a normal recoverable state, not permission to invent a response or silently use a third-party endpoint.
