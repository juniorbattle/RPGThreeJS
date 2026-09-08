# CIN-6.6 — Cinematic Presentation, Casting, Scale & Motion Standard

## Baseline and scope

- Repository: `juniorbattle/RPGThreeJS`
- Branch: `main`
- Accepted clean baseline: `6c86c96e3ae11769eec764e48d3f80bd69362876`
- Baseline relationship: `HEAD == origin/main`
- MiniMax scope: two P0 replacement masters only
- P1/P2 generation: none
- Commit/push: no/no

The concurrent VFX publication registry was present before CIN-6.6 and remains user-owned. Its baseline SHA-256 is `4951b2d22f5fce42131bf46aad6d2422aa098b5881bbaccee33291c01eda1e3e`; CIN-6.6 does not edit, restore, stage, or repair it.

- `PRE_EXISTING_VFX_FILES_PRESERVED: YES`
- `CIN_VFX_DIFF: EMPTY`
- final registry SHA-256: `4951b2d22f5fce42131bf46aad6d2422aa098b5881bbaccee33291c01eda1e3e`

## Pre-generation validation exception

The pre-generation full suite produced the accepted concurrent-VFX-only exception:

- test files: 99 total; 98 passed, 1 failed;
- tests: 2,123 total; 2,112 passed, 11 failed;
- all 11 failures: `src/combat/vfx/CasterMotionBackCompat.test.ts`;
- cause: the concurrent committed VFX publication registry currently exposes zero actions while that compatibility suite expects 33;
- cinematic, Journey, dialogue, typecheck, build, and diff checks: green;
- `PRE_GENERATION_FULL_SUITE: CONCURRENT_VFX_EXCEPTION`;
- `CIN_SCOPE_TESTS: PASS`;
- `CIN_BLOCKER: NO`.

No VFX test or production file was weakened to hide the exception.

## Presentation defects addressed

1. Audience staging did not visually include the player company.
2. Character scale depended too heavily on independent `heightPx` values.
3. Camp departure read as lateral sprite sliding over a static painting.
4. single-successor Journey panels emphasized the completed node instead of the next node;
5. Journey panels occupied too much of the cinematic frame;
6. a completed held-dialogue surface could disappear before the next Journey boundary;
7. shot specs lacked explicit faction casting, scale, and dialogue/agency safe-zone contracts.

## 6.6A — Character normalization and scale metadata

`tools/cinematics/normalize_character_sources.py` deterministically scans all 52 canonical PNGs under `public/assets/characters/pixel/full/`. It records source dimensions, alpha bounds, visible body dimensions, transparent margins, visual center, foot anchor, category, relative stature, and canonical SHA-256 in `tools/cinematics/specs/cinematic_character_scale.json`.

The review output uses a common 520×700 canvas, a common foot baseline at Y=650, and per-character physical stature. It explicitly does not make every body the same height. The ignored output contains 52 normalized review PNGs plus `major-human-contact-sheet.png` (53 review files total).

Scale resolution for new specs is now:

```text
relative physical stature
× framing reference height
× perspective factor
= displayed visible body height
```

Legacy `heightPx` remains supported for existing specs. The canonical PNGs are never written. The validator recomputes all hashes and rejects duplicate IDs, invalid bounds, invalid foot anchors, missing canonical coverage, or suspiciously uniform stature data.

Results:

- canonical full PNGs: 52;
- scale profiles: 52;
- canonical files modified: 0;
- scale metadata validator: PASS;
- normalized major-human contact sheet: visually reviewed, PASS.

## 6.6B — Casting and player representation doctrine

Shot specs now support explicit scene casting and per-subject semantics:

- `playerFaction` and `externalFaction` representatives;
- `factionRole` such as player representative, adviser, hero, leader, or champion;
- `screenRole` and `requiredForNarrativeRead`;
- optional-character exclusions with a truth basis.

The rule is scene-specific rather than automatic. Audiences, negotiations, judgements, and moral encounters must visibly represent the company unless a deliberate POV composition is documented. Neutral enemy reveals do not gain a fabricated company avatar. Optional recruits may not appear before recruitment.

For `alaric_audience_arrival`:

- company representatives: `alistair`, `marian`;
- Lion representatives: `alaric`, `lion_champion`;
- excluded optional recruits: `cedric`, `lancer`;
- truth basis: Alistair and Marian are core initial-clan characters before `lion_briefing`.

The three-shot remaster reads as company delegation ↔ Lion authority, while keeping the briefing itself deterministic and outside the MP4.

## 6.6C — Journey UI and no-black boundary

Single, branch, and terminal presentations now have explicit modes. `JourneyRunNodeAdapter` gives a single successor the following hierarchy:

```text
PROCHAINE ÉTAPE
<NEXT NODE>
<category · difficulty>
Depuis : <completed node>
```

Branch presentations use `CHOISIR LA ROUTE` and retain the exact authoritative RunSystem choices. Terminal presentations are visually distinct. Utility actions remain available but are smaller and visually secondary.

The panel is now a compact lower-third treatment:

- single width capped at 680px;
- branch width capped at 1040px;
- limited height with internal overflow;
- restrained transparency and bottom gradient;
- scene remains substantially visible;
- no opaque full-screen choice card was introduced.

