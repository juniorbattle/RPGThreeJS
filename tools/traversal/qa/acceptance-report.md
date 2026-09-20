# Traversal T0 Objective Mode acceptance

Status: PASS for the authorized T0 preview scope. Changes remain local, uncommitted and unpushed. Production remains disabled.

## Authority and scope

- Campaign Structure, RunSystem and Character System V2 retain canonical authority. Their source data and canonical image masters were not changed.
- Mandatory stages and fork choices use their existing canonical node bindings and handoffs, after explicit confirmation.
- The five optional road beats use Traversal-local interactions, with empty canonical node bindings. They create no nodes, persistent rewards or story consequences.
- Preview saves are isolated in memory. Normal SaveRepository and production Travel/Journey selection remain intact.
- `TRAVERSAL_PRODUCTION_GATE.enabled` and `designAssetsReady` remain false; rollout remains T0 only.

## Interaction acceptance

Same-lane optional approach reveals the top-center preview, pauses at the engagement line, and offers Confirm/Skip. Confirm opens the appropriate local interaction shell; Resume consumes the beat and continues the same session. Skip consumes and resumes immediately. Opposite-lane optional content is bypassed without a pause. Consumed and bypassed beats never retrigger.

Mandatory stages pause regardless of selected lane, display Continue only, and commit no canonical transition before that action. World motion, progress and lane changes remain frozen during decisions and local interactions. Canonical resolution returns to the existing session and progress. Ordered crossing logic prevents frame deltas from skipping engagement boundaries.

Browser evidence covered merchant Confirm/local Resume and Skip, wolves Skip and opposite-lane bypass, canonical combat and return, ranger recruitment dialogue and return, chest Confirm/local Resume, broken cart Confirm/local Resume, refugees and canonical choices, booster Confirm/local Resume, the mounted-world fork, canonical event resolution, and arrival at Refuge du Lion. Mandatory stops were checked from both lanes. The combat handoff used the existing isolated QA deployment/victory controls; this checks integration and return, not combat balance.

The completed dedicated browser journey had no captured console warnings or errors. DOM progress remained fixed during decisions. Browser review used the existing 1463×690 viewport; other viewport sizes are not claimed as browser-verified.

## Visual corrections

- One continuous broad road with exactly two selectable lane baselines.
- New fantasy timber truck with four visible wheels, empty cabin, cargo, suspension, motion and dust; no horse, people or heraldry.
- Visible-alpha-bounds sizing for canonical characters and generated props, giving plausible relative height and shared ground anchors. Canonical NPC/enemy facing points toward the approaching truck.
- Smaller attached markers; complete upcoming subjects visible before engagement; bypassed content fades before intersecting the truck.
- Centered mandatory subject and a physical barricade arrangement spanning the two-lane corridor; no giant trigger overlays.
- Top-left journey context, top-center contextual decision, top-right progress and two left lane controls. No persistent bottom HUD or exposed QA controls in the Traversal world.
- The scenic castle panorama appears once. Independent midground/foreground props add depth, and the repeating road has identical left/right edge pixels.
- Real chest, broken cart, debris, waystone, barricade and vegetation artwork replaces geometric prop stand-ins. Alpha extraction preserves complete silhouettes without neighboring fragments.

## Browser screenshots

- [A: clean travel](A-clean-travel.png)
- [B: optional approach, still moving](B-optional-approach.png)
- [C: optional merchant paused](C-optional-paused.png)
- [D: mandatory encounter paused](D-mandatory-paused.png)
- [E: chest](E-chest-paused.png), [cart and debris](E-cart-and-debris-paused.png), [booster waystone](E-booster-paused.png)
- [Mandatory human encounter](mandatory-refugees-paused.png)
- [Canonical fork over mounted world](F-canonical-fork.png)
- [Return to route](return-to-route.png)
- [Canonical Refuge arrival](G-arrival.png)

## Assets and provenance

All runtime paths are listed in `src/traversal/TraversalT0Assets.ts`; SHA-256 hashes, dimensions and active flags are in `public/assets/generated/lion-phase/traversal/t0/asset-manifest.json`.

New active files under that asset pack:

1. `vehicle/wooden-4x4/fantasy-truck-v3.png` — byte-identical generated transparent truck.
2. `entities/route-props-v3/chest.png`
3. `entities/route-props-v3/abandoned-cart.png`
4. `entities/route-props-v3/debris.png`
5. `entities/route-props-v3/waystone.png`
6. `entities/route-props-v3/barricade.png`
7. `entities/route-props-v3/foreground.png`

The unique original panorama, existing road loop and existing merchant caravan remain active. The prior truck and mirrored panorama are retained but inactive. Six original manifest assets passed unchanged SHA-256 checks. Ten presentation assets are active. Canonical characters continue to come from Character System V2; their bounds are measured read-only.

`prompts-used.md` records generation intent and source provenance. The raw transparent prop atlas is retained. `extract_props.py` and `extraction-qa.json` document the corrected gutter extraction. Rejected equal-grid products were removed from the pack, with their failed extraction metadata retained here for audit. Approved references recovered from the prior task are stored byte-identically under `docs/references/traversal/t0/`, with written-spec precedence documented in README.txt.

## Exact validation results

- Focused Traversal checks: 9 files, 28 tests passed.
- Full Vitest run: **140 files, 2,438 tests passed; 0 failed; 0 pending**. See [JSON](full-tests.json) and [log](full-tests.log). The older remembered VFX baseline failures were not present in this run.
- TypeScript `tsc --noEmit`: passed.
- Vite production build: passed. Its non-blocking chunk-size warning remains; see [build log](build.log).
- `git diff --check`: passed. Git emitted only line-ending conversion notices.
- [Asset audit](asset-audit.json): 10 active assets, 6 original assets preserved, exact matching road edge pixels, six complete prop extracts without edge contact.
- Pure runtime/scene/integration tests exercise Confirm, Skip and opposite-lane bypass across every local beat, mandatory ordering and canonical handoffs, same-run return, fork and arrival, and storage isolation.

## Intentional limitations

This is a development-only T0 preview. Local merchant, wolves, chest, cart and booster interactions are visual/interaction proofs, as explicitly authorized; they do not launch newly invented campaign content or award persistent rewards/effects. Canonical mandatory content retains its existing consequences inside the isolated preview run. No later Traversal leg or production rollout is enabled.
