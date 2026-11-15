/**
 * Playing in French or English (OD-2026-11-15-C). French is the source and the key: the English catalogs map each
 * French text, exactly as the DOM shows it, to its English text, and the game translates at display time (A1). The
 * content files, durable ids and saves stay French; a missing English text shows its French (A3). Text built from
 * pieces is matched against the catalog's `{0}` templates, French lists and articles are rebuilt in English, and the
 * pieces are translated in turn.
 *
 * The catalogs load only when English is chosen (A2). A same-origin combat frame borrows the parent's loaded catalog,
 * so it translates from its first frame. In French every function here returns its input unchanged.
 */
import { DomTranslator } from './domTranslator';
import { readLanguagePreference, writeLanguagePreference, type Language } from './language';

export type { Language } from './language';

type CatalogPart = Record<string, string>;
interface Template { regex: RegExp; anchor: string; english: string; weight: number; literal: number }

const loaders = import.meta.glob<CatalogPart>('./en/*.json', { import: 'default' });
const SHARED_CATALOG = '__rpgThreeJsEnglishCatalog';
export const LANGUAGE_CHANGE_EVENT = 'rpg-threejs:language-change';

let language: Language = 'fr';
let catalog: Map<string, string> | null = null;
let templates: Template[] = [];
let upperIndex = new Map<string, string>();
const cache = new Map<string, string>();
const missing = new Set<string>();
let domTranslator: DomTranslator | null = null;
let frenchTitle: string | null = null;

export function currentLanguage(): Language {
  return language;
}

/** The runtime twin of the extractor's key normalization. */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

const hasLetter = (text: string): boolean => /[A-Za-zÀ-ÿ]/.test(text);
/** English typography for what surrounds a text: « 6 % » → “6%”, « ! » without its space. */
const englishNumbers = (text: string): string => text.replace(/(\d)\s%/g, '$1%').replace(/\s+([!?;:])/g, '$1');

/** The English text for a French text, or the text itself in French, for an empty text or when none is known. */
export function tr(text: string): string {
  if (language === 'fr' || !catalog || !text) return text;
  const hit = cache.get(text);
  if (hit !== undefined) return hit;
  const english = translateText(text, 0);
  if (cache.size > 6000) cache.clear();
  cache.set(text, english);
  return english;
}

/** Fills a template's `{0}` holes after translating it; holes keep the values given. */
export function tf(template: string, ...values: ReadonlyArray<string | number>): string {
  return tr(template).replace(/\{(\d+)\}/g, (_match, index: string) => String(values[Number(index)] ?? ''));
}

/** A list in the current language: « a, b et c » or “a, b and c”. */
export function joinList(items: readonly string[]): string {
  const and = language === 'en' ? ' and ' : ' et ';
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')}${and}${items.at(-1)}`;
}

/** What this text and the ones inside it are worth, kept for the length of one translation. */
let memo = new Map<string, { english: string; left: number } | null>();
/** Holes that stayed French (names, or texts without an English one): fewer is a better reading of a line. */
let leftovers = 0;
/** Texts always get shorter on the way down, so this only bounds the work. */
const MAX_DEPTH = 12;
function translateText(text: string, depth: number): string {
  if (depth === 0) { memo = new Map(); leftovers = 0; }
  const lead = /^\s*/.exec(text)![0];
  const trail = /\s*$/.exec(text)![0];
  const norm = normalizeText(text);
  if (!norm) return text;
  if (!hasLetter(norm)) return lead + englishNumbers(norm) + trail;
  const english = lookup(norm, depth);
  if (english === null) {
    noteMissing(norm);
    return text;
  }
  return lead + english + trail;
}

function lookup(norm: string, depth: number): string | null {
  const exact = catalog!.get(norm);
  if (exact !== undefined) return exact;
  if (depth > MAX_DEPTH) return null;
  const known = memo.get(norm);
  if (known !== undefined) {
    if (known) leftovers += known.left;
    return known ? known.english : null;
  }
  // Glued sentences first, so a template's last hole never swallows the next sentence; joined pieces before symbols, so
  // « 8, critique 15 % » is two pieces and not « critique » between two affixes. A reading that leaves holes in French
  // gives way to one that does not.
  const start = leftovers;
  let best: { english: string; left: number } | null = null;
  for (const read of [fromSentences, fromTemplate, fromCase, fromSegments, fromAffixes, fromConcatenation]) {
    leftovers = start;
    const english = read(norm, depth);
    if (english === null) continue;
    const left = leftovers - start;
    if (best === null || left < best.left) best = { english, left };
    if (left === 0) break;
  }
  leftovers = start + (best?.left ?? 0);
  memo.set(norm, best);
  return best ? best.english : null;
}

