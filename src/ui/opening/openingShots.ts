import { prologuePanels, type ProloguePanel } from '../../game/prologue';
import { assets } from '../../render/assetManifest';

/** Pace and framing of the opening (OD-2026-11-02-A). The words belong to `prologuePanels`, the pictures to the asset manifest. */
export const IMAGE_WIDTH = 1672;
export const IMAGE_HEIGHT = 941;

export type OpeningShotId = ProloguePanel['id'];

export interface CameraKey { x: number; y: number; zoom: number }
export interface OpeningLine { at: number; text: string }

export interface OpeningShot {
  id: OpeningShotId;
  seconds: number;
  image: string;
  from: CameraKey;
  to: CameraKey;
  lines: readonly OpeningLine[];
}

const FRAMING: ReadonlyArray<{ id: OpeningShotId; seconds: number; lineAt: readonly number[]; from: CameraKey; to: CameraKey }> = [
  { id: 'prologue_fall', seconds: 9, lineAt: [0.9, 4.4], from: { x: 742, y: 430, zoom: 1.2 }, to: { x: 836, y: 440, zoom: 1.08 } },
  { id: 'prologue_seals', seconds: 12, lineAt: [0.8, 6.2], from: { x: 1085, y: 660, zoom: 1.42 }, to: { x: 950, y: 400, zoom: 1.16 } },
  { id: 'prologue_lion', seconds: 12, lineAt: [3.2], from: { x: 836, y: 392, zoom: 1.02 }, to: { x: 800, y: 408, zoom: 1.12 } },
  { id: 'prologue_shadow', seconds: 10, lineAt: [0.9], from: { x: 950, y: 440, zoom: 1.16 }, to: { x: 722, y: 440, zoom: 1.16 } },
  { id: 'prologue_departure', seconds: 12, lineAt: [5.2], from: { x: 836, y: 470, zoom: 1.14 }, to: { x: 836, y: 470.5, zoom: 1 } },
];

const scenes = assets.prologueScenes as Partial<Record<OpeningShotId, string>>;

export const OPENING_SHOTS: readonly OpeningShot[] = FRAMING.map(({ lineAt, ...framing }) => ({
  ...framing,
  image: scenes[framing.id] ?? '',
  lines: (prologuePanels.find(panel => panel.id === framing.id)?.lines ?? []).map((text, index) => ({ at: lineAt[index] ?? 0, text })),
}));

/**
 * The four heroes gather in the middle of the camp, on its ground, in image pixels: two come from the fire, two from
 * the wagons, and they face each other as they do in the dialogue that follows. `from` is where each one starts walking.
 */
export interface CampActor { id: string; at: number; x: number; y: number; from: number; facing: 'LEFT' | 'RIGHT' }
export const OPENING_CAST: readonly CampActor[] = [
  { id: 'alistair', at: 0.4, x: 934, y: 646, from: 1330, facing: 'LEFT' },
  { id: 'marian', at: 1.1, x: 1040, y: 630, from: 1420, facing: 'LEFT' },
  { id: 'kestrel', at: 1.8, x: 740, y: 646, from: 400, facing: 'RIGHT' },
  { id: 'elara', at: 2.5, x: 636, y: 630, from: 330, facing: 'RIGHT' },
];
/**
 * Séraphine and Maelor, who open the dialogue that follows, stand on either side of the fire, on the left where the
 * dialogue puts them. They show once the heroes have faded, so the camp never holds more than four visible actors
 * (PRESENTATION_AND_MEDIA.md), and the dialogue opens on the two of them.
 */
export const OPENING_ADVISERS: readonly CampActor[] = [
  { id: 'maelor', at: 8.8, x: 268, y: 586, from: 268, facing: 'RIGHT' },
  { id: 'sage_seraphine', at: 9, x: 494, y: 598, from: 494, facing: 'RIGHT' },
];

/** The heroes fade from the camp from this second, over OPENING_ACTOR_FADE_SECONDS. */
export const OPENING_ACTOR_FADE_AT = 7.6;
export const OPENING_ACTOR_FADE_SECONDS = 1.1;
export const OPENING_BARS_OPEN_AT = 9.9;
export const OPENING_POLE_CRACKS_AT = 5;
export const OPENING_POLE_LANDS_AT = 6.15;
export const OPENING_SHEETS = ['serpent_raider', 'serpent_brute'] as const;
/** The cast of the dialogue that follows, loaded with the rest: its first line must not wait for them. */
export const OPENING_NEXT_CAST = ['sage_seraphine', 'maelor'] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Slow start and slow end: the camera never snaps at a cut. */
export function easeShot(progress: number): number {
  const p = clamp01(progress);
  return 0.5 - Math.cos(Math.PI * p) / 2;
}

export interface ViewCamera { scale: number; x: number; y: number }

/** Where the image sits on screen: it always covers the view, and a portrait view fits the band between the bars. */
export function cameraAt(shot: OpeningShot, progress: number, width: number, height: number, bar: number): ViewCamera {
  const p = easeShot(progress);
  const zoom = shot.from.zoom + (shot.to.zoom - shot.from.zoom) * p;
  const cx = shot.from.x + (shot.to.x - shot.from.x) * p, cy = shot.from.y + (shot.to.y - shot.from.y) * p;
  const fit = Math.max(width / IMAGE_WIDTH, (width >= height ? height : height - bar * 2) / IMAGE_HEIGHT);
  const scale = fit * zoom;
  const x = Math.min(0, Math.max(width - IMAGE_WIDTH * scale, width / 2 - cx * scale));
  const y = Math.min(0, Math.max(height - IMAGE_HEIGHT * scale, height / 2 - cy * scale));
  return { scale, x, y };
}
