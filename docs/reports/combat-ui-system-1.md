# COMBAT-UI-SYSTEM-1

## Authority audit (before implementation)

| Surface | Gameplay truth | Presentation state and DOM | CSS only |
| --- | --- | --- | --- |
| Combat runtime | `legacy-combat.html` loads `src/combat/legacyCombat.ts`, which loads `legacyCombatRuntime.js`; `G` and `CombatStage` own combat state and stage playback | The runtime writes into the static HTML mounts | `src/styles/combat.css` |
| Active unit and inspection | `G.active` is assigned by `beginTurn`; `G.selected` and `G.pinnedUnit` are inspection choices | `selectUnit`, `transientInspect`, `restoreInspection`, `renderPanel` | `#panel` |
| Turn order | `buildOrder`, `G.order`, `G.turnIdx`, `G.round` | `refreshTurnbar` | `#turnbar`, `.chip` |
| HP/AP | Unit `hp/maxhp`, `ap/maxap` in `G.units`; AP logic stays in runtime | `renderPanel`, `apPipsHTML` | `.du-hp`, `.du-ap` |
| Aptitude/passive | `INNATE_GIFTS_BY_WEAPON` and equipped weapon type in runtime | `renderPanel` | `.du-aptitude` |
| Status | `u.statuses`, `STATUS`, `isExhausted` in runtime; world indicators use `statusPresentation.ts` | `renderStatusPanelTags`, `renderPanel` | `.status-row`, `.tag` |
| Actions | `G.mode`, `G.active`, movement and AP guards, weapon list, inventory | `openActionMenu`, `onMenu` | `#menu`, `.ico` |
| Skills/items | `u.skills`, `SKILLS`, `getSpec`, inventory and AP guards | `openSkillMenu`, `openElanMenu`, `openItemMenu` | `#skillmenu`, `.btn` |
| Targeting/preview | `G.pending`, `rangeCells`, `affectedUnits`, `previewAccuracy`, `previewPower` | `enterTarget`, `previewAt`, `showActionPreview` | `#action-preview` |
| Objective | Encounter configuration, `G.units`, `G.round` | `renderObjective`; native `details` holds expansion | `#objective` |
| Journal | `logMsg` entries from runtime | `initLogPanel`, `toggleLogPanel`; collapsed by default | `#log` |
| Help/settings | No combat truth; graphics toggle controls rendering effects | Static `#help`, `renderSettings`, `toggleSettings` | `#help`, `#settings` |
| Responsive | Same `G` state and DOM at all widths | Media-query and CSS state adaptation | `@media` rules in `combat.css` |

## Baseline structure

The active HUD has seven static mounts (`turnbar`, `hint`, `objective`, `panel`, `menu`, `skillmenu`, `action-preview`) plus the journal, help, and settings. Runtime functions replace their contents. The existing unit portrait uses `u.portrait` when present, and the world sprite is separate Three.js content. The unit card has no live level field in `G`; no level will be invented. The objective currently rebuilds its `details` node during turn updates, which resets expansion. The action dock currently disappears on movement and targeting, so its selection is not visible.

## Final presentation architecture

`src/combat/combatHudPresentation.ts` is a pure markup and selection mapper. The runtime still supplies all unit values, turn sequencing, AP costs, skill descriptions and availability, status records, target lists, and preview numbers. It also keeps the DOM event handlers and controls transitions. `src/styles/combat-hud.css` composes the active HUD using shared campaign typography, color, spacing, frame, button, focus, and disabled primitives. The static mounts remain in `legacy-combat.html`. The new CSS intentionally leaves deployment, tutorial, result, settings, and combat log internals in their existing composition.

### Unit card cleanup

- Shows one canonical image from the selected runtime unit's `portrait` value. An initial appears when no portrait exists. The card does not add a second full-body sprite or an unrelated fallback portrait.
- Uses canonical `uiCropMode` and character scale family metadata to frame upper-body portraits and small creatures without changing protected image bytes. The master path remains unchanged.
- Groups identity, role, affiliation, HP, AP, status chips, supported innate gift, and the existing collapsible statistics. Status chips use `statusPresentation.ts` labels, colors, durations, and indicator assets.
- Omits level because the current combat unit record does not carry one. The renderer supports a level when a future runtime supplies it.
- Removes the old kind-based portrait fallback, which could show a face unrelated to the selected unit; a unit without a canonical portrait now uses its initial. The old hand-built status tags are replaced by the shared status indicator data. The active card had no miniature full-body sprite, and none was added.

