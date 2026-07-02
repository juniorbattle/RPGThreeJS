import type {
  CombatantPayload, CraftRecipeDefinition, EquipmentLoadout, ItemCategory, ItemDefinition, UnitDefinition,
  UnitInstance, UnitStats, WeaponDefinition,
} from './types';

export const weapons: WeaponDefinition[] = [
  { id: 'iron_sword', name: 'Épée de fer', description: 'Une lame fiable des troupes du Lion.', category: 'weapons', price: 90, icon: '⚔', type: 'sword', damage: 20, range: 1, accuracyBonus: 5, critBonus: 5 },
  { id: 'steel_sword', name: 'Épée d’acier', description: 'Une lame équilibrée et plus mordante.', category: 'weapons', price: 170, icon: '⚔', type: 'sword', damage: 25, range: 1, accuracyBonus: 7, critBonus: 5 },
  { id: 'iron_dagger', name: 'Dague de fer', description: 'Rapide et précise à courte portée.', category: 'weapons', price: 75, icon: '†', type: 'dagger', damage: 12, range: 1, accuracyBonus: 15, critBonus: 10 },
  { id: 'battle_axe', name: 'Hache de bataille', description: 'Lourde, brutale et moins précise.', category: 'weapons', price: 190, icon: '◆', type: 'axe', damage: 28, range: 1, accuracyBonus: -10, critBonus: 15 },
  { id: 'wooden_spear', name: 'Lance de frêne', description: 'Permet de frapper à deux cases.', category: 'weapons', price: 110, icon: '↟', type: 'spear', damage: 15, range: 2, accuracyBonus: 0, critBonus: 5, skillModifier: { grants: ['charge'] } },
  { id: 'short_bow', name: 'Arc court', description: 'Arc mobile pour les engagements proches.', category: 'weapons', price: 120, icon: '⌁', type: 'bow', damage: 14, range: 4, minRange: 2, accuracyBonus: 0, critBonus: 5 },
  { id: 'long_bow', name: 'Arc long', description: 'Excellente portée et puissance accrue.', category: 'weapons', price: 230, icon: '⌁', type: 'bow', damage: 22, range: 4, minRange: 2, accuracyBonus: 5, critBonus: 10, skillModifier: { grants: ['pierce_shot'] } },
  { id: 'wooden_staff', name: 'Bâton d’apprenti', description: 'Canalise les sorts élémentaires.', category: 'weapons', price: 100, icon: '✦', type: 'staff', damage: 10, range: 2, accuracyBonus: 10, critBonus: 0 },
  { id: 'mystic_staff', name: 'Bâton mystique', description: 'Bois ancien saturé de mana.', category: 'weapons', price: 260, icon: '✦', type: 'staff', damage: 18, range: 3, accuracyBonus: 15, critBonus: 5, skillModifier: { grants: ['flame_wave'] } },
  { id: 'war_mace', name: 'Masse consacrée', description: 'Arme robuste des guérisseurs du Lion.', category: 'weapons', price: 130, icon: '✚', type: 'mace', damage: 16, range: 1, accuracyBonus: 5, critBonus: 3 },
  { id: 'lion_guard_blade', name: 'Lame du Lion', description: 'Épée de garde renforcée par un anneau martial.', category: 'weapons', price: 320, icon: '⚔', type: 'sword', damage: 27, range: 1, accuracyBonus: 8, critBonus: 6, skillModifier: { grants: ['bulwark'] } },
  { id: 'windstep_bow', name: 'Arc du Vent', description: 'Arc nerveux équilibré par des bottes d’éclaireur.', category: 'weapons', price: 340, icon: '⌁', type: 'bow', damage: 24, range: 4, minRange: 2, accuracyBonus: 8, critBonus: 12, skillModifier: { grants: ['leap'] } },
];

