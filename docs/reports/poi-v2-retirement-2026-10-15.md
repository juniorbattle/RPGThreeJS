# POI V2 and physical-engine retirement

| Field | Value |
| --- | --- |
| TASK | POI-V2-AND-TRAVERSAL-RETIREMENT |
| DOMAIN | Campaign / UI / compatibility / retirement |
| BASELINE | dev@b79063bb4d96636198e93d61b7b3dd1110dab6e2 |
| BRANCH | dev |
| HEAD | See coherent delivery commits in Git; no self-reference |
| STATUS | IN_PROGRESS |
| MERGED_IN | NONE; direct authorized dev checkpoints |
| SUPERSEDES | NONE; older scoped proofs remain historical |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Pending A/B/C/D implementation |
| CANONICAL_DOCS_UPDATED | Operator ledger and reviewed contract set1.3.0 |
| EVIDENCE | Pending current native proof; no runtime/art PASS |

## Approved decision and contract gate

OD-2026-10-15-A authorizes the exceptional manual mission. Both full operator attachments are preserved in docs/autonomy. Independent `contracts-guardian` actual-diff review PASS on2026-10-15: six changed contracts, README/manifest1.3.0; constitution, media and combat contracts unchanged. Corrections ensure map selection alone grants no completion and trial bypass cannot open first refuge. Validator8contracts/8slots and diff-check PASS. Amendment is a decision, not runtime acceptance. All twelve compliance rows PASS for amendment scope only; runtime, V6, art and retirement remain pending.

## First-phase topology

CURRENT FACT at starting HEAD: directed recovery graph:

```mermaid
flowchart LR
 camp[lion-camp] --> audience[lion-audience] --> ambush[lion-opening-ambush] --> cross[lion-nomad-crossroads] --> refugees[lion-refugees]
 refugees --> event[lion-first-trial-event] --> refuge[lion-first-refuge]
 refugees --> combat[lion-first-trial-combat] --> refuge
```

The initial map adds crossroads→trial connections only after an explicit refugee bypass. V2 authorizes these as actual local geography once the mandatory crossroads is resolved, retaining the directed recovery graph:

```mermaid
flowchart LR
 camp[lion-camp] --- audience[lion-audience] --- ambush[lion-opening-ambush] --- cross[lion-nomad-crossroads]
 cross --- refugees[lion-refugees]
 cross --- event[lion-first-trial-event]
 cross --- combat[lion-first-trial-combat]
 refugees --- event
 refugees --- combat
 event --- refuge[lion-first-refuge]
 combat --- refuge
```

Required facts: audience, actual opening victory, resolved nomad encounter, one actual exclusive trial. Refugee bypass is optional and once-only; skipped refugee remains revisitable. No new content IDs, chest, elite or reward placement is approved.

## Lot A implementation and first native finding

Product checkpoint `ca78057` published normally to origin/dev. RunSystem adds two authored local connections after all three mandatory corridor facts; all three outgoing contents are reachable at the crossroads. Direct trial selection applies the existing refugee-ignore consequence once through RunSystem. Required trials no longer expose bypass; actual resolution gates refuge. Old earned refuge flags/resolution preserve progression. Directed recovery graph,21IDs and V6 schema remain intact. Mechanical36current focused tests/types/build/contracts PASS; independent source/assertion review PASS.

Fresh native `poi-v2-first-refuge-0752` on5440: actual opening victory2rounds19actions and nomad dialogue, then **FAILED/NOT_ACCEPTED** at unchanged exact backtracking assertion. Result digest `fcfa4c03daa4b7e477c2e8920125687fcc7def6528539722f5d83acdd27bec5e`; provenance stable; no injection. Newly exposed unvisited trials initially received mandate-specific hints, but ID-only rematching replaced those hints on the next selector. Content IDs/resources/outcomes did not change; full saved-node stability still failed. The failed job is retained and unseedable.

Correction preserves a fully materialized graph node whose durable assignment already matches its content ID. Differing legacy assignments retain the existing restoration path. New full-graph mandate/backtracking/exactV6 regression plus57other focused tests pass; build PASS. Independent guardian correction review PASS. The native assertion is unchanged; fresh native rerun pending.
