# Eight-slot cinematic remaster preparation

> **Current scope override — operator decision, 2026-10-01 America/Toronto:** new video/keyframe generation, artistic remaster and replacement are now a separate manual workstream. Autonomous runs focus on structure readiness and existing-media QA, then independent demo work. Follow [the latest decision](CINEMATIC_STRUCTURE_OPERATOR_DECISION_2026-10-01.md) and current MD/JSON state; the generation continuation below is historical. Prologue is a desired extension to prepare; first-refuge video is optional/pending; neither expands the LOCKED eight-slot registry yet. Alistair emblem/origin decision is deferred.

Status: **IN_PROGRESS**, queue item 8, 2026-10-02 UTC. Items 1–7 remain complete. Source/context review, generation specs and existing-media QA are prepared. Actual replacement videos and final artistic acceptance remain pending; MiniMax is now **AUTHORIZED_BY_OPERATOR**. No MP4 was replaced.

[Production brief](../../tools/cinematics/specs/production_eight_slot_remaster_brief.json) records current descriptors, measured streams, exact first/middle/final frame hashes, canonical triggers, V2 identities, environment references, exclusions and presentation ownership. All sources are silent H.264/yuv420p, 1920×1080, 24 fps; actual durations match their descriptors. Existing ffmpeg/ffprobe were located under ignored tmp/cinematics/toolchain despite their absence from PATH.

| Approved slot | Measured seconds | Frames | Canonical constraint |
| --- | ---: | ---: | --- |
| camp_departure | 12 | 288 | Moonlit camp, V2 identities; candidate keyframe prepared |
| alaric_audience_arrival | 12 | 288 | Audience arrival; no mission choice preselected |
| bois_clair_arrival | 20 | 480 | Village geography; rescue/raid choice remains interactive |
| bois_clair_saved | 18 | 432 | Defence victory; reward choice follows |
| bois_clair_sacrificed | 18 | 432 | Raid outcome; provisions choice follows |
| lion_judgement | 17 | 408 | No verdict, disclosure or route preselected |
| serpent_route_ending | 18 | 432 | Defeated general; artifact custody remains choice-owned |
| lion_trial_route_ending | 20 | 480 | Trial won; voluntary/refused intent remains choice-owned |

Eight generation specs contain 14 blocks totalling 135 seconds, preserving current durations. [Camp spec](../../tools/cinematics/specs/production_camp_departure_v1.json) passes validation with its real source; [other seven specs](../../tools/cinematics/specs/production-eight-slot-remaster) pass structural validation. Their raster keyframes, physical motion and final acceptance remain pending. A prepared spec does not accept its future generated motion.

[Camp keyframe candidate](../../tools/cinematics/candidates/production-eight-slot-remaster/camp_departure/keyframe-v1.png) was generated with the built-in image tool from promoted camp and V2 Marian/Maelor/Alistair references. [Provenance](../../tools/cinematics/candidates/production-eight-slot-remaster/camp_departure/provenance.json) preserves exact prompt, inputs, native dimensions and hash. It remains outside public/runtime. CIN-4 now supports explicitly declared native 1672×941 input while final video remains strictly 1920×1080. The adapter verifies source dimensions/hash before authentication; undeclared inputs retain the legacy 1920×1080 requirement.

All 24 source frames were inspected. Old identities, exposed faces and some lighting differ from promoted authority; these sources are not accepted as final remasters. Existing bytes stay unchanged until accepted replacement.

## Runtime boundaries and correction

Video owns integrated cast during playback. Dialogue returns to STATIC_TABLEAU / STAGE_OWNS_CAST. Registry CINEMATIC_HOLD metadata does not authorize interactive dialogue/choices on frozen video. Campaign QA checks one primary surface, 1–4 tableau actors, no moving overlays and zero dialogue/choice steps on hold. Ending combat remains nested in durable lion-final-judgement; no new node was invented.

QA found an inaccurate Serpent fallback caption: “l’artefact reste avec la compagnie” contradicted the existing option to entrust it to Alaric before the clip. Only that descriptor text changed to “Le général est vaincu et l’artefact a été récupéré.” Recovery is common to existing branches. IDs, dialogue, choices, outcomes, save logic and MP4 bytes are unchanged. Final-build rendered fallback text and both disclosed/concealed Serpent campaign outcomes passed after rebuilding.

## Validation

