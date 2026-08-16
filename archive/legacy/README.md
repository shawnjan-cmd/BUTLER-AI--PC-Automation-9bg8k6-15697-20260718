# Legacy Experimental Modules

This directory preserves unused experimental modules removed from the active Expo import graph during the Butler AI preflight audit. They are not screens, routes, or active product features.

The files are archived instead of deleted because they may contain historical design or research material. They must not be reintroduced into the active application without completing a new typecheck, dependency check, performance review, and privacy review.

| Former active path | Archive reason |
|---|---|
| `components/ui/NexusHomeExtras.tsx` | Unused dashboard experiment with a missing mascot asset and several continuous visual loops. |
| `components/backgrounds/MatrixRain.tsx` | Unused web-only canvas module using browser globals. |
| `services/chat.ts` | Unused legacy chat helper importing a removed connection adapter. |
| `services/knowledgeGrowthEngine.ts` | Unused autonomous growth experiment importing removed internal modules and scheduling background-style work. |
