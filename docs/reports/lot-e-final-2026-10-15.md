# Lot E Final — exploration, economy and mobile elites

| Field | Value |
| --- | --- |
| TASK | POI-LOT-E-FINAL |
| DOMAIN | Campaign, content, combat handoff, V6 saves, UI, atlas art |
| BASELINE | `4c80196cf2eb87097f063f4f312756044f5a5e47` on dev |
| BRANCH | dev |
| HEAD | See coherent checkpoints below; final acceptance pending |
| STATUS | Draft — implementation published, native milestone in progress |
| MERGED_IN | NONE — authorized direct dev checkpoints |
| SUPERSEDES | NONE; POI V2 retirement report retains its historical scope |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | 12 optional POI, six chests, six ordinary formations with two deterministic variants each, two independent mobile elites, three revised atlases |
| CANONICAL_DOCS_UPDATED | `docs/project/POI_NAVIGATION.md`, `docs/project/POI_V2_ART_AND_AUTHORING.md`; approved authoring annexes and OD-2026-10-15-B |
| EVIDENCE | Mechanical logs `tmp/lot-e/independent-qa-02/`, final builds and native jobs below; selected evidence promotion pending |

CURRENT FACT: this report remains a draft until the native complete campaign, exact economy and V6 boundaries are reviewed. A published implementation checkpoint is not full Lot E acceptance.

## Delivered behavior and authority

The approved catalogue adds exactly four optional destinations per region, preserving all21 canonical IDs and their directed recovery graph. Six once-only chests grant100 temporary gold and seven consumables. Six optional combat POI have12 independent seed-stable configuration IDs and fixed rewards totaling590 temporary gold,+4 reputation,7 red gems and9 iron ore. Canonical scripts, rewards and tactical runtime remain unchanged.

The two persistent mobile elites are separate from the33 POI. Their exact independent configurations award120/170 temporary gold,+1 reputation each,1/2 red gems and2 iron ore each. The existing tactical enemy definitions are reused; three deployed fighters give these independent elite formations their encounter limit. No boss or canonical dialogue is cloned.

RunSystem owns movement, Wait, tick settlement, interception, safe retreat and elite victory. Front interception occurs before movement; retreat cancels without a tick. Rear interception follows activity closure and may return to the recorded adjacent safe POI without a second tick or narrative replay. Elite victory changes only its own defeat/reward context, never resolves its underlying POI. Defeat uses the existing checkpoint and temporary-loot loss owner. GameApp coordinates the existing combat bridge and surfaces.

V6 migration adds missing optional nodes and the versioned expedition registry without rebuilding the canonical graph or changing old decisions, assignments, resources, checkpoints, recruitment, endings or historical traversalBranches. Terminal saves keep their terminal status without activating threats. The physical Traversal runtime remains retired; no video slot or audio work is added.

## Coherent checkpoints

- `f9d8fde3f721fdf8da4b1e56a56bc51f20f2fef8`: dedicated approved contract amendment, set1.4.0 immutable baseline.
- `62f630c`: four operational version/SHA references, after the operator's explicit limited approval.
- `efcd280590230045cb811c737915bfeb75187afe`: complete runtime, authored content, assets and focused tests.
- `3b80404`: finalized-receipt guards and intermediate native checkpoints; restrained threat pulse with both reduced-motion controls.

All listed checkpoints were published normally to origin/dev under OD-2026-10-12-A. Main remains protected. The earlier automatic refusal of governance-reference writes was resolved by the operator's explicit approval of those references only.

## Mechanical and independent review

Independent QA:206 tests across13 files, TypeScript, eight contracts/eight video slots and production build pass.27 expedition tests cover both seeded formations, additive historical V6 boundaries, unique grants, front/rear collisions, retreat, victory/defeat and bounded reachability over all16 resolution masks per elite zone. Eight GameApp integration tests cover real owner handoffs with a mocked bridge result; those tests establish lifecycle behavior, not native tactical victory or balance.

The bounded graph proof explicitly models successful activities and recovery. Native campaign proof below remains required. The existing QA helper's19 tests pass on the host; the restricted attempt failed on temporary Git-config permissions and is retained separately. Guardian reviews pass for the amendment, truth/save/combat ownership, graph proof and guarded native pilot. No later LOCKED change is made.

## Native results — review in progress

