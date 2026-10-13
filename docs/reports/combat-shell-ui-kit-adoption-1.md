# COMBAT-SHELL-UI-KIT-ADOPTION-1

## Baseline and scope

- Branch: `combat-shell-ui-kit-adoption-1`, created directly from `main` at `a62572f7f0889241f7e5d2ec54735dd43e84b0a5`.
- Presentation work covers deployment, campaign victory/defeat, wave completion, status anchoring and initial Essoufflé semantics. The later operator observation also requires large elite/boss presence in tactical combat and Combat Stage.
- No damage, healing, movement, grid, AI, skill cost, initiative, reward, wave, encounter, save, or VFX rules were changed. The Stage camera receives an actor-aware presentation frame only for large actors, as required by the later visual observation.

## Authority audit

| Concern | Existing authority | Work here |
| --- | --- | --- |
| Deployment count, zone, selection, preferred order, Auto, remove/redeploy, start | `deploymentRules.ts` and `legacyCombatRuntime.js` | Existing runtime actions stay in charge; shell helper emits only card/preview markup. |
| Combat turns, AP, statuses and unit lifecycle | `legacyCombatRuntime.js`, `statusPresentation.ts` | A per-unit participation bit refines the derived Essoufflé predicate; AP creation and regeneration remain unchanged. |
| Tactical visual and Stage poses | `CombatPoseRegistry.ts`, `CombatPoseVisual.ts`, `CombatStage.ts` | Reviewed alpha bounds determine status top and large-unit presentation scale. Stage pose geometry receives the same scale; large-actor framing keeps it inside view. |
| Combat result and campaign consequence | `legacyCombatRuntime.js`, `protocol.ts`, `GameApp.ts`, `combatProgress.ts`, `types.ts` | The result card reads runtime rewards, participants and callback; campaign notification still crosses the existing protocol once. |
| Visual language | `combat.css`, `combat-hud.css`, `combatHudPresentation.ts` and campaign UI tokens | `combat-shell.css` uses the shared fonts, brass/ivory/navy palette and portrait framing; approved active HUD layout is untouched. |

## Before and after

| Surface | Baseline | Final presentation |
| --- | --- | --- |
| Deployment | Small full-body roster thumbnails, simple equal-weight actions and a separate-looking selection panel. | Calibrated canonical portrait crops, clear selected/deployed states, a compact combat-stat preview, gold launch action and mobile layout over the live battlefield. |
| Results | One flat text-heavy card, concatenated reward text and little visual distinction between outcomes. | Shared compact result family with objective, truthful reward rows, standing/K.O. company rows, restrained defeat tone, lighter wave variant and a persistent continuation action. |
| Status | Geometric image-canvas top could put an icon far from the visible head. | Registry alpha-visible top when available, deterministic geometric fallback otherwise; normal/large gaps follow current visual scale. |
| Essoufflé | New units with staged AP 0 appeared exhausted before their first activation. | `alive && _hasStartedTurn && ap <= 0`; `beginTurn` marks participation before the unchanged AP regeneration. |
| Elite/boss presence | Authored physical metadata bypassed the legacy 2×2 sprite multiplier, leaving large actors near hero height. | Reviewed alpha-visible height targets 1.85× a hero for elites and 2× for bosses; only visual geometry and Stage poses scale. |

## Deployment and result architecture

`combatShellPresentation.ts` builds escaped, semantic HTML from runtime inputs. `deploymentCard`, `selectUnitData`, `renderDefinitionPanel`, and the existing deployment actions remain runtime-owned. The shared `combatPortraitFraming` registry supplies card and preview crops. The preview displays only current HP and existing combat stats.

`showCombatResult` passes the actual deployed unit states and configured reward object to the shell renderer. Campaign victory and defeat keep `notifyCampaignResult`; wave completion keeps `startNextWave`. The continuation button disables on activation to enforce one callback. The result uses `role="dialog"`, visible focus, actual buttons and a scrollable body when needed.

## Status and participation lifecycle

`statusAnchorPresentation.ts` converts `sourceSizePx` and `alphaBoundsPx` for the active canonical sprite into a visible top in world space, including the sprite's current Y scale and position. Missing or invalid metadata falls back to the full geometric billboard. The normal gap is 0.30 world units, large-unit gap 0.35; the same anchor family is used by boss intent. No per-character Y table was added.

