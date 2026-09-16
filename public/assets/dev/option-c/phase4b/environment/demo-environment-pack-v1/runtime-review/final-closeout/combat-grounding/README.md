# Option C Combat Stage grounding review

Approved plate pixels were not modified. Measurements are screenshot-space operator-review guides; runtime tuning is presentation-only.

| Stage | Viewport | Ground band before -> after | Actor / target baseline | Ground plane before -> after | Crop low | Common plane | Contact |
|---|---:|---:|---:|---:|---|---|---|
| forest_route_stage | 1366x768 | 207 -> 238 px | 541 / 551 px | 570 -> 548 px | YES -> NO | PARTIAL -> PASS | WEAK -> PASS |
| bois_clair_burning_stage | 1366x768 | 399 -> 376 px | 541 / 551 px | 545 -> 548 px | NO -> NO | PASS -> PASS | WEAK -> PASS |
| lion_sanctum_stage | 1366x768 | 146 -> 253 px | 541 / 548 px | 622 -> 548 px | YES -> NO | FAIL -> PASS | INSUFFICIENT -> PASS |
| forest_route_stage | 1920x1080 | 292 -> 335 px | 760 / 774 px | 801 -> 771 px | YES -> NO | PARTIAL -> PASS | WEAK -> PASS |
| bois_clair_burning_stage | 1920x1080 | 562 -> 529 px | 760 / 774 px | 767 -> 771 px | NO -> NO | PASS -> PASS | WEAK -> PASS |
| lion_sanctum_stage | 1920x1080 | 205 -> 356 px | 760 / 771 px | 875 -> 771 px | YES -> NO | FAIL -> PASS | INSUFFICIENT -> PASS |

## Concise diagnoses

- **forest_route_stage**: The former crop held the first convincing masonry contact band below both feet. The reviewed fit exposes more foreground stone and the pitched, enlarged contact shadows close the residual quadruped/hero gap without narrowing the VFX lane.

- **bois_clair_burning_stage**: The road perspective was already usable, so the correction preserves it. The brighter wet surface needed the strongest contact-shadow opacity; the reviewed fit keeps a broad, clean center lane and makes both silhouettes read as weight-bearing.

- **lion_sanctum_stage**: The former fit placed the Stage baseline against midground vegetation roughly one tenth of the frame above the terrace. The per-plate vertical fit now meets the shared foot line, reveals one third of the frame as floor, and retains clear overhead VFX space.

COMBAT_STAGE_FOREST_ROUTE_GROUNDING = PASS
COMBAT_STAGE_BOIS_CLAIR_GROUNDING = PASS
COMBAT_STAGE_LION_SANCTUM_GROUNDING = PASS
COMMON_GROUND_PLANE_READABILITY = PASS
ATTACKER_LEFT_TARGET_RIGHT = PASS
FLOATING_IMPRESSION_REMOVED = PASS
IMAGE_REGENERATION_USED = NO
RUNTIME_CHANGED = YES
GAMEPLAY_CHANGED = NO
COMBAT_LOGIC_CHANGED = NO
