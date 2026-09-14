# Option C Phase 4A — operator review sheet

Pilot: `FOREST_ROAD + KESTREL`

Status: `APPROVED_DEV_PILOT`

Operator decision: `APPROVED_DEV_PILOT`

Operator decision required: `NO — decision recorded 2026-09-13`

Production promotion: `NONE`

Open the visual comparison board: [operator-review-board.png](../composites/operator-review-board.png) or [interactive HTML board](operator-review.html).

The checkboxes below are intentionally blank and operator-controlled.

## Environment family

| Category | Artifact | Status | Operator decision |
| --- | --- | --- | --- |
| Forest Road master | [visual master](../masters/forest-road-visual-master-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Travel | [travel candidate](../environment/forest-road-travel-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Tableau | [tableau candidate](../environment/forest-road-tableau-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Strategic Combat | [strategic candidate](../environment/forest-road-strategic-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Combat Stage | [combat-stage candidate](../environment/forest-road-combat-stage-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |

## Kestrel master and pose authorities

| Category | Artifact | Status | Operator decision |
| --- | --- | --- | --- |
| Kestrel master | [three-view transparent master](../characters/kestrel-option-c-character-master-dev.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Idle pose | [768×768 idle](../characters/poses/idle/kestrel-idle-1.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Dash pose | [768×768 grounded dash](../characters/poses/dash/kestrel-dash-1.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Attack pose | [768×768 bow attack](../characters/poses/attack/kestrel-attack-1.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Cast / skill pose | [768×768 precision shot](../characters/poses/skill/kestrel-skill-1.png) | `DEV_CANDIDATE` | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |

## Animation pilot

| Category | Artifact | Status | Review note | Operator decision |
| --- | --- | --- | --- | --- |
| Idle animation | [transparent sheet](../animations/idle/processed/sheet-transparent.png) · [8-frame preview GIF](../animations/idle/processed/animation.gif) | `DEV_CANDIDATE` | Deliberately low amplitude; visibly distinct but subtle at battle scale. | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Dash animation | [transparent sheet](../animations/dash/processed-retry/sheet-transparent.png) · [8-frame preview GIF](../animations/dash/processed-retry/animation.gif) | `DEV_CANDIDATE` | Grounded tactical burst; corrected version has no cell bleed. | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Attack animation | [transparent sheet](../animations/attack/processed-retry/sheet-transparent.png) · [8-frame preview GIF](../animations/attack/processed-retry/animation.gif) | `DEV_CANDIDATE` | Anticipation, nock/draw, release and recovery remain readable without VFX. | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |
| Cast / skill animation | [transparent sheet](../animations/skill/processed-retry/sheet-transparent.png) · [8-frame preview GIF](../animations/skill/processed-retry/animation.gif) | `DEV_CANDIDATE` | Precision/zenith-shot technique; no generic magic or baked VFX. | [ ] KEEP &nbsp; [ ] REVISE &nbsp; [ ] REJECT |

## Cross-surface composites

- 1920×1080: [Travel](../composites/1920x1080-travel.png), [Tableau](../composites/1920x1080-tableau.png), [Strategic](../composites/1920x1080-strategic.png), [Combat Stage](../composites/1920x1080-stage.png)
- 1366×768: [Travel](../composites/1366x768-travel.png), [Tableau](../composites/1366x768-tableau.png), [Strategic](../composites/1366x768-strategic.png), [Combat Stage](../composites/1366x768-stage.png)

## Explicitly rejected history

| Candidate | Status | Reason |
| --- | --- | --- |
| Opaque/checkerboard Kestrel correction | `REJECTED` | Baked RGB checkerboard; not real alpha. |
| Initial 2×2 pose board | `REJECTED` | Inter-cell overlap; dash reads airborne/platformer-like. |
| First dash animation sheet | `REJECTED` | Frame `[1,2]` touched a cell edge. |
| First attack animation sheet | `REJECTED` | Frames `[0,2]`, `[1,0]`, `[1,1]`, `[1,2]` touched cell edges. |
| First cast/skill animation sheet | `REJECTED` | Frames `[0,3]`, `[1,0]`, `[1,1]`, `[1,2]`, `[1,3]` touched cell edges. |

## Operator sign-off

Decision: `APPROVED_DEV_PILOT`

Notes: _______________________________________

Reviewer: operator authorization recorded in the Phase 4A task

Date: `2026-09-13`
