/**
 * Final images through OpenAI (OD-2026-11-11-F, F1). Two steps, run with vite-node:
 *
 *   npx vite-node tools/art/finalImages.ts -- plan
 *     Reads every provisional image the post-demo registries list (their `awaitedFinal`), writes one brief per image to
 *     tmp/final-images/plan.json: kind, size, prompt and style references. No network. The plan can be edited before a
 *     run, for instance to describe a new character's look; `notes` is appended to the prompt.
 *
 *   npx vite-node tools/art/finalImages.ts -- run --pilot          (the six Bear images agreed for the pilot)
 *   npx vite-node tools/art/finalImages.ts -- run --ids id1,id2    (any images of the plan)
 *     Calls the OpenAI image edit endpoint with the operator's key, OPENAI_API_KEY, taken from the terminal or else from the
 *     project's Git-ignored .env.local (only the OPENAI_ variables are loaded). The tool never prints or stores it. It writes tmp/final-images/out/<id>.png, log.json and review.html (current stand-in
 *     beside the generated image). Nothing is integrated: only images the operator accepts are integrated afterwards.
 *
 * Options for run: --model <name> (default: the project's earlier approved image model), --quality <low|medium|high> (default high), --force (redo
 * images already generated). tmp/ is ignored by Git.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as bear from '../../src/campaign/plateaux/bear/bearPresentation';
import * as dragon from '../../src/campaign/plateaux/dragon/dragonPresentation';
import * as scorpion from '../../src/campaign/plateaux/scorpion/scorpionPresentation';
import * as finale from '../../src/campaign/plateaux/finale/finalePresentation';
import { loadEnv } from 'vite';
import { demoEnvironmentPlateForContext } from '../../src/render/demoEnvironmentPack';

type Chapter = 'bear' | 'dragon' | 'scorpion' | 'finale';
type Kind = 'backdrop' | 'atlas' | 'character';

export interface FinalImageBrief {
  id: string;
  chapter: Chapter;
  kind: Kind;
  awaitedFinal: string;
  /** Path (from the repository root) of the provisional image it replaces, when one exists. */
  standIn: string | null;
  size: '1536x1024' | '1024x1024';
  transparent: boolean;
  references: string[];
  prompt: string;
  notes: string;
}

const ROOT = resolve(import.meta.dirname ?? '.', '..', '..');
const OUT_DIR = join(ROOT, 'tmp', 'final-images');
const PLAN = join(OUT_DIR, 'plan.json');

/** Settings named by the plateaux' canon text; no new place or lore. */
const SETTINGS: Record<Chapter, string> = {
  bear: 'Les Montagnes de la Résilience, terres du clan de l’Ours : cols enneigés, avant-postes de pierre, galeries de mines sacrées et filon sombre.',
  dragon: 'Les Pics, terres du clan du Dragon : cimes, sentiers de pèlerins, repaire, autel du Cristal d’Écho.',
  scorpion: 'Le désert du clan du Scorpion : temple du Phénix, érudits, sable et pierre brûlée.',
  finale: 'La capitale des clans : l’Arène des Destins, la capitale en flammes, la brèche.',
};

const STYLE = 'Modern pixel art, HD-2D fantasy tactical RPG, rich painterly pixel detail, cinematic lighting. Match the palette, texture, outline and level of detail of the reference images exactly. The reference images set the style only: never copy their heraldry, emblems or banners. No text, no letters, no labels, no UI, no watermark, no frame.';

/**
 * The pilot showed the Lion references' heraldry leaking into Bear images (lion banners, lion medallions): every brief
 * names the clan whose signs the place or person may show.
 */
const HERALDRY: Record<Chapter, string> = {
  bear: 'Any banner, shield, medallion or carved emblem shows the Bear clan’s sign, a bear; never a lion.',
  dragon: 'Any banner, shield, medallion or carved emblem shows the Dragon clan’s sign, a dragon; never a lion.',
  scorpion: 'Any banner, shield, medallion or carved emblem shows the Scorpion clan’s sign, a scorpion; never a lion.',
  finale: 'Any banners mix the signs of several clans; no single emblem dominates.',
};

/** Approved Lion art used as style references (Character V2 masters and approved tableaux). */
const BACKDROP_STYLE_REFS = [
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/shadow-ruins-tableau.png',
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/alaric-audience-tableau.png',
];

