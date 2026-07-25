export type StatusPolarity = 'negative' | 'positive' | 'state';

export type StatusPresentationKey =
  | 'staggered'
  | 'exhausted'
  | 'root'
  | 'silence'
  | 'curse'
  | 'burn'
  | 'poison'
  | 'blind'
  | 'weak'
  | 'slow'
  | 'taunt'
  | 'regen'
  | 'boost'
  | 'barrier';

export interface StatusPresentation {
  key: StatusPresentationKey;
  shortCode: string;
  label: string;
  priority: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  cue: string;
  polarity: StatusPolarity;
  pulseProfile: 'urgent' | 'calm' | 'normal' | 'positive';
}

export interface VisibleStatusIndicator extends StatusPresentation {
  turns?: number;
  derived?: boolean;
}

export interface VisibleStatusOptions {
  exhausted?: boolean;
  maxVisible?: number;
}

export interface VisibleStatusResult {
  visible: VisibleStatusIndicator[];
  overflowCount: number;
}

const definitions: StatusPresentation[] = [
  { key: 'staggered', shortCode: 'BRI', label: 'Brisé', priority: 1, color: '#fff1dc', backgroundColor: '#9d351f', borderColor: '#ff8455', cue: 'cracked_diamond', polarity: 'state', pulseProfile: 'urgent' },
  { key: 'exhausted', shortCode: 'ESS', label: 'Essoufflé', priority: 2, color: '#fff5c8', backgroundColor: '#796d36', borderColor: '#dcc96d', cue: 'fatigue_pulse', polarity: 'state', pulseProfile: 'calm' },
  { key: 'root', shortCode: 'RAC', label: 'Racines', priority: 3, color: '#e3f6a3', backgroundColor: '#476531', borderColor: '#91bd52', cue: 'root_knot', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'silence', shortCode: 'SIL', label: 'Silence', priority: 4, color: '#e2d9ff', backgroundColor: '#4b3f74', borderColor: '#9b83df', cue: 'sealed_rune', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'curse', shortCode: 'MAL', label: 'Malédiction', priority: 5, color: '#f0c9ff', backgroundColor: '#5b286b', borderColor: '#bd67e6', cue: 'dark_rune', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'burn', shortCode: 'BRÛ', label: 'Brûlure', priority: 6, color: '#fff0c2', backgroundColor: '#a7431e', borderColor: '#ff983d', cue: 'flame', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'poison', shortCode: 'POI', label: 'Poison', priority: 7, color: '#e5ffd4', backgroundColor: '#2d7146', borderColor: '#66d37e', cue: 'droplet', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'blind', shortCode: 'AVE', label: 'Aveuglement', priority: 8, color: '#fff5df', backgroundColor: '#775934', borderColor: '#e3b964', cue: 'crossed_eye', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'weak', shortCode: 'FAI', label: 'Affaibli', priority: 9, color: '#ffe0da', backgroundColor: '#864245', borderColor: '#dc7c80', cue: 'fracture', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'slow', shortCode: 'RAL', label: 'Ralenti', priority: 10, color: '#d8efff', backgroundColor: '#365d78', borderColor: '#70b6df', cue: 'spiral', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'taunt', shortCode: 'PRO', label: 'Provocation', priority: 11, color: '#fff2d4', backgroundColor: '#86612e', borderColor: '#dca64b', cue: 'provocation_mark', polarity: 'negative', pulseProfile: 'normal' },
  { key: 'regen', shortCode: 'REG', label: 'Régénération', priority: 12, color: '#e4ffd8', backgroundColor: '#32704a', borderColor: '#75d38d', cue: 'leaf_pulse', polarity: 'positive', pulseProfile: 'positive' },
  { key: 'boost', shortCode: 'FOR', label: 'Force', priority: 13, color: '#fff2c0', backgroundColor: '#80622a', borderColor: '#e2bb53', cue: 'upward_mark', polarity: 'positive', pulseProfile: 'positive' },
  { key: 'barrier', shortCode: 'BAR', label: 'Barrière', priority: 14, color: '#d5f3ff', backgroundColor: '#2e6079', borderColor: '#69bee3', cue: 'shield', polarity: 'positive', pulseProfile: 'positive' },
];

export const STATUS_PRESENTATIONS: Readonly<Record<StatusPresentationKey, StatusPresentation>> = Object.freeze(
  Object.fromEntries(definitions.map((definition) => [definition.key, definition])) as Record<StatusPresentationKey, StatusPresentation>,
);

export function getStatusPresentation(key: string): StatusPresentation | undefined {
  return STATUS_PRESENTATIONS[key as StatusPresentationKey];
}

export function getStatusPriority(key: string): number {
  return getStatusPresentation(key)?.priority ?? Number.POSITIVE_INFINITY;
}

export function getStatusLabel(key: string): string | undefined {
  return getStatusPresentation(key)?.label;
}

export function getStatusShortCode(key: string): string | undefined {
  return getStatusPresentation(key)?.shortCode;
}

export function getVisibleStatusIndicators(
  statuses: Record<string, number | undefined> = {},
  { exhausted = false, maxVisible = 3 }: VisibleStatusOptions = {},
): VisibleStatusResult {
  const indicators: VisibleStatusIndicator[] = [];
  for (const [key, turns] of Object.entries(statuses)) {
    if (typeof turns !== 'number' || turns <= 0) continue;
    const presentation = getStatusPresentation(key);
    if (presentation) indicators.push({ ...presentation, turns });
  }

  if (exhausted && !indicators.some((indicator) => indicator.key === 'staggered')) {
    const exhaustedPresentation = getStatusPresentation('exhausted');
    if (exhaustedPresentation) indicators.push({ ...exhaustedPresentation, derived: true });
  }

  indicators.sort((left, right) => left.priority - right.priority || left.key.localeCompare(right.key));
  const safeMax = Math.max(0, maxVisible);
  return {
    visible: indicators.slice(0, safeMax),
    overflowCount: Math.max(0, indicators.length - safeMax),
  };
}
