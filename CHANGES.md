# Butler AI — Onboarding Exit Architecture
# Version 2.0.0 | Production-Ready

## Summary

Navigation out of the 10-page INTRO onboarding is owned by a single function in a single file.

```
services/onboardingExit.ts   ← Only place that calls router.replace on exit
app/(tabs)/onboarding.tsx    ← Calls exitOnboarding(), nothing else
app/_layout.tsx              ← initApp runs ONCE, never navigates again after boot
```

**The invariant:** After `_layout.tsx` sets `didInitRef.current = true`, no code in `_layout.tsx` ever calls `router.replace` again. All onboarding exit navigation is owned by `exitOnboarding`.

---

## Before vs. After

### Before (broken — multiple competing exit mechanisms)
```
Screen10Ready
├── global.__onboardingComplete()   ─┐
├── setNeedsOnboarding(false)        │  all competing,
├── router.replace('/(tabs)')        │  all racing
└── router.navigate('/(tabs)')      ─┘
```

### After (v2.0 — single path)
```
OnboardingTab.finish()
└── exitOnboarding(router)   ← services/onboardingExit.ts
    ├── AsyncStorage.multiSet(ALL_CONSENT_KEYS)
    ├── Retry gate key individually  
    └── router.replace('/(tabs)/nexushome')

_layout.tsx initApp
└── didInitRef guard → runs ONCE, never navigates again
```

---

## Services

### `services/onboardingExit.ts` — Primary Exit Function

```typescript
export async function exitOnboarding(router): Promise<OnboardingExitResult>
export async function exitOnboardingBool(router): Promise<boolean>  // legacy shim
```

**What it does:**
1. Calls `AsyncStorage.multiSet` with all 9+ consent keys
2. Retries the gate key (`ONBOARDING_DONE_KEY`) individually for resilience  
3. Attempts `router.replace('/(tabs)/nexushome')` then fallbacks
4. Returns result object — never throws, never hangs

### `services/devOnboarding.ts` — Dev/QA Utilities (DEV only)

| Function | Description |
|----------|-------------|
| `devResetOnboarding()` | Clears all keys → fresh install behavior |
| `devCompleteOnboarding()` | Sets all keys to `'1'` → skips onboarding |
| `devOnboardingStatus()` | Returns `Record<string, string \| null>` snapshot |
| `devPrintOnboardingStatus()` | Pretty-prints snapshot to console |
| `devSetOnboardingKey(key, value)` | Granular: set or clear one key |
| `devSimulateFreshInstall()` | Full reset including first-launch marker |

---

## Testing Checklist

```
Fresh install (no AsyncStorage)
[ ] App routes to INTRO tab
[ ] All 10 pages navigate correctly  
[ ] Safety page (page 3) blocks NEXT until all checkboxes checked
[ ] Pledge page (page 4) blocks NEXT until all checkboxes checked
[ ] FINISH button navigates to nexushome and stays there
[ ] SKIP button also navigates to nexushome

Warm boot (onboarding complete)
[ ] Routes directly to nexushome — no INTRO flash

Edge cases
[ ] Double-tap FINISH is idempotent (launchingRef guard)
[ ] BACK from page 10 returns to page 9
[ ] Kill app during FINISH → reopen → button unlocks (launchingRef reset on error)
```

---

## FAQ

**Q: Why is `exitOnboarding` in its own service file?**  
Isolation. It can be imported by the onboarding tab, tested in unit tests, and future screens without any dependency on the layout tree.

**Q: What happens if `AsyncStorage.multiSet` fails?**  
`exitOnboarding` retries the single gate key individually. If that also fails, navigation still proceeds. On next cold boot, the missing key might trigger INTRO again — but that's better than a stuck button.

**Q: Is `devOnboarding.ts` safe to ship in production?**  
All logging is guarded by `__DEV__`. The functions themselves run in production too (they just don't log), but they should only be called from Settings DEBUG TOOLS or test code.

**Q: The `launchingRef` pattern — why not `useState`?**  
State updates are async — there's a window where a second tap could slip through. Refs are synchronous; `launchingRef.current = true` is visible immediately.

---

*Butler AI — Onboarding Exit Architecture v2.0.0*
