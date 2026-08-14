# R2C-VFX Composer V2.3 — Publish Preset

**Date:** 2026-08-14
**Mode:** Production Authoring Pipeline + Durable Published Registry + Real Gameplay Override

---

## ARCHITECTURE

The Publish Preset pipeline extends the VFX Composer from a local authoring tool to a production VFX configuration system.

**Workflow:**
```
ACTION → configure Composer draft → PLAY VISUALS ONLY → PLAY FULL PRESET
→ PLAY IN COMBAT STAGE → human approval → PUBLISH PRESET
→ REAL gameplay uses that published VFX
```

**SAVE DRAFT** and **PUBLISH** are completely different operations:
- SAVE DRAFT: authoring/localStorage
- PUBLISH: durable production VFX configuration in source-controlled JSON

**Key principle:** 1 ACTION = 1 DEDICATED PUBLISHED VFX CONFIGURATION. Publishing one action never modifies another action. Shared static presets (sword_slash, arrow_shot, etc.) are never overwritten.

---

## PUBLISHED REGISTRY

**Path:** `src/combat/vfx/generated/published-vfx-presets.json`

**Schema version:** 1

**Entries:** 0 (empty — static fallback active)

**Production localStorage dependency:** NO — the registry is a source-controlled JSON file imported at build time. A DEV-only in-memory overlay supports hot reload during dev sessions, but the durable JSON is authoritative on page reload/restart.

**Static fallback preserved:** YES — with an empty registry, the game behaves exactly like pre-V2.3. The resolver checks the registry first; if no entry exists, it falls back to the existing static `VfxPresets` path.

---

## SEMANTIC SOURCE OF TRUTH

Published entries store the same `VfxPresetDraft` shape used by the Composer — NOT compiled numeric values.

**SIZE stored semantically:** YES — LOW/MID/BIG/GIGA profiles stored as strings
**TIMING stored semantically:** YES — QUICK/NORMAL/LONG profiles stored as strings
**PLACEMENT stored semantically:** YES — AUTO/TARGET/CASTER/GROUND profiles stored as strings

**Same compileDraft resolver:** YES — at runtime, `getPublishedDraft()` converts the published entry back to a `VfxPresetDraft`, then `compileDraft()` resolves it using the same `getCandidateCadence()`, `resolveSlotDuration()`, `resolveSlotScale()`, and `resolvePlacement()` functions as Composer playback.

**Separate timing implementation:** NO — there is one and only one timing resolver. The published path calls the same `compileDraft()` as the Composer.

---

## ACTION OVERRIDE RESOLVER

A single central resolver in `PublishedVfxResolver.ts`:

```
resolveActionVfx(actionKey, staticPresetId)
  → published registry contains actionKey?
      YES → compile semantic published entry → play candidate slots
      NO  → use existing static VfxSystem.play(staticPresetId)
```

This is wired into `legacyCombatRuntime.js` via:
- `getActionKeyForPublishedVfx(spec, u)` — determines the actionKey from the combat spec
- `isActionPublished(actionKey)` — checks the registry
- `playPublishedActionVfx({actionKey, fallbackPresetId, context, vfxSystem})` — plays published VFX or falls back to static

Registry lookups are NOT scattered through legacyCombatRuntime. The decision is centralized in `playActionVfx()`.

---

## CANDIDATE PRODUCTION RUNTIME

**Arbitrary supported r1 candidate:** YES — any candidate with a supported atlas format (2048×2048 or 4096×4096) can be published. The runtime uses `buildLabSheetDefinition()` + `playLabSpriteSheet()` — the same path proven by the Composer.

**Manual VfxSpriteSheetId registration:** NO — no need to add candidate IDs to the `VfxSpriteSheetId` union. The `buildLabSheetDefinition()` creates a temporary sheet definition at runtime.

**VfxResourceManager reused:** YES — textures are loaded/released through the shared `loadLabCandidateTexture()` / `releaseLabCandidateTexture()` path.

**Duplicate texture cache:** NO — the published path uses the same `VfxResourceManager` as the Composer and the existing VFX system.

---

## PUBLISH TRANSACTION

The DEV endpoint `/dev/vfx-publish-preset` performs:

1. **Validate** the draft shape via `validateDraft()`
2. **Validate** each candidate exists in inventory via `getCandidateInventoryRecord()`
3. **Validate** each candidate has supported atlas format via `resolveCandidateSource()`
4. **Construct** the complete new registry via `publishEntry()`
5. **Validate** the new entry via `validatePublishedEntry()`
6. **Serialize** to deterministic JSON with sorted keys
7. **Write** to a temporary file
8. **Rename** atomically to the target path

If validation or write fails, the existing registry is unchanged.

