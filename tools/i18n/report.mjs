#!/usr/bin/env node
/**
 * OD-2026-11-15-C translation workbench. French stays the key; English lives in `src/i18n/en/<zone>.json`.
 *
 *   node tools/i18n/report.mjs status                  keys, translated and missing per zone, orphans
 *   node tools/i18n/report.mjs todo <zone> [regex] [n] [tag] [skip]
 *                                                      untranslated keys of a zone (optionally only from sources
 *                                                      matching regex; n=0 for all), numbered, mapping written to
 *                                                      tmp/i18n/todo/<zone>[~tag].json
 *   node tools/i18n/report.mjs merge <file.tsv>        merges `id<TAB>English` lines into the zone catalogs
 *   node tools/i18n/report.mjs orphans                 catalog entries whose French no longer exists
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractAll, ZONES } from './extractFrench.mjs';

const root = process.cwd();
const catalogDir = path.join(root, 'src/i18n/en');
const todoDir = path.join(root, 'tmp/i18n/todo');

function readCatalog(zone) {
  const file = path.join(catalogDir, `${zone}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function writeCatalog(zone, entries) {
  fs.mkdirSync(catalogDir, { recursive: true });
  fs.writeFileSync(path.join(catalogDir, `${zone}.json`), `${JSON.stringify(entries, null, 2)}\n`);
}

function mergedCatalog() {
  const merged = new Map();
  for (const zone of ZONES) for (const [french, english] of Object.entries(readCatalog(zone))) if (english) merged.set(french, english);
  return merged;
}

function speakerOf(site) {
  const [file, line] = site.split(/:(?=\d+$)/);
  if (!file || !line || !fs.existsSync(path.join(root, file))) return '';
  const text = fs.readFileSync(path.join(root, file), 'utf8').split('\n')[Number(line) - 1] ?? '';
  const match = /say\(\s*'[^']*',\s*([A-Z_]+)/.exec(text) ?? /speaker: '([^']+)'/.exec(text) ?? /line\('[^']*', '([^']+)'/.exec(text)
    ?? /choice\(/.exec(text);
  if (!match) return '';
  return match[1] ? match[1] : 'CHOICE';
}

const [command = 'status', ...args] = process.argv.slice(2);
const keys = extractAll(root);
const catalog = mergedCatalog();

if (command === 'status') {
  const rows = ZONES.map((zone) => {
    const zoneKeys = [...keys].filter(([, entry]) => entry.zone === zone);
    const done = zoneKeys.filter(([key]) => catalog.has(key));
    const words = zoneKeys.filter(([key]) => !catalog.has(key)).reduce((sum, [key]) => sum + key.split(' ').length, 0);
    return `${zone.padEnd(10)} ${String(zoneKeys.length).padStart(5)} keys  ${String(done.length).padStart(5)} done  ${String(zoneKeys.length - done.length).padStart(5)} left (${words} words)`;
  });
  console.log(rows.join('\n'));
  console.log(`orphans: ${[...catalog.keys()].filter((key) => !keys.has(key)).length}`);
} else if (command === 'todo') {
  // A tag names a separate list, so several translators can share a zone: ids `<zone>~<tag>-0001`.
  const [zone, pattern, limit, tag, skip] = args;
  if (!ZONES.includes(zone)) throw new Error(`zone must be one of ${ZONES.join(', ')}`);
  const list = tag ? `${zone}~${tag}` : zone;
  const filter = pattern ? new RegExp(pattern) : null;
  const todo = [...keys].filter(([key, entry]) => entry.zone === zone && !catalog.has(key) && (!filter || entry.sites.some((site) => filter.test(site))))
    .slice(Number(skip) || 0, limit && limit !== '0' ? (Number(skip) || 0) + Number(limit) : undefined);
  const mapping = {};
  const lines = todo.map(([key, entry], index) => {
    const id = `${list}-${String(index + 1).padStart(4, '0')}`;
    mapping[id] = key;
    const speaker = speakerOf(entry.sites[0]);
    return `${id}\t${speaker ? `[${speaker}] ` : ''}${key}`;
  });
  fs.mkdirSync(todoDir, { recursive: true });
  fs.writeFileSync(path.join(todoDir, `${list}.json`), JSON.stringify(mapping, null, 1));
  console.log(lines.join('\n'));
  console.log(`# ${todo.length} keys`);
} else if (command === 'merge') {
  const [file] = args;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'));
  const byZone = new Map();
  let merged = 0;
  for (const line of lines) {
    const tab = line.indexOf('\t');
    if (tab < 0) throw new Error(`no tab in line: ${line}`);
    const id = line.slice(0, tab).trim();
    const english = line.slice(tab + 1).trim();
    const list = id.replace(/-\d+$/, '');
    const zone = list.split('~')[0];
    const mappingFile = path.join(todoDir, `${list}.json`);
    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    const french = mapping[id];
    if (!french) throw new Error(`unknown id ${id}`);
    const entries = byZone.get(zone) ?? readCatalog(zone);
    entries[french] = english;
    byZone.set(zone, entries);
    merged += 1;
  }
  for (const [zone, entries] of byZone) writeCatalog(zone, entries);
  console.log(`merged ${merged} entries into ${[...byZone.keys()].join(', ')}`);
} else if (command === 'orphans') {
  for (const key of catalog.keys()) if (!keys.has(key)) console.log(key);
} else {
  throw new Error(`unknown command ${command}`);
}
