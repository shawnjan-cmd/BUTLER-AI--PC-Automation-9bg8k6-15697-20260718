# Butler Authorship and Copying Evidence

## Scope

This file describes technical evidence for the supplied source snapshot. A hash proves that a particular snapshot has not changed after the hash was created; it does not independently prove who authored the code, who owns it, or that the implementation has no prior art.

## Current snapshot

The deterministic manifest generator is `tools/provenance_manifest.py`. It excludes build outputs, package installations, caches, and repository metadata, then hashes each included text source and a sorted source-tree digest.

The latest generated manifest is:

- **Path:** `/home/ubuntu/BUTLER_REBUILD_WORK/BUTLER_PROVENANCE_MANIFEST.json`
- **Schema:** `butler-provenance-v1`
- **Included text files:** 730
- **Source-tree SHA-256:** `0f67643f6275334efbb11f5a90b60534a3d0386cb678ed1fe91ada8b84526ada`

## Preservation procedure

For each meaningful release, preserve the source ZIP, the manifest JSON, the ZIP SHA-256, the build log, test log, dependency lockfiles, contributor agreements, third-party notices, and a dated record stored outside the project directory. Keep the private repository history and signed release tags where possible. Do not place private signing keys, credentials, or trade-secret thresholds into the evidence archive.

## How to use the evidence

A later snapshot can be compared against this manifest to identify exact file changes, copied blocks, renamed files, or sequence similarities. Direct copying of original source expression is materially different from independently implementing a similar idea. A comparison report should identify the files, normalized code regions, dates, licenses, and chain of custody rather than relying on product names or abstract workflow similarity.

## Provenance labels

The manifest labels newly authored mechanism candidates separately from inherited project files, assets, license records, and files requiring review. Those labels are engineering records, not legal determinations. Before enforcement, obtain legal advice on copyright registration, contributor ownership, trade-secret controls, trademark rights, and any patent strategy.