/**
 * Looks the canon does not describe yet: PROPOSALS for the operator to confirm or rewrite before a run (a new
 * character's look is part of the final-image lot led with the operator). They go into the brief's notes.
 */
const PROPOSED_LOOKS: Record<string, string> = {
  'bear:actor:borin': 'PROPOSAL, to confirm: a human elder chieftain of the Bear clan (a man, not an animal), broad-shouldered, grey braided beard, heavy bear-fur mantle over stone-grey armour, a war hammer.',
  'bear:actor:bear_warrior': 'PROPOSAL, to confirm: a human warrior of the Bear clan, fur-lined mail, round wooden shield and spear, mountain colours (stone grey, brown, snow white).',
};
const CHARACTER_STYLE_REFS = [
  'public/assets/characters/pixel/masters/alistair.png',
  'public/assets/characters/pixel/masters/lion_champion.png',
];

/** The six Bear images of the pilot: four backdrops and two character masters. */
export const PILOT_IDS: readonly string[] = Object.freeze([
  'bear:scene:bear_arrival',
  'bear:scene:bear_audience',
  'bear:refuge:bear-first-refuge',
  'bear:surface:chronicle-end',
  'bear:actor:borin',
  'bear:actor:bear_warrior',
]);

function plateOf(context: string): string | null {
  try {
    const plate = demoEnvironmentPlateForContext(context) as { publicUrl?: string };
    return plate.publicUrl ? `public${plate.publicUrl}` : null;
  } catch {
    return null;
  }
}

const masterOf = (unitId: string) => `public/assets/characters/pixel/masters/${unitId}.png`;

function promptFor(kind: Kind, chapter: Chapter, awaitedFinal: string): string {
  if (kind === 'character') {
    return `${STYLE} One single full-body character sprite, standing in a three-quarter view, centred, feet near the bottom edge, on a fully transparent background, at the same pixel scale as the reference sprites. Subject: ${awaitedFinal}. Setting of the character: ${SETTINGS[chapter]} ${HERALDRY[chapter]}`;
  }
  if (kind === 'atlas') {
    return `${STYLE} An illustrated top-down region map of a fantasy land, painted like a game atlas, with paths and landmarks but no lettering. Region: ${awaitedFinal}. ${SETTINGS[chapter]} ${HERALDRY[chapter]}`;
  }
  return `${STYLE} A wide environment tableau, eye-level establishing view of the place, empty of people: no characters, no creatures, no silhouettes (characters are staged over it as separate sprites). Leave open ground in the lower half for them. Scene: ${awaitedFinal}. ${SETTINGS[chapter]} ${HERALDRY[chapter]}`;
}

function brief(chapter: Chapter, group: string, key: string, kind: Kind, awaitedFinal: string, standIn: string | null): FinalImageBrief {
  const character = kind === 'character';
  // Style references only: the stand-in shows another place or person and would be copied; it stays on the review page.
  const references = character ? CHARACTER_STYLE_REFS : BACKDROP_STYLE_REFS;
  const id = `${chapter}:${group}:${key}`;
  return {
    id, chapter, kind, awaitedFinal, standIn,
    size: character ? '1024x1024' : '1536x1024', transparent: character,
    references: [...references], prompt: promptFor(kind, chapter, awaitedFinal), notes: PROPOSED_LOOKS[id] ?? '',
  };
}

interface PlateauModule {
  scenes: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>>;
  refuges: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>>;
  surfaces: readonly { surface: string; awaitedFinal: string }[];
  actors: readonly { actorId: string; standInUnitId: string; awaitedFinal: string }[];
  enemies: readonly { unitId: string; standInPortrait: string; awaitedFinal: string }[];
  atlases: readonly { shortTitle: string; image: string; awaitedFinal: string }[];
}

