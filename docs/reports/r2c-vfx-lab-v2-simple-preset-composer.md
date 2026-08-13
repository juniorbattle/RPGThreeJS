# R2C-VFX LAB V2 — Simple Preset Composer

**Date:** 2026-08-13
**Mission:** Transform the Combat VFX Lab into a Simple Preset Composer
**Status:** COMPLETE

---

## 1. Old workflow

Low-level numeric QA calibration, per action-step.

The author was asked to hand-tune **eleven** numeric fields per spritesheet:

`scale` · `duration` · `opacity` · `fadeIn` · `fadeOut` · `offsetX` · `offsetY` · `anchor` · `layer` · `blending` · `direction` · `startTime`

Mental model: **USE AS QA SOURCE → tune 11 fields → VALIDATE → APPLY → VERIFY**.

### Demonstrated failures

- Animations perceived only as **flashes**
- Spritesheets **effectively invisible** once every runtime multiplier stacked
- `fadeOut` semantics misread as a duration when it is a **normalized progress position**
- Timing **compressed too aggressively** against native cadence
- `scale` required repeated manual tuning **per action and per AP tier**
- Visual spritesheet count treated as **immutable** — changes required TypeScript edits
- Technical effects (`screenFlash` / `screenShake` / `hitStop`) were **indistinguishable** from the actual spritesheet during review

---

## 2. New workflow

**AUTHOR WITH SEMANTICS. RESOLVE TO NUMERIC VALUES INTERNALLY.**

| Layer | Configuration |
|-------|--------------|
| **User-facing** | SIZE · TIMING · PLACEMENT · CHOREOGRAPHY · TECHNICAL POLISH |
| **Runtime-facing** | scale · duration · fadeIn · fadeOut · opacity · anchor · layer · blending · orientation · startTime |

The author normally **never** touches the second group.

### Steps

1. Select action / skill
2. Its dedicated preset opens automatically (migrated on first open)
3. Visual spritesheets appear as **slot cards**
4. ADD / REMOVE / REPLACE / MOVE UP / MOVE DOWN from the CartoonCoffee library
5. Choose **SIZE**, **TIMING**, **PLACEMENT** per slot
6. Choose **COMPOSITION**
7. Choose **TECHNICAL POLISH**
8. **PLAY VISUALS ONLY**
9. **PLAY FULL PRESET**
10. **SAVE DRAFT**

### Doctrine

```
1 action  =  1 dedicated VFX preset
1 preset  =  0..N visual CartoonCoffee spritesheets  +  optional technical polish
```

The previous "visual structure is immutable" doctrine is **retired** for the Composer. Slot count is editable without touching TypeScript.

---

## 3. New draft schema

```ts
interface VfxPresetDraft {
  actionKey: string;
  presetId: string;
  visualSlots: VfxVisualSlot[];
  choreography: 'TOGETHER' | 'SEQUENCE' | 'PAIR_THEN_LAST';
  technicalPolish: 'AUTO' | 'OFF' | 'LIGHT' | 'STRONG';
  autoPlacement?: 'TARGET' | 'CASTER' | 'GROUND';   // derived hint for PLACEMENT=AUTO
  tier?: number;                                     // drives TECHNICAL POLISH=AUTO
  updatedAt?: number;
}

interface VfxVisualSlot {
  id: string;
  candidateId: string;
  sizeProfile: 'LOW' | 'MID' | 'BIG';
  timingProfile: 'QUICK' | 'NORMAL' | 'LONG';
  placementProfile: 'AUTO' | 'TARGET' | 'CASTER' | 'GROUND';
  advanced?: VfxSlotAdvancedOverride;   // exceptional cases only
}
```

No large collection of arbitrary numeric QA overrides is used as the primary authoring representation.

---

## 4. Size profile resolver

### The problem: multiplier stacking

Read from `@/Users/miche/Documents/Projects/RPGThreeJS/src/combat/vfx/VfxSystem.ts:485-490`:

```
finalHeight = stepScale
            × slotScale
            × intensity                  clamp(context.intensity, 0.35, 1.8)
            × reducedFactor              0.94 or 1
            × contextPresentationScale   staticScaleMultiplier × clamp(presentationScale, 0.55, 1.45)
            × targetSizeMultiplier       1.0 or 1.3
```

Authoring a raw `scale` therefore produced a **different visible size on every AP tier** — the root cause of the repeated manual tuning.

### The solution: compensating resolver

```
slotScale = targetHeight / (stepScale × intensity × reducedFactor × contextPresentationScale × targetSizeMultiplier)
```