[QA report](../reports/cinematic-eight-slot-remaster-preparation-1.md) and [machine proof](../reports/cinematic-eight-slot-remaster-preparation-1-browser/browser-qa.json) preserve scope and a compact four-capture gallery. Historical accepted evidence was not overwritten; ordinary outputs use new ignored directories.

- Real decoder/player: 88 accepted cases across eight clips, natural completion, keyboard skip/release, passive hold, reduced motion and missing media at 1920×1080, 1366×768, 620×900 and 390×844. Frames decode, clocks advance, overlays clean up and isolated save bytes stay unchanged.
- Built production: 8/8 scenarios at 1366×768; 8/8 at 390×844 with OS/game reduced motion and keyboard choice activation; 8/8 at 390×844 with unavailable media. Opening, village branches and disclosed/concealed Serpent/trial endings retain choices, handoffs and resolved V6 truth without replay. Two Serpent cases passed again after the final neutral-caption rebuild.
- 127 focused tests across seven suites, TypeScript, eight-contract/eight-slot validator and production build pass. Dist still has exactly eight MP4s. All 27 distinct source/canonical-reference/candidate hashes pass.

Initial fixture failures are retained/explained: deliberate network abort can correctly produce bounded timeout rather than error; concealed ending IDs use lion-seal-serpent/lion-seal-trial; combat-result posting must await real iframe boot. Corrected assertions/timing passed. No runtime regression was concealed. Combat QA injects an existing bridge result; it does not prove tactical balance. Keyboard activation/bounds are tested; full Tab-order/demo accessibility acceptance is not claimed. The audience gallery capture records a transition rather than settled dialogue typography.

## Contract compliance

Read GAME_CONSTITUTION, contracts README/manifest and all eight LOCKED contracts including AUTONOMOUS_WORK_PROTOCOL; contract set v1. Design-source audit and current conversion matrix consulted. No LOCKED rule changed.

| Contract area | Result | Evidence / remaining action |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | Presentation preserves authored truth and eight existing IDs |
| ART_DIRECTION | PASS preparation; BLOCKED final media | Canonical refs/provenance; generated motion not accepted |
| CHARACTERS | PASS preparation; BLOCKED final media | V2 bytes unchanged; camp candidate identity review only |
| ENVIRONMENTS | PASS preparation; BLOCKED final media | Promoted plates/hashes; future motion continuity pending |
| NARRATIVE / CAMPAIGN | PASS | Existing triggers/branches; neutral artifact caption |
| NARRATIVE_PRESENTATION | PASS | Cast ownership, one primary surface, interactive agency |
| TRAVERSAL | PASS | No T0/T1/T3 implementation edits; completed queue retained |
| COMBAT | PASS | Existing bridge/authority; no resolution or balance changes |
| SAVE | PASS | Durable node/ending IDs; resolved V6 truth/replay checks |
| QA_EVIDENCE | PASS | Ignored runs; explicit new compact promotion; failures explained |
| REPOSITORY_GOVERNANCE | PASS | Exclusive lock; dev checkpoint/push; no main or LOCKED edit |

Item 8 remains IN_PROGRESS. Audio remains DEFERRED. The missing-provider-authorization blocker was resolved by the operator on 2026-10-01; see the decision below.

## Exact continuation

Acquire exclusive lock and read Git/state plus CINEMATIC_VIDEO_OPERATOR_DECISION_2026-10-01.md. MiniMax local-key use for RPGThreeJS clips/current and future recurring runs is explicitly authorized: do not request it again. Retain items 1–7 complete, eight-source audit/specs, camp keyframe and existing-media QA. Review/update conservative camera/action wording against very active, rhythmic FF9-inspired staging while preserving HD-2D/V2/canon and exactly eight slots. Validate source/spec; restore ignored camp source byte-identically if needed; generate first 12s candidate via existing MiniMax adapter. Inspect real motion/identity/framing/environment/decoded ending and runtime QA before any production replacement. Continue remaining clips through checkpoints; item 8 remains incomplete; audio DEFERRED.

[Standing operator decision: MiniMax and active FF9-inspired rhythm](CINEMATIC_VIDEO_OPERATOR_DECISION_2026-10-01.md). The historical authentication rejection lacked explicit permission; this decision resolves it. No provider call was made by the persistence checkpoint; availability/credits remain unmeasured. Previous prepared motion specs require review against this new direction before generation.
