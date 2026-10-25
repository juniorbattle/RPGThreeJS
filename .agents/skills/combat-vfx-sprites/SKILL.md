---
name: combat-vfx-sprites
description: "Use when working on or reviewing RPGThreeJS character animation and combat effects: frame or spritesheet animation of actors in tableaux or combat, combat poses and unit motion, Combat Stage choreography, VFX presets, spritesheets, the published-preset registry, the VFX Composer, and combat sound cues tied to resolved events. Covers ownership, the truth boundary, identity and frame rules, reduced motion and verification."
---

# Combat animation, sprites and VFX

Contracts: COMBAT_AND_VFX (truth boundary, Combat Stage and VFX are presentation only, the VFX catalogue is unfinished), WORLD_AND_CHARACTERS (Character System V2 is the visual ceiling, no silent remaster), PRESENTATION_AND_MEDIA (STATIC_TABLEAU, four visible actors) and UI_AND_ACCESSIBILITY (reduced motion, no motion-only information), all in `docs/contracts/`. Sound cues: the bounded combat FX exception OD-2026-10-19-B. Current direction: [OD-2026-10-24-B](../../../docs/autonomy/PLAYABLE_FLOW_SPRITES_VFX_DIRECTION_2026-10-24.md) (dialogue → choice → combat flow, Alistair pilot, then VFX action by action).

## Ownership

- Truth, never changed by this layer: the tactical runtime `src/combat/legacyCombatRuntime.js` (turn order, legality, AP, statuses, damage, defeat, outcome) and its handoff `src/combat/CombatBridge.ts`.
- Combat poses: `src/combat/stage/CombatPoseRegistry.ts` and `CombatPoseVisual.ts` (four poses `prepare`, `dash`, `attack`, `cast`, anchor, scale, fallback); art under `public/assets/characters/pixel/combat/<actor>/`. These are distinct poses, not successive frames of one animation.
- Motion and choreography: `src/combat/unitMotion.ts`, `src/combat/stage/CombatStage.ts`, `combatStageProfiles.ts`, `src/combat/vfx/CasterMotion.ts`.
- VFX runtime: `src/combat/vfx/VfxSystem.ts`, `VfxSpriteSheets.ts`, `VfxActionRegistry.ts`, `VfxPresets.ts`, `VfxResourceManager.ts`, `VfxRuntimeReadiness.ts`, `PublishedVfxResolver.ts` and `PublishedVfxRegistry.ts` over `generated/published-vfx-presets.json` (published overrides; when empty, the base presets apply).
- Composer and lab, development only (`?vfxlab=1`): `CombatVfxComposerPanel.ts`, `CombatVfxLab.ts`, `VfxPresetComposer.ts`, `DemoVfxActionScope.ts`, `DemoVfxWorkload.ts`. Some previews need the external CartoonCoffee pack through `MEGA_PACK_ROOT` in `.env.local`, which is never read or committed by agents.
- Narrative frames: `src/cinematics/NarrativeSceneSurface.ts` owns narrative rendering; masters live under `public/assets/characters/pixel/masters/`.
- Combat sound: `src/combat/CombatAudio.ts` observes resolved events.

## Review checklist

1. Truth boundary: animation, VFX and sound observe a resolved event. They never compute or change damage, AP, statuses, RNG, outcomes, rewards or saves, and gain no write path to truth.
2. Identity: Character V2 masters and promoted poses are the identity authority. Frames keep silhouette, proportions, palette, equipment (for Alistair: sword in hand, rigid armour, helmet, red cape) and game scale. No global remaster; a new candidate stays separate and versioned under `tools/characters/candidates/<actor>-<animation>/<version>/` (for example `alistair-idle/v1/`) with the exact request, source files and their current SHA-256, raw output, processed frames and a comparison with the master.
3. Frames: same frame size and foot anchor, no jitter, sliding or palette drift, no clipped weapon or cape. Check asymmetric hands and accessories against horizontal mirroring.
4. Runtime: an optional animation definition with fallback to the master or pose when an image is missing; images ready before display; one bounded clock rather than a permanent timer per actor; explicit cadence; on-demand loading with a bounded cache; stop when hidden or unmounted and release on dispose; a phase change switches the appearance, even for an actor whose DOM is kept.
5. Reduced motion: OS or game reduction shows a fixed informative image, and a preference change applies at once. No information is carried by motion alone.
6. Agency and rhythm: an animation never advances a line, picks a choice, owns focus or stretches a turn beyond its presentation budget. Tactical movement follows its existing owners.
7. Narrative: at most four visible actors and one surface; composition and relational staging come first, a breathing loop does not replace them.
8. VFX completion: one action or family at a time (contact, projectile, heal, status) according to its real presence in the demo. Check size, anchor, cadence, target and HP readability, the end of the effect and the return of control. Reuse the Composer; no new editor. A missing effect is a documented gap, never a fabricated gameplay effect or an unrelated asset.
9. No video, video-frame extraction, morphing or global remaster (OD-2026-10-24-B); no animation state in V6.
10. Tests check players and boundaries; they do not decide art. Artistic acceptance stays with the operator.

## Verify

- Focused: `npx vitest run src/combat/stage src/combat/vfx src/combat/unitMotion.test.ts src/combat/combatKeyboard.test.ts` plus the touched files; for narrative frames, the `Narrative*` tests named in the `narrative-tableau` skill. Then `npx tsc --noEmit`, `npm run contracts:validate` and `npm run build`.
- Harness tests that slice `legacyCombatRuntime.js` (`combatKeyboard.test.ts`, `unitMotion.test.ts`) must receive every new function the sliced code calls.
- When published presets change: `npm run vfx:validate-published`.
- Browser: one relevant combat continuation with the drivers in the `qa-evidence` skill. Inspect captures at game size with normal and OS-reduced motion, and compare frames with the master.

## Hand off

Narrative staging: `narrative-tableau`. Reduced motion, focus, viewports: `ui-accessibility`. Truth, save or contract impact: `contracts-compliance`. Evidence and drivers: `qa-evidence`.

## Return (impact brief)

Contracts read; files and owners affected; invariants at risk (contract section and why); verification required (exact commands); cross-domain handoffs; verdict OK, OK with conditions, or BLOCKED.
