# Adding a 3D first-person view to the 2D game

## Choice
Three.js (r128 UMD from `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`, pinned) is the best fit: one script tag, huge API surface, shadows, instancing, fog. PixiJS is 2D only. Babylon.js is heavier. A hand-rolled raycaster (Wolfenstein style) only makes sense if no libraries are allowed. Keep the game state 2D; 3D is just another renderer.

## Architecture (the part that kept everything working)
- Same state, two renderers: `draw()` = `clearRect`, then `V3 ? render3d() : world2d()`, then the shared 2D overlay (vignette, flash, crosshair, tags). Toggle with V; lazily `init3d()` inside try/catch so a missing library or WebGL leaves the game top-down with a message.
- Layering: `<canvas id=c3>` (WebGL, z-index 0) under `<canvas id=c>` (2D, transparent in 3D mode, z-index 1), HUD panels z-index 2. Both `position:fixed`. In 2D mode `world2d()` paints an opaque background so c3 is hidden.
- Declare cross-cutting globals with `var` (`R3, CAM, V3, GEN, shake`): `fit()` runs at startup before later `let`s exist (temporal dead zone crash otherwise).
- Static geometry is rebuilt when `GEN` changes (incremented after each `build()`), never per frame.
- Dynamic objects use pooled meshes: `sync(pool, list, make, update)` grows the pool, hides extras, updates the rest. No per-frame allocations.

## Coordinates and camera
World (x,y) -> Three (x, up, y). Facing angle `a` means forward = (cos a, 0, sin a); right = +world y when facing +x. Camera `position=(P.x, 46+elev, P.y)`, `lookAt(P.x+cos*100, same y, P.y+sin*100)`. Characters: `rotation.y = -a`.

## Scene recipe
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

## Performance notes
~500 static meshes + shadows ran fine; if it lags: merge static walls by color into one BufferGeometry, lower shadow map to 1024, reduce fog distance, cap trees. Do not call `new` inside render loops (use scratch vectors).

## Controls
Pointer lock on mousedown (try/catch, may be refused in sandboxed iframes) with the edge-turn fallback described in physics-movement.md. Bomb throws along the facing direction. Disable arrows for off-screen teammates (they assume top-down).