/**
 * Known texts laid end to end, cut at spaces and commas (« 9 cases » + « autour de la cible » + « , alliés compris »,
 * the zone line of a skill): the cover with the fewest pieces wins, and every piece must be known.
 */
function fromConcatenation(text: string, depth: number): string | null {
  if (depth > MAX_DEPTH - 2 || text.length > 160) return null;
  const cuts = [0];
  for (let i = 1; i < text.length; i += 1) if (text[i] === ' ' || text[i] === ',') cuts.push(i);
  cuts.push(text.length);
  if (cuts.length < 3) return null;
  const pieceOf = (from: number, to: number): string | null => {
    if (from === 0 && to === text.length) return null;
    const piece = text.slice(cuts[from]!, cuts[to]!);
    const norm = normalizeText(piece);
    if (!norm) return piece;
    const lead = /^\s*/.exec(piece)![0];
    const trail = /\s*$/.exec(piece)![0];
    const english = hasLetter(norm) ? lookupItem(norm, depth + 1) : englishNumbers(norm);
    return english === null ? null : lead + english + trail;
  };
  const memo = new Map<number, string[] | null>();
  const cover = (from: number): string[] | null => {
    if (from === cuts.length - 1) return [];
    if (memo.has(from)) return memo.get(from)!;
    let best: string[] | null = null;
    for (let to = from + 1; to < cuts.length; to += 1) {
      const piece = pieceOf(from, to);
      if (piece === null) continue;
      const rest = cover(to);
      if (rest && (best === null || rest.length + 1 < best.length)) best = [piece, ...rest];
    }
    memo.set(from, best);
    return best;
  };
  const pieces = cover(0);
  return pieces && pieces.length > 1 ? pieces.join('') : null;
}

function translateHole(value: string, depth: number): string {
  const norm = normalizeText(value);
  if (!norm) return value;
  const lead = /^\s*/.exec(value)![0];
  const trail = /\s*$/.exec(value)![0];
  if (!hasLetter(norm)) return lead + englishNumbers(norm) + trail;
  const english = lookup(norm, depth);
  if (english === null) leftovers += 1;
  return lead + (english ?? norm) + trail;
}

function fromTemplate(norm: string, depth: number): string | null {
  for (const template of templates) {
    if (!norm.includes(template.anchor)) continue;
    const match = template.regex.exec(norm);
    if (!match) continue;
    const values = match.slice(1).map((value) => translateHole(value, depth + 1));
    return template.english.replace(/\{(\d+)\}/g, (_hole, index: string) => values[Number(index)] ?? '');
  }
  return null;
}

/** « le Dragon » from « Le Dragon » (an article lowered by the French text), and capitals (« FOUDRE CÉLESTE »). */
function fromCase(norm: string): string | null {
  const first = norm[0]!;
  if (first !== first.toUpperCase()) {
    const capital = catalog!.get(first.toUpperCase() + norm.slice(1));
    if (capital !== undefined) return /^The /.test(capital) ? `the${capital.slice(3)}` : capital;
  }
  if (norm === norm.toUpperCase() && norm.length > 3) {
    const upper = upperIndex.get(norm);
    if (upper !== undefined) return upper.toUpperCase();
  }
  return null;
}

/** Symbols and numbers around a known text: « +10 Réputation », « Continuer ◆ », « FOUDRE CÉLESTE ! ». */
function fromAffixes(norm: string, depth: number): string | null {
  const match = /^([^A-Za-zÀ-ÿ]*)(.*?)([^A-Za-zÀ-ÿ.…]*)$/.exec(norm);
  if (!match) return null;
  const [, before = '', core = '', after = ''] = match;
  if (!core || (before === '' && after === '')) return null;
  const english = lookup(core, depth + 1);
  return english === null ? null : englishNumbers(before) + english + englishNumbers(after);
}

const SEPARATORS: ReadonlyArray<readonly [string, string]> = [
  ['\n', '\n'], [' · ', ' · '], [' — ', ' — '], [' – ', ' – '], [' / ', ' / '], [' | ', ' | '], [' : ', ': '], [' ; ', '; '], [', ', ', '],
];

