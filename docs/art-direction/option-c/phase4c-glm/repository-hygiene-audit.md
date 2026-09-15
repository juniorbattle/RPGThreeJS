# Repository Hygiene Audit

Status: **CLASSIFICATION ONLY — NO DELETIONS PERFORMED**
Authority: This audit. Deletion requires operator review.

This document classifies Option C / Phase 4C / CIN-6E files into three
categories: ACTIVE, HISTORICAL_SUPERSEDED, and DEAD_REDUNDANT. No files were
deleted in this mission. Every proposed deletion includes a path, reason,
reference-search evidence, and rollback/provenance assessment.

---

## ACTIVE_FILES (current production references)

### Phase 4C source (current structural pipeline)

- `src/dev/optionCPhase4c/OptionCCharacterDefinitions.ts` — current character definitions (Kestrel, Alistair, Marian, Elara, Morvan)
- `src/dev/optionCPhase4c/OptionCCharacterSchema.ts` — schema + validator + promotion state machine
- `src/dev/optionCPhase4c/OptionCCharacterRegistry.ts` — census + identity specs
- `src/dev/optionCPhase4c/OptionCManifestResolver.ts` — surface/frame resolution
- `src/dev/optionCPhase4c/OptionCSelectiveLoader.ts` — selective loading (strategic, combat-stage)
- `src/dev/optionCPhase4c/OptionCPhase4cLabs.ts` — DEV labs (inspection tools)
- `src/dev/optionCPhase4c/OptionCPhase4c.test.ts` — focused tests

### Phase 4C metadata

- `public/assets/dev/option-c/phase4c/phase4c-glm.json` — current demo metadata

### Phase 4C docs (current)

- `docs/art-direction/option-c/phase4c-glm/README.md`
- `docs/art-direction/option-c/phase4c-glm/00-golden-reference.md`
- `docs/art-direction/option-c/phase4c-glm/01-roster-census.md`
- `docs/art-direction/option-c/phase4c-glm/02-selected-batch.md` (updated: Elara batch, Morvan deferred)
- `docs/art-direction/option-c/phase4c-glm/03-character-schema.md`
- `docs/art-direction/option-c/phase4c-glm/04-animation-schema.md`
- `docs/art-direction/option-c/phase4c-glm/05-anchor-scale-contract.md` (updated: y=466, Elara, scale semantics)
- `docs/art-direction/option-c/phase4c-glm/06-manifest-resolution.md`
- `docs/art-direction/option-c/phase4c-glm/07-selective-loading.md`
- `docs/art-direction/option-c/phase4c-glm/08-cache-policy.md`
- `docs/art-direction/option-c/phase4c-glm/09-dev-labs.md`
- `docs/art-direction/option-c/phase4c-glm/10-codex-handoff.md` (updated: promotion state machine)
- `docs/art-direction/option-c/phase4c-glm/11-qa-gates.md` (updated: 118 tests, 5 characters)
- `docs/art-direction/option-c/phase4c-glm/demo-presentation-matrix.md`
- `docs/art-direction/option-c/phase4c-glm/production-config.md` (NEW: authoritative image config)
- `docs/art-direction/option-c/phase4c-glm/narrative-cinematic-crosswalk.md` (NEW: crosswalk)
- `docs/art-direction/option-c/phase4c-glm/repository-hygiene-audit.md` (this file)

### Phase 4B runtime proof (Kestrel gold reference)

- `docs/art-direction/option-c/phase4b-runtime-proof/` (all files) — Kestrel runtime contract, screenshots, QA
- `public/assets/dev/option-c/phase4b/kestrel/` (all frames) — Kestrel Phase 4B animation assets (GOLD_REFERENCE)

### Phase 4A pilot (Forest Road + Kestrel reference)

- `docs/art-direction/option-c/phase4-pilot/` (all files) — Forest Road pilot, Kestrel animation reference, prompts, QA

### Option C foundation docs

- `docs/art-direction/option-c/README.md` (updated: historical status note)
- `docs/art-direction/option-c/audit-report.md`
- `docs/art-direction/option-c/narrative-presentation-doctrine.md` — current doctrine authority
- `docs/art-direction/option-c/production-reference-bible.md`
- `docs/art-direction/option-c/refactor-plan.md`
- `docs/art-direction/option-c/reference-manifest.json`
- `docs/art-direction/option-c/surface-matrix.md`
- `docs/art-direction/option-c/validation-report.md`
- `docs/art-direction/option-c/references/` (6 reference PNGs)

