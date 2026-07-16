import type {
  CombatantPayload, CraftRecipeDefinition, EquipmentLoadout, ItemCategory, ItemDefinition, UnitDefinition,
  UnitInstance, UnitStats, WeaponDefinition,
} from './types';

export const WEAPON_TIER_HEALTH: Record<WeaponDefinition['type'], number[]> = {
  greatsword:  [0, 25,  50, 100, 150],
  holy_mace:   [0, 23,  45,  90, 135],
  scythe:      [0, 23,  45,  90, 135],
  long_spear:  [0, 20,  40,  80, 120],
  rapier:      [0, 18,  35,  70, 105],
  dagger:      [0, 18,  35,  70, 105],
  hand_cannon: [0, 18,  35,  70, 105],
  shuriken:    [0, 15,  30,  60,  90],
  longbow:     [0, 15,  30,  60,  90],
  grimoire:    [0, 13,  25,  50,  75],
  crosier:     [0, 13,  25,  50,  75],
  wand:        [0, 13,  25,  50,  75],
};

export const weapons: WeaponDefinition[] = [
  // Greatsword (Warrior) — T0 Novice / T1 / T2
  { id: 'novice_greatsword', name: 'Espadon novice', description: "Lame d'écuyer pour les premières batailles.", category: 'weapons', price: 90, icon: '⚔', type: 'greatsword', damage: 20, range: 1, accuracyBonus: 5, critBonus: 5 },
  { id: 'steel_greatsword', name: "Espadon d'acier", description: 'Lame équilibrée et plus mordante.', category: 'weapons', price: 170, icon: '⚔', type: 'greatsword', damage: 25, range: 1, accuracyBonus: 7, critBonus: 5, healthBonus: 25 },
  { id: 'lion_guard_greatsword', name: 'Espadon du Lion', description: 'Lame de garde renforcée par un anneau martial.', category: 'weapons', price: 320, icon: '⚔', type: 'greatsword', damage: 27, range: 1, accuracyBonus: 8, critBonus: 6, healthBonus: 50, skillModifier: { replaces: { w_lion_surge: 'p_oathwall' } } },
  // Holy mace (Paladin) — T0 Novice / T1 / T2
  { id: 'novice_mace', name: 'Masse novice', description: 'Masse simple des protecteurs débutants.', category: 'weapons', price: 130, icon: '✚', type: 'holy_mace', damage: 16, range: 1, accuracyBonus: 5, critBonus: 3 },
  { id: 'sacred_mace', name: 'Masse sacrée', description: 'Masse consacrée frappant avec force.', category: 'weapons', price: 220, icon: '✚', type: 'holy_mace', damage: 22, range: 1, accuracyBonus: 7, critBonus: 5, healthBonus: 23 },
  { id: 'oath_mace', name: 'Masse du Serment', description: 'Masse de garde renforcée par un serment sacré.', category: 'weapons', price: 340, icon: '✚', type: 'holy_mace', damage: 27, range: 1, accuracyBonus: 8, critBonus: 6, healthBonus: 45 },
  // Scythe (Dark Knight) — T0 Novice / T1 / T2
  { id: 'novice_scythe', name: 'Faux novice', description: 'Faux rudimentaire mais menaçante.', category: 'weapons', price: 100, icon: '☠', type: 'scythe', damage: 20, range: 2, accuracyBonus: 3, critBonus: 8 },
  { id: 'steel_scythe', name: "Faux d'acier", description: 'Faux équilibrée à la lame plus mordante.', category: 'weapons', price: 190, icon: '☠', type: 'scythe', damage: 25, range: 2, accuracyBonus: 5, critBonus: 10, healthBonus: 23 },
  { id: 'eclipse_scythe', name: "Faux de l'Éclipse", description: "Faux imprégnée d'énergie obscure.", category: 'weapons', price: 330, icon: '☠', type: 'scythe', damage: 28, range: 2, accuracyBonus: 5, critBonus: 12, healthBonus: 45 },
  // Long spear (Lancer) — T0 Novice / T1 / T2
  { id: 'novice_spear', name: 'Lance novice', description: 'Lance de bois pour frapper à distance.', category: 'weapons', price: 110, icon: '↟', type: 'long_spear', damage: 15, range: 2, accuracyBonus: 0, critBonus: 5 },
  { id: 'steel_spear', name: "Lance d'acier", description: 'Lance robuste à longue portée.', category: 'weapons', price: 200, icon: '↟', type: 'long_spear', damage: 20, range: 2, accuracyBonus: 3, critBonus: 5, healthBonus: 20 },
  { id: 'griffon_spear', name: 'Lance du Griffon', description: 'Lance de guerre équilibrée pour les charges.', category: 'weapons', price: 320, icon: '↟', type: 'long_spear', damage: 24, range: 2, accuracyBonus: 5, critBonus: 8, healthBonus: 40 },
  // Grimoire (Black Mage) — T0 Novice / T1 / T2
  { id: 'novice_grimoire', name: 'Grimoire novice', description: 'Tome élémentaire pour apprentis mages.', category: 'weapons', price: 100, icon: '✦', type: 'grimoire', damage: 10, range: 2, accuracyBonus: 10, critBonus: 0 },
  { id: 'mystic_grimoire', name: 'Grimoire mystique', description: 'Tome ancien saturé de mana.', category: 'weapons', price: 260, icon: '✦', type: 'grimoire', damage: 18, range: 3, accuracyBonus: 15, critBonus: 5, healthBonus: 13, skillModifier: { replaces: { n_dark_meteor: 'n_flame_wave' } } },
  { id: 'abyssal_grimoire', name: 'Grimoire des Abysses', description: "Tome interdit débordant d'arcanes noirs.", category: 'weapons', price: 340, icon: '✦', type: 'grimoire', damage: 22, range: 3, accuracyBonus: 18, critBonus: 8, healthBonus: 25 },
  // Crosier (White Mage) — T0 Novice / T1 / T2
  { id: 'novice_crosier', name: 'Crosse novice', description: 'Crosse simple pour canaliser les prières.', category: 'weapons', price: 100, icon: '✚', type: 'crosier', damage: 10, range: 2, accuracyBonus: 10, critBonus: 0 },
  { id: 'sacred_crosier', name: 'Crosse sacrée', description: 'Crosse imprégnée de lumière divine.', category: 'weapons', price: 220, icon: '✚', type: 'crosier', damage: 16, range: 2, accuracyBonus: 12, critBonus: 3, healthBonus: 13 },
  { id: 'miracle_crosier', name: 'Crosse des Miracles', description: "Crosse rayonnant d'énergie bienveillante.", category: 'weapons', price: 340, icon: '✚', type: 'crosier', damage: 20, range: 3, accuracyBonus: 15, critBonus: 5, healthBonus: 25 },
  // Rapier (Red Mage) — T0 Novice / T1 / T2
  { id: 'novice_rapier', name: 'Rapière novice', description: 'Lame fine pour les duellistes en herbe.', category: 'weapons', price: 100, icon: '⚔', type: 'rapier', damage: 14, range: 2, accuracyBonus: 12, critBonus: 8 },
  { id: 'steel_rapier', name: "Rapière d'acier", description: 'Rapière équilibrée à la lame mordante.', category: 'weapons', price: 200, icon: '⚔', type: 'rapier', damage: 20, range: 2, accuracyBonus: 14, critBonus: 10, healthBonus: 18 },
  { id: 'crimson_rapier', name: 'Rapière Cramoisie', description: "Rapière enchantée d'écarlate.", category: 'weapons', price: 320, icon: '⚔', type: 'rapier', damage: 24, range: 2, accuracyBonus: 16, critBonus: 12, healthBonus: 35 },
  // Wand (Enchanter) — T0 Novice / T1 / T2
  { id: 'novice_wand', name: 'Baguette novice', description: 'Baguette de bois pour les premiers enchantements.', category: 'weapons', price: 100, icon: '✦', type: 'wand', damage: 10, range: 2, accuracyBonus: 10, critBonus: 0 },
  { id: 'orb_scepter', name: 'Sceptre-orbe', description: "Sceptre surmonté d'un orbe focalisateur.", category: 'weapons', price: 240, icon: '✦', type: 'wand', damage: 16, range: 3, accuracyBonus: 14, critBonus: 3, healthBonus: 13 },
  { id: 'harmony_scepter', name: "Sceptre d'Harmonie", description: "Sceptre résonnant d'énergie arcanique.", category: 'weapons', price: 340, icon: '✦', type: 'wand', damage: 20, range: 3, accuracyBonus: 16, critBonus: 5, healthBonus: 25 },
  // Longbow (Archer) — T0 Novice / T1 / T2
  { id: 'novice_longbow', name: 'Arc novice', description: 'Arc court pour les engagements proches.', category: 'weapons', price: 120, icon: '⌁', type: 'longbow', damage: 14, range: 4, minRange: 2, accuracyBonus: 0, critBonus: 5 },
  { id: 'longbow', name: 'Arc long', description: 'Excellente portée et puissance accrue.', category: 'weapons', price: 230, icon: '⌁', type: 'longbow', damage: 22, range: 4, minRange: 2, accuracyBonus: 5, critBonus: 10, healthBonus: 15, skillModifier: { replaces: { a_hawk_leap: 'ar_calibrated_shot' } } },
  { id: 'windstep_longbow', name: 'Arc du Vent', description: "Arc nerveux équilibré par des bottes d'éclaireur.", category: 'weapons', price: 340, icon: '⌁', type: 'longbow', damage: 24, range: 4, minRange: 2, accuracyBonus: 8, critBonus: 12, healthBonus: 30, skillModifier: { replaces: { a_arrow_rain: 'ni_shadow_step' } } },
  // Shuriken (Ninja) — T0 Novice / T1 / T2
  { id: 'novice_shuriken', name: 'Shuriken novice', description: 'Étoile de lancer pour les ninjas débutants.', category: 'weapons', price: 80, icon: '✦', type: 'shuriken', damage: 12, range: 3, accuracyBonus: 15, critBonus: 10 },
  { id: 'steel_shuriken', name: "Shuriken d'acier", description: 'Shuriken équilibré à la coupe plus profonde.', category: 'weapons', price: 180, icon: '✦', type: 'shuriken', damage: 18, range: 3, accuracyBonus: 15, critBonus: 12, healthBonus: 15 },
  { id: 'shadow_shuriken', name: "Shuriken de l'Ombre", description: "Shuriken enchanté d'énergie occulte.", category: 'weapons', price: 300, icon: '✦', type: 'shuriken', damage: 22, range: 3, accuracyBonus: 18, critBonus: 15, healthBonus: 30 },
  // Dagger (Rogue) — T0 Novice / T1 / T2
  { id: 'novice_dagger', name: 'Dague novice', description: 'Dague simple pour les rôdeurs en herbe.', category: 'weapons', price: 75, icon: '†', type: 'dagger', damage: 12, range: 1, accuracyBonus: 15, critBonus: 10 },
  { id: 'steel_dagger', name: "Dague d'acier", description: 'Dague équilibrée à la lame plus mordante.', category: 'weapons', price: 170, icon: '†', type: 'dagger', damage: 18, range: 1, accuracyBonus: 17, critBonus: 12, healthBonus: 18 },
  { id: 'hooked_dagger', name: 'Dague Crochue', description: 'Dague recourbée déchirant les défenses.', category: 'weapons', price: 290, icon: '†', type: 'dagger', damage: 22, range: 1, accuracyBonus: 18, critBonus: 15, healthBonus: 35 },
  // Hand cannon (Artillerist) — T0 Novice / T1 / T2
  { id: 'novice_cannon', name: 'Canon novice', description: 'Canon portatif pour les artilleurs débutants.', category: 'weapons', price: 120, icon: '⌁', type: 'hand_cannon', damage: 14, range: 4, minRange: 2, accuracyBonus: 0, critBonus: 5 },
  { id: 'siege_cannon', name: 'Canon de siège', description: 'Canon lourd à la puissance accrue.', category: 'weapons', price: 240, icon: '⌁', type: 'hand_cannon', damage: 22, range: 4, minRange: 2, accuracyBonus: 5, critBonus: 8, healthBonus: 18 },
  { id: 'barrage_cannon', name: 'Canon de Barrage', description: 'Canon dévastateur à tir multiple.', category: 'weapons', price: 360, icon: '⌁', type: 'hand_cannon', damage: 26, range: 4, minRange: 2, accuracyBonus: 8, critBonus: 10, healthBonus: 35 },
];