/** Sentences glued after one another (a line and its echo): the first cover made of known texts wins. */
function fromSentences(text: string, depth: number): string | null {
  const ends = [...text.matchAll(/(?<=[.!?…»])\s+(?=[A-ZÀ-Ý«“])/g)].map((match) => ({ at: match.index!, length: match[0].length }));
  if (!ends.length) return null;
  const memo = new Map<number, string[] | null>();
  const cover = (start: number): string[] | null => {
    if (memo.has(start)) return memo.get(start)!;
    let result: string[] | null = null;
    if (start > 0) {
      const whole = lookup(text.slice(start), depth + 1);
      if (whole !== null) result = [whole];
    }
    for (const end of ends) {
      if (result || end.at <= start) continue;
      const piece = lookup(text.slice(start, end.at), depth + 1);
      const rest = piece === null ? null : cover(end.at + end.length);
      if (piece !== null && rest) result = [piece, ...rest];
    }
    memo.set(start, result);
    return result;
  };
  return cover(0)?.join(' ') ?? null;
}

/** Joined pieces, each known: « Brûlure, Poison », « Coffre · Gardien », and French lists « a, b et c ». */
function fromSegments(full: string, depth: number): string | null {
  // A closing stop belongs to the whole text: « Mérites : a, b et c. » is the list « a, b et c » with its stop.
  const stop = /[.!?…]+$/.exec(full)?.[0] ?? '';
  if (stop && full.length > stop.length) {
    const english = fromSegments(full.slice(0, -stop.length), depth);
    if (english !== null) return english + stop;
  }
  const norm = full;
  const listed = fromFrenchList(norm, depth);
  if (listed !== null) return listed;
  for (const [separator, joiner] of SEPARATORS) {
    if (!norm.includes(separator)) continue;
    const parts = norm.split(separator);
    if (parts.length < 2) continue;
    // A lead that ends with its colon (« Vos mérites : ») is a key with the colon; English keeps one colon.
    const lookupPart = (part: string, index: number): string | null => lookup(part, depth + 1)
      ?? (separator === ' : ' && index < parts.length - 1 ? lookup(`${part} :`, depth + 1)?.replace(/\s*:$/, '') ?? null : null);
    const english = parts.map((part, index) => (part.trim() === '' || !hasLetter(part) ? englishNumbers(part) : lookupPart(part.trim(), index)));
    if (english.every((part): part is string => part !== null)) return english.join(joiner);
  }
  return null;
}

/** A list item: a known text, a template or a known text inside symbols, never a list of its own. */
function lookupItem(text: string, depth: number): string | null {
  return catalog!.get(text) ?? (depth > MAX_DEPTH ? null : fromTemplate(text, depth) ?? fromCase(text) ?? fromAffixes(text, depth));
}

/**
 * « a, b et c » as known items, even when an item holds its own comma: every cut at « , » or « et » is tried, the
 * last cut being « et », and the first cover made of known texts wins.
 */
