# Butler AI Performance and Capability Research

## Official findings

React Native targets a 16.67 ms frame budget on 60 Hz Android devices. The design system should therefore keep animation work narrow, prefer `transform` and `opacity` over layout properties, avoid expensive work inside input handlers, and validate performance in a release build rather than development mode. Long or data-dense interfaces should use virtualized lists, predictable item layout where possible, and deliberate deferred work.

Expo SDK 53 supports React 19, Hermes profiling, Chrome DevTools, Expo Router, and Reanimated. The app should keep rendering work predictable through typed state, direct ESM imports where practical, and memoized expensive surfaces. Complex, gesture-bound effects can use Reanimated worklets only after confirming each screen has a limited animation budget.

Reanimated advises keeping simultaneous animated components below about 100 on low-end Android hardware. The Butler motion policy is therefore one foreground hero motion, a small number of status pulses, and no background particles or continuous decorative loops on a low-motion profile. The visual system should degrade by stopping nonessential loops when screens lose focus or the application is backgrounded.

Android advises minimizing large dependencies and bitmap allocations, releasing UI-related resources when the app is hidden, and avoiding persistent services unless there is an active user-facing reason. Butler remains foreground-only and should pause network polling, graph redraws, image-heavy previews, and nonessential timers while backgrounded.

React Native `AppState` exposes foreground, background, Android focus, and Android blur events. Butler uses the active state as the hard gate for passive telemetry and leaves manual actions available only while the app is visible. The shared connection service adds a bounded request timeout and collapses simultaneous token-refresh reconnects into one request.

`useWindowDimensions` updates for width, height, and the user’s font scale. New command-deck layouts therefore move to a single column at compact widths or enlarged font scale instead of shrinking important labels. This is more reliable than hard-coding a launch-time `Dimensions.get()` result for responsive content.

FlashList is Expo-compatible and can recycle long, repeated rows. It is a future candidate for long logs, script catalogs, and scan results only when real profiling shows that a current virtualized list is insufficient. The existing `react-native-svg` package remains the default for lightweight Butler-original gauges, traces, rings, node maps, and timeline components. Gesture Handler and Reanimated are Expo-compatible for opt-in drag, press, and inspection interactions; motions must remain bounded and respect the existing reduced-motion profile.

## Sources

1. https://reactnative.dev/docs/performance
2. https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps
3. https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/
4. https://developer.android.com/topic/performance/memory
