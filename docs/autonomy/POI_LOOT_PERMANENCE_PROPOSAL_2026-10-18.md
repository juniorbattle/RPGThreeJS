# Proposition dédiée : gains immédiatement définitifs

Status: **PROPOSED — dedicated operator approval pending**. This document is a concrete proposal, not an approved contract amendment or permission to change runtime. Source: direct operator feedback in chat01a14e6a,18October2026, after the POI declutter checkpointee252d1. The operator wants to avoid provisional loot because it appears usable from the menu.

## Current verified behavior

Management buyItem can spend the temporary wallet, but puts that purchase in the temporary inventory. Equip/use/upgrade/craft/rest use permanent inventory/gold. Temporary-wallet sales remove permanent stock and credit temporary gold. Thus immediate shop spending is distinct from secured ownership. secureRunLoot merges and clears the temporary pool **and advances checkpointNodeId**. failRunToCheckpoint clears remaining temporary loot. These are existing approved rules, not UI labels alone.

## Exact proposed replacement rule

All genuinely earned gold, materials, consumables and equipment become permanent immediately when their existing owner attributes them. They are available to existing menus immediately and are not removed by defeat. Defeat keeps its existing health/party/campaign recovery and returns to the existing checkpoint. A reward, chest, purchase or elite victory must never establish a new checkpoint merely by making gains permanent.

Display one gold balance and permanent inventory. Remove the separate provisional balance from the POI header and obsolete temporary-wallet guidance. Preserve every reward quantity, price, cost, formation, enemy configuration, encounter seed, once-only fact, recruitment and canonical choice. This changes reward retention and risk, so the prior economy/art/balance verdict is not automatically extended.

## Dedicated implementation boundaries

1. Contract task before runtime: proposed ID PRODUCTION-CONTRACTS-IMMEDIATE-LOOT-1, proposed set1.5.0. Review the exact delta independently, commit the approved amendment, then establish its committed immutable baseline in a separate operational checkpoint. Only then adapt runtime/tests. No protected document is changed by this proposal.
2. Narrowly supersede temporary-until-refuge and unsecured-loot-loss rules in GAME_CONSTITUTION, CAMPAIGN_AND_STATE, TRAVERSAL, COMBAT_AND_VFX and AUTHORING_AND_QA. Review any UI wording that depends on those rules. Preserve all unrelated rules, eight video IDs, canon, current maps, truth owners, audio deferral and physical-engine retirement. Record explicitly superseded parts of prior economic decisions; retain historical reports unchanged.
3. RunSystem/campaign/reward owners credit the existing permanent wallet/inventory once. Separate consolidation of a compatibility loot pool from checkpoint advancement. Never call secureRunLoot after every reward as a shortcut.
4. Old/current/checkpoint/terminal V6: transfer only the actually saved remaining temporary pool into permanent holdings once, then zero that pool. Repeated loads/roundtrips must not duplicate it. Preserve durable IDs, current/checkpoint locations, resolved/bypassed/visited facts, recruitment, existing holdings and outcomes. Never reconstruct rewards lost before this change or infer an unearned reward. Retain old V6 compatibility fields as inert/empty if that avoids unnecessary schema churn.
5. Pending chest attribution, ordinary/elite victory and interrupted result/reward screens must retain idempotence. Already attributed saved rewards transfer exactly once; pending events stay pending until their actual owner resolves them. No victory or loot injection.
6. Route/refuge buy/sell flows use the unified permanent wallet and inventory; equip, consume, upgrade and forge use those same real holdings. Temporary-wallet arguments/callers are reconciled explicitly. Existing special payment choices keep their original amount, affordability and once-only effects.
7. Refuge/checkpoint advancement remains at exactly its existing authorized boundaries, including old saves and defeat recovery. No new free healing, reset or checkpoint follows a chest, purchase or victory.

## Acceptance required after approval

Focused tests: all reward owners and duplicate-result rejection; unified shop buy/sell and immediate item use; old/current/terminal V6 conversion and repeated load; pending chest/elite/result resume; defeat retaining earned holdings while returning to the unchanged checkpoint; exact costs and once-only effects. Types, immutable amended-contract gate,8contracts/8slots, build and independent sensitive guardian review remain required.

Use an existing successful earned save/proof and existing native runner for a bounded actual reward→menu use→reload path. Demonstrate real defeat/recovery only where the changed retention rule requires it; no injected outcome or failed seed. Preserve all historical failed/successful receipts and scopes. Operator balance acceptance stays separate.

## Approval to give

Approve the dedicated task above to make all genuinely earned loot permanent immediately, retain it after defeat, and preserve recovery/checkpoint locations and all quantities/costs. Otherwise retain current rules and clarify their UI only. The independent path/pawn/Wait corrections do not depend on this decision.
