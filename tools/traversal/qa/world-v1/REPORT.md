# TRAVERSAL-T0-VISUAL-ARCHITECTURE-REBASE

Implementation and internal visual gates complete; awaiting operator visual review. Work remains uncommitted and unpushed on `campaign-structure-1`, based on `16a07a1f32c3e1997b9049243df1dcf769ef0305`.

Open [the interactive review](review.html) through the local Vite server: `http://127.0.0.1:5176/tools/traversal/qa/world-v1/review.html`. It switches between actual Chromium captures with and without actors, compares the merchant baseline, and plays the recorded live traversal. [Architecture and rejected-code audit](ARCHITECTURE.md). [Asset prompts](PROMPTS.md).

## Result

The road is now assembled from contiguous authored environment sections, each with a meaningful road-space interval and lead-in/core/lead-out. Nearby forest, terrain, places and actors share the same camera distance. Persistent locations are independent of their interaction beats. Merchant, resting site, ruined outpost and selected branch scenes use the same forest/soil reference. Opening Ambush is a physical corridor obstruction with a cleared aftermath; its canonical enemies remain independent. The junction has a real dirt divergence and a persistent sign; branch selection still uses the existing short fade and deferred event.

Removed from runtime: beat-owned `backdropAsset`, generic crossroads grounding, radial ground mask, left/right verge cutouts, point-anchored roadside dressing and the compound prop barricade. Old source art remains intact on disk but those retired assets are no longer registered for runtime use.

## Visual gates, inspected in Chromium

| Gate | Evidence and result |
| --- | --- |
| Merchant — first, before migration | [With actors](final-combat/merchant-route.png), [without actors](final-combat/merchant-route-environment.png). Trading clearing remains meaningful without the merchant; forest, worn entrance, soil and road form one place. Cool ambient lighting, local lantern pools. No rectangular module boundary observed at approach/stop/departure. Upper-lane truck alignment retained. |
| Merchant persistence / motion | [Initial measurement](merchant-browser.json), [960px final measurement](final-merchant-960/merchant-browser.json), [video](final-merchant-960/merchant-motion.webm). Location survives interaction consumption. Actor and place displacement agree within DOM subpixel rounding. |
| Opening Ambush | [Formation](final-combat/ambush-route.png), [environment only](final-combat/ambush-route-environment.png). Fallen tree, cart, roots and disturbed road read as one compromised section spanning both lanes. |
| Aftermath | [Cleared scene](final-combat/ambush-cleared-runtime.png). Existing stage resolution reveals the road clearance at event return; the wreck remains beside the road. No driving through an intact blockade. |
| Junction | [With interaction](final-combat/fork-gate.png), [environment only](final-combat/fork-gate-environment.png), [choice](final-combat/fork-choice.png). The dirt branch is readable independently of the sign; the sign is now a persistent location prop. |
| Human resting site | [With actor](final-combat/rest-gate.png), [environment only](final-combat/rest-gate-environment.png). Shelter, packs, hearth and worn access remain a believable resting place. |
| Remaining places | [Outpost / combat branch](final-combat/branch-lion-first-trial-combat.png), [human branch](final-event/branch-lion-first-trial-event.png). Same terrain, palette, ground horizon and vegetation. Both remain optional encounters with clear road space. |

The supplied boards were used structurally: large places live behind the road, terrain flows through them, vegetation connects their edges, and gameplay actors remain readable in front. The implementation uses an authored raster section plus separate actors/foreground strategy; it does not reproduce every scenic detail of the boards. Repeated mirrored forest motifs remain visible on long stretches. Portrait-phone layouts were not visually qualified; tested viewports are 1463×823 and 960×640.

## Functional and technical validation

- **44/44 Traversal-focused tests passed**, including the new interval/lifetime/variant coverage and the existing Confirm, Skip, opposite-lane bypass, mandatory contact, random combat and deferred-branch tests.
- **144 test files, 2,454/2,454 tests passed** in the full suite with `--maxWorkers=2 --minWorkers=1`: [result JSON](full-tests-bounded.json), [log](full-tests-bounded.log). The first unconstrained run overlapped browser/build work and hit eight 5-second timeouts, with no assertion failures; that run is preserved separately in `full-tests.json` / `full-tests.log`. The completed bounded rerun is fully green; the older VFX baseline failures did not reproduce here.
- Typecheck passed. Production build passed, with the existing large-chunk advisory: [build log](build.log).
- `git diff --check` passed. No changes to Campaign Structure, RunSystem, TraversalRunRuntime, TraversalRunController, Character System V2, save repositories, TravelView, Journey or the production feature gate.
- Real Chromium route checks completed for [combat branch](final-combat/route-lion-first-trial-combat.json) and [human branch](final-event/route-lion-first-trial-event.json), with zero captured JavaScript exceptions. Both performed canonical opening dialogue/combat and return, optional Skip/bypass, fork selection, deferred branch stop, departure and Travel View return. The human-route run also entered and returned from a real random road combat. Existing DEV QA Victory controls were used; this does not test combat balance.
- Both fork captures measure frozen progress `0.8` during the fade, variant/lane change at the covered midpoint, then normal progression. No literal vehicle turn was introduced.
- Seven new 1536×1024 assets from built-in ImageGen, no image postprocessing, byte-identical project copies: [SHA-256 audit](asset-audit.json). All tracked pre-existing art and media are unchanged.

## Scope lock

Exactly two lanes; existing routeProgress/contact rules and authorities preserved. Production remains `enabled: false`, `designAssetsReady: false`, T0 only. Preview saves remain isolated. No commit, push or production activation. The existing untracked QA frame directories present before the task were preserved.

The visual answer is now yes: places remain physical places when their actors and interaction UI are hidden, and the vehicle travels through one continuous authored road. This is the implementation-side visual assessment; final artistic acceptance belongs to the operator.
