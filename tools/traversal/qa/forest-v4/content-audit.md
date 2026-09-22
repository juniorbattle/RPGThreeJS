# T0 content and participation audit

Baseline: `04e969eb2273efb9c844c9c78cfd31e2f471be85`. Final implementation and browser acceptance passed on 2026-09-20. Ready for operator review; uncommitted and unpushed. Production remains disabled. This is T0 preview acceptance, not authorization to promote assets or enable production.

| Canonical node / stage | Previous route classification | New classification | Lane behavior | Required? | Reason |
|---|---|---|---|---|---|
| `lion-opening-ambush` | Mandatory interrupt | Mandatory interrupt | Centered hostile formation and blocked corridor | Yes | Opening combat/tutorial formation |
| `lion-nomad-crossroads` | Mandatory interrupt | Optional interrupt | Lower lane | No | Cedric's secondary recruitment meeting; route completion does not require recruitment |
| `lion-refugees` | Mandatory interrupt | Optional interrupt | Upper lane | No | Mother/child humanitarian encounter; player may pass without inventing a narrative choice |
| T0 fork over `lion-first-trial-event` / `lion-first-trial-combat` | Overlay followed immediately by node entry | Required road selection; deferred encounter | Centered decision, then continued driving | Road selection only | RunSystem records branch choice separately from entering its event |
| `lion-first-trial-event` | Immediate selected branch interruption | Optional encounter later on selected branch | Upper lane | No | Existing `mystery_help` wounded-person / `mystery_treasure` variant; no new node or narrative rewrite |
| `lion-first-trial-combat` | Immediate selected branch interruption | Optional encounter later on selected branch | Lower lane | No | Existing secondary combat opportunity; opening ambush supplies the required combat |
| `lion-first-refuge` | Immediate entry on leg completion | Destination offered by Travel View after exit/fade | Major destination, outside lane gameplay | Next canonical destination | Physical leg completion is separate from explicit destination confirmation |

Only T0 participation metadata changed. T1–T4 node relations and participation modes remain unchanged. Node IDs, graph link order and narrative content are preserved. Optional bypasses live in RunSystem and never mark a node visited/resolved or apply event choices/rewards. Branch selection also lives in RunSystem, persists through the optional V6-compatible schema fields, and restricts later availability to the chosen branch. Traversal reads that choice rather than maintaining a second branch flag.

The local merchant, seeded basic enemy encounter, chest, cart and waystone have no canonical node binding. The generic combat bridge reuses authored enemy configurations with narrative hooks and rewards removed, returns to the same preview session, and does not call canonical combat resolution. Its current result is local victory/retreat only; persistent rewards, injuries and inventory consumption are not applied in this isolated preview.
