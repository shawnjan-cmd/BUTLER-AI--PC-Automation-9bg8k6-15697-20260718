# Onspace.ai Preview and Build Guide

## Import mode

Import this repository as an **Expo / React Native Android project**. Do not classify it as a Vite, browser, Lovable, or static web project. The native entrypoint is `expo-router/entry`; the Android app is under `app/`, `components/`, `services/`, and the Expo configuration files at the repository root.

## Preview behavior

Use Onspace preview for source/configuration and responsive layout inspection, but choose the native Android/Expo preview target when available. The Python server is a desktop console/API process and is not expected to render inside a browser preview. For a connected end-to-end preview, start the server on a reachable PC, display its desktop QR/manual pairing code, and pair the Android preview build through the app’s Connect flow.

If Onspace offers only a browser preview for the current project, that preview can validate static source organization and some non-native layout code, but it cannot prove camera pairing, Android secure storage, haptics, background behavior, or PC-server connectivity. Those require an Android device/emulator and a running Python console server.

## Build profiles

Use the included `eas.json`: `preview` is intended for an installable Android APK; `production` is intended for an Android App Bundle (AAB). Configure the project owner, EAS project ID, Android package identifier, signing credentials, privacy-policy URL, and store metadata in the authenticated build environment rather than committing secrets.

## Server pairing

Launch `server/start_server.bat` on Windows or `server/start_server.sh` on Unix. The desktop console shows the QR and manual pairing code and contains the synchronized Script Library. The server does not open a browser dashboard. Remote access requires a user-managed encrypted private VPN or valid TLS certificates; do not port-forward the Python process directly.

## GitHub upload

Commit source and documentation only. Keep `.env`, signing keys, service-account files, `node_modules`, generated native folders, APK/AAB artifacts, and local logs out of the repository. Verify the supplied SHA-256 checksum after downloading the release archive.
