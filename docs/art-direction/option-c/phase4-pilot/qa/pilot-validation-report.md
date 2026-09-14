# Option C Phase 4A — Forest Road + Kestrel pilot validation

## Baseline

- Branch: `main`
- Authorized baseline: `8265b071ea28569562017d621fbe1f124e0d0995`
- Option C phases 1–3: `LOCKED`
- Dynamic presentation coverage at authorization: `270/270`
- P0: `CLOSED`
- Phase 4A pilot status: `APPROVED_DEV_PILOT`
- Operator decision date: `2026-09-13`

## Worktree scope

All Phase 4A work is isolated under `docs/art-direction/option-c/phase4-pilot/`. No tracked runtime or production asset file is changed. No live manifest is updated. The per-file classification and SHA-256 evidence are in `manifests/pilot-manifest.json` and `manifests/pilot-manifest.sha256`. Binary assets use raw-byte SHA-256; text files use SHA-256 after LF normalization so Windows CRLF checkout conversion does not create false integrity failures.

Classifications used:

- `ACCEPTED_DEV_CANDIDATE`: usable for operator evaluation, never production-approved.
- `REVISE`: retained but below the current pilot threshold.
- `REJECTED`: intentionally retained failure/history evidence and never used downstream.
- `SUPPORT_FILE`: prompt, QA, preview, report, metadata or deterministic tooling evidence.

## Generation model provenance

- Generator actually observed: `OpenAI built-in image_gen tool`
- Exact model identifier: `UNKNOWN`
- PNG metadata: no model or textual provenance chunks exposed.
- Tool response: no exact model identifier exposed.
- Policy: no GPT-Image-2.5 or variant name is inferred from intent.
- Operator flag: exact backend model provenance remains unavailable and should be considered during approval.

The manifest records the exact generator artifact ID, prompt file, reference inputs, filesystem timestamp, dimensions and SHA-256 for every ImageGen output. Deterministic Playwright composites are recorded separately with model provenance `NOT_APPLICABLE`.

## Canonical Kestrel source

- Path: `public/assets/characters/pixel/full/kestrel.png`
- Dimensions: `640×768`
- SHA-256: `e948beb899eef71940aec200c3747e098a2c2f980ba16ec5e6e15b2ae5a700ec`
- Hash check: `PASS`
- Identity sheet: `characters/kestrel-identity-sheet.md`

Canonical hood, closed mask, no-visible-skin rule, recurved bow, quiver, crossed harness and green/bronze ranger palette are preserved. Canonical identity remains above every generated reference.

## Forest Road master

- Artifact: `masters/forest-road-visual-master-dev.png`
- Status: `DEV_CANDIDATE`
- Dimensions: `1672×941`
- Authority: single environmental master for all four variants.
- Shared identifiers: left carved waystone/ruin, right stream, distant mountain notch/waterfalls, old flagstone ground, cool navy/pine ambient light with restrained old-gold shafts.

The composition provides broad staging ground and layered near/mid/far depth without actors, UI, navigation markers, a grid or branching free-roam cues.

## Environment variants

| Variant | Artifact | Dimensions | Status | Surface result |
| --- | --- | ---: | --- | --- |
| Travel | `environment/forest-road-travel-dev.png` | 1672×941 | `DEV_CANDIDATE` | Guided, character-free transition; upper-right menu and lower-right next-step zones remain usable. |
| Tableau | `environment/forest-road-tableau-dev.png` | 1672×941 | `DEV_CANDIDATE` | Character-free plate with broad foreground staging and dialogue-safe upper area. |
| Strategic | `environment/forest-road-strategic-dev.png` | 1672×941 | `DEV_CANDIDATE` | Oblique tactical field with small-unit readability and no explicit grid/isometric redesign. |
| Combat Stage | `environment/forest-road-combat-stage-dev.png` | 1672×941 | `DEV_CANDIDATE` | Side-on attacker/target lanes, center action space and header/result clearance. |

## Kestrel master

- Artifact: `characters/kestrel-option-c-character-master-dev.png`
- Status: `DEV_CANDIDATE`
- Dimensions: `1536×1024 RGBA`
- Transparency: real alpha (`0–254`), not a baked checkerboard.
- Views: front/three-quarter, side gameplay profile, opposite-facing plausibility.

The master is a pilot derivative only. It does not replace the canonical `640×768` source.

## Pose references

| Pose | Artifact | Canvas | Feet baseline | Edge touch | Status |
| --- | --- | ---: | ---: | --- | --- |
| Idle | `characters/poses/idle/kestrel-idle-1.png` | 768×768 | 715 | none | `DEV_CANDIDATE` |
| Dash | `characters/poses/dash/kestrel-dash-1.png` | 768×768 | 715 | none | `DEV_CANDIDATE` |
| Attack | `characters/poses/attack/kestrel-attack-1.png` | 768×768 | 715 | none | `DEV_CANDIDATE` |
| Cast / skill | `characters/poses/skill/kestrel-skill-1.png` | 768×768 | 715 | none | `DEV_CANDIDATE` |

