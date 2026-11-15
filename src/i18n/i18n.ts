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
interface Template { regex: RegExp; anchor: string; english: string; weight: number }

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

function translateText(text: string, depth: number): string {
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
  if (depth > 4) return null;
  return fromTemplate(norm, depth) ?? fromCase(norm) ?? fromAffixes(norm, depth) ?? fromSegments(norm, depth);
}

function translateHole(value: string, depth: number): string {
  const norm = normalizeText(value);
  if (!norm) return value;
  const lead = /^\s*/.exec(value)![0];
  const trail = /\s*$/.exec(value)![0];
  if (!hasLetter(norm)) return lead + englishNumbers(norm) + trail;
  return lead + (lookup(norm, depth) ?? norm) + trail;
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

const SEPARATORS: ReadonlyArray<readonly [string | RegExp, string]> = [
  ['\n', '\n'], [' · ', ' · '], [' — ', ' — '], [' – ', ' – '], [' / ', ' / '], [' | ', ' | '], [' : ', ': '],
  [/(?<=[.!?…»])\s+(?=[A-ZÀ-Ý«])/, ' '], [', ', ', '],
];

/** Joined pieces, each known: « Brûlure, Poison », « Coffre · Gardien », and French lists « a, b et c ». */
function fromSegments(norm: string, depth: number): string | null {
  const list = /^(.+), (.+) et (.+)$/.exec(norm) ?? /^(.+) et (.+)$/.exec(norm);
  if (list) {
    const items = list.slice(1).flatMap((item) => item.split(', '));
    const english = items.map((item) => lookup(item, depth + 1));
    if (english.every((item): item is string => item !== null)) {
      return english.length < 2 ? english.join('') : `${english.slice(0, -1).join(', ')} and ${english.at(-1)}`;
    }
  }
  for (const [separator, joiner] of SEPARATORS) {
    if (typeof separator === 'string' ? !norm.includes(separator) : !separator.test(norm)) continue;
    const parts = norm.split(separator);
    if (parts.length < 2) continue;
    const english = parts.map((part) => (part.trim() === '' || !hasLetter(part) ? englishNumbers(part) : lookup(part.trim(), depth + 1)));
    if (english.every((part): part is string => part !== null)) return english.join(joiner);
  }
  return null;
}

const FRENCH_MARKERS = /(^|[\s(«“'’])(le|la|les|des|du|une|est|vous|nous|pour|avec|dans|sur|pas|qui|que|et|à|au|aux)(?=[\s,.;:!?»”)]|$)/i;

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
    templates.push({ regex: new RegExp(`^${pattern}$`), anchor, english: englishByOrder, weight });
  }
  templates.sort((a, b) => b.weight - a.weight);
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