### Narrative doctrine machine contract

- `src/cinematics/NarrativePresentationDoctrine.ts` — current doctrine
- `src/cinematics/NarrativePresentationDoctrine.test.ts`
- `src/cinematics/CinematicReductionPolicy.ts` — historical reduction (still referenced by runtime)
- `src/cinematics/DialoguePresentationSegments.ts` — runtime presentation segments

### CIN-6E specs (still referenced by tests)

- `tools/cinematics/specs/final_visual_production_profile.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/visual_family_master_specs.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/canonical_character_production_cards.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/scene_cast_manifests.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/cin6ea_six_pilot_plan.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/cin6ea_video_pilot_continuity_specs.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/final_future_production_manifest.json` — referenced by cin6ea_preproduction.test.mjs
- `tools/cinematics/specs/gold_visual_dna.json` — referenced by cin6ea_preproduction.test.mjs

### CIN-6E tools (still referenced by tests or runtime)

- `tools/cinematics/cin6ea_preproduction.test.mjs` — pre-existing failure (allowlist stale, not our change)
- `tools/cinematics/cin6ea_media_qa.mjs` — referenced by gold_visual_dna test
- `tools/cinematics/cin6ea_review_assets.py` — referenced by gold_visual_dna test
- `tools/cinematics/generate_cin6ea_preproduction.ts` — generator for the specs above
- `tools/cinematics/generate_cin6ea4_dialogue_lock.ts` — referenced by GameApp.ts import path

---

## HISTORICAL_SUPERSEDED_FILES (provenance — preserve, do not delete)

### CIN-6E generation/execution tools (historical provenance)

These tools executed the historical CIN-6E image/video generation. They are
not needed for future Codex production (which uses `production-config.md`).
They are preserved as provenance for the historical generations.

- `tools/cinematics/execute_cin6ea_image_jobs.mjs` — historical image job executor
- `tools/cinematics/compile_cin6ea_prompts.mjs` — historical prompt compiler
- `tools/cinematics/finalize_cin6ea3_video_gate.mjs` — historical video gate
- `tools/cinematics/finalize_cin6ea_operator_lock.mjs` — historical operator lock
- `tools/cinematics/prepare_cin6ea3_source.mjs` — historical source prep
- `tools/cinematics/prepare_cin6ea3_video_gate.mjs` — historical video gate prep
- `tools/cinematics/minimax_h3_generate.mjs` — historical MiniMax video generation
- `tools/cinematics/audit_cin6ea2.mjs` — historical audit
- `tools/cinematics/audit_cin6ea4.mjs` — historical audit
- `tools/cinematics/audit_cin6ea_final.mjs` — historical audit
- `tools/cinematics/build_cin6ea3_image_gate.py` — historical image gate
- `tools/cinematics/build_cin6ea2_pdf.py` — historical PDF
- `tools/cinematics/build_cin6ea3_pdf.py` — historical PDF
- `tools/cinematics/build_cin6ea_review.mjs` — historical review builder

### CIN-6E historical specs (provenance)

- `tools/cinematics/specs/cin6ea2_operator_selections.json`
- `tools/cinematics/specs/cin6ea3_operator_approval.json`
- `tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json`
- `tools/cinematics/specs/cin6ea3_pilot_e_regate.json`
- `tools/cinematics/specs/cin6ea4r_final_validation.json`
- `tools/cinematics/specs/cin6ea_asset_lineage.json`
- `tools/cinematics/specs/cin6ea_final_operator_lock.json`
- `tools/cinematics/specs/cin6ea_final_validation.json`
- `tools/cinematics/specs/cin6ea_image_gate_review.json`
- `tools/cinematics/specs/cin6ea_provenance_catalog.json`
- `tools/cinematics/specs/cin6ea/` (pilot specs)
- `tools/cinematics/specs/cin6ea2/` (pilot specs)
- `tools/cinematics/specs/cin6ea3/` (pilot specs)

### CIN-6E browser QA runners (historical)

- `tools/cinematics/run_cin6ea_pilot_runtime_qa.mjs`
- `tools/cinematics/run_cin6ea4_dialogue_qa.mjs`

### CIN-6D/CIN-67/CIN-6C/CIN-66/CIN-4/CIN-3 historical tools