### Turn order, actions, skills, and preview

- The runtime's `G.order` starts visually at the active actor and continues through upcoming actors; the active portrait receives the strongest gold border. Ally and enemy borders remain distinct.
- The action dock uses real buttons and campaign button states. Movement and targeting keep the dock in view, mark the selected action, and make other actions inert until cancel. The selected action can cancel targeting. Existing runtime availability guards remain the source of disabled states.
- The skill menu renders the runtime skill name, icon, description, AP cost, and disabled state. Attack and item submenu entries retain their runtime calculations and now use keyboard-focusable buttons. Closing any submenu clears the selected dock state.
- The preview displays attacker, runtime action, target, runtime accuracy, runtime estimated damage or support amount, AP cost, and ally-hit warning when those values exist. The runtime still computes hit and power estimates and owns target validity.
- Objective progress comes from encounter state and is collapsed after deployment. Re-rendering it preserves the user's expanded or collapsed choice. The journal remains collapsed.

### Responsive rules and safe zone

- At 900 px and below, HUD rails compress and the dock stays between the unit card and the right edge. At 700 px and below, the dock moves to one full-width bottom row, while the objective and active banner occupy separate compact top regions.
- At 560 px and below, the unit card condenses to a narrow lower-left surface, the skills panel rises above it, and nonessential hover tooltips disappear. Touch buttons remain at least 60 px tall in the mobile dock.
- The narrow tactical camera widens its field of view from the existing 33° desktop value to about 60° at 390 px to keep both teams visible. This is a viewport-only composition adjustment; it does not move units, alter targeting, or change combat calculations. `BackgroundLayerSystem.setViewportScale` scales only the passive painted plate to fill the widened view.

## Files changed

- `legacy-combat.html` — shared combat frame classes and HUD stylesheet.
- `src/combat/legacyCombatRuntime.js` — delegates markup, preserves objective expansion, keeps dock selection visible, and applies the narrow safe-zone camera adjustment.
- `src/combat/combatHudPresentation.ts` — pure view rendering and visual-state mapping.
- `src/combat/combatHudPresentation.test.ts` — focused view-state tests.
- `src/styles/combat-hud.css` — active HUD composition and responsive rules.
- `src/render/BackgroundLayerSystem.ts` — passive plate scale for narrow field of view.
- `tools/combat-ui-system-1-qa.mjs` — reproducible browser QA harness.
- `docs/reports/combat-ui-system-1-browser/` — 38 screenshots, measured geometry, and test logs.

## Browser QA

The Playwright script loaded the real combat runtime at **1440×810**, **1366×768**, **620×780**, and **390×844**. It captured normal turn, objective expanded, stats expanded, skills open and disabled, movement selected, and attack menu at each width. A same-origin campaign iframe supplied real skill IDs and authoritative encounter configuration for enabled skills, a visible status, ally and enemy previews, invalid target, and a Lion boss at desktop and mobile widths. The development-only status hook sets a runtime status for that QA state; it is unavailable in production combat.

| Viewport | Turn order | Objective collapsed | Unit card | Action dock | Document size |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440×810 | 437×58 | 224×52 | 248×169 | 376×74 | 1440×810 |
| 1366×768 | 437×58 | 224×52 | 248×169 | 376×74 | 1366×768 |
| 620×780 | 564×53 | 205×52 | 220×168 | 604×74 | 620×780 |
| 390×844 | 334×53 | 179×44 | 190×182 | 374×70 | 390×844 |

The browser QA output is [`browser-qa.json`](combat-ui-system-1-browser/browser-qa.json). It reports **38 captures, 0 failures** for document overflow, required state, image loading, active turn count, and card/dock, card/skill, and banner/objective collisions. Screenshots were visually inspected, including the normal, enabled/disabled skill, valid ally/enemy preview, invalid target, status, and boss states.

Representative captures:

- [Desktop normal](combat-ui-system-1-browser/1440x810-normal.jpg), [desktop enabled skills](combat-ui-system-1-browser/1440x810-campaign-skills-enabled.jpg), [desktop enemy preview](combat-ui-system-1-browser/1440x810-campaign-enemy-preview.jpg), [desktop boss](combat-ui-system-1-browser/1440x810-boss.jpg)
- [Narrow normal](combat-ui-system-1-browser/620x780-normal.jpg), [mobile normal](combat-ui-system-1-browser/390x844-normal.jpg), [mobile disabled skills](combat-ui-system-1-browser/390x844-skills.jpg), [mobile ally preview](combat-ui-system-1-browser/390x844-campaign-ally-preview.jpg), [mobile enemy preview](combat-ui-system-1-browser/390x844-campaign-enemy-preview.jpg), [mobile boss](combat-ui-system-1-browser/390x844-boss.jpg)

## Validation

| Check | Result |
| --- | --- |
| Focused combat UI and adjacent presentation tests | 4 files, 93 tests passed |
| Combat regression | 61 files, 1,471 tests passed; [log](combat-ui-system-1-browser/combat-tests.log) |
| Full Vitest | 151 files, 2,530 tests passed; [log](combat-ui-system-1-browser/full-vitest.log) |
| TypeScript | `tsc --noEmit` passed via `npm run build` |
| Production build | `npm run build` passed |
| `git diff --check` | Passed |
| Browser QA | 38 captures, 0 failures |

## Remaining caveat

The existing `w_salvation` catalogue description promises a 40% heal, while the combat runtime's current `getSpec` does not forward `healPercent`. The runtime's existing preview and heal execution therefore use their fallback amount (about 3 PV in the QA case). This task displays the amount the runtime actually computes and leaves the skill rule unchanged. The discrepancy needs separate gameplay authorization to fix.

## Final premium polish pass

This refinement continues the approved `combat-ui-system-1` branch at `6bb44de193e48966057971e26627a8dcc35d05a7`. It changes the active HUD's visual treatment and combat-only portrait framing. Combat state, action availability, AP, hit and damage formulas, movement, targeting, turn order, encounters, and camera behavior remain with their existing runtime owners. The approved rail positions remain; a narrow preview offset moves the strip below the journal to remove one measured collision.

### Visual intensity and hierarchy

- The active panels retain their dimensions and blue-black transparency. A brighter top brass edge, darker lower edge, inner line, subtle top light, and restrained exterior shadow give the plates depth without a larger opaque area.
- Ivory names and actions now lead; warm gold distinguishes headings and selected actions; muted blue-gray stays on supporting metadata. Green HP, blue AP and ally cues, red enemy and danger cues, and gold interaction cues carry specific meanings.
- The unit card uses a slightly wider portrait within its original card height, brighter Alegreya name, smaller gold role, clearer affiliation, stronger green HP fill and empty track, jewel-like AP pips, and a more legible aptitude block. All existing information remains.
- The turn order keeps its compact strip. Active portrait and round medallion gain warm metallic light; upcoming actors remain readable but subordinate, and defeated actors stay visibly suppressed. The active banner uses a central ornament and brighter ivory on a deeper plate.
- The dock retains its exact action mapping and position. Default, hover, selected, locked, and disabled states have distinct border, icon, text, and glow strength. Selected attack, movement, and skill states continue to come from runtime mode and pending action.
- Skill rows gain framed icons, brighter descriptions and AP cost, a stronger header divider, a gold hover/focus treatment, and readable disabled styling. The clicked skill still enters runtime targeting; the dock retains selection while the menu closes.
- The preview gains a brighter metal edge, distinct attacker/action/target text, stronger metrics, and red or green context accents while preserving its compact strip and runtime-computed numbers. At widths from 561 to 700 px it sits 31 px lower to clear the journal; the 390 px position is unchanged. The collapsed objective gains clearer title, progress, and separator treatment; its expanded body remains the same size and content.

### Combat portrait crop strategy

The renderer still uses each unit's canonical `portrait` path. `combatPortraitCrop` now treats known standard humanoid and elite/boss scale families as portrait subjects even when their shared asset profile requests `contain` for other UI contexts. Exact canonical paths in a small combat-only override registry adjust scale and focal offset for Kestrel, both mages, Serpent Oracle and elites, the Lion/Serpent bosses, wolf, badger, boar, and dragon. These offsets only alter CSS presentation; no PNG bytes, registry identities, or gameplay unit records changed.

