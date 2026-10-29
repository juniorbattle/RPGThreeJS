---
name: ui-accessibility
description: "Use when changing or reviewing RPGThreeJS UI, responsive layout, focus and keyboard navigation, overlays, theme tokens, or reduced motion. Gives the contract invariants, ownership map, reduced-motion model and the viewport and accessibility acceptance recipe."
---

# UI and accessibility

Contract: UI_AND_ACCESSIBILITY (`docs/contracts/UI_AND_ACCESSIBILITY.md`), plus fallback agency from PRESENTATION_AND_MEDIA (`docs/contracts/PRESENTATION_AND_MEDIA.md`).

## Ownership

`src/ui/` (views, `design-system/`, `theme/` tokens, `SceneTransition`, `RefugePresentation`, `CampaignStatusHud`) and `src/styles/` (`app.css`, `poi-map.css`). CSS also lives in `src/ui/theme/*.css`, `src/ui/design-system/campaign-ui.css` and `src/ui/dialogue-alignment.css`: search all of them for a class before editing. This layer is presentation only: status labels and numbers come from runtime truth.

## Invariants

Digest of the contract at set 1.11.0 (baseline `a4ff05b2ced24e26af2e5b15d21b87ead1d24dfa`); the contract text wins on any difference.

- Shared palette: deep navy, brass, warm gold, ivory. Keep the UI compact so the world, tableau or battlefield stays dominant.
- Status text and numbers are read from runtime truth. Never display made-up combat values or resource totals, or an action that is not really enabled.
- At every handoff a single component owns focus, overlays and lifecycle.
- At desktop, intermediate and narrow widths, navigation, choices, status and critical combat controls stay usable. Measure real bounds, clipping, overlap, scrolling and hit targets in the choice, reward, combat, refuge and map states.
- Keyboard operation, a visible focus indicator, meaningful labels and reduced-motion support are required from the first iteration.
- POI map (OD-2026-10-13-D, OD-2026-10-15-A/B): POI roles and states (available, active, resolved, neutralized, locked, reusable refuge) and mobile threats (position, next-turn area, tendency, contested routes) are shown with text as well as colour. Wait and Combat-or-retreat are explicit intents; no modal, gesture, hover, zoom or selection owns movement, reward, branch, threat tick or resolution. Restore safe map focus after cancellation, retreat and combat. Map targets are at least 44px; paths, labels and threat indicators stay separated at 1366x768, 620px and 390x844.
- A media fallback keeps the player's agency and never depends on motion to carry information.
- Sound (OD-2026-10-18-F, OD-2026-10-19-B): default silence, accessible enable, mute and volume, real gesture unlock, preferences outside gameplay saves, no cue on load, reload, restored preference or programmatic focus, and audio failure never blocks agency.
- Music (OD-2026-10-29-B): music volume and mute on every settings surface where music plays, title included, keyboard reachable, labelled, state announced, focus restored. Music is on by default but armed only: nothing sounds before the first real gesture, even with a restored preference; un-muting is a gesture and resumes the current context. Music and ambience never carry information the player needs.

## Reduced motion model

Two sources: the game setting (`state.settings.reducedGraphics`, passed as `reducedMotion` by `GameApp`) and the OS `prefers-reduced-motion`. Either one requests less motion, and an explicit game value of `false` must never switch off the OS request. JavaScript reads this through one shared helper in `src/ui/` rather than ad-hoc `matchMedia` calls. CSS keeps `@media (prefers-reduced-motion: reduce)` blocks in `app.css` and `poi-map.css`. Verify OS-only and game-setting reduction separately in the current native campaign driver. Physical Traversal QA labs were retired under OD-2026-10-15-A.

Historical item8 acceptance remains scoped to its source/proof. Active manual-playtest acceptance includes cast/scene transitions with OS-only reduction and normal game settings; do not certify new transitions using old captures.

## Verify

- Focused: `npx vitest run src/ui` and the touched suites, then `npx tsc --noEmit`.
- Browser: drivers, ports and outputs are in the `qa-evidence` skill. Test desktop (1366x768 for the map), 620x780 and 390x844; keyboard-only paths; visible focus and labels; OS reduce on and off; game setting on and off; failed media loads.
- Read real bounds from the page (`getBoundingClientRect` against the viewport) and inspect the captures.

## Hazards

- A reduced-motion fallback must still expose every choice and outcome.
- Never add UI that decides game state.
- Pass flags in a driver are not a substitute for looking at the captures.

## Hand off

Cast and staging: `narrative-tableau`. Journey, skip, fallback, resume: `cinematics-journey`. Combat animation and VFX readability: `combat-vfx-sprites`. Contract mapping and matrix: `contracts-compliance`. Evidence: `qa-evidence`.

## Return (impact brief)

Contracts read; files and owners affected; invariants at risk (contract section and why); verification required (exact commands); cross-domain handoffs; verdict OK, OK with conditions, or BLOCKED.

## OD-2026-10-03-A transition review

Inspect cast exit/breath/entry continuity, gentle fade/pause/focus alternative, meaningful transition text, dialogue responsive bounds and retained/restored focus. Test normal and OS-only reduced motion at desktop/intermediate/narrow widths. Coordinate grouping/facing/copy with narrative-tableau; do not decide dialogue facts or reopen the historical cinematic identities.
