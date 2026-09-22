# T0 content interaction audit

Convergence baseline: `a9a74ff637945cf0c180b4f9c8e012916ba8b41e`, branch `campaign-structure-1`.
The world-v1 architecture, camera, canonical story content and saves remain authoritative. Four new sibling environment assets stage optional narrative encounters across the roadway, with occupied far verge and foreground. Nomad/resting/selected-route intervals are broadened for presentation; adjacent sections still meet without gaps. The former short standalone outpost interval becomes forest breathing room after Cedric; the outpost asset remains the combat branch variant. Opening Ambush and original source art are preserved.

| Actual beat ID / content ID | Label | Old category | Final category | Authority | Required? | Lane / scope | Contact | Transition |
|---|---|---|---|---|---|---|---|---|
| `t0:stage:0:lion-opening-ambush` | Piste des bêtes | campaign-node / mandatory confirm | MANDATORY_EVENT | canonical `lion-opening-ambush` | mandatory | both lanes, accepted corridor set piece | brake, hold, Continuer | shared event cover; canonical combat/dialogue; same-session reveal/restart |
| `t0:npc:roadside-merchant` | Marchand itinérant | npc / optional confirm | OPTIONAL_EVENT | local presentation; Character V2 `wounded_merchant` | optional | upper roadside actor; route-wide decision | Rencontrer / Ignorer | local encounter cover/reveal; ignore drives past before bypass |
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

Pickups contact at the truck front rather than the modal stopping coordinate. They never enter DECISION/LOCAL_INTERACTION, never use a curtain, and never write persistent rewards. Feedback is a compact icon, amount and resource name for 1.35 seconds; preview-local semantics remain internal. Obstacles use safe non-damaging preview collision, with a brief warning on contact and no narrative marker or panel.

Timing family: 400 ms brake/restart, 120 ms hold, 360 ms cover/reveal, smoothstep curtain easing. Wheels and all road elements use the same travelled distance. Fork branch authority stays unset before full cover; no extra generic confirmation.

## Reference convergence presentation audit

Ratios below refer to visible sprite silhouettes relative to the truck, checked in Chromium, not raw PNG dimensions. Browser comparison captures and live recordings are in `../convergence/`.

| ID | Category | Visual scale / staging | Engagement and labels | Transition | Authority |
|---|---|---|---|---|---|
| `t0:stage:0:lion-opening-ambush` | MANDATORY_EVENT | Accepted route-wide corridor preserved; formation 52% | both lanes; Continuer only | brake, focus, cover, canonical scene, covered return | unchanged canonical node / RunSystem |
| `t0:npc:roadside-merchant` | OPTIONAL_EVENT | 66% human; full merchant halt with awnings, stalls, banners and near-verge baggage | both lanes; Rencontrer / Ignorer | shared cover/reveal; bypass only after passing | unchanged local encounter / Character V2 |
| `t0:stage:1:lion-nomad-crossroads` | OPTIONAL_EVENT | 66% human; 1600-unit ruined waystation with canvas shelter and map table, integrated with both road lanes | both lanes; Rencontrer / Ignorer | canonical event / same-position return | unchanged Cedric encounter |
| `t0:stage:2:lion-refugees` | OPTIONAL_EVENT | 66% mother carrying infant; 1600-unit full camp, tents/fire on far verge and belongings framing near verge; lead-in/core/lead-out | both lanes; Rencontrer / Ignorer | same-position return; refused location persists | unchanged mother/child encounter |
| `t0:enemy:wolf-scouts` (`wolf_pack`, `spider_nest`, `forest_patrol`) | OPTIONAL_COMBAT | 58% creatures / 66% humanoids; canonical formations | lane contact; Combattre / Fuir | short fade to existing generic combat; physical assisted flee | unchanged seed-selected generic combat |
| `t0:loot:road-cache` | PICKUP | 34% chest; new HD painted wood/iron closed and open states on shared canvas, grounded opening and sparkle reaction | bumper contact; no decision | none; compact +1 provision | local preview reward only |
| `t0:loot:gold` | PICKUP | high-contrast 19% coin cluster; one existing +5 pickup | bumper contact; no decision | none; compact coin +5 | local preview reward only |
| `t0:booster:lion-ward` | PICKUP | 32% ward | bumper contact; no decision | none; compact +1 garde | local preview reward only |
| `t0:obstacle:broken-cart` | SIMPLE_OBSTACLE | 49% debris silhouette | lane avoidance; no decision | none | unchanged safe preview collision |
| `t0:stage:3:lion-first-trial-event+lion-first-trial-combat` | ROUTE_CHOICE | existing fork terrain; 68% persistent sign with two directional boards | both lanes; direct current RunSystem labels | stop/focus, selected highlight, full-cover commit, reveal/restart | unchanged RunSystem branch authority |
| `t0:branch:lion-first-trial-event` | OPTIONAL_EVENT | 66% canonical subject; 1600-unit damaged caravan scene with wreck, shelter and foreground debris | both lanes; Rencontrer / Ignorer | canonical event / same-position return | unchanged adaptive mystery_help / mystery_treasure |
| `t0:branch:lion-first-trial-combat` | OPTIONAL_COMBAT | 58% creatures / 66% humanoids; broader outpost environment | lane contact; Combattre / Fuir | existing canonical combat / same-position return | unchanged adaptive branch combat |

The isolated DEV entry now visibly leaves the real Travel View under the same 360 ms fade. Truck entry spans 760 ms after the initial 120 ms hold; the road remains fixed until entry finishes. Global event/combat handoffs use the Traversal fade family rather than the unrelated long combat wipe. End-of-route completion remains under cover until Travel View is mounted. Production rollout remains disabled.

## Verification

See scenario reports and screenshots under this directory; the final report records exact checks and any limitations. Baseline QA folders are not overwritten. Work remains uncommitted and unpushed for operator review.