function fromFrenchList(text: string, depth: number): string | null {
  if (!text.includes(' et ')) return null;
  const cuts = [...text.matchAll(/, | et /g)].map((match) => ({ at: match.index!, length: match[0].length, and: match[0] === ' et ' }));
  const memo = new Map<number, string[] | null>();
  const cover = (start: number): string[] | null => {
    if (memo.has(start)) return memo.get(start)!;
    let result: string[] | null = null;
    const whole = lookupItem(text.slice(start), depth + 1);
    if (whole !== null && start > 0) result = [whole];
    for (const cut of cuts) {
      if (result || cut.at <= start) continue;
      const item = lookupItem(text.slice(start, cut.at), depth + 1);
      if (item === null) continue;
      const rest = cover(cut.at + cut.length);
      const lastCutIsAnd = cuts.filter((other) => other.at > cut.at).length === 0 ? cut.and : true;
      if (rest && lastCutIsAnd) result = [item, ...rest];
    }
    memo.set(start, result);
    return result;
  };
  const items = cover(0);
  if (!items || items.length < 2) return null;
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

const FRENCH_MARKERS =/(^|[\s(«“'’])(le|la|les|des|du|une|est|vous|nous|pour|avec|dans|sur|pas|qui|que|et|à|au|aux)(?=[\s,.;:!?»”)]|$)/i;

function noteMissing(norm: string): void {
  if (missing.has(norm) || !FRENCH_MARKERS.test(norm)) return;
  missing.add(norm);
  if (import.meta.env?.DEV && missing.size <= 200) console.warn(`[i18n] No English text for: ${norm}`);
}

/** French texts shown in English without a translation since the page opened (QA sweep, A5). */
export function missingTranslations(): readonly string[] {
  return [...missing];
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function indexCatalog(entries: Map<string, string>): void {
  templates = [];
  upperIndex = new Map();
  for (const [french, english] of entries) {
    upperIndex.set(french.toUpperCase(), english);
    if (!/\{\d+\}/.test(french)) continue;
    const literals = french.split(/\{\d+\}/);
    const weight = literals.join('').replace(/[^A-Za-zÀ-ÿ]/g, '').length;
    if (weight < 3) continue;
    const order: number[] = [];
    const pattern = french.replace(/\{(\d+)\}|[^{]+|\{/g, (part, hole: string | undefined) => {
      if (hole !== undefined) { order.push(Number(hole)); return '([\\s\\S]*?)'; }
      return escapeRegex(part);
    });
    const anchor = literals.reduce((longest, literal) => (literal.length > longest.length ? literal : longest), '');
    // Holes come back in French order; the English text names them by number.
    const englishByOrder = english.replace(/\{(\d+)\}/g, (_match, index: string) => `{${order.indexOf(Number(index))}}`);
    templates.push({ regex: new RegExp(`^${pattern}$`), anchor, english: englishByOrder, weight, literal: literals.join('').length });
  }
  // The text that says the most about the line comes first: more letters, then more literal characters.
  templates.sort((a, b) => b.weight - a.weight || b.literal - a.literal);
}

/** Merges catalog parts into one French → English map; empty English entries count as missing. */
export function buildCatalog(parts: readonly CatalogPart[]): Map<string, string> {
  const entries = new Map<string, string>();
  for (const part of parts) for (const [french, english] of Object.entries(part)) if (english) entries.set(normalizeText(french), english);
  return entries;
}

function sharedCatalog(): Map<string, string> | null {
  try {
    const parent = window.parent as (Window & { [SHARED_CATALOG]?: Map<string, string> }) | null;
    if (parent && parent !== window && parent[SHARED_CATALOG] instanceof Map) return parent[SHARED_CATALOG];
  } catch { /* A cross-origin parent shares nothing. */ }
  return null;
}

export async function loadEnglishCatalog(): Promise<Map<string, string>> {
  const shared = sharedCatalog();
  if (shared) return shared;
  const parts = await Promise.all(Object.values(loaders).map((load) => load()));
  const entries = buildCatalog(parts);
  try { (window as unknown as Record<string, unknown>)[SHARED_CATALOG] = entries; } catch { /* No window, no sharing. */ }
  return entries;
}

function applyDocument(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  frenchTitle ??= document.title;
  document.title = language === 'en' ? tr(frenchTitle) : frenchTitle;
}

function activateEnglish(entries: Map<string, string>): void {
  catalog = entries;
  indexCatalog(entries);
  cache.clear();
  language = 'en';
  applyDocument();
  if (typeof document !== 'undefined') {
    domTranslator ??= new DomTranslator(document, tr);
    domTranslator.start();
  }
}

/** Reads the stored choice before the first screen; English waits for its catalog, French returns at once. */
export function initLanguage(): Promise<Language> {
  if (readLanguagePreference() !== 'en') {
    applyDocument();
    return Promise.resolve(language);
  }
  const shared = sharedCatalog();
  if (shared) {
    activateEnglish(shared);
    return Promise.resolve(language);
  }
  return loadEnglishCatalog().then((entries) => {
    activateEnglish(entries);
    return language;
  }, () => {
    applyDocument();
    return language;
  });
}

/** The settings menu's change: stored outside the saves, applied to the current screen at once (A7). */
export async function setLanguage(next: Language): Promise<Language> {
  writeLanguagePreference(next);
  if (next === language) return language;
  if (next === 'en') activateEnglish(catalog ?? await loadEnglishCatalog());
  else {
    language = 'fr';
    domTranslator?.stop();
    applyDocument();
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }));
  return language;
}

/** Tests only: English from the given entries, without storage, loading or DOM translation. */
export function useCatalogForTests(entries: Record<string, string> | null): void {
  cache.clear();
  missing.clear();
  if (!entries) {
    language = 'fr';
    catalog = null;
    templates = [];
    return;
  }
  catalog = buildCatalog([entries]);
  indexCatalog(catalog);
  language = 'en';
}
