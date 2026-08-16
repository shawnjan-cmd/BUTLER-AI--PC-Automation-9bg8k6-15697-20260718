export const privacyPolicyText: string = `# Butler AI: PC Automation — Privacy Policy

**Developer:** Andrej Sladkovic  
**Architecture:** Android client plus a user-operated Python server and local Ollama on the user's paired PC.  
**Status:** Draft; verify against the exact release build and applicable law before publication.

## Overview

Butler is designed as a local-first, self-hosted PC automation app. The developer does not operate a cloud collection service for Butler data in the local-only build. The app can still transmit user-entered chat, selected commands, pairing identifiers, receipts, and—if the optional voice lane is enabled—short user-recorded audio to the user's paired PC. A user-configured remote transport may leave the local network.

## Data processed

The app may process Android-private settings, pairing identifiers, session credentials, chat history, selected scripts, Flow Ledger receipts, and optional voice input. QR camera frames are used for pairing and should not be persisted by default. Voice capture is visible, user-started, permission-gated, cancellable, and intended to remain ephemeral unless the user explicitly saves a permitted receipt or transcript.

The paired PC may retain server-side scripts, logs, receipts, chat context, or other data according to its configuration. Android uninstall does not by itself delete data already retained on the paired PC or a user-configured remote endpoint.

## Local AI and sharing

The supported AI provider is local Ollama running on the user's paired PC. Chat text and selected context may be sent to that PC for response generation. The local-only build does not intentionally send Butler content to developer-operated cloud AI, analytics, advertising, or data-broker services. External crawlers, remote endpoints, or third-party integrations configured by the user can create additional recipients and must be reviewed separately.

## Security boundaries

Butler uses authenticated pairing and local security controls, but a bearer token, self-signed certificate, LAN connection, or script filter alone does not prove that an internet-facing deployment is secure. Users must protect the PC, operating system account, firewall, Ollama service, remote transport, backups, and server credentials. Sensitive execution is intended to pass through the Flow Ledger, capability policy, explicit approval, and terminal receipt sequence.

## Permissions

The final build may request camera and internet access for pairing and PC communication. If the optional voice lane is shipped, it may request microphone access and must satisfy Android foreground-service, disclosure, consent, and Google Play requirements. The app must not perform hidden or continuous background microphone capture.

## Deletion

Users can clear Android-local chat, memory, pairing, and settings through the app where supported, and can uninstall the app. Users must separately clear paired-PC scripts, logs, receipts, audio, transcripts, and backups through the server controls. Retention depends on the active server configuration.

## Contact

**Developer:** Andrej Sladkovic  
**Contact:** andrejsladkovic1992@gmail.com
`;
