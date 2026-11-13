/**
 * Writing helpers for the plateaux's tracks (sketches, PLATEAU_MUSIC_DRAFT_2026-11-13). The tracks use the Lion's
 * grammar unchanged: sections with their own tempo, key, mode and metre, a written bridge and a return, two levels in
 * combat, an entry of at most six seconds before a boss loop.
 */
import type { MusicContextId, Section, ThemeDef } from '../themes';
import type { Mode } from '../theory';

/** The contexts a part owns; title, victory and defeat stay shared. */
export type OwnContext = Exclude<MusicContextId, 'title' | 'victory' | 'defeat'>;
export const OWN_CONTEXTS: readonly OwnContext[] = ['map', 'refuge', 'tension', 'drama', 'combat', 'boss'];

/** A part's music: one track per context it owns, and the tracks a combat scene asks instead (a chief's own entry). */
export interface PartMusic {
  tracks: Readonly<Record<OwnContext, ThemeDef>>;
  scenes?: Readonly<Record<string, Partial<Record<'combat' | 'boss', ThemeDef>>>>;
}

export const section = (name: string, bpm: number, beatsPerBar: number, tonic: number, mode: Mode, chords: string, rest: Partial<Section> = {}): Section =>
  ({ name, bpm, beatsPerBar, tonic, mode, chords, ...rest });

/** The same boss loop behind another entry: a chief or a scene of its own announces itself, then the loop is shared. */
export function withEntry(theme: ThemeDef, track: string, entry: Section): ThemeDef {
  if (theme.sections[0]?.name !== 'entry') throw new Error(`${theme.track ?? theme.id} has no entry to replace.`);
  return { ...theme, track, sections: [entry, ...theme.sections.slice(1)] };
}
