/**
 * Performance audit (2026-11-15) — V6 saves placed just before chosen POIs, written by the repository's own QA driver.
 *
 * `npx vite-node --config tools/cinematics/vite-node.config.ts tools/perf/make-perf-saves.ts [outDir]`
 * Each save is the state `playLion` / `playPlateau` leave when stopped before a POI of the play order (the Respect
 * plan), so the game's "Continuer" resumes on the map a step or two before the target. `index.json` lists, per save, the
 * route still to walk and the plan's answers, so a browser pass can follow the same path. QA tooling only: it never runs
 * in the game and owns no truth.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CHRONICLE_PLANS, CHRONICLE_SEEDS, chapterScenario, playChronicle } from '../../src/qa/fullCampaignChain';
import { playLion, playPlateau, type PlateauPlaythrough } from '../../src/qa/plateauDriver';
import { gameStateSchema, type GameState } from '../../src/game/types';

const outDir = resolve(process.argv[2] ?? 'tmp/perf/saves');
mkdirSync(outDir, { recursive: true });
const plan = CHRONICLE_PLANS.respect;
const chronicle = playChronicle(plan);

type Chapter = 'lion' | 'bear' | 'dragon' | 'scorpion' | 'finale';
const previous: Record<Exclude<Chapter, 'lion'>, Chapter> = { bear: 'lion', dragon: 'bear', scorpion: 'dragon', finale: 'scorpion' };
function play(chapter: Chapter, stopBefore?: string): PlateauPlaythrough {
  return chapter === 'lion'
    ? playLion(chapterScenario(plan, 'lion'), CHRONICLE_SEEDS.lion, stopBefore)
    : playPlateau(chapter, chronicle.saved[previous[chapter]], chapterScenario(plan, chapter), CHRONICLE_SEEDS[chapter], stopBefore);
}

/** The last POI the driver can stop before ahead of a fight, and the run stopped there (trial events are not stops). */
function beforeFight(chapter: Chapter, combatId: string): { poi: string; run: PlateauPlaythrough } {
  const whole = chronicle.chapters[chapter];
  let best: { poi: string; run: PlateauPlaythrough } | null = null;
  for (const poi of whole.visited) {
    const stopped = play(chapter, poi);
    if (stopped.visited.length >= whole.visited.length) continue; // not a stop of the play order
    if (stopped.fights.includes(combatId)) break;
    best = { poi, run: stopped };
  }
  if (!best) throw new Error(`No POI found for ${combatId} in ${chapter}`);
  return best;
}

const targets: { name: string; chapter: Chapter; combatId?: string; poi?: string }[] = [
  { name: 'lion-before-wolf-pack', chapter: 'lion', combatId: 'wolf_pack' },
  { name: 'lion-before-first-refuge', chapter: 'lion', poi: 'lion-first-refuge' },
  { name: 'lion-before-village-defense', chapter: 'lion', combatId: 'village_defense' },
  { name: 'lion-before-serpent-captain', chapter: 'lion', combatId: 'serpent_captain' },
  { name: 'scorpion-before-shadow-prophet', chapter: 'scorpion', combatId: 'scorpion_shadow_prophet' },
  { name: 'finale-before-breach', chapter: 'finale', combatId: 'finale_breach' },
];
const index: Record<string, unknown>[] = [];
for (const target of targets) {
  const found = target.combatId ? beforeFight(target.chapter, target.combatId) : { poi: target.poi!, run: play(target.chapter, target.poi) };
  const save = gameStateSchema.parse(found.run.state as GameState);
  const whole = chronicle.chapters[target.chapter];
  const route = whole.visited.slice(found.run.visited.length);
  writeFileSync(join(outDir, `${target.name}.json`), JSON.stringify(save));
  index.push({ name: target.name, chapter: target.chapter, combatId: target.combatId ?? null, stopBefore: found.poi,
    at: save.run.currentNodeId, runId: save.run.id, route, fightsAfter: whole.fights.slice(found.run.fights.length),
    decisions: whole.decisions.slice(found.run.decisions.length) });
  console.log(target.name, '| stop before', found.poi, '| at', save.run.currentNodeId, '| route', route.slice(0, 4).join(' > '));
}
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 1));
// A new chronicle's whole Lion: every POI in order and the plan's answers, for a pass from the title.
const lion = chronicle.chapters.lion;
writeFileSync(join(outDir, 'lion-new.json'), JSON.stringify({ route: lion.visited, decisions: lion.decisions, fights: lion.fights }, null, 1));
