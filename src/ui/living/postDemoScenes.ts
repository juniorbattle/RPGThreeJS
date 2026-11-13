import type { FireSpot, PaintFrame, SheetBook, ShotPainter } from '../opening/openingPainters';
import { ash, embers, paintedFires, paintLights } from '../opening/openingPainters';
import { PropLayer, rgba, type Light, type Rgb } from '../opening/openingLayer';
import type { CameraKey, ImageFrame } from '../opening/openingShots';
import type { LivingScript, LivingShot } from './LivingTableauPlayer';
import { bannerSway, lightShafts, type Banner, type Shaft } from './livingAtmosphere';
import { ExtraCrowd, FigureCast, placeCast, type DepthScale, type Extra, type FigureLight, type Walker } from './livingFigures';

/**
 * The living tableaux of the post-demo moments (set 1.20.0, "Post-demo moments"; tables validated on 2026-11-13,
 * PLATEAU_MOMENTS_DRAFT_2026-11-13), drawn from one shared painter: each moment is a scene sheet of what its approved
 * painting shows (its fires, lights, cloth that stirs, weather and depth) and the figures the table allows. Presentation
 * only: no caption, no choice, no game truth. Reduced motion holds the camera and fades the figures in place, while fire,
 * light and wind keep moving, as the player and the figures already do.
 */

/** Every post-demo tableau is painted at 1536 × 1024 (3:2), where the Lion's are 1672 × 941. */
export const POST_DEMO_FRAME: ImageFrame = Object.freeze({ width: 1536, height: 1024 });

export type Weather = (frame: PaintFrame) => void;

/** What an approved painting shows that may live: all in its own image pixels. */
export interface MomentScene {
  readonly image: string;
  readonly depth: DepthScale;
  readonly light: FigureLight;
  readonly lights?: readonly Light[];
  readonly fires?: readonly FireSpot[];
  /** Painted cloth, chains, lanterns or bells that stir, a few pixels on the painting's grain. */
  readonly sway?: readonly Banner[];
  readonly shafts?: { readonly shafts: readonly Shaft[]; readonly color: Rgb; readonly alpha: number };
  /** Sky, clouds, mist, smoke and spray, drawn first. */
  readonly weather?: (seed: number) => readonly Weather[];
  /** Snow, ash, dust or leaves in the air, over everything. */
  readonly motes?: { readonly count: number; readonly color: Rgb; readonly amount: number };
  readonly embers?: number;
  /**
   * Extras behind the actors, on their own (smaller) depth: far-off silhouettes, or, near a chief before his doors where
   * a silhouette would read as a cut-out, figures lit dimmer than the actors (`lit`). Never speakers, never in focus.
   */
  readonly extras?: { readonly tint: string; readonly depth: DepthScale; readonly lit?: FigureLight };
  /** A wind that rises over a shot: a multiplier on the sway. */
  readonly gust?: (seconds: number) => number;
  /** The light turning over a shot: a tone laid over the whole scene. */
  readonly turn?: { readonly color: Rgb; readonly alpha: (seconds: number) => number };
}

