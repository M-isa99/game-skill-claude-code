# Realistic design, depth, color, player look, HUD, bomb effect

## Depth in a 2D top-down view (2.5D)
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

## Color system
Grass #4a7c3a | wall top #8a6a4c side #5a4129 | tower #9aa0aa / #4c515a | rock #9a9a9a / #5e5e5e | furniture #b08968 / #6f4e37 | roofs red #a13d2d/#6e2418, blue #3d5a80/#26364d, green #6b705c/#3f4238 with floors #8f7352 / #6d7b8a / #9a8c6b | pads #e8c547 with #ff5a3c core | HP #2ecc71 | ammo #f39c12 | bombs #ffb347 | bullets #ffe066 | stairs hsl(35,25%,32+5i%).
Rules: one hue family per material; side face ~35-40% darker than top; team colors red `['#ff7a66','#8e1f12']`, blue `['#6cc4ff','#134f8a']` (light/dark pair for gradients); friendly bars green, hostile red.

## Player and enemy design
- Top-down: circle r=16 with radial gradient (highlight at -5,-5), dark barrel rect (length r+14, thickness 6) rotated to aim, soft ground shadow ellipse, floating HP bar (+ name tag for humans).
- 3D: cylinder body (r 14-16, h 44), skin-tone head sphere (r 11), dark gun box; `rotation.y = -aim`; body color per team.
- Own player in FPS: hide the body, show a viewmodel gun parented to the camera with a muzzle flash (visible while `P.cd>.06`) and a dip while reloading.

## Buildings that feel real
Random size (420-540 x 320-400), 30px walls, 110px south door, interior partition with a 100px doorway, 3 low furniture blocks (cover), chimney, roof overhang, plank lines on the floor, coloured roof per building. Place buildings FIRST in `scatter` so they get room.

## Trees
Solid 30x30 trunk collider in `walls` (`tree:1`). Top-down: shadow ellipse, trunk, two canopy circles with radial gradients, painter-sorted so players walk behind canopies. Cluster 75% of trees around ~12 forest centers, 25% scattered. 3D: InstancedMesh (see three-js-3d.md).

## Unreal/Fortnite-style HUD (HTML/CSS, not canvas)
Dark translucent panels `rgba(12,16,24,.72)`, 1px border `rgba(255,255,255,.18)`, `backdrop-filter:blur(6px)`. Bottom-center: shield bar over health bar, skewed -14deg, numbers inside. Bottom-right: big magazine number, reload progress bar, bomb count. Top-right: minimap. Top-center: pill with code, score, enemies. Bottom-left: scoreboard. Crosshair on canvas at the mouse (screen center in FPS); hide the OS cursor. Use `env(safe-area-inset-*)`.

## Realistic bomb effect (spawn `{x,y,t:0,sp:[40 x {a,s,v}]}`, life 3.5 s)
1. **Scorch** decal: dark ellipse fading over 3.5 s.
2. **Fireball**: radial gradient white core, orange, transparent; radius 30+110*sqrt(min(1,t/.3)); gone by .7 s. 3D: additive sphere, HSL hue .09 to .04.
3. **Shockwave ring** expanding to ~170 px by .6 s.
4. **Sparks/debris**: radius `s*(1-exp(-4t))/4`, height `v*t-450*t*t`, fade by 1.4 s. 2D: radial streaks; 3D: `Points`, additive.
5. **Smoke**: 7 puffs staggered .1 s, dark gray, rising and growing, alpha .5 to 0 by 3.5 s.
6. **Light and camera**: screen flash scaled by distance, `shake=min(1,400/(60+dist))` decaying 1.8/s, in 3D one permanent PointLight whose intensity spikes then decays (never add lights at runtime: shader recompiles stutter).
Damage logic is separate: radius 140, fixed damage, thrower takes less, teammates only hurt by their own bomb.