export const items: ItemDefinition[] = [
  { id: 'strength_ring', name: 'Anneau de Force', description: 'Augmente la force de 5.', category: 'accessories', icon: '◇', price: 100, modifiers: { strength: 5 }, skillModifier: { grants: ['heavy'] } },
  { id: 'magic_pendant', name: 'Pendentif magique', description: 'Augmente la magie de 5.', category: 'accessories', icon: '◇', price: 120, modifiers: { magic: 5 } },
  { id: 'life_belt', name: 'Ceinture de Vie', description: 'Augmente les PV de 20.', category: 'accessories', icon: '▰', price: 80, modifiers: { maxHealth: 20 } },
  { id: 'agility_boots', name: 'Bottes d’agilité', description: 'Augmente la dextérité de 5.', category: 'accessories', icon: '⌁', price: 150, modifiers: { dexterity: 5 } },
  { id: 'wisdom_crown', name: 'Couronne de Sagesse', description: 'Augmente la magie de 8.', category: 'accessories', icon: '♛', price: 200, modifiers: { magic: 8 } },
  { id: 'sage_seal', name: 'Sceau du Sage', description: 'Accessoire magique façonné pour stabiliser les arcanes.', category: 'accessories', icon: '✦', price: 310, modifiers: { magic: 10, charisma: 3 }, skillModifier: { grants: ['regen'] } },
  { id: 'warding_buckle', name: 'Boucle de Garde', description: 'Fermoir défensif gravé pour tenir la ligne.', category: 'accessories', icon: '▰', price: 240, modifiers: { maxHealth: 15, endurance: 4 } },
  { id: 'potion', name: 'Potion légère', description: 'Restaure 55 PV en combat.', category: 'consumables', icon: '◉', price: 15 },
  { id: 'ether', name: 'Éther', description: 'Restaure 2 AP en combat.', category: 'consumables', icon: '◈', price: 35 },
  { id: 'antidote', name: 'Antidote', description: 'Dissipe les altérations négatives.', category: 'consumables', icon: '✚', price: 10 },
  { id: 'bomb', name: 'Bombe', description: 'Inflige des dégâts de zone.', category: 'consumables', icon: '●', price: 30 },
  { id: 'iron_ore', name: 'Minerai de fer', description: 'Un matériau de forge commun.', category: 'materials', icon: '⬟', price: 5 },
  { id: 'red_gem', name: 'Gemme rouge', description: 'Une pierre rare prisée des artisans.', category: 'materials', icon: '◆', price: 50 },
  ...weapons,
];

