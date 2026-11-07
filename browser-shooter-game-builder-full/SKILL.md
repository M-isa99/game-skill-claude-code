---
name: browser-shooter-game-builder-full
description: Build and extend single-file browser shooter games in plain HTML/CSS/JS - top-down 2.5D canvas, Three.js first-person 3D view, Fortnite/Unreal-style HUD, big scattered maps (walls, buildings, towers, stairs, jump pads, trees), pickups, chests and bombs with realistic explosions, bots, and team deathmatch multiplayer with PeerJS match codes plus IndexedDB persistence. Use this skill whenever the user mentions a shooter, top-down shooter, FPS, battle-royale or Fortnite-style map, PixiJS/Three.js/canvas game, match codes, jump pads, bombs, game HUD, or wants to add features (health/ammo tokens, double jump, trees, 3D mode, multiplayer) to an existing browser game - even if they only say "make a game". Also use it for token-efficient game iteration, since it contains a working template and proven edit patterns. This is the single-file edition: every reference, the full game template and the smoke test are inlined below, so no other files are needed.
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

---

# Part 2: Reference guides (inlined)

---

## Reference: visual-design.md

## Realistic design, depth, color, player look, HUD, bomb effect

### Depth in a 2D top-down view (2.5D)
- **One light direction** (north-west). Shadows are the solid's base rect offset (+22,+22) in rgba(0,0,0,.28); roofs offset (+34,+34).
- **Extruded slab**: draw the base rect in the dark side color, then the same rect shifted UP by height `hh` in the top color, plus a 2px highlight. The uncovered bottom strip reads as the south wall face.
```js
const slab=(o,hh,top,side)=>{g.fillStyle=side;g.fillRect(o.x,o.y,o.w,o.h);g.fillStyle=top;g.fillRect(o.x,o.y-hh,o.w,o.h);
  g.fillStyle='rgba(255,255,255,.22)';g.fillRect(o.x,o.y-hh,o.w,2)};
```
- **Painter's order**: build `it=[[sortY, drawFn],...]` for walls (sortY = bottom edge), towers, trees, chests, bots, players; sort ascending. Elevated entities use `y+200` so they draw over tower tops.
- **Elevation**: lerp `dz` toward `z*34`; draw the body at `y-dz`, shadow at ground level: smooth stair/tower climbing.
- **Roofs** drawn last; alpha 1 outside, .12 when the player is inside (also hides bots inside).
- **Ground**: pre-render a 256px noise tile once, `createPattern`, fill the map rect in world coordinates; faint 200px grid (alpha .08).
- **Screen polish**: radial vignette (clear at 35% of H to rgba(0,0,0,.5) at the edge), red damage flash from `P.hit`, explosion flash, shake via random translate scaled by `shake`.

### Color system
Grass #4a7c3a | wall top #8a6a4c side #5a4129 | tower #9aa0aa / #4c515a | rock #9a9a9a / #5e5e5e | furniture #b08968 / #6f4e37 | roofs red #a13d2d/#6e2418, blue #3d5a80/#26364d, green #6b705c/#3f4238 with floors #8f7352 / #6d7b8a / #9a8c6b | pads #e8c547 with #ff5a3c core | HP #2ecc71 | ammo #f39c12 | bombs #ffb347 | bullets #ffe066 | stairs hsl(35,25%,32+5i%).
Rules: one hue family per material; side face ~35-40% darker than top; team colors red `['#ff7a66','#8e1f12']`, blue `['#6cc4ff','#134f8a']` (light/dark pair for gradients); friendly bars green, hostile red.

### Player and enemy design
- Top-down: circle r=16 with radial gradient (highlight at -5,-5), dark barrel rect (length r+14, thickness 6) rotated to aim, soft ground shadow ellipse, floating HP bar (+ name tag for humans).
- 3D: cylinder body (r 14-16, h 44), skin-tone head sphere (r 11), dark gun box; `rotation.y = -aim`; body color per team.
- Own player in FPS: hide the body, show a viewmodel gun parented to the camera with a muzzle flash (visible while `P.cd>.06`) and a dip while reloading.

### Buildings that feel real
Random size (420-540 x 320-400), 30px walls, 110px south door, interior partition with a 100px doorway, 3 low furniture blocks (cover), chimney, roof overhang, plank lines on the floor, coloured roof per building. Place buildings FIRST in `scatter` so they get room.

### Trees
Solid 30x30 trunk collider in `walls` (`tree:1`). Top-down: shadow ellipse, trunk, two canopy circles with radial gradients, painter-sorted so players walk behind canopies. Cluster 75% of trees around ~12 forest centers, 25% scattered. 3D: InstancedMesh (see three-js-3d.md).

### Unreal/Fortnite-style HUD (HTML/CSS, not canvas)
Dark translucent panels `rgba(12,16,24,.72)`, 1px border `rgba(255,255,255,.18)`, `backdrop-filter:blur(6px)`. Bottom-center: shield bar over health bar, skewed -14deg, numbers inside. Bottom-right: big magazine number, reload progress bar, bomb count. Top-right: minimap. Top-center: pill with code, score, enemies. Bottom-left: scoreboard. Crosshair on canvas at the mouse (screen center in FPS); hide the OS cursor. Use `env(safe-area-inset-*)`.

### Realistic bomb effect (spawn `{x,y,t:0,sp:[40 x {a,s,v}]}`, life 3.5 s)
1. **Scorch** decal: dark ellipse fading over 3.5 s.
2. **Fireball**: radial gradient white core, orange, transparent; radius 30+110*sqrt(min(1,t/.3)); gone by .7 s. 3D: additive sphere, HSL hue .09 to .04.
3. **Shockwave ring** expanding to ~170 px by .6 s.
4. **Sparks/debris**: radius `s*(1-exp(-4t))/4`, height `v*t-450*t*t`, fade by 1.4 s. 2D: radial streaks; 3D: `Points`, additive.
5. **Smoke**: 7 puffs staggered .1 s, dark gray, rising and growing, alpha .5 to 0 by 3.5 s.
6. **Light and camera**: screen flash scaled by distance, `shake=min(1,400/(60+dist))` decaying 1.8/s, in 3D one permanent PointLight whose intensity spikes then decays (never add lights at runtime: shader recompiles stutter).
Damage logic is separate: radius 140, fixed damage, thrower takes less, teammates only hurt by their own bomb.

---

## Reference: physics-movement.md

## Movement, collisions, height, projectiles, bots

### Collision
- Entities are circles (R=16); solids are axis-aligned rects. Circle-vs-rect: clamp the center to the rect, compare squared distance with R*R.
- **Move each axis separately** (try x, then y): gives wall sliding for free.
- **Escape hatch**: if the entity already overlaps something (landed in a wall, dropped off a tower edge), skip collision for that step or it gets stuck forever.
- Clamp to world bounds and add 4 thick boundary walls (100px) outside.
- **Anti-tunnelling**: cap `dt` at .05; fastest bullet 1100 px/s moves 55 px per step, walls are at least 40 px thick.

