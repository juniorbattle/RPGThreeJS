/**
 * Set 1.20.0 narrative coherence validator, command line (post-demo Lot 0): `npm run narrative:validate`.
 * Validates every consequence map in `src/campaign/consequences/` against content and code, prints a JSON summary and
 * exits with 1 when a map has an error. Read-only.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { getPlateau } from '../../src/campaign/plateaux/PlateauRegistry';
import { plateauDialogues } from '../../src/game/postDemoContent';
import { validateConsequenceMapDesign, validateNarrativeCoherence } from '../../src/game/narrativeCoherence';

const sources = (readdirSync('src', { recursive: true }) as string[])
  .map((path) => `src/${path.replaceAll('\\', '/')}`)
  .filter((path) => path.endsWith('.ts') && !path.endsWith('.test.ts') && !path.endsWith('.d.ts') && !path.startsWith('src/qa/'))
  .map((path) => ({ path, text: readFileSync(path, 'utf8') }));

const maps = readdirSync('src/campaign/consequences').filter((name) => name.endsWith('.consequences.json')).sort();
let failed = false;
const results = maps.map((name) => {
  const raw = JSON.parse(readFileSync(`src/campaign/consequences/${name}`, 'utf8'));
  // A plateau not built yet has only its map: it is checked as a design until its dialogues exist.
  if (getPlateau(raw.plateauId).status === 'planned' || (raw.plateauId !== 'lion' && plateauDialogues(raw.plateauId).length === 0)) {
    const errors = validateConsequenceMapDesign(raw);
    if (errors.length) failed = true;
    return { map: name, ok: errors.length === 0, check: 'design', errors };
  }
  const report = validateNarrativeCoherence(raw, sources);
  if (report.errors.length) failed = true;
  return { map: name, ok: report.errors.length === 0, check: 'full', stats: report.stats, errors: report.errors, excused: report.excused.length };
});
console.log(JSON.stringify({ ok: !failed, results }, null, 2));
if (failed) process.exitCode = 1;