export const units: UnitDefinition[] = [
  {
    id: 'knight', name: 'Alistair', className: 'Chevalier', combatKind: 'knight',
    portrait: '/assets/characters/pixel/full/alistair.png',
    baseStats: { maxHealth: 140, strength: 18, magic: 5, endurance: 15, dexterity: 10, charisma: 12, moveRange: 2 },
    weaponSlotCount: 2,
    allowedWeaponIds: ['iron_sword', 'steel_sword', 'lion_guard_blade', 'wooden_spear'], skillIds: ['whirl', 'bulwark', 'provoke', 'charge'],
  },
  {
    id: 'cleric', name: 'Marian', className: 'Clerc', combatKind: 'cleric',
    portrait: '/assets/characters/pixel/full/marian.png',
    baseStats: { maxHealth: 105, strength: 8, magic: 22, endurance: 13, dexterity: 11, charisma: 18, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['war_mace', 'wooden_staff', 'mystic_staff'], skillIds: ['heal', 'regen', 'bless', 'revive'],
  },
  {
    id: 'mage', name: 'Elara', className: 'Mage', combatKind: 'mage',
    portrait: '/assets/characters/pixel/full/elara.png',
    baseStats: { maxHealth: 80, strength: 5, magic: 26, endurance: 8, dexterity: 12, charisma: 15, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['wooden_staff', 'mystic_staff'], skillIds: ['fireball', 'curse', 'flame_wave', 'blink'],
  },
  {
    id: 'archer', name: 'Kestrel', className: 'Archère', combatKind: 'archer',
    portrait: '/assets/characters/pixel/full/kestrel.png',
    baseStats: { maxHealth: 100, strength: 15, magic: 5, endurance: 10, dexterity: 20, charisma: 10, moveRange: 3 },
    weaponSlotCount: 2,
    allowedWeaponIds: ['short_bow', 'long_bow', 'windstep_bow', 'iron_dagger'], skillIds: ['weaken', 'blind_shot', 'pierce_shot', 'leap'],
  },
  {
    id: 'cedric', name: 'Cedric', className: 'Éclaireur', combatKind: 'archer',
    portrait: '/assets/characters/pixel/full/cedric.png',
    baseStats: { maxHealth: 115, strength: 17, magic: 4, endurance: 11, dexterity: 22, charisma: 10, moveRange: 3 },
    weaponSlotCount: 2,
    allowedWeaponIds: ['short_bow', 'long_bow', 'windstep_bow', 'iron_dagger'], skillIds: ['weaken', 'blind_shot', 'leap'],
  },
];

export const itemById = new Map(items.map((item) => [item.id, item]));
export const weaponById = new Map(weapons.map((weapon) => [weapon.id, weapon]));
export const unitById = new Map(units.map((unit) => [unit.id, unit]));

export const craftRecipes: CraftRecipeDefinition[] = [
  {
    id: 'craft_lion_guard_blade',
    name: 'Forger la Lame du Lion',
    description: 'Transformer une épée d’acier et un anneau de force en arme défensive de front.',
    inputs: { weapons: { steel_sword: 1 }, accessories: { strength_ring: 1 }, gold: 80 },
    output: { itemId: 'lion_guard_blade', category: 'weapons', quantity: 1 },
    preview: '+27 puissance, précision +8, accorde Rempart.',
  },
  {
    id: 'craft_windstep_bow',
    name: 'Forger l’Arc du Vent',
    description: 'Assembler un arc long et des bottes d’agilité pour un tireur mobile.',
    inputs: { weapons: { long_bow: 1 }, accessories: { agility_boots: 1 }, gold: 90 },
    output: { itemId: 'windstep_bow', category: 'weapons', quantity: 1 },
    preview: '+24 puissance, critique +12, accorde Bond.',
  },
  {
    id: 'craft_sage_seal',
    name: 'Façonner le Sceau du Sage',
    description: 'Fusionner deux focalisateurs pour stabiliser les soins et les arcanes.',
    inputs: { accessories: { magic_pendant: 1, wisdom_crown: 1 }, gold: 100 },
    output: { itemId: 'sage_seal', category: 'accessories', quantity: 1 },
    preview: '+10 magie, +3 charisme, accorde Régénération.',
  },
  {
    id: 'craft_warding_buckle',
    name: 'Façonner la Boucle de Garde',
    description: 'Renforcer une ceinture de vie par un anneau martial.',
    inputs: { accessories: { life_belt: 1, strength_ring: 1 }, gold: 75 },
    output: { itemId: 'warding_buckle', category: 'accessories', quantity: 1 },
    preview: '+15 PV, +4 endurance.',
  },
];

export const craftRecipeById = new Map(craftRecipes.map((recipe) => [recipe.id, recipe]));

const defaultWeapons: Record<string, string[]> = {
  knight: ['iron_sword', 'wooden_spear'],
  cleric: ['war_mace'],
  mage: ['wooden_staff'],
  archer: ['short_bow', 'iron_dagger'],
  cedric: ['short_bow', 'iron_dagger'],
};

export function createUnitInstance(definitionId: string, narrativeLocked = false): UnitInstance {
  const definition = unitById.get(definitionId) ?? units[0]!;
  const equipment = {
    weaponIds: (defaultWeapons[definition.id] ?? definition.allowedWeaponIds.slice(0, definition.weaponSlotCount))
      .slice(0, definition.weaponSlotCount),
    accessoryIds: [null, null] as [string | null, string | null],
  };
  const baseUnit = {
    id: definitionId,
    definitionId: definition.id,
    name: definition.name,
    narrativeLocked,
    equipment,
  };
  return {
    ...baseUnit,
    currentHealth: getFinalStats(baseUnit).maxHealth,
    skillUpgrades: {},
  };
}

export function getItemCategory(itemId: string): ItemCategory | null {
  return itemById.get(itemId)?.category ?? null;
}

export function getFinalStats(unit: { definitionId: string; equipment: EquipmentLoadout }): UnitStats {
  const definition = unitById.get(unit.definitionId) ?? units[0]!;
  const result: UnitStats = { ...definition.baseStats };
  for (const accessoryId of unit.equipment.accessoryIds) {
    const modifiers = accessoryId ? itemById.get(accessoryId)?.modifiers : undefined;
    if (!modifiers) continue;
    for (const key of Object.keys(modifiers) as (keyof UnitStats)[]) {
      result[key] += modifiers[key] ?? 0;
    }
  }
  return result;
}

export function getResolvedSkills(unit: { definitionId: string; equipment: EquipmentLoadout }): string[] {
  const definition = unitById.get(unit.definitionId) ?? units[0]!;
  const result = new Set(definition.skillIds);
  const equipmentIds = [
    ...unit.equipment.weaponIds,
    ...unit.equipment.accessoryIds.filter((id): id is string => Boolean(id)),
  ];
  for (const itemId of equipmentIds) {
    const modifier = itemById.get(itemId)?.skillModifier;
    if (!modifier) continue;
    for (const [source, replacement] of Object.entries(modifier.replaces ?? {})) {
      if (result.delete(source)) result.add(replacement);
    }
    for (const skillId of modifier.grants ?? []) result.add(skillId);
  }
  return [...result];
}

export function toCombatant(unit: UnitInstance): CombatantPayload {
  const definition = unitById.get(unit.definitionId) ?? units[0]!;
  const stats = getFinalStats(unit);
  const skillIds = getResolvedSkills(unit);
  const skillUpgrades = Object.fromEntries(
    skillIds.map((skillId) => [
      skillId,
      Math.max(0, Math.min(2, Math.floor(unit.skillUpgrades[skillId] ?? 0))),
    ]),
  );
  return {
    id: unit.id,
    name: unit.name,
    kind: definition.combatKind,
    portrait: definition.portrait,
    stats,
    currentHealth: Math.max(1, Math.min(stats.maxHealth, Math.floor(unit.currentHealth))),
    weapons: unit.equipment.weaponIds
      .map((weaponId) => weaponById.get(weaponId))
      .filter((weapon): weapon is WeaponDefinition => weapon !== undefined),
    skills: skillIds,
    skillUpgrades,
  };
}