### Height without a real 3D engine
`z` is 0 or 1. `high(x,y)` = center inside a stairs rect OR circle touches a tower. Ground units (z=0) collide with towers unless their center is on stairs; elevated units ignore towers. Result: you can only enter a tower via its stairs, and walking off an edge drops you. Bullets carry `z` (shooter's height): z=1 bullets ignore walls, so high ground wins. Stairs run toward the tower; in 3D the camera height is the ramp fraction along the stairs (`TH*(s.x+s.w-x)/s.w`), TH on the tower, lerped .25/frame.

### Movement
- Top-down: aim = atan2(mouse - screen center); hold right-click or W to walk toward the cursor at 240 px/s.
- FPS: W/S forward/back, A/D strafe, normalize the vector, `x = c*fx - s*fy`, `y = s*fx + c*fy` with c,s = cos/sin(aim). Yaw from pointer lock `movementX*.0025`; if pointer lock is unavailable (iframe), fallback to edge-turn `(mx-W/2)/(W/2)*2.2*dt`.
- Locking input while dead or after a win: one `lk()` helper used by move, shoot and bomb.

### Jump pads
Stepping within 30 px starts `jump=.6 s`: dash 750 px/s along the aim, collisions ignored, visual arc `70*sin(pi*jump/.6)`, then the escape hatch frees you if you land inside something.
(A space-bar hop/double jump existed: `vz=450`, gravity 1100, second jump allowed until landing, walls ignored while `h>40`. The user later asked to remove it.)

### Weapons
Fire interval .12 s, spread +-.025 rad, mag 30, 3 reloads, reload 1.4 s (auto-reload on empty click), bullet 1100 px/s for .8 s, damage 25. Bots: .8 s interval, 600 px/s, spread +-.15, damage 8, only shoot when within 650 px with clear line of sight (sample 12 points along the segment against `walls`).

### Bombs
Chest pickup gives 1 bomb (max 5). Throw toward cursor (or facing in FPS), clamp range 450. Position lerps from thrower to target in .5 s with arc `70*sin(pi*k)`, blinks, explodes at 1.4 s. Radius 140 hits everyone (bots 100, thrower 40). Explosion visuals use analytic particles (see visual-design.md). In multiplayer each client hurts only itself.

### Pickups and respawn
HP +35 only if hp<100, ammo +1 reload only if <9. Picked items go to a timer queue `Q` and return in the SAME place (deterministic across clients). Solo can respawn elsewhere. Damage order: shield first, then health.

### Bots
Wander to random targets (re-pick every 4 s, on arrival, or when blocked), chase and shoot when they see you, stop approaching at 300 px. They obey the same `move()` so they can climb stairs.

---

## Reference: three-js-3d.md

## Adding a 3D first-person view to the 2D game

### Choice
Three.js (r128 UMD from `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`, pinned) is the best fit: one script tag, huge API surface, shadows, instancing, fog. PixiJS is 2D only. Babylon.js is heavier. A hand-rolled raycaster (Wolfenstein style) only makes sense if no libraries are allowed. Keep the game state 2D; 3D is just another renderer.

### Architecture (the part that kept everything working)
- Same state, two renderers: `draw()` = `clearRect`, then `V3 ? render3d() : world2d()`, then the shared 2D overlay (vignette, flash, crosshair, tags). Toggle with V; lazily `init3d()` inside try/catch so a missing library or WebGL leaves the game top-down with a message.
- Layering: `<canvas id=c3>` (WebGL, z-index 0) under `<canvas id=c>` (2D, transparent in 3D mode, z-index 1), HUD panels z-index 2. Both `position:fixed`. In 2D mode `world2d()` paints an opaque background so c3 is hidden.
- Declare cross-cutting globals with `var` (`R3, CAM, V3, GEN, shake`): `fit()` runs at startup before later `let`s exist (temporal dead zone crash otherwise).
- Static geometry is rebuilt when `GEN` changes (incremented after each `build()`), never per frame.
- Dynamic objects use pooled meshes: `sync(pool, list, make, update)` grows the pool, hides extras, updates the rest. No per-frame allocations.

### Coordinates and camera
World (x,y) -> Three (x, up, y). Facing angle `a` means forward = (cos a, 0, sin a); right = +world y when facing +x. Camera `position=(P.x, 46+elev, P.y)`, `lookAt(P.x+cos*100, same y, P.y+sin*100)`. Characters: `rotation.y = -a`.

### Scene recipe
- Sky `#9fd3ff`, `Fog(sky, 700, 3000)`, camera far 4000, fov 75.
- Lights: HemisphereLight(.8) + DirectionalLight(.9) with a 2048 shadow map, ortho bounds +-700 following the player (set position/target every frame) + ONE permanent PointLight for explosion flashes.
- Heights: walls 90, furniture/rocks `hh*2.6`, towers 160 (+10 slab), stairs 6 steps rising to tower height, roofs a 14-thick plate at 90 with overhang and chimney (transparent material, opacity .12 when inside).
- Ground: PlaneGeometry textured with the same noise tile (`CanvasTexture`, repeat MW/256).
- Trees: three `InstancedMesh` (trunk cylinder, two cones). Per-instance scale from a hash of the position, per-instance color via `setColorAt` (material left white). Cheap enough for hundreds of trees.
- Share materials by color in a cache; unique materials only where opacity changes.
- Pickups: spinning, bobbing octahedra with emissive color. Chests: box + gold latch. Bullets: tiny emissive spheres at y=40 (+TH if z=1).
- Name tags/health bars: project `Vector3` to screen and draw on the 2D overlay (crisper and cheaper than sprites).
- Viewmodel gun: child of the camera (so add the camera to the scene), flash sphere toggled by `P.cd>.06`.
- Explosion: see visual-design.md; pooled `mkBlast()` groups updated by `updBlast(m,b)` from `t`; Points need `frustumCulled=false`.

### Performance notes
~500 static meshes + shadows ran fine; if it lags: merge static walls by color into one BufferGeometry, lower shadow map to 1024, reduce fog distance, cap trees. Do not call `new` inside render loops (use scratch vectors).

### Controls
Pointer lock on mousedown (try/catch, may be refused in sandboxed iframes) with the edge-turn fallback described in physics-movement.md. Bomb throws along the facing direction. Disable arrows for off-screen teammates (they assume top-down).

---

## Reference: multiplayer.md

## Team deathmatch: PeerJS + BroadcastChannel + IndexedDB

### Topology
- Star over PeerJS: host creates `new Peer('tdm-'+CODE)`, clients `peer.connect('tdm-'+CODE)`. The host relays every incoming message to the other clients (this is the "broadcast"). Client `send` goes only to the host. If the host leaves, clients show HOST DISCONNECTED (no host migration).
- `unavailable-id` on create: generate a new code and retry. `peer-unavailable` on join: show "No match found with that code".
- **Fallback**: if `Peer` is undefined or the peer does not open within 6 s (the hosted page's CSP blocks PeerJS's cloud server), use `BroadcastChannel('tdm-'+CODE)`: same-browser tabs only. Label the mode in the HUD ("LOCAL TABS ONLY (reason)") so the user is never misled. Real cross-device play needs the HTML hosted somewhere with open internet.

### Everyone sees the same world
Map = `build(hash(code))`: wrap `Math.random` with a seeded mulberry32 during generation, restore afterwards. Generation order must be deterministic (same scatter calls, same counts). Bots and random respawns are disabled in matches; picked items respawn in the same place via the queue.

### Messages (JSON, no framework)
`st` state every 50 ms {id,n,tm,x,y,a,hp,sh,z,al,k,d} | `shot` {b:{x,y,vx,vy,z},tm} | `bomb` {b,tm} | `take` {a:'p'|'c',i:id} | `kill` {kid,kt,rd,k} | `hello` -> `sync` {rd,KL} | `bye`.
Authority is per-owner: each client moves itself, simulates remote bullets/bombs locally, and applies damage ONLY to itself, then broadcasts a `kill` when it dies. Friendly fire is off (bullets and bombs from teammates are ignored, own bombs still hurt).

### Score without drift
Keep a kill log `KL = {killId: killerTeam}`; score = counts. Merging logs is idempotent (no double counting even if messages race). Round counter `rd` increments after a win (6 s banner, first to 20); messages with an older `rd` are ignored, newer `rd` resets the log.

### No one disappears
- Send `st` from `setInterval(50)`, NOT from requestAnimationFrame (background tabs stop rAF and would look disconnected; timers still tick at ~1 Hz).
- Remove a remote player only on `bye`, connection close, or 20 s of silence. Dead players stay in the roster (marked) and just stop being drawn.
- Interpolate remote positions (`x += (tx-x)*min(1,dt*15)`), snap when farther than 600 px.
- Late joiners send `hello` twice (immediately and after 1.5 s); anyone answers with `sync`.
- Player id: `sessionStorage` per tab (survives refresh, distinct per tab so two tabs can test locally).
- Aids: scoreboard panel with K/D, green arrows to off-screen teammates (top-down only), teammate dots on the minimap, enemies only within 1100 px.

### IndexedDB persistence
DB `tdm`, store `kv`. Keys: `profile` {name, team, code, life:{k,d}}, `match:<code>` {KL, rd, k, d}. Wrap everything: `indexedDB` may be missing, so the promise resolves `null` and callers tolerate it. Save every 5 s, on death/kill, and on `beforeunload`. Restore the form (name, team, last code) and lifetime K/D in the lobby, and the match record when rejoining the same code.

### Safety
Player names are untrusted: escape with `esc()` before `innerHTML`; slice to 12 chars; the canvas `fillText` path is safe.

---

## Reference: token-saving.md

## Saving tokens on game builds

Principles learned over a long iterative session, in order of payoff.

1. **Template first.** Copy `assets/shooter-template.html`; never write a 900-line game from scratch for a variation. A from-scratch first build should stay near a 6k-token budget: core loop, collisions, one draw path, HUD. Add features in later turns.
2. **Edits, not rewrites.** After the first version every change is a batch of `old_str/new_str` pairs (Artifact `edit` action, or `str_replace`), one call per request. Copy `old_str` from the file (`grep -n` to locate, `sed -n` to read). Short unique anchors are enough: a function's first line, a distinctive constant.
3. **Do not re-read what you wrote.** Edit results are one-line confirmations. Skip `view` of the whole file; skip re-printing code in the reply.
4. **Reuse structures.** One `walls` array with flags (`tree`, `hh`, `c`) replaced separate arrays for rocks, furniture and trees. One `sync(pool,list,make,update)` helper drives every 3D dynamic object. One `scatter()` places everything. New feature = new flag or new scatter call, not a new subsystem.
5. **Procedural over assets.** Canvas gradients, CSS panels, a generated grass tile, analytic particles. No images, audio or fonts: fewer bytes and no CSP trouble.
6. **Derive instead of transmit.** Map from a seeded RNG (match code), score from an idempotent kill log, particles computed from `t` (no per-particle state). Less code, fewer bugs.
7. **Plan in ~5 lines, then write.** List the edits, then emit them. No alternatives tour.
8. **Cheap verification.** `node scripts/smoke_test.js file.html` prints one or two lines. Use it instead of long reasoning about correctness.
9. **Short replies.** Changed / untested / skipped, one link. Do not restate features the user already knows.
10. **Decide, don't ask.** Pick sensible defaults, state assumptions in one line, ask at most one question.
11. **/ponytail mode** (lazy senior dev): smallest change that fully solves it; name what was deliberately skipped (touch, sound, minimap) so the user can ask.
12. **Library choice saves tokens**: Three.js for 3D (known API, one CDN tag). Avoid hand-written raycasters/WebGL unless libraries are blocked.
13. **Shell gotcha**: `sh` has no brace expansion; use `mkdir -p a b c` (a failed `mkdir -p x/{a,b}` cost a full re-write of files).

---

## Reference: gotchas.md

## Hosting limits and bugs already hit

### Published-page limits (Artifact hosting)
- Scripts only from cdnjs, jsdelivr/npm, tailwind CDN, jquery, with exact pinned versions at least 14 days old (three.js r128, peerjs 1.5.4 were used). No other network: PeerJS cloud signalling, remote images and fetches fail, hence the BroadcastChannel fallback.
- `window.storage` and `localStorage` rules differ in the preview vs published page; IndexedDB and sessionStorage work in the published page and must be try/catch-wrapped.
- Include `viewport-fit=cover` and safe-area insets for fixed HUD elements. Use typographic apostrophes in visible text.
- Small changes to a published page: Artifact `edit` with `url` and `edits`; a rewrite: write the file and publish with `url`.

### Bugs to avoid (all happened)
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

---

# Part 3: Full game template (assets/shooter-template.html)

Save this as `<name>.html` to start a new game.

```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Top-Down Shooter</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#111;font-family:system-ui,sans-serif;color:#fff}
canvas#c,canvas#c3{position:fixed;left:0;top:0;display:block}canvas#c{cursor:none;z-index:1}canvas#c3{z-index:0}.p,#msg{z-index:2}
.p{position:fixed;background:rgba(12,16,24,.72);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(6px);box-shadow:0 4px 18px rgba(0,0,0,.5);pointer-events:none}
#mm{top:calc(12px + env(safe-area-inset-top,0px));right:12px;width:180px;height:135px;border-radius:4px}
#top{top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);padding:6px 18px;font:700 14px system-ui;letter-spacing:.12em;border-radius:3px;white-space:nowrap}
#tips{top:calc(12px + env(safe-area-inset-top,0px));left:12px;padding:8px 12px;font:12px/1.6 system-ui;opacity:.85;border-radius:4px}
#bars{bottom:calc(14px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:min(420px,60vw);padding:8px 10px;border-radius:4px}
.bar{position:relative;height:18px;margin:3px 0;background:rgba(0,0,0,.55);transform:skewX(-14deg);overflow:hidden}
.bar i{display:block;height:100%;transition:width .15s}
.bar b{position:absolute;right:8px;top:0;font:700 12px/18px system-ui;transform:skewX(14deg)}
#shb{background:linear-gradient(#5ec8ff,#1b7fd1)}#hpb{background:linear-gradient(#7dff8a,#1fa34a)}
#jp{font:12px system-ui;letter-spacing:.3em;text-align:center;opacity:.9}
#ammo{bottom:calc(14px + env(safe-area-inset-bottom,0px));right:12px;padding:8px 16px;text-align:right;border-radius:4px;min-width:130px}
#mag{font:800 40px/1 system-ui}#mag small{font-size:16px;opacity:.6}
#res{font:600 12px system-ui;letter-spacing:.1em;opacity:.8;margin-top:2px}
#rlt{height:4px;background:rgba(255,255,255,.15);margin-top:6px}#rlb{height:100%;width:0;background:#ffd93b}
#msg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:800 40px/1.3 system-ui;text-align:center;letter-spacing:.1em;text-shadow:0 2px 10px #000;pointer-events:none;white-space:pre-line}
#lobby{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,12,.82);z-index:5}
#lobby .card{display:flex;flex-direction:column;gap:10px;width:min(340px,86vw);padding:22px;background:rgba(12,16,24,.92);border:1px solid rgba(255,255,255,.2);border-radius:6px}
#lobby h1{margin:0;font:800 22px system-ui;letter-spacing:.12em;text-align:center}
#lobby input,#lobby button{font:600 15px system-ui;padding:10px;border-radius:4px;border:1px solid rgba(255,255,255,.25);background:#1b2230;color:#fff;box-sizing:border-box}
#lobby button{cursor:pointer}#lobby .row{display:flex;gap:8px}#lobby .row>*{flex:1;min-width:0}
#tR{background:#8e1f12!important}#tB{background:#134f8a!important}
#lstat{font:12px/1.4 system-ui;opacity:.85;text-align:center;min-height:16px}
</style></head>
<body>
<canvas id="c3" style="display:none"></canvas><canvas id="c"></canvas>
<canvas id="mm" class="p" width="180" height="135"></canvas>
<div id="top" class="p"></div>
<div id="tips" class="p">Aim: mouse · Move: hold right-click / W<br>Shoot: left-click · Reload: R<br>G: throw bomb (open chests to get them)<br>V: switch top-down / 3D first-person (WASD, mouse look)<br>Walk over + and ammo tokens · stairs climb towers · red pads launch you</div>
<div id="bars" class="p"><div class="bar"><i id="shb"></i><b id="shn"></b></div><div class="bar"><i id="hpb"></i><b id="hpn"></b></div></div>
<div id="ammo" class="p"><div id="mag"></div><div id="res"></div><div id="bmb" style="font:700 12px system-ui;letter-spacing:.1em;color:#ffb347;margin-top:4px"></div><div id="rlt"><div id="rlb"></div></div></div>
<div id="board" class="p" style="display:none;left:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));padding:8px 12px;font:12px/1.6 system-ui;border-radius:4px"></div>
<div id="lobby"><div class="card"><h1>TEAM DEATHMATCH</h1>
<input id="nm" placeholder="Your name" maxlength="12">
<div class="row"><button id="tR">RED</button><button id="tB">BLUE</button></div>
<button id="bCreate">Create match</button>
<div class="row"><input id="cd" placeholder="MATCH CODE" maxlength="6"><button id="bJoin">Join</button></div>
<button id="bSolo">Play solo vs bots</button>
<div id="lstat"></div></div></div>
<div id="msg"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js"></script>
<script>
const $=id=>document.getElementById(id),cv=$('c'),g=cv.getContext('2d'),m=$('mm').getContext('2d'),msg=$('msg');
let W,H;var R3,CAM,V3=false,GEN=0,shake=0;const fit=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;if(R3){R3.setSize(W,H);CAM.aspect=W/H;CAM.updateProjectionMatrix()}};addEventListener('resize',fit);fit();
const MW=6000,MH=4500,R=16,MAG=30,S=180/MW;
let walls,towers,stairs,pads,roofs,bots,bullets,P,over,pick,chests,lobs,blasts,Q,chestT,uid=0;
const keys={};let mx=0,my=0,fire=0,right=0;

// ground texture, pre-rendered once
const tile=document.createElement('canvas');tile.width=tile.height=256;
{const t=tile.getContext('2d');t.fillStyle='#4a7c3a';t.fillRect(0,0,256,256);
 for(let i=0;i<600;i++){t.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.07)';t.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*5,2+Math.random()*5)}}
const grass=g.createPattern(tile,'repeat');

const cr=(x,y,r)=>o=>{const dx=x-Math.max(o.x,Math.min(x,o.x+o.w)),dy=y-Math.max(o.y,Math.min(y,o.y+o.h));return dx*dx+dy*dy<r*r};
const inR=(l,x,y)=>l.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h);
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// elevated (z=1) = on stairs or touching a tower; ground units can only enter towers via stairs
const high=(x,y)=>inR(stairs,x,y)||towers.some(cr(x,y,R));
const blocked=(e,x,y)=>walls.some(cr(x,y,R))||(!e.z&&!inR(stairs,x,y)&&towers.some(cr(x,y,R)));
const los=(a,b)=>{for(let i=1;i<12;i++)if(inR(walls,a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12))return false;return true};

function build0(){
  walls=[{x:-100,y:-100,w:MW+200,h:100},{x:-100,y:MH,w:MW+200,h:100},{x:-100,y:0,w:100,h:MH},{x:MW,y:0,w:100,h:MH}];
  towers=[];stairs=[];pads=[];roofs=[];bullets=[];over='';pick=[];chests=[];lobs=[];blasts=[];Q=[];chestT=15;uid=0;
  const box=(x,y,w,h)=>({x,y,w,h}),rx=()=>150+Math.random()*(MW-800),ry=()=>150+Math.random()*(MH-700);
  const all=[box(MW/2-200,MH/2-200,400,400)];
  const free=b=>!all.some(o=>overlap(o,box(b.x-60,b.y-60,b.w+120,b.h+120)));
  const scatter=(n,mk)=>{for(let i=0,c=0;c<n&&i<n*50;i++){const o=mk();if(free(o.box)){all.push(o.box);o.add();c++}}};
  // buildings: random size, door gap in south wall, interior partition with doorway, furniture, coloured roof
  const pal=[['#a13d2d','#6e2418','#8f7352'],['#3d5a80','#26364d','#6d7b8a'],['#6b705c','#3f4238','#9a8c6b']];
  scatter(14,()=>{const x=rx(),y=ry(),w=420+Math.random()*120|0,h=320+Math.random()*80|0,t=30,d=110,s=60+Math.random()*(w-d-120)|0,
      L=h-2*t,o=(L-100)/2,px=x+(w/2|0)-15,fc=['#b08968','#6f4e37'],c=pal[Math.random()*3|0],fu=(a,b)=>({x:a,y:b,w:50,h:40,c:fc,hh:12});
    return{box:box(x,y,w,h),add(){walls.push(box(x,y,w,t),box(x,y,t,h),box(x+w-t,y,t,h),box(x,y+h-t,s,t),box(x+s+d,y+h-t,w-s-d,t),
      box(px,y+t,30,o),box(px,y+t+o+100,30,L-o-100),fu(x+t+15,y+t+15),fu(px+50,y+t+15),fu(x+w-t-65,y+t+15));roofs.push({x,y,w,h,c})}}});
  scatter(20,()=>{const x=rx(),y=ry(),t=box(x,y,140,140),s=box(x+140,y+40,90,60);
    return{box:box(x,y,230,140),add(){towers.push(t);stairs.push(s)}}});
  scatter(70,()=>{const h=Math.random()<.5,l=200+Math.random()*250,w=h?box(rx(),ry(),l,40):box(rx(),ry(),40,l);
    return{box:w,add(){walls.push(w)}}});
  scatter(22,()=>{const x=rx(),y=ry();return{box:box(x-30,y-30,60,60),add(){pads.push({x,y})}}});
  scatter(70,()=>{const b={x:rx(),y:ry(),w:46+Math.random()*30|0,h:36+Math.random()*24|0,c:['#9a9a9a','#5e5e5e'],hh:16};return{box:b,add(){walls.push(b)}}}); // rocks
  const fo=Array.from({length:12},()=>({x:rx(),y:ry()})); // forests: trees are small solid trunks with a canopy
  scatter(260,()=>{const f=fo[Math.random()*fo.length|0],c=Math.random()<.75,x=c?Math.max(120,Math.min(MW-150,f.x+(Math.random()-.5)*800)):rx(),y=c?Math.max(120,Math.min(MH-150,f.y+(Math.random()-.5)*800)):ry(),b={x,y,w:30,h:30,tree:1,c:['#6b4a2b','#4a321c'],hh:50};return{box:b,add(){walls.push(b)}}});
  P={x:MW/2,y:MH/2,hp:100,sh:50,k:0,hit:0,z:0,dz:0,mag:MAG,res:3,rl:0,cd:0,jump:0,jang:0,ang:0,bombs:0};
  console.assert(!blocked(P,P.x,P.y),'spawn blocked');
  bots=[];
  while(bots.length<22){const x=100+Math.random()*(MW-200),y=100+Math.random()*(MH-200),b={x,y,hp:50,z:0,dz:0,cd:Math.random(),ang:0,st:0,t:0};
    if(Math.hypot(x-P.x,y-P.y)>900&&!blocked(b,x,y)&&!high(x,y))bots.push(b)}
  for(let i=0;i<24;i++)addPick(i%2?'hp':'ammo');for(let i=0;i<5;i++)addChest();
}

function spot(inb){for(let i=0;i<60;i++){let x,y;
  if(inb&&roofs.length){const r=roofs[Math.random()*roofs.length|0];x=r.x+50+Math.random()*(r.w-100);y=r.y+50+Math.random()*(r.h-100)}
  else{x=100+Math.random()*(MW-200);y=100+Math.random()*(MH-200)}
  if(!blocked({z:0},x,y)&&!high(x,y))return{x,y}}return{x:MW/2+60,y:MH/2+60}}
const addPick=type=>pick.push({...spot(Math.random()<.4),type,id:uid++});
const addChest=()=>chests.push({...spot(Math.random()<.7),id:uid++});
function hurt(t,d){if(t.sh>0){t.sh-=d;if(t.sh<0){t.hp+=t.sh;t.sh=0}}else t.hp-=d;if(t==P)P.hit=.3}
function move(e,dx,dy){
  // airborne (pad launch or high hop) or already stuck inside something: ignore collisions
  if(e.jump>0||e.h>40||blocked(e,e.x,e.y)){e.x+=dx;e.y+=dy}
  else{if(!blocked(e,e.x+dx,e.y))e.x+=dx;if(!blocked(e,e.x,e.y+dy))e.y+=dy}
  e.x=Math.max(R,Math.min(MW-R,e.x));e.y=Math.max(R,Math.min(MH-R,e.y));
  e.z=high(e.x,e.y)?1:0;
}
function shoot(e,own,a,sp){const b={x:e.x+Math.cos(a)*20,y:e.y+Math.sin(a)*20,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,z:own=='p'&&(e.z||e.jump>0)?1:0,life:.8,own};
  bullets.push(b);if(NET&&own=='p')NET.send({t:'shot',id:ID,tm:TEAM,b:{x:b.x,y:b.y,vx:b.vx,vy:b.vy,z:b.z}})}
function reload(){if(!P.rl&&P.mag<MAG&&P.res>0)P.rl=1.4}

function update(dt){
  if(NET)netStep(dt);
  if(!V3)P.ang=Math.atan2(my-H/2,mx-W/2);else if(!document.pointerLockElement)P.ang+=(mx-W/2)/(W/2)*2.2*dt;
  if(P.jump>0){P.jump-=dt;move(P,Math.cos(P.jang)*750*dt,Math.sin(P.jang)*750*dt)}
  else{
    if(!lk()){let fx=0,fy=0;if(V3){fx=(keys.w?1:0)-(keys.s?1:0);fy=(keys.d?1:0)-(keys.a?1:0)}else if(right||keys.w)fx=1;
    if(fx||fy){const n=Math.hypot(fx,fy),c=Math.cos(P.ang),s=Math.sin(P.ang);move(P,(c*fx-s*fy)/n*240*dt,(s*fx+c*fy)/n*240*dt)}}
    if(pads.some(p=>Math.hypot(p.x-P.x,p.y-P.y)<30)){P.jump=.6;P.jang=P.ang}
  }
  P.cd-=dt;P.hit=Math.max(0,P.hit-dt);
  if(P.rl>0&&(P.rl-=dt)<=0){P.mag=MAG;P.res--;P.rl=0}
  if(fire&&P.cd<=0&&!P.rl&&!lk()){if(P.mag>0){P.mag--;P.cd=.12;shoot(P,'p',P.ang+(Math.random()-.5)*.05,1100)}else reload()}

  bots.forEach(b=>{
    const d=Math.hypot(P.x-b.x,P.y-b.y),see=d<650&&los(b,P);let a=b.ang;
    if(see){a=Math.atan2(P.y-b.y,P.x-b.x);b.cd-=dt;if(b.cd<=0){b.cd=.8;shoot(b,'b',a+(Math.random()-.5)*.3,600)}}
    else{if(!b.t||Math.hypot(b.t.x-b.x,b.t.y-b.y)<30||(b.st-=dt)<=0){b.t={x:100+Math.random()*(MW-200),y:100+Math.random()*(MH-200)};b.st=4}
      a=Math.atan2(b.t.y-b.y,b.t.x-b.x)}
    b.ang=a;
    if(!see||d>300){const ox=b.x,oy=b.y;move(b,Math.cos(a)*120*dt,Math.sin(a)*120*dt);if(b.x==ox&&b.y==oy)b.t=0}
  });
  [P,...bots,...Object.values(remotes)].forEach(e=>e.dz+=((e.z?34:0)-e.dz)*Math.min(1,dt*10)); // smooth stair/tower climb

  bullets=bullets.filter(b=>{
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if((b.life-=dt)<=0||(!b.z&&inR(walls,b.x,b.y)))return 0;
    const tg=b.own=='p'?[...bots,...Object.values(remotes).filter(r=>r.tm!=TEAM&&r.al!==0)]:b.own=='r'?(b.team!=TEAM&&!(P.dead>0)?[P]:[]):[P];
    const t=tg.find(e=>Math.hypot(e.x-b.x,e.y-b.y)<R+3);
    if(t){if(bots.includes(t)||t==P){hurt(t,b.own=='b'?8:25);if(t==P)P.by=b.by}return 0} // remote players only take damage on their own screen
    return 1});
  // tokens: +35 HP / +1 reload, respawn after 20s; chests give 1 bomb (max 5), new chest every 15s (max 6)
  pick=pick.filter(p=>{if(Math.hypot(p.x-P.x,p.y-P.y)>26)return 1;
    if(p.type=='hp'&&P.hp<100)P.hp=Math.min(100,P.hp+35);else if(p.type=='ammo'&&P.res<9)P.res++;else return 1;
    Q.push({t:20,type:p.type,item:NET&&p});NET&&NET.send({t:'take',id:ID,a:'p',i:p.id});return 0});
  Q=Q.filter(q=>(q.t-=dt)>0||(q.item?(q.item.type?pick:chests).push(q.item):addPick(q.type),0));
  chests=chests.filter(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)<34&&P.bombs<5){P.bombs++;if(NET){NET.send({t:'take',id:ID,a:'c',i:c.id});Q.push({t:30,item:c})}return 0}return 1});
  if(!NET&&(chestT-=dt)<=0){chestT=15;if(chests.length<6)addChest()}
  lobs=lobs.filter(b=>{b.t+=dt;const k=Math.min(1,b.t/.5);b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty-b.sy)*k;
    if(b.t<1.4)return 1;blasts.push({x:b.x,y:b.y,t:0,sp:Array.from({length:40},()=>({a:Math.random()*6.283,s:150+Math.random()*450,v:100+Math.random()*350}))});
    shake=Math.max(shake,Math.min(1,400/(60+Math.hypot(b.x-P.x,b.y-P.y))));
    [P,...bots].forEach(e=>{if(Math.hypot(e.x-b.x,e.y-b.y)<140&&(e!=P||!NET||(!(P.dead>0)&&(b.by==ID||b.team!=TEAM)))){hurt(e,e==P?40:100);if(e==P)P.by=b.by}});return 0});
  blasts=blasts.filter(b=>(b.t+=dt)<3.5);shake=Math.max(0,shake-dt*1.8);
  const n=bots.length;bots=bots.filter(b=>b.hp>0);P.k+=n-bots.length;
  if(NET);else if(P.hp<=0)over='ELIMINATED\nPress R to play again';else if(!bots.length)over='VICTORY ROYALE\nPress R to play again';
}

const slab=(o,hh,top,side)=>{g.fillStyle=side;g.fillRect(o.x,o.y,o.w,o.h);g.fillStyle=top;g.fillRect(o.x,o.y-hh,o.w,o.h);
  g.fillStyle='rgba(255,255,255,.22)';g.fillRect(o.x,o.y-hh,o.w,2)};
const tree2d=o=>{const cx=o.x+o.w/2,cy=o.y+o.h/2;g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(cx+26,cy+18,46,30,0,0,7);g.fill();
  g.fillStyle='#5a3d22';g.fillRect(cx-6,cy-30,12,38);
  for(const [dy,r,c] of [[-44,50,'#2f7d32'],[-64,38,'#3c9440']]){const gr=g.createRadialGradient(cx-10,cy+dy-12,4,cx,cy+dy,r);gr.addColorStop(0,'#5fb858');gr.addColorStop(1,c);g.fillStyle=gr;g.beginPath();g.arc(cx,cy+dy,r,0,7);g.fill()}};
const ent=(e,c)=>{const air=(e.h||0)+(e.jump>0?70*Math.sin(Math.PI*e.jump/.6):0),hh=e.dz+air,r=R*(1+hh/250),k=1-air/300;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(e.x+6,e.y-e.dz+6,R*k,R*.8*k,0,0,7);g.fill();
  g.save();g.translate(e.x,e.y-hh);g.rotate(e.ang);g.fillStyle='#1b1b1b';g.fillRect(0,-3,r+14,6);
  const gr=g.createRadialGradient(-5,-5,2,0,0,r);gr.addColorStop(0,c[0]);gr.addColorStop(1,c[1]);
  g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore()};

function world2d(){
  g.fillStyle='#111';g.fillRect(0,0,W,H);
  g.save();g.translate(W/2-P.x+(Math.random()-.5)*shake*16,H/2-P.y+(Math.random()-.5)*shake*16);
  g.fillStyle=grass;g.fillRect(0,0,MW,MH);
  roofs.forEach(r=>{g.fillStyle=r.c[2];g.fillRect(r.x,r.y,r.w,r.h);g.fillStyle='rgba(0,0,0,.12)';for(let y=r.y;y<r.y+r.h;y+=24)g.fillRect(r.x,y,r.w,1)});
  g.fillStyle='rgba(0,0,0,.28)';
  [...walls,...towers].forEach(o=>g.fillRect(o.x+22,o.y+22,o.w,o.h));
  roofs.forEach(o=>g.fillRect(o.x+34,o.y+34,o.w,o.h));
  pads.forEach(p=>{const gr=g.createRadialGradient(p.x,p.y,4,p.x,p.y,34);gr.addColorStop(0,'#ff5a3c');gr.addColorStop(.6,'#e8c547');gr.addColorStop(1,'rgba(232,197,71,0)');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,34,0,7);g.fill()});
  stairs.forEach(s=>{for(let i=0;i<6;i++){g.fillStyle=`hsl(35,25%,${32+i*5}%)`;g.fillRect(s.x+s.w-(i+1)*s.w/6,s.y,s.w/6,s.h)}});
  const bob=Math.sin(performance.now()/300)*3;
  pick.forEach(p=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(p.x+4,p.y+8,12,6,0,0,7);g.fill();
    g.fillStyle=p.type=='hp'?'#2ecc71':'#f39c12';g.beginPath();g.arc(p.x,p.y+bob,13,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2.5;g.stroke();
    g.fillStyle='#fff';if(p.type=='hp'){g.fillRect(p.x-2.5,p.y+bob-8,5,16);g.fillRect(p.x-8,p.y+bob-2.5,16,5)}else{g.fillRect(p.x-5,p.y+bob-7,4,14);g.fillRect(p.x+1,p.y+bob-7,4,14)}});
  const it=[];
  walls.forEach(o=>it.push([o.y+o.h,()=>o.tree?tree2d(o):slab(o,o.hh||18,o.c?o.c[0]:'#8a6a4c',o.c?o.c[1]:'#5a4129')]));
  chests.forEach(c=>it.push([c.y+12,()=>{slab({x:c.x-18,y:c.y-12,w:36,h:24},10,'#c28a3a','#7a4f1a');g.fillStyle='#ffd34d';g.fillRect(c.x-3,c.y-14,6,8)}]));
  towers.forEach(t=>it.push([t.y+t.h,()=>{slab(t,34,'#9aa0aa','#4c515a');g.fillStyle='#b4bac4';g.fillRect(t.x+10,t.y-24,t.w-20,t.h-20)}]));
  bots.forEach(b=>it.push([b.y+(b.z?200:0),()=>{ent(b,['#ff7a66','#8e1f12']);const y=b.y-b.dz-32;g.fillStyle='#000';g.fillRect(b.x-16,y,32,4);g.fillStyle='#2ecc71';g.fillRect(b.x-16,y,32*b.hp/50,4)}]));
  Object.values(remotes).forEach(r=>{if(r.al===0)return;it.push([r.y+(r.z?200:0),()=>{ent(r,r.tm?BL:RD);const y=r.y-r.dz-34;g.fillStyle='#000';g.fillRect(r.x-16,y,32,4);g.fillStyle=r.tm==TEAM?'#2ecc71':'#e74c3c';g.fillRect(r.x-16,y,32*Math.max(0,r.hp)/100,4);g.fillStyle='#fff';g.font='bold 12px system-ui';g.textAlign='center';g.fillText(r.n,r.x,y-4)}])});
  if(!(P.dead>0))it.push([P.y+(P.z?200:0),()=>ent(P,NET&&!TEAM?RD:BL)]);
  it.sort((a,b)=>a[0]-b[0]).forEach(i=>i[1]());
  g.fillStyle='#ffe066';bullets.forEach(b=>{g.beginPath();g.arc(b.x,b.y-b.z*30,3,0,7);g.fill()});
  lobs.forEach(b=>{const a=Math.sin(Math.PI*Math.min(1,b.t/.5))*50;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(b.x+3,b.y+4,8,5,0,0,7);g.fill();
    g.fillStyle=Math.floor(b.t*8)%2?'#e33':'#222';g.beginPath();g.arc(b.x,b.y-a-6,8,0,7);g.fill()});
  blasts.forEach(b=>{const t=b.t;
    g.fillStyle=`rgba(0,0,0,${Math.max(0,.5*(1-t/3.5))})`;g.beginPath();g.ellipse(b.x,b.y,70,55,0,0,7);g.fill(); // scorch mark
    if(t<.7){const k=t/.7,r=30+110*Math.sqrt(Math.min(1,t/.3)),gr=g.createRadialGradient(b.x,b.y,0,b.x,b.y,r);
      gr.addColorStop(0,`rgba(255,250,200,${1-k})`);gr.addColorStop(.35,`rgba(255,170,40,${.9*(1-k)})`);gr.addColorStop(1,'rgba(180,40,0,0)');g.fillStyle=gr;g.beginPath();g.arc(b.x,b.y,r,0,7);g.fill()} // fireball
    if(t<.6){g.strokeStyle=`rgba(255,240,200,${.8*(1-t/.6)})`;g.lineWidth=5;g.beginPath();g.arc(b.x,b.y,20+150*t/.6,0,7);g.stroke()} // shockwave
    if(t<1.4){g.strokeStyle=`rgba(255,200,90,${1-t/1.4})`;g.lineWidth=2;g.beginPath();b.sp.forEach(p=>{const r=p.s*(1-Math.exp(-4*t))/4,r0=Math.max(0,r-10);g.moveTo(b.x+Math.cos(p.a)*r0,b.y+Math.sin(p.a)*r0);g.lineTo(b.x+Math.cos(p.a)*r,b.y+Math.sin(p.a)*r)});g.stroke()} // sparks
    for(let i=0;i<7;i++){const tt=Math.max(0,t-.1*i);if(!tt)continue;const sp=b.sp[i];g.fillStyle=`rgba(50,50,50,${.5*Math.max(0,1-t/3.5)})`;g.beginPath();g.arc(b.x+Math.cos(sp.a)*20*(i%3),b.y+Math.sin(sp.a)*20*(i%3)-tt*30,22+tt*(18+i*2),0,7);g.fill()}}); // rising smoke
  roofs.forEach(r=>{g.globalAlpha=inR([r],P.x,P.y)?.12:1;slab(r,26,r.c[0],r.c[1]);g.fillStyle='#4a4a4a';g.fillRect(r.x+r.w-70,r.y-40,22,22);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(r.x,r.y-26+r.h/2-3,r.w,6);g.globalAlpha=1});
  g.restore();
}
function draw(){
  g.clearRect(0,0,W,H);
  if(V3)render3d();else world2d();
  // lighting vignette + damage flash + crosshair
  const v=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');
  g.fillStyle=v;g.fillRect(0,0,W,H);
  if(P.hit){g.fillStyle=`rgba(220,0,0,${P.hit})`;g.fillRect(0,0,W,H)}
  blasts.forEach(b=>{if(b.t<.3){const d=Math.hypot(b.x-P.x,b.y-P.y);g.fillStyle=`rgba(255,230,180,${(1-b.t/.3)*Math.min(.7,260/(d+80))})`;g.fillRect(0,0,W,H)}});
  Object.values(remotes).forEach(r=>{if(V3||r.al===0||r.tm!=TEAM)return;const dx=r.x-P.x,dy=r.y-P.y;if(Math.abs(dx)<W/2-20&&Math.abs(dy)<H/2-20)return;
    const a=Math.atan2(dy,dx),k=Math.min((W/2-40)/Math.abs(Math.cos(a)||1e-6),(H/2-40)/Math.abs(Math.sin(a)||1e-6)); // arrow to off-screen teammates
    g.save();g.translate(W/2+Math.cos(a)*k,H/2+Math.sin(a)*k);g.rotate(a);g.fillStyle='#2ecc71';g.beginPath();g.moveTo(10,0);g.lineTo(-8,-8);g.lineTo(-8,8);g.fill();g.restore()});
  g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{g.moveTo((V3?W/2:mx)+a*6,(V3?H/2:my)+b*6);g.lineTo((V3?W/2:mx)+a*14,(V3?H/2:my)+b*14)});g.stroke();
  ui();msg.textContent=over||(NET?mend||(P.dead>0?'RESPAWNING '+Math.ceil(P.dead):''):'');
}

function ui(){
  $('shb').style.width=Math.max(0,P.sh)*2+'%';$('shn').textContent=Math.ceil(Math.max(0,P.sh));
  $('hpb').style.width=Math.max(0,P.hp)+'%';$('hpn').textContent=Math.ceil(Math.max(0,P.hp));
  $('bmb').textContent='BOMBS '+P.bombs+' / 5  [G to throw]';
  $('mag').innerHTML=P.rl?'RELOADING':`${P.mag}<small> / ${MAG}</small>`;
  $('res').textContent=P.mag==0&&P.res==0?'OUT OF AMMO':`${P.res} RELOADS LEFT`;
  $('rlb').style.width=P.rl?(1-P.rl/1.4)*100+'%':'0';
  const sc=score();
  $('top').textContent=NET?`CODE ${CODE}  ·  RED ${sc[0]} – ${sc[1]} BLUE  ·  FIRST TO 20  ·  ${NET.mode}`:`ENEMIES ${bots.length}  ·  ELIMS ${P.k}${P.z?'  ·  HIGH GROUND':''}`;
  if(NET)$('board').innerHTML=[{n:NAME+' (you)',tm:TEAM,k:P.k,d:P.d,al:P.dead>0?0:1},...Object.values(remotes)].map(r=>`<div style="color:${r.tm?'#6cc4ff':'#ff7a66'}">● ${esc(r.n)} <span style="opacity:.8;color:#fff">${r.k|0}/${r.d|0}${r.al===0?' ☠':''}</span></div>`).join('');
  m.fillStyle='rgba(10,14,20,.8)';m.fillRect(0,0,180,135);
  m.fillStyle='#7a5a40';walls.slice(4).forEach(o=>m.fillRect(o.x*S,o.y*S,Math.max(1,o.w*S),Math.max(1,o.h*S)));
  m.fillStyle='#aab';towers.forEach(t=>m.fillRect(t.x*S,t.y*S,t.w*S,t.h*S));
  m.fillStyle='#e8c547';pads.forEach(p=>m.fillRect(p.x*S-1,p.y*S-1,3,3));
  pick.forEach(p=>{m.fillStyle=p.type=='hp'?'#2ecc71':'#f39c12';m.fillRect(p.x*S-1,p.y*S-1,3,3)});
  m.fillStyle='#ffd34d';chests.forEach(c=>m.fillRect(c.x*S-2,c.y*S-2,4,3));
  m.fillStyle='#ff4d3a';bots.forEach(b=>{if(Math.hypot(b.x-P.x,b.y-P.y)<1100)m.fillRect(b.x*S-2,b.y*S-2,4,4)});
  Object.values(remotes).forEach(r=>{if(r.al===0||(r.tm!=TEAM&&Math.hypot(r.x-P.x,r.y-P.y)>1100))return;m.fillStyle=r.tm==TEAM?'#2ecc71':'#ff4d3a';m.fillRect(r.x*S-2,r.y*S-2,4,4)});
  m.fillStyle='#3aa0ff';m.beginPath();m.arc(P.x*S,P.y*S,3.5,0,7);m.fill();
  m.strokeStyle='rgba(255,255,255,.5)';m.strokeRect((P.x-W/2)*S,(P.y-H/2)*S,W*S,H*S);
}

onmousemove=e=>{mx=e.clientX;my=e.clientY;if(V3&&document.pointerLockElement)P.ang+=e.movementX*.0025};
onmousedown=e=>{e.button?right=1:fire=1;if(V3&&!document.pointerLockElement)try{cv.requestPointerLock()}catch(x){}};
onmouseup=e=>{e.button?right=0:fire=0};
oncontextmenu=e=>e.preventDefault();
onkeydown=e=>{const k=e.key.toLowerCase();keys[k]=1;
  if(k=='v')toggleView();
  if(k=='r')over?(NET||build()):reload();
  if(k=='g'&&!e.repeat&&!over&&!lk()&&P.bombs>0){P.bombs--;const dx=V3?Math.cos(P.ang):mx-W/2,dy=V3?Math.sin(P.ang):my-H/2,d=V3?450:Math.min(450,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);
    const B={sx:P.x,sy:P.y,tx:P.x+Math.cos(a)*d,ty:P.y+Math.sin(a)*d,x:P.x,y:P.y,t:0};lobs.push({...B,by:ID,team:TEAM});NET&&NET.send({t:'bomb',id:ID,tm:TEAM,b:B})}};
onkeyup=e=>keys[e.key.toLowerCase()]=0;

// ===== Team deathmatch: PeerJS (host relays = broadcast) with BroadcastChannel fallback, IndexedDB persistence =====
const RD=['#ff7a66','#8e1f12'],BL=['#6cc4ff','#134f8a'],esc=s=>String(s).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
let ID;try{ID=sessionStorage.tdm||(sessionStorage.tdm=Math.random().toString(36).slice(2,8))}catch(e){ID=Math.random().toString(36).slice(2,8)}
let NET=null,TEAM=0,CODE='',NAME='Player',remotes={},KL={},rd=0,mend='',paused=true,life={k:0,d:0},lastSave=0;
const score=()=>[0,1].map(t=>Object.values(KL).filter(x=>x==t).length);
const lk=()=>NET&&(P.dead>0||mend);
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function build(seed){const o=Math.random;if(seed!=null)Math.random=mul(seed);try{build0();GEN++}finally{Math.random=o}} // same code = same map for everyone
const idb=new Promise(r=>{try{const q=indexedDB.open('tdm',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
const kvGet=k=>idb.then(d=>d&&new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r()}));
const kvSet=(k,v)=>idb.then(d=>{try{d&&d.transaction('kv','readwrite').objectStore('kv').put(v,k)}catch(e){}});
const save=()=>{kvSet('profile',{name:NAME,team:TEAM,code:CODE,life});if(CODE)kvSet('match:'+CODE,{KL,rd,k:P.k,d:P.d})};
function tspot(t){for(let i=0;i<200;i++){const x=(t?MW-600:100)+Math.random()*500,y=100+Math.random()*(MH-200);if(!blocked({z:0},x,y)&&!high(x,y))return{x,y}}return{x:MW/2,y:MH/2}}
function respawn(full){const s=tspot(TEAM);Object.assign(P,{x:s.x,y:s.y,hp:100,sh:50,dead:0,by:null,mag:MAG,res:3,rl:0,z:0,dz:0,jump:0,bombs:full?0:P.bombs})}

function openNet(code,host,done){
  const local=why=>{const bc=new BroadcastChannel('tdm-'+code);bc.onmessage=e=>recv(e.data);NET={send:m=>bc.postMessage(m),mode:'LOCAL TABS ONLY ('+why+')'};done(null)};
  if(typeof Peer==='undefined')return local('PeerJS not loaded');
  let settled=false;const conns=[];let pe;
  const to=setTimeout(()=>{if(!settled){settled=true;try{pe.destroy()}catch(e){}local('PeerJS server unreachable')}},6000);
  const send=m=>conns.forEach(c=>c.open&&c.send(m));
  const ok=()=>{if(settled)return;settled=true;clearTimeout(to);NET={send,mode:'ONLINE (PeerJS)'};done(null)};
  const hook=c=>{c.on('data',m=>{recv(m);if(host)conns.forEach(o=>o!==c&&o.open&&o.send(m))});c.on('close',()=>{const i=conns.indexOf(c);if(i>=0)conns.splice(i,1);if(!host)mend='HOST DISCONNECTED'})};
  try{pe=new Peer(host?'tdm-'+code:undefined)}catch(e){clearTimeout(to);settled=true;return local('PeerJS error')}
  pe.on('error',err=>{if(settled)return;settled=true;clearTimeout(to);try{pe.destroy()}catch(e){}
    if(err.type=='unavailable-id'||err.type=='peer-unavailable')done(err.type);else local('PeerJS '+err.type)});
  pe.on('open',()=>{if(host)ok();else{const c=pe.connect('tdm-'+code,{reliable:true});conns.push(c);hook(c);c.on('open',ok)}});
  if(host)pe.on('connection',c=>{conns.push(c);hook(c)});
}

function recv(m){
  if(!m||m.id===ID||!NET)return;
  if(m.t=='st'){let r=remotes[m.id];if(!r)r=remotes[m.id]={id:m.id,x:m.x,y:m.y,dz:0,ang:0,jump:0};
    if(Math.hypot(m.x-r.x,m.y-r.y)>600){r.x=m.x;r.y=m.y}
    Object.assign(r,{n:String(m.n).slice(0,12),tm:m.tm?1:0,tx:m.x,ty:m.y,ta:m.a,hp:m.hp,sh:m.sh,z:m.z,al:m.al,k:m.k,d:m.d,seen:performance.now()})}
  else if(m.t=='shot')bullets.push({...m.b,life:.8,own:'r',team:m.tm,by:m.id});
  else if(m.t=='bomb')lobs.push({...m.b,t:0,team:m.tm,by:m.id});
  else if(m.t=='take'){const L=m.a=='c'?chests:pick,i=L.findIndex(o=>o.id==m.i);if(i>=0){Q.push({t:m.a=='c'?30:20,item:L[i]});L.splice(i,1)}}
  else if(m.t=='kill'){if(m.rd>rd){rd=m.rd;KL={}}if(m.rd==rd&&!(m.kid in KL)){KL[m.kid]=m.kt;if(m.k==ID){P.k++;life.k++;save()}}}
  else if(m.t=='hello')NET.send({t:'sync',id:ID,rd,KL});
  else if(m.t=='sync'){if(m.rd>rd){rd=m.rd;KL={}}if(m.rd==rd)Object.assign(KL,m.KL)}
  else if(m.t=='bye')delete remotes[m.id];
}

function netStep(dt){
  for(const id in remotes){const r=remotes[id],k=Math.min(1,dt*15);r.x+=(r.tx-r.x)*k;r.y+=(r.ty-r.y)*k;r.ang=r.ta}
  if(P.dead>0&&(P.dead-=dt)<=0)respawn();
  if(P.hp<=0&&!(P.dead>0)){P.dead=3;P.d++;life.d++;const by=remotes[P.by];
    if(by&&by.tm!=TEAM){const kid=ID+Date.now();KL[kid]=by.tm;NET.send({t:'kill',id:ID,kid,kt:by.tm,rd,k:P.by})}save()}
  const s=score();
  if(!mend&&Math.max(...s)>=20){mend=(s[0]>s[1]?'RED':'BLUE')+' TEAM WINS';const r0=rd;setTimeout(()=>{if(rd==r0){rd++;KL={}}mend='';respawn(true);save()},6000)}
}
// heartbeat on a timer (not rAF) so a backgrounded tab never looks disconnected; players are only dropped after 20s of silence or an explicit bye
setInterval(()=>{if(!NET||paused)return;const now=performance.now();
  NET.send({t:'st',id:ID,n:NAME,tm:TEAM,x:P.x,y:P.y,a:P.ang,hp:P.hp,sh:P.sh,z:P.z,al:P.dead>0?0:1,k:P.k,d:P.d});
  for(const id in remotes)if(now-remotes[id].seen>20000)delete remotes[id];
  if(now-lastSave>5000){lastSave=now;save()}},50);
addEventListener('beforeunload',()=>{NET&&NET.send({t:'bye',id:ID});save()});

const lstat=t=>$('lstat').textContent=t;
const setTeam=t=>{TEAM=t;$('tR').style.outline=t?'':'3px solid #fff';$('tB').style.outline=t?'3px solid #fff':''};
function startMatch(host){
  NAME=($('nm').value.trim()||'Player').slice(0,12);
  const code=host?Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join(''):$('cd').value.trim().toUpperCase();
  if(!/^[A-Z0-9]{4,6}$/.test(code))return lstat('Enter a 4-6 character match code');
  lstat('Connecting…');
  openNet(code,host,async err=>{
    if(err=='unavailable-id'&&host)return startMatch(true);
    if(err)return lstat(err=='peer-unavailable'?'No match found with that code':'Connection failed: '+err);
    CODE=code;const rec=await kvGet('match:'+code);
    build(hash(code));bots=[];KL=rec&&rec.KL||{};rd=rec&&rec.rd||0;P.k=rec?rec.k|0:0;P.d=rec?rec.d|0:0;
    respawn(true);remotes={};mend='';paused=false;
    $('lobby').style.display='none';$('board').style.display='block';
    NET.send({t:'hello',id:ID});setTimeout(()=>NET&&NET.send({t:'hello',id:ID}),1500);save()});
}
$('tR').onclick=()=>setTeam(0);$('tB').onclick=()=>setTeam(1);
$('bCreate').onclick=()=>startMatch(true);$('bJoin').onclick=()=>startMatch(false);
$('bSolo').onclick=()=>{paused=false;$('lobby').style.display='none'};
setTeam(0);
(async()=>{const p=await kvGet('profile');if(p){$('nm').value=p.name||'';setTeam(p.team?1:0);$('cd').value=p.code||'';life=p.life||life}
  lstat(`Lifetime: ${life.k} kills / ${life.d} deaths`)})();

// ===== 3D first-person view (Three.js): same game state, different renderer. Press V to toggle =====
const TH=160,WH=90;let S3=null,gen3=-1;
function init3d(){
  R3=new THREE.WebGLRenderer({canvas:$('c3'),antialias:true});R3.setSize(W,H);R3.shadowMap.enabled=true;
  const sc=new THREE.Scene();sc.background=new THREE.Color('#9fd3ff');sc.fog=new THREE.Fog('#9fd3ff',700,3000);
  CAM=new THREE.PerspectiveCamera(75,W/H,2,4000);sc.add(CAM);
  sc.add(new THREE.HemisphereLight('#cfe8ff','#4a6b3a',.8));
  const sun=new THREE.DirectionalLight('#fff3d6',.9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-700,right:700,top:700,bottom:-700,near:50,far:2000});sun.shadow.camera.updateProjectionMatrix();sc.add(sun,sun.target);
  const boom=new THREE.PointLight('#ffa040',0,900,2);sc.add(boom); // one permanent light, flashes on explosions
  const gun=new THREE.Group(),fl=new THREE.Mesh(new THREE.SphereGeometry(5,8,8),new THREE.MeshBasicMaterial({color:'#ffe08a'}));
  gun.add(new THREE.Mesh(new THREE.BoxGeometry(6,8,34),new THREE.MeshLambertMaterial({color:'#2b2f36'})));fl.position.z=-20;gun.add(fl);gun.position.set(11,-11,-24);CAM.add(gun);
  const pool=()=>({g:new THREE.Group(),m:[]});
  S3={sc,sun,boom,gun,fl,stat:new THREE.Group(),roofs:[],pp:pool(),pc:pool(),pl:pool(),pb:pool(),pk:pool(),pe:pool()};
  sc.add(S3.stat,S3.pp.g,S3.pc.g,S3.pl.g,S3.pb.g,S3.pk.g,S3.pe.g);
}
function rebuildStatic(){
  const s=S3,G=s.stat,mats={};while(G.children.length)G.remove(G.children[0]);s.roofs=[];
  const mt=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));
  const box=(o,y0,h,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(o.w,h,o.h),mt(col));m.position.set(o.x+o.w/2,y0+h/2,o.y+o.h/2);m.castShadow=true;m.receiveShadow=true;G.add(m)};
  const tx=new THREE.CanvasTexture(tile);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(MW/256,MH/256);
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(MW,MH),new THREE.MeshLambertMaterial({map:tx}));gr.rotation.x=-Math.PI/2;gr.position.set(MW/2,0,MH/2);gr.receiveShadow=true;G.add(gr);
  const trees=[];
  walls.forEach(o=>{if(o.tree)trees.push(o);else box(o,0,o.hh?o.hh*2.6:WH,o.c?o.c[0]:'#8a6a4c')});
  towers.forEach(t=>{box(t,0,TH,'#7b818b');box({x:t.x-6,y:t.y-6,w:t.w+12,h:t.h+12},TH,10,'#9aa0aa')});
  stairs.forEach(s2=>{for(let i=0;i<6;i++){const w=s2.w/6;box({x:s2.x+s2.w-(i+1)*w,y:s2.y,w,h:s2.h},0,(i+1)/6*TH,`hsl(35,25%,${32+i*5}%)`)}});
  pads.forEach(p=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(30,30,4,24),new THREE.MeshLambertMaterial({color:'#e8c547',emissive:'#ff5a1c'}));m.position.set(p.x,2,p.y);G.add(m)});
  roofs.forEach(r=>{box(r,0,1,r.c[2]);
    const mat=new THREE.MeshLambertMaterial({color:r.c[0],transparent:true}),m=new THREE.Mesh(new THREE.BoxGeometry(r.w+30,14,r.h+30),mat);m.position.set(r.x+r.w/2,WH+7,r.y+r.h/2);m.castShadow=true;G.add(m);
    const ch=new THREE.Mesh(new THREE.BoxGeometry(22,40,22),new THREE.MeshLambertMaterial({color:'#4a4a4a',transparent:true}));ch.position.set(r.x+r.w-60,WH+30,r.y+50);G.add(ch);
    s.roofs.push({r,mat,ch})});
  const n=trees.length,tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(9,12,70,8),mt('#6b4a2b'),n),
    c1=new THREE.InstancedMesh(new THREE.ConeGeometry(52,95,9),new THREE.MeshLambertMaterial(),n),c2=new THREE.InstancedMesh(new THREE.ConeGeometry(38,80,9),new THREE.MeshLambertMaterial(),n),
    d=new THREE.Object3D(),col=new THREE.Color();
  trees.forEach((o,i)=>{const k=.8+((o.x*7+o.y*13)%100)/220,cx=o.x+o.w/2,cz=o.y+o.h/2;
    d.scale.set(k,k,k);d.position.set(cx,35*k,cz);d.updateMatrix();tr.setMatrixAt(i,d.matrix);
    d.position.set(cx,110*k,cz);d.updateMatrix();c1.setMatrixAt(i,d.matrix);
    d.position.set(cx,165*k,cz);d.updateMatrix();c2.setMatrixAt(i,d.matrix);
    col.setHSL(.3+(((o.x*3+o.y)%10)/200),.5,.28+((o.y%7)/70));c1.setColorAt(i,col);c2.setColorAt(i,col)});
  [tr,c1,c2].forEach(m=>{m.castShadow=true;m.receiveShadow=true;G.add(m)});
}
const sync=(pl,list,make,upd)=>{while(pl.m.length<list.length){const m=make();pl.g.add(m);pl.m.push(m)}pl.m.forEach((m,i)=>{const o=list[i];m.visible=!!o;if(o)upd(m,o,i)})};
// ground height under an entity: ramps up the stairs, flat on tower tops
const g3=e=>{const s=stairs.find(s=>e.x>s.x&&e.x<s.x+s.w&&e.y>s.y&&e.y<s.y+s.h);return s?TH*Math.max(0,Math.min(1,(s.x+s.w-e.x)/s.w)):towers.some(cr(e.x,e.y,R))?TH:0};
const mkChar=()=>{const grp=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(14,16,44,12),new THREE.MeshLambertMaterial()),h=new THREE.Mesh(new THREE.SphereGeometry(11,12,10),new THREE.MeshLambertMaterial({color:'#f1c9a0'})),w=new THREE.Mesh(new THREE.BoxGeometry(30,6,5),new THREE.MeshLambertMaterial({color:'#222'}));
  b.position.y=22;h.position.y=54;w.position.set(18,36,8);grp.add(b,h,w);grp.traverse(o=>o.castShadow=true);return grp};
const mkBlast=()=>{const grp=new THREE.Group(),add=(geo,mat)=>{const m=new THREE.Mesh(geo,mat);grp.add(m);return m};
  const fire=add(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:'#ffb040',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  const ring=add(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color:'#ffe9b0',transparent:true,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;
  const scorch=add(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:'#000',transparent:true,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.position.y=.6;
  const smoke=[...Array(7)].map(()=>add(new THREE.SphereGeometry(1,10,8),new THREE.MeshLambertMaterial({color:'#333',transparent:true,depthWrite:false})));
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(120),3));
  const sp=new THREE.Points(pg,new THREE.PointsMaterial({color:'#ffcf6a',size:7,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.frustumCulled=false;grp.add(sp);
  grp.userData={fire,ring,scorch,smoke,sp,pg};return grp};
function updBlast(m,b){const u=m.userData,t=b.t,f=Math.min(1,t/.35);m.position.set(b.x,0,b.y);
  u.fire.visible=t<.7;u.fire.position.y=40+t*40;u.fire.scale.setScalar(20+130*Math.sqrt(f));u.fire.material.opacity=Math.max(0,1-t/.7);u.fire.material.color.setHSL(.09-.05*f,1,.5-.2*f);
  u.ring.visible=t<.6;u.ring.position.y=3;u.ring.scale.setScalar(10+170*t/.6);u.ring.material.opacity=.7*(1-t/.6);
  u.scorch.scale.setScalar(70);u.scorch.material.opacity=Math.max(0,.55*(1-t/3.5));
  u.smoke.forEach((s,i)=>{const p=b.sp[i],tt=Math.max(0,t-.1*i);s.visible=tt>0;s.position.set(Math.cos(p.a)*30*(i%3),30+tt*(35+i*6),Math.sin(p.a)*30*(i%3));s.scale.setScalar(25+tt*(22+i*3));s.material.opacity=.55*Math.max(0,1-t/3.5)});
  const pos=u.pg.attributes.position;b.sp.forEach((p,i)=>{const r=p.s*(1-Math.exp(-4*t))/4,h=Math.max(0,p.v*t-450*t*t);pos.setXYZ(i,Math.cos(p.a)*r,5+h,Math.sin(p.a)*r)});pos.needsUpdate=true;u.sp.material.opacity=Math.max(0,1-t/1.4);u.sp.visible=t<1.4;
  if(t<.5){S3.boom.position.set(b.x,90,b.y);S3.boom.intensity=Math.max(S3.boom.intensity,6*(1-t/.5))}}
function render3d(){
  if(!S3)return;const s=S3,now=performance.now()/1000;
  if(gen3!=GEN){rebuildStatic();gen3=GEN}
  P.e3=(P.e3||0)+(g3(P)-(P.e3||0))*.25;
  const ey=46+P.e3-(P.dead>0?30:0),sk=shake*6;
  CAM.position.set(P.x+(Math.random()-.5)*sk,ey+(Math.random()-.5)*sk,P.y+(Math.random()-.5)*sk);
  CAM.lookAt(P.x+Math.cos(P.ang)*100,ey-(P.dead>0?20:0),P.y+Math.sin(P.ang)*100);
  s.sun.position.set(P.x+350,600,P.y+250);s.sun.target.position.set(P.x,0,P.y);
  s.gun.visible=!(P.dead>0);s.gun.rotation.x=P.rl?-.5:0;s.gun.position.z=-24+(P.cd>.06?4:0);s.fl.visible=P.cd>.06;
  s.roofs.forEach(o=>{const a=inR([o.r],P.x,P.y)?.12:1;o.mat.opacity=a;o.ch.material.opacity=a});
  s.boom.intensity=0;
  const pl=[...bots.map(b=>({e:b,c:'#c0392b'})),...Object.values(remotes).filter(r=>r.al!==0).map(r=>({e:r,r,c:r.tm?'#2f7fd0':'#d9432f'}))];
  sync(s.pp,pl,mkChar,(m,o)=>{m.position.set(o.e.x,g3(o.e),o.e.y);m.rotation.y=-(o.e.ang||0);m.children[0].material.color.set(o.c)});
  sync(s.pk,pick,()=>new THREE.Mesh(new THREE.OctahedronGeometry(11),new THREE.MeshLambertMaterial()),(m,p)=>{const c=p.type=='hp'?'#2ecc71':'#f39c12';m.material.color.set(c);m.material.emissive.set(c).multiplyScalar(.5);m.position.set(p.x,24+Math.sin(now*3)*4,p.y);m.rotation.y=now*2});
  sync(s.pc,chests,()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(40,26,28),new THREE.MeshLambertMaterial({color:'#9c6b2f'})),l=new THREE.Mesh(new THREE.BoxGeometry(8,10,4),new THREE.MeshLambertMaterial({color:'#ffd34d',emissive:'#7a5a00'}));l.position.set(0,2,15);m.add(l);m.castShadow=true;return m},(m,c)=>m.position.set(c.x,13,c.y));
  sync(s.pb,bullets,()=>new THREE.Mesh(new THREE.SphereGeometry(3,6,6),new THREE.MeshBasicMaterial({color:'#ffe066'})),(m,b)=>m.position.set(b.x,(b.z?TH:0)+40,b.y));
  sync(s.pl,lobs,()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(9,12,10),new THREE.MeshLambertMaterial({color:'#222'}));m.castShadow=true;return m},(m,b)=>{m.position.set(b.x,10+Math.sin(Math.PI*Math.min(1,b.t/.5))*70,b.y);m.material.emissive.set(Math.floor(b.t*8)%2?'#ff2200':'#000000')});
  sync(s.pe,blasts,mkBlast,updBlast);
  R3.render(s.sc,CAM);
  const v=new THREE.Vector3();g.textAlign='center';g.font='bold 12px system-ui'; // name tags + health bars projected onto the 2D overlay
  pl.forEach(o=>{v.set(o.e.x,g3(o.e)+78,o.e.y).project(CAM);if(v.z>1)return;const x=(v.x+1)/2*W,y=(1-v.y)/2*H;
    g.fillStyle='#000';g.fillRect(x-18,y,36,4);g.fillStyle=o.r&&o.r.tm==TEAM?'#2ecc71':'#e74c3c';g.fillRect(x-18,y,36*Math.max(0,o.e.hp)/(o.r?100:50),4);
    if(o.r){g.fillStyle='#fff';g.fillText(o.r.n,x,y-4)}});
}
function toggleView(){
  if(paused)return;
  if(!V3){try{if(typeof THREE=='undefined')throw 0;if(!S3)init3d()}catch(e){$('tips').innerHTML+='<br>3D view unavailable (library or WebGL blocked)';return}}
  V3=!V3;$('c3').style.display=V3?'block':'none';
  if(!V3&&document.pointerLockElement)document.exitPointerLock();
}

build();
let last=performance.now();
(function tick(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(!over&&!paused)update(dt);draw();requestAnimationFrame(tick)})(last);
</script>
</body></html>
```

---

# Part 4: Smoke test (scripts/smoke_test.js)

Save as `smoke_test.js`, run `node smoke_test.js <file.html>`.

```js
#!/usr/bin/env node
// Usage: node scripts/smoke_test.js game.html ["extra js to run after the frames"]
// Extracts the main inline <script> (the one without src), syntax-checks it, stubs the DOM/canvas,
// runs 300 update/draw frames, then throws a bomb and runs 20 more. Prints one summary line.
const fs=require('fs'),cp=require('child_process');
const html=fs.readFileSync(process.argv[2],'utf8');
const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop();
if(!m){console.error('no inline <script> found');process.exit(1)}
let src=m[1];fs.writeFileSync('/tmp/_game.js',src);
const chk=cp.spawnSync('node',['--check','/tmp/_game.js']);
if(chk.status){console.error('SYNTAX ERROR\n'+chk.stderr);process.exit(1)}
const ctx=new Proxy({}, {get:(t,k)=>/^create(Radial|Linear)Gradient$|^createPattern$/.test(k)?()=>({addColorStop(){}}):()=>{},set:()=>true});
const el=()=>({getContext:()=>ctx,style:{},set textContent(v){},set innerHTML(v){},width:0,height:0,classList:{add(){},remove(){}}});
Object.assign(global,{document:{getElementById:()=>el(),createElement:()=>el()},innerWidth:1200,innerHeight:800,
  addEventListener(){},performance:{now:()=>Date.now()},requestAnimationFrame(){},setInterval(){},sessionStorage:{},indexedDB:undefined});
global.window=global;
src=src.replace(/\(function tick[\s\S]*$/,''); // drop the rAF loop, we drive frames ourselves
src+=`;paused=false;for(let i=0;i<300;i++){update(.016);draw()}
lobs.push({sx:P.x,sy:P.y,tx:P.x,ty:P.y,x:P.x,y:P.y,t:1.39});for(let i=0;i<20;i++){update(.016);draw()}
console.log('OK walls',walls.length,'trees',walls.filter(w=>w.tree).length,'bots',bots.length,'blasts',blasts.length,'hp',P.hp);
${process.argv[3]||''}`;
try{(0,eval)(src)}catch(e){console.error('RUNTIME ERROR',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)}
```
