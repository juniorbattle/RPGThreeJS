# Operator correction: full checkpoint rollback

Run codex-checkpoint-rule-20261018T2040, started2026-10-18T20:40:13Z, clean992ab9d/no lock/inherited WIP. Host parity/process preflight, owned atomic lock/fetch. Current1.4.0/f9d8fde3 contracts unchanged; preview5438/scheduler untouched.

Direct reply to the prior approval question rejects retention of earned loot after defeat: « Le probleme c'est que cela peut etre rentable de perdre pour cumuler de l'or ... en clair on recharge notre partie au dernier checkpoint donc avant la defaite ». Record OD-2026-10-18-A as the corrected target. This is not acceptance of the previous retain-on-defeat proposal. [Revised scope](../POI_LOOT_PERMANENCE_PROPOSAL_2026-10-18.md).

Target: one usable wallet/inventory during an attempt; on loss restore the full actual checkpoint gameplay snapshot. Gains, purchases, spending/consumption, HP/party/equipment/upgrades/recruitment, shops, reputation/flags/choices/resolutions, graph/seed/assignments and expedition/elite/reward state revert together. Preserve preferences; no new XP/levels or percentage punishment. This prevents retaining gains from an abandoned timeline, whether by gold, bought items or already-defeated elite facts.

Independent read-only guardian/source mapping: types stores checkpointNodeId only, SaveRepository only latest auto/manual slots. Both normal and elite defeats load latest auto then failRunToCheckpoint, preserving many current facts. secureRunLoot also moves checkpoint; never call it after every reward. Full rollback requires a real durable snapshot, shared restore owner and V6/migration handling, not a UI label change.

Concrete proposed details: capture initial baseline and completed existing safe checkpoint; preparation transactions at that same secured refuge may refresh it, mid-route saves/rewards may not. Never reconstruct a historical checkpoint from an old location ID. Use actual same-run safe snapshot if available; otherwise preserve imported current state and legacy loss protection until a real checkpoint. Unified rewards without a snapshot would recreate the rejected exploit. Actual amendment must also narrowly replace elite-defeats-survive-defeat behavior.

Only correction of proposal/ledger/guide/paired state performed. No protected contract, source, save, economy, media or scheduler edit; no runtime/new native acceptance.325QA jobs and both deferred root objects remain exact. Whitespace/LOCKED/8contracts8slots gates; no unnecessary source/build/browser rerun. Counts runtime0/QA0/proof0/productGuide1/workflow5/inherited0/browser0. Source pawn/path acceptance from1935 retained.

Next: dedicated actual amendment/review/baseline then full-snapshot implementation/proof for this corrected rule. Never execute the old retain-gains proposal. Ordinary POI/PC work remains independent; final art/balance/hardware/global/mobile scopes stay open. Final normal dev publication/parity/owned lock release in automation memory.
