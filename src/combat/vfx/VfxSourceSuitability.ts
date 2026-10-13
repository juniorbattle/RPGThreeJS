export type VfxSourceSuitability =
  | 'COMBAT_EFFECT'
  | 'SUPPORT_EFFECT'
  | 'INDICATOR_UI'
  | 'AMBIGUOUS_REVIEW';

export interface VfxSourceSuitabilityInput {
  assetId?: string;
  sourceFilename?: string;
  relativePath?: string;
  classificationStatus?: string;
  category?: string;
  tags?: readonly string[];
}

export interface CandidateAssignmentRepair {
  actionKey: string;
  previousCandidateId: string;
  replacementCandidateId: string;
  reason: string;
}

export const SOURCE_ASSIGNMENT_REPAIRS: readonly CandidateAssignmentRepair[] = [
  {
    actionKey: 'a_arrow_rain',
    previousCandidateId: 'r1_0004',
    replacementCandidateId: 'r1_0614',
    reason: 'Arrow_Indicator_V4 is an interface marker; Impact_Wind_Lv3 is a combat-readable field impact.',
  },
  {
    actionKey: 'a_zenith_arrow',
    previousCandidateId: 'r1_0005',
    replacementCandidateId: 'r1_0963',
    reason: 'Arrow_Indicator_V5 is an interface marker; Projectile_Wind_Ball_Lv3 is a directional combat projectile.',
  },
] as const;

const UI_PATTERNS = [
  /(?:^|[_\s-])indicator(?:$|[_\s-])/,
  /(?:^|[_\s-])interface(?:$|[_\s-])/,
  /(?:^|[_\s-])pointer(?:$|[_\s-])/,
  /(?:^|[_\s-])cursor(?:$|[_\s-])/,
  /(?:^|[_\s-])reticle(?:$|[_\s-])/,
  /(?:^|[_\s-])waypoint(?:$|[_\s-])/,
  /(?:^|[_\s-])chevron(?:$|[_\s-])/,
  /(?:^|[_\s-])navigation(?:$|[_\s-])/,
  /(?:^|[_\s-])selection(?:$|[_\s-])/,
  /(?:^|[_\s-])marker(?:$|[_\s-])/,
] as const;

const SUPPORT_TERMS = [
  'heal', 'healing', 'buff', 'barrier', 'aura', 'revive', 'bless', 'regen', 'shield',
  'restore', 'cleanse', 'power_up', 'power up', 'charge_up', 'charge up', 'support',
] as const;

const COMBAT_TERMS = [
  'impact', 'hit', 'slash', 'cut', 'stab', 'pierce', 'shot', 'projectile', 'explosion',
  'blast', 'burst', 'fire', 'ice', 'lightning', 'thunder', 'darkness', 'dark', 'poison',
  'wind', 'shockwave', 'smash', 'claw', 'bite', 'eruption', 'beam', 'meteor', 'trail',
  'attack', 'punch', 'kick', 'weapon', 'grenade', 'artillery', 'rain', 'bomb', 'mace',
  'sword', 'spear', 'arrow',
] as const;

function normalizeSourceMetadata(input: VfxSourceSuitabilityInput): string {
  return [input.assetId, input.sourceFilename, input.relativePath, input.classificationStatus, input.category, ...(input.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[./\\]+/g, ' ')
    .replace(/[^a-z0-9_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyVfxSourceSuitability(input: VfxSourceSuitabilityInput): VfxSourceSuitability {
  const metadata = normalizeSourceMetadata(input);
  if (UI_PATTERNS.some((pattern) => pattern.test(metadata))) return 'INDICATOR_UI';
  if (SUPPORT_TERMS.some((term) => metadata.includes(term))) return 'SUPPORT_EFFECT';
  if (COMBAT_TERMS.some((term) => metadata.includes(term))) return 'COMBAT_EFFECT';
  return 'AMBIGUOUS_REVIEW';
}

export function filterDefaultComposerCatalogue<T extends { suitability: VfxSourceSuitability }>(records: readonly T[]): T[] {
  return records.filter((record) => record.suitability !== 'INDICATOR_UI');
}

export function repairCandidateAssignment(actionKey: string, candidateId: string): string {
  const repair = SOURCE_ASSIGNMENT_REPAIRS.find(
    (entry) => entry.actionKey === actionKey && entry.previousCandidateId === candidateId,
  );
  return repair?.replacementCandidateId ?? candidateId;
}

export function repairComposerDraftAssignments<
  TSlot extends { candidateId: string },
  TDraft extends { actionKey: string; visualSlots: TSlot[] },
>(draft: TDraft): TDraft {
  let changed = false;
  const visualSlots = draft.visualSlots.map((slot) => {
    const candidateId = repairCandidateAssignment(draft.actionKey, slot.candidateId);
    if (candidateId === slot.candidateId) return slot;
    changed = true;
    return { ...slot, candidateId };
  });
  return changed ? ({ ...draft, visualSlots } as TDraft) : draft;
}
