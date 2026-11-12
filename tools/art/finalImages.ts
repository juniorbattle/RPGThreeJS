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
 *   npx vite-node tools/art/finalImages.ts -- run --chapter bear   (every image of one chapter not yet generated)
 *     Calls the OpenAI image edit endpoint with the operator's key, OPENAI_API_KEY, taken from the terminal or else from the
 *     project's Git-ignored .env.local (only the OPENAI_ variables are loaded). The tool never prints or stores it. It writes tmp/final-images/out/<id>.png, log.json and review.html (current stand-in
 *     beside the generated image). Nothing is integrated: only images the operator accepts are integrated afterwards.
 *
 * Options for run: --model <name> (default: the project's earlier approved image model), --quality <low|medium|high> (default high), --force (redo
 * images already generated), --concurrency <1-6> (requests at once, default 1). tmp/ is ignored by Git.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as bear from '../../src/campaign/plateaux/bear/bearPresentation';
import * as dragon from '../../src/campaign/plateaux/dragon/dragonPresentation';
import * as scorpion from '../../src/campaign/plateaux/scorpion/scorpionPresentation';
import * as finale from '../../src/campaign/plateaux/finale/finalePresentation';
import { loadEnv } from 'vite';
import { demoEnvironmentPlateForContext } from '../../src/render/demoEnvironmentPack';
import { ATLAS_LAYOUTS, CIVILIAN_IDS, CIVILIAN_REFS, CREATURE_IDS, CREATURE_REFS, IDENTITY, LIGHT_REFS, STAGED_LOOKS, STAGING } from './finalImagesStaging';

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
  /** Another brief of the same place, whose generated image joins the references when it exists. */
  samePlaceAs?: string;
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

/**
 * The references give the demo's pixel-art technique only (operator, 2026-11-12): each plateau keeps its own palette,
 * building and landmarks, set by its identity and its staging.
 */
const STYLE = 'Modern pixel art, HD-2D fantasy tactical RPG, rich painterly pixel detail, cinematic lighting. Match the pixel-art technique of the reference images: pixel density, outlines, dithering, rendering of light and level of detail. The reference images set the technique only: never copy their heraldry, emblems, banners, palette, architecture, landmarks or composition. No text, no letters, no labels, no UI, no watermark, no frame.';

/**
 * The pilot showed the Lion references' heraldry leaking into Bear images (lion banners, lion medallions): every brief
 * names the clan whose signs the place or person may show. A brief that names another clan (the Raven in the Bear's
 * mountains, the Wolf in the Dragon's peaks, the Phoenix in the Scorpion's desert, the Serpent's champion) gives that
 * clan's people, camps and banners its own sign, and the host clan's places keep theirs.
 */
const CLAN_SIGNS: readonly { name: string; english: string; sign: string }[] = [
  { name: 'Ours', english: 'Bear', sign: 'a bear' },
  { name: 'Corbeau', english: 'Raven', sign: 'a raven' },
  { name: 'Dragon', english: 'Dragon', sign: 'a dragon' },
  { name: 'Loup', english: 'Wolf', sign: 'a wolf' },
  { name: 'Scorpion', english: 'Scorpion', sign: 'a scorpion' },
  { name: 'Phénix', english: 'Phoenix', sign: 'a phoenix' },
  { name: 'Serpent', english: 'Serpent', sign: 'a serpent' },
];
const HOST_CLAN: Record<Chapter, string | null> = { bear: 'Bear', dragon: 'Dragon', scorpion: 'Scorpion', finale: null };
const SHADOWS = /(^|[^\p{L}])(Ombres|Shadows)([^\p{L}]|$)/u;
const namesClan = (text: string, name: string) => new RegExp(`(^|[^\\p{L}])${name}([^\\p{L}]|$)`, 'u').test(text);

export function heraldryFor(chapter: Chapter, awaitedFinal: string): string {
  const host = CLAN_SIGNS.find((clan) => clan.english === HOST_CLAN[chapter]);
  const others = CLAN_SIGNS.filter((clan) => clan !== host && (namesClan(awaitedFinal, clan.name) || namesClan(awaitedFinal, clan.english)));
  const theirs = others.map((clan) => `the ${clan.english} clan’s people, camps and banners show ${clan.sign}`).join('; ');
  // The Shadows are no clan: a brief naming them and no clan gets no sign (the host clan's would dress the shaman as a Dragon).
  if (!others.length && SHADOWS.test(awaitedFinal)) return 'The Shadows belong to no clan: no banner, shield, medallion or carved emblem of any clan; never a lion.';
  if (!host) return others.length ? `Each clan keeps its own sign: ${theirs}; other banners mix the signs of several clans.` : 'Any banners mix the signs of several clans; no single emblem dominates.';
  if (!others.length) return `Any banner, shield, medallion or carved emblem shows the ${host.english} clan’s sign, ${host.sign}; never a lion.`;
  return `Each clan keeps its own sign: ${theirs}; the ${host.english} clan’s own places show ${host.sign}; never a lion.`;
}

