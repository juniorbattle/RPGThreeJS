# T0 content interaction audit

Baseline: `dd80b596a0ae22eb1fb9fc480341f189f37813fa`, branch `campaign-structure-1`.
The world-v1 section definitions, world assets, camera, canonical story content and saves remain authoritative and unchanged.

| Actual beat ID / content ID | Label | Old category | Final category | Authority | Required? | Lane / scope | Contact | Transition |
|---|---|---|---|---|---|---|---|---|
| `t0:stage:0:lion-opening-ambush` | Piste des bêtes | campaign-node / mandatory confirm | MANDATORY_EVENT | canonical `lion-opening-ambush` | mandatory | both lanes, accepted corridor set piece | brake, hold, Continuer | shared event cover; canonical combat/dialogue; same-session reveal/restart |
| `t0:npc:roadside-merchant` | Marchand itinérant | npc / optional confirm | OPTIONAL_EVENT | local presentation; Character V2 `wounded_merchant` | optional | upper lane alongside halt | Rencontrer / Ignorer | local encounter cover/reveal; ignore drives past before bypass |
| `t0:stage:1:lion-nomad-crossroads` | Croisement du rôdeur | campaign-node / lane confirm | OPTIONAL_EVENT | canonical Cedric encounter | optional | route-wide prompt; actor in lower lane | Rencontrer / Ignorer | canonical event and RETURN_TO_ROUTE; ignore deferred until passed |
| `t0:stage:2:lion-refugees` | Route des réfugiés | campaign-node / lane confirm | OPTIONAL_EVENT | canonical mother/child, Character V2 `refugee_mother` | optional | route-wide prompt, substantial upper roadside resting scene | Rencontrer / Ignorer | canonical event and RETURN_TO_ROUTE; ignore deferred until passed |
| `t0:enemy:wolf-scouts` / `wolf_pack` | Loups des sous-bois | enemy / optional confirm | OPTIONAL_COMBAT | local road encounter using existing generic combat config | optional | lower lane | other lane: no stop; contact: Combattre / Fuir | fight cover/generic combat/reveal; flee changes lane and passes visible enemies |
| same beat / `spider_nest` | Araignées de la forêt | enemy / optional confirm | OPTIONAL_COMBAT | seed-selected generic road combat | optional | lower lane | same rule, canonical spider formation | same combat transition |
| same beat / `forest_patrol` | Patrouille hostile | enemy / optional confirm | OPTIONAL_COMBAT | seed-selected generic road combat | optional | lower lane | same rule, canonical patrol formation | same combat transition |
| `t0:loot:road-cache` | Cache de route | loot / optional confirm | PICKUP | local preview reward | optional | lower lane, front-bumper contact | chest reaction, +1 preview provision, continues | none |
| `t0:loot:gold` | Pièces égarées | new simple collectible | PICKUP | local preview reward | optional | upper lane, front-bumper contact | +5 preview coins, continues | none |
| `t0:obstacle:broken-cart` | Débris de chariot | obstacle / optional confirm | SIMPLE_OBSTACLE | local preview | optional | upper lane | avoid with lower lane; contact safely passes with feedback, no damage | none |
| `t0:booster:lion-ward` | Garde du Lion | booster / optional confirm | PICKUP | local preview reward | optional | lower lane | +1 preview ward, continues | none |
| `t0:stage:3:lion-first-trial-event+lion-first-trial-combat` | labels supplied by RunSystem | fork / mandatory generic confirm | ROUTE_CHOICE | canonical RunSystem branch choice | required choice | both lanes, physical crossroads | brake then direct direction UI | cover, RunSystem commit at opacity 1, variant reveal, automatic restart |
| `t0:branch:lion-first-trial-event` / `mystery_help` | Marchand blessé | campaign-node / optional confirm | OPTIONAL_EVENT | canonical adaptive branch, Character V2 `survivor` (actual dialogue actor) | optional | route-wide prompt; upper roadside | Rencontrer / Ignorer | canonical event, same route return; bypass after passing |
| same branch beat / `mystery_treasure` | Chariot abandonné | campaign-node with misleading chest sprite | OPTIONAL_EVENT | canonical adaptive narrative choice, not a direct chest reward | optional | route-wide prompt; abandoned cart visual | Rencontrer / Ignorer; original story choices preserved | canonical event and same-route return |
| `t0:branch:lion-first-trial-combat` / `spider_nest`, `forest_patrol`, `serpent_reprisals` | Nid venimeux / Patrouille Serpent / Premières représailles | campaign-node / optional confirm | OPTIONAL_COMBAT | canonical adaptive branch combat, unlike local random enemies | optional | lower lane | avoid by lane or Combattre / Fuir | existing canonical branch combat and RETURN_TO_ROUTE; deferred bypass |

There is no separate additional wounded-person beat: `mystery_help` is that encounter. There is no invented recruit, item, or material authority; gold is the added micro-collectible. The local roadside merchant is distinct from the canonical wounded merchant, even though both use existing Character V2 art.

## Contact and authority rules

`type` remains the legacy visual subject kind. Required `category` governs interaction; `engagement` separates route-wide narrative situations from lane contacts. A refusal is presentation-local until the subject reaches the shared passed coordinate. Only then does RunSystem record an optional canonical bypass. The location renderer remains independent of actor consumption.

Pickups contact at the truck front rather than the modal stopping coordinate. They never enter DECISION/LOCAL_INTERACTION, never use a curtain, and never write persistent rewards. Feedback explicitly labels the preview-local gain. Obstacles use safe non-damaging preview collision.

Timing family: 400 ms brake/restart, 120 ms hold, 360 ms cover/reveal, smoothstep curtain easing. Wheels and all road elements use the same travelled distance. Fork branch authority stays unset before full cover; no extra generic confirmation.

## Verification

See scenario reports and screenshots under this directory; the final report records exact checks and any limitations. Baseline QA folders are not overwritten. Work remains uncommitted and unpushed for operator review.
