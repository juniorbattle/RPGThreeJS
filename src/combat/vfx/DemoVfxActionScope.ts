/**
 * R2C-VFX Composer V2.6.3 — DEMO authoring scope classifier.
 *
 * AUTHORING METADATA ONLY.
 *
 * This module decides which Composer actions belong to the current playable
 * demo workload (DEMO) and which are not yet provably reachable (UPCOMING).
 *
 * It is NEVER consulted by production runtime. `PublishedVfxResolver` and the
 * published registry remain completely scope-agnostic: an UPCOMING action can
 * be drafted, saved, published, updated and unpublished exactly like a DEMO
 * action.
 *
 * Everything below is derived from authoritative game data:
 *   - initial roster            -> createInitialState()
 *   - recruitable units         -> `recruitUnit` narrative effects
 *   - obtainable equipment      -> starting kit + shop stock + craft recipes + `addItem`
 *   - unlocked skills           -> isSkillUnlockedForHero / getMaxUnlockedSkillAp
 *   - reachable combats         -> run graph (all seeds + all conduct tiers)
 *                                  + `startCombat` effects + Lion finale routes
 *   - enemy rosters             -> combatConfigs enemyVisualIds / bossVisualId
 *
 * The single unavoidable explicit mapping is the enemy-visual -> skill table,
 * which lives inside the legacy combat runtime (`legacyCombatRuntime.js`) and
 * cannot be imported from a pure module. It is mirrored here and guarded by a
 * drift test (`DemoVfxActionScope.test.ts`).
 */
import { getLabActions, type LabAction } from './CombatVfxLab';
import {
  units,
  unitById,
  weaponById,
  itemById,
  craftRecipes,
  getMaxUnlockedSkillAp,
} from '../../game/catalog';
import { skillById } from '../../game/skills';
import { combatConfigs, dialogues } from '../../game/content';
import { createInitialState } from '../../game/store';
import { createRunState, getAvailableRunNodes } from '../../game/runSystem';
import { LION_CONDUCT_FLAG_WEIGHTS } from '../../game/lionNarrative';
import type { GameState, NarrativeEffect } from '../../game/types';

// ============================================================ Types

export type VfxAuthoringScope = 'DEMO' | 'UPCOMING';

export type DemoActionGroup =
  | 'PLAYER_CORE'
  | 'PLAYER_RECRUITABLE'
  | 'CREATURES'
  | 'SERPENTS'
  | 'ELITES_BOSSES'
  | 'SYSTEM';

export type UpcomingActionGroup =
  | 'HEROES_UPCOMING'
  | 'ENEMIES_UPCOMING'
  | 'BOSSES_UPCOMING'
  | 'OTHER_UPCOMING';

export type VfxActionGroup = DemoActionGroup | UpcomingActionGroup;

export interface VfxActionScopeRecord {
  actionKey: string;
  scope: VfxAuthoringScope;
  group: VfxActionGroup;
  reason: string;
}

export const DEMO_ACTION_GROUP_ORDER: readonly DemoActionGroup[] = [
  'PLAYER_CORE',
  'PLAYER_RECRUITABLE',
  'CREATURES',
  'SERPENTS',
  'ELITES_BOSSES',
  'SYSTEM',
];

export const UPCOMING_ACTION_GROUP_ORDER: readonly UpcomingActionGroup[] = [
  'HEROES_UPCOMING',
  'ENEMIES_UPCOMING',
  'BOSSES_UPCOMING',
  'OTHER_UPCOMING',
];

export const VFX_ACTION_GROUP_LABELS: Readonly<Record<VfxActionGroup, string>> = Object.freeze({
  PLAYER_CORE: 'PLAYER — CORE',
  PLAYER_RECRUITABLE: 'PLAYER — RECRUITABLE',
  CREATURES: 'CREATURES',
  SERPENTS: 'SERPENTS',
  ELITES_BOSSES: 'ELITES / BOSSES',
  SYSTEM: 'SYSTEM / ITEMS',
  HEROES_UPCOMING: 'HEROES — À VENIR',
  ENEMIES_UPCOMING: 'ENEMIES — À VENIR',
  BOSSES_UPCOMING: 'BOSSES — À VENIR',
  OTHER_UPCOMING: 'OTHER — À VENIR',
});

