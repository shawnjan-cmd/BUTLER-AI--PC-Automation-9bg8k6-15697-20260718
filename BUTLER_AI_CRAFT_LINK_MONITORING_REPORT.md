# Butler AI Craft Link: Monitored Script-Creation Test

## Scope

This report records the guarded test of a natural-language script-creation path and the accompanying **Craft Link** interface upgrade. The test used one intentionally harmless reviewed draft:

```python
print('BUTLER_SAFE_DRAFT_OK')
```

The script has no network access, no file writes, no process control, and no account or external-service side effect.

## Verified Workflow

| Sequence | Guarded action | Evidence |
|---:|---|---|
| 1 | Natural-language request classified as a local-change automation plan | `AUTOMATION_PLAN` event |
| 2 | Reviewed test draft written to the sandbox | `SCRIPT_DRAFT` event |
| 3 | AST policy inspection and Python compile dry-run completed | `FLOW_INTENT` event and `DRY_RUN_PASSED` status |
| 4 | Test harness represented a separate explicit approval boundary | `FLOW_APPROVAL` event and single-use approval token |
| 5 | Exact digest-bound draft executed | terminal receipt and `BUTLER_SAFE_DRAFT_OK` output |
| 6 | Receipt captured in the observatory | `FLOW_RECEIPT` event with succeeded outcome |

> **Important:** The explicit approval in this report was invoked by the test harness after a successful dry run. Chat planning never calls approval or execution automatically.

## Craft Link UI Contract

The Android chat now displays a live **Butler Craft Link** only while a script request is being processed. It presents a compact, responsive Android ↔ paired-PC bridge, four clear stages, a short correlation-safe trace identifier, and the latest non-secret workflow event.

| Visual stage | Data source | Meaning |
|---|---|---|
| Intent | Android workflow monitor | A natural-language request has been accepted for planning. |
| Memory | Encrypted local pattern vault | Reviewed task patterns are being matched locally. |
| PC Check | Paired companion server | The PC is validating the plan boundary; no code has run. |
| Draft | Flow Ledger state | The user may review the draft in Script Library; execution remains separate. |

The animated bridge is cosmetic only. Its textual state is sourced from the `automationWorkflowMonitor` state machine, which rejects out-of-order jumps and terminal-state rewrites. It cannot show a receipt, approval, or completed status until the corresponding monitored event exists.

## Anti-Drift Safeguards

The workflow monitor generates a unique correlation identifier per request and persists an encrypted, compact trace. It stores stage, source, timestamp, status, and redacted detail. It does not store script source, raw chat, passwords, API keys, approval tokens, or full output.

The accepted order is `android_intent → pattern_match → pc_preflight → memory_manifest → draft_ready → script_library_handoff → dry_run → approval_required → receipt`. A jump across stages, a regression, or an attempt to progress after a failed, blocked, or terminal receipt state is rejected.

## Validation Results

| Validation | Result |
|---|---|
| TypeScript typecheck: `pnpm exec tsc --noEmit` | Passed with zero errors |
| Monitored harmless script-creation test | Passed: 1 test |
| Full Python regression suite | Passed: 66 tests |

## Key Files

| File | Responsibility |
|---|---|
| `services/automationWorkflowMonitor.ts` | Correlation-safe event order, encrypted trace persistence, redacted structured logging |
| `services/automationMemoryVault.ts` | Reviewed automation pattern catalog and encrypted Android memory |
| `services/automationMemorySync.ts` | Fail-closed redacted manifest sync to the paired PC |
| `app/(tabs)/butler.tsx` | Craft Link visual and draft-only chat handoff |
| `server/butler_server.py` | Local-only planning, Flow Ledger, receipt, manifest, and Ollama endpoints |
| `server/butler_monitored_creation_flow_test.py` | Harmless end-to-end script-creation regression test |