Every `createUnit` starts with `_hasStartedTurn=false` and the existing AP staging of zero. `beginTurn` sets the bit, then performs the existing regeneration. Removed and redeployed units are recreated fresh. Revived units retain their prior participation history. Existing players carried into another wave retain that history; newly spawned wave foes start fresh. World icon and detail tags call the same predicate, while Brisé retains its presentation priority.

## Large-actor Stage framing

`combatPresencePresentation.ts` reads the existing reviewed visual bounds. Tactical sprite and outline geometry are scaled together while grid footprint, root location, rings, stats and authored texture bytes stay unchanged. Stage pose geometry and offsets receive that scale across pose swaps. When a large actor enters Combat Stage, the Stage camera fits the posed geometry with top, bottom and side margins and expands its painted background to cover the resulting responsive frustum. Normal-actor Stage framing and tactical battle camera remain as before. The 390 px deployment camera widens only during deployment, then restores the battle FOV at launch.

## Browser QA

Automated Playwright evidence is in [`combat-shell-ui-kit-adoption-1-browser/`](combat-shell-ui-kit-adoption-1-browser/), with machine-readable [`browser-qa.json`](combat-shell-ui-kit-adoption-1-browser/browser-qa.json). The script captures 1440×810, 1366×768, 620×780 and 390×844 deployment states; desktop/mobile result variants; fresh, participating and exhausted units; Brisé, positive/carousel status; 14 representative silhouette entries; and elite, dragon and lion Stage compositions.

| Measure | Result |
| --- | --- |
| Browser captures / QA errors | 53 / 0 in the final pass. |
| Deployment roster | 300 px desktop, 604 px at 620, 374 px at 390; no document overflow. |
| Unobscured deployment-cell centers | 8 at 1440/1366, 4 at 620, 8 at 390. |
| Result cards | Victory 500 px desktop / 362 px mobile; wave 410 px desktop / 362 px mobile. |
| Status visible gap | 3.64–7.17 px across 14 actors, with no clipped indicator. |
| Tactical large/hero visible-height ratio | Elite 2.07, dragon 2.06, lion 2.25 at 1440. |
| Stage large/hero posed-quad ratio | Dragon 1.65, elite 1.63, lion 1.63; all full quads inside the 1440 frame, dragon also inside the 390 frame. |
| Result messages | Exactly one campaign callback for each victory/defeat continuation case. |

Representative files: [`desktop deployment`](combat-shell-ui-kit-adoption-1-browser/1440x810-deployment-auto-full.jpg), [`mobile deployment`](combat-shell-ui-kit-adoption-1-browser/390x844-deployment-auto-full.jpg), [`victory`](combat-shell-ui-kit-adoption-1-browser/1440x810-result-victory.jpg), [`mobile victory`](combat-shell-ui-kit-adoption-1-browser/390x844-result-victory-rewards-mobile.jpg), [`defeat`](combat-shell-ui-kit-adoption-1-browser/1440x810-result-defeat.jpg), [`wave`](combat-shell-ui-kit-adoption-1-browser/1440x810-result-wave.jpg), [`status contact sheet`](combat-shell-ui-kit-adoption-1-browser/status-anchor-contact-sheet.png), [`fresh AP-0`](combat-shell-ui-kit-adoption-1-browser/1440x810-deployment-auto-full.jpg), [`real Essoufflé`](combat-shell-ui-kit-adoption-1-browser/1440x810-real-exhaustion-ess.jpg), [`dragon tactical`](combat-shell-ui-kit-adoption-1-browser/1440x810-status-dragon.jpg), [`dragon Stage`](combat-shell-ui-kit-adoption-1-browser/1440x810-stage-dragon.jpg), [`dragon Stage mobile`](combat-shell-ui-kit-adoption-1-browser/390x844-stage-dragon.jpg).

## Validation and remaining caveats

- Combat and combat progression regression: 66 files, 1,488 tests passed. TypeScript and the production Vite build passed. The existing large-chunk advisory remains.
- The two cinematic historical guards were given only the exact `src/combat/stage/CombatPoseVisual.ts` path for this authorized Stage pose presentation change. Their fixed baseline and assertions remain unchanged.
- Repository-wide Vitest: 155 files and 2,548 tests passed; one guard test failed. `tools/cinematics/cin6ea_preproduction.test.mjs` flags `src/cinematics/NarrativeUtilityDock.test.ts` against its fixed `57ba69cf718ea630cc9306c4122666fd6b58420f` baseline. The file already differs on `main`, while this branch has no delta for it. This is reported as a known baseline, not claimed green.
- Final handoff is a pushed branch for operator runtime and visual review; no merge.