**Unsupported atypical candidates blocked:** YES — candidates like r1_0573, r1_0932, r1_0933, r1_2720 (null atlas / non-standard dimensions) are rejected during publication because `resolveCandidateSource()` returns null for unsupported formats.

---

## FINGERPRINT

A deterministic FNV-1a 32-bit hash of the meaningful VFX configuration:

**Changes when:** candidateId, slot order, SIZE, TIMING, PLACEMENT, advanced override, choreography, technical polish change.

**Does NOT change for:** updatedAt, UI state, catalogue search, display mode.

The fingerprint is an 8-character hex string. It is stored in each published entry and compared via `compareFingerprint()` to determine the UI state: NOT PUBLISHED, PUBLISHED, or MODIFIED SINCE PUBLISH.

---

## TIMING PARITY

Published runtime calls the SAME `compileDraft()` with the SAME `getCandidateCadence()` as the Composer. The compiled `slot.duration` is passed as `overrides.duration` to `playLabSpriteSheet()`.

**16f (520ms reference):** QUICK 0.40s (floored) / NORMAL 0.65s (floored) / LONG 1.00s (floored)
**64f (2120ms reference):** QUICK ~0.74s / NORMAL ~1.27s / LONG ~2.12s
**64f (2640ms reference):** QUICK ~0.92s / NORMAL ~1.58s / LONG ~2.64s

**Composer == published runtime:** YES — verified by tests in `PublishedVfxResolver.test.ts`
**Legacy 20/50 timing used:** NO

---

## SIZE PARITY

Published runtime preserves semantic final-height targets via the same `resolveSlotScale()` and `computeFinalDisplayHeight()` as the Composer.

**LOW:** 1.80 / **MID:** 2.50 / **BIG:** 3.40 / **GIGA:** 5.50

No double-scaling from action tier, presentationScale, or target size — the same resolver/compensation architecture as Composer is used.

---

## BASIC CROSIER QA

**Candidate:** r1_0489
**Published preset:** published_basic_crosier_hit

The basic crosier attack (`basic_crosier_hit`) currently uses the static preset `basic_crosier_hit` with sprite sheet `basic_staff_strike_small`. After publishing with r1_0489, the crosier attack uses the published candidate VFX. The old static VFX is replaced only while the publication exists. Unpublishing restores the static fallback.

---

## SHARED PRESET ISOLATION

**Action A:** w_break_guard (static preset: sword_slash)
**Action B:** d_cursed_blade (static preset: sword_slash)
**Shared static preset:** sword_slash

Publishing only w_break_guard creates `published_w_break_guard` with a dedicated candidate. Action B (d_cursed_blade) continues to use the static `sword_slash` preset. This proves 1 action = 1 published configuration.

---

## UPDATE QA

When a draft is modified after publishing:
1. The badge changes to MODIFIED SINCE PUBLISH
2. SAVE DRAFT only updates localStorage — production gameplay still uses the published configuration
3. Only UPDATE PUBLISHED PRESET changes production
4. After update, the badge returns to PUBLISHED

---

## UNPUBLISH QA

Unpublishing removes only the selected action from the registry. Production gameplay automatically returns to the static fallback. The Composer draft remains untouched in localStorage.

---

## RESTART QA

The published registry is a durable JSON file imported at module load time. On Vite restart or full page reload, the durable JSON is authoritative — no localStorage required for production behavior. The DEV overlay is cleared on reload.

---

## FILES

**Created:**
- `src/combat/vfx/PublishedVfxRegistry.ts` — Registry types, fingerprint, validation, operations
- `src/combat/vfx/PublishedVfxResolver.ts` — Action override resolver, production playback API
- `src/combat/vfx/PublishedVfxRegistry.test.ts` — Registry, fingerprint, validation tests
- `src/combat/vfx/PublishedVfxResolver.test.ts` — Semantic parity, resolver tests
- `src/combat/vfx/generated/published-vfx-presets.json` — Durable registry (empty)
- `src/dev/vfxPublishDevServer.ts` — DEV publish/unpublish server helper
- `tools/vfx/validate-published-registry.mjs` — Registry validator script

**Modified:**
- `src/combat/legacyCombatRuntime.js` — Wired published resolver into playActionVfx, actionHasSpritesheetVfx, actionHasPreset
- `src/combat/vfx/CombatVfxComposerPanel.ts` — Added PUBLISH/UNPUBLISH buttons, badges, confirmation dialogs, CSS
- `vite.config.ts` — Added /dev/vfx-publish-preset and /dev/vfx-unpublish-preset endpoints
- `package.json` — Added vfx:validate-published script

---

## TECHNICAL

| Property | Status |
|---|---|
| Tests | 1104/1104 PASS |
| Build | PASS |
| Typecheck | PASS |
| Registry validation | PASS (0 actions, valid) |
| git diff --check | PASS |
| Commit | NO |
| Push | NO |