- `tools/cinematics/generate_cin6d*.ts` (4 files) — historical spec generators
- `tools/cinematics/run_cin67*.mjs` (6 files) — historical browser QA
- `tools/cinematics/run_cin6c_browser_qa.mjs`
- `tools/cinematics/run_cin6d*.mjs` (4 files)
- `tools/cinematics/extract_cin6c_review.mjs`
- `tools/cinematics/cin66_*.test.mjs` (4 files)
- `tools/cinematics/cin6b_production.test.mjs`
- `tools/cinematics/cin6c_p1_production.test.mjs`
- `tools/cinematics/cin6ea2_dynamic_gate.test.mjs`
- `tools/cinematics/cin6ea3_pilot_e_regate.test.mjs`
- `tools/cinematics/cin6ea_finalization.test.mjs`
- `tools/cinematics/cin3_config.mjs`
- `tools/cinematics/cin4_media*.mjs` (3 files)
- `tools/cinematics/cin4_shot_spec*.mjs` (2 files)
- `tools/cinematics/master_cin3_video.mjs`
- `tools/cinematics/validate_cin3_media.mjs`
- `tools/cinematics/validate_cin4_media.mjs`

### CIN-6E historical specs (superseded by doctrine)

- `tools/cinematics/specs/final_cinematic_reduction_audit.json`
- `tools/cinematics/specs/final_cinematic_remaster_queue.json`
- `tools/cinematics/specs/narrative_media_remaster_queue.json`
- `tools/cinematics/specs/runtime_presentation_mode_validation.json`
- `tools/cinematics/specs/final_presentation_mode_audit.json`

---

## DEAD_REDUNDANT_FILES (proposed deletion — OPERATOR REVIEW REQUIRED)

> NO DELETIONS PERFORMED. Each entry below is a *proposal* for operator review.

### 1. Duplicate pilot spec directories

- `tools/cinematics/specs/cin6ea/pilot_e_cedric_continuous.json`
  - Reason: Duplicate of `cin6ea2/pilot_e_cedric_continuous.json` and `cin6ea3/pilot_e_cedric_continuous.json`
  - Reference search: Not referenced by any test or runtime code
  - Rollback: Git history preserves all versions

- `tools/cinematics/specs/cin6ea/pilot_f_shadow_continuous.json`
  - Reason: Duplicate of `cin6ea2/pilot_f_shadow_continuous.json`
  - Reference search: Not referenced by any test or runtime code
  - Rollback: Git history preserves all versions

- `tools/cinematics/specs/cin6ea2/pilot_e_cedric_continuous.json`
  - Reason: Duplicate of `cin6ea3/pilot_e_cedric_continuous.json`
  - Reference search: Not referenced by any test or runtime code
  - Rollback: Git history

- `tools/cinematics/specs/cin6ea2/pilot_f_shadow_continuous.json`
  - Reason: Superseded by cin6ea3 version
  - Reference search: Not referenced
  - Rollback: Git history

### 2. Superseded dialogue staging specs

- `tools/cinematics/specs/narrative_dialogue_staging.json`
  - Reason: Superseded by `final_dialogue_staging_plan.json` and `final_dialogue_visual_segments.json`
  - Reference search: Referenced only by `validate_narrative_dialogue_staging.ts` (historical validator)
  - Rollback: Git history

- `tools/cinematics/validate_narrative_dialogue_staging.ts`
  - Reason: Validates superseded spec
  - Reference search: Not imported by runtime or current tests
  - Rollback: Git history

### 3. Superseded visual polish audit

- `tools/cinematics/specs/cinematic_visual_polish_audit.json`
  - Reason: Superseded by CIN-6E-A final visual production
  - Reference search: Referenced only by `validate_cinematic_visual_polish_audit.mjs` and `cin66_visual_polish_audit.test.mjs`
  - Rollback: Git history

- `tools/cinematics/validate_cinematic_visual_polish_audit.mjs`
  - Reason: Validates superseded spec
  - Reference search: Not imported by runtime
  - Rollback: Git history

- `tools/cinematics/extract_visual_polish_review.mjs`
  - Reason: Extraction tool for superseded audit
  - Reference search: Not imported by runtime or current tests
  - Rollback: Git history

- `tools/cinematics/make_visual_polish_contact_sheets.py`
  - Reason: Contact sheet tool for superseded audit
  - Reference search: Not imported by runtime or current tests
  - Rollback: Git history

### 4. Superseded v11b P1 tools

