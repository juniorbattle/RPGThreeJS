# Revised dedicated scope: reload the last actual save on defeat

Status: **TARGET CLARIFIED; dedicated amendment/runtime execution pending**. Revision3,18October2026, chat01a14e6a, OD-2026-10-18-B. This supersedes both the retain-gains-after-defeat proposal and the later requirement for a separate refuge/checkpoint snapshot. The operator explicitly says the reference is the last SAVE, with current autosaves and potentially multiple manual slots later. No protected contract or runtime changes are performed by this document.

## Exact rule

On ordinary or elite defeat, reload the last valid saved state of the active game. All gameplay facts return together to that recorded state: location, gold/items, spending/consumption, party/HP/equipment/upgrades/recruitment, shops, reputation/flags/choices/resolutions, graph/seed/assignments and expedition/elite/reward context. Only changes since that save are undone. A gain already genuinely saved remains, together with its resolved/once-only attribution facts; no reward may be retained while its source is reset to unclaimed. Preserve current accessibility preferences separately. No XP system or percentage penalty is added.

One usable wallet/inventory during play remains the desired economy presentation. It must be paired with exact saved-state restoration, not unconditional gain retention plus partial relocation. Quantities, prices, encounter configurations and authored content stay unchanged.

## Save semantics

- Current scope: restore the actual autosave through its existing validation/migration owner; do not manufacture a past refuge snapshot from checkpointNodeId. The current code already serializes full game state, but its defeat paths subsequently call failRunToCheckpoint, altering that saved state instead of simply restoring it. Those ordinary/elite boundaries are the real runtime change to review.
- Defeat must never overwrite the good reference save with the lost/post-defeat state. Reward and its once-only facts must be saved atomically; interrupted save/load cannot duplicate attribution.
- Manual multi-slot support is future scope, not automatically implemented now. Keep slots independent and scoped to the selected game/save context. Later explicit loading of a slot chooses the active context; do not silently load the newest slot from another game or overwrite other slots on defeat. Exact auto/manual priority and metadata are designed with that feature.
- A manual mid-route save is a legitimate future restore reference; it is not restricted to safe camp/refuge locations. Separate checkpoint capture/preparation-refresh/mid-route legacy fallback designs from revision2 are withdrawn as mandatory requirements.
- Preserve old/current/terminal V6 compatibility and existing auto/manual save validation. Use the real saved payload, never reconstructed historical party/resources. Corrupt/missing save behavior must be explicit and must not invent gains or a victory. No unnecessary recursive snapshot or extra checkpoint sidecar is required by this target.

## Dedicated implementation boundaries

Proposed task PRODUCTION-CONTRACTS-LAST-SAVE-RELOAD-1, proposed set1.5.0: actual amended-rule review, approved contract commit and new immutable operational baseline before runtime. Current1.4.0/f9d8fde3 remains unchanged here. Narrowly adapt defeat/temporary-loot/elite-retention rules in constitution, campaign, POI, combat and QA; preserve unrelated contracts, eight videos, canon, owners and audio deferral.

Route both defeat paths through the same save-restoration owner, removing synthetic post-load relocation/partial cleanup that contradicts exact restore. Reconcile unified wallet/shop/reward attribution without price or reward changes. Do not introduce manual multi-slot UI/schema solely because the rule must remain compatible with that future feature.

## Verification

Exact all-gameplay-field equality to the real reference save after ordinary and elite defeat; gains/spending/consumption since save undone; saved reward and saved resolved flag retained together; repeated defeat/reload cannot farm; current HP/party/shop/seed/elite state restored consistently. Verify interruption/idempotence, existing V6 migration and preserved preferences. Future slot tests must isolate games and never overwrite unrelated saves. Use existing successful earned lineage and real native defeat/reload, no failed seed or injected result.

This is a corrected rule/proposal only. Runtime and LOCKED contracts are not changed or accepted by this revision. Prior POI pawn/path scoped evidence remains valid in its original scope.
