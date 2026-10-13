# Early combat recovery and random Pursuit formations

Decision: **OD-2026-10-13-C**. Status: **ACTIVE**. Direct operator request in chat `01a133cd-cc30-7940-84f5-5a91e3d62290`, followed by the explicit clarification: **two enemies minimum**.

The operator requests post-combat recovery at1HP for KO fighters, allowing potion healing afterward and full healing at the existing rest. Enemy statistics must remain unchanged; difficulty changes through enemy count. Opening groups use two enemies, with three/four later. Shadow Pursuit collisions randomize both count and ordinary enemy types, including humans and monsters; T0 is especially approachable and T1 remains accessible.

## Authorized implementation

- After a victory, participating fighters reported KO recover at1HP in the shared campaign combat-progress owner. Preserve surviving health, undeployed members, the raw tactical result, defeat/checkpoint rollback and temporary-loot loss. Existing potions and paid full-rest rules remain.
- Early ordinary authored groups: two enemies (`forest_ambush`, `wolf_pack`, `forest_patrol`, `spider_nest`, `marsh_crossing`, `serpent_reprisals`, `road_to_valmir`). Village defense remains the first three-enemy peak; later ordinary groups retain three/four. Preserve elite/boss identities and encounter rewards.
- Pursuit count: T0 exactly2; T1 randomly2–3; T3 randomly3–4. Types are independent random draws, allowing duplicates and mixed humans/monsters within explicit leg pools of existing ordinary tactical templates. T0 has the lighter pool, T1 adds more variety, T3 adds the stronger ordinary Serpent types. Bosses, elites and protected named actors are excluded.
- Keep all ten existing eligibility/window bindings. Campaign/RunSystem owns random selection and cloned transient configs; retain existing combat IDs/rewards, once-only resolution and same-road return. Accurate generic encounter UI replaces faction-specific incidental labels; no canonical dialogue or story consequence is borrowed.
- Retain the existing injectable encounter random source, separate from tactical and presentation RNG. Each collision samples a fresh formation; do not cache one group per saved road window or add transient roster/RNG fields to V6.

This direct request supersedes OD-2026-10-09-A's fixed ordinary-formation selection for Pursuit. It does not alter LOCKED documents, enemy stats/AP/equipment/ultimates, campaign branches, durable IDs/V6, defeat recovery, eight videos, deferred audio or protected main. Mechanical and native browser verification are required; count caps alone do not establish complete difficulty acceptance.