export const items: ItemDefinition[] = [
  { id: 'strength_ring', name: 'Anneau de Force', description: 'Augmente la force de 5.', category: 'accessories', icon: '◇', price: 100, modifiers: { strength: 5 }, skillModifier: { replaces: { w_break_guard: 'd_cursed_blade' } } },
  { id: 'magic_pendant', name: 'Pendentif magique', description: 'Augmente la magie de 5.', category: 'accessories', icon: '◇', price: 120, modifiers: { magic: 5 } },
  { id: 'life_belt', name: 'Ceinture de Vie', description: 'Augmente les PV de 20.', category: 'accessories', icon: '▰', price: 80, modifiers: { maxHealth: 20 } },
  { id: 'agility_boots', name: 'Bottes d’agilité', description: 'Augmente la dextérité de 5.', category: 'accessories', icon: '⌁', price: 150, modifiers: { dexterity: 5 } },
  { id: 'wisdom_crown', name: 'Couronne de Sagesse', description: 'Augmente la magie de 8.', category: 'accessories', icon: '♛', price: 200, modifiers: { magic: 8 } },
  { id: 'sage_seal', name: 'Sceau du Sage', description: 'Accessoire magique façonné pour stabiliser les arcanes.', category: 'accessories', icon: '✦', price: 310, modifiers: { magic: 10, charisma: 3 }, skillModifier: { replaces: { w_purify: 'e_vigor_rune' } } },
  { id: 'warding_buckle', name: 'Boucle de Garde', description: 'Fermoir défensif gravé pour tenir la ligne.', category: 'accessories', icon: '▰', price: 240, modifiers: { maxHealth: 15, endurance: 4 } },
  { id: 'potion', name: 'Potion légère', description: 'Restaure 55 PV en combat.', category: 'consumables', icon: '◉', price: 15 },
  { id: 'ether', name: 'Éther', description: 'Restaure 2 AP en combat.', category: 'consumables', icon: '◈', price: 35 },
  { id: 'antidote', name: 'Antidote', description: 'Dissipe les altérations négatives.', category: 'consumables', icon: '✚', price: 10 },
  { id: 'bomb', name: 'Bombe', description: 'Inflige des dégâts de zone.', category: 'consumables', icon: '●', price: 30 },
  { id: 'revive_vial', name: 'Fiole de Résurrection', description: 'Ranime une unité tombée au combat à 50% de ses PV max.', category: 'consumables', icon: '✚', price: 60 },
  { id: 'iron_ore', name: 'Minerai de fer', description: 'Un matériau de forge commun.', category: 'materials', icon: '⬟', price: 5 },
  { id: 'red_gem', name: 'Gemme rouge', description: 'Une pierre rare prisée des artisans.', category: 'materials', icon: '◆', price: 50 },
  ...weapons,
];

