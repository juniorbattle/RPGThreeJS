# CIN-6E-A Final Visual Production System

Baseline: `6683c6d3898db0216549c43f7d25c7d8fd46d70d`

CIN-6E-A remains preproduction-only. TravelView is still production default; NarrativeStage remains DEV/selectable. No production media, canonical sprite, game truth, save, combat or VFX file is changed.

## Pre-flight

PASS on `main`: HEAD and `origin/main` both equal the required baseline. The pre-mission working tree was clean.

## GOLD reference system

The three approved masters have reproducible six-frame forensic sets, twelve-frame strips, ffprobe metadata, SHA-256 identity, ffmpeg scene-change candidates, adjacent sampled-frame differences and histogram-discontinuity signals. Machine signals are review aids; manual classification remains authoritative. `GOLD_VISUAL_DNA` records camera, depth, ground, lighting, material, integration, KEEP, IMPROVE and NEVER rules.

## Image pipeline

Acceptance requires `gpt-image-2.5-sunburst-2026-09-08` at `quality=max`. The built-in image surface does not expose or confirm the model snapshot or quality, and no `OPENAI_API_KEY` is available to the explicit CLI path. Generation/edit attempts: 0; selected: 0; rejected: 0. No substitute provider or model was used.

## Video pipeline

MiniMax-H3 remains the required offline I2V provider. Attempts: 0, because no accepted exact-model starting keyframe exists. Internal cuts and endpoint quality for new pilots are therefore NOT_PROVABLE. The cut/contact-sheet tool is ready for sequential pilot validation.

## Character and cast system

- Character cards: 22/22, with canonical reference hashes and alpha bounds.
- SceneCastManifests: 125, derived from presentation, dialogue-staging and cinematic-cast truth.
- Video pilot continuity specs: 3/3.
- Identity failures observed in new candidates: 0 candidates exist; HUMAN_REVIEW_REQUIRED.
- Static tableau sprite policy: use the existing canonical runtime foreground sprites unchanged.

## Visual families and pilots

All 13/13 committed families have complete master specifications and A/B prompt jobs. Selected masters: 0/13. Pilots A-F each have explicit beats, modes, cast lineage, outputs and acceptance purpose; executed: 0/6; passed: 0/6; retries: 0. The exact-model capability blocker applies to all six.

## Presentation roles

The reverse-composed tableau profile carries the accepted 61.2% six-character and 64.8% four-character framing, 14–17% bottom crop, 1.0/0.50 speaker/listener emphasis, 42vw dialogue card and 14vh top anchor into 1920×1080 and 1366×768 guides. No pilot background exists, so new runtime composites and visual integration gates remain blocked. The Travel Still profile forbids dialogue and theatrical cast; no pilot still exists. Video, collage, cast-continuity and HOLD endpoint gates remain NOT_PROVABLE until generation.

## Prompt compilation and provenance

The compiler emits 44 inspectable A/B jobs: 26 family-master and 18 pilot-image jobs. Every job records the exact model, quality, endpoint, attempt, prompt hash, existing reference hashes, cast manifest, dependencies and approval state. Output paths/hashes and timestamps are null because generation did not happen.

## CIN-6E-B handoff

The dependency-ordered future manifest contains 31 production-video records (29 retained video slots and 2 reclassified references), 25 HOLD stills, 14 Travel Stills, 49 tableau backgrounds (2 reusable and 47 requiring work) and 10 living-still candidates. Total records: 119. Production remains blocked on human-approved family masters and pilots.

## Protected systems and validation

RunSystem, game truth, save schema, dialogue truth, choice effects, routes, combat, VFX, canonical sprites, production manifest and production media are unchanged. TravelView remains production default and NarrativeStage remains DEV-selectable. Production media hashes: 31/31 unchanged. Deterministic generation: 22/22 generated specs/reports byte-identical across a repeat. Secret, protected-path, whitespace and `git diff --check` audits pass. Typecheck and build pass. Focused presentation validation: 66/66 tests pass. Full suite: 2,315 pass; the same 11 documented `CasterMotionBackCompat.test.ts` failures remain; new regressions: 0.

## Decision

- VISUAL_PRODUCTION_LOCK: **NO**
- AUTOMATED_TECHNICAL_GATES: **PASS for completed structural artifacts; generation capability blocked**
- AGENT_VISUAL_QA: **MIXED** — GOLD analysis is complete; no new family or pilot evidence exists.
- HUMAN_VISUAL_REVIEW: **REQUIRED**
- READY_FOR_CIN_6E_B: **PENDING_HUMAN_VISUAL_APPROVAL**
- BLOCKER: exact `gpt-image-2.5-sunburst-2026-09-08`, `quality=max` execution is unavailable in the current environment.
- COMMIT: **NO**
- PUSH: **NO**