const PLATEAUX: Record<Chapter, PlateauModule> = {
  bear: { scenes: bear.BEAR_PROVISIONAL_SCENES, refuges: bear.BEAR_REFUGE_PRESENTATION, surfaces: bear.BEAR_PROVISIONAL_SURFACES,
    actors: bear.BEAR_PROVISIONAL_ACTORS, enemies: bear.BEAR_PROVISIONAL_ENEMIES, atlases: bear.BEAR_ATLAS_REGIONS },
  dragon: { scenes: dragon.DRAGON_PROVISIONAL_SCENES, refuges: dragon.DRAGON_REFUGE_PRESENTATION, surfaces: dragon.DRAGON_PROVISIONAL_SURFACES,
    actors: dragon.DRAGON_PROVISIONAL_ACTORS, enemies: dragon.DRAGON_PROVISIONAL_ENEMIES, atlases: dragon.DRAGON_ATLAS_REGIONS },
  scorpion: { scenes: scorpion.SCORPION_PROVISIONAL_SCENES, refuges: scorpion.SCORPION_REFUGE_PRESENTATION, surfaces: scorpion.SCORPION_PROVISIONAL_SURFACES,
    actors: scorpion.SCORPION_PROVISIONAL_ACTORS, enemies: scorpion.SCORPION_PROVISIONAL_ENEMIES, atlases: scorpion.SCORPION_ATLAS_REGIONS },
  finale: { scenes: finale.FINALE_PROVISIONAL_SCENES, refuges: finale.FINALE_REFUGE_PRESENTATION, surfaces: finale.FINALE_PROVISIONAL_SURFACES,
    actors: finale.FINALE_PROVISIONAL_ACTORS, enemies: finale.FINALE_PROVISIONAL_ENEMIES, atlases: finale.FINALE_ATLAS_REGIONS },
};

const slug = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Every provisional image of the post-demo plateaux, one brief each. A character listed as actor and enemy is one brief. */
export function buildPlan(): FinalImageBrief[] {
  const plan: FinalImageBrief[] = [];
  for (const [chapter, module] of Object.entries(PLATEAUX) as [Chapter, PlateauModule][]) {
    for (const [key, scene] of Object.entries(module.scenes)) plan.push(brief(chapter, 'scene', key, 'backdrop', scene.awaitedFinal, plateOf(scene.environmentContext)));
    for (const [key, refuge] of Object.entries(module.refuges)) plan.push(brief(chapter, 'refuge', key, 'backdrop', refuge.awaitedFinal, plateOf(refuge.environmentContext)));
    for (const surface of module.surfaces) {
      const key = /fin de chronique/i.test(surface.surface) ? 'chronicle-end' : slug(surface.surface);
      plan.push(brief(chapter, 'surface', key, 'backdrop', surface.awaitedFinal, null));
    }
    module.atlases.forEach((atlas, index) => plan.push(brief(chapter, 'atlas', String(index + 1), 'atlas', atlas.awaitedFinal, atlas.image ? `public${atlas.image}` : null)));
    const characters = new Set<string>();
    for (const actor of module.actors) {
      characters.add(actor.actorId);
      plan.push(brief(chapter, 'actor', actor.actorId, 'character', actor.awaitedFinal, masterOf(actor.standInUnitId)));
    }
    for (const enemy of module.enemies) {
      if (characters.has(enemy.unitId)) continue;
      characters.add(enemy.unitId);
      plan.push(brief(chapter, 'enemy', enemy.unitId, 'character', enemy.awaitedFinal, masterOf(enemy.standInPortrait)));
    }
  }
  return plan;
}

/**
 * The operator's OpenAI key: OPENAI_API_KEY from the terminal, else the same variable from the project's env files
 * (.env.local, Git-ignored), read by Vite's own loader with only the OPENAI_ prefix. Returns where it came from, never
 * prints it.
 */
export function openAiKey(root: string = ROOT): { key: string; source: string } | null {
  if (process.env.OPENAI_API_KEY) return { key: process.env.OPENAI_API_KEY, source: 'the terminal' };
  const fromFiles = loadEnv('production', root, 'OPENAI_').OPENAI_API_KEY;
  return fromFiles ? { key: fromFiles, source: 'the project env file (.env.local)' } : null;
}

function readPlan(): FinalImageBrief[] {
  if (!existsSync(PLAN)) throw new Error('No plan yet: run "plan" first.');
  return JSON.parse(readFileSync(PLAN, 'utf8')) as FinalImageBrief[];
}

const fileOf = (id: string) => `${id.replace(/[^a-zA-Z0-9_-]+/g, '__')}.png`;

