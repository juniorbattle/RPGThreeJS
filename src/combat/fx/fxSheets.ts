import fxSheetsJson from '../../render/generated/combatFxSheets.json';

export interface FxSheetEntry {
  file: string;
  grid: [number, number];
  frames: number;
  /** Hand-written pixel effect (tools/pixel-fx): crisp texels, flat colours, normal blending. */
  pixel?: boolean;
  /** Fixed world size, so the frames keep the sprites' pixel density. */
  worldSize?: number;
  /** Frame height, from the bottom, that sits on the anchor. Centre by default. */
  pivotY?: number;
}

/** Frame sheets layered on the ultimates (tools/pixel-fx, tools/openai-art). */
export const FX_SHEETS = (fxSheetsJson as unknown as { sheets: Record<string, FxSheetEntry> }).sheets;

const PIXEL_TRIAL_KEY = 'rpg-threejs:combat-pixel-fx:v1';

/** The operator's trial of the pixel sheets: a local preference outside V6, off by default. */
export function pixelSheetsTrial(): boolean {
  try {
    return localStorage.getItem(PIXEL_TRIAL_KEY) === 'on';
  } catch {
    return false;
  }
}

export function setPixelSheetsTrial(on: boolean): void {
  try {
    if (on) localStorage.setItem(PIXEL_TRIAL_KEY, 'on');
    else localStorage.removeItem(PIXEL_TRIAL_KEY);
  } catch {
    // storage refused: the trial simply stays off
  }
}

export function fxSheetPlayable(id: string): FxSheetEntry | null {
  const entry = FX_SHEETS[id];
  if (!entry) return null;
  return entry.pixel && !pixelSheetsTrial() ? null : entry;
}
