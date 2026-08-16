# R2C-VFX Composer V2.5 — Final Authoring Model

**Date:** 2026-08-16  
**Status:** Complete — all tests pass, build clean, registry validated

---

## Summary

V2.5 replaces the V2.4 choreography-only timing model and preset-wide technical
polish with a **per-slot authoring surface** that gives the artist direct control
over position, travel, direction, phase, and impact feedback — without breaking
any existing V2.4 publication.

### What changed

| V2.4 (before) | V2.5 (after) |
|---|---|
| `choreography` (TOGETHER / SEQUENCE / PAIR_THEN_LAST) controls all timing | **PHASE** per slot (0–15). Choreography buttons become phase presets. |
| `placementProfile` only (AUTO/TARGET/FRONT/BACK/TOP/CASTER/GROUND) | **POSITION** (FIXED/TRAVEL) + **AT** (expanded: +BOTTOM, +CASTER_FRONT, +CASTER_BACK) or **FROM**/**TO** travel endpoints (+SKY) |
| `aimProfile` (FIXED/TO_TARGET) | **DIRECTION** (FIXED/TO_TARGET) for FIXED slots; TRAVEL auto-orients ALONG_PATH |
| `mirrorProfile` AUTO_HORIZONTAL was ambiguous | Explicit `autoMirrorHorizontal` flag in compiled output; resolveSlotMirrorProfile distinguishes authored vs inherited |
| `technicalPolish` (OFF/LIGHT/STRONG) preset-wide | **Per-slot IMPACT FX** (FLASH/SHAKE/HITSTOP + POWER). Legacy polish is inert when any slot has FX. |
| Fingerprint included raw field values | Fingerprint uses **effective (resolved) values** and only contributes V2.5 fields when non-default — V2.4 publications keep their exact stored fingerprint |

### What did NOT change

- The published registry JSON schema version stays at 1.
- All V2.4 fields remain valid; V2.5 fields are purely additive.
- Existing published presets (`basic_greatsword_hit`, `w_break_guard`) keep
  their exact fingerprints and never report "MODIFIED SINCE PUBLISH".
- The composer panel's overall layout (header → visual slots → composition →
  technical polish → primary actions) is unchanged.

---

## New data model

### Slot-level fields (all optional, additive)

```typescript
interface VfxVisualSlot {
  // ... existing V2.4 fields ...
  positionMode?: 'FIXED' | 'TRAVEL';           // default: FIXED
  travelFrom?: VfxTravelEndpoint;               // required when TRAVEL
  travelTo?: VfxTravelEndpoint;                 // required when TRAVEL
  phase?: number;                               // 0..15, default: derived from choreography
  impactFx?: {
    flash?: boolean;
    shake?: boolean;
    hitStop?: boolean;
    power?: 'LIGHT' | 'STRONG';                 // default: LIGHT
  };
}
```

### Travel endpoints

| FROM (origin) | TO (destination) |
|---|---|
| CASTER, CASTER_FRONT, CASTER_BACK | TARGET, FRONT, BACK |
| TARGET, FRONT, BACK, TOP, BOTTOM | TOP, BOTTOM, CASTER |
| GROUND, **SKY** | CASTER_FRONT, CASTER_BACK, GROUND |

SKY is only a FROM endpoint (nothing travels *to* the sky).

### Phase execution

- **Phase 0** = starts at t=0.
- **Phase N** = starts after the **longest** slot in phase N-1 finishes.
- Sparse phases (0, 5, 10) behave identically to dense (0, 1, 2).
- The COMPOSITION buttons (TOGETHER/SEQUENCE/PAIR_THEN_LAST) act as **phase
  presets**. Once any slot has an explicit phase, clicking a preset rewrites
  all phases. Before that, phases are derived from `choreography` and never
  materialized on the slot.

### Impact FX

- Default is **fully OFF**. Nothing is auto-enabled from tier, AP cost,
  Ultimate status, or candidate family.
- Impact time = slot startTime + 45% of slot duration.
- When any slot has active Impact FX, the legacy TECHNICAL POLISH section is
  disabled (buttons greyed out, hint says "Superseded").
- `compileDraft.usesSlotImpactFx` flag tells the runtime which path to use.

---

## Files modified

### Core data model & logic
- `src/combat/vfx/VfxTypes.ts` — added `targetBottom`, `sourceFront`, `sourceBack`, `sky` anchors
- `src/combat/vfx/VfxPresetComposer.ts` — POSITION/TRAVEL, PHASE, Impact FX data model, resolvers, compileDraft, setChoreography phase preset behaviour
- `src/combat/vfx/PublishedVfxRegistry.ts` — additive published slot fields, fingerprint normalization, validator for V2.5 fields
- `src/combat/vfx/VfxSystem.ts` — full anchor resolution (all new anchors), world-space travel, explicit autoMirrorHorizontal, origin stability
- `src/combat/vfx/VfxComposerPlayback.ts` — passes new compiled fields to VfxSystem
- `src/combat/vfx/VfxComposerPlayback.ts` (PublishedVfxResolver) — passes V2.5 fields from published entries

### UI
- `src/combat/vfx/CombatVfxComposerPanel.ts` — new slot card controls (POSITION/AT/FROM/TO/DIRECTION/ROTATE/MIRROR/ORIGIN/PHASE/IMPACT FX), badges, phase-aware timeline, legacy polish disabled when slot FX active

### Tooling
- `tools/vfx/validate-published-registry.mjs` — validates V2.5 fields in published registry

### Tests
- `src/combat/vfx/VfxPlacementTransform.test.ts` — 73 new V2.5 tests (new placements, POSITION/TRAVEL, PHASE, Impact FX, AUTO_HORIZONTAL flag, fingerprint stability, backward compat, compile parity)
- `src/combat/vfx/CombatVfxComposerPanel.test.ts` — 14 new V2.5 UI tests (POSITION, TRAVEL FROM/TO, PHASE stepper, IMPACT FX toggles, legacy polish disable, timeline data attributes)
- `src/combat/vfx/VfxPresetComposer.test.ts` — updated placement profile list assertion

### Test counts
- **Before:** 1331 tests
- **After:** 1418 tests (+87 new)
- **Failures:** 0

---

## Backward compatibility guarantee

1. A V2.4 draft with no V2.5 fields compiles identically to before.
2. A V2.4 published entry validates without modification.
3. The fingerprint of a V2.4 draft is **byte-identical** whether computed by the
   V2.4 or V2.5 code, because V2.5 fields are only contributed when non-default.
4. The legacy TECHNICAL POLISH section remains functional for presets that have
   no per-slot Impact FX.

---

## Root cause addressed

V2.4 had three structural limitations:

1. **Choreography-only timing** — no way to express "slot 2 and 3 start
   together, but after slot 1". V2.5 PHASE solves this.
2. **No travel** — projectiles, beams, and thrown weapons had to fake motion
   with placement + aim. V2.5 TRAVEL with FROM/TO endpoints provides true
   world-space travel.
3. **Preset-wide technical polish** — a 5-slot Ultimate and a 1-slot Basic
   got the same flash/shake/hitstop. V2.5 per-slot Impact FX lets the artist
   put feedback exactly where the impact happens.
