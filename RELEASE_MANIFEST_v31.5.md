# Butler AI Hardening Release v31.5 Manifest

**Release archive:** `BUTLER_AI_HARDENING_RELEASE_v31.5.zip`  
**Prepared:** August 20, 2026  
**Source root:** `preserved_60mb/`

## Contents

This archive contains the React Native / Expo application source, FastAPI companion server source and tests, proprietary architecture records, security and privacy documentation, licensing/provenance records, build configuration, and the final hardening report.

The archive intentionally excludes dependency installations, temporary Expo state, generated export checks, generated native Android build output, nested release archives, and other non-source build artifacts. Install dependencies from the included `package.json` and `pnpm-lock.yaml` rather than reusing an archived `node_modules` directory.

| Release check | Result |
|---|---:|
| TypeScript strict check | Pass — zero errors |
| Python regression suite | Pass — 68 tests |
| Peer dependency validation | Pass — no issues |
| Expo Doctor | Pass — 18/18 checks |
| Production critical audit gate | Pass — 0 critical findings |

## Principal Entry Points

| Purpose | Path |
|---|---|
| Mobile application configuration | `app.json` |
| React Native application routes | `app/` |
| Butler services and security controls | `services/` |
| UI components | `components/` |
| Consolidated PC companion server | `server/butler_server.py` |
| Server regression tests | `server/*test.py` |
| Final security record | `BUTLER_AI_HARDENING_FINAL_REPORT.md` |
| Coding constraints and continuity record | `BUTLER_AI_MASTER_CODING_PROMPT.md` and `BUTLER_AI_UNFINISHED_WORK_LEDGER.md` |
| Dependency lockfile | `pnpm-lock.yaml` |

## Integrity

`RELEASE_CHECKSUMS_v31.5.sha256` in the archive contains SHA-256 hashes for the included files. Verify hashes after extraction before transferring the release to another system.

> This manifest records engineering validation, not a legal opinion, security certification, warranty, or claim of absolute protection.