| Profile | Target final displayed height |
|---------|------------------------------|
| **LOW** | 1.55 |
| **MID** | 2.20 |
| **BIG** | 3.00 |

**LOW = 1.55** is the exact value the user accepted as readable during P0.1B on the basic tier. LOW is therefore *clearly visible by construction* and can never mean "tiny".

### Verified predictability

Identical final height for LOW/MID/BIG across every tier presentation scale — basic (1.00), 2ap (1.05), 3ap (1.12), 4ap (1.30), 5ap_ultimate (1.55). Intensity, large-target multiplier, preset step scale and reducedGraphics are each independently divided out.

---

## 5. Timing profile resolver

Timing derives from **native candidate cadence**, never fixed AP duration constants:

```
nativeDuration = frameCount × frameDurationMs / 1000
```

| Profile | Multiplier | Meaning |
|---------|-----------|---------|
| **QUICK** | 1.00× | native readable cadence |
| **NORMAL** | 1.30× | native cadence with added readability |
| **LONG** | 1.75× | deliberately emphasised / dramatic |

**NORMAL = 1.30×** is grounded in the P0.1B human calibration: a 1.28s native source was accepted at **1.60s and 1.70s** (1.25×–1.33×).

| Source | native | QUICK | NORMAL | LONG |
|--------|--------|-------|--------|------|
| 4096px, 64f @ 20ms | 1.28s | 1.28s | 1.664s | 2.24s |
| 2048px, 16f @ 50ms | 0.80s | 0.80s | 1.04s | 1.40s |

The authored frame sequence is always preserved — only cadence is stretched. No source frames are modified or duplicated.

---

## 6. Visibility defaults

Fade controls are **not exposed** in the standard UI.

| Setting | Value |
|---------|-------|
| opacity | 1.0 |
| fadeIn | 0.02 |
| fadeOut (QUICK) | 0.88 |
| fadeOut (NORMAL) | 0.90 |
| fadeOut (LONG) | 0.92 |
| minimum safe fadeOut | 0.85 |

`fadeOut` is the normalized progress position where the fade **begins** (`spriteSheetEnvelope`), so higher = later = more visible. A1-style early values (0.08 / 0.10 / 0.18) **cannot** be produced by the resolver.

---

## 7. Placement resolver

| Profile | anchor | layer | orientation |
|---------|--------|-------|-------------|
| **TARGET** | `target` | impact | `face_target` |
| **CASTER** | `source` | impact | `none` |
| **GROUND** | `groundTarget` | ground | `center_on_aoe_origin` |
| **AUTO** | derived from the action's already-authored anchors/layer; defaults to TARGET | | |

Manual offsets never appear in the normal Composer UI.

---

## 8. Choreography resolver

The user **never enters startTime**. The Composer computes every start time.

| Template | Behaviour |
|----------|-----------|
| **TOGETHER** | All slots start at 0 |
| **SEQUENCE** | Cumulative — slot N starts when slot N−1 ends |
| **PAIR_THEN_LAST** | Slots 1+2 start at 0; remaining slots follow after `max(d1, d2)` |

Three slots of 1.664s each:

| Template | start times |
|----------|-------------|
| TOGETHER | `[0, 0, 0]` |
| SEQUENCE | `[0, 1.664, 3.328]` |
| PAIR_THEN_LAST | `[0, 0, 1.664]` |

`PAIR_THEN_LAST` requires ≥ 3 slots. Below that it is **disabled with a clear explanation** in the button tooltip and an inline warning.

**Extensibility:** all start times come from one pure function keyed on the template, so new templates can be added without touching compilation or playback. No speculative complexity was added now.

---

## 9. Technical polish separation

Technical effects are **not** visual slots and never appear in the spritesheet list.

| Level | Behaviour |
|-------|-----------|
| **OFF** | no effects |
| **LIGHT** | flash 0.16 · shake 0.10 · hitStop 0.04 |
| **STRONG** | flash 0.30 · shake 0.22 · hitStop 0.08 |
| **AUTO** | tier 1–3 → LIGHT, tier 4+ → STRONG |

Exact values remain internal.

### The critical debugging feature

| Button | Compilation | Guarantee |
|--------|------------|-----------|
| **PLAY VISUALS ONLY** | `includeTechnical: false` | technical array is **always empty** |
| **PLAY FULL PRESET** | `includeTechnical: true` | visual slots + technical polish |