The [portrait contact sheet](combat-ui-system-1-polish-browser/portrait-contact-sheet.png) shows full source, approved baseline card crop, final card crop, and final turn-order crop for 16 subjects: Alistair, Kestrel, White Mage, Dark Mage, three standard Serpent roles, two Serpent elites, two bosses, wolf, badger, boar, dragon elite, and Alaric. All reviewed master canvases are 512×512; the wolf, badger, boar, and dragon have unusually low or wide silhouettes within those square canvases. The targeted offsets keep their heads and defining forms visible.

### Before and after

The [four-state side-by-side comparison](combat-ui-system-1-polish-browser/before-after-comparison.png) pairs the approved baseline with desktop normal, desktop skills, desktop target preview, and mobile normal at matching viewports. The [detail comparison](combat-ui-system-1-polish-browser/before-after-details.png) enlarges the card, skill panel and selected action, turn strip and phase marker, target preview, and mobile card/dock. The [footprint measurements](combat-ui-system-1-polish-browser/footprint-comparison.json) compare visible surface geometry state by state; the goal is no growth in the active rails.

### Polish browser QA and remaining visual limits

The expanded browser harness captures normal, movement, attack, disabled skills, expanded objective, and expanded stats at all four requested sizes. Campaign QA also captures enabled skills, hovered skill, status, ally and enemy preview, invalid target, and boss at each size. At 620×780, both starting allies project beneath the already approved lower-left card when status and aptitude are visible; that QA state repositions the active ally with the existing development helper before capturing a visible, genuine ally target preview. No live layout or camera safe zone was changed to conceal this limitation. The full-body canonical masters also limit facial detail at tiny turn-order sizes; the new framing improves occupancy without inventing pixels. The `w_salvation` gameplay discrepancy described above remains unchanged.

The final [browser QA record](combat-ui-system-1-polish-browser/browser-qa.json) contains **56 captures and 0 errors** at 1440×810, 1366×768, 620×780, and 390×844. It checks document overflow, state visibility, loaded portraits, selected actions, expanded panels, and collisions among the card, dock, skill panel, phase marker, objective, journal, and action preview. The [footprint comparison](combat-ui-system-1-polish-browser/footprint-comparison.json) found **zero width or height increases** among matched visible HUD surfaces. The tactical scene and camera composition were left intact.

### Final validation and guard maintenance

| Check | Result |
| --- | --- |
| Focused HUD, status, portrait, registry, and UI Kit tests | 5 files, 44 passed; [log](combat-ui-system-1-polish-browser/focused-tests.log) |
| Combat regression | 61 files, 1,472 passed; [log](combat-ui-system-1-polish-browser/combat-tests.log) |
| Full Vitest | 151 files, 2,531 passed; [log](combat-ui-system-1-polish-browser/full-vitest.log) |
| TypeScript and production build | `npm run build` passed; [log](combat-ui-system-1-polish-browser/build.log) |
| Browser QA | 56 captures, 0 errors; no matched HUD footprint growth |
| `git diff --check` | Passed |

The `StrategicCharacterVisual.test.ts` guard now checks that the approved presentation renderer receives the runtime's `u.portrait` and emits that exact canonical path, while excluding the strategic combat pose path. The two CIN-6E-A lock guards gained only `src/combat/combatHudPresentation.ts` and `src/combat/combatHudPresentation.test.ts` as exact approved presentation paths; their protected media and gameplay assertions remain intact. No canonical image, production media, combat rule, or encounter file changed in this pass.

Files changed in this polish pass: `src/styles/combat-hud.css`, `src/combat/combatHudPresentation.ts`, `src/combat/combatHudPresentation.test.ts`, `src/combat/StrategicCharacterVisual.test.ts`, `tools/combat-ui-system-1-qa.mjs`, `tools/combat-ui-polish-visual-qa.mjs`, `tools/cinematics/cin6ea_finalization.test.mjs`, `tools/cinematics/cin6ea_preproduction.test.mjs`, this report, and the `combat-ui-system-1-polish-browser/` evidence directory.

## Master visibility / portrait calibration pass

This pass continues `combat-ui-system-1` from `ee43a5252b3e5d8a61399c62175b30f4179af21e`. The runtime still owns every action, value, target, turn, encounter, and camera decision described in the authority audit above. Only the combat presentation registry, CSS, a development-only inspection helper, QA tooling, and this report changed. No canonical portrait PNG, character visual registry, or save record changed.