// ============================================================ Enemy roster mirror

/**
 * Mirror of `VISUAL_UNIT_TEMPLATES[id].skills` in `legacyCombatRuntime.js`.
 * Kept in sync by a drift test that parses the runtime source.
 */
const ENEMY_VISUAL_SKILLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  serpent_raider: ['enemy_binding_shot'],
  serpent_brute: ['enemy_heavy_strike'],
  serpent_oracle: ['enemy_dark_bolt', 'enemy_hex'],
  serpent_elite_raider: ['enemy_binding_shot', 'boss_fortify', 'boss_pin', 'boss_flurry'],
  serpent_elite_brute: ['enemy_venom_strike', 'boss_guard', 'boss_quake', 'boss_slam'],
  serpent_duelist_elite: ['enemy_binding_shot', 'boss_fortify', 'boss_pin', 'boss_flurry'],
  wolf: [],
  venom_serpent: ['enemy_venom_strike', 'enemy_hex'],
  forest_spider: ['enemy_binding_shot'],
  forest_badger: [],
  marsh_toad: ['enemy_venom_strike'],
  cave_rat: [],
  wild_boar: ['enemy_heavy_strike'],
  goblin: [],
  skeleton: ['enemy_heavy_strike'],
  troll: ['enemy_heavy_strike', 'enemy_crush'],
  young_wyrm: ['enemy_dark_bolt', 'enemy_dragon_breath'],
  forest_troll_elite: ['enemy_hex', 'boss_guard', 'boss_quake', 'boss_slam'],
  young_dragon_elite: ['enemy_hex', 'boss_regen', 'boss_freeze', 'boss_inferno'],
  undead_champion: ['enemy_hex', 'boss_guard', 'boss_quake', 'boss_execution'],
  lion_champion: ['enemy_heavy_strike', 'boss_guard', 'boss_quake', 'boss_apocalypse'],
  seal_guardian: ['enemy_hex', 'boss_guard'],
});

/**
 * Mirror of `BOSS_DEFS` selection in `legacyCombatRuntime.js`:
 * `lion_chief` spawns the Lion Champion, every other boss combat spawns
 * `BOSS_DEFS[0]` (Général Serpent).
 */
const BOSS_COMBAT_SKILLS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  serpent_captain: ['enemy_hex', 'boss_guard', 'boss_quake', 'boss_titan_slam'],
  lion_chief: ['enemy_heavy_strike', 'boss_guard', 'boss_quake', 'boss_apocalypse'],
});

/** Boss combats launched by the Lion finale (`resolveLionFinaleExecution`). */
const LION_FINALE_COMBAT_IDS: readonly string[] = ['serpent_captain', 'lion_chief'];

/** Serpent-faction rank-and-file visuals (elites are tracked separately). */
const SERPENT_VISUAL_IDS = new Set([
  'serpent_raider', 'serpent_brute', 'serpent_oracle',
]);

/** Visuals flagged `elite: true` or `boss: true` in the legacy runtime. */
const ELITE_VISUAL_IDS = new Set([
  'serpent_elite_raider', 'serpent_elite_brute', 'serpent_duelist_elite',
  'forest_troll_elite', 'young_dragon_elite', 'undead_champion', 'lion_champion',
]);

export const __testing = { ENEMY_VISUAL_SKILLS, BOSS_COMBAT_SKILLS, ELITE_VISUAL_IDS };

// ============================================================ Player reachability

const CORE_UNIT_IDS: readonly string[] = createInitialState().clan.members.map((m) => m.definitionId);

function collectEffects(): NarrativeEffect[] {
  const out: NarrativeEffect[] = [];
  for (const [, sequence] of dialogues) {
    for (const step of sequence.steps) {
      out.push(...step.effects);
      for (const choice of step.choices ?? []) {
        out.push(...choice.effects);
        if (choice.contest) {
          out.push(...choice.contest.success.effects, ...choice.contest.failure.effects);
        }
      }
    }
  }
  return out;
}

