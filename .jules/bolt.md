## 2026-02-07 - High-Frequency Pose Tracking Loop Optimization
**Learning:** In applications using MediaPipe or similar real-time AI tools at 30-60 FPS, React state updates and array copying (e.g., `[...prev, newData]`) create significant GC pressure and reconciliation overhead.
**Action:** Move high-frequency data storage (like frame history) to `useRef`. Mutation of refs is $O(1)$ and avoids triggering re-renders of the entire component tree. Combine this with `React.memo` to isolate the AI engine from other state updates (like timers or angles). Also, batch canvas operations (`stroke()`, `fill()`) to minimize draw calls per frame.

## 2026-02-08 - High-Frequency Re-render Bottleneck in Workout Session
**Learning:** Even with memoized children (like AIEngine), unstable props (literal objects/arrays created in render) will trigger redundant reconciliation and potential re-renders. Unused state updates (like frameData every 10 frames) in a high-frequency loop (60fps) waste CPU cycles even if they don't affect the final UI.
**Action:** Always memoize object/array props passed to heavy components using `useMemo`. Remove unused state and ensure high-frequency updates are as isolated as possible. Wrap static global components like `NavHeader` in `memo` to ensure they stay stable during intensive tracking sessions.

## 2026-02-10 - Throttled State Updates for High-Frequency UI
**Learning:** Throttling React state updates (e.g., to ~15 FPS) in high-frequency loops (like pose tracking) drastically reduces reconciliation overhead without sacrificing user-perceived responsiveness for text-based feedback.
**Action:** Use a `useRef` timestamp to guard `setState` calls in callbacks triggered at 60 FPS. Combine this with mutating history arrays in refs (`push`/`shift`) instead of spread/slice to eliminate O(N) copying overhead per frame.
