# Hosting limits and bugs already hit

## Published-page limits (Artifact hosting)
- Scripts only from cdnjs, jsdelivr/npm, tailwind CDN, jquery, with exact pinned versions at least 14 days old (three.js r128, peerjs 1.5.4 were used). No other network: PeerJS cloud signalling, remote images and fetches fail, hence the BroadcastChannel fallback.
- `window.storage` and `localStorage` rules differ in the preview vs published page; IndexedDB and sessionStorage work in the published page and must be try/catch-wrapped.
- Include `viewport-fit=cover` and safe-area insets for fixed HUD elements. Use typographic apostrophes in visible text.
- Small changes to a published page: Artifact `edit` with `url` and `edits`; a rewrite: write the file and publish with `url`.

## Bugs to avoid (all happened)
- `let` declared after `fit()` runs -> TDZ crash. Use `var` for globals touched by early code.
- `undefined <= 0` is false: removing `P.h` broke jump pads until the condition was simplified. When deleting a field, grep every use.
- `mkdir -p x/{a,b}` fails under `sh`; the files after it silently failed to write.
- Stair junction: collide with towers using the circle, but allow the tower when the CENTER is on stairs, or you can never walk up.
- Dropping off a tower edge left the circle overlapping the tower: compute `high()` with the circle, not the center, and use the escape hatch.
- Painter's order: entities on towers must sort after the tower (`y+200`) and be drawn raised.
- Sync races: transmitting score counters double counted; an idempotent kill log fixed it.
- Mutating remote players' hp locally on bullet hit is only a visual; their own client is authoritative.
- Typing in the lobby inputs fires game hotkeys (G, R, V): guard with `paused`.
- Pointer lock can throw in sandboxed iframes: try/catch plus edge-turn fallback.
- Adding Three.js lights at runtime recompiles shaders: keep one permanent light.
- Backgrounded tabs freeze requestAnimationFrame: do networking on timers.
- User contradictions (PixiJS vs plain JS) are resolved by the latest instruction; say so in one line.
