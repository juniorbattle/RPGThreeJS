# Revised dedicated scope: immediate use with full checkpoint rollback

Status: **TARGET CORRECTED BY OPERATOR; dedicated amendment/runtime execution pending**. Revision2,18October2026, chat01a14e6a. The earlier proposal to retain post-checkpoint earnings after defeat is explicitly rejected and must not be implemented. No LOCKED contract or runtime changes are authorized by this proposal document itself.

## Exact operator clarification

The operator rejects profitable defeat/accumulation and requests reloading the party at the last checkpoint, before defeat. Gains may be usable during the current attempt, but a loss restores the actual saved checkpoint state. This replaces the earlier keep-earned-gains proposal; it is not an approval of unconditional permanent loot.

## Correct target rule

One spendable wallet/inventory during an attempt. On ordinary or independent elite defeat, atomically restore the complete gameplay snapshot captured at the last actual safe checkpoint. Roll back post-checkpoint gains AND spending/consumption, HP/party/equipment/upgrades, recruitment, shop stock, reputation/history, flags, choices/resolutions/bypasses, graph/seed/assignments and expedition turn/positions/elite defeats/reward attribution together. Replaying after restore cannot keep rewards or purchases from the abandoned attempt. Current accessibility/preferences remain outside gameplay rollback. There is no XP/level progression to add or penalize.

No arbitrary percentage loss, new reward, cost, combat configuration, canon or checkpoint location. Do not retain an elite defeat or resolved chest while reverting its reward, or retain its reward while restoring the encounter. Within each live timeline, existing exactly-once attribution still applies.

## Current verified source gap

runStateSchema stores checkpointNodeId but no full checkpoint snapshot. SaveRepository has latest auto/manual saves. Both defeat paths load latest autosave then failRunToCheckpoint: relocation, temporary-loot cleanup and selected branch/pending cleanup do not restore all prior checkpoint facts. secureRunLoot both merges temporary holdings and advances checkpointNodeId, so calling it after every reward would be an incorrect shortcut.

## Concrete dedicated task boundaries

1. Proposed task PRODUCTION-CONTRACTS-CHECKPOINT-ROLLBACK-1, proposed set1.5.0. Review the exact amendment independently, commit it, establish its immutable baseline operationally, then implement. Current1.4.0/f9d8fde3 remains unchanged here. Narrowly amend constitution/campaign/POI/combat/QA rules for temporary-until-refuge, recovery and elite-defeats-survive-defeat; preserve unrelated rules, eight slots and audio deferral.
2. RunSystem/save owners capture a durable, run-bound, versioned full gameplay checkpoint snapshot without recursive snapshots or mismatched independent sidecars. Both defeat paths use one restoration owner. Presentation never restores or credits resources.
3. Concrete proposed capture timing: fresh-game starting baseline, then existing safe camp/refuge checkpoints after canonical entry is resolved. Accepted preparation transactions while remaining at that same secured checkpoint refresh its gameplay snapshot; route rewards, manual mid-route saves and ordinary autosaves never advance or overwrite the checkpoint snapshot. Preserve existing checkpoint locations.
4. Auto/manual save and reload retain the actual checkpoint snapshot and current-attempt state independently. Reload/restore is atomic and idempotent. Interrupted chest/result/elite/transition states cannot duplicate attribution or replace the safe snapshot with an unfinished encounter.
5. Old/current/checkpoint/terminal V6 remain loadable. Bootstrap a snapshot only from an actual valid same-run safe checkpoint state when available. A mid-route legacy save contains no reconstructible historical checkpoint. Preserve its current facts and disclose transitional legacy recovery until a real safe checkpoint establishes the snapshot; retain legacy temporary-loss protection too. Do not unify legacy rewards into retained permanent holdings while keeping old recovery, fabricate past history or silently promote a mid-route position into a checkpoint. Terminal saves stay terminal; no old lost reward is reconstructed.
6. Once an authentic snapshot exists, existing reward owners credit the unified spendable wallet/inventory. Reconcile buy/sell/equip/consume/forge and special payment choices without amount/price changes. A defeat restores those transactions together, eliminating gain retention from the abandoned attempt.

## Required verification

Focused snapshot serialization/run-identity/nonrecursive validation, capture eligibility and preparation refresh, exact full restoration of every gameplay field, both defeat paths, pending rewards/idempotence, repeated restore/reload, oldV6 missing-snapshot handling and preserved preferences. Test gain->purchase/use->defeat->restore and repeated loss cycles proving no net accumulation; no invented XP system. Retain seeded encounter determinism within the restored timeline.

Use successful earned save/proof and existing native runners for bounded real reward/use/defeat/reload verification. No failed seed, injected outcome or fabricated historical snapshot. Types/build/8contracts8slots/immutable amended baseline/guardian/capture review required. Historical proofs retain original scopes and are not rewritten as acceptance of this new recovery rule.

## Execution status

This revision records the corrected intended rule, not an implementation or new acceptance. It supersedes every pending request to approve retention of post-checkpoint gains after defeat. The independent delivered POI pawn/paths/Wait UI remains accepted in its previous scope.
