// Prints the measurement as a Markdown table: node tools/living-openings/table.mjs <measure.json>
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2] ?? 'tmp/living-openings/measure.json', 'utf8'));
const rows = [];
const fmt = (e) => e ? `${e.t.toFixed(2)} s (${e.label})` : '—';
const gap = (g) => g.length ? g.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} (${(b - a).toFixed(1)} s)`).join(', ') : '—';
const all = [['opening', r.opening], ...Object.entries(r.scripts)];
for (const [id, shots] of all) for (const s of shots) {
  rows.push(`| ${r.labels[id]} | ${s.shot} | ${s.seconds} | ${fmt(s.firstEvent)} | ${s.firstFigure ? s.firstFigure.t.toFixed(2) : '—'} | ${s.firstCamera ?? '—'} | ${gap(s.gaps)} | ${gap(s.gapsWithCamera)} |`);
}
console.log('| Cinématique | Plan | Durée | Premier événement | 1re figure | Caméra visible | Creux sans figure ni effet | Creux, caméra comprise |');
console.log('|---|---|---|---|---|---|---|---|');
console.log(rows.join('\n'));