### Passive Journey backdrop lifecycle

`JourneyBackdrop.copyJourneyBackdrop()` copies the frozen cinematic canvas into a decoder-free, pointer-inert, `aria-hidden` static canvas. The next boundary may consume that copy if its own cinematic is unavailable or already presented.

```text
held dialogue canvas
→ copy passive pixels
→ release live cinematic/video/listeners
→ next Journey boundary consumes static copy
→ agency completes
→ release static copy
```

Null contexts and `drawImage()` exceptions return `null`; Journey falls back to its existing neutral surface instead of blocking. Entering CombatStage explicitly disposes any pending backdrop, so no Journey canvas can sit above tactical combat.

The held cinematic remains presentation-only. Route choice, effects, combat start, rewards, saves, and node commits remain owned by existing deterministic systems.

## 6.6D — Pilot remasters

### Alaric audience arrival

| Field | Result |
| --- | --- |
| old SHA-256 | `b844b273dd955c34364d041b54baf385bd89b9a367db16bc29050685a186951f` |
| new SHA-256 | `958d5e9a8f6b52a9defb1d3ebfd39af49c71cf84a90c50753b829adf5db82715` |
| old/new duration | 9.000 s / 12.000 s |
| old/new bytes | 9,749,877 / 12,955,241 |
| shots / provider attempts | 3 / 4 |
| targeted retries | 1 |
| technical master | H.264 High, yuv420p, 1920×1080, 24 fps, silent |

Shot 1 establishes both factions. Shot 2 focuses Lion authority; attempt 1 was rejected because Alistair's sword rotated into an implausible horizontal threat pose. Attempt 2 used a restrained observation action and passed. Shot 3 settles on a balanced company/Lion composition for `lion_briefing`. Four-percent mastering overscan on shots 2 and 3 removes narrow provider edge reveal without changing authored geography.

Visual gates:

- player faction visible: PASS;
- Lion faction visible: PASS;
- casting and narrative geography: PASS;
- identity/facing/equipment: PASS;
- character scale and ground alignment: PASS;
- camera distance: PASS;
- restrained environmental life/world integration: PASS;
- dialogue safe zone: PASS;
- no game-truth leak: PASS.

### Camp departure

| Field | Result |
| --- | --- |
| old SHA-256 | `5ccf6e4e5156831ab10c992ee4af59a5bc5a28093df690b737a3eed441469463` |
| new SHA-256 | `fedff433adaa69d15f10b40bd5ae8be0a52fd3f3eeabf35db6a035e25f1af279` |
| old/new duration | 12.000 s / 12.000 s |
| old/new bytes | 9,428,366 / 8,751,383 |
| shots / provider attempts | 2 / 2 |
| targeted retries | 0 |
| technical master | H.264 High, yuv420p, 1920×1080, 24 fps, silent |

The remaster replaces prolonged lateral travel with an establishing hold and a short purposeful step/stance transition. Shot 2 limits root motion below four percent of the frame, locks camera distance, and asks for foot-contact-matched movement. Cloth, foliage, dust, cloud/light variation, and restrained parallax supply environmental life. Matched four-percent mastering overscan on both shots removes provider edge falloff and preserves cross-shot optical scale.

Visual gates:

- no character sliding: PASS;
- foot contact/gait plausibility: PASS;
- root motion match: PASS;
- cross-shot scale continuity: PASS;
- relative character height and ground alignment: PASS;
- environment motion/parallax/depth: PASS;
- world integration: PASS;
- agency safe zone: PASS;
- no game-truth leak: PASS.

These are reviewer-candidate passes, not operator authorization for CIN-6C.

## Safe zones and production grammar

Shot specs accept normalized `dialogueSafeZone` and `agencySafeZone` rectangles within the frame. Validation proves only their structure and bounds. Face, weapon, and narrative-evidence collisions remain human source-preview/final-media decisions.

The motion standard rejects significant ground-plane translation without plausible foot movement. If H3 cannot maintain gait, the production fallback is reduced root translation using `STEP_FORWARD`, `SHIFT_STANCE`, `TURN`, `LOOK`, or `STOP`. Journey/Hero scenes should include restrained independent environmental motion and depth when the setting supports it; movement is not created by camera push alone.

## Media accounting

- manifest IDs: 21 (1 QA placeholder + 20 production masters), unchanged;
- production IDs added: 0;
- old cumulative production duration: 271.000 s;
- new cumulative production duration: 274.000 s;
- duration delta: +3.000 s;
- old cumulative production bytes: 296,950,516;
- new cumulative production bytes: 299,478,897;
- byte delta: +2,528,381;
- MiniMax provider task count: 6;
- selected shots: 5;
- targeted retries: 1;
- P1/P2 generated: 0/0.

All 20 production files probe as H.264 High, yuv420p, 1920×1080, 24 fps. Both new masters are silent and pass nonblack/nonblank final-frame validation.

## Real Chrome QA

The actual DEV Journey campaign was exercised in Chrome, not a synthetic ended-event fixture:

1. `camp_departure` visibly played moving frames and naturally settled into a compact boundary whose primary title was `Audience d’Alaric` and whose secondary context was `Depuis : Camp du Lion`.
2. `alaric_audience_arrival` visibly played with Alistair, Marian, Alaric, and the Lion Champion. At natural end the video reported `currentTime=duration=12`, `paused=true`, `ended=true`, and `readyState=4`; the 1920×1080 authoritative canvas stayed visible under one interactive `lion_briefing` dialogue modal.
3. Completing `lion_briefing` produced `Piste des bêtes` as the next primary title over a passive copied audience backdrop. DOM residue was zero cinematic overlays and zero videos, with one static snapshot and one Journey modal.
4. Continuing reached the real `Meute affamée` tactical CombatStage with no Journey canvas above it. The explicit `cin6a=golden` DEV QA selector was used to complete the actual encounter through its Victory control and campaign result bridge.
5. The first real branch played `refugees_approach` to natural end. Its final frame remained visible under a compact two-choice overlay containing the authoritative `Marchand blessé` and `Nid venimeux` RunSystem options. One click entered the selected node; the old route-choice buttons and Journey overlay were removed before its dialogue appeared.
6. Chrome console diagnostics contained no warnings or errors (only Vite connection debug messages).

Observed presentation gates:

- live canvas and real live motion: PASS;
- same-canvas natural final hold: PASS;
- dialogue UI and modal ownership: PASS;
- next-step hierarchy: PASS;
- passive no-black Journey boundary: PASS;
- real branch composition: PASS;
- route mutex/stale-control cleanup: PASS;
- combat handoff cleanup: PASS.

## Existing P0 visual audit

All 20 production masters were sampled at first/25%/50%/75%/last and reviewed against 18 fixed criteria. Results are recorded in `cinematic_visual_polish_audit.json` and the companion audit report.

- KEEP: 17;
- POLISH_RUNTIME: 0;
- REMASTER_MEDIA: 3;
- blocking CIN-6C defects: 0.

Deferred remaster queue:

- `lion_judgement`: add a guaranteed company representative in a future authorized remaster;
- `forest_journey_tension`: correct camera-driven scale inflation and improve the agency-safe final composition;
- `lion_trial_route_ending`: add a guaranteed surviving company representative in a future authorized remaster.

No third master was edited or generated.

## Validation

- focused cinematic/Journey/dialogue/finale/census/media Vitest: 31 files, 374 tests, all passed;
- final backdrop-cleanup regression after hardening: 4 files, 31 tests, all passed;
- dedicated pilot spec Vitest: 1 file, 5 tests, all passed;
- Python compositor tests: 5 passed;
- campaign census validator: PASS (64 entries; prioritized primary P0/P1/P2 = 17/9/0; ordered including reuse = 20/11/0);
- character scale validator: PASS (52/52);
- visual audit validator: PASS (20/20);
- Audience/Camp shot validators: PASS (3 shots/12 s and 2 shots/12 s);
- Audience/Camp media validators: PASS;
- all production media ffprobe: 20/20 PASS;
- final full `npm test`: `CONCURRENT_VFX_EXCEPTION` — 103 files total, 102 passed/1 failed; 2,144 tests total, 2,133 passed/11 failed; the same 11 `CasterMotionBackCompat` failures and no new failure;
- TypeScript: PASS (`npx tsc --noEmit`);
- production build: PASS (114 modules; existing large-chunk warning only);
- diff check: PASS;
- secret audit: PASS — `.env.local` ignored/untracked, key present but absent from tracked files, no Authorization/Bearer secret in the diff, temporary production/review directories ignored.

## Scope and truth audit

- RunSystem/topology changed: NO;
- dialogue content/effects changed: NO;
- combat runtime changed: NO;
- save schema changed: NO;
- runtime AI/provider code added: NO;
- Journey production default changed: NO;
- TravelView production default preserved: YES;
- canonical character PNGs modified: 0;
- concurrent VFX registry modified by CIN: NO.

## Known limitations and operator gate

Automated structure, offline frames, media decode, and normal-Chrome presentation all pass, but final artistic acceptance belongs to the operator. In particular, the operator must approve character scale, Audience political geography, Camp locomotion/environment life, compact Journey UI, and no-black backdrop continuity.

Manual route:

`http://127.0.0.1:5173/?journey=cinematic`

```text
NEW CHRONICLE
→ Camp Departure: inspect movement, feet, scale and environment
→ natural end: inspect compact Audience d’Alaric next-step panel
→ Continue
→ Alaric Audience: inspect both factions and safe framing
→ natural end: inspect lion_briefing over the held frame
→ finish briefing
→ inspect Piste des bêtes as the primary next title over a passive, nonblack backdrop
```

Branch route for DEV QA:

`http://127.0.0.1:5173/?journey=cinematic&qa=1&cin6a=golden`

Continue through the first combat and refugee event; allow `refugees_approach` to end naturally and inspect the real two-route overlay.

- `READY_FOR_OPERATOR_VISUAL_ACCEPTANCE: YES`
- `READY_FOR_CIN_6C: NO — PENDING OPERATOR VISUAL ACCEPTANCE`
