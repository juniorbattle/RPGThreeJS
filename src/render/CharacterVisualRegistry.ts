import manifestJson from './generated/characterSystemV2Manifest.json';

export type CharacterScaleFamily = 'SMALL_CREATURE' | 'STANDARD_HUMANOID' | 'LARGE_ELITE_BOSS';
export type CharacterNonCombatRole = 'master' | 'full' | 'dialogue' | 'ui';

export interface CharacterVisualProfile {
  readonly unitId: string;
  readonly scaleFamily: CharacterScaleFamily;
  readonly worldUnitsPerPixel: number;
  readonly master: string;
  readonly full: string;
  readonly dialogue: string;
  readonly ui: string;
  readonly combatPoseUnitId: string | undefined;
}

interface ManifestUnit {
  unitId: string;
  scaleFamily: CharacterScaleFamily;
  worldUnitsPerPixel: number;
  master: { src: string };
  roles: { full: string; dialogue: string; ui: string };
  poses?: Record<string, unknown>;
}

const manifest = manifestJson as unknown as {
  status: string;
  units: ManifestUnit[];
};

if (manifest.status !== 'PROMOTED') {
  throw new Error('Character System V2 production manifest is not promoted.');
}

const PROFILES = Object.freeze(manifest.units.map((unit): CharacterVisualProfile => Object.freeze({
  unitId: unit.unitId,
  scaleFamily: unit.scaleFamily,
  worldUnitsPerPixel: unit.worldUnitsPerPixel,
  master: unit.master.src,
  full: unit.roles.full,
  dialogue: unit.roles.dialogue,
  ui: unit.roles.ui,
  combatPoseUnitId: Object.keys(unit.poses ?? {}).length === 4 ? unit.unitId : undefined,
})));

const profilesById = new Map(PROFILES.map((profile) => [profile.unitId, profile]));

const identityAliases = new Map<string, string>([
  ['warrior', 'alistair'],
  ['marian', 'white_mage'],
  ['elara', 'dark_mage'],
  ['kestrel', 'archer'],
  ['cedric', 'rogue'],
  ['serpent_elite_raider', 'serpent_duelist_elite'],
  ['serpent_captain', 'serpent_general_boss'],
  ['young_wyrm', 'young_dragon_elite'],
  ['lion_chief', 'lion_champion'],
  ['seraphine', 'sage_seraphine'],
]);

for (const profile of PROFILES) {
  identityAliases.set(profile.unitId, profile.unitId);
  // V2 masters own every non-combat identity role for the promoted roster.
  if (!identityAliases.has(profile.full)) identityAliases.set(profile.full, profile.unitId);
}

export function resolveCharacterUnitId(identity: string | null | undefined): string | undefined {
  if (!identity) return undefined;
  return identityAliases.get(identity.replaceAll('\\', '/'));
}

export function resolveCharacterVisualProfile(
  identity: string | null | undefined,
): CharacterVisualProfile | undefined {
  const unitId = resolveCharacterUnitId(identity);
  return unitId ? profilesById.get(unitId) : undefined;
}

export function resolveCharacterAsset(
  identity: string | null | undefined,
  role: CharacterNonCombatRole,
): string | undefined {
  return resolveCharacterVisualProfile(identity)?.[role];
}

export function listCharacterVisualProfiles(): readonly CharacterVisualProfile[] {
  return PROFILES;
}