| Scenario | Result and limits |
| --- | --- |
| Direct I,1366 normal, `lot-e-direct-I-0001` | SUCCEEDED and independently inspected. One actual canonical opening victory, first refuge, exact autosave/reload,110 secured gold,51 reputation,0 temporary gold, no console errors. No new Lot E combat claimed by this scenario. |
| Complete I, `lot-e-complete-I-0001` | Interrupted worker, no final result/receipt. Partial patrol progress is not accepted or used as a seed. |
| Old V6 touch, `lot-e-oldV6-II-touch-0001` | Interrupted without final result. Assertion correction and new output used for retry; no failed/partial seed reused. |
| Moderate I,620/game reduction, `lot-e-moderate-I-0001` | SUCCEEDED, receipt SHA/provenance and captures independently reviewed. One new actual optional victory (`poi_opening_wolves_b`,5 rounds/32 actions),15-gold/antidote chest,205 secured gold/54 reputation at first refuge, exact V6 and no console errors. |
| Old V6 II,390/OS reduction, `lot-e-oldV6-II-touch-0002` | SUCCEEDED, receipt SHA/provenance and earned save independently checked. Two new actual canonical victories: Valmir6 rounds/45 actions, village defense54 actions; one opening battle inherited. Migration21→33 preserves canonical facts exactly,290 secured gold/83 reputation at Second refuge. No new optional fight claimed. |
| Moderate marsh,620/game reduction, `lot-e-moderate-marsh-0001` | SUCCEEDED and independently reviewed. New actual `poi_valley_marsh_b` victory,4 rounds/32 actions,90 temporary gold and exact reputation/materials, ether chest;205 secured gold/59 reputation. Optional checkpoint and reload exact. |
| Direct ending,390/OS reduction, `lot-e-direct-ending-touch-0001` | SUCCEEDED, receipt SHA/provenance and captures independently reviewed. One new actual `serpent_captain` victory,83 actions; three battles inherited. Completed `lion-seal-serpent-truth`,560 secured gold/100 reputation/zero temporary loot; exact earned-ending, autosave, owner-state, resumed ending and native menu return. No new Lot E fight claimed. |
| Optional defeat retry preparation, `lot-e-optional-defeat-0001` | Pilot dead end at the resolved optional checkpoint: its external route cursor was not inherited. Owned worker/descendants stopped, output unaccepted, successful source checkpoint retained. No defeat or product failure inferred. |
| Complete patrol,1366 normal, `lot-e-complete-patrol-0002` | SUCCEEDED and independently reviewed. New opening victory19 actions and new `poi_opening_patrol_a`35 actions, one forest potion chest, exact optional checkpoint/reload;150 secured+115 temporary gold/38 reputation. Remaining opening detour still pending. |
| Complete I continuation,1366 normal, `lot-e-complete-I-0003` | SUCCEEDED. One new actual wolves victory, both opening ordinary victories in the verified lineage, all four optional I nodes resolved. Arrival290 secured gold; subsequent canonical25-gold remedy offer leaves265 gold and one newly temporary potion. Exact refuge/reload and no console errors; independent terminal review pending. |
| Initial UI refreshes, `lot-e-ui-390-os-0001` / `lot-e-atlas-1920-normal-0001` | Header390 and full1920 atlas captures inspected, but scenario unaccepted: premature pilot preparation wait blocked the preceding native dialogue. Failure JSON retained, original PID/listener absent; launcher Stop-on-stderr preference prevented final error receipt. Guard and launcher corrected; these outputs never seed another run. |
| Remaining regional acceptance | Complete opening continuation, two elite victories/avoidance, remaining optional activities and final full exploration remain pending. |

Further finalized receipts: `lot-e-complete-marsh-0001` and `lot-e-complete-valley-loop-0002` succeed, with exact optional checkpoint/reload after the real marsh A and serpent A victories. All eight optional destinations in regions I/II are now resolved in one verified lineage; neither elite is yet defeated. A certified frontal retreat cancels at turn52, then explicit Wait advances52→53. `lot-e-optional-defeat-0003` succeeds with an actual solo tactical defeat:20 secured gold remains,210 temporary gold and all temporary inventory are lost through the existing checkpoint owner; exact V6 reload returns to First refuge. No outcome is injected.

The390 OS and1920 normal UI refreshes0002 succeed with readable header labels, all three atlases, exact preparation/reload and nonempty active-threat samples: OS reduction disables animation; normal motion retains the2.8s pulse. The620 game-reduction sample in the successful optional-defeat scenario independently disables the same active threat. Three inspected route polylines cross geographical obstacles; art-only bends are corrected and require fresh visual acceptance. `moderate-II-0002` remains FAILED because its pilot expected only road_to_valmir despite the actual allowed marsh_crossing variant. Its rear retreat is diagnostic evidence only; no failed output becomes a continuation seed. Exact graph-configuration and certified-lineage assertions replace that incorrect pilot expectation.

The direct-I receipt/result hash,90 native inputs and exact saved/resumed JSON were independently verified. Its three desktop atlas images loaded, controls measured at least44px,22 geometry samples reported no page overflow or label overlap. Scrollable map crops do not prove simultaneous visibility of every destination. The subsequent threat pulse is outside that earlier direct scenario's active-threat scope.