The accepted dash is grounded; attack bow mechanics remain legible; cast/skill reads as precision/zenith-shot preparation rather than generic magic.

## Animation sheets

Pose coherence gate passed before animation generation. All accepted animations use transparent `512×512` frames, shared per-sheet scale, feet alignment, 2×4 extraction, eight distinct frame hashes, no embedded environment/text/VFX and a common alpha baseline of `y=466`.

| Animation | Accepted artifact | Frames | Sheet | GIF | Status | Frame-by-frame review |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Idle | `animations/idle/processed/` | 8 | 2048×1024 | 512×512 | `DEV_CANDIDATE` | Identity/costume/mask/bow/quiver stable. Motion is intentionally restrained and visibly non-identical, but subtle at battle scale. |
| Dash | `animations/dash/processed-retry/` | 8 | 2048×1024 | 512×512 | `DEV_CANDIDATE` | Grounded compress/drive/recover read; no platformer jump; corrected source has no edge touch. |
| Attack | `animations/attack/processed-retry/` | 8 | 2048×1024 | 512×512 | `DEV_CANDIDATE` | Ready → quiver → nock → raise/draw → release → recovery is readable; bow geometry remains plausible without VFX. |
| Cast / skill | `animations/skill/processed-retry/` | 8 | 2048×1024 | 512×512 | `DEV_CANDIDATE` | Upward precision-shot preparation is clear; no spellcasting, aura, projectile impact or baked VFX. |

Animation review dimensions A–J (identity, costume, mask, bow, quiver, scale, feet/anchor, silhouette, temporal continuity, action readability) have no hard failure. The idle remains the closest item to the threshold because its loop is deliberately low amplitude; this is disclosed to the operator rather than hidden.

## Cross-surface composites

The deterministic preview preserves existing placement families instead of proposing new interaction semantics:

- Travel: no avatar or movement/navigation affordance; compact menu and next-step card only.
- Tableau: background remains actor-free; runtime Kestrel is a separate transparent foreground layer and can be moved, mirrored or removed.
- Strategic: high/oblique battlefield read, representative small Kestrel scale, turn order, selected-unit panel, action bar and objective/journal zones.
- Combat Stage: side-on Kestrel/badger confrontation, attack header and damage/result zone.

The same Forest Road anchors, Kestrel identity, high-density pixel-stylized rendering, green/navy/old-gold palette and lighting logic remain recognizable across all four surfaces.

## 1920×1080 QA

| Surface | Exact output | Browser geometry | Visual inspection |
| --- | --- | --- | --- |
| Travel | `composites/1920x1080-travel.png` | PASS | No avatar/free roam; menu and next-step card clear; important landmarks survive crop. |
| Tableau | `composites/1920x1080-tableau.png` | PASS | Dialogue card clear; Kestrel fully readable; background itself contains no actor. |
| Strategic | `composites/1920x1080-strategic.png` | PASS | Tactical-scale Kestrel readable; all protected UI zones clear; no grid/camera redesign. |
| Combat Stage | `composites/1920x1080-stage.png` | PASS | Attacker/target lanes, header and damage/result feedback clear; no subject clipping. |

Automated check: zero off-screen UI boxes, zero UI-panel intersections, exact viewport dimensions and all referenced images loaded.

## 1366×768 QA

| Surface | Exact output | Browser geometry | Visual inspection |
| --- | --- | --- | --- |
| Travel | `composites/1366x768-travel.png` | PASS | Lower-right panel and upper-right menu remain legible; no important subject clipped. |
| Tableau | `composites/1366x768-tableau.png` | PASS | Dialogue and actor clear; foreground remains separable and mirror-feasible. |
| Strategic | `composites/1366x768-strategic.png` | PASS | Kestrel remains readable at tactical scale; action bar, unit and objective panels clear. |
| Combat Stage | `composites/1366x768-stage.png` | PASS | Side-on action and feedback retain spacing and pixel readability. |

Automated check: zero off-screen UI boxes, zero UI-panel intersections, exact viewport dimensions and all referenced images loaded.

## Quality gates A–J

No averaging is used; every gate independently meets the required `4/5` threshold.

