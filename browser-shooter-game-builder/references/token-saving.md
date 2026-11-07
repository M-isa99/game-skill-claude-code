# Saving tokens on game builds

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
