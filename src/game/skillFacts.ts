import type { SkillDefinition, SkillEffect, SkillUpgrade } from './types';

/**
 * What a skill really does, in numbers, for the player (skills pass 2026-11-11).
 *
 * `resolveSkillSpec` mirrors, field for field, the skill branch of `getSpec` and `applySkillUpgrade` in
 * `src/combat/legacyCombatRuntime.js`, so the hero sheet and the upgrade screen can show a level the hero is not
 * fighting with. A test runs both on every skill and every level and requires the same result. In combat the
 * runtime describes its own spec, never this mirror.
 *
 * `describeSkillFacts` turns a spec into one short line: target and range, zone, damage, healing, statuses with their
 * duration and what they do, then the extras. It reads the spec only; it decides nothing and changes nothing.
 */

export interface SkillSpecEffect extends SkillEffect {
  apRestore?: number;
}

/** The runtime's resolved skill: the fields `getSpec` copies, after the upgrades of the hero's level. */
export interface SkillSpec {
  key: string;
  name?: string;
  icon?: string;
  ap: number;
  type?: string;
  power?: number;
  healPercent?: number;
  range?: number[];
  radius?: number;
  shape?: string;
  mode?: string;
  dest?: boolean;
  targetMode?: string;
  movePhase?: string;
  impact?: { status: string; statusTurns: number } | null;
  status?: string;
  statusTurns?: number;
  acc?: number;
  support?: boolean;
  offensive?: boolean;
  self?: boolean;
  heal?: boolean;
  revive?: boolean;
  penetration?: number;
  crit?: number;
  /** Critical chance added only to a blow from behind (Coup Sournois +2, operator decision 2026-11-11). */
  backCritBonus?: number;
  effects?: SkillSpecEffect[];
  flatHeal?: number;
  flatDmg?: number;
  apRestore?: number;
  cure?: boolean;
  allowSelfDamage?: boolean;
  hpCostPercent?: number;
  lifestealPercent?: number;
  damageMultiplier?: number;
  bonusVsSize?: number;
  bonusVsAfflicted?: number;
  upgradeLevel?: number;
  additionalStatus?: string;
  additionalStatusTurns?: number;
  additionalStatusTarget?: string;
  selfHealPercent?: number;
  stealBuffs?: boolean;
  dispelAllies?: boolean;
}

