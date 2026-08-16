# Butler AI Small-Device Capability Plan

## Device tiers

| Tier | Screen target | Motion policy | Data policy | Visual policy |
|---|---:|---|---|---|
| Compact | 320–360 dp width | One hero transition and at most four status pulses | Poll on focus, pause in background, 25-second minimum refresh | One-column cards, 44 dp controls, concise labels, no decorative particle loops |
| Standard | 360–430 dp width | Contextual enter/exit transitions and bounded mascot cues | Focused data panels and on-demand graph mounting | Two-column metric clusters only when cells remain legible |
| Expanded | 430+ dp width | Same motion count with additional breathing room, not more loops | Same request cadence and cache policy | Wider card composition without changing information hierarchy |

## Guard policies

Butler must use `useWindowDimensions` for layouts that depend on available width or font scaling. It must not rely on a module-level `Dimensions.get()` value for responsive layouts that can change at runtime. Any card grid switches to one column below a compact-width threshold. Text remains `allowFontScaling` compatible and long labels use wrapping or truncation rather than reduced accessibility.

All polling must be conditional on screen focus, a foreground application state, and a connected local server. Requests should not overlap; cancellation must occur when the screen unmounts or the app backgrounds. The baseline cadence is 25 seconds for passive telemetry, with manual refresh remaining user initiated. No persistent Android service is required or permitted.

Motion remains transform/opacity oriented, with a compact motion profile that disables nonessential loops. The UI never schedules unbounded particles, constant graph redraws, or per-frame React state updates. Heavy graph or console surfaces mount only after the relevant tab becomes active and must expose a clear offline or empty state rather than seeded data.

## Compatible component palette

The existing `react-native-svg` dependency supports Butler-original radial gauges, sparklines, node maps, traces, heat strips, timelines, and security rings without requiring a large chart dependency. `react-native-chart-kit` is already present but should be evaluated per screen because custom SVG primitives can be narrower and more controllable. FlashList is Expo-compatible and should be added only for data sets that demonstrably exceed the current FlatList/ScrollView performance budget, such as long logs, script libraries, or scan reports.

The visual system can safely use Expo Router, Safe Area Context, React Native Gesture Handler, Reanimated, SVG, masked views, gradients, icons, and image caching. It should not add a heavy native rendering module simply for decorative motion, and it must keep optional Skia visuals behind a performance profile until the native AAB build path is stable.

## Ownership boundary

New Butler layouts, component contracts, motion rules, token maps, and copy are authored specifically for this project. Open-source dependencies remain subject to their respective licenses and notices; the project must not state ownership of those dependencies or copied upstream code.
