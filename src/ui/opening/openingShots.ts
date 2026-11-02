/** Script of the opening mockup (OD-2026-11-02-A): every line already exists in the prologue or in `acte_ouverture`. */
const TABLEAU = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau';

export const IMAGE_WIDTH = 1672;
export const IMAGE_HEIGHT = 941;

export type OpeningShotId = 'fall' | 'seals' | 'bois-clair' | 'shadow' | 'company';

export interface CameraKey { x: number; y: number; zoom: number }
export interface OpeningLine { at: number; text: string }

export interface OpeningShot {
  id: OpeningShotId;
  seconds: number;
  image: string | null;
  from: CameraKey;
  to: CameraKey;
  lines: readonly OpeningLine[];
  ambience: string | null;
}

const NO_CAMERA: CameraKey = { x: IMAGE_WIDTH / 2, y: IMAGE_HEIGHT / 2, zoom: 1 };

export const OPENING_SHOTS: readonly OpeningShot[] = [
  {
    id: 'fall', seconds: 9, image: null, from: NO_CAMERA, to: NO_CAMERA, ambience: null,
    lines: [
      { at: 0.9, text: 'Votre nom fut jadis prononcé parmi les grands.' },
      { at: 4.4, text: 'Puis vinrent la défaite, les serments rompus et les bannières brisées.' },
    ],
  },
  {
    id: 'seals', seconds: 12, image: `${TABLEAU}/alaric-audience-tableau.png`, ambience: null,
    from: { x: 1085, y: 660, zoom: 1.42 }, to: { x: 950, y: 400, zoom: 1.16 },
    lines: [
      { at: 0.8, text: 'Les Sceaux ne répondent ni aux titres ni au sang. Ils jugent les actes.' },
      { at: 6.2, text: 'Pour entrer au Tournoi des Grands, il nous faut les quatre Sceaux des quatre seigneurs.' },
    ],
  },
  {
    id: 'bois-clair', seconds: 12, image: `${TABLEAU}/bois-clair-tableau-burning.png`, ambience: 'bois_clair_burning',
    from: { x: 836, y: 392, zoom: 1.02 }, to: { x: 800, y: 408, zoom: 1.12 },
    lines: [{ at: 3.2, text: 'Bois-Clair brûle sous les torches des Serpents.' }],
  },
  {
    id: 'shadow', seconds: 10, image: `${TABLEAU}/shadow-ruins-tableau.png`, ambience: null,
    from: { x: 950, y: 440, zoom: 1.16 }, to: { x: 722, y: 440, zoom: 1.16 },
    lines: [{ at: 0.9, text: 'Des marques anciennes apparaissent dans la cendre, et des silhouettes sans bannière marchent derrière les clans comme une seconde guerre.' }],
  },
  {
    id: 'company', seconds: 12, image: `${TABLEAU}/lion-camp-tableau.png`, ambience: 'refuge',
    from: { x: 836, y: 470, zoom: 1.14 }, to: { x: 836, y: 470.5, zoom: 1 },
    lines: [{ at: 5.2, text: 'Chaque détour peut sauver une vie, remplir un coffre, attirer une recrue ou réveiller un danger.' }],
  },
];

/** The four heroes walk into the camp, facing the middle of the frame as they do in the dialogue that follows. */
export const OPENING_CAST: ReadonlyArray<{ id: string; at: number; left: number; facing: 'LEFT' | 'RIGHT' }> = [
  { id: 'alistair', at: 0.7, left: 61, facing: 'LEFT' },
  { id: 'marian', at: 1.7, left: 80, facing: 'LEFT' },
  { id: 'kestrel', at: 2.7, left: 39, facing: 'RIGHT' },
  { id: 'elara', at: 3.7, left: 20, facing: 'RIGHT' },
];

export const OPENING_ACTOR_FADE_AT = 9.6;
export const OPENING_BARS_OPEN_AT = 9.9;
export const OPENING_SHEETS = ['serpent_raider', 'serpent_brute', 'rogue'] as const;

export type BoisClairVariant = 'tableau' | 'arena' | 'arena-platform';

export const OPENING_VARIANTS: ReadonlyArray<{ id: BoisClairVariant; label: string; note: string }> = [
  { id: 'tableau', label: 'Tableau vivant', note: 'Le fond de Bois-Clair, feu, braises et Serpents. Pas de plateau.' },
  { id: 'arena', label: 'Arène sans plateau', note: 'Le décor 3D du combat, caméra basse, plateau retiré.' },
  { id: 'arena-platform', label: 'Arène avec plateau', note: 'Le même plan, plateau de combat visible.' },
];

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
