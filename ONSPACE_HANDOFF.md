# Butler AI — Onspace.ai Native Handoff

This archive is the **native Expo/React Native project**, not the Vite web project. The Android entrypoint is `expo-router/entry`, the screens are under `app/`, native services are under `services/`, and the Android configuration is in `app.json`, `eas.json`, and `metro.config.js`.

## Included

The package includes the native Butler AI app, assets, legal/data-safety documents, scripts, test utilities, and the PC bridge under `server/`. The server includes `butler_server_v20_1_0_OSS.py`, the conservative launcher, security and remote-access documentation, and the SHA-256 manifest.

## Onspace setup

Import the ZIP as a React Native/Expo project. Install dependencies with the package manager supported by the workspace, then start the Expo development build using the project’s existing scripts. Do not convert this project to a web app and do not remove the `expo-router/entry` main entrypoint.

The PC server is not compiled into the Android binary as an executable. It is distributed as a reviewed companion Python file because Android/Play Store apps cannot silently install or run arbitrary desktop Python processes. The user runs the server on the PC and pairs the app with its QR code.

## Secure server setup

For local testing, use `server/run_server_safe.py`, which defaults to loopback. For phone pairing on a trusted private network, use the documented LAN mode. For access away from home, use a private encrypted VPN on both devices or configure a real trusted TLS certificate; never router-port-forward the server or expose plaintext HTTP to the public internet.

## Sanitization

The delivery archive excludes `.env` files, private keys, signing stores, `node_modules`, build outputs, caches, Git metadata, and nested archives. No Android APK or Play Store submission artifact is claimed by this source-only handoff.