/** The skill branch of the runtime's `getSpec`, then `applySkillUpgrade` for this upgrade level (0 to 2). */
export function resolveSkillSpec(def: SkillDefinition, upgradeLevel = 0): SkillSpec {
  const spec: SkillSpec = {
    key: def.id, name: def.name, icon: def.icon, ap: def.ap, type: def.type, power: def.power || 0, healPercent: def.healPercent,
    range: def.self ? [0, 0] : def.range, radius: def.radius, shape: def.shape, mode: def.mode, dest: !!def.dest,
    targetMode: def.targetMode, movePhase: def.movePhase, impact: def.impact, status: def.status, statusTurns: def.statusTurns,
    acc: def.acc, support: !!def.support, offensive: !!def.offensive, self: !!def.self, heal: def.type === 'heal',
    revive: def.type === 'revive', penetration: def.penetration, crit: def.crit, effects: def.effects as SkillSpecEffect[] | undefined,
    flatHeal: def.flatHeal, flatDmg: def.flatDmg, apRestore: def.apRestore, cure: def.cure, allowSelfDamage: def.allowSelfDamage,
    hpCostPercent: undefined, lifestealPercent: undefined, damageMultiplier: def.damageMultiplier, bonusVsSize: def.bonusVsSize,
    bonusVsAfflicted: def.bonusVsAfflicted,
  };
  const level = Math.max(0, Math.min(2, Math.floor(upgradeLevel || 0)));
  if (!level) return spec;
  const out: SkillSpec = {
    ...spec, range: spec.range ? [...spec.range] : spec.range, effects: spec.effects?.map((effect) => ({ ...effect })), upgradeLevel: level,
  };
  if (def.upgradeLevel1) {
    const ups = [def.upgradeLevel1, def.upgradeLevel2].filter((up): up is SkillUpgrade => Boolean(up)).slice(0, level);
    for (const up of ups) {
      if (up.powerBonus && (out.power || 0) > 0) out.power = (out.power || 0) + up.powerBonus;
      if (up.powerBonus && out.effects) for (const effect of out.effects) if (effect.kind === 'damage' && typeof effect.power === 'number') effect.power += up.powerBonus;
      if (up.statusTurnsBonus && out.statusTurns != null) out.statusTurns += up.statusTurnsBonus;
      if (up.statusTurnsBonus && out.effects) for (const effect of out.effects) if (effect.statusTurns != null) effect.statusTurns += up.statusTurnsBonus;
      if (up.radiusBonus && out.radius != null) out.radius += up.radiusBonus;
      if (up.rangeBonus && out.range) out.range = [out.range[0]!, out.range[1]! + up.rangeBonus];
      if (up.accuracyBonus && out.acc) out.acc = Math.min(0.99, out.acc + up.accuracyBonus);
      if (up.penetrationBonus) out.penetration = (out.penetration || 0) + up.penetrationBonus;
      if (up.healMultiplier && (out.heal || out.revive)) out.power = (out.power || 0) * (1 + up.healMultiplier);
      if (up.healMultiplier && out.healPercent) out.healPercent += up.healMultiplier;
      if (up.healMultiplier && out.effects) for (const effect of out.effects) if (effect.kind === 'heal') {
        if (typeof effect.power === 'number') effect.power *= 1 + up.healMultiplier;
        if (typeof effect.healPercent === 'number') effect.healPercent += up.healMultiplier;
      }
      if (up.revivePercent != null && out.revive) out.power = up.revivePercent;
      if (up.critBonus) out.crit = (out.crit || 0) + up.critBonus;
      if (up.backCritBonus) out.backCritBonus = (out.backCritBonus || 0) + up.backCritBonus;
      if (up.hpCostReduction && out.hpCostPercent) out.hpCostPercent = Math.max(0, out.hpCostPercent - up.hpCostReduction);
      if (up.hpCostReduction && out.effects) for (const effect of out.effects) if (effect.kind === 'hp_cost' && effect.hpCostPercent) effect.hpCostPercent = Math.max(0, effect.hpCostPercent - up.hpCostReduction);
      if (up.lifestealBonus && out.lifestealPercent) out.lifestealPercent += up.lifestealBonus;
      if (up.lifestealBonus && out.effects) for (const effect of out.effects) if (effect.kind === 'lifesteal' && effect.lifestealPercent) effect.lifestealPercent += up.lifestealBonus;
      if (up.additionalStatus) { out.additionalStatus = up.additionalStatus; out.additionalStatusTurns = up.additionalStatusTurns || 1; out.additionalStatusTarget = up.additionalStatusTarget || 'enemies'; }
      if (up.selfHealPercent) out.selfHealPercent = up.selfHealPercent;
      if (up.minRangeReduction && out.range) out.range = [Math.max(0, out.range[0]! - up.minRangeReduction), out.range[1]!];
      if (up.stealBuffs) out.stealBuffs = true;
      if (up.dispelAllies) out.dispelAllies = true;
      if (up.flatHealBonus && out.effects) for (const effect of out.effects) if (effect.kind === 'heal' && effect.flatHeal != null) effect.flatHeal += up.flatHealBonus;
    }
    return out;
  }
  // The runtime's generic fallback for a skill without per-skill upgrades.
  if (out.heal) out.power = (out.power || 0) * (level === 1 ? 1.1 : 1.2);
  else if (out.revive) out.power = level === 1 ? 0.6 : 0.7;
  else if ((out.power || 0) > 0) out.power = (out.power || 0) + (level === 1 ? 2 : 4);
  if (out.statusTurns) out.statusTurns += 1;
  if (level >= 2 && out.radius && out.radius > 0) out.radius += 0.25;
  if (out.dest && out.range) out.range = [out.range[0]!, out.range[1]! + level];
  return out;
}

