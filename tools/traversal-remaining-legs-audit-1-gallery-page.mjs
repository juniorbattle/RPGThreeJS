/** Build a self-contained static HTML index for the captured production gallery. */
import { readFile, writeFile } from 'node:fs/promises';

const root = 'docs/reports/traversal-remaining-legs-audit-1-browser';
const index = JSON.parse(await readFile(`${root}/gallery-index.json`, 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const link = file => encodeURIComponent(file).replace(/%2F/g, '/');
const sections = index.runs.map(run => {
  const captures = index.captures.filter(capture => capture.run === run.id);
  return `<section id="${escape(run.id)}"><h2>${escape(run.id)} <small>${captures.length} captures</small></h2>
    <p>${escape(run.description)}</p><div class="grid">${captures.map(capture => `
    <figure><a href="${link(capture.file)}"><img loading="lazy" src="${link(capture.file)}" alt="${escape(capture.note)}"></a>
      <figcaption><strong>${escape(capture.file)}</strong><span>${escape(capture.viewport)} · ${escape(capture.note)}</span></figcaption></figure>`).join('')}</div></section>`;
}).join('\n');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Traversal remaining legs — current production gallery</title><style>
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#10151b;color:#edf1f5}
body{max-width:1800px;margin:auto;padding:28px}h1,h2{line-height:1.2}h1{margin:0 0 8px}h2{margin:48px 0 8px}
p{color:#b7c6d1}nav{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}nav a{padding:8px 12px;border:1px solid #425365;border-radius:6px}
a{color:#cbe1ff}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px}
figure{margin:0;background:#1a242e;border:1px solid #344657;border-radius:8px;overflow:hidden}
img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#080b0f;display:block}
figcaption{padding:10px 12px;display:grid;gap:4px;overflow-wrap:anywhere}figcaption span,small{color:#aabccc;font-size:.82em}
</style></head><body><h1>Traversal remaining legs — current production</h1>
<p>Baseline ${escape(index.baseline)} · ${index.captures.length} captures · ${index.errors.length} browser errors. ${escape(index.method)}</p>
<nav>${index.runs.map(run => `<a href="#${escape(run.id)}">${escape(run.id)}</a>`).join('')}
<a href="asset-sheet-t0-world-reference.png">T0 asset sheet</a><a href="asset-sheet-t1-bois-clair.png">T1 asset sheet</a><a href="asset-sheet-t3-t4-final.png">T3/T4 asset sheet</a></nav>
${sections}</body></html>\n`;
await writeFile(`${root}/index.html`, html);
console.log(`Wrote ${index.captures.length} captures to ${root}/index.html`);