Visual slots are **byte-identical** between the two modes, so any difference observed on screen is attributable solely to technical polish.

`n_dark_bolt` verified in-browser:

```
PLAY VISUALS ONLY  -> Played visuals only: 1 slot(s), 0 technical effects
PLAY FULL PRESET   -> Played full preset: 1 slot(s), 3 technical effect(s)
```

---

## 10. Migration strategy

`createDraftFromAction(MigrationSource)` seeds a draft from an existing action.

Candidate source priority:
1. Existing QA candidate (`getQaSourceId`)
2. Preset step `sourceCandidateId`
3. Production `spriteSheetId`

**Preserved, nothing deleted:** candidate selections · A1/A1.3 reports · P0 checkpoints · production mappings · validated/production infrastructure.

**Source selection is now manual.** Seeded candidates are *not* locked — every slot offers REMOVE and REPLACE.

### Unplayable-source handling

A migrated slot may reference a legacy production sheet id that is not a CartoonCoffee inventory candidate (e.g. `basic_greatsword_cleave_heavy`). Rather than silently rendering nothing, such a slot is flagged:

- on the card: **NOT A CARTOONCOFFEE SOURCE — REPLACE TO PREVIEW**
- above the preview buttons: a warning naming the affected candidates

This makes REPLACE the obvious next action, exactly as the acceptance case requires.

---

## 11. Durable state

```
portable JSON bundle
        ↓  explicit import
in-memory draft store
        ↓  SAVE DRAFT
localStorage cache for THAT browser
```

localStorage is a **cache**, never the only durable source.

- **Key:** `r2c-vfx-composer-drafts` — isolated from the legacy `r2c-combat-vfx-lab-state`
- **Operations:** SAVE DRAFT · EXPORT DRAFTS · IMPORT DRAFTS
- **Bundle:** `{ schemaVersion: 1, createdAt, drafts: Record<actionKey, VfxPresetDraft> }`
- **Resilience:** invalid individual drafts are skipped, not fatal; corrupt store data degrades to empty

---

## 12. UI layout

```
ACTION SELECT  /  PRESET ID
VISUAL SPRITESHEETS      slot cards  +  + ADD SPRITESHEET
COMPOSITION              TOGETHER | SEQUENCE | PAIR THEN LAST
TECHNICAL POLISH         AUTO | OFF | LIGHT | STRONG
PLAY VISUALS ONLY  |  PLAY FULL PRESET  |  SAVE DRAFT
ADVANCED / DEBUG         (collapsed)
```

Each slot card shows: slot number · candidateId · GIF preview · source filename · SIZE · TIMING · PLACEMENT · REMOVE · REPLACE · MOVE UP · MOVE DOWN.

The computed choreography timeline is displayed **read-only** — there is no startTime input.

### Removed from the normal mental model

work queue CONFIGURE/APPLY/VERIFY · artistic/production lifecycle · fingerprints · validated snapshots · raw presentation numeric matrix · manual startTime · manual fade · manual opacity · manual offsets · manual blending · manual layer

All of it **still exists** in `CombatVfxLabWorkbench` under SYSTEM / DEBUG TOOLS. No production safety infrastructure was destroyed.

---

## 13. Renderer invariants preserved

The VFX renderer was **not** rewritten. Playback goes through the existing, unmodified `VfxSystem.playLabSpriteSheet`.

Preserved: CartoonCoffee native source · `VfxResourceManager` reference counting · frame UV handling · half-texel inset · flipY behavior · texture filtering · bottom pivot · Combat Stage · Tactical gameplay routes.

---

## 14. Test results

**1881 / 1881 passing.** 124 new tests across two files.

| Area | Tests |
|------|-------|
| Semantic LOW/MID/BIG resolver (incl. predictable size across all 5 AP tiers, no double scaling) | 1–9 |
| Native timing profiles | 10–16 |
| Visibility defaults | 17–20 |
| Placement profiles | 21–26 |
| ADD / REMOVE / REORDER / REPLACE | 27–34 |
| TOGETHER | 35–37 |
| SEQUENCE | 38–40 |
| PAIR_THEN_LAST | 41–47 |
| Technical polish separation | 48–53 |
| Visual-only vs full playback | 54–57 |
| Compilation + ADVANCED overrides | 58–61 |
| Draft serialization / restore | 62–69 |
| Durable + portable store (incl. fresh-profile) | 70–76 |
| Migration | 77–81 |
| Production unchanged | 82–85 |
| Composer panel UI | panel 1–39 |

---

## 15. Manual browser QA

