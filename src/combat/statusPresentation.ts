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
  indicatorAssetId: string;
  indicatorUrl?: string;
  carouselHoldMs: number;
  carouselTransitionMs: number;
  spriteScale: number;
  reducedGraphicsScale: number;
}

export interface StatusIndicatorAsset {
  id: string;
  url?: string;
  fallback: 'canvas';
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

export interface CarouselStatusOptions {
  exhausted?: boolean;
  phaseOffsetMs?: number;
  reducedGraphics?: boolean;
}

export interface CarouselStatusFrame {
  current: VisibleStatusIndicator;
  next?: VisibleStatusIndicator;
  previous?: VisibleStatusIndicator;
  activeIndex: number;
  total: number;
  signature: string;
  transitionProgress: number;
  holdMs: number;
  transitionMs: number;
  spriteScale: number;
}

export interface ResolvedStatusCarousel {
  indicators: readonly VisibleStatusIndicator[];
  signature: string;
}

const RUNTIME_INDICATOR_URLS: Partial<Record<StatusPresentationKey, string>> = {
  burn: '/assets/status-indicators/runtime/status_burn_indicator.png',
  poison: '/assets/status-indicators/runtime/status_poison_indicator.png',
  slow: '/assets/status-indicators/runtime/status_slow_indicator.png',
  root: '/assets/status-indicators/runtime/status_root_indicator.png',
  blind: '/assets/status-indicators/runtime/status_blind_indicator.png',
  weak: '/assets/status-indicators/runtime/status_weak_indicator.png',
  curse: '/assets/status-indicators/runtime/status_curse_indicator.png',
  silence: '/assets/status-indicators/runtime/status_silence_indicator.png',
  exhausted: '/assets/status-indicators/runtime/status_exhausted_indicator.png',
  staggered: '/assets/status-indicators/runtime/status_staggered_indicator.png',
};

const definitions: StatusPresentation[] = [
  { key: 'staggered', shortCode: 'BRI', label: 'Brisé', priority: 1, color: '#fff1dc', backgroundColor: '#9d351f', borderColor: '#ff8455', cue: 'cracked_diamond', polarity: 'state', pulseProfile: 'urgent', indicatorAssetId: 'status_staggered_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.staggered, carouselHoldMs: 1500, carouselTransitionMs: 220, spriteScale: 1.08, reducedGraphicsScale: .98 },
  { key: 'exhausted', shortCode: 'ESS', label: 'Essoufflé', priority: 2, color: '#fff5c8', backgroundColor: '#796d36', borderColor: '#dcc96d', cue: 'fatigue_pulse', polarity: 'state', pulseProfile: 'calm', indicatorAssetId: 'status_exhausted_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.exhausted, carouselHoldMs: 1250, carouselTransitionMs: 200, spriteScale: 1.03, reducedGraphicsScale: .98 },
  { key: 'root', shortCode: 'RAC', label: 'Racines', priority: 3, color: '#e3f6a3', backgroundColor: '#476531', borderColor: '#91bd52', cue: 'root_knot', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_root_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.root, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'silence', shortCode: 'SIL', label: 'Silence', priority: 4, color: '#e2d9ff', backgroundColor: '#4b3f74', borderColor: '#9b83df', cue: 'sealed_rune', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_silence_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.silence, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'curse', shortCode: 'MAL', label: 'Malédiction', priority: 5, color: '#f0c9ff', backgroundColor: '#5b286b', borderColor: '#bd67e6', cue: 'dark_rune', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_curse_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.curse, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'burn', shortCode: 'BRÛ', label: 'Brûlure', priority: 6, color: '#fff0c2', backgroundColor: '#a7431e', borderColor: '#ff983d', cue: 'flame', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_burn_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.burn, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1.02, reducedGraphicsScale: .96 },
  { key: 'poison', shortCode: 'POI', label: 'Poison', priority: 7, color: '#e5ffd4', backgroundColor: '#2d7146', borderColor: '#66d37e', cue: 'droplet', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_poison_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.poison, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'blind', shortCode: 'AVE', label: 'Aveuglement', priority: 8, color: '#fff5df', backgroundColor: '#775934', borderColor: '#e3b964', cue: 'crossed_eye', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_blind_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.blind, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'weak', shortCode: 'FAI', label: 'Affaibli', priority: 9, color: '#ffe0da', backgroundColor: '#864245', borderColor: '#dc7c80', cue: 'fracture', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_weak_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.weak, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'slow', shortCode: 'RAL', label: 'Ralenti', priority: 10, color: '#d8efff', backgroundColor: '#365d78', borderColor: '#70b6df', cue: 'spiral', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_slow_indicator', indicatorUrl: RUNTIME_INDICATOR_URLS.slow, carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: 1, reducedGraphicsScale: .96 },
  { key: 'taunt', shortCode: 'PRO', label: 'Provocation', priority: 11, color: '#fff2d4', backgroundColor: '#86612e', borderColor: '#dca64b', cue: 'provocation_mark', polarity: 'negative', pulseProfile: 'normal', indicatorAssetId: 'status_taunt_indicator', carouselHoldMs: 1050, carouselTransitionMs: 200, spriteScale: .92, reducedGraphicsScale: .96 },
  { key: 'regen', shortCode: 'REG', label: 'Régénération', priority: 12, color: '#e4ffd8', backgroundColor: '#32704a', borderColor: '#75d38d', cue: 'leaf_pulse', polarity: 'positive', pulseProfile: 'positive', indicatorAssetId: 'status_regen_indicator', carouselHoldMs: 950, carouselTransitionMs: 180, spriteScale: .92, reducedGraphicsScale: .96 },
  { key: 'boost', shortCode: 'FOR', label: 'Force', priority: 13, color: '#fff2c0', backgroundColor: '#80622a', borderColor: '#e2bb53', cue: 'upward_mark', polarity: 'positive', pulseProfile: 'positive', indicatorAssetId: 'status_boost_indicator', carouselHoldMs: 950, carouselTransitionMs: 180, spriteScale: .92, reducedGraphicsScale: .96 },
  { key: 'barrier', shortCode: 'BAR', label: 'Barrière', priority: 14, color: '#d5f3ff', backgroundColor: '#2e6079', borderColor: '#69bee3', cue: 'shield', polarity: 'positive', pulseProfile: 'positive', indicatorAssetId: 'status_barrier_indicator', carouselHoldMs: 950, carouselTransitionMs: 180, spriteScale: .92, reducedGraphicsScale: .96 },
];

export const STATUS_PRESENTATIONS: Readonly<Record<StatusPresentationKey, StatusPresentation>> = Object.freeze(
  Object.fromEntries(definitions.map((definition) => [definition.key, definition])) as Record<StatusPresentationKey, StatusPresentation>,
);

export function getStatusPresentation(key: string): StatusPresentation | undefined {
  return STATUS_PRESENTATIONS[key as StatusPresentationKey];
}

export function getStatusIndicatorAsset(key: string): StatusIndicatorAsset | undefined {
  const presentation = getStatusPresentation(key);
  return presentation ? { id: presentation.indicatorAssetId, url: presentation.indicatorUrl, fallback: 'canvas' } : undefined;
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

function carouselSignature(indicators: readonly VisibleStatusIndicator[]): string {
  return indicators.map((indicator) => `${indicator.key}:${indicator.turns ?? 0}:${indicator.derived ? 'derived' : 'native'}`).join('|');
}

export function resolveStatusCarousel(
  statuses: Record<string, number | undefined> = {},
  exhausted = false,
): ResolvedStatusCarousel {
  const indicators = getVisibleStatusIndicators(statuses, { exhausted, maxVisible: Number.POSITIVE_INFINITY }).visible;
  return { indicators, signature: carouselSignature(indicators) };
}

export function getResolvedCarouselStatusFrame(
  model: ResolvedStatusCarousel,
  elapsedMs = 0,
  { phaseOffsetMs = 0, reducedGraphics = false }: Omit<CarouselStatusOptions, 'exhausted'> = {},
): CarouselStatusFrame | null {
  const { indicators, signature } = model;
  if (!indicators.length) return null;

  const scaleFor = (indicator: VisibleStatusIndicator) => indicator.spriteScale * (reducedGraphics ? indicator.reducedGraphicsScale : 1);
  if (indicators.length === 1) {
    const current = indicators[0]!;
    return {
      current,
      activeIndex: 0,
      total: 1,
      signature,
      transitionProgress: 0,
      holdMs: current.carouselHoldMs,
      transitionMs: reducedGraphics ? Math.min(current.carouselTransitionMs, 150) : current.carouselTransitionMs,
      spriteScale: scaleFor(current),
    };
  }

  const cycleMs = indicators.reduce((total, indicator) => total + indicator.carouselHoldMs, 0);
  let cursor = ((Math.max(0, elapsedMs) + Math.max(0, phaseOffsetMs)) % cycleMs + cycleMs) % cycleMs;
  let activeIndex = 0;
  for (; activeIndex < indicators.length; activeIndex += 1) {
    const holdMs = indicators[activeIndex]!.carouselHoldMs;
    if (cursor < holdMs) break;
    cursor -= holdMs;
  }
  const current = indicators[Math.min(activeIndex, indicators.length - 1)]!;
  const transitionMs = reducedGraphics ? Math.min(current.carouselTransitionMs, 150) : current.carouselTransitionMs;
  const transitionStart = Math.max(0, current.carouselHoldMs - transitionMs);
  const transitionProgress = cursor <= transitionStart || transitionMs <= 0
    ? 0
    : Math.min(1, (cursor - transitionStart) / transitionMs);
  const nextIndex = (activeIndex + 1) % indicators.length;

  return {
    current,
    next: indicators[nextIndex]!,
    previous: indicators[(activeIndex - 1 + indicators.length) % indicators.length]!,
    activeIndex,
    total: indicators.length,
    signature,
    transitionProgress,
    holdMs: current.carouselHoldMs,
    transitionMs,
    spriteScale: scaleFor(current),
  };
}

export function getCarouselStatusFrame(
  statuses: Record<string, number | undefined> = {},
  elapsedMs = 0,
  { exhausted = false, phaseOffsetMs = 0, reducedGraphics = false }: CarouselStatusOptions = {},
): CarouselStatusFrame | null {
  return getResolvedCarouselStatusFrame(resolveStatusCarousel(statuses, exhausted), elapsedMs, {
    phaseOffsetMs,
    reducedGraphics,
  });
}