const ALL_NARRATIVE_EFFECTS = collectEffects();

const RECRUITABLE_UNIT_IDS: readonly string[] = [
  ...new Set(
    ALL_NARRATIVE_EFFECTS
      .filter((e): e is Extract<NarrativeEffect, { type: 'recruitUnit' }> => e.type === 'recruitUnit')
      .map((e) => e.unitId),
  ),
].filter((id) => !CORE_UNIT_IDS.includes(id));

export function getDemoCoreUnitIds(): readonly string[] {
  return CORE_UNIT_IDS;
}

export function getDemoRecruitableUnitIds(): readonly string[] {
  return RECRUITABLE_UNIT_IDS;
}

/** Every item id a player can genuinely own during the demo. */
function buildObtainableItemIds(): Set<string> {
  const state = createInitialState();
  const ids = new Set<string>();

  // Starting kit (weapons + inventory).
  for (const member of state.clan.members) {
    for (const w of member.equipment.weaponIds) ids.add(w);
    for (const a of member.equipment.accessoryIds) if (a) ids.add(a);
  }
  for (const bucket of Object.values(state.inventory)) {
    for (const id of Object.keys(bucket)) ids.add(id);
  }

  // Every unit's default weapon is granted when the unit joins.
  for (const unit of units) {
    const starter = unit.allowedWeaponIds[0];
    if (starter) ids.add(starter);
  }

  // Shop stock.
  for (const shop of Object.values(state.shops)) {
    for (const id of Object.keys(shop.stock)) ids.add(id);
  }

  // Narrative rewards.
  for (const effect of ALL_NARRATIVE_EFFECTS) {
    if (effect.type === 'addItem') ids.add(effect.itemId);
  }

  // Craft outputs (iterate to a fixed point: recipes can chain).
  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of craftRecipes) {
      if (ids.has(recipe.output.itemId)) continue;
      const inputs = [
        ...Object.keys(recipe.inputs.weapons ?? {}),
        ...Object.keys(recipe.inputs.accessories ?? {}),
        ...Object.keys(recipe.inputs.materials ?? {}),
      ];
      if (inputs.every((id) => ids.has(id))) {
        ids.add(recipe.output.itemId);
        changed = true;
      }
    }
  }

  return ids;
}

const OBTAINABLE_ITEM_IDS = buildObtainableItemIds();

export function getObtainableItemIds(): ReadonlySet<string> {
  return OBTAINABLE_ITEM_IDS;
}

function skillAp(skillId: string): number {
  return skillById.get(skillId)?.ap ?? Number.POSITIVE_INFINITY;
}

/**
 * Union of every skill a demo unit can actually cast, across all loadouts it
 * can legally assemble from obtainable equipment.
 *
 * Weapon tier drives the AP unlock ceiling (`getMaxUnlockedSkillAp`).
 * Ultimates (>= 5 AP) are gated by `isUltimateUnlockedForHero`, which is
 * currently `false` for every unit — so no Ultimate is demo-reachable.
 */
