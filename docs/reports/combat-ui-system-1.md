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
