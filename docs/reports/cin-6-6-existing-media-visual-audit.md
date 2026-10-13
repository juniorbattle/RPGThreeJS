# CIN-6.6 — Existing Production Media Visual Audit

## Scope and method

All 20 current production masters in `public/assets/cinematics/manifest.json` were decoded at first, 25%, 50%, 75%, and last frame. Ignored contact sheets were reviewed against the fixed ordered criteria in `tools/cinematics/specs/cinematic_visual_polish_audit.json`:

1. casting;
2. player representation;
3. identity;
4. facing;
5. scale;
6. relative height;
7. camera distance;
8. staging;
9. grounding;
10. locomotion;
11. sliding;
12. environment motion;
13. parallax;
14. world integration;
15. cross-video continuity;
16. safe zone;
17. final frame;
18. game truth.

Structural checks do not automatically produce a remaster decision. The classification records a human-visible defect and an actionable recommendation. A `REMASTER_MEDIA` entry is a future queue item, not authorization to generate it in CIN-6.6.

## Results

- production masters audited: 20;
- KEEP: 17;
- POLISH_RUNTIME: 0;
- REMASTER_MEDIA: 3;
- CIN-6C blockers: 0;
- production files modified by this audit: 0.

| Runtime ID | Classification | Main reason |
| --- | --- | --- |
| `lion_judgement` | REMASTER_MEDIA | Formal judgement lacks a guaranteed player-faction representative, so the political exchange reads as Lion-only staging. |
| `serpent_general_reveal` | KEEP | Focused neutral enemy reveal; no fabricated company figure is required. |
| `lion_champion_reveal` | KEEP | Focused champion reveal with sound identity, scale, and presentation. |
| `forest_journey_tension` | REMASTER_MEDIA | Camera-driven scale inflation and pressure on the agency-safe final composition. |
| `camp_departure` | KEEP | CIN-6.6 two-shot remaster resolves sliding/static-world and scale-continuity concerns. |
| `alaric_audience_arrival` | KEEP | CIN-6.6 remaster clearly represents both the company and Lion authority. |
| `refugees_approach` | KEEP | Neutral shared encounter context remains readable and game-truth safe. |
| `first_refuge_arrival` | KEEP | Stable refuge-arrival context and usable management handoff. |
| `first_refuge_departure` | KEEP | Journey bridge remains readable with safe state-neutral context. |
| `valmir_route_fork` | KEEP | Route-freeze context remains neutral and agency-safe. |
| `bois_clair_arrival` | KEEP | HERO progression, threat geography, and choice-safe final state remain strong. |
| `bois_clair_saved` | KEEP | Saved aftermath is clearly damaged-but-surviving and state-specific. |
| `bois_clair_sacrificed` | KEEP | Sacrificed aftermath is visually distinct and state-specific. |
| `second_refuge_departure` | KEEP | Neutral forward-momentum staging works for either Bois-Clair outcome. |
| `witnesses_encounter` | KEEP | Encounter context does not determine witness choice or later testimony. |
| `ruins_approach_context` | KEEP | Neutral ancient-ruin context avoids disclosure truth. |
| `shadow_signs` | KEEP | Mystery/reaction progression remains compatible with reveal and conceal dialogue. |
| `final_refuge_dossier` | KEEP | Story-only dossier/march preparation remains distinct from refuge management. |
| `serpent_route_ending` | KEEP | Serpent aftermath shows recovered consequence without deciding later disclosure. |
| `lion_trial_route_ending` | REMASTER_MEDIA | Earned route ending lacks a guaranteed surviving company representative. |

## Deferred remaster queue

### `lion_judgement`

- severity: HIGH;
- current SHA-256: `6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9`;
- future action: preserve Alaric and champion staging while adding a guaranteed company representative;
- CIN-6C blocker: no.

### `forest_journey_tension`

- severity: MEDIUM;
- current SHA-256: `385f5f9b99b22d9710ef1ef7a89fd21a8b59e392664a51a2480eab6167511fac`;
- future action: two-shot neutral forest travel with locked perspective, smaller root motion, and a stable agency-safe final composition; never reveal a specific creature;
- CIN-6C blocker: no.

### `lion_trial_route_ending`

- severity: MEDIUM;
- current SHA-256: `34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2`;
- future action: retain Alaric and the champion while adding a guaranteed surviving company representative;
- CIN-6C blocker: no.

No work on this queue is authorized until a later mission explicitly scopes it.

## Evidence and validation

- extraction metadata: ignored `tmp/cinematics/cin66/visual-polish-audit/visual-polish-review.metadata.json`;
- four ignored grouped contact sheets: `tmp/cinematics/cin66/visual-polish-audit/contact-sheets/`;
- machine-readable audit: `tools/cinematics/specs/cinematic_visual_polish_audit.json`;
- validator: `tools/cinematics/validate_cinematic_visual_polish_audit.mjs`;
- coverage/hash/criterion validator: PASS, 20/20;
- media technical probe: 20/20 H.264 High, yuv420p, 1920×1080, 24 fps;
- manifest: 20 production IDs plus 1 QA placeholder, no duplicates;
- operator approval: pending for the two CIN-6.6 pilots and presentation changes.