/** The game's status names, as the unit's status row shows them, and what each one does (runtime STATUS table). */
export const STATUS_FACTS: Readonly<Record<string, { label: string; effect: string; skipsTurn?: true }>> = Object.freeze({
  burn: { label: 'Brûlure', effect: 'perd 6 % de ses PV max + 8 par tour' },
  poison: { label: 'Poison', effect: 'perd 5 % de ses PV max + 6 par tour' },
  regen: { label: 'Régénération', effect: 'regagne 8 % de ses PV max + 6 par tour' },
  slow: { label: 'Ralenti', effect: 'DEX −35 %' },
  boost: { label: 'Force', effect: 'FOR et MAG +40 %' },
  weak: { label: 'Affaibli', effect: 'FOR et MAG −25 %' },
  barrier: { label: 'Barrière', effect: 'END +40 %' },
  curse: { label: 'Malédiction', effect: 'END −30 %' },
  staggered: { label: 'Brisé', effect: 'END −60 %, passe son tour', skipsTurn: true },
  blind: { label: 'Aveuglement', effect: 'précision −30' },
  root: { label: 'Entravé', effect: 'ne peut plus se déplacer' },
  silence: { label: 'Mutisme', effect: 'compétences bloquées' },
  taunt: { label: 'Provocation', effect: 'doit attaquer le lanceur' },
});

/** `applyStatus` raises a requested duration of 1 to 2, except for a status that skips a turn. */
export function effectiveStatusTurns(status: string, turns: number | undefined): number {
  const requested = turns || 2;
  return requested <= 1 && !STATUS_FACTS[status]?.skipsTurn ? 2 : requested;
}

/** Cells of a zone on an open field, centred on its target, as the runtime's aoeTiles, lineCells and coneCells. */
export function zoneCellCount(radius: number | undefined, shape?: string): number {
  const r = radius ?? 0;
  if (shape === 'line') return Math.max(1, Math.round(r)) + 2;
  let count = 0;
  for (let x = Math.ceil(-r); x <= Math.floor(r); x++) for (let z = Math.ceil(-r); z <= Math.floor(r); z++) {
    if (Math.hypot(x, z) > r + 0.001) continue;
    if (shape === 'cone' && !(x === 0 && z === 0) && x / Math.hypot(x, z) < 0.34) continue;
    count++;
  }
  return count || 1;
}

/** A no-break space keeps a number with its unit (« 30 % », « 2 tours ») on one line of the narrow menus. */
const NBSP = '\u00a0';
const percent = (value: number): string => `${Math.round(value * 100)}${NBSP}%`;
const span = (range: number[] | undefined): string => {
  const [min = 0, max = min] = range ?? [];
  return min === max ? `${min}` : `${min}-${max}`;
};
const cases = (count: number): string => `${count}${NBSP}case${count > 1 ? 's' : ''}`;

function statusClause(status: string, turns: number | undefined, who?: string): string {
  const facts = STATUS_FACTS[status];
  const n = effectiveStatusTurns(status, turns);
  const core = `${facts?.label ?? status} ${n}${NBSP}tour${n > 1 ? 's' : ''}${facts ? ` (${facts.effect})` : ''}`;
  return who ? `${core} : ${who}` : core;
}

