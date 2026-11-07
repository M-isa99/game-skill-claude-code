# Movement, collisions, height, projectiles, bots

## Collision
- Entities are circles (R=16); solids are axis-aligned rects. Circle-vs-rect: clamp the center to the rect, compare squared distance with R*R.
- **Move each axis separately** (try x, then y): gives wall sliding for free.
- **Escape hatch**: if the entity already overlaps something (landed in a wall, dropped off a tower edge), skip collision for that step or it gets stuck forever.
- Clamp to world bounds and add 4 thick boundary walls (100px) outside.
- **Anti-tunnelling**: cap `dt` at .05; fastest bullet 1100 px/s moves 55 px per step, walls are at least 40 px thick.

## Height without a real 3D engine
`z` is 0 or 1. `high(x,y)` = center inside a stairs rect OR circle touches a tower. Ground units (z=0) collide with towers unless their center is on stairs; elevated units ignore towers. Result: you can only enter a tower via its stairs, and walking off an edge drops you. Bullets carry `z` (shooter's height): z=1 bullets ignore walls, so high ground wins. Stairs run toward the tower; in 3D the camera height is the ramp fraction along the stairs (`TH*(s.x+s.w-x)/s.w`), TH on the tower, lerped .25/frame.

## Movement
- Top-down: aim = atan2(mouse - screen center); hold right-click or W to walk toward the cursor at 240 px/s.
- FPS: W/S forward/back, A/D strafe, normalize the vector, `x = c*fx - s*fy`, `y = s*fx + c*fy` with c,s = cos/sin(aim). Yaw from pointer lock `movementX*.0025`; if pointer lock is unavailable (iframe), fallback to edge-turn `(mx-W/2)/(W/2)*2.2*dt`.
- Locking input while dead or after a win: one `lk()` helper used by move, shoot and bomb.

## Jump pads
Stepping within 30 px starts `jump=.6 s`: dash 750 px/s along the aim, collisions ignored, visual arc `70*sin(pi*jump/.6)`, then the escape hatch frees you if you land inside something.
(A space-bar hop/double jump existed: `vz=450`, gravity 1100, second jump allowed until landing, walls ignored while `h>40`. The user later asked to remove it.)

## Weapons
Fire interval .12 s, spread +-.025 rad, mag 30, 3 reloads, reload 1.4 s (auto-reload on empty click), bullet 1100 px/s for .8 s, damage 25. Bots: .8 s interval, 600 px/s, spread +-.15, damage 8, only shoot when within 650 px with clear line of sight (sample 12 points along the segment against `walls`).

## Bombs
Chest pickup gives 1 bomb (max 5). Throw toward cursor (or facing in FPS), clamp range 450. Position lerps from thrower to target in .5 s with arc `70*sin(pi*k)`, blinks, explodes at 1.4 s. Radius 140 hits everyone (bots 100, thrower 40). Explosion visuals use analytic particles (see visual-design.md). In multiplayer each client hurts only itself.

## Pickups and respawn
HP +35 only if hp<100, ammo +1 reload only if <9. Picked items go to a timer queue `Q` and return in the SAME place (deterministic across clients). Solo can respawn elsewhere. Damage order: shield first, then health.

## Bots
Wander to random targets (re-pick every 4 s, on arrival, or when blocked), chase and shoot when they see you, stop approaching at 300 px. They obey the same `move()` so they can climb stairs.
