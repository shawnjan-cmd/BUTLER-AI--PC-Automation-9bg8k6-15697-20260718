# Home screen fix + vitals dashboard — what changed

## How to apply
Replace these 3 files in your repo at the **exact same paths**:

- `app/(tabs)/nexushome.tsx` (replace)
- `components/home/SystemVitalsGrid.tsx` (new file)
- `.gitignore` (replace)

Then run:
```
git rm -r --cached .reskin-backup .env
git add -A
git commit -m "Fix undefined PerformanceStrip crash, add SystemVitalsGrid dashboard, clean repo"
```
(`git rm --cached` untracks them without deleting them from your disk — safe.)

## What changed and why

**1. Fixed a real crash bug.** `nexushome.tsx` called `<PerformanceStrip .../>` but never
imported it anywhere in the file — that's an undefined component reference, which React
throws on at render time. This line was live on your Home screen.

**2. Added `SystemVitalsGrid.tsx`.** Replaces that broken line with a proper 2×2 dashboard
card grid — CPU / RAM / DISK / Latency, each with a real trend delta and a real sparkline
— matching the "NEXUS Command Center" look from your reference screenshots. It's wired to
your existing `performanceHistory` service (the same real data `SparklineWidget` already
uses elsewhere in the app), so every number and every sparkline is genuine — nothing is
faked or randomly incremented.

**3. Deleted ~600 lines of dead code.** `NexusMegaHeader` (and the const arrays only it
used — `CRAWLER_LINES_H`, `LAN_NODES_H`, `HEADER_CAPS`, `HEADER_TIPS`) was defined in the
file but never actually rendered anywhere — `CommandHeader` is the component that's
actually on screen. Removing it doesn't change anything visually; it just makes the file
~15% shorter and easier to work in.

**4. Repo hygiene.** Added `.reskin-backup/` (a 3.3MB stale backup folder that was tracked
in git) and `.env` to `.gitignore`.

Both edited files pass a full TypeScript syntax check.

## What I deliberately did NOT touch
Your Home screen has a lot of other sections below this (security showcase, crawler/KB
cards, script forge, network metrics, core surfaces launcher) that are already wired to
real data and working. I didn't rewrite those — doing that blind, without being able to
compile/run the app here, risks breaking things that currently work. If you want the next
pass to tighten any specific section (e.g. consolidate the four stacked security cards
into a denser 2-column layout, or restyle a different tab), point me at it and I'll do the
same read-first, verify-after approach on that piece specifically.