function damageModifiers(spec: SkillSpec): string[] {
  const out: string[] = [];
  if (spec.damageMultiplier && spec.damageMultiplier !== 1) out.push(`${spec.damageMultiplier > 1 ? '+' : '−'}${percent(Math.abs(spec.damageMultiplier - 1))}`);
  if (spec.penetration) out.push(`ignore ${percent(Math.min(1, spec.penetration))} de la défense`);
  if (spec.crit != null) out.push(spec.crit >= 0.9 ? `critique ${percent(0.9)} (plafond)` : `critique ${percent(spec.crit)}`);
  if (spec.backCritBonus) out.push(`critique +${percent(spec.backCritBonus)} sur un coup de dos (${percent(0.9)} au plus)`);
  if (spec.bonusVsSize) out.push(`+${percent(spec.bonusVsSize - 1)} contre une grande cible`);
  if (spec.bonusVsAfflicted) out.push(`+${percent(spec.bonusVsAfflicted - 1)} contre une cible sous altération`);
  return out;
}

const damageType = (type: string | undefined): string => (type === 'mag' ? 'magiques' : 'physiques');
const isHybrid = (spec: SkillSpec): boolean => spec.targetMode === 'enemy' && (spec.mode === 'strike' || spec.mode === 'retreat') && spec.ap < 5;
const hasZone = (spec: SkillSpec): boolean => (spec.radius ?? 0) >= 1 || Boolean(spec.shape);
/** Where the zone sits once a move before the effect has landed (leap, teleport): around the unit's arrival. */
const zoneAtArrival = (spec: SkillSpec): boolean => Boolean(spec.dest && spec.movePhase === 'before' && spec.mode !== 'strike' && spec.mode !== 'swap');

/** A move with no effect of its own (Téléportation, Pas du Néant): its zone only matters for an upgrade's status. */
const isPureMove = (spec: SkillSpec): boolean => spec.type === 'move' && !spec.effects?.length && !(spec.power || 0)
  && spec.mode !== 'swap' && spec.mode !== 'strike' && spec.mode !== 'retreat';

/** The closest a cell at this grid distance from the caster can sit to a zone's centre. */
const nearestCasterDistance = (gridDistance: number): number => Math.hypot(Math.ceil(gridDistance / 2), Math.floor(gridDistance / 2));

/** Whether the caster can stand inside the zone: never behind a cone, and only as close as the minimum range allows. */
function casterCanBeInZone(spec: SkillSpec): boolean {
  const minRange = spec.range?.[0] ?? 0;
  if (spec.shape === 'cone') return false;
  if (spec.shape === 'line') return minRange <= 1;
  return nearestCasterDistance(minRange) <= (spec.radius ?? 0) + 0.001;
}

/** Who a friendly-fire zone touches besides the foes: allies, and the caster when the skill allows it and can reach him. */
const friendlyFire = (spec: SkillSpec): string => (spec.allowSelfDamage && casterCanBeInZone(spec) ? 'alliés et lanceur compris' : 'alliés compris');

/** The side a skill is cast by: the runtime's zoneSparesAllies spares a hero's allies, never an enemy's. */
export type SkillCasterTeam = 'player' | 'foe';
/** Operator decision 2026-11-11 (D1), as the runtime's zoneSparesAllies: a hero's offensive zone without « peut toucher les alliés » spares allies. */
const sparesAllies = (spec: SkillSpec, team: SkillCasterTeam): boolean => team === 'player' && Boolean(spec.offensive) && !spec.allowSelfDamage && hasZone(spec);

