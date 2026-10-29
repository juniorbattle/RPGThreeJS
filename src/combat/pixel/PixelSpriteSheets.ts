import sheetsJson from '../../render/generated/combatPixelSprites.json';
import { resolveCharacterUnitId } from '../../render/CharacterVisualRegistry';

/**
 * Pixel-art combat sheets (contract v1), produced by
 * tools/pixel-sprites/build_combat_sprites.py from the Character System V2
 * poses. Every unit shares one pixel density (`pxPerUnit`), so heroes, foes,
 * elites and bosses show the same on-screen pixel size.
 */
export type PixelAnimName = 'idle' | 'move' | 'windup' | 'attack' | 'cast' | 'hurt' | 'ko';

export interface PixelAnim {
  frames: readonly string[];
  ms: readonly number[];
  loop: boolean;
}

export interface PixelBoundsPx {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PixelSheetEntry {
  unitId: string;
  file: string;
  cell: readonly [number, number];
  anchor: readonly [number, number];
  presenceScale: number;
  cells: readonly string[];
  anims: Readonly<Record<string, PixelAnim>>;
  figureHeightPx: number;
  idleBoundsPx: PixelBoundsPx;
  /** Extra identities (portrait paths) for master-only roster units. */
  aliases?: readonly string[];
  /** Built from a single master: idle + breath only, motion from code. */
  masterOnly?: boolean;
}

/** World-space size of one cell plane and where its feet anchor sits. */
export interface PixelSheetLayout {
  width: number;
  height: number;
  /** Plane-centre height above the feet. */
  centerY: number;
  /** Horizontal shift that puts the feet anchor on the local origin. */
  anchorShiftX: number;
  /** Cell count of the sheet texture (cells are laid out left to right). */
  columns: number;
}

interface RawSheets {
  version: number;
  pxPerUnit: number;
  units: Record<string, Omit<PixelSheetEntry, 'unitId'>>;
}

const raw = sheetsJson as unknown as RawSheets;

if (raw.version !== 1 || !(raw.pxPerUnit > 0)) {
  throw new Error('Combat pixel sprite sheets failed their contract gate.');
}

export const PIXEL_PX_PER_UNIT = raw.pxPerUnit;

const entries = new Map<string, PixelSheetEntry>(
  Object.entries(raw.units).map(([unitId, entry]) => [unitId, Object.freeze({ ...entry, unitId })]),
);

const aliases = new Map<string, PixelSheetEntry>();
for (const entry of entries.values()) for (const alias of entry.aliases ?? []) aliases.set(alias, entry);

export function resolvePixelSheet(identity: string | null | undefined): PixelSheetEntry | undefined {
  if (!identity) return undefined;
  const direct = entries.get(identity) ?? aliases.get(identity);
  if (direct) return direct;
  const canonical = resolveCharacterUnitId(identity);
  return canonical ? entries.get(canonical) : undefined;
}

export function listPixelSheets(): readonly PixelSheetEntry[] {
  return [...entries.values()];
}

export function pixelSheetLayout(entry: PixelSheetEntry): PixelSheetLayout {
  const [cw, ch] = entry.cell;
  const [ax, ay] = entry.anchor;
  return {
    width: cw / PIXEL_PX_PER_UNIT,
    height: ch / PIXEL_PX_PER_UNIT,
    centerY: (ay - ch / 2) / PIXEL_PX_PER_UNIT,
    anchorShiftX: (cw / 2 - ax) / PIXEL_PX_PER_UNIT,
    columns: entry.cells.length,
  };
}

/** Visible-figure bounds in cell pixels, for status badge anchoring. */
export function pixelSheetVisibleBounds(entry: PixelSheetEntry) {
  return {
    sourceSizePx: { width: entry.cell[0], height: entry.cell[1] },
    alphaBoundsPx: { ...entry.idleBoundsPx },
  };
}

/**
 * Pure frame clock. `advance` returns the cell index to show; it never touches
 * Three.js so the animation rules are unit-testable.
 */
export class PixelAnimationClock {
  private anim: PixelAnim;
  private frame = 0;
  private elapsed = 0;
  private finished = false;
  name: string;

  constructor(private readonly entry: PixelSheetEntry, initial = 'idle') {
    this.name = initial;
    this.anim = this.lookup(initial);
  }

  private lookup(name: string): PixelAnim {
    return this.entry.anims[name] ?? this.entry.anims.idle ?? { frames: [this.entry.cells[0] ?? 'idle'], ms: [1000], loop: true };
  }

  play(name: string, restart = true): void {
    if (!restart && name === this.name && !this.finished) return;
    this.name = name;
    this.anim = this.lookup(name);
    this.frame = 0;
    this.elapsed = 0;
    this.finished = false;
  }

  get done(): boolean {
    return this.finished;
  }

  /** Advances by `dtMs` scaled by `speed`, returns the cell index to display. */
  advance(dtMs: number, speed = 1): number {
    const frames = this.anim.frames;
    if (!this.finished && frames.length > 0) {
      this.elapsed += Math.max(0, dtMs) * Math.max(0, speed);
      let guard = frames.length * 4;
      while (guard-- > 0) {
        const duration = Math.max(16, this.anim.ms[this.frame] ?? this.anim.ms[this.anim.ms.length - 1] ?? 120);
        if (this.elapsed < duration) break;
        this.elapsed -= duration;
        if (this.frame + 1 < frames.length) this.frame += 1;
        else if (this.anim.loop) this.frame = 0;
        else {
          this.finished = true;
          this.elapsed = 0;
          break;
        }
      }
    }
    return this.cellIndex();
  }

  cellIndex(): number {
    const cellName = this.anim.frames[this.frame] ?? this.entry.cells[0] ?? '';
    const index = this.entry.cells.indexOf(cellName);
    return index >= 0 ? index : 0;
  }
}
