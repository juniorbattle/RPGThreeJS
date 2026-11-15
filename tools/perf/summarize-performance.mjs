/**
 * Performance audit (2026-11-15) — turns one or two `measure-performance.mjs` reports into Markdown tables.
 * `node tools/perf/summarize-performance.mjs <before/report.json> [after/report.json]`
 */
import { readFileSync } from 'node:fs';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath) throw new Error('usage: summarize-performance.mjs <before> [after]');
const before = JSON.parse(readFileSync(beforePath, 'utf8'));
const after = afterPath ? JSON.parse(readFileSync(afterPath, 'utf8')) : null;
const median = (values) => { const v = values.filter((x) => typeof x === 'number').sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };

/** Every frame segment of a report, keyed by name. */
function segments(report) {
  const out = {};
  const add = (key, f, extra = {}) => { if (f && f.frames) out[key] = { ...f, ...extra }; };
  const j = report.scenarios.journey;
  if (j && !j.error) { for (const f of j.frames ?? []) add(f.name, f); for (const c of j.combats ?? []) add(`journey ${c.frames?.name}`, c.frames, { rounds: c.rounds, floats: c.floats }); }
  for (const key of ['fight-serpent', 'fight-breach', 'fight-prophet', 'fight-village']) { const s = report.scenarios[key]; if (s?.combat) add(s.combat.frames?.name ?? key, s.combat.frames, { rounds: s.combat.rounds, floats: s.combat.floats }); }
  const m = report.scenarios.mobile;
  if (m) { add('mobile title (CPU ×4)', m.title); add('mobile opening (CPU ×4)', m.opening); if (m.fight?.combat) add('mobile fight wolf_pack (CPU ×4)', m.fight.combat.frames, { rounds: m.fight.combat.rounds }); if (m.fightBoss?.combat) add('mobile fight finale_breach (CPU ×4)', m.fightBoss.combat.frames, { rounds: m.fightBoss.combat.rounds }); }
  const d = report.scenarios.dpr;
  if (d) for (const [k, v] of Object.entries(d)) if (v?.combat) add(`finale_breach at ${k}`, v.combat.frames, { canvas: v.combat.renderInfo?.canvas?.join(' ') });
  return out;
}

const fmt = (f) => f ? `${f.fps} | ${f.meanMs} | ${f.p95Ms} | ${f.p99Ms} | ${f.maxMs} | ${f.over50}/${f.frames}` : '— | — | — | — | — | —';
const sb = segments(before), sa = after ? segments(after) : {};
const lines = [];
lines.push(`GPU: ${before.gpu}; before commit ${before.commit.slice(0, 8)}${after ? `, after commit ${after.commit.slice(0, 8)}` : ''}`, '');
lines.push('### Fluidity (requestAnimationFrame intervals)', '');
if (after) {
  lines.push('| Scene | fps before | fps after | mean ms before | mean ms after | p95 before | p95 after | max before | max after | >50 ms before | >50 ms after |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const key of new Set([...Object.keys(sb), ...Object.keys(sa)])) { const b = sb[key], a = sa[key];
    lines.push(`| ${key} | ${b?.fps ?? '—'} | ${a?.fps ?? '—'} | ${b?.meanMs ?? '—'} | ${a?.meanMs ?? '—'} | ${b?.p95Ms ?? '—'} | ${a?.p95Ms ?? '—'} | ${b?.maxMs ?? '—'} | ${a?.maxMs ?? '—'} | ${b ? `${b.over50}/${b.frames}` : '—'} | ${a ? `${a.over50}/${a.frames}` : '—'} |`); }
} else {
  lines.push('| Scene | fps | mean ms | p95 ms | p99 ms | worst ms | frames > 50 ms | notes |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const [key, f] of Object.entries(sb)) lines.push(`| ${key} | ${fmt(f)} | ${[f.rounds ? `round ${f.rounds}` : '', f.floats ? `ULTIME ${f.floats.ULTIME}, SIGNATURE ${f.floats.SIGNATURE}` : '', f.canvas ?? '', f.longtasks ? `${f.longtasks} long tasks` : ''].filter(Boolean).join('; ')} |`);
}

function loadRows(report) {
  const l = report.scenarios.load; if (!l || l.error) return null;
  return { coldTitle: median(l.cold.map((c) => c.titleMs)), coldMb: median(l.cold.map((c) => c.mb)), warmTitle: median(l.warm.map((c) => c.titleMs)), warmMb: median(l.warm.map((c) => c.mb)),
    fcp: median(l.cold.map((c) => c.fcpMs)), throttled: l.throttled };
}
const lb = loadRows(before), la = after ? loadRows(after) : null;
if (lb) {
  lines.push('', '### Loading (median of 3 for cold and warm)', '', '| Measure | before | after |', '| --- | ---: | ---: |');
  const row = (name, b, a) => lines.push(`| ${name} | ${b ?? '—'} | ${a ?? '—'} |`);
  row('Cold load to playable title (ms)', lb.coldTitle, la?.coldTitle); row('Cold bytes to title (MB)', lb.coldMb, la?.coldMb);
  row('First contentful paint, cold (ms)', lb.fcp, la?.fcp); row('Warm reload to title (ms)', lb.warmTitle, la?.warmTitle); row('Warm bytes (MB)', lb.warmMb, la?.warmMb);
  for (const net of ['none', 'fast4g', 'slow4g']) {
    const b = lb.throttled?.[net], a = la?.throttled?.[net];
    row(`Title, ${net} (ms / MB)`, b ? `${b.title.ms} / ${b.title.mb}` : null, a ? `${a.title.ms} / ${a.title.mb}` : null);
    if (b?.firstCombat || a?.firstCombat) row(`First combat ready, ${net} (ms / MB)`, b?.firstCombat ? `${b.firstCombat.ms} / ${b.firstCombat.mb}` : null, a?.firstCombat ? `${a.firstCombat.ms} / ${a.firstCombat.mb}` : null);
  }
}

function memRows(report) {
  const rows = [];
  const take = (scenario, list) => { for (const c of list ?? []) rows.push({ scenario, ...c }); };
  take('journey', report.scenarios.journey?.checkpoints); take('leak', report.scenarios.leak?.checkpoints);
  for (const key of ['fight-serpent', 'fight-breach']) take(key, report.scenarios[key]?.checkpoints);
  return rows;
}
for (const [title, report] of [['before', before], ...(after ? [['after', after]] : [])]) {
  lines.push('', `### Memory checkpoints (${title})`, '', '| Scenario | Checkpoint | JS heap MB | DOM nodes | documents | GPU estimate MB | renderer WS MB | GPU process WS MB |', '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const r of memRows(report)) lines.push(`| ${r.scenario} | ${r.name} | ${r.heapUsedMb} | ${r.nodes} | ${r.documents} | ${r.gpuEstimateMb} | ${r.process?.renderer?.ws ?? '—'} | ${r.process?.GPU?.ws ?? '—'} |`);
}
console.log(lines.join('\n'));