### Canonical combat portrait census

The [source-derived census](combat-ui-system-1-master-browser/portrait-census.json) unions static `portrait` fields in the combat runtime and recruit catalogue with the combat boss portrait map. It contains **36 distinct currently built-in paths**. Each has an exact `scale`, `x`, and `y` entry in `COMBAT_PORTRAIT_FRAMING`; **zero built-in portraits rely on a family default**. The same canonical runtime `portrait` path is emitted for the card and turn order. Unknown future or campaign-supplied paths retain the existing safe generic family/contain fallback and are not silently mapped to another identity.

| Source | Calibrated identities |
| --- | --- |
| Archive recruits and foes (9) | Aldric, Eldwin, Gunnar, Lyra, Morvan, Seal Guardian, Talon, Troll, Undead Champion |
| Master heroes and boss-map identity (7) | Alaric, Alistair, Archer/Kestrel, Dark Mage, Lancer, Rogue, White Mage |
| Standard enemies and small creatures (14) | Serpent Raider, Serpent Brute, Serpent Oracle, Militia Slinger, Militia Spearman, Wolf, Venom Serpent, Forest Spider, Forest Badger, Marsh Toad, Cave Rat, Wild Boar, Goblin, Skeleton |
| Elite and boss portraits (6) | Serpent Duelist Elite, Serpent Elite Brute, Serpent General Boss, Lion Champion, Forest Troll Elite, Young Dragon Elite |

The [contact sheet V2](combat-ui-system-1-master-browser/portrait-contact-sheet-v2.png) shows identity, canonical source, desktop card, desktop turn, mobile card, mobile turn, and final scale/X/Y for all 36. The four frame sizes are the actual production sizes: **58×62**, **40×40**, **47×55**, and **31×31**. [Sheet 1](combat-ui-system-1-master-browser/portrait-contact-sheet-v2-1.png), [sheet 2](combat-ui-system-1-master-browser/portrait-contact-sheet-v2-2.png), and [sheet 3](combat-ui-system-1-master-browser/portrait-contact-sheet-v2-3.png) are practical visual-review slices. All sources and rendered images decoded. Source review found archive files at 640×768 and master files at 512×512; the crop values account for the archive proportions and the low silhouettes of creatures. Morvan is composed around the hooded face and scythe arc; the dragon crop keeps its crest. The 31 px mobile turn portraits are still limited by source detail.

### Controlled HUD growth

Desktop growth is concentrated in the turn strip and action dock. At 1440×810, the turn strip changes from **437×58 to 491×66** (+12.36% width, +13.79% height); chips are **46×52** with **40×40** portraits. The action dock changes from **376×74 to 426×82** (+13.30% width, +10.81% height); actual action buttons are **78×70**. The active-turn banner receives slightly larger type and a clearer ornament; its content-sized rectangle changes only from 218×26 to 235×27. The card stays **248×169**, the objective **224×52**, the skill menu **338×191**, and the target preview **187×50**. The skill menu rises 7 px to clear the taller dock; the preview rises with the taller top rail, without enlarging. No full-width opaque rail was added.

| 1440×810 surface | Before → after | Width Δ | Height Δ | Viewport area before → after |
| --- | --- | ---: | ---: | ---: |
| Turn order | 437×58 → 491×66 | +12.36% | +13.79% | 2.17% → 2.78% |
| Active banner | 218×26 → 235×27 | +7.80% | +3.85% | 0.49% → 0.54% |
| Unit card | 248×169 → 248×169 | 0% | 0% | 3.59% → 3.59% |
| Action dock | 376×74 → 426×82 | +13.30% | +10.81% | 2.39% → 2.99% |
| Objective | 224×52 → 224×52 | 0% | 0% | 1.00% → 1.00% |
| Skills | 338×191 → 338×191 | 0% | 0% | 5.53% → 5.53% |
| Preview | 187×50 → 187×50 | 0% | 0% | 0.80% → 0.80% |

The [full geometry record](combat-ui-system-1-master-browser/master-geometry.json) contains width, height, relative surface-area changes, and viewport-area percentages for all seven surfaces at all four viewports. Persistent HUD occupancy below is the *union* of visible normal-state panel rectangles, clipped to the viewport. Center obstruction is the area of that union inside the central 50%×50% tactical rectangle, divided by that rectangle's area. These are geometry measurements, not a composite aesthetic score.

