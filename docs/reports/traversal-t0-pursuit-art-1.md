# TRAVERSAL-T0-PURSUIT-ART-1

Baseline: `main` at `0e982fe40979b482e337f60435ec68e144897751`

Branch: `traversal-t0-pursuit-art-1`

## Contract

| Item | Result |
|---|---|
| PURSUIT PRODUCTION DEFAULT | NO |
| PURSUIT DEV FLAG | `?traversalPursuit=1` |
| APPROVED PURSUER FAMILY | Generic shadow monster |
| PURSUER NARRATIVE IDENTITY | NONE / GENERIC |
| PURSUIT WINDOWS PER COMPLETE PATH | 3 |
| CAUGHT CAMPAIGN CONSEQUENCE | NONE |
| ROAD COMBAT ADDED | NO |
| `LOCAL_INTERACTION` RESTORED | NO |
| SAVE SCHEMA CHANGED | NO |
| ROUTE RISK AUTHORITY CHANGED | NO |
| ROUTE REWARD AUTHORITY CHANGED | NO |

`TraversalRoutePursuit.ts`, `TraversalT0Pursuit.ts`, and `TraversalPursuitPresentationPolicy.ts` were not changed. The existing DEV gate, route windows, pressure formula, catch speed reset, and escape semantics remain authoritative.

## Asset and renderer

The sole runtime Pursuit asset is [shadow-pursuer.png](../../public/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png): 640 × 336 RGBA, SHA-256 `55dfad9b50076ab3cd3b30f5245d6701ef2eea03bb6707959618276b155b9fc1`, 257,427 bytes. The cutout is a right-running, low quadruped made from charcoal shadow and restrained crimson/ember detail. It carries no insignia, uniform, canonical weapon, or named species cue. Programmatic alpha bounds are `(9, 14)–(631, 320)` on the final canvas; all extremities are inside the image. The manifest records the exact dimensions and hash. The [asset README](../../public/assets/generated/lion-phase/traversal/t0/pursuit/README.md) records orientation and activation scope.

The asset was generated with the built-in `image_gen` tool. The final generation direction was an isolated, transparent, right-running shadow quadruped with charcoal/crimson texture, a small ember eye, and short trailing wisps; the edit prompt preserved the beast while restoring clear alpha margins around every extremity. The only post-generation change was mechanical alpha trim and Lanczos resize to the runtime canvas. No existing world, caravan, Risk, or Reward media was regenerated.

The renderer remains the sole visual owner. It creates one decorative `img` with empty `alt` inside an `aria-hidden` wrapper and no focusable controls. The geometric head/body/wheel and `DEV · REAR PURSUER` label are removed. The sprite still follows the existing pressure-to-rear-gap curve and lane tops. The new contact X accounts for the wider image; the caravan does not move. A 95% vertical anchor places paws on the lane contact line. A 2 px running bob, local shadow/contrast, the existing 650 ms contact flash, and the existing 650 ms retreat are presentation only.

Desktop CSS sizes the sprite to 48% of caravan height and about 61% of its box width. At ≤700 px it uses 52% height and about 68% width for readability, with a pressure-dependent mobile rear offset. The sprite stays beneath the caravan in the layer stack so contact never covers it. There is no meter, new control, new UI panel, or camera effect.

## Browser QA

The [machine-readable browser run](./traversal-t0-pursuit-art-1-browser/browser-qa.json) and [ten-capture gallery](./traversal-t0-pursuit-art-1-browser/index.html) are generated through `node tools/traversal-t0-browser-qa.mjs --pursuit-art-qa`. The driver uses the real T0 GameApp, forest road, production caravan, HUD, lane controls, Risk, and Reward. It records Pursuit outcomes, pressure, image load, DOM/accessibility contract, sprite/caravan scale, screen bounds, campaign signature, collisions, loot, and page errors.

| Scenario | Result |
|---|---|
| Normal DEV, Pursuit off | No renderer or Pursuit diagnostics. |
| Route 3, Pursuit on, Risk off | One `STARTED` → one `ESCAPED`, no catch; sampled opposite-lane pressure decreases and the campaign signature is unchanged. |
| Route 3 deliberate catch, Risk off | One `CAUGHT`; the sprite reached within 0.46 px of the caravan rear, with local contact flash and speed `2.1305 → 1.0` at elapsed `11,166.3 ms`, progress `.74442`. Campaign signature unchanged. |
| Full Path A, Risk and Reward on | Three starts, three escapes, zero catches; arrival/Journey agency reached. |
| Full Path B, Risk and Reward on | Three starts, three escapes, zero catches; arrival/Journey agency reached. One Route 5B Risk collision moved sampled pressure `.266260 → .495423` (the `+.22` impulse plus frame integration), and the later pouch raised temporary route gold to 60. |

The gallery includes Route 3 start at 1440×810, 620×780, and 390×844; medium (`.693`) and high (`.788`) pressure, caught (`1.0`), and escaped states; Route 5B Risk coexistence and later Reward; and Route 6 pursuit. The rear gap narrows from 64.9 px at desktop start to 13.4 px at high pressure and 0.46 px at contact. Measured sprite/caravan ratios were 60.8% width and 48.0% height on desktop, and 68.1% width and 52.0% height at 620/390 px. QA checks no HUD/control overlap, no horizontal overflow, the correct lane, a single caravan, successful image load, an empty image alt, no old proxy parts, and no page errors. The monster is visually distinct from the obstruction ahead and the warm gold collectible; the `+5 route` feedback remains readable. The final five scenarios and ten captures had zero errors.

## Production and validation

The [production browser proof](./traversal-t0-pursuit-art-1-production/browser-qa.json) used the built Vite preview with `?traversalPursuit=1`. Playwright used the repository's existing production QA GameApp bootstrap seam to enter real T0 Route 1; the built game policy was unchanged. It found zero Pursuit renderers, zero Pursuit diagnostics, zero Pursuit images, and zero requests for `shadow-pursuer.png`.

| Check | Result |
|---|---|
| Pursuit, Risk, Reward, RouteRun, scene, GameApp, RunSystem, route authority, production policy, HUD, Journey, cinematic focused tests | 124 passed across 15 files after final contact alignment. |
| TypeScript `tsc --noEmit` | Passed. |
| Production build | Passed; Vite transformed 187 modules. |
| Production `?traversalPursuit=1` browser proof | Passed; zero renderer, diagnostics, or asset requests. |
| Full Vitest | 2,608 passed, one inherited CIN-6E-A guard failure below. |
| `git diff --check` | Passed. |

The inherited `tools/cinematics/cin6ea_preproduction.test.mjs` protected-file guard rejects `src/game/GameAppRouteReward.test.ts` from the merged baseline. `git diff main -- src/game/GameAppRouteReward.test.ts tools/cinematics/cin6ea_preproduction.test.mjs` is empty. This branch changes neither file. No new Pursuit regression appeared in the full suite.