**URL:** `http://localhost:5173/legacy-combat.html?campaign=1&qa=1&vfxlab=1`
**Tool:** Playwright persistent contexts — plus a genuinely **fresh** second profile for portability.

| Step | Result |
|------|--------|
| 1–3 · select HERO action, preset opens, slots shown | **PASS** |
| 4 · remove one slot | **PASS** |
| 5 · add a CartoonCoffee candidate from catalogue | **PASS** |
| 6 · SIZE=MID, TIMING=NORMAL, PLACEMENT=TARGET | **PASS** |
| 7 · add a second candidate | **PASS** |
| 8 · choose TOGETHER | **PASS** |
| 9 · PLAY VISUALS ONLY | **PASS** |
| 10 · change to SEQUENCE | **PASS** |
| 11 · PLAY VISUALS ONLY | **PASS** |
| 12 · three-slot PAIR_THEN_LAST — first two together, third after | **PASS** |
| 13–14 · reload, draft state remains | **PASS** |
| 15–16 · export/import into a fresh browser context, same composition | **PASS** |

### Observed values

```
TOGETHER        start times  [0, 0]
SEQUENCE        start times  [0, 1.664]
PAIR_THEN_LAST  start times  [0, 0, 1.664]

PLAY VISUALS ONLY  ->  Played visuals only: 3 slot(s), 0 technical effects
PLAY FULL PRESET   ->  Played full preset: 3 slot(s), 3 technical effect(s)

fresh profile before import  ->  EMPTY
fresh profile after import   ->  3 slots · PAIR THEN LAST · STRONG · [0, 0, 1.664]
```

Screenshots: `docs/reports/r2c-vfx-lab-v2-composer.png`, `docs/reports/r2c-vfx-lab-v2-composer-fresh-profile.png`

---

## 16. Scope compliance

| Constraint | Status |
|-----------|--------|
| P0.2 started | **NO** |
| Global recalibration run | **NO** |
| All 64 HERO slots rewritten | **NO** |
| basic_greatsword_hit numerically rescued | **NO** (used only as a UX case) |
| n_dark_bolt numerically rescued | **NO** (used only as a UX case) |
| Validated | **0** |
| Applied | **0** |
| Verified | **0** |
| Production presets modified | **0** |
| Production sprite sheets registered | **0** |
| Gameplay modified | **NO** |
| Committed | **NO** |
| Pushed | **NO** |

---

## 17. Files

### New

- `src/combat/vfx/VfxPresetComposer.ts` — data model, resolvers, slot ops, choreography, compilation, serialization, migration
- `src/combat/vfx/VfxComposerPlayback.ts` — draft store, portability, cadence lookup, visual-only vs full playback
- `src/combat/vfx/CombatVfxComposerPanel.ts` — the Composer UI
- `src/combat/vfx/VfxPresetComposer.test.ts` — 85 tests
- `src/combat/vfx/CombatVfxComposerPanel.test.ts` — 39 tests

### Modified

- `src/combat/legacyCombatRuntime.js` — install + dispose the Composer panel alongside the legacy Lab

---

## 18. Technical

| Check | Result |
|-------|--------|
| Tests | **1881 / 1881 PASS** |
| Build | **PASS** |
| Typecheck (`tsc --noEmit`) | **PASS** |
| `git diff --check` | **PASS** |
| Commit | **NO** |
| Push | **NO** |

---

## FINAL GATES

| Gate | Status |
|------|--------|
| R2C_VFX_COMPOSER_SIMPLE_ACTION_PRESET_FLOW | **YES** |
| R2C_VFX_COMPOSER_ADD_REMOVE_SPRITESHEET | **YES** |
| R2C_VFX_COMPOSER_REORDER_SPRITESHEET | **YES** |
| R2C_VFX_COMPOSER_SIZE_PROFILES | **YES** |
| R2C_VFX_COMPOSER_TIMING_PROFILES | **YES** |
| R2C_VFX_COMPOSER_TOGETHER | **YES** |
| R2C_VFX_COMPOSER_SEQUENCE | **YES** |
| R2C_VFX_COMPOSER_PAIR_THEN_LAST | **YES** |
| R2C_VFX_COMPOSER_VISUAL_ONLY_PLAYBACK | **YES** |
| R2C_VFX_COMPOSER_FULL_PLAYBACK | **YES** |
| R2C_VFX_COMPOSER_PORTABLE_DRAFT | **YES** |
| R2C_VFX_PRODUCTION_UNCHANGED | **YES** |
