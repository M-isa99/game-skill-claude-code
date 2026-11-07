# Team deathmatch: PeerJS + BroadcastChannel + IndexedDB

## Topology
- Star over PeerJS: host creates `new Peer('tdm-'+CODE)`, clients `peer.connect('tdm-'+CODE)`. The host relays every incoming message to the other clients (this is the "broadcast"). Client `send` goes only to the host. If the host leaves, clients show HOST DISCONNECTED (no host migration).
- `unavailable-id` on create: generate a new code and retry. `peer-unavailable` on join: show "No match found with that code".
- **Fallback**: if `Peer` is undefined or the peer does not open within 6 s (the hosted page's CSP blocks PeerJS's cloud server), use `BroadcastChannel('tdm-'+CODE)`: same-browser tabs only. Label the mode in the HUD ("LOCAL TABS ONLY (reason)") so the user is never misled. Real cross-device play needs the HTML hosted somewhere with open internet.

## Everyone sees the same world
Map = `build(hash(code))`: wrap `Math.random` with a seeded mulberry32 during generation, restore afterwards. Generation order must be deterministic (same scatter calls, same counts). Bots and random respawns are disabled in matches; picked items respawn in the same place via the queue.

## Messages (JSON, no framework)
`st` state every 50 ms {id,n,tm,x,y,a,hp,sh,z,al,k,d} | `shot` {b:{x,y,vx,vy,z},tm} | `bomb` {b,tm} | `take` {a:'p'|'c',i:id} | `kill` {kid,kt,rd,k} | `hello` -> `sync` {rd,KL} | `bye`.
Authority is per-owner: each client moves itself, simulates remote bullets/bombs locally, and applies damage ONLY to itself, then broadcasts a `kill` when it dies. Friendly fire is off (bullets and bombs from teammates are ignored, own bombs still hurt).

## Score without drift
Keep a kill log `KL = {killId: killerTeam}`; score = counts. Merging logs is idempotent (no double counting even if messages race). Round counter `rd` increments after a win (6 s banner, first to 20); messages with an older `rd` are ignored, newer `rd` resets the log.

## No one disappears
- Send `st` from `setInterval(50)`, NOT from requestAnimationFrame (background tabs stop rAF and would look disconnected; timers still tick at ~1 Hz).
- Remove a remote player only on `bye`, connection close, or 20 s of silence. Dead players stay in the roster (marked) and just stop being drawn.
- Interpolate remote positions (`x += (tx-x)*min(1,dt*15)`), snap when farther than 600 px.
- Late joiners send `hello` twice (immediately and after 1.5 s); anyone answers with `sync`.
- Player id: `sessionStorage` per tab (survives refresh, distinct per tab so two tabs can test locally).
- Aids: scoreboard panel with K/D, green arrows to off-screen teammates (top-down only), teammate dots on the minimap, enemies only within 1100 px.

## IndexedDB persistence
DB `tdm`, store `kv`. Keys: `profile` {name, team, code, life:{k,d}}, `match:<code>` {KL, rd, k, d}. Wrap everything: `indexedDB` may be missing, so the promise resolves `null` and callers tolerate it. Save every 5 s, on death/kill, and on `beforeunload`. Restore the form (name, team, last code) and lifetime K/D in the lobby, and the match record when rejoining the same code.

## Safety
Player names are untrusted: escape with `esc()` before `innerHTML`; slice to 12 chars; the canvas `fillText` path is safe.
