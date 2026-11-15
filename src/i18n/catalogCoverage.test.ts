import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractAll, ZONES } from '../../tools/i18n/extractFrench.mjs';
import { GLOSSARY } from './glossary';

/**
 * OD-2026-11-15-C (A4): every French text a player can see has its English text, with the same holes, and the
 * glossary forms; no English entry outlives its French. Sources enter TRANSLATED_SCOPE as their zone is translated;
 * once it covers every player source, the last test requires it.
 */
const TRANSLATED_SCOPE: readonly RegExp[] = [];

const root = path.resolve(__dirname, '../..');
const keys = extractAll(root);
const catalog = new Map<string, { english: string; zone: string }>();
const duplicates: string[] = [];
for (const zone of ZONES) {
  const file = path.join(__dirname, 'en', `${zone}.json`);
  if (!fs.existsSync(file)) continue;
  for (const [french, english] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>)) {
    if (catalog.has(french) && catalog.get(french)!.english !== english) duplicates.push(`${french} (${catalog.get(french)!.zone}, ${zone})`);
    catalog.set(french, { english, zone });
  }
}
const inScope = (sites: readonly string[]) => sites.some((site) => TRANSLATED_SCOPE.some((pattern) => pattern.test(site)));
const holes = (text: string) => new Set(text.match(/\{\d+\}/g) ?? []);

describe('English catalogs (OD-2026-11-15-C)', () => {
  it('give every French text of the translated sources a non-empty English text', () => {
    const missing = [...keys].filter(([key, entry]) => inScope(entry.sites) && !catalog.get(key)?.english)
      .map(([key, entry]) => `${entry.sites[0]} ${key}`);
    expect(missing).toEqual([]);
  });

  it('keep no English entry whose French no longer exists, and one English text per French text', () => {
    expect([...catalog.keys()].filter((key) => !keys.has(key))).toEqual([]);
    expect(duplicates).toEqual([]);
  });

  it('use only the holes of the French text', () => {
    const wrong = [...catalog].filter(([french, { english }]) => [...holes(english)].some((hole) => !holes(french).has(hole)))
      .map(([french, { english }]) => `${french} → ${english}`);
    expect(wrong).toEqual([]);
  });

  it('follow the glossary', () => {
    const wrong: string[] = [];
    for (const [french, { english }] of catalog) {
      for (const term of GLOSSARY) if (term.french.test(french) && !term.english.test(english)) wrong.push(`${term.label}: ${french} → ${english}`);
    }
    expect(wrong).toEqual([]);
  });

  it('keep French typography out of English texts', () => {
    const wrong = [...catalog].filter(([, { english }]) => /[«»]|\s[!?;:](\s|$)|\d\s%/.test(english)).map(([french, { english }]) => `${french} → ${english}`);
    expect(wrong).toEqual([]);
  });
});