function reachableSkillsForUnit(unitId: string): Set<string> {
  const definition = unitById.get(unitId);
  const result = new Set<string>();
  if (!definition) return result;

  const obtainableWeapons = definition.allowedWeaponIds
    .filter((id) => OBTAINABLE_ITEM_IDS.has(id))
    .map((id) => weaponById.get(id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  if (obtainableWeapons.length === 0) return result;

  const maxTier = Math.max(...obtainableWeapons.map((w) => w.tier));
  const maxApAtBestWeapon = getMaxUnlockedSkillAp(maxTier);

  const admit = (skillId: string, maxAp: number): void => {
    const ap = skillAp(skillId);
    // Ultimates are hard-locked in the current demo build.
    if (ap >= 5) return;
    if (ap <= maxAp) result.add(skillId);
  };

  for (const skillId of definition.skillIds) admit(skillId, maxApAtBestWeapon);

  // Accessories never change the weapon tier, so their skill swaps are
  // evaluated against the unit's best obtainable weapon.
  for (const itemId of OBTAINABLE_ITEM_IDS) {
    if (weaponById.has(itemId)) continue;
    const modifier = itemById.get(itemId)?.skillModifier;
    if (!modifier) continue;
    for (const [source, replacement] of Object.entries(modifier.replaces ?? {})) {
      if (definition.skillIds.includes(source)) admit(replacement, maxApAtBestWeapon);
    }
    for (const granted of modifier.grants ?? []) admit(granted, maxApAtBestWeapon);
  }

  // Weapon swaps are evaluated against that specific weapon's own tier.
  for (const weapon of obtainableWeapons) {
    const modifier = itemById.get(weapon.id)?.skillModifier;
    if (!modifier) continue;
    const maxAp = getMaxUnlockedSkillAp(weapon.tier);
    for (const [source, replacement] of Object.entries(modifier.replaces ?? {})) {
      if (definition.skillIds.includes(source)) admit(replacement, maxAp);
    }
    for (const granted of modifier.grants ?? []) admit(granted, maxAp);
  }

  return result;
}

// ============================================================ Enemy reachability

const CONDUCT_FLAG_PROFILES: readonly Readonly<Record<string, boolean>>[] = [
  {},
  { helpedRefugees: true },
  { exploitedRefugees: true },
  { helpedRefugees: true, prioritizedLoot: true },
  { helpedRefugees: true, prioritizedVillage: true, lionMandateHonour: true },
  { exploitedRefugees: true, prioritizedLoot: true, lionMandateAdvance: true },
  { lionMandateHonour: true },
  { lionMandateAdvance: true },
];

const ROUTE_SEEDS: readonly number[] = [0, 1, 2, 3, 5, 8, 11, 13, 17, 20, 23, 29];

/**
 * Every combat id that can be launched on ANY legal demo playthrough.
 *
 * Covers static route nodes, seeded graph variation, conduct-adaptive route
 * variants (offered through `getAvailableRunNodes`), story-triggered combats
 * declared as `startCombat` effects, and the Lion finale boss routes.
 */
function deriveReachableCombatIds(): Set<string> {
  const ids = new Set<string>();

  for (const seed of ROUTE_SEEDS) {
    for (const flags of CONDUCT_FLAG_PROFILES) {
      const state: GameState = createInitialState();
      state.run = createRunState(seed);
      Object.assign(state.flags, flags);
      for (const node of state.run.graph.nodes) {
        if (node.type === 'combat' || node.type === 'boss') ids.add(node.contentId);
        state.run.currentNodeId = node.id;
        state.currentNodeId = node.id;
        for (const candidate of getAvailableRunNodes(state)) {
          if (candidate.type === 'combat' || candidate.type === 'boss') ids.add(candidate.contentId);
        }
      }
    }
  }

  for (const effect of ALL_NARRATIVE_EFFECTS) {
    if (effect.type === 'startCombat') ids.add(effect.combatId);
  }

  for (const id of LION_FINALE_COMBAT_IDS) ids.add(id);

  // Keep only ids that are real combat encounters.
  for (const id of [...ids]) {
    if (!combatConfigs.has(id)) ids.delete(id);
  }
  return ids;
}

let _reachableCombatIds: Set<string> | null = null;

export function getReachableCombatIds(): ReadonlySet<string> {
  _reachableCombatIds ??= deriveReachableCombatIds();
  return _reachableCombatIds;
}

interface EnemyReach {
  skills: Map<string, string>;
  visualIds: Set<string>;
}

function deriveReachableEnemySkills(): EnemyReach {
  const skills = new Map<string, string>();
  const visualIds = new Set<string>();

  for (const combatId of getReachableCombatIds()) {
    const config = combatConfigs.get(combatId);
    if (!config) continue;

    const visuals = [...config.enemyVisualIds, ...config.escortVisualIds];
    for (const visualId of visuals) {
      visualIds.add(visualId);
      for (const skillId of ENEMY_VISUAL_SKILLS[visualId] ?? []) {
        if (!skills.has(skillId)) skills.set(skillId, `enemy in ${combatId}`);
      }
    }

    if (config.bossVisualId) {
      visualIds.add(config.bossVisualId);
      for (const skillId of BOSS_COMBAT_SKILLS[combatId] ?? []) {
        if (!skills.has(skillId)) skills.set(skillId, `boss in ${combatId}`);
      }
    }
  }

  return { skills, visualIds };
}

let _enemyReach: EnemyReach | null = null;

function enemyReach(): EnemyReach {
  _enemyReach ??= deriveReachableEnemySkills();
  return _enemyReach;
}

export function getReachableEnemyVisualIds(): ReadonlySet<string> {
  return enemyReach().visualIds;
}

// ============================================================ Classification

/**
 * Group an enemy/boss action by the kind of unit that actually casts it in a
 * reachable encounter. Skills carried by ordinary troops stay in SERPENTS or
 * CREATURES even when the same troop also appears in an elite-ranked combat;
 * only skills exclusive to elites/bosses land in ELITES_BOSSES.
 */
function groupForEnemySkill(skillId: string): DemoActionGroup {
  let onSerpent = false;
  let onCreature = false;

  for (const visualId of getReachableEnemyVisualIds()) {
    if (ELITE_VISUAL_IDS.has(visualId)) continue;
    if (!(ENEMY_VISUAL_SKILLS[visualId] ?? []).includes(skillId)) continue;
    if (SERPENT_VISUAL_IDS.has(visualId)) onSerpent = true;
    else onCreature = true;
  }

  if (onSerpent) return 'SERPENTS';
  if (onCreature) return 'CREATURES';
  return 'ELITES_BOSSES';
}

function classifyAction(action: LabAction, demoPlayerSkills: Map<string, DemoPlayerReach>): VfxActionScopeRecord {
  const { actionKey, ownerType } = action;

  if (ownerType === 'HERO') {
    const hit = demoPlayerSkills.get(actionKey);
    if (hit) {
      const group: DemoActionGroup = CORE_UNIT_IDS.includes(hit.viaUnitId)
        ? 'PLAYER_CORE'
        : 'PLAYER_RECRUITABLE';
      return { actionKey, scope: 'DEMO', group, reason: hit.reason };
    }
    return {
      actionKey,
      scope: 'UPCOMING',
      group: 'HEROES_UPCOMING',
      reason: heroUpcomingReason(action),
    };
  }

  const enemySkills = enemyReach().skills;
  const reason = enemySkills.get(actionKey);
  if (reason) {
    return { actionKey, scope: 'DEMO', group: groupForEnemySkill(actionKey), reason };
  }

  return {
    actionKey,
    scope: 'UPCOMING',
    group: ownerType === 'BOSS' ? 'BOSSES_UPCOMING' : 'ENEMIES_UPCOMING',
    reason: 'not reachable in current demo',
  };
}

function heroUpcomingReason(action: LabAction): string {
  const { ownerId, actionKey } = action;
  if (!ownerId) return 'not reachable in current demo';
  if (!CORE_UNIT_IDS.includes(ownerId) && !RECRUITABLE_UNIT_IDS.includes(ownerId)) {
    return `${ownerId} cannot join the party during the demo`;
  }
  const ap = skillAp(actionKey);
  if (ap >= 5) return 'ultimate — no unlock path in current demo';
  if (Number.isFinite(ap)) return `requires weapon tier above any obtainable weapon (${ap} AP)`;
  return 'not reachable in current demo';
}

interface DemoPlayerReach {
  reason: string;
  /** Demo unit that actually brings this action into play. */
  viaUnitId: string;
}

function buildDemoPlayerSkills(): Map<string, DemoPlayerReach> {
  const out = new Map<string, DemoPlayerReach>();

  for (const unitId of [...CORE_UNIT_IDS, ...RECRUITABLE_UNIT_IDS]) {
    const isCore = CORE_UNIT_IDS.includes(unitId);
    const origin = isCore ? 'initial roster' : 'recruitable during demo';
    const unitName = unitById.get(unitId)?.name ?? unitId;

    // Basic attack of the unit's starting weapon type.
    for (const action of getLabActions()) {
      if (action.slot === 'BASIC' && action.ownerId === unitId) {
        out.set(action.actionKey, { reason: `${origin} — basic attack`, viaUnitId: unitId });
      }
    }

    for (const skillId of reachableSkillsForUnit(unitId)) {
      if (out.has(skillId)) continue;
      const owned = unitById.get(unitId)?.skillIds.includes(skillId) ?? false;
      out.set(skillId, {
        reason: owned
          ? `${origin} — weapon tier unlocks ${skillAp(skillId)} AP skill`
          : `${origin} — granted to ${unitName} by obtainable equipment`,
        viaUnitId: unitId,
      });
    }
  }

  return out;
}

let _records: readonly VfxActionScopeRecord[] | null = null;

export function getVfxActionScopeRecords(): readonly VfxActionScopeRecord[] {
  if (_records) return _records;
  const demoPlayerSkills = buildDemoPlayerSkills();
  _records = getLabActions().map((action) => classifyAction(action, demoPlayerSkills));
  return _records;
}

const _recordByKey = new Map<string, VfxActionScopeRecord>();

export function getVfxActionScopeRecord(actionKey: string): VfxActionScopeRecord | null {
  if (_recordByKey.size === 0) {
    for (const record of getVfxActionScopeRecords()) _recordByKey.set(record.actionKey, record);
  }
  return _recordByKey.get(actionKey) ?? null;
}

export function getVfxActionScope(actionKey: string): VfxAuthoringScope {
  return getVfxActionScopeRecord(actionKey)?.scope ?? 'UPCOMING';
}

export function getActionsInScope(scope: VfxAuthoringScope): readonly LabAction[] {
  const keys = new Set(
    getVfxActionScopeRecords().filter((r) => r.scope === scope).map((r) => r.actionKey),
  );
  return getLabActions().filter((a) => keys.has(a.actionKey));
}

export interface ScopeGroupBucket {
  group: VfxActionGroup;
  label: string;
  actions: LabAction[];
}

export function getGroupedActionsInScope(scope: VfxAuthoringScope): ScopeGroupBucket[] {
  const order: readonly VfxActionGroup[] = scope === 'DEMO'
    ? DEMO_ACTION_GROUP_ORDER
    : UPCOMING_ACTION_GROUP_ORDER;
  const byKey = new Map(getLabActions().map((a) => [a.actionKey, a]));
  const buckets = new Map<VfxActionGroup, LabAction[]>();

  for (const record of getVfxActionScopeRecords()) {
    if (record.scope !== scope) continue;
    const action = byKey.get(record.actionKey);
    if (!action) continue;
    const list = buckets.get(record.group) ?? [];
    list.push(action);
    buckets.set(record.group, list);
  }

  return order
    .filter((group) => (buckets.get(group)?.length ?? 0) > 0)
    .map((group) => ({
      group,
      label: VFX_ACTION_GROUP_LABELS[group],
      actions: buckets.get(group)!,
    }));
}

export interface ScopeCensus {
  total: number;
  demo: number;
  upcoming: number;
  demoByGroup: Record<DemoActionGroup, number>;
  upcomingByGroup: Record<UpcomingActionGroup, number>;
}

export function getScopeCensus(): ScopeCensus {
  const demoByGroup = Object.fromEntries(
    DEMO_ACTION_GROUP_ORDER.map((g) => [g, 0]),
  ) as Record<DemoActionGroup, number>;
  const upcomingByGroup = Object.fromEntries(
    UPCOMING_ACTION_GROUP_ORDER.map((g) => [g, 0]),
  ) as Record<UpcomingActionGroup, number>;

  let demo = 0;
  let upcoming = 0;
  for (const record of getVfxActionScopeRecords()) {
    if (record.scope === 'DEMO') {
      demo++;
      demoByGroup[record.group as DemoActionGroup]++;
    } else {
      upcoming++;
      upcomingByGroup[record.group as UpcomingActionGroup]++;
    }
  }

  return { total: demo + upcoming, demo, upcoming, demoByGroup, upcomingByGroup };
}

/** Conduct flags recognised by the route simulation — exported for tests. */
export const __conductFlagNames = Object.keys(LION_CONDUCT_FLAG_WEIGHTS);