async function generate(item: FinalImageBrief, key: string, model: string, quality: string): Promise<Buffer> {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', item.notes ? `${item.prompt} ${item.notes}` : item.prompt);
  form.append('size', item.size);
  form.append('quality', quality);
  form.append('n', '1');
  if (item.transparent) form.append('background', 'transparent');
  for (const reference of item.references) {
    const bytes = readFileSync(join(ROOT, reference));
    form.append('image[]', new Blob([bytes], { type: 'image/png' }), reference.split('/').pop());
  }
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
  });
  const body = await response.json() as { data?: { b64_json?: string }[]; error?: { message?: string } };
  if (!response.ok || !body.data?.[0]?.b64_json) throw new Error(`OpenAI ${response.status}: ${body.error?.message ?? 'no image returned'}`);
  return Buffer.from(body.data[0].b64_json, 'base64');
}

function reviewPage(items: FinalImageBrief[]): string {
  const rows = items.map((item) => {
    const out = join(OUT_DIR, 'out', fileOf(item.id));
    const generated = existsSync(out) ? `<img src="out/${fileOf(item.id)}" alt="">` : '<p>Pas encore générée</p>';
    const standIn = item.standIn ? `<img src="../../${item.standIn}" alt="">` : '<p>Aucune image provisoire</p>';
    return `<section><h2>${item.id}</h2><p>${item.awaitedFinal}</p><div class="pair"><figure>${standIn}<figcaption>Provisoire</figcaption></figure><figure>${generated}<figcaption>Générée</figcaption></figure></div></section>`;
  }).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>Images finales : relecture</title><style>body{font:15px system-ui;background:#14161b;color:#e8e9ec;margin:24px}section{margin:0 0 32px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{max-width:100%;background:repeating-conic-gradient(#2a2d35 0 25%,#1d2027 0 50%) 0 0/24px 24px}figure{margin:0}h2{font-size:16px;margin:0 0 4px}</style><h1>Images finales : relecture</h1>${rows}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const command = args[0] ?? 'plan';
  const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  mkdirSync(join(OUT_DIR, 'out'), { recursive: true });
  if (command === 'plan') {
    const plan = buildPlan();
    writeFileSync(PLAN, `${JSON.stringify(plan, null, 2)}\n`);
    const counts = plan.reduce<Record<string, number>>((all, item) => ({ ...all, [item.kind]: (all[item.kind] ?? 0) + 1 }), {});
    console.log(`Plan written: ${plan.length} images (${Object.entries(counts).map(([kind, count]) => `${count} ${kind}`).join(', ')}) in tmp/final-images/plan.json`);
    console.log(`Pilot: ${PILOT_IDS.join(', ')}`);
    return;
  }
  if (command !== 'run') throw new Error(`Unknown command "${command}": use plan or run.`);
  const found = openAiKey();
  if (!found) throw new Error('No OPENAI_API_KEY in this terminal or in .env.local; the tool never prints or stores it.');
  const key = found.key;
  console.log(`OpenAI access: ${found.source} (value never shown).`);
  const plan = readPlan();
  const ids = args.includes('--pilot') ? [...PILOT_IDS] : (option('--ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!ids.length) throw new Error('Choose images with --pilot or --ids id1,id2.');
  const selected = ids.map((id) => { const item = plan.find((candidate) => candidate.id === id); if (!item) throw new Error(`Not in the plan: ${id}`); return item; });
  // The model of the project's earlier approved OpenAI images (tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json).
  const model = option('--model') ?? 'gpt-image-2.5-sunburst-2026-09-08';
  const quality = option('--quality') ?? 'high';
  const logPath = join(OUT_DIR, 'log.json');
  const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) as unknown[] : [];
  for (const item of selected) {
    const out = join(OUT_DIR, 'out', fileOf(item.id));
    if (existsSync(out) && !args.includes('--force')) { console.log(`Already generated: ${item.id}`); continue; }
    process.stdout.write(`Generating ${item.id}… `);
    try {
      writeFileSync(out, await generate(item, key, model, quality));
      log.push({ id: item.id, model, quality, size: item.size, prompt: item.prompt, notes: item.notes, references: item.references, at: new Date().toISOString() });
      console.log('done');
    } catch (error) {
      console.log(`failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  writeFileSync(logPath, `${JSON.stringify(log, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, 'review.html'), reviewPage(selected));
  console.log('Review page: tmp/final-images/review.html');
}

// Runs as a command (vite-node); a test that imports buildPlan does not start it.
if (!process.env.VITEST) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
}
