/**
 * Which track a context plays (set 1.23.0, OD-2026-11-13-E): the Lion's nine tracks unchanged, and for each
 * other part its own map, refuge, tension, drama, combat and boss. Title, victory and defeat stay shared. A combat
 * scene may ask its own track: a chief's entry before the shared boss loop, the Tournament's arena in the final act.
 */
import type { MusicPart, MusicWhere } from './parts';
import { BEAR_MUSIC } from './plateaux/bear';
import { DRAGON_MUSIC } from './plateaux/dragon';
import { FINALE_MUSIC } from './plateaux/finale';
import { SCORPION_MUSIC } from './plateaux/scorpion';
import { OWN_CONTEXTS, type OwnContext, type PartMusic } from './plateaux/score';
import { THEMES, type MusicContextId, type ThemeDef } from './themes';

export const PART_MUSIC: Readonly<Record<Exclude<MusicPart, 'lion'>, PartMusic>> = {
  bear: BEAR_MUSIC, dragon: DRAGON_MUSIC, scorpion: SCORPION_MUSIC, finale: FINALE_MUSIC,
};

const owns = (context: MusicContextId): context is OwnContext => (OWN_CONTEXTS as readonly string[]).includes(context);

export function trackFor(context: MusicContextId, where: MusicWhere = {}): ThemeDef {
  const part = where.part ?? 'lion';
  if (part === 'lion' || !owns(context)) return THEMES[context];
  const music = PART_MUSIC[part];
  if ((context === 'combat' || context === 'boss') && where.scene) {
    const own = music.scenes?.[where.scene]?.[context];
    if (own) return own;
  }
  return music.tracks[context];
}

/** Every plateau track once, for the tests and the listening lab. */
export function plateauTracks(): ThemeDef[] {
  const out: ThemeDef[] = [];
  for (const music of Object.values(PART_MUSIC)) {
    out.push(...OWN_CONTEXTS.map((context) => music.tracks[context]));
    for (const scene of Object.values(music.scenes ?? {})) out.push(...Object.values(scene).filter((theme): theme is ThemeDef => Boolean(theme)));
  }
  return out;
}
