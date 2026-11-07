---
name: browser-shooter-game-builder
description: Build and extend single-file browser shooter games in plain HTML/CSS/JS - top-down 2.5D canvas, Three.js first-person 3D view, Fortnite/Unreal-style HUD, big scattered maps (walls, buildings, towers, stairs, jump pads, trees), pickups, chests and bombs with realistic explosions, bots, and team deathmatch multiplayer with PeerJS match codes plus IndexedDB persistence. Use this skill whenever the user mentions a shooter, top-down shooter, FPS, battle-royale or Fortnite-style map, PixiJS/Three.js/canvas game, match codes, jump pads, bombs, game HUD, or wants to add features (health/ammo tokens, double jump, trees, 3D mode, multiplayer) to an existing browser game - even if they only say "make a game". Also use it for token-efficient game iteration, since it contains a working template and proven edit patterns.
license: MIT
compatibility: Any coding agent with file read/edit tools and a shell. Node.js is needed only for the optional smoke test. Games run in any modern browser.
metadata:
  version: "1.0"
  category: game-development
---

# Browser shooter game builder

This skill captures a full build session: a top-down shooter that grew into a 3D-capable team deathmatch game, all in ONE html file. A complete working version is bundled at `assets/shooter-template.html` (~35 KB). Starting from it is the single biggest token saver: add features with small edits instead of regenerating.

## Workflow (keep it lean)

1. **Resolve the spec in one line.** Users often contradict themselves (e.g. "use PixiJS ... instead use html css and js"). Follow the latest instruction, say which in one sentence, move on. Ask at most one question, only if the subject is truly missing.
2. **Start from the template** (copy `assets/shooter-template.html` to the user's project or output folder as `<name>.html`) unless the user wants a different genre. Do not `view` the whole file. Use `grep -n "function \|^const \|^let " file` to find landmarks, then `sed -n 'A,Bp'` for ranges.
3. **Change by targeted edits.** Copy `old_str` exactly from the file, batch every edit for the request into one call where your edit tool allows it (all-or-none is ideal; otherwise use exact string replacement). Split big functions with two small edits rather than rewriting (example: `draw()` became `world2d()` + `draw()` by changing only its first and middle lines).
4. **Verify cheaply**: run `node scripts/smoke_test.js <file.html>` (syntax check + 300 simulated frames + bomb). Fix anything it prints before delivering.
5. **Deliver**: hand the single `.html` file to the user (it opens by double-click), or publish it as a hosted page if your environment supports that. Reply in ~150 words: what changed, what is untested, what was skipped. Never narrate tool use.

Read `references/token-saving.md` first if the user mentions cost, tokens, "lazy", or `/ponytail`.

## What the template contains (and where to extend)

| Area | Where / how |
|---|---|
| Map generation | `build0()`: `scatter(n, mk)` rejection-samples non-overlapping boxes. Add a new object type by adding one `scatter(...)` call and a draw case. Seeded by match code via `build(seed)` wrapper. |
| Obstacles | Everything solid is a rect in `walls` with optional props `c` (colors), `hh` (extrude height), `tree`. Reuse this array for new solid things. |
| Height | `towers` + `stairs` give `z` (0/1). `high(x,y)`, `blocked(e,x,y)`, `move(e,dx,dy)`. |
| Pickups | `pick` (hp/ammo), `chests` (bombs), respawn queue `Q`. |
| Bombs | `lobs` (thrown), `blasts` (effects, analytic particles in `b.sp`). |
| Bots | `bots`, simple wander/chase/shoot AI inside `update()`. |
| 2D render | `world2d()` (painter-sorted items `it`), `ent()`, `slab()`, `tree2d()`, then `draw()` overlay (vignette, flash, crosshair). |
| 3D render | `init3d()`, `rebuildStatic()`, `render3d()`, pooled `sync()`. Toggle with V. |
| HUD | HTML/CSS panels (`.p`), `ui()` updates them each frame, minimap canvas `#mm`. |
| Multiplayer | `openNet()`, `recv()`, `netStep()`, lobby overlay. |
| Persistence | IndexedDB helpers `kvGet/kvSet`, `save()`. |

## Which reference to read

- Visual quality, palette, depth, player and building design, HUD, bomb effect: `references/visual-design.md`
- Movement, collisions, height, jump pads, bullets, bomb physics, bot AI, numbers: `references/physics-movement.md`
- Adding or improving the 3D view (Three.js), best 3D options, performance: `references/three-js-3d.md`
- Team deathmatch, PeerJS, BroadcastChannel fallback, IndexedDB: `references/multiplayer.md`
- Hosting limits and bugs already hit (read before debugging): `references/gotchas.md`

## Defaults that worked (change only if asked)

World 6000x4500 (keep 4:3 so the 180x135 minimap scales), player 240 px/s, bots 120 px/s, magazine 30, 3 reloads (reload 1.4 s), fire interval 0.12 s, bullet 1100 px/s lasting 0.8 s, damage 25 (bot hp 50, player hp 100 + shield 50), bomb fuse 1.4 s, radius 140, 100 dmg to bots / 40 to the thrower, chests every 15 s (max 6), tokens respawn 20 s. Controls: mouse aims, hold right-click or W to move toward cursor, left-click shoot, R reload, G bomb, V toggle 3D. The user REMOVED space-bar jumping and double jump later; do not re-add unless asked.