function targetClause(spec: SkillSpec, team: SkillCasterTeam): string {
  const r = span(spec.range);
  const hybrid = isHybrid(spec) ? ' (ou case libre : déplacement seul)' : '';
  if (spec.self) {
    if (!hasZone(spec)) return 'Sur soi';
    const around = zoneCellCount(spec.radius, spec.shape) - 1;
    if (!spec.offensive || spec.allowSelfDamage) return `Soi et les ${cases(around)} autour`;
    return `Les ${cases(around)} autour de soi${spec.effects?.length ? '' : sparesAllies(spec, team) ? ', épargne les alliés' : ', alliés compris'}`;
  }
  if (spec.mode === 'dash') return `Case libre en ligne droite à ${r}`;
  if (spec.mode === 'swap') return `Allié à ${r}`;
  if (spec.mode === 'strike') return `Ennemi à ${r}${hybrid}`;
  if (spec.revive) return `Allié à terre à ${r}`;
  if (spec.targetMode === 'ally') return `Allié à ${r}${(spec.range?.[0] ?? 1) === 0 ? ' (soi compris)' : ''}`;
  if (spec.targetMode === 'enemy') return `Ennemi à ${r}${hybrid}`;
  if (spec.dest) return `Case libre à ${r}`;
  return `Portée ${r}`;
}

/** Who a zone touches when the skill has no effect list: every unit but the caster for an offensive one. */
function genericZoneWho(spec: SkillSpec, team: SkillCasterTeam): string {
  if (spec.heal || spec.support) return 'alliés';
  if (isPureMove(spec)) return '';
  return sparesAllies(spec, team) ? 'épargne les alliés' : friendlyFire(spec);
}

function zoneClause(spec: SkillSpec, team: SkillCasterTeam): string | null {
  if (spec.self || !hasZone(spec)) return null;
  if (isPureMove(spec) && !spec.additionalStatus) return null;
  const count = zoneCellCount(spec.radius, spec.shape);
  const kind = spec.shape === 'line' ? `Ligne de ${cases(count)}` : spec.shape === 'cone' ? `Cône de ${cases(count)}` : `Zone de ${cases(count)}`;
  const where = zoneAtArrival(spec) ? ' autour de l’arrivée' : spec.targetMode === 'ally' || spec.targetMode === 'enemy' ? ' autour de la cible' : '';
  const effectsHitAll = spec.effects?.some((effect) => effect.target === 'all');
  const who = spec.effects?.length ? (effectsHitAll ? friendlyFire(spec) : '') : genericZoneWho(spec, team);
  return `${kind}${where}${who ? `, ${who}` : ''}`;
}

/** Who an effect of the effect list reaches, read the way the runtime's effectTargets reads it. */
function effectWho(spec: SkillSpec, effect: SkillSpecEffect): string {
  if (effect.target === 'caster' || effect.target === 'self') return 'soi';
  const area = hasZone(spec) || (spec.self && (spec.radius ?? 0) > 0);
  const selected = effect.targetSource === 'selected' || !area;
  if (effect.target === 'allies') return selected ? (spec.targetMode === 'ally' ? 'la cible' : 'alliés touchés') : spec.self || zoneAtArrival(spec) ? 'soi et alliés de la zone' : 'alliés de la zone';
  if (effect.target === 'enemies') return selected ? 'la cible' : 'ennemis de la zone';
  return selected ? 'la cible' : 'toute la zone';
}

function additionalWho(spec: SkillSpec): string {
  switch (spec.additionalStatusTarget || 'enemies') {
    case 'self': return 'soi';
    case 'selected': return 'la cible';
    case 'casterAndSelected': return 'soi et la cible';
    case 'allies': return hasZone(spec) || (spec.self && (spec.radius ?? 0) > 0) ? 'alliés de la zone' : 'alliés touchés';
    default: return hasZone(spec) || (spec.self && (spec.radius ?? 0) > 0) ? 'ennemis de la zone' : 'la cible';
  }
}

function healAmount(source: { healPercent?: number; flatHeal?: number; power?: number }): string {
  if (source.healPercent != null) return `${percent(source.healPercent)} des PV max`;
  if (source.flatHeal != null) return `${source.flatHeal} PV + CHA/4`;
  return `MAG × ${Math.round((source.power || 1) * 100) / 100} + CHA/4`;
}

