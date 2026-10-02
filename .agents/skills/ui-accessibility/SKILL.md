---
name: ui-accessibility
description: "Use when changing or reviewing RPGThreeJS UI, responsive layout, focus and keyboard navigation, overlays, theme tokens, or reduced motion. Gives the contract invariants, ownership map, reduced-motion model and the viewport and accessibility acceptance recipe."
---

# UI and accessibility

Contract: UI_AND_ACCESSIBILITY (`docs/contracts/UI_AND_ACCESSIBILITY.md`), plus fallback agency from PRESENTATION_AND_MEDIA (`docs/contracts/PRESENTATION_AND_MEDIA.md`).

## Ownership

`src/ui/` (views, `design-system/`, `theme/` tokens, `SceneTransition`, `RefugePresentation`, `CampaignStatusHud`) and `src/styles/` (`app.css`, `traversal.css`). CSS also lives in `src/ui/theme/*.css`, `src/ui/design-system/campaign-ui.css` and `src/ui/dialogue-alignment.css`: search all of them for a class before editing. This layer is presentation only: status labels and numbers come from runtime truth.

## Invariants

Digest of the contract as of commit `b1e8858`; the contract text wins on any difference.

- Shared palette: deep navy, brass, warm gold, ivory. Keep the UI compact so the world, tableau or battlefield stays dominant.
- Status text and numbers are read from runtime truth. Never display made-up combat values or resource totals, or an action that is not really enabled.
- At every handoff a single component owns focus, overlays and lifecycle.
- At desktop, intermediate and narrow widths, navigation, choices, status and critical combat controls stay usable. Measure real bounds, clipping, overlap, scrolling and hit targets in the choice, reward, combat and refuge states.
- Keyboard operation, a visible focus indicator, meaningful labels and reduced-motion support are required from the first iteration.
- A media fallback keeps the player's agency and never depends on motion to carry information.
## Reduced motion model

Two sources: the game setting (`state.settings.reducedGraphics`, passed as `reducedMotion` by `GameApp`) and the OS `prefers-reduced-motion`. Either one requests less motion, and an explicit game value of `false` must never switch off the OS request. JavaScript reads this through one shared helper in `src/ui/` rather than ad-hoc `matchMedia` calls. CSS keeps `@media (prefers-reduced-motion: reduce)` blocks in `app.css` and `traversal.css`. The QA-lab scenarios in `GameApp` pass an explicit `reducedMotion: false`: account for that when testing OS-only reduction.

Active acceptance (queue item 8): OS-only reduced motion with normal graphics settings, through the eight slots, retained choices and save/resume.

## Verify

- Focused: `npx vitest run src/ui` and the touched suites, then `npx tsc --noEmit`.
- Browser: drivers, ports and outputs are in the `qa-evidence` skill. Test desktop, 620x780 and 390x844; keyboard-only paths; visible focus and labels; OS reduce on and off; game setting on and off; failed media loads.
- Read real bounds from the page (`getBoundingClientRect` against the viewport) and inspect the captures.

## Hazards

- A reduced-motion fallback must still expose every choice and outcome.
- Never add UI that decides game state.
- Pass flags in a driver are not a substitute for looking at the captures.

## Hand off

Cast and staging: `narrative-tableau`. Video, skip, fallback, resume: `cinematics-journey`. Contract mapping and matrix: `contracts-compliance`. Evidence: `qa-evidence`.

## Return (impact brief)

Contracts read; files and owners affected; invariants at risk (contract section and why); verification required (exact commands); cross-domain handoffs; verdict OK, OK with conditions, or BLOCKED.