export const units: UnitDefinition[] = [
  {
    id: 'warrior', name: 'Alistair', className: 'Guerrier', combatKind: 'knight',
    visualProfileId: 'alistair',
    recruitTier: 'core',
    portrait: '/assets/characters/pixel/full/alistair.png',
    baseStats: { maxHealth: 140, strength: 20, magic: 3, endurance: 18, dexterity: 9, charisma: 10, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_greatsword', 'steel_greatsword', 'lion_guard_greatsword'], skillIds: ['w_break_guard', 'w_charge', 'w_whirl', 'w_lion_surge'],
  },
  {
    id: 'white_mage', name: 'Marian', className: 'Mage Blanc', combatKind: 'cleric',
    visualProfileId: 'marian',
    recruitTier: 'core',
    portrait: '/assets/characters/pixel/full/marian.png',
    baseStats: { maxHealth: 100, strength: 6, magic: 22, endurance: 10, dexterity: 11, charisma: 18, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_crosier', 'sacred_crosier', 'miracle_crosier'], skillIds: ['w_salvation', 'w_purify', 'w_sanctuary', 'w_miracle'],
  },
  {
    id: 'dark_mage', name: 'Elara', className: 'Mage Noir', combatKind: 'mage',
    visualProfileId: 'elara',
    recruitTier: 'core',
    portrait: '/assets/characters/pixel/full/elara.png',
    baseStats: { maxHealth: 75, strength: 5, magic: 28, endurance: 7, dexterity: 12, charisma: 14, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_grimoire', 'mystic_grimoire', 'abyssal_grimoire'], skillIds: ['n_dark_bolt', 'n_teleport', 'n_flame_wave', 'n_dark_meteor'],
  },
  {
    id: 'archer', name: 'Kestrel', className: 'Archer', combatKind: 'archer',
    visualProfileId: 'kestrel',
    recruitTier: 'core',
    portrait: '/assets/characters/pixel/full/kestrel.png',
    baseStats: { maxHealth: 90, strength: 14, magic: 3, endurance: 9, dexterity: 22, charisma: 10, moveRange: 3 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_longbow', 'longbow', 'windstep_longbow'], skillIds: ['a_precise_shot', 'a_hawk_leap', 'a_arrow_rain', 'a_zenith_arrow'],
  },
  {
    id: 'rogue', name: 'Cedric', className: 'Rôdeur', combatKind: 'rogue',
    visualProfileId: 'cedric',
    recruitTier: 'optional',
    portrait: '/assets/characters/pixel/full/cedric.png',
    baseStats: { maxHealth: 100, strength: 15, magic: 3, endurance: 10, dexterity: 24, charisma: 10, moveRange: 3 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_dagger', 'steel_dagger', 'hooked_dagger'], skillIds: ['ro_sneak_attack', 'ro_tumble', 'ro_jaw_trap', 'ro_fault_breaker'],
  },
  {
    id: 'lancer', name: 'Garen', className: 'Lancier', combatKind: 'knight',
    visualProfileId: 'lancer',
    recruitTier: 'optional',
    portrait: '/assets/characters/pixel/full/lancer.png',
    baseStats: { maxHealth: 130, strength: 17, magic: 3, endurance: 18, dexterity: 11, charisma: 8, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_spear', 'steel_spear', 'griffon_spear'], skillIds: ['l_long_thrust', 'l_haft_recoil', 'l_griffon_jump', 'l_firmament_lance'],
  },
  {
    id: 'paladin', name: 'Seraphin', className: 'Paladin', combatKind: 'knight',
    visualProfileId: 'lion_champion',
    recruitTier: 'optional',
    portrait: '/assets/characters/pixel/full/lion_champion.png',
    baseStats: { maxHealth: 140, strength: 16, magic: 14, endurance: 17, dexterity: 9, charisma: 14, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_mace', 'sacred_mace', 'oath_mace'], skillIds: ['p_holy_strike', 'p_interpose', 'p_oathwall', 'p_radiant_judgement'],
  },
  {
    id: 'dark_knight', name: 'Maelor', className: 'Chevalier Noir', combatKind: 'knight',
    visualProfileId: 'maelor',
    recruitTier: 'late',
    portrait: '/assets/characters/pixel/full/maelor.png',
    baseStats: { maxHealth: 130, strength: 18, magic: 15, endurance: 14, dexterity: 11, charisma: 8, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_scythe', 'steel_scythe', 'eclipse_scythe'], skillIds: ['d_cursed_blade', 'd_void_step', 'd_blood_pact', 'd_devouring_eclipse'],
  },
  {
    id: 'red_mage', name: 'Séraphine', className: 'Mage Rouge', combatKind: 'mage',
    visualProfileId: 'sage_seraphine',
    recruitTier: 'late',
    portrait: '/assets/characters/pixel/full/seraphine.png',
    baseStats: { maxHealth: 90, strength: 12, magic: 21, endurance: 9, dexterity: 13, charisma: 14, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_rapier', 'steel_rapier', 'crimson_rapier'], skillIds: ['r_arcane_blade', 'r_rune_step', 'r_scarlet_circle', 'r_perfect_duality'],
  },
  {
    id: 'enchanter', name: 'Chroniqueur', className: 'Enchanteur', combatKind: 'cleric',
    visualProfileId: 'chroniqueur',
    recruitTier: 'late',
    portrait: '/assets/characters/pixel/full/chroniqueur.png',
    baseStats: { maxHealth: 85, strength: 5, magic: 23, endurance: 9, dexterity: 12, charisma: 20, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_wand', 'orb_scepter', 'harmony_scepter'], skillIds: ['e_vigor_rune', 'e_transpose', 'e_binding_seal', 'e_absolute_harmony'],
  },
  {
    id: 'ninja', name: 'Sceau', className: 'Ninja', combatKind: 'rogue',
    visualProfileId: 'seal_guardian',
    recruitTier: 'late',
    portrait: '/assets/characters/pixel/full/seal_guardian.png',
    baseStats: { maxHealth: 100, strength: 15, magic: 10, endurance: 10, dexterity: 26, charisma: 10, moveRange: 3 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_shuriken', 'steel_shuriken', 'shadow_shuriken'], skillIds: ['ni_venom_blade', 'ni_shadow_step', 'ni_smoke_bomb', 'ni_silent_assassin'],
  },
  {
    id: 'artillerist', name: 'Artilleur', className: 'Artilleur', combatKind: 'archer',
    visualProfileId: 'fallback_hero',
    recruitTier: 'late',
    portrait: '/assets/characters/pixel/full/fallback_hero.png',
    baseStats: { maxHealth: 100, strength: 15, magic: 4, endurance: 11, dexterity: 19, charisma: 8, moveRange: 2 },
    weaponSlotCount: 1,
    allowedWeaponIds: ['novice_cannon', 'siege_cannon', 'barrage_cannon'], skillIds: ['ar_calibrated_shot', 'ar_explosive_retreat', 'ar_incendiary_grenade', 'ar_artillery_barrage'],
  },
];

export const itemById = new Map(items.map((item) => [item.id, item]));
export const weaponById = new Map(weapons.map((weapon) => [weapon.id, weapon]));
export const unitById = new Map(units.map((unit) => [unit.id, unit]));

export const craftRecipes: CraftRecipeDefinition[] = [
  {
    id: 'craft_lion_guard_greatsword',
    name: 'Forger la Lame du Lion',
    description: 'Transformer une épée d’acier et un anneau de force en arme défensive de front.',
    inputs: { weapons: { steel_greatsword: 1 }, accessories: { strength_ring: 1 }, gold: 120 },
    output: { itemId: 'lion_guard_greatsword', category: 'weapons', quantity: 1 },
    preview: '+27 puissance, précision +8, accorde Rempart.',
  },
  {
    id: 'craft_windstep_longbow',
    name: 'Forger l’Arc du Vent',
    description: 'Assembler un arc long et des bottes d’agilité pour un tireur mobile.',
    inputs: { weapons: { longbow: 1 }, accessories: { agility_boots: 1 }, gold: 130 },
    output: { itemId: 'windstep_longbow', category: 'weapons', quantity: 1 },
    preview: '+24 puissance, critique +12, accorde Bond.',
  },
  {
    id: 'craft_sage_seal',
    name: 'Façonner le Sceau du Sage',
    description: 'Fusionner deux focalisateurs pour stabiliser les soins et les arcanes.',
    inputs: { accessories: { magic_pendant: 1, wisdom_crown: 1 }, gold: 140 },
    output: { itemId: 'sage_seal', category: 'accessories', quantity: 1 },
    preview: '+10 magie, +3 charisme, accorde Régénération.',
  },
  {
    id: 'craft_warding_buckle',
    name: 'Façonner la Boucle de Garde',
    description: 'Renforcer une ceinture de vie par un anneau martial.',
    inputs: { accessories: { life_belt: 1, strength_ring: 1 }, gold: 100 },
    output: { itemId: 'warding_buckle', category: 'accessories', quantity: 1 },
    preview: '+15 PV, +4 endurance.',
  },
];

export const craftRecipeById = new Map(craftRecipes.map((recipe) => [recipe.id, recipe]));

const defaultWeapons: Record<string, string[]> = {
  warrior: ['novice_greatsword'],
  white_mage: ['novice_crosier'],
  dark_mage: ['novice_grimoire'],
  archer: ['novice_longbow'],
  rogue: ['novice_dagger'],
  lancer: ['novice_spear'],
  paladin: ['novice_mace'],
  dark_knight: ['novice_scythe'],
  red_mage: ['novice_rapier'],
  enchanter: ['novice_wand'],
  ninja: ['novice_shuriken'],
  artillerist: ['novice_cannon'],
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
  for (const weaponId of unit.equipment.weaponIds) {
    const weapon = weaponId ? weaponById.get(weaponId) : undefined;
    if (weapon?.healthBonus) result.maxHealth += weapon.healthBonus;
  }
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
    className: definition.className,
    kind: definition.combatKind,
    portrait: definition.portrait,
    stats,
    currentHealth: Math.max(0, Math.min(stats.maxHealth, Math.floor(unit.currentHealth))),
    weapons: unit.equipment.weaponIds
      .map((weaponId) => weaponById.get(weaponId))
      .filter((weapon): weapon is WeaponDefinition => weapon !== undefined),
    skills: skillIds,
    skillUpgrades,
  };
}
