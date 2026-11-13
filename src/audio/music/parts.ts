/**
 * The parts of the game for music (set 1.23.0, OD-2026-11-13-E): the Lion, the Bear, the Dragon, the
 * Scorpion and the final act. A part is read only from the durable id prefix of what is presented: the POI id that
 * already chooses the atlas (`bear-…`), the authored dialogue id of the mood table and the combat scene id handed to
 * CombatBridge (`bear_…`). Never from route, choice, reputation, relations, resources or outcome, and never saved.
 * No data here, so the game can import it without the tracks.
 */
export type MusicPart = 'lion' | 'bear' | 'dragon' | 'scorpion' | 'finale';
export const MUSIC_PARTS: readonly MusicPart[] = ['lion', 'bear', 'dragon', 'scorpion', 'finale'];

/** Where a track is asked from: the part, and the combat scene for a chief's own entry or the Tournament's arena. */
export interface MusicWhere { part?: MusicPart; scene?: string | null }

const PREFIX = /^(bear|dragon|scorpion|finale)[-_]/;

/** The part of a durable id; every demo id is the Lion's. */
export function musicPartOf(id: string | null | undefined): MusicPart {
  const match = id ? PREFIX.exec(id) : null;
  return (match?.[1] as MusicPart | undefined) ?? 'lion';
}

/**
 * On since set 1.23.0 (PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1, OD-2026-11-13-E, baseline 6228a34f): each part of the game
 * asks its own map, refuge, tension, drama, combat and boss tracks. Turned off, the game asks the Lion's tracks everywhere.
 */
export const PLATEAU_MUSIC_IN_GAME = true;

/** What the game asks: the part of the presented id while the switch is on, the Lion's tracks when it is off. */
export function gameMusicWhere(id: string | null | undefined, scene: string | null = null, enabled = PLATEAU_MUSIC_IN_GAME): MusicWhere {
  return enabled ? { part: musicPartOf(id), scene } : {};
}
