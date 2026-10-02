# Eight-slot cinematic remaster preparation

Status: **IN_PROGRESS**, queue item 8, 2026-10-02 UTC. T3 is COMPLETE/PASS in its production report; item 3 cinematic alignment remains complete. This task concerns artistic/technical replacement of the existing eight videos, not additional slots.

[Production brief and byte inventory](../../tools/cinematics/specs/production_eight_slot_remaster_brief.json) records the current eight descriptors, fallback text, byte sizes, SHA256 hashes, locked constraints and integration QA plan. Existing MP4 bytes, registry/generator and historical sources were not modified. Descriptor durations below are current runtime metadata, not yet measured stream timings or a new duration approval.

| Approved slot | Existing descriptor ms | Current bytes | Remaining preparation |
| --- | --- | --- | --- |
| camp_departure | 12000 | 14245824 | Shot/context review pending; asset generation blocked |
| alaric_audience_arrival | 12000 | 12340443 | Shot/context review pending; asset generation blocked |
| bois_clair_arrival | 20000 | 25714244 | Shot/context review pending; asset generation blocked |
| bois_clair_saved | 18000 | 21378564 | Shot/context review pending; asset generation blocked |
| bois_clair_sacrificed | 18000 | 20858964 | Shot/context review pending; asset generation blocked |
| lion_judgement | 17000 | 21565194 | Shot/context review pending; asset generation blocked |
| serpent_route_ending | 18000 | 16058120 | Shot/context review pending; asset generation blocked |
| lion_trial_route_ending | 20000 | 19773930 | Shot/context review pending; asset generation blocked |

No video-generation capability is exposed in this run's tool catalog. Raster image generation cannot supply authored motion; ffmpeg/ffprobe were not found on PATH. This blocks asset generation only. Read-only probing/frame extraction, canonical trigger/cast/environment/hold review, per-slot shot specifications and integration/fallback QA remain to do. No fake motion clip, global cast remaster, new story or audio brief is authorized. Current video artistic acceptance has not been assessed by this inventory.

Next action: locate a read-only MP4 probe/extraction capability (bundled Python/video libraries or an existing local executable), record actual stream metadata and first/middle/final frames under ignored tmp/cinematics/eight-slot-remaster. Read current approved GameApp triggers/production registry and canonical character/environment sources before completing each slot's shot brief. Preserve current playback and all eight source hashes until actual replacement media can be produced and accepted. Do not regenerate from the historical 31-video audit/queue.

Contracts read: GAME_CONSTITUTION, contract set v1 and all eight LOCKED contracts. Constitution/character/environment/narrative/save/QA/repository boundaries are PASS for this read-only inventory/preparation. Artistic replacement and final media acceptance remain BLOCKED by an external video tool; per-slot specs/QA remain IN_PROGRESS. No LOCKED rule changed. Audio remains DEFERRED.