| Viewport | Persistent HUD area before → after | Tactical center obstruction before → after |
| --- | ---: | ---: |
| 1440×810 | 11.16% → 12.43% | 0% → 0% |
| 1366×768 | 12.40% → 13.81% | 0% → 0% |
| 620×780 | 30.02% → 30.37% | 3.68% → 3.68% |
| 390×844 | 30.99% → 30.99% | 6.59% → 6.59% |

At 620×780, the turn strip gains 3 px height and slightly larger 32 px portraits; the card remains 220×168 and dock remains 604×74, so the previously documented starting-ally coverage does not increase. At 390×844, outer HUD rectangles remain unchanged, with turn portraits raised only to 31 px within the strip. The 390 action buttons measure 70×60, and 620 buttons 116×64. The contextual help button is hidden while the narrow skill menu is open, removing a visually observed collision over its Back button. Desktop card and dock remain separated; the tactical center stays unobstructed on desktop.

### Browser comparison and QA

Full-screen side-by-side captures compare the exact `ee43a525` baseline with this pass: [desktop normal](combat-ui-system-1-master-browser/before-after-desktop-normal.png), [selected action](combat-ui-system-1-master-browser/before-after-desktop-selected-action.png), [skills](combat-ui-system-1-master-browser/before-after-desktop-skills.png), [target preview](combat-ui-system-1-master-browser/before-after-desktop-target-preview.png), and [mobile normal](combat-ui-system-1-master-browser/before-after-mobile-normal.png). The 1440 desktop comparisons retain source-resolution screenshots; the mobile comparison uses 390×844 captures.

The final [browser QA record](combat-ui-system-1-master-browser/browser-qa.json) has **68 captures and 0 errors** across 1440×810, 1366×768, 620×780, and 390×844. Each width covers normal turn, movement, attack, disabled and enabled skills, hover/selection, ally and enemy target previews, invalid target, status, expanded objective, expanded stats, boss, elite, and small creature. Browser checks cover document overflow, portrait decoding, action selection, mobile touch targets (minimum 44 px), unexpected panel scrolling, and card/dock, card/skill, skill/dock, skill/help, turn/objective, banner/objective, and preview/top-rail collisions. The contact sheet was inspected at production sizes for head and silhouette framing. [620 skills](combat-ui-system-1-master-browser/620x780-campaign-skills-enabled.jpg), [390 elite](combat-ui-system-1-master-browser/390x844-elite.jpg), [390 wolf](combat-ui-system-1-master-browser/390x844-campaign-small-creature.jpg), and [1440 boss portrait](combat-ui-system-1-master-browser/1440x810-boss-portrait.jpg) show the less common states.

The QA-only `inspectPortraitForHudQa` helper selects an existing encounter unit for the card in development QA. It does not create units or change combat truth, and is unavailable in production. The existing `w_salvation` heal-description discrepancy remains untouched. The pre-existing 620 card coverage and limited source detail in tiny turn portraits remain visual caveats for operator review.

### Master pass validation

| Check | Result |
| --- | --- |
| Focused HUD/status/portrait/registry/UI Kit | 5 files, 45 passed; [log](combat-ui-system-1-master-browser/focused-tests.log) |
| Combat regression | 61 files, 1,473 passed; [log](combat-ui-system-1-master-browser/combat-tests.log) |
| Full Vitest | 151 files, 2,532 passed; [log](combat-ui-system-1-master-browser/full-vitest.log) |
| TypeScript and production build | `npm run build` passed; [log](combat-ui-system-1-master-browser/build.log) |
| Browser QA | 68 captures, 0 errors; [record](combat-ui-system-1-master-browser/browser-qa.json) |
| `git diff --check` | Passed |

Files changed in this master pass: `src/combat/combatHudPresentation.ts`, `src/combat/combatHudPresentation.test.ts`, `src/combat/legacyCombatRuntime.js` (development QA helper only), `src/styles/combat-hud.css`, `tools/combat-ui-system-1-qa.mjs`, `tools/combat-ui-master-visual-qa.mjs`, this report, and the `combat-ui-system-1-master-browser/` evidence directory.