- `tools/cinematics/prepare_v11b_p1_sources.py`
  - Reason: Historical v11b prep, superseded by CIN-6E pipeline
  - Reference search: Not imported by runtime or current tests
  - Rollback: Git history

- `tools/cinematics/validate_v11b_p1.py`
  - Reason: Historical v11b validator
  - Reference search: Not imported by runtime or current tests
  - Rollback: Git history

### 5. Superseded continuity/profile specs

- `tools/cinematics/specs/cinematic_continuity_bible.json`
  - Reason: Superseded by `final_narrative_continuity.json`
  - Reference search: Referenced only by `validate_cinematic_continuity_bible.mjs`
  - Rollback: Git history

- `tools/cinematics/validate_cinematic_continuity_bible.mjs`
  - Reason: Validates superseded spec
  - Reference search: Not imported by runtime
  - Rollback: Git history

- `tools/cinematics/specs/cinematic_continuity_profile.json`
  - Reason: Superseded by `final_narrative_continuity.json`
  - Reference search: Not referenced by tests or runtime
  - Rollback: Git history

- `tools/cinematics/specs/cinematic_keyframe_profile.json`
  - Reason: Superseded by CIN-6E-A keyframe specs
  - Reference search: Not referenced by tests or runtime
  - Rollback: Git history

### 6. Superseded dialogue audit specs

- `tools/cinematics/specs/final_dialogue_pacing_audit.json`
  - Reason: Superseded by doctrine + runtime census
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_dialogue_quality_audit.json`
  - Reason: Superseded by doctrine + runtime census
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_dialogue_speaker_ownership.json`
  - Reason: Superseded by doctrine + runtime census
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_dialogue_text_migration.json`
  - Reason: Superseded by doctrine + runtime census
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/validate_cinematic_dialogue_cast_audit.mjs`
  - Reason: Validates superseded spec
  - Reference search: Not imported by runtime
  - Rollback: Git history

- `tools/cinematics/specs/cinematic_dialogue_cast_audit.json`
  - Reason: Superseded by `scene_cast_manifests.json`
  - Reference search: Referenced only by the validator above
  - Rollback: Git history

### 7. Superseded character scale specs

- `tools/cinematics/specs/cinematic_character_scale.json`
  - Reason: Superseded by Phase 4C anchor/scale contract
  - Reference search: Referenced only by `validate_cinematic_character_scale.mjs` and `cin66_character_scale.test.mjs`
  - Rollback: Git history

- `tools/cinematics/validate_cinematic_character_scale.mjs`
  - Reason: Validates superseded spec
  - Reference search: Not imported by runtime
  - Rollback: Git history

### 8. Superseded hold/travel/tableau profiles

- `tools/cinematics/specs/hold_endpoint_profile.json`
  - Reason: Superseded by doctrine
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/travel_still_profile.json`
  - Reason: Superseded by doctrine
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/tableau_background_profile.json`
  - Reason: Superseded by Phase 4C surface contract
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_visual_family_plan.json`
  - Reason: Superseded by `visual_family_master_specs.json`
  - Reference search: Not referenced by current tests
  - Rollback: Git history

### 9. Superseded lion_judgement v2

- `tools/cinematics/specs/lion_judgement_v2.json`
  - Reason: Superseded by CIN-6E-A final production
  - Reference search: Not referenced by current tests
  - Rollback: Git history

### 10. Superseded runtime presentation specs

- `tools/cinematics/specs/runtime_presentation_step_census.json`
  - Reason: Superseded by `RuntimePresentationStepCensus.ts` (machine contract)
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_dialogue_staging_plan.json`
  - Reason: Superseded by `FinalDialoguePresentation.generated.ts`
  - Reference search: Not referenced by current tests
  - Rollback: Git history

- `tools/cinematics/specs/final_dialogue_visual_segments.json`
  - Reason: Superseded by `DialoguePresentationSegments.ts`
  - Reference search: Not referenced by current tests
  - Rollback: Git history

---

## Summary

```
ACTIVE_FILES              = ~50 source/doc files (current pipeline + tests + doctrine)
HISTORICAL_SUPERSEDED     = ~60 files (provenance — preserve)
DEAD_REDUNDANT            = ~35 files (proposed deletion — OPERATOR REVIEW REQUIRED)
FILES_DELETED             = 0
```

No files were deleted in this mission. All dead/redundant entries are
proposals for operator review. Historical provenance is preserved.