/** Approved Lion art used as style references (Character V2 masters and approved tableaux). */
const BACKDROP_STYLE_REFS = [
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/shadow-ruins-tableau.png',
  'public/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/alaric-audience-tableau.png',
];

/**
 * Standing operator rule (OD-2026-11-11-G): no character of the game shows a face. Masks, closed helmets or hoods cover
 * it, as on every approved Character V2 master (Alistair's closed helmet, Elara's shadowed face and two eyes, Maelor's hood).
 */
export const COVERED_FACE_RULE = 'If the character is a person, the face stays fully covered, as for every character of this game: a closed helmet, a mask, or a hood whose shadow hides the face, with at most two small glowing eyes inside the shadow. No visible facial features: no nose, mouth, cheeks, skin of the face, beard or hair on the face.';

/**
 * Looks the canon does not describe yet: PROPOSALS for the operator to confirm or rewrite before a run (a new
 * character's look is part of the final-image lot led with the operator). They go into the brief's notes.
 */
const PROPOSED_LOOKS: Record<string, string> = {
  'bear:actor:borin': 'PROPOSAL, to confirm: a human elder chieftain of the Bear clan (a man, not an animal), broad-shouldered and slightly stooped with age, a heavy grey-streaked bear-fur mantle over worn stone-grey armour, a closed helm crowned with a bear’s head that hides his face, a war hammer.',
  'bear:actor:bear_warrior': 'PROPOSAL, to confirm: a human warrior of the Bear clan, a closed helmet, fur-lined mail, round wooden shield and spear, mountain colours (stone grey, brown, snow white).',
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

function promptFor(id: string, kind: Kind, chapter: Chapter, awaitedFinal: string): string {
  if (CREATURE_IDS.includes(id)) {
    return `${STYLE} One single full-body creature sprite, an animal and not a person: no armour, no clothing, no weapon, no shield, no banner. Three-quarter view, centred, feet near the bottom edge, on a fully transparent background, at the same pixel scale as the reference sprites. Subject: ${awaitedFinal}.`;
  }
  if (kind === 'character') {
    return `${STYLE} One single full-body character sprite, standing in a three-quarter view, centred, feet near the bottom edge, on a fully transparent background, at the same pixel scale as the reference sprites. ${COVERED_FACE_RULE} Subject: ${awaitedFinal}. Setting of the character: ${SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`;
  }
  const layout = ATLAS_LAYOUTS[id];
  if (layout) {
    return `${STYLE} An illustrated top-down region map of a fantasy land, painted like a game atlas, with no lettering. The reference image is this region’s existing map layout: repaint it completely in the identity below, but keep exactly the position, width and course of every road, path and crossing, and every clearing or site where a road meets another, so that map markers placed on the original still fall on the same roads and clearings. Sites stay open, readable clearings or small settlements. Streams of the layout become icy mountain torrents. Paint the blurred bands at the top and bottom as more terrain. Region: ${layout.line} ${IDENTITY[chapter] ?? SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`;
  }
  if (kind === 'atlas') {
    return `${STYLE} An illustrated top-down region map of a fantasy land, painted like a game atlas, with paths and landmarks but no lettering. Region: ${awaitedFinal}. ${SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`;
  }
  const staging = STAGING[id];
  if (staging) {
    // A staged backdrop: its own place and light, the plateau's identity instead of the shared setting sentence, and
    // banners only where the staging names them.
    return `${STYLE} A wide environment tableau, empty of people: no characters, no creatures, no silhouettes (characters are staged over it as separate sprites). Keep open, readable ground in the lower third for them. Staging: ${staging.line} ${IDENTITY[chapter] ?? SETTINGS[chapter]} ${staging.light === 'interior' && !staging.skyVisible ? 'Indoors and underground: no snow, no frost, no daylight, no sky. ' : ''}No banners, flags or emblems unless the staging names them. ${heraldryFor(chapter, `${awaitedFinal} ${staging.line}`)}`;
  }
  return `${STYLE} A wide environment tableau, eye-level establishing view of the place, empty of people: no characters, no creatures, no silhouettes (characters are staged over it as separate sprites). Leave open ground in the lower half for them. Scene: ${awaitedFinal}. ${SETTINGS[chapter]} ${heraldryFor(chapter, awaitedFinal)}`;
}

/** Style references: by light for a staged backdrop, beasts for a creature, civilians for a civilian. */
function referencesFor(id: string, kind: Kind): readonly string[] {
  if (CREATURE_IDS.includes(id)) return CREATURE_REFS;
  if (CIVILIAN_IDS.includes(id)) return CIVILIAN_REFS;
  if (kind === 'character') return CHARACTER_STYLE_REFS;
  if (ATLAS_LAYOUTS[id]) return [ATLAS_LAYOUTS[id]!.lionAtlas];
  const staging = STAGING[id];
  return staging ? LIGHT_REFS[staging.light] : BACKDROP_STYLE_REFS;
}

function brief(chapter: Chapter, group: string, key: string, kind: Kind, awaitedFinal: string, standIn: string | null): FinalImageBrief {
  const character = kind === 'character';
  const id = `${chapter}:${group}:${key}`;
  // Style references only: the stand-in shows another place or person and would be copied; it stays on the review page.
  const samePlaceAs = STAGING[id]?.samePlaceAs;
  return {
    id, chapter, kind, awaitedFinal, standIn,
    size: character ? '1024x1024' : '1536x1024', transparent: character,
    references: [...referencesFor(id, kind)], prompt: promptFor(id, kind, chapter, awaitedFinal),
    notes: PROPOSED_LOOKS[id] ?? STAGED_LOOKS[id] ?? '', ...(samePlaceAs ? { samePlaceAs } : {}),
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

/** The brief's references, plus the generated image of the same place when it exists (Borin's hall from one image to the next). */
function referencesOf(item: FinalImageBrief): string[] {
  const layout = ATLAS_LAYOUTS[item.id];
  if (layout) {
    // The letterboxed layout (tools/art/atlas_layout.py prepare) replaces the Lion atlas it was made from.
    const prepared = ['tmp', 'final-images', 'layouts', fileOf(item.id)].join('/');
    if (!existsSync(join(ROOT, prepared))) throw new Error(`No layout for ${item.id}: run py -3 tools/art/atlas_layout.py prepare ${layout.lionAtlas} ${prepared}`);
    return [prepared];
  }
  const samePlace = item.samePlaceAs ? ['tmp', 'final-images', 'out', fileOf(item.samePlaceAs)].join('/') : null;
  return samePlace && existsSync(join(ROOT, samePlace)) ? [...item.references, samePlace] : [...item.references];
}

async function generate(item: FinalImageBrief, key: string, model: string, quality: string): Promise<Buffer> {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', item.notes ? `${item.prompt} ${item.notes}` : item.prompt);
  form.append('size', item.size);
  form.append('quality', quality);
  form.append('n', '1');
  if (item.transparent) form.append('background', 'transparent');
  for (const reference of referencesOf(item)) {
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
  const chapter = option('--chapter');
  const ids = args.includes('--pilot') ? [...PILOT_IDS]
    : chapter ? plan.filter((item) => item.chapter === chapter).map((item) => item.id)
      : (option('--ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!ids.length) throw new Error('Choose images with --pilot, --chapter bear|dragon|scorpion|finale or --ids id1,id2.');
  const selected = ids.map((id) => { const item = plan.find((candidate) => candidate.id === id); if (!item) throw new Error(`Not in the plan: ${id}`); return item; });
  // The model of the project's earlier approved OpenAI images (tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json).
  const model = option('--model') ?? 'gpt-image-2.5-sunburst-2026-09-08';
  const quality = option('--quality') ?? 'high';
  const logPath = join(OUT_DIR, 'log.json');
  const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) as unknown[] : [];
  const pending = selected.filter((item) => {
    const skip = existsSync(join(OUT_DIR, 'out', fileOf(item.id))) && !args.includes('--force');
    if (skip) console.log(`Already generated: ${item.id}`);
    return !skip;
  });
  // A few requests at once (--concurrency, default 1); the log and the review page are rewritten after each image, so an
  // interrupted run keeps what it made.
  const concurrency = Math.max(1, Math.min(6, Number(option('--concurrency') ?? 1) || 1));
  const save = () => {
    writeFileSync(logPath, `${JSON.stringify(log, null, 2)}\n`);
    writeFileSync(join(OUT_DIR, 'review.html'), reviewPage(selected));
  };
  let next = 0;
  let failed = 0;
  const worker = async () => {
    while (next < pending.length) {
      const item = pending[next++]!;
      try {
        writeFileSync(join(OUT_DIR, 'out', fileOf(item.id)), await generate(item, key, model, quality));
        log.push({ id: item.id, model, quality, size: item.size, prompt: item.prompt, notes: item.notes, references: referencesOf(item), at: new Date().toISOString() });
        console.log(`done: ${item.id}`);
      } catch (error) {
        failed += 1;
        console.log(`failed: ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
      save();
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  save();
  console.log(`Finished: ${pending.length - failed} generated, ${failed} failed. Review page: tmp/final-images/review.html`);
}

// Runs as a command (vite-node); a test that imports buildPlan does not start it.
if (!process.env.VITEST) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
}