| Gate | Score | Evidence |
| --- | ---: | --- |
| A. STYLE_COHERENCE | 5/5 | One master-derived environment family and stable Kestrel material/palette treatment. |
| B. CANONICAL_IDENTITY_FIDELITY | 5/5 | Hood, closed mask, bow, quiver, harness, proportions and green/bronze palette preserved. |
| C. MODERN_HD2D_PIXEL_LANGUAGE | 4/5 | Crisp high-density pixel-stylized treatment at both target resolutions; no painterly/photoreal drift. Final production pixel-density calibration remains a later concern. |
| D. ENVIRONMENT_CHARACTER_INTEGRATION | 4/5 | Palette, edge density and lighting family integrate in Tableau/Strategic/Stage composites. A production pass could further unify contact lighting. |
| E. GAMEPLAY_READABILITY | 5/5 | Guided Travel, actor-separable Tableau, small tactical unit read and side-on stage action are immediately distinct. |
| F. STATIC_TABLEAU_FEASIBILITY | 5/5 | Background is actor-free with dialogue clearance and broad 1–4 actor staging potential. |
| G. STRATEGIC_COMBAT_FEASIBILITY | 4/5 | Existing oblique tactical semantics and UI families fit; no top-down/isometric/grid redesign. Production-scale runtime integration is intentionally not attempted. |
| H. COMBAT_STAGE_FEASIBILITY | 5/5 | Clear attacker/target lanes, header and feedback zones at both resolutions. |
| I. ANIMATION_READABILITY | 4/5 | Four 8-frame actions are distinct, grounded and anchored; idle is intentionally subtle and merits operator attention. |
| J. CROSS_SURFACE_COHERENCE | 5/5 | Same forest, Kestrel, pixel language, palette, lighting family and game semantics across all four surfaces. |

## Hard failures

`NONE` in accepted DEV candidates.

- Travel does not suggest controllable traversal.
- Strategic does not change camera/gameplay semantics.
- Kestrel identity does not materially drift.
- Tableau plate contains no baked dialogue actor.
- Kestrel remains pixel-stylized rather than painterly.
- Accepted animation costume/scale/feet anchors are stable.
- Accepted sheets embed no VFX.
- Both composite resolutions preserve current UI geometry families.
- No candidate depends on gameplay redesign.

## Rejected candidates

| Candidate | Retained path | Reason |
| --- | --- | --- |
| Checkerboard master correction | `qa/rejected-kestrel-master-checkerboard.png` | Opaque RGB checkerboard instead of real alpha. |
| Initial 2×2 pose board | `characters/kestrel-four-pose-reference-raw.png` and `characters/rejected-four-pose-edge-touch/` | Inter-cell overlap; airborne/platformer dash read. |
| First dash animation | `animations/dash/raw-generated.png` and rejected diagnostic folders | Frame `[1,2]` touched a cell edge. |
| First attack animation | `animations/attack/raw-generated.png` and rejected diagnostic folders | Four frames touched cell edges. |
| First cast/skill animation | `animations/skill/raw-generated.png` and rejected diagnostic folders | Five frames touched cell edges. |

Rejected assets remain evidence only and are not used in composites or accepted sheets.

## Protected systems

- `PRODUCTION_PROMOTIONS = 0`
- `LIVE_PRODUCTION_ASSETS_REPLACED = NO`
- `GAMEPLAY_CHANGED = NO`
- `NARRATIVE_CHANGED = NO`
- `ROUTES_CHANGED = NO`
- `SAVE_SCHEMA_CHANGED = NO`
- `COMBAT_CHANGED = NO`
- `VFX_CHANGED = NO`
- `PRODUCTION_MEDIA_CHANGED = NO`

## Files created and modified

- Created: all Phase 4A payload, evidence and support files under `docs/art-direction/option-c/phase4-pilot/`; exact per-file list and hashes are in `manifests/pilot-manifest.json` and `manifests/pilot-manifest.sha256`.
- Modified tracked files: `0`.
- Files outside the pilot hierarchy: `0`.

## Tests

- `qa/capture-composites.mjs`: PASS, 8/8 exact-resolution composites; browser geometry/collision checks all pass.
- `qa/capture-review-board.mjs`: PASS; operator board rendered with all requested environment, pose, animation and composite evidence.
- `qa/audit-pilot.py`: PASS, 25/25 checks; canonical hash, alpha, dimensions, canvas, edge, baseline, frame count and rejected-evidence checks pass.
- `manifests/build_pilot_manifest.py`: PASS; generation lineage, classified inventory and SHA-256 list generated.
- Runtime/focused project tests: NOT RUN — no runtime/source code changed.
- Presentation validators: NOT RUN — no live presentation implementation changed; isolated pilot tooling above is the relevant validator.

## Typecheck

`NOT RUN — no runtime/source code changed.`

## Build

`NOT RUN — no runtime/source code changed.`

## Decision

- `PRODUCTION_PROMOTIONS = 0`
- `OPERATOR_DECISION_REQUIRED = NO`
- `OPERATOR_DECISION = APPROVED_DEV_PILOT`
- Recommendation: `APPROVE_PILOT — FULFILLED`
- Scope of approval: the Phase 4A visual system is accepted as a coherent DEV pilot; this is not production promotion or runtime integration authorization.
- Model provenance remains: `UNKNOWN`
- Commit: `YES — Phase 4A checkpoint authorized`
- Push: `YES — Phase 4A checkpoint authorized`
- Stop: `YES`