/** One line of facts for a resolved skill spec, clauses joined by « · ». A hero casts it unless `team` says otherwise. */
export function describeSkillFacts(spec: SkillSpec, team: SkillCasterTeam = 'player'): string {
  const parts: string[] = [targetClause(spec, team)];
  const zone = zoneClause(spec, team);
  if (zone) parts.push(zone);
  const mods = damageModifiers(spec);
  const withMods = (head: string) => [head, ...mods].join(', ');

  if (spec.mode === 'dash' && spec.impact) {
    parts.push(withMods(`Frappe les ennemis adjacents à l’arrivée : dégâts physiques, puissance ${spec.power || 8}`));
    parts.push(statusClause(spec.impact.status, spec.impact.statusTurns, 'ennemis frappés'));
  } else if (spec.effects?.length) {
    for (const effect of spec.effects) {
      if (effect.kind === 'damage') parts.push(withMods(`Dégâts ${damageType(effect.damageType || spec.type)}, puissance ${effect.power ?? spec.power}`));
      if (effect.kind === 'damage' && effect.status) parts.push(statusClause(effect.status, effect.statusTurns, effectWho(spec, effect)));
      if (effect.kind === 'heal') parts.push(`Soin de ${healAmount(effect)} : ${effectWho(spec, effect)}`);
      if (effect.kind === 'status' && effect.status) parts.push(statusClause(effect.status, effect.statusTurns, effectWho(spec, effect)));
      if (effect.kind === 'dispel') parts.push(`Dissipe ${effect.dispelType === 'positive' ? 'les bonus' : effect.dispelType === 'all' ? 'tous les états' : 'les altérations'} : ${effectWho(spec, effect)}`);
      if (effect.kind === 'revive') parts.push(`Relève un allié à terre à ${percent(spec.power || 0.5)} de ses PV`);
      if (effect.kind === 'hp_cost') parts.push(`Coûte ${percent(effect.hpCostPercent || 0)} de ses PV max`);
      if (effect.kind === 'lifesteal' && spec.effects.some((other) => other.kind === 'damage')) parts.push(`Vol de vie : ${percent(effect.lifestealPercent || 0)} des dégâts infligés`);
    }
  } else if (spec.heal) {
    parts.push(`Soin de ${healAmount(spec)}`);
  } else if (spec.revive) {
    parts.push(`Relève l’allié à ${percent(spec.power || 0.5)} de ses PV`);
  } else if ((spec.power || 0) > 0) {
    parts.push(withMods(`Dégâts ${damageType(spec.type)}, puissance ${spec.power}`));
  }
  if (!spec.effects?.length && !(spec.mode === 'dash' && spec.impact) && spec.status) {
    const who = spec.self ? '' : hasZone(spec) ? (spec.support ? 'alliés de la zone' : sparesAllies(spec, team) ? 'ennemis touchés' : 'unités touchées') : '';
    parts.push(statusClause(spec.status, spec.statusTurns, who || undefined));
  }
  if (spec.additionalStatus) parts.push(statusClause(spec.additionalStatus, spec.additionalStatusTurns || 1, additionalWho(spec)));
  if (spec.selfHealPercent) parts.push(`Soigne le lanceur de ${percent(spec.selfHealPercent)} de ses PV max`);
  if (spec.dispelAllies) parts.push('Purifie tous les alliés de leurs altérations');
  if (spec.stealBuffs) parts.push('Vole les bonus dissipés');
  if (spec.mode === 'retreat') parts.push(spec.self ? 'Puis recule d’une case, loin de l’ennemi le plus proche' : 'Puis recule d’une case');
  if (spec.mode === 'strike') parts.push('Se place à côté de la cible, derrière elle si la case est libre');
  return parts.join(' · ');
}

/** The facts of a catalogue skill at an upgrade level, for screens outside combat. */
export function describeSkillFactsAt(def: SkillDefinition, upgradeLevel = 0, team: SkillCasterTeam = 'player'): string {
  return describeSkillFacts(resolveSkillSpec(def, upgradeLevel), team);
}