export function momentPainter(scene: MomentScene, sheets: SheetBook, actors: readonly Walker[], extras: readonly Extra[], seed: number): ShotPainter {
  const weather = scene.weather?.(seed) ?? [];
  const sway = scene.sway?.length ? bannerSway(scene.image, scene.sway, seed, POST_DEMO_FRAME, scene.gust) : null;
  const shafts = scene.shafts ? lightShafts(scene.shafts.shafts, scene.shafts.color, scene.shafts.alpha) : null;
  const fires = scene.fires?.length ? paintedFires(scene.fires, seed, POST_DEMO_FRAME) : null;
  const layer = new PropLayer(POST_DEMO_FRAME);
  const crowd = new ExtraCrowd(sheets, scene.extras?.tint ?? 'rgb(16,13,18)');
  const cast = new FigureCast(scene.light);
  const litExtras = scene.extras?.lit ? new FigureCast(scene.extras.lit) : null;
  const standingExtras: readonly Walker[] = extras.map((extra) => ({ id: extra.id, at: extra.at, from: extra.from, to: extra.to, facing: 'RIGHT', speed: 60 }));
  const sparks = scene.embers ? embers(scene.embers, seed + 7) : null;
  const motes = scene.motes ? ash(scene.motes.count, seed + 5, scene.motes.color) : null;
  return (frame) => {
    const { ctx, camera, seconds, dt, reduced } = frame;
    for (const paint of weather) paint(frame);
    sway?.(frame);
    shafts?.(frame);
    if (scene.lights) paintLights(frame, scene.lights);
    fires?.(frame);
    if (actors.length || extras.length) {
      const props = layer.begin();
      if (props) {
        if (litExtras) litExtras.draw(props, placeCast(standingExtras, sheets, seconds, reduced, scene.extras!.depth), seconds);
        else if (extras.length) crowd.draw(props, extras, seconds, dt, reduced, scene.extras?.depth ?? scene.depth);
        cast.draw(props, placeCast(actors, sheets, seconds, reduced, scene.depth), seconds);
        layer.present(ctx, camera);
      }
    }
    const turn = scene.turn?.alpha(seconds) ?? 0;
    if (turn > 0) {
      ctx.fillStyle = rgba(scene.turn!.color, turn);
      ctx.fillRect(0, 0, frame.width, frame.height);
    }
    sparks?.paint(frame, 0.4);
    motes?.paint(frame, scene.motes!.amount);
  };
}

/** A figure who stands where they are from the start of the shot and breathes there. */
export const standing = (id: string, at: number, x: number, y: number, facing: Walker['facing'], stature?: number): Walker =>
  ({ id, at, from: [x, y], to: [x, y], facing, speed: 60, ...(stature ? { stature } : {}) });

/** A figure who stands far off as scenery: an extra, never a speaker. */
export const still = (id: string, at: number, x: number, y: number): Extra => ({ id, at, seconds: 1, from: [x, y], to: [x, y] });

/** A chief drawn from a boss sheet two cells high stands at a tall man's height (Borin, Kaelen, the Grand Inquisiteur). */
export const CHIEF_STATURE = 0.56;

/** A shot of a moment; `scene` lets one shot change what lives in the same painting (the betrayal's rising wind). */
export interface MomentShot { id: string; seconds: number; from: CameraKey; to: CameraKey; vanishing: { x: number; y: number }; cast?: boolean; scene?: MomentScene }

/** A post-demo living tableau, with what its tests read: the scene, its actors and its extras. */
export interface MomentScript extends LivingScript {
  readonly scene: MomentScene;
  readonly actors: readonly Walker[];
  readonly extras: readonly Extra[];
}

export function momentScript(options: {
  id: string; label: string; scene: MomentScene; shots: readonly MomentShot[]; actors?: readonly Walker[]; extras?: readonly Extra[];
  sheets: readonly string[]; portraits: readonly string[]; seed: number;
}): MomentScript {
  const { scene, seed } = options;
  const actors = options.actors ?? [], extras = options.extras ?? [];
  const shots: readonly (LivingShot & { cast?: boolean; scene: MomentScene })[] = options.shots.map(({ cast, scene: own, ...shot }) =>
    ({ ...shot, image: (own ?? scene).image, frame: POST_DEMO_FRAME, cast, scene: own ?? scene }));
  return {
    id: options.id, label: options.label, shots, sheets: options.sheets, portraits: options.portraits, scene, actors, extras,
    painter(shotId, sheets) {
      const index = Math.max(0, shots.findIndex((shot) => shot.id === shotId));
      const shot = shots[index]!;
      return momentPainter(shot.scene, sheets, shot.cast ? actors : [], shot.cast ? extras : [], seed + index * 10);
    },
    backdrop() {
      return momentPainter(scene, new Map(), [], [], seed + 90);
    },
  };
}
