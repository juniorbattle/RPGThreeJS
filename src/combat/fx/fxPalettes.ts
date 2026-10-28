/**
 * Element palettes for the procedural combat FX. Each palette runs from the
 * white-hot core to the darkest edge, the way Octopath-style effects read:
 * a bright core that blooms, a saturated body and a dark rim.
 */
export type FxElement =
  | 'steel' | 'blunt' | 'fire' | 'ice' | 'holy' | 'shadow' | 'poison' | 'lightning'
  | 'nature' | 'arcane' | 'wind' | 'heal' | 'blood' | 'gold' | 'earth' | 'smoke';

export interface FxPalette {
  core: string;
  body: string;
  edge: string;
  dark: string;
  /** Light colour cast on the arena by the effect. */
  light: string;
}

export const FX_PALETTES: Readonly<Record<FxElement, FxPalette>> = Object.freeze({
  steel: { core: '#ffffff', body: '#fff1cf', edge: '#ffc966', dark: '#8a6430', light: '#ffe2a8' },
  blunt: { core: '#ffffff', body: '#ffe7b8', edge: '#e0a35e', dark: '#6e4a2a', light: '#ffd9a0' },
  fire: { core: '#fff6cf', body: '#ffb347', edge: '#ff5a1f', dark: '#7a1e0e', light: '#ff8a3a' },
  ice: { core: '#f4ffff', body: '#a8ecff', edge: '#4aa8ff', dark: '#1b3d8c', light: '#8fd6ff' },
  holy: { core: '#fffdf0', body: '#ffe48f', edge: '#f2c14e', dark: '#a8781e', light: '#ffe6a0' },
  shadow: { core: '#f3dcff', body: '#b06aff', edge: '#6a2bbf', dark: '#1a0833', light: '#9d5cff' },
  poison: { core: '#f0ffd0', body: '#a6f25a', edge: '#5dbb2a', dark: '#234d12', light: '#9be35a' },
  lightning: { core: '#ffffff', body: '#fff59a', edge: '#8ad8ff', dark: '#3a5cff', light: '#bfe4ff' },
  nature: { core: '#f0ffd8', body: '#a6e06a', edge: '#4f8a2b', dark: '#2a4a18', light: '#b6f08a' },
  arcane: { core: '#fff2ff', body: '#ff9ef3', edge: '#b56cff', dark: '#4b2a8f', light: '#e09bff' },
  wind: { core: '#f6fff9', body: '#c4ffe2', edge: '#6fdcb0', dark: '#2f7a62', light: '#c4ffe2' },
  heal: { core: '#f8fff2', body: '#c2ffb6', edge: '#6ee07a', dark: '#2e8a46', light: '#b8ffb0' },
  blood: { core: '#ffe2e2', body: '#ff6a6a', edge: '#c0182a', dark: '#4a0710', light: '#ff5a5a' },
  gold: { core: '#fffbe6', body: '#ffe27a', edge: '#ffb52a', dark: '#8a5a10', light: '#ffd66a' },
  earth: { core: '#fff2d8', body: '#d8b07a', edge: '#8a6438', dark: '#3e2a16', light: '#e8c08a' },
  smoke: { core: '#e8e4f0', body: '#9a94a8', edge: '#5a5468', dark: '#24202c', light: '#b0a8c0' },
});

/** Element inferred from VFX preset tags (first match wins). */
const TAG_ELEMENT: Array<[string, FxElement]> = [
  ['heal', 'heal'], ['revive', 'holy'], ['regen', 'heal'], ['cleanse', 'holy'],
  ['fire', 'fire'], ['frost', 'ice'], ['ice', 'ice'], ['lightning', 'lightning'],
  ['poison', 'poison'], ['void', 'shadow'], ['shadow', 'shadow'], ['dark', 'shadow'], ['curse', 'shadow'],
  ['holy', 'holy'], ['sacred', 'holy'], ['light', 'holy'], ['bless', 'holy'], ['barrier', 'holy'],
  ['golden', 'gold'], ['arcane', 'arcane'], ['wind', 'wind'], ['nature', 'nature'], ['root', 'nature'],
  ['earth', 'earth'], ['ground', 'earth'], ['smoke', 'smoke'], ['blunt', 'blunt'],
];

export function elementForTags(tags: readonly string[], fallback: FxElement = 'steel'): FxElement {
  for (const [tag, element] of TAG_ELEMENT) if (tags.includes(tag)) return element;
  return fallback;
}
