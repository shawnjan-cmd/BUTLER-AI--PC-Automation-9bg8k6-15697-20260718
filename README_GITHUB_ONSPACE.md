# Butler AI — GitHub and Onspace.ai Native Handoff

This repository is the **native Android Expo/React Native client** for Butler AI PC Automation. It is not a Vite, Lovable, browser-only, or Capacitor project. The app entrypoint is `expo-router/entry`; the Python PC bridge is under `server/` and runs separately on the user’s computer.

## Repository map

| Directory | Purpose |
|---|---|
| `app/` | Expo Router screens and native tab navigation |
| `components/`, `hooks/`, `contexts/`, `utils/` | Native UI and shared app logic |
| `services/` | Authenticated transport, encrypted storage, AI chat, scripts, pairing, and guards |
| `server/` | Embedded Butler Python PC bridge and security documentation |
| `assets/` | Android/Expo icons, splash art, and native media |
| `scripts/` | Android validation and native guard scans |

The repository intentionally excludes `node_modules`, generated Android/iOS folders, compiled APK/AAB files, signing keys, local environment files, server databases, and personal logs. Onspace or EAS should generate platform build folders from Expo configuration.

## Onspace.ai import and build sequence

Import the repository as an **Expo/React Native project**, not as a web project. Keep the package manager lockfile and the `expo-router/entry` main field. Install dependencies with `pnpm install --frozen-lockfile` or the package manager selected by the Onspace workspace. Do not add Vite, Lovable, React DOM, Capacitor, or a browser router.

For a local development check, run `pnpm typecheck`, `pnpm validate:android`, and `pnpm guard`. For an Android APK, use the EAS `preview` profile. For a Play Store AAB, use the EAS `production` profile. EAS will require the user’s own Expo account and Android signing credentials; no signing secret is included in this repository.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm validate:android
pnpm guard
npx eas login
npx eas build --platform android --profile preview       # internal APK
npx eas build --platform android --profile production    # Play Store AAB
```

Before release, set the final Android version code, review permissions, create a privacy policy URL, configure signing credentials in EAS, and test the built artifacts on supported Android devices. Do not commit `google-play-service-account.json` or any keystore.

## PC server relationship

The mobile app is a client. The PC server is not bundled into the APK runtime; it is supplied in this repository for the user to run on the PC. Pair on a trusted LAN or use a user-managed encrypted private VPN. Do not port-forward the Python server or expose plaintext HTTP to the public internet. Read `server/README_SERVER_INTEGRATION.md`, `server/REMOTE_ACCESS_SECURITY.md`, and `SECURITY_ENCRYPTION_AUDIT.md` before publishing.

## GitHub upload

Create a new private or public repository, then upload this directory’s contents. The recommended first commit is the source and documentation only. After pushing, connect the repository to Onspace.ai and select the Expo/React Native project type. If Onspace offers a web/Vite template, do not select it for this repository.

```bash
git init
git add .
git status
git commit -m "Prepare Butler AI native Expo Android handoff"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

Never paste a GitHub token, Expo token, Play service-account JSON, signing key, or server TLS private key into chat or into a committed file.
