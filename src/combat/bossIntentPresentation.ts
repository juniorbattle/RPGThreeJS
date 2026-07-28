export type BossIntentLevel = 'charge' | 'ultimate';

export interface BossIntentSource {
  alive: boolean;
  boss?: boolean;
  elite?: boolean;
  ap: number;
  cooldown: number;
  previewLevel?: BossIntentLevel;
}

export interface BossIntentVisualState {
  level: BossIntentLevel;
  label: 'CHARGE' | 'ULTIME';
  minOpacity: number;
  badgeScale: number;
  ringPulse: number;
  silhouettePulse: number;
}

export function resolveBossIntentVisualState(
  source: BossIntentSource,
  reducedGraphics = false,
): BossIntentVisualState | null {
  const previewing = source.previewLevel !== undefined;
  if (!source.alive || (!source.boss && !source.elite && !previewing)) return null;

  const level = source.previewLevel
    ?? (source.cooldown === 0 && source.ap >= 5
      ? 'ultimate'
      : source.cooldown <= 1 && source.ap >= 3
        ? 'charge'
        : null);
  if (!level) return null;

  const isBoss = Boolean(source.boss || (!source.elite && previewing));
  const ultimate = level === 'ultimate';
  const badgeScale = isBoss ? (ultimate ? 0.92 : 0.84) : (ultimate ? 0.76 : 0.7);
  const ringPulse = isBoss ? (ultimate ? 0.22 : 0.16) : (ultimate ? 0.14 : 0.1);

  return {
    level,
    label: ultimate ? 'ULTIME' : 'CHARGE',
    minOpacity: isBoss ? 0.85 : 0.75,
    badgeScale: reducedGraphics ? badgeScale * 0.92 : badgeScale,
    ringPulse: reducedGraphics ? ringPulse * 0.62 : ringPulse,
    silhouettePulse: reducedGraphics ? 0 : isBoss ? (ultimate ? 0.18 : 0.12) : (ultimate ? 0.11 : 0.07),
  };
}