The two fresh first-region routes both start with150 secured gold, earn80 from the actual opening fight, recruit Cedric for50, help refugees for40 and help the merchant for30. Native choice text and final saves retain those costs. Moderate exploration adds exactly80 from the wolves and15 from the cache, producing205 instead of110 secured gold at the refuge. Refugee/trial order differs, so the reputation difference is not attributable solely to optional combat. The old-V6 continuation starts from its historical85-gold first-refuge save and is a separate lineage; its290-gold second refuge is not a controlled comparison with the fresh110-gold route.

## Atlas and remaining acceptance

Latest technical checkpoint (2026-10-16): final three1920 atlas captures in `lot-e-atlas-1920-trails-0002` are SUCCEEDED and independently inspected, including both outbound exits on land and label clearance. The moderate full ending `lot-e-moderate-ending-0002` is SUCCEEDED: new actual hunters victory46 actions and Serpent Captain83 actions;850 secured gold,100 reputation,zero temporary loot, both elites avoided with native front/rear retreat, exact terminal V6. Independent terminal review follows.

A native interruption test found a real lifecycle defect: pagehide/dispose closed the modal by resolving its default retreat, then the asynchronous coordinator overwrote the saved choice. The instance now becomes disposed before closing components; it refuses the late elite intention and refuses presentation settlement/redraw after disposal. A chest had the same late continuation. Two pre-fix regression cases fail on the old source; all11 integration cases now pass, including front/rear destruction and chest interruption followed by a new instance. Final focused current-source gates pass269 tests/15 files, contracts8/8/eight slots and TypeScript/production build. No baseline-copy tests are counted. Native corrected interruption, both elite victories and complete ending remain pending.

`complete-II-0004` remains FAILED and unseedable: actual sentinel defeat35 actions with the initial three novice-equipped heroes at full140/100/75HP. Its rear/contested modal reloads preserve the exact choice/owner/turn and focus, but this failed whole scenario is not accepted. No encounter statistic or reward is reduced. The next native attempt explicitly prepares existing steel equipment, deploys the living healer/warrior/rogue through the real menu and pays post-elite recovery, funding it only with native sales of already-secured materials if necessary.

`complete-II-0005` is now SUCCEEDED: native steel purchase153 and novice sale45, paid rest, healer/warrior/rogue selection, actual sentinel victory32 actions and village victory38. The eight optional I/II destinations remain resolved, the sentinel is permanently defeated with its exact independent120-gold/material reward and no underlying POI resolution, and the Second-refuge V6 saves/reloads exactly at592 secured gold/89 reputation/zero temporary gold. Corrected rear/contested choice reloads retain the complete owner and advance no turn. III preparation0001 is rejected before combat because the single steel shop stock was already exhausted. The retry natively swaps the acquired steel out with a repurchased novice blade and feeds that actual inventory blade into the existing forge recipe, preserving stock and charging every transaction.

Purchases retain existing reputation-adjusted prices. Forge retains its existing fixed recipe prices; no reputation multiplier is invented for forge. The planned complete native preparation will buy steel, forge the existing Espadon de Braise recipe for80 permanent gold and2 permanent iron, equip it and retain the exact owner transaction proof.

The forge review found an inherited presentation omission: material inputs were consumed correctly but absent from recipe cards. The UI now lists their existing permanent owned/required amounts and missing-state style. Current management57/UI8 tests pass (277 distinct focused tests overall,16 files; no duplicate baseline tests counted), TypeScript/production build pass. Native recipe capture/assertion now requires the real iron cost before fabrication. III0002 remains rejected after actual paid forging because its external pilot unnecessarily returned to Valmir despite the already-resolved village; canonical-fact gating now prevents that return and preserves the equipped Braise blade. No failed III output is reused as a seed.

Three revised PNG backgrounds use the built-in image-generation edit tool and inspected V2 references. Original assets remain intact. Exact prompts, reference/output paths, dimensions and hashes are in [atlas provenance](../project/LOT_E_ATLAS_PROVENANCE_2026-10-15.json). The background is geographical art; overlays derive all state and routes from the owner. No pixel collision or physical simulation is added.

The initial390px native review found overflowing action-bar labels. A three-column wrapping header is implemented; fresh capture acceptance remains pending. The pilot now checks actual nav-label overflow, modal focus/44px bounds and threat computed animation under independent OS/game reduction. Motion acceptance requires a nonempty active-threat sample. The atlas/modal44px scope does not claim every inherited desktop tactical-shell control is44px. Operator artistic review and final felt balance remain separate from technical/native acceptance, even after this report becomes final. No full demo/device/general-balance approval is inferred from scripted wins.
