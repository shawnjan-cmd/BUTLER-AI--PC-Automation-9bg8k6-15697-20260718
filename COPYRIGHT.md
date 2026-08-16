# Butler AI — Copyright and Provenance Notice

**Draft for legal review.** This notice describes intended ownership and licensing boundaries; it is not a substitute for registration, contributor agreements, license review, trademark clearance, patent analysis, or advice from qualified counsel.

Copyright in original Butler source code, documentation, original UI artwork, original mascots, and other original expressive assets belongs to the person or entity that can prove authorship and owns the rights through valid assignment or employment agreements. The current source snapshot identifies the project owner as **Andrej Sladkovic**, but this file does not by itself prove authorship, chain of title, or ownership of every historical file.

## What copyright can protect

Copyright may protect original expression such as source-code text, documentation, artwork, icons, layout expression, and other fixed creative works. It generally does not create an exclusive right over an abstract idea, workflow, algorithm, data structure, system architecture, product feature, or general user-interface concept. The Butler Flow Ledger and Capability Receipt Graph are therefore described as an original Butler implementation and composition, not as legally certified inventions with no prior art.

## Butler-authored mechanisms

The following mechanisms were authored for the current rebuild and are recorded by hash in the provenance inventory:

- Flow Ledger stage enforcement and hash-linked receipts.
- Capability manifest validation with deny-by-default scope, network, timeout, approval, and undo checks.
- Intent Shadow argument-digest binding.
- Trust Epoch Cascade design for invalidating stale approvals and sessions.
- Freshness Envelope status representation.
- Quiet-Failure aggregation and bounded diagnostic grouping.
- PC-backed local voice-lane privacy policy and ephemeral receipt handling.

These mechanisms may combine standard security and systems techniques. No statement is made that any individual mechanism is unprecedented, patentable, or impossible to recreate independently. A formal prior-art search and legal review would be required for those conclusions.

## Inherited and third-party material

The repository also contains inherited Butler code, earlier project assets, open-source dependencies, platform code, fonts, images, and other third-party material. Their rights are governed by the applicable license, permission, assignment, or platform terms. The project must not label inherited or third-party material as newly authored or exclusively proprietary. See `THIRD_PARTY_LICENSES.md`, package manifests, and the provenance register.

The server’s open-source license, if distributed under one, applies according to its actual license text. It does not automatically convert unrelated app code, assets, or documentation into the same license, and it does not remove required third-party notices.

## Trade secrets and confidentiality

Non-public implementation details may qualify for trade-secret protection only if the owner takes reasonable measures to keep them secret and the information is not independently developed or lawfully obtained by others. Publishing a detail in a public repository, package, store listing, or prompt may reduce or eliminate trade-secret protection for that detail. Keep private strategy thresholds, build credentials, signing keys, private release tooling, and confidential research out of public archives.

## Brand protection

The Butler name, bowtie glyph, mascots, slogans, and cosmetic-pack names may require separate trademark or design-protection analysis. Copyright ownership does not automatically create trademark rights, and a trademark does not create ownership of an algorithm or software workflow.

## Permissions and contact

No permission beyond the applicable written license is granted by this notice. Before distributing the project, verify the final license, contributor assignments, third-party notices, platform terms, and jurisdiction-specific requirements. Do not rely on statutory damages, criminal penalties, DMCA procedures, or other legal remedies until a qualified attorney confirms that they apply to the specific work and jurisdiction.

**Project contact:** Andrej Sladkovic  
**Last reviewed:** 2026-08-14
