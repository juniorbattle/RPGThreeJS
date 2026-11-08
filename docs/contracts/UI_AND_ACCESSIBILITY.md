# UI, UX and accessibility

Status: **LOCKED**.

## Post-demo surfaces — OD-2026-11-07-I

Dedicated `PRODUCTION-CONTRACTS-POST-DEMO-FRAMEWORK-1`, set 1.20.0. The post-demo POI maps, the Tournament encounter board, clan relations, supports, waves and boss phases follow the existing rules:
- states in text, never by colour alone;
- keyboard and gamepad paths, and focus;
- 1366 px desktop and 390 px phone layouts;
- reduced motion as an in-app setting.

The encounter board states each fight, its order and its result in text. The deployment states each support and the clan that grants it. The objective states the current wave or phase. The 33-POI display rule and the wave text of earlier sets keep governing the Lion; each post-demo map shows its own approved catalogue. Presentation acquires no truth authority.

## Guardians and challenges — OD-2026-11-07-F

Dedicated `PRODUCTION-CONTRACTS-POI-CHALLENGES-1`, set 1.18.0. The map shows each undefeated guardian on its post as a distinct marker named in text, and marks every challenge place "Défi" with its condition and prime in text, readable without colour. It no longer shows a Wait action, a turn count, a threatened area, a patrol or chase tendency or a contested route. Combat or retreat keeps its intents and focus restoration. The condition and the prime appear before deployment, the round condition stays visible during the fight, and the result says whether the prime was earned. Set 1.19.0 (COMBAT_AND_VFX): the guardian encounter and the deployment state in text that the fight has two waves; during the fight the objective shows the current wave ("Vague 1 / 2") and a text status line announces the second wave, readable without colour, at 1366 and 390 px, with reduced motion on and off. Targets, keyboard, gamepad, responsive bounds and reduced motion follow the rules of this contract.

## Lot E atlas and interception agency — OD-2026-10-15-B

Dedicated `PRODUCTION-CONTRACTS-POI-LOT-E-1`, set 1.4.0, [operator decision](../autonomy/LOT_E_OPERATOR_DECISION_2026-10-15.md). Display 33 fixed POIs and two visually distinct mobile threat overlays from authoritative selectors. Expose actual position, next-turn threatened area, patrol/chase tendency and contested routes with text as well as color. Present explicit Wait and Combat/retreat intents; a modal or gesture never owns movement, reward, branch, threat tick or resolution. Keep chests distinct and show the owner-attributed once-only popup. Restore safe map focus after cancellation, retreat and combat. Set 1.18.0 above supersedes the mobile threat overlays, threatened area, tendency, contested routes and the Wait intent.

Finalize the three Option C compositions after topology: readable approved routes, relief/water crossings, distinct labels and nonoverlapping threat indicators. Preserve targets at least44px, keyboard spatial navigation, modal focus/escape, touch scrolling/pan, 1366x768 /620 /390x844 bounds and independent OS/game reduced motion. No hover, zoom, selection or art state changes game truth. Technical/capture inspection is separate from operator artistic acceptance.

## POI navigation — OD-2026-10-13-D

Dedicated `PRODUCTION-CONTRACTS-POI-NAVIGATION-1` / [OD-2026-10-13-D](../autonomy/POI_NAVIGATION_OPERATOR_DECISION_2026-10-13.md), set 1.2.0: geographical POIs distinguish primary, mystery, combat, elite, chest and refuge when genuinely authored. Show authoritative available/active/resolved/neutralized/locked states and reusable refuges with text as well as visual encoding. Native pointer/keyboard selection, visible focus, usable hit areas and responsive bounds are required. Use sober transitions and reduced motion; no physical movement engine or unnecessary pan. Never enable an intent rejected by canonical accessibility.

Use the shared deep navy, brass, warm gold, and ivory visual family. Keep UI compact and let the world, tableau, or battlefield dominate. Status labels and numbers must come from runtime truth; avoid fabricated combat values, resource totals, or enabled actions. Preserve one owner for focus, overlays, and lifecycle at each handoff.

Responsive layouts must keep navigation, choices, status, and critical combat controls usable at desktop, intermediate, and narrow mobile widths. Verify actual viewport bounds, clipping, overlap, scroll and hit targets, including relevant choice, reward, combat, and refuge states. Keyboard navigation, visible focus, meaningful labels, and reduced motion are production requirements, not late polish. An animated media fallback must preserve agency and avoid motion-dependent information.

## POI V2 interaction — OD-2026-10-15-A

