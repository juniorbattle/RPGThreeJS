# Lot E final — exploration, economy and mobile elites

Decision: **OD-2026-10-15-B**. Approved by the operator on 2026-10-15 (America/Toronto), in the explicit execution instruction following the preliminary review. Starting `dev`: `4c80196cf2eb87097f063f4f312756044f5a5e47`.

## Direct operator authority

The operator approves production of the complete Lot E: all twelve optional fixed POIs, the two independent mobile elites, Combat or retreat interceptions, exact connections and proposed balance as the production baseline. Execute the necessary dedicated LOCKED amendment, additive V6 compatibility, actual tactical encounters, all three atlas layouts and relevant native verification. Publish coherent checkpoints normally to `origin/dev` under existing standing authorization. A partial implementation is not final delivery. Operator artistic and felt-balance playtest remain separate from technical/native acceptance.

Normative sources: [full operator contract](../project/RPGThreeJS_LOT_E_CONTRAT_AUTHORING_FINAL_2026-10-15.md), [structured authoring annex](../project/RPGThreeJS_LOT_E_MANIFEST_AUTHORING_FINAL_2026-10-15.json), [execution directive](LOT_E_EXECUTION_DIRECTIVE_2026-10-15.md). Their original proposed/approval-boundary wording is preserved as source provenance; this explicit decision supplies that approval. The catalogue replaces inactive V1 proposals, not any canonical event.

## Dedicated amendment

`PRODUCTION-CONTRACTS-POI-LOT-E-1`, set **1.4.0**, extends CAMPAIGN_AND_STATE, TRAVERSAL, COMBAT_AND_VFX, UI_AND_ACCESSIBILITY, WORLD_AND_CHARACTERS and AUTHORING_AND_QA. Preserve the constitution, the eight-contract identity, all eight video slots, the 21 canonical IDs/content/rewards, tactical rules, shared resources, terminal campaigns and definitive physical Traversal retirement. Independent contracts-guardian review of the actual amendment precedes any runtime edit. Establish its immutable committed baseline in the subsequent operational checkpoint.

## Execution resolutions within the approved specification

- A cancelled front interception commits no movement and no map tick. The contract's "at most one" withdrawal tick is zero for this cancellation; an explicit Wait advances the patrol. A rear retreat is the recovery from an already counted map turn and adds no second tick. No redraw, activity completion or reload advances a threat.
- Front elite victory returns to the unchanged safe origin; the player chooses the now free destination normally. Rear victory leaves the player on the arrived POI. Neither activates or resolves the underlying content. An unresolved underlying optional POI remains explicitly openable after the encounter.
- Arrival content completes before a queued movement tick is evaluated; queued tick and encounter identity are durable gameplay facts, not serialized modal state. Reopening a pending choice reconstructs it without another tick. A committed victory and its reward are saved atomically before presentation resumes.
- A rear retreat uses a previously reached adjacent, accessible, inert safe POI only. If no such return exists, reject the elite's movement onto the player, retain its previous position and offer Wait or an explicit independent fight. Cancelled choices never apply refugee bypass or exclusive-branch facts.
- Use the annex's exact elite formations (valley: brute + raider; seal: skeleton + goblin + skeleton), existing unit stats/skills/poses and a declared existing tactical deployment limit. Calibration is encounter authoring and native measurement, never a global enemy-stat change. Any necessary Lot E balance adjustment must be recorded and reviewed; original campaign values remain intact.
- Separate reversible expedition geography from the directed canonical recovery graph. Optional resolutions never unlock the next canonical milestone. Refugee-ignore consequences also apply once when leaving an unresolved refugee behind via an expedition detour and genuinely committing to the first trial.

## Completion boundary

Independent actual-diff pre-runtime review: `contracts-guardian`, 2026-10-15, **PASS**. Exactly six contracts plus README/manifest; three operator source copies byte-identical to attachments; constitution, PRESENTATION_AND_MEDIA, AUTONOMOUS_WORK_PROTOCOL and src/tools/public unchanged. Validator8/8 and whitespace gate PASS. Operational state/baseline synchronization follows the amendment commit. This records contract review only, not runtime acceptance.

Technical delivery requires 33 fixed POIs, six once-only temporary-loot chests, six stable two-variant ordinary encounters, two persistent moving elite actors and independently resolved fights, all approved routes, safe collision/retreat/wait, additive old/current V6 and terminal stability, responsive accessible atlas/popup/modal, meaningful focused tests, types/build/contracts and reviewed native campaign proof. No injected outcome is player acceptance. Preserve failures and report exact earned battles, elite victories/avoidance, chests, route economy and old-V6 continuation. Human art and final balance remain **UNDECIDED** until operator playtest. Scheduler stays paused; `main` is never a publication target.