Dedicated `PRODUCTION-CONTRACTS-POI-V2-RETIREMENT-1`, set 1.3.0. Clearly distinguish primary milestones, required secondary structuring nodes and genuinely authored optional categories, independently of resolved/neutralized/current/locked state. Show detail on focus, hover or touch without losing critical information. Keep paths visible and labels separated at 1366×768, 620px and 390px. Native keyboard/touch targets are at least44px, focus is visible, and map scrolling/panning is controllable. OS or game reduction independently requests reduced motion. No presentation gesture grants movement, content resolution or access rejected by RunSystem.

## Preserved cast and transition readability — OD-2026-10-03-A

Dedicated amendment `PRODUCTION-CONTRACTS-MANUAL-PLAYTEST-1`: verify short cast exit/breath/entry continuity, meaningful transition copy, responsive dialogue and focus retention/restoration. OS reduced motion and game reduction each request the reduced-motion alternative; explicit game false cannot suppress the OS. Use gentle fade/pause/focus continuity without large displacement, retain all dialogue/choices and avoid motion-dependent information. Production/browser evidence must include desktop, intermediate and narrow viewports with normal and OS-only reduced motion.


## Bounded UI FX exception — OD-2026-10-18-F

Dedicated `PRODUCTION-CONTRACTS-UI-FX-1`, set1.6.0, [operator execution approval](../autonomy/UI_FX_INTEGRATION_OPERATOR_DECISION_2026-10-18.md), supersedes the general audio deferral solely for the eight operator-accepted UI FX files and audited native events. No global narrative/cinematic/PC acceptance is implied. Music, voices, ambience, combat-iframe sounds and cinematic/video audio remain DEFERRED. Default disabled; explicit accessible enable/mute and volume, real gesture unlock, preferences separate from GameState/V6/video mute. No sound on load/reload/restored preference/programmatic focus. One bounded cue per actual native action with keyboard/pointer deduplication, bounded voices/rate and hidden/disposed cleanup. Optional audio failure never blocks agency or writes gameplay truth. Only actual node changes emit travel-start; autosaves, repeated reward renders and failed/no-op actions do not emit success.


## Bounded combat FX exception — OD-2026-10-19-B

Dedicated PRODUCTION-CONTRACTS-COMBAT-FX-1, set1.7.0, [operator execution approval](../autonomy/COMBAT_FX_OPERATOR_DECISION_2026-10-19.md), extends OD-2026-10-18-F solely to audited tactical/remaining UI intentions, shared combat sound settings and the16short nonverbal combat families named in that decision. New files remain candidates pending operator artistic acceptance. Music, voices, ambience, Ultimates and cinematic/video audio remain deferred. One parent audio owner/mute/volume/preference outside V6, default off, real trusted gesture observed directly in current same-origin iframe (never MessageEvent.isTrusted), current frame/origin/session/allowlist validation and bounded identity deduplication. Sounds observe resolved truth and never recalculate RNG/damage/AP/status/outcomes or change resources/save. No cue on init/load/reload/preference/focus or failed/no-op success. Maximum4voices total/2UI, priority result/KO/critical, steps at least120ms apart and bounded UI cadence, maximum1second decoded combat asset, no delayed queue. Session close detaches gestures and stops voices; true hidden stops/suspends; unavailable audio fails silently without blocking agency. Existing unresolved native hidden/suspend evidence remains open until truly observed. Dedicated reviewed amendment baseline precedes runtime; targeted tests and one earned native campaign continuation use existing tooling; artistic/hardware/global acceptance stays separate.

## Music controls — OD-2026-10-29-B

Dedicated `PRODUCTION-CONTRACTS-MUSIC-AUDIO-1`, set 1.11.0, [operator decision](../autonomy/MUSIC_AUDIO_OPERATOR_DECISION_2026-10-29.md). For this scope only, it supersedes the music and ambience deferrals and the "locked and stable" audio precondition stated in this contract, including in its UI FX and combat FX sections.

Every settings surface where music can play, including the title, the campaign settings and the combat settings, exposes music volume and mute next to the existing effects controls. These controls are keyboard reachable, labelled, announce their state and restore focus. Changing a preference never starts an effects cue by itself; un-muting music is itself a real gesture and resumes the current context's music. Music and ambience never carry information the player needs: every moment they accompany keeps its visual equivalent.

## Effects default — OD-2026-11-01-B

Dedicated `PRODUCTION-CONTRACTS-AUDIO-DIRECTION-1`, set 1.12.0, [operator decision](../autonomy/AUDIO_DIRECTION_OPERATOR_DECISION_2026-11-01.md). For this scope only, it supersedes the effects default-off, default-disabled, default-silence and voluntary-enable wording of the UI FX and combat FX sections of this contract. Effects are on by default, and every settings surface shows and announces the real state, with the same labelled, keyboard-reachable controls and restored focus. Turning them off is remembered outside V6. Audio still carries no information the player needs: every moment keeps its visual equivalent. The listening lab exists only when `import.meta.env.DEV` is true, with no second live AudioContext in a player build.
