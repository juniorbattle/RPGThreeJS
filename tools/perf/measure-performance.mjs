/**
 * Performance audit (2026-11-15) — frame pacing, memory and loading of the PRODUCTION build, by real UI inputs.
 *
 * Runs against a production preview the caller started (Claude: `preview_start` "rpg-perf", `vite preview` on 5187);
 * it starts no server of its own. Saves come from `tools/perf/make-perf-saves.ts` (QA driver states, never edited here)
 * and are written to localStorage before the page loads, as a returning player's autosave; the title's "Continuer"
 * resumes them. Everything else is a click or a key on the game's own controls: dialogue boxes and answers (the Respect
 * plan's answers, from the saves' index), the map's POI and "Se rendre", refuge services, the combat school, deployment
 * "Auto", "Lancer le combat", the action dock, skill and Élan menus and battlefield cells (projected with the runtime's
 * production helper `__qaHelpers.getCellScreenPosition`), the settings' "Abandonner le combat".
 * The built bootstrap is rewritten in flight only to expose the GameApp instance for READ-ONLY snapshots (as
 * `tools/demo-continuous-production-qa.mjs` does); no owner method is called and no game fact is written.
 *
 * Measures: requestAnimationFrame intervals of the top window (the combat iframe shares its frame loop), long tasks,
 * JS heap (CDP, after a forced GC at checkpoints), DOM counters, an estimate of GPU memory from WebGL calls (textures,
 * buffers, renderbuffers, drawing buffers), the OS working set of the browser processes, and network bytes.
 *
 * Env: PERF_BASE_URL (http://127.0.0.1:5187), PERF_OUTPUT (under tmp/, never overwritten), PERF_SCENARIOS (comma list
 * of: load, journey, fight-serpent, fight-prophet, fight-breach, fight-village, fight-breach-reduced, leak, mobile, dpr,
 * sprites), PERF_LABEL (before | after), PERF_SAVES (tmp/perf/saves), PERF_HEADED=1 (visible window instead of headless),
 * PERF_SHOTS=1 (captures of the journey's first screens and of each battlefield), PERF_OS_MOTION=reduce (the browser's
 * prefers-reduced-motion emulated; the game's own setting stays off by default).
 */
import { execSync } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:5187';
const label = process.env.PERF_LABEL ?? 'before';
const scenarios = (process.env.PERF_SCENARIOS ?? 'load,journey,fight-serpent,fight-breach,leak,mobile,dpr').split(',').map((s) => s.trim()).filter(Boolean);
const savesDir = resolve(process.env.PERF_SAVES ?? 'tmp/perf/saves');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(process.env.PERF_OUTPUT ?? `tmp/perf/${label}-${stamp}`);
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });

const saveIndex = JSON.parse(await readFile(resolve(savesDir, 'index.json'), 'utf8'));
const saveOf = async (name) => ({ entry: saveIndex.find((e) => e.name === name), text: await readFile(resolve(savesDir, `${name}.json`), 'utf8') });

/** The operator's PC: 2560x1600 panel at 175 % (1463x915 CSS px), AMD Radeon 780M; a maximised browser window. */
const DESKTOP = { viewport: { width: 1463, height: 800 }, deviceScaleFactor: 1.75 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const NETWORKS = {
  fast4g: { offline: false, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8, latency: 60 },
  slow4g: { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (0.75 * 1024 * 1024) / 8, latency: 150 },
};

const report = { schemaVersion: 1, label, recordedAt: new Date().toISOString(), base, commit: execSync('git rev-parse HEAD').toString().trim(),
  method: 'PRODUCTION_PREVIEW_REAL_UI_INPUTS_READ_ONLY_APP_SNAPSHOTS', scenarios: {}, errors: [] };
const started = Date.now();
const log = (line) => console.log(`[${String(Math.round((Date.now() - started) / 1000)).padStart(5)}s] ${line}`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const browser = await chromium.launch({
  headless: process.env.PERF_HEADED !== '1',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--mute-audio', '--enable-precise-memory-info'],
});

/* ------------------------------------------------------------------ in-page instrumentation (every frame) */
const INSTRUMENT = () => {
  // GPU memory estimate from WebGL calls, per window (the combat iframe keeps its own).
  const S = (window.__glMem = { tex: 0, texCount: 0, buf: 0, bufCount: 0, rb: 0, rbCount: 0, contexts: 0, canvases: [] });
  const BPP = { 0x1908: 4, 0x1907: 4, 0x1909: 1, 0x190A: 2, 0x1906: 1, 0x8058: 4, 0x8C43: 4, 0x8051: 4, 0x881A: 8, 0x8814: 16, 0x8229: 1, 0x822B: 2,
    0x822D: 2, 0x822E: 4, 0x81A6: 4, 0x88F0: 4, 0x81A5: 2, 0x8CAC: 4, 0x8D48: 1, 0x8059: 4, 0x8C3A: 4, 0x881B: 6, 0x8815: 12, 0x8230: 8 };
  const tex = new WeakMap(), buf = new WeakMap(), rbs = new WeakMap();
  const dims = (s) => s ? [s.naturalWidth || s.videoWidth || s.displayWidth || s.width || 0, s.naturalHeight || s.videoHeight || s.displayHeight || s.height || 0] : [0, 0];
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue;
    const st = new WeakMap();
    const state = (gl) => { let s = st.get(gl); if (!s) { s = { unit: 0x84C0, tex: new Map(), buf: new Map(), rb: null }; st.set(gl, s); S.contexts += 1; try { S.canvases.push(new WeakRef(gl.canvas)); } catch { /* */ } } return s; };
    const wrap = (name, fn) => { const orig = proto[name]; if (!orig) return; proto[name] = function wrapped(...a) { try { fn(state(this), a); } catch { /* estimate only */ } return orig.apply(this, a); }; };
    const bindTarget = (t) => (t >= 0x8515 && t <= 0x851A ? 0x8513 : t);
    const record = (s, target, key, bytes, w, h) => {
      const t = s.tex.get(`${s.unit}:${bindTarget(target)}`); if (!t) return;
      let e = tex.get(t); if (!e) { e = { levels: new Map(), total: 0, w: 0, h: 0 }; tex.set(t, e); }
      const old = e.levels.get(key) ?? 0; e.levels.set(key, bytes); e.total += bytes - old; S.tex += bytes - old; if (w) { e.w = w; e.h = h; }
    };
    wrap('activeTexture', (s, [u]) => { s.unit = u; });
    wrap('bindTexture', (s, [target, t]) => { s.tex.set(`${s.unit}:${target}`, t); });
    wrap('createTexture', () => { S.texCount += 1; });
    wrap('deleteTexture', (s, [t]) => { const e = t && tex.get(t); if (e) { S.tex -= e.total; tex.delete(t); } if (t) S.texCount -= 1; });
    wrap('texImage2D', (s, a) => {
      const [target, level, internal] = a; let w, h, type;
      if (a.length >= 8) { w = a[3]; h = a[4]; type = a[7]; } else { [w, h] = dims(a[5]); type = a[4]; }
      let bpp = BPP[internal] ?? 4; if (type === 0x1406 && (internal === 0x1908 || internal === 0x1907)) bpp = 16;
      record(s, target, `${target}:${level}`, w * h * bpp, level === 0 ? w : 0, h);
    });
    wrap('texStorage2D', (s, [target, levels, internal, w, h]) => {
      let bytes = 0; for (let l = 0, lw = w, lh = h; l < levels; l += 1, lw = Math.max(1, lw >> 1), lh = Math.max(1, lh >> 1)) bytes += lw * lh * (BPP[internal] ?? 4);
      record(s, target, 'storage', bytes * (target === 0x8513 ? 6 : 1), w, h);
    });
    wrap('texImage3D', (s, a) => { const [target, level, internal, w, h, d] = a; record(s, target, `${target}:${level}`, w * h * d * (BPP[internal] ?? 4), w, h); });
    wrap('texStorage3D', (s, [target, levels, internal, w, h, d]) => { record(s, target, 'storage', w * h * d * (BPP[internal] ?? 4) * (levels > 1 ? 4 / 3 : 1), w, h); });
    wrap('compressedTexImage2D', (s, a) => { const data = a[6]; record(s, a[0], `${a[0]}:${a[1]}`, data?.byteLength ?? 0, a[3], a[4]); });
    wrap('generateMipmap', (s, [target]) => {
      const t = s.tex.get(`${s.unit}:${bindTarget(target)}`); const e = t && tex.get(t); if (!e || e.levels.has('storage')) return;
      const base0 = e.levels.get(`${target}:0`) ?? 0; record(s, target, 'mips', Math.round(base0 / 3), 0, 0);
    });
    wrap('bindBuffer', (s, [target, b]) => { s.buf.set(target, b); });
    wrap('createBuffer', () => { S.bufCount += 1; });
    wrap('bufferData', (s, a) => {
      const b = s.buf.get(a[0]); if (!b) return; const bytes = typeof a[1] === 'number' ? a[1] : (a[1]?.byteLength ?? 0);
      const old = buf.get(b) ?? 0; buf.set(b, bytes); S.buf += bytes - old;
    });
    wrap('deleteBuffer', (s, [b]) => { if (b) { S.buf -= buf.get(b) ?? 0; buf.delete(b); S.bufCount -= 1; } });
    wrap('bindRenderbuffer', (s, [, r]) => { s.rb = r; });
    wrap('createRenderbuffer', () => { S.rbCount += 1; });
    const rbStore = (s, bytes) => { if (!s.rb) return; const old = rbs.get(s.rb) ?? 0; rbs.set(s.rb, bytes); S.rb += bytes - old; };
    wrap('renderbufferStorage', (s, [, internal, w, h]) => rbStore(s, w * h * (BPP[internal] ?? 4)));
    wrap('renderbufferStorageMultisample', (s, [, samples, internal, w, h]) => rbStore(s, w * h * (BPP[internal] ?? 4) * Math.max(1, samples)));
    wrap('deleteRenderbuffer', (s, [r]) => { if (r) { S.rb -= rbs.get(r) ?? 0; rbs.delete(r); S.rbCount -= 1; } });
  }
  window.__glMemSnapshot = () => {
    let drawing = 0, live = 0;
    for (const ref of S.canvases) { const c = ref.deref(); if (c && c.isConnected) { live += 1; drawing += c.width * c.height * 12; } }
    return { textures: S.tex, textureCount: S.texCount, buffers: S.buf, bufferCount: S.bufCount, renderbuffers: S.rb, drawingBuffers: drawing, liveCanvases: live, contexts: S.contexts };
  };
  // Ultimates and boss signatures shown (the runtime floats ULTIME / SIGNATURE above the actor).
  if (location.pathname.includes('legacy-combat')) {
    window.__floats = { ULTIME: 0, SIGNATURE: 0, other: 0 };
    new MutationObserver((records) => { for (const r of records) for (const n of r.addedNodes) if (n.classList?.contains('float')) {
      const t = n.textContent; if (t === 'ULTIME' || t === 'SIGNATURE') window.__floats[t] += 1; else window.__floats.other += 1; } })
      .observe(document, { childList: true, subtree: true });
  }
  if (window.top !== window) return;
  // Frame recorder (top window only: a same-origin iframe renders in the same frame loop).
  const P = (window.__perf = { seg: null, longtasks: [] });
  let last = 0;
  const tick = (t) => { if (P.seg && last) { P.seg.dt.push(t - last); } last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  window.__perfBegin = (name) => { P.seg = { name, t0: performance.now(), dt: [] }; };
  window.__perfEnd = () => { const s = P.seg; P.seg = null; if (!s) return null; const t1 = performance.now();
    const lt = P.longtasks.filter((l) => l.start >= s.t0 && l.start <= t1); return { name: s.name, ms: t1 - s.t0, dt: s.dt, longtasks: lt.length, longtaskMs: lt.reduce((a, l) => a + l.duration, 0) }; };
  try { new PerformanceObserver((list) => { for (const e of list.getEntries()) P.longtasks.push({ start: e.startTime, duration: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* */ }
};

/* ------------------------------------------------------------------ helpers */
function frameStats(seg) {
  if (!seg || !seg.dt.length) return null;
  const dt = seg.dt.slice(1); const sorted = [...dt].sort((a, b) => a - b); const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const sum = dt.reduce((a, b) => a + b, 0);
  return { name: seg.name, seconds: +(seg.ms / 1000).toFixed(1), frames: dt.length, fps: +(dt.length / (sum / 1000)).toFixed(1), meanMs: +(sum / dt.length).toFixed(2),
    p50Ms: +q(0.5).toFixed(2), p95Ms: +q(0.95).toFixed(2), p99Ms: +q(0.99).toFixed(2), maxMs: +sorted.at(-1).toFixed(1),
    over33: dt.filter((d) => d > 33.4).length, over50: dt.filter((d) => d > 50).length, over100: dt.filter((d) => d > 100).length,
    worst: [...dt].sort((a, b) => b - a).slice(0, 5).map((d) => +d.toFixed(1)), longtasks: seg.longtasks, longtaskMs: Math.round(seg.longtaskMs) };
}

async function newSession({ profile = DESKTOP, saveText = null, gameMotion = null, network = null, cpu = 1 } = {}) {
  const context = await browser.newContext({ ...profile, reducedMotion: process.env.PERF_OS_MOTION === 'reduce' ? 'reduce' : 'no-preference' });
  await context.addInitScript(INSTRUMENT);
  // Experiment only (PERF_EXPERIMENT_SILENT=1): music and sound effects off in the game's own settings.
  if (process.env.PERF_EXPERIMENT_SILENT === '1') await context.addInitScript(() => { localStorage.setItem('rpg-threejs:ui-audio:v2', JSON.stringify({ enabled: false, volume: 0.8 })); localStorage.setItem('rpg-threejs:music:v1', JSON.stringify({ enabled: false, volume: 0.6 })); });
  // Experiment only (PERF_EXPERIMENT_LOSE_CONTEXT=1): the combat page gives its WebGL context back when it is removed.
  if (process.env.PERF_EXPERIMENT_LOSE_CONTEXT === '1') await context.addInitScript(() => { if (location.pathname.includes('legacy-combat')) addEventListener('pagehide', () => { try { window.__COMBAT_RENDERER?.forceContextLoss(); } catch { /* */ } }, { once: true }); });
  if (saveText) await context.addInitScript(([text]) => {
    if (sessionStorage.getItem('perf-save-written')) return; sessionStorage.setItem('perf-save-written', '1');
    localStorage.clear(); localStorage.setItem('rpg-threejs:autosave:v6:campaign', text); localStorage.setItem('rpg-threejs:save-times:v1', JSON.stringify({ auto: Date.now() }));
  }, [saveText]);
  if (gameMotion) await context.addInitScript(([reduced]) => { localStorage.setItem('rpg-threejs:motion-preference:v1', JSON.stringify({ reduced })); }, [gameMotion === 'reduce']);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Performance.enable');
  const net = { bytes: 0, requests: 0, byType: {}, urls: new Map() };
  cdp.on('Network.responseReceived', (e) => { net.urls.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status, fromCache: e.response.fromDiskCache || e.response.fromMemoryCache || e.response.status === 304 }); });
  cdp.on('Network.loadingFinished', (e) => { const u = net.urls.get(e.requestId); net.bytes += e.encodedDataLength; net.requests += 1;
    const kind = u ? kindOf(u.url) : 'other'; (net.byType[kind] ??= { bytes: 0, count: 0 }); net.byType[kind].bytes += e.encodedDataLength; net.byType[kind].count += 1; if (u) u.bytes = e.encodedDataLength; });
  if (network) await cdp.send('Network.emulateNetworkConditions', network);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  page.on('pageerror', (e) => report.errors.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`console: ${m.text().slice(0, 300)}`); });
  // Every failed request is an error: a file the build removed must never be asked for (OD-2026-11-15-A).
  page.on('response', (r) => { if (r.status() >= 400) report.errors.push(`http ${r.status()}: ${r.url().slice(0, 300)}`); });
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText ?? '')) report.errors.push(`requestfailed: ${r.url().slice(0, 300)} ${r.failure()?.errorText ?? ''}`); });
  // Read-only observation hook: the built bootstrap's GameApp instance, exposed as the continuous QA driver does.
  await page.route('**/assets/game-*.js', async (route) => {
    const response = await route.fetch(); const source = await response.text();
    // `const app=new GameApp(root,canvas),gamepad=installGamepadNavigator(…);window.addEventListener("pagehide",…)`
    const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([A-Za-z_$][\w$]*,[A-Za-z_$][\w$]*\)(?:,[^;]*)?;window\.addEventListener\("pagehide"/;
    if (!pattern.test(source)) { report.errors.push('bootstrap observation hook missing'); await route.fulfill({ response, body: source }); return; }
    await route.fulfill({ response, body: source.replace(pattern, (match, name) => match.replace(';window.addEventListener("pagehide"', `;window.__perfApp=${name};window.addEventListener("pagehide"`)) });
  });
  return { context, page, cdp, net };
}
const kindOf = (url) => { const p = new URL(url).pathname; if (/\.js$/.test(p)) return 'js'; if (/\.css$/.test(p)) return 'css'; if (/\.(png|webp|jpe?g|gif|svg)$/.test(p)) return 'image';
  if (/\.(woff2?|ttf)$/.test(p)) return 'font'; if (/\.(wav|mp3|ogg)$/.test(p)) return 'audio'; if (/\.json$/.test(p)) return 'json'; if (/\.html?$/.test(p) || p === '/') return 'html'; return 'other'; };

/** Browser process working sets (MB), read from the OS at checkpoints. */
async function processMemory() {
  try {
    const cdp = await browser.newBrowserCDPSession(); const info = await cdp.send('SystemInfo.getProcessInfo'); await cdp.detach();
    const ids = info.processInfo.map((p) => p.id).filter(Boolean);
    const raw = execSync(`powershell -NoProfile -Command "Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json"`).toString();
    const rows = [].concat(JSON.parse(raw)); const byType = {};
    for (const p of info.processInfo) { const r = rows.find((x) => x.Id === p.id); if (!r) continue; (byType[p.type] ??= { ws: 0, priv: 0 }); byType[p.type].ws += r.WorkingSet64 / 2 ** 20; byType[p.type].priv += r.PrivateMemorySize64 / 2 ** 20; }
    for (const k of Object.keys(byType)) { byType[k].ws = Math.round(byType[k].ws); byType[k].priv = Math.round(byType[k].priv); }
    return byType;
  } catch (error) { return { error: String(error).slice(0, 200) }; }
}

async function checkpoint(session, name, { gc = true } = {}) {
  const { page, cdp } = session;
  if (gc) { await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); await sleep(600); await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); await sleep(400); }
  const heap = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const dom = await cdp.send('Memory.getDOMCounters').catch(() => null);
  const gl = await page.evaluate(() => {
    const own = window.__glMemSnapshot?.(); const frames = [...document.querySelectorAll('iframe')].map((f) => { try { return f.contentWindow.__glMemSnapshot?.(); } catch { return null; } }).filter(Boolean);
    return { top: own, iframes: frames, iframeCount: document.querySelectorAll('iframe').length };
  }).catch(() => null);
  const mb = (b) => +(b / 2 ** 20).toFixed(1);
  const gpuMb = gl ? [gl.top, ...gl.iframes].filter(Boolean).reduce((a, s) => a + s.textures + s.buffers + s.renderbuffers + s.drawingBuffers, 0) : 0;
  const row = { name, at: Math.round((Date.now() - started) / 1000), heapUsedMb: heap ? mb(heap.usedSize) : null, jsHeapUsedMb: mb(metrics.JSHeapUsedSize ?? 0),
    jsHeapTotalMb: mb(metrics.JSHeapTotalSize ?? 0), nodes: metrics.Nodes, documents: metrics.Documents, frames: metrics.Frames, listeners: metrics.JSEventListeners,
    domCounters: dom, gpuEstimateMb: mb(gpuMb), gl, process: await processMemory() };
  log(`checkpoint ${name}: heap ${row.heapUsedMb} MB, docs ${row.documents}, nodes ${row.nodes}, gpu~${row.gpuEstimateMb} MB, renderer ws ${row.process.renderer?.ws ?? '?'} MB, gpu ws ${row.process.GPU?.ws ?? '?'} MB`);
  return row;
}

async function live(page) {
  return page.evaluate(() => {
    const app = window.__perfApp; if (!app) return null; const s = app.state;
    return { mode: app.mode, surface: document.body.dataset.campaignSurface ?? null, runId: s.run.id, node: s.run.currentNodeId, resolved: [...(s.resolvedNodeIds ?? [])] };
  }).catch(() => null);
}

const probe = (page) => page.evaluate(() => {
  const shown = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.01; };
  const dialogue = document.querySelector('.dialogue[data-dialogue-sequence]');
  const choices = dialogue ? [...dialogue.querySelectorAll('.dialogue-choice')].filter(shown) : [];
  const journey = [...document.querySelectorAll('[data-journey-continue]')].find((b) => shown(b) && !b.disabled);
  return {
    curtain: [...document.querySelectorAll('.scene-transition')].some(shown),
    title: shown(document.querySelector('[data-action="new"]')),
    opening: shown(document.querySelector('.opening-sequence [data-skip]')),
    living: shown(document.querySelector('.living-tableau__skip')),
    defeat: Boolean(document.querySelector('#defeat-title')),
    dialogue: dialogue && shown(dialogue) ? { sequence: dialogue.dataset.dialogueSequence, step: dialogue.dataset.dialogueStep ?? null,
      choices: choices.map((b) => ({ text: (b.textContent ?? '').replace(/\s+/g, ' ').trim(), disabled: b.disabled })) } : null,
    journey: Boolean(journey),
    refuge: shown(document.querySelector('.exploration-stop [data-action="continue"]')),
    board: shown(document.querySelector('[data-board-action="next"]')),
    acknowledge: [...document.querySelectorAll('.poi-encounter button, [data-poi-encounter-action]')].some(shown),
    combatFrame: Boolean(document.querySelector('iframe.combat-frame')),
  };
});

async function record(session, name, seconds) {
  await session.page.evaluate((n) => window.__perfBegin(n), name);
  await sleep(seconds * 1000);
  const seg = await session.page.evaluate(() => window.__perfEnd());
  const stats = frameStats(seg); log(`frames ${name}: ${stats?.fps} fps, mean ${stats?.meanMs} ms, p95 ${stats?.p95Ms} ms, max ${stats?.maxMs} ms, >50ms ${stats?.over50}`);
  return stats;
}

/* ------------------------------------------------------------------ combat autoplay (real inputs in the iframe) */
const combatFrameOf = (page) => page.frames().find((f) => f.url().includes('legacy-combat.html'));
async function clickInFrame(page, frame, selector) { return clickLocator(page, frame.locator(selector).first()); }
/** A real mouse click on a tactical-frame control once a hit test shows it on top (the frame never looks "stable"). */
async function clickLocator(page, loc) {
  if (!(await loc.isVisible().catch(() => false))) return false;
  const p = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y);
    return { x, y, ok: hit === el || el.contains(hit) }; }).catch(() => null);
  if (!p?.ok) return false;
  const box = await page.locator('iframe.combat-frame').first().boundingBox();
  await page.mouse.click((box?.x ?? 0) + p.x, (box?.y ?? 0) + p.y);
  return true;
}
const G = (frame) => frame.evaluate(() => { const g = window.G; if (!g) return null; return { over: g.over, mode: g.mode, busy: g.busy, team: g.active?.team ?? null, round: g.round,
  deploy: Boolean(document.querySelector('#menu [data-d="start"]')), alive: g.units.filter((u) => u.alive).map((u) => u.team) }; }).catch(() => null);
async function cellClick(page, frame, cell) {
  const point = await frame.evaluate(({ gx, gz }) => window.__qaHelpers.getCellScreenPosition(gx, gz), cell);
  const box = await page.locator('iframe.combat-frame').first().boundingBox();
  for (const [dx, dy] of [[0, 0], [8, 0], [-8, 0], [0, 8], [0, -8]]) {
    const x = point.screenX + dx, y = point.screenY + dy;
    const onCanvas = await frame.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'CANVAS', { x, y });
    if (onCanvas) { await page.mouse.click(box.x + x, box.y + y); return true; }
  }
  return false;
}
async function settled(frame, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const s = await G(frame); if (!s || s.over || (!s.busy && s.mode === 'menu' && s.team === 'player')) return s; await sleep(250); }
  return G(frame);
}
async function targetAndFire(page, frame) {
  const candidates = await frame.evaluate(() => { const g = window.G; if (g.mode !== 'target' || !g.pending) return [];
    const offensive = g.pending.spec?.offensive !== false && g.pending.spec?.targetMode !== 'ally';
    return (g.pending.centers ?? []).map((c) => ({ c, u: g.grid[c.gx]?.[c.gz]?.occupant })).filter(({ u }) => u && u.alive && (offensive ? u.team !== g.active.team : u.team === g.active.team))
      .sort((a, b) => a.u.hp - b.u.hp).map(({ c }) => ({ gx: c.gx, gz: c.gz }))
      .concat(offensive ? (g.pending.centers ?? []).map((c) => ({ gx: c.gx, gz: c.gz, d: Math.min(...g.units.filter((u) => u.alive && u.team !== g.active.team).map((u) => Math.abs(u.gx - c.gx) + Math.abs(u.gz - c.gz))) }))
        .filter((c) => c.d >= 1 && c.d <= 1).slice(0, 3).map(({ gx, gz }) => ({ gx, gz })) : []); });
  for (const cell of candidates) {
    if (!(await cellClick(page, frame, cell))) continue;
    await sleep(80); const s = await G(frame);
    if (s && s.mode === 'target' && !s.busy) continue;
    await settled(frame); return true;
  }
  return false;
}
async function playerTurn(page, frame, stats) {
  // 1. The most expensive usable skill on a target, 2. the heaviest Élan attack, 3. a move toward the foes then an attack, 4. wait.
  if (await clickInFrame(page, frame, '#menu [data-a="skill"]:not(:disabled)')) {
    await sleep(120);
    const skills = await frame.locator('#skillmenu [data-s]:not([data-s="_back"]):not(:disabled)').count();
    for (let i = skills - 1; i >= 0; i -= 1) {
      const button = frame.locator('#skillmenu [data-s]:not([data-s="_back"]):not(:disabled)').nth(i);
      if (!(await button.isVisible().catch(() => false))) break;
      await clickLocator(page, button);
      await sleep(150); const s = await G(frame);
      if (s?.busy || s?.over) { await settled(frame); stats.skills += 1; return; }
      if (s?.mode === 'target') { if (await targetAndFire(page, frame)) { stats.skills += 1; return; } await frame.locator('body').press('Escape'); await sleep(100); }
      if (!(await frame.locator('#skillmenu:not(.hidden)').isVisible().catch(() => false))) break;
    }
    if (await frame.locator('#skillmenu:not(.hidden)').isVisible().catch(() => false)) { await frame.locator('body').press('Escape'); await sleep(100); }
  }
  const attack = async () => {
    if (!(await clickInFrame(page, frame, '#menu [data-a="attack"]:not(:disabled)'))) return false;
    await sleep(120); const charges = frame.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)');
    if (!(await charges.count())) { await frame.locator('body').press('Escape'); return false; }
    await clickLocator(page, charges.last()); await sleep(150);
    if (await targetAndFire(page, frame)) { stats.attacks += 1; return true; }
    await frame.locator('body').press('Escape'); await sleep(100); return false;
  };
  if (await attack()) return;
  if (await clickInFrame(page, frame, '#menu [data-a="move"]:not(:disabled)')) {
    await sleep(120);
    const cells = await frame.evaluate(() => { const g = window.G, u = g.active, foes = g.units.filter((e) => e.team !== u.team && e.alive);
      return (g.reach?.list ?? []).filter((c) => (c.gx !== u.gx || c.gz !== u.gz) && !g.grid[c.gx][c.gz].occupant)
        .map((c) => ({ gx: c.gx, gz: c.gz, d: Math.min(...foes.map((e) => Math.abs(c.gx - e.gx) + Math.abs(c.gz - e.gz))) })).sort((a, b) => a.d - b.d).slice(0, 4); });
    let moved = false;
    for (const cell of cells) { if (await cellClick(page, frame, cell)) { await sleep(80); const s = await G(frame); if (s?.mode === 'move' && !s.busy) continue; await settled(frame); moved = true; stats.moves += 1; break; } }
    if (!moved) { await frame.locator('body').press('Escape'); await sleep(100); }
    if (moved && (await attack())) return;
  }
  const s = await G(frame);
  if (s && !s.over && s.team === 'player' && s.mode === 'menu' && !s.busy && (await clickInFrame(page, frame, '#menu [data-a="wait"]:not(:disabled)'))) { stats.waits += 1; await sleep(150); }
}
async function prepareCombat(page, frame) {
  for (let i = 0; i < 80; i += 1) {
    for (const close of ['#tutorial:not(.hidden) [data-action="skip"]', '#boss-tutorial:not(.hidden) [data-action="start"]']) await clickInFrame(page, frame, close);
    const s = await G(frame);
    if (s && !s.deploy && s.mode !== 'deploy' && s.round >= 1) return true;
    if (s?.deploy) { await clickInFrame(page, frame, '#menu [data-d="auto"]'); await sleep(200); await clickInFrame(page, frame, '#menu [data-d="start"]:not(:disabled)'); }
    await sleep(400);
  }
  return false;
}
async function abandon(page, frame) {
  await clickInFrame(page, frame, '#settings-btn'); await sleep(200);
  await clickInFrame(page, frame, '#settings [data-s="abandon"]'); await sleep(200);
  await clickInFrame(page, frame, '#settings [data-s="abandon-confirm"]'); await sleep(500);
}

/**
 * Plays the current fight by real inputs for `seconds` (or to its end) while the frame recorder runs; returns stats.
 * `quit`: 'result' clicks the result card when the fight ends; 'abandon' leaves through the settings after `seconds`.
 */
async function playCombat(session, name, { seconds = 150, quit = 'result', idle = false } = {}) {
  const { page } = session; let frame;
  for (let i = 0; i < 120 && !(frame = combatFrameOf(page)); i += 1) await sleep(250);
  if (!frame) throw new Error('combat frame missing');
  await frame.waitForFunction(() => window.__BOOTED === true, null, { timeout: 90000, polling: 250 });
  const prepared = await prepareCombat(page, frame);
  // The image each unit is drawn from: its pixel sheet or pose, or the procedural fallback canvas (OD-2026-11-15-A, P3).
  const unitSprites = await frame.evaluate(() => (window.G?.units ?? []).map((u) => { const image = u.mat?.map?.image;
    const src = image instanceof HTMLCanvasElement ? 'canvas' : (image?.currentSrc || image?.src || null);
    return { name: u.name, team: u.team, src: src ? src.replace(location.origin, '') : null }; })).catch(() => null);
  if (process.env.PERF_SHOTS === '1') await page.screenshot({ path: resolve(output, `${name}-battlefield.png`) }).catch(() => {});
  const stats = { skills: 0, attacks: 0, moves: 0, waits: 0, prepared };
  await page.evaluate((n) => window.__perfBegin(n), name);
  const end = Date.now() + seconds * 1000; let s;
  while (Date.now() < end) {
    s = await G(frame); if (!s || s.over) break;
    if (!idle && s.team === 'player' && s.mode === 'menu' && !s.busy) await playerTurn(page, frame, stats); else await sleep(250);
  }
  const seg = await page.evaluate(() => window.__perfEnd());
  const fstats = frameStats(seg);
  const end1 = await G(frame); const floats = await frame.evaluate(() => window.__floats).catch(() => null);
  const gl = await frame.evaluate(() => window.__glMemSnapshot?.()).catch(() => null);
  const renderInfo = await frame.evaluate(() => ({ dpr: devicePixelRatio, canvas: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`) })).catch(() => null);
  log(`combat ${name}: ${fstats?.fps} fps, mean ${fstats?.meanMs}, p95 ${fstats?.p95Ms}, max ${fstats?.maxMs}, >50 ${fstats?.over50}; round ${end1?.round}, over ${end1?.over}, actions ${JSON.stringify(stats)}, floats ${JSON.stringify(floats)}`);
  if (quit === 'abandon' && !end1?.over) await abandon(page, frame);
  {
    // An ended or abandoned fight shows its result card in the frame; its button hands the result back to the parent.
    for (let i = 0; i < 60; i += 1) { if (await clickInFrame(page, frame, '#combat-result-action')) break; if (!combatFrameOf(page)) break; await sleep(500); }
  }
  // The parent removes the iframe once the result is handed back: wait for it, so the walker never re-enters the old fight.
  for (let i = 0; i < 80 && (await page.locator('iframe.combat-frame').count()); i += 1) await sleep(250);
  return { frames: fstats, rounds: end1?.round ?? null, over: end1?.over ?? null, actions: stats, floats, gpu: gl, renderInfo, unitSprites };
}

/* ------------------------------------------------------------------ campaign walker */
/**
 * Walks the campaign by real inputs until `until(state, seen)` is true. Hooks let the caller record a scene the first
 * time it shows. Dialogue answers follow `decisions` (the Respect plan) when given, else the first open answer.
 */
async function walk(session, { route = [], decisions = [], until, onScene = async () => {}, timeoutMs = 15 * 60 * 1000 }) {
  const { page } = session; const usedDecisions = new Set(); const end = Date.now() + timeoutMs; let lastSig = ''; let lastProgress = Date.now();
  while (Date.now() < end) {
    const state = await live(page); const seen = await probe(page).catch(() => null);
    if (!seen) { await sleep(250); continue; }
    const sig = JSON.stringify([state, seen]); if (sig !== lastSig) { lastSig = sig; lastProgress = Date.now(); }
    if (Date.now() - lastProgress > 120000) throw new Error(`walker stuck: ${sig.slice(0, 600)}`);
    if (await until(state, seen)) return state;
    if (seen.curtain) { await sleep(120); continue; }
    try {
      if (seen.title) { await onScene('title', state, seen); if (await page.locator('[data-action="continue"]:not(:disabled)').count()) await page.locator('[data-action="continue"]').click(); else { await page.locator('[data-action="new"]').click(); await page.locator('[data-action="confirm-new"]').click({ timeout: 1500 }).catch(() => {}); } await sleep(300); continue; }
      if (seen.opening) { await onScene('opening', state, seen); await page.locator('.opening-sequence [data-skip]').click({ timeout: 3000 }).catch(() => {}); await sleep(300); continue; }
      if (seen.living) { await onScene('living', state, seen); await page.locator('.living-tableau__skip').click({ timeout: 3000 }).catch(() => {}); await sleep(400); continue; }
      if (state?.mode === 'COMBAT' || seen.combatFrame) { await onScene('combat', state, seen); await sleep(300); continue; }
      if (seen.defeat) { await onScene('defeat', state, seen); const resume = page.locator('[data-action="resume-save"]'); if (await resume.count()) await resume.click(); await sleep(400); continue; }
      if (seen.dialogue) {
        await onScene('dialogue', state, seen);
        const { sequence, step, choices } = seen.dialogue;
        if (choices.length && choices.every((c) => c.disabled)) { await sleep(120); continue; }
        if (choices.length) {
          const di = decisions.findIndex((d, i) => !usedDecisions.has(i) && d.dialogueId === sequence && d.stepId === step);
          let index = 0;
          if (di >= 0) { usedDecisions.add(di); const key = decisions[di].text.replace(/\s+/g, ' ').trim().slice(0, 40).toLocaleLowerCase('fr'); const found = choices.findIndex((c) => c.text.toLocaleLowerCase('fr').includes(key)); if (found >= 0) index = found; }
          else index = Math.max(0, choices.findIndex((c) => !c.disabled));
          await page.locator('.dialogue .dialogue-choice:visible').nth(index).click({ timeout: 4000 }); await sleep(150); continue;
        }
        await page.locator('.dialogue .dialogue__box').first().click({ timeout: 4000 }); await sleep(60); continue;
      }
      if (seen.journey) { await onScene('journey', state, seen); await page.locator('[data-journey-continue]:visible:not(:disabled)').first().click({ timeout: 4000 }); continue; }
      if (seen.refuge) { await onScene('refuge', state, seen); await page.locator('.exploration-stop [data-action="continue"]').click({ timeout: 4000 }); await sleep(300); continue; }
      if (seen.board) { await page.locator('[data-board-action="next"]').first().click({ timeout: 4000 }); continue; }
      if (state?.surface === 'poi-map' && state.mode === 'TRAVEL') {
        await onScene('map', state, seen);
        const next = route.find((poi) => !state.resolved.includes(poi) && poi !== state.node);
        const tryPoi = async (poi) => { await page.locator(`[data-poi-id="${poi}"]`).click({ timeout: 3000 }); const move = page.locator('[data-poi-action="move"]:not(:disabled)'); if (!(await move.count())) return false; await move.click({ timeout: 3000 }); return true; };
        if (next && (await tryPoi(next).catch(() => false))) { await sleep(250); continue; }
        await sleep(300); continue;
      }
      if (seen.acknowledge) { await page.locator('.poi-encounter button:visible, [data-poi-encounter-action]:visible').first().click(); continue; }
      await sleep(150);
    } catch (error) { await sleep(400); }
  }
  throw new Error('walker timeout');
}

/* ------------------------------------------------------------------ scenarios */
async function scenarioLoad() {
  const out = { cold: [], warm: [], throttled: {} };
  const titleReady = async (page) => { await page.locator('[data-action="new"]').waitFor({ state: 'visible', timeout: 180000 }); };
  const navTimes = (page) => page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { domContentLoadedMs: Math.round(n.domContentLoadedEventEnd), loadMs: Math.round(n.loadEventEnd), fcpMs: fcp ? Math.round(fcp.startTime) : null }; });
  const summary = (net) => ({ mb: +(net.bytes / 2 ** 20).toFixed(2), requests: net.requests, byType: Object.fromEntries(Object.entries(net.byType).map(([k, v]) => [k, { mb: +(v.bytes / 2 ** 20).toFixed(2), count: v.count }])) });
  for (let i = 0; i < 3; i += 1) {
    const session = await newSession(); const t0 = Date.now();
    await session.page.goto(base, { waitUntil: 'commit' }); await titleReady(session.page);
    const cold = { titleMs: Date.now() - t0, ...(await navTimes(session.page)), ...summary(session.net) };
    session.net.bytes = 0; session.net.requests = 0; session.net.byType = {};
    const t1 = Date.now(); await session.page.reload({ waitUntil: 'commit' }); await titleReady(session.page);
    const warm = { titleMs: Date.now() - t1, ...(await navTimes(session.page)), ...summary(session.net) };
    out.cold.push(cold); out.warm.push(warm); log(`load #${i + 1}: cold title ${cold.titleMs} ms ${cold.mb} MB / warm ${warm.titleMs} ms ${warm.mb} MB`);
    await session.context.close();
  }
  // First combat from a cold start, as a returning player: title, "Continuer", the map, the first fight's POI.
  const wolf = await saveOf('lion-before-wolf-pack');
  for (const [name, network] of [['none', null], ['fast4g', NETWORKS.fast4g], ['slow4g', NETWORKS.slow4g]]) {
    const session = await newSession({ saveText: wolf.text, network }); const t0 = Date.now();
    await session.page.goto(base, { waitUntil: 'commit' }); await titleReady(session.page);
    const title = { ms: Date.now() - t0, ...summary(session.net) };
    let combat = null;
    if (name !== 'slow4g') {
      await walk(session, { route: wolf.entry.route, decisions: wolf.entry.decisions, until: async (state, seen) => seen.combatFrame, timeoutMs: 6 * 60 * 1000 });
      const frame = await (async () => { for (let i = 0; i < 200; i += 1) { const f = combatFrameOf(session.page); if (f) return f; await sleep(250); } return null; })();
      await frame.waitForFunction(() => window.__BOOTED === true && Boolean(document.querySelector('#menu [data-d], #menu [data-a]')), null, { timeout: 240000, polling: 250 });
      combat = { ms: Date.now() - t0, ...summary(session.net) };
      const top = [...session.net.urls.values()].filter((u) => u.bytes).sort((a, b) => b.bytes - a.bytes).slice(0, 15).map((u) => ({ path: new URL(u.url).pathname, kb: Math.round(u.bytes / 1024) }));
      combat.largest = top;
      const folders = {};
      for (const u of session.net.urls.values()) { if (!u.bytes) continue; const key = new URL(u.url).pathname.split('/').slice(0, 5).join('/'); (folders[key] ??= { kb: 0, count: 0 }); folders[key].kb += Math.round(u.bytes / 1024); folders[key].count += 1; }
      combat.byFolder = Object.fromEntries(Object.entries(folders).sort((a, b) => b[1].kb - a[1].kb).slice(0, 20));
    }
    out.throttled[name] = { title, firstCombat: combat };
    log(`first screen (${name}): ${title.ms} ms ${title.mb} MB; first combat: ${combat ? `${combat.ms} ms ${combat.mb} MB` : 'not measured'}`);
    await session.context.close();
  }
  return out;
}

async function scenarioJourney() {
  // A new chronicle from the title: opening, the first dialogues, the map, the first fights, the first refuge.
  const lion = JSON.parse(await readFile(resolve(savesDir, 'lion-new.json'), 'utf8'));
  const route = [...lion.route]; const decisions = [...lion.decisions];
  const session = await newSession(); const out = { frames: [], combats: [], checkpoints: [] };
  await session.page.goto(base, { waitUntil: 'load' });
  const done = new Set(); let mapVisits = 0; let lastScene = ''; const shots = new Set();
  const onScene = async (scene, state, seen) => {
    const shot = scene === 'living' ? `living-${state?.node}` : scene === 'dialogue' ? `dialogue-${seen.dialogue?.sequence}` : scene;
    if (process.env.PERF_SHOTS === '1' && ['title', 'opening', 'living', 'dialogue', 'map', 'refuge'].includes(scene) && !shots.has(shot) && shots.size < 14) {
      shots.add(shot); await sleep(1500); await session.page.screenshot({ path: resolve(output, `journey-${shot}.png`) }).catch(() => {});
    }
    if (scene === 'title' && !done.has('title')) { done.add('title'); await sleep(2500); out.checkpoints.push(await checkpoint(session, 'title')); out.frames.push(await record(session, 'title', 8)); }
    if (scene === 'opening' && !done.has('opening')) { done.add('opening'); await sleep(1500); out.frames.push(await record(session, 'living-opening', 15)); out.checkpoints.push(await checkpoint(session, 'opening', { gc: false })); }
    if (scene === 'living' && !done.has(`living:${state?.node}`)) { done.add(`living:${state?.node}`); await sleep(1200); out.frames.push(await record(session, `living-${state?.node}`, 12)); }
    if (scene === 'dialogue' && !done.has('dialogue') && seen.dialogue?.choices.length === 0) { done.add('dialogue'); await sleep(1500); out.frames.push(await record(session, `dialogue-${seen.dialogue.sequence}`, 8)); out.checkpoints.push(await checkpoint(session, 'dialogue', { gc: false })); }
    if (scene === 'map' && lastScene !== 'map') {
      mapVisits += 1; await sleep(1500);
      if (mapVisits === 1) out.frames.push(await record(session, 'map', 10));
      out.checkpoints.push(await checkpoint(session, `map-${mapVisits}-${state?.node}`));
    }
    if (scene === 'combat') {
      const fight = await session.page.evaluate(() => window.__perfApp?.combat?.session?.config?.id ?? null).catch(() => null);
      out.combats.push({ id: fight, ...(await playCombat(session, `combat-${fight}`, { seconds: 240, quit: 'result' })) });
      out.checkpoints.push(await checkpoint(session, `after-combat-${fight}`, { gc: false }));
    }
    if (scene === 'refuge' && !done.has('refuge')) {
      done.add('refuge'); await sleep(1500); out.frames.push(await record(session, 'refuge', 8)); out.checkpoints.push(await checkpoint(session, 'refuge'));
      await session.page.locator('.exploration-stop [data-action="clan"]').click({ timeout: 4000 }).catch(() => {}); await sleep(1500);
      out.frames.push(await record(session, 'refuge-management-company', 8));
      await session.page.keyboard.press('Escape'); await sleep(800);
      await session.page.locator('.exploration-stop [data-action="shop"]').click({ timeout: 4000 }).catch(() => {}); await sleep(1500);
      out.frames.push(await record(session, 'refuge-management-shop', 6));
      await session.page.keyboard.press('Escape'); await sleep(800);
      out.checkpoints.push(await checkpoint(session, 'refuge-after-management'));
    }
    lastScene = scene;
  };
  await walk(session, { route, decisions, onScene, until: async () => done.has('refuge'), timeoutMs: 40 * 60 * 1000 }).catch((error) => { out.error = String(error).slice(0, 400); log(`journey: ${out.error}`); });
  await session.page.screenshot({ path: resolve(output, 'journey-end.png') }).catch(() => {});
  await session.context.close();
  return out;
}

async function scenarioFight(saveName, { profile = DESKTOP, seconds = 240, cpu = 1, tag = '', gameMotion = null } = {}) {
  const save = await saveOf(saveName); const session = await newSession({ profile, saveText: save.text, cpu, gameMotion }); const out = { save: saveName, combatId: save.entry.combatId, checkpoints: [] };
  await session.page.goto(base, { waitUntil: 'load' });
  let played = false;
  await walk(session, { route: save.entry.route, decisions: save.entry.decisions, until: async () => played, timeoutMs: 20 * 60 * 1000,
    onScene: async (scene, state) => {
      if (scene === 'map' && !out.checkpoints.length) { await sleep(1500); out.checkpoints.push(await checkpoint(session, 'map-before')); }
      if (scene === 'combat' && !played) {
        const fight = await session.page.evaluate(() => window.__perfApp?.combat?.session?.config?.id ?? null).catch(() => null);
        if (fight !== save.entry.combatId) { out.skipped = [...(out.skipped ?? []), fight]; Object.assign(out, await playCombat(session, `combat-${fight}`, { seconds: 300, quit: 'result' })); return; }
        out.combat = await playCombat(session, `combat-${fight}${tag}`, { seconds, quit: 'abandon' });
        out.checkpoints.push(await checkpoint(session, 'in-combat-end', { gc: false }));
        await session.page.screenshot({ path: resolve(output, `fight-${saveName}${tag}.png`) }).catch(() => {});
        played = true;
      }
    } }).catch((error) => { out.error = String(error).slice(0, 400); log(`fight ${saveName}: ${out.error}`); });
  await session.context.close();
  return out;
}

/** Chrome memory-infra: allocator totals of the renderer processes, at named points (PERF_MEMORY_DUMP=1). */
async function memoryInfra() {
  const cdp = await browser.newBrowserCDPSession(); const dumps = []; const kept = [];
  // Events stream in as they are collected; only process names and memory dumps are kept (a full trace is too big).
  cdp.on('Tracing.dataCollected', ({ value }) => { for (const e of value) if ((e.ph === 'M' && e.name === 'process_name') || e.ph === 'v') kept.push(e); });
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['disabled-by-default-memory-infra'], excludedCategories: ['*'], recordMode: 'recordAsMuchAsPossible', memoryDumpConfig: { triggers: [] } }, transferMode: 'ReportEvents' });
  return {
    dump: async (name) => { const r = await cdp.send('Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'light' }); dumps.push({ name, id: r.dumpGuid }); },
    end: async () => {
      const done = new Promise((ok) => cdp.once('Tracing.tracingComplete', ok)); await cdp.send('Tracing.end'); await done; await cdp.detach();
      const names = new Map(); for (const e of kept) if (e.ph === 'M') names.set(e.pid, e.args.name);
      try { await writeFile(resolve(output, 'memory-infra-debug.json'), JSON.stringify({ dumps, names: [...names], sample: kept.filter((e) => e.ph === 'v').slice(0, 3).map((e) => ({ id: e.id, pid: e.pid, name: e.name, keys: Object.keys(e.args?.dumps ?? {}), alloc: Object.keys(e.args?.dumps?.allocators ?? {}).slice(0, 30) })), count: kept.length })); } catch { /* */ }
      const out = {};
      // Dump ids in the events do not equal the returned guids: the n-th dump id seen is the n-th request.
      const ids = [...new Set(kept.filter((e) => e.ph === 'v').map((e) => e.id))];
      for (const [index, d] of dumps.entries()) {
        const rows = {};
        for (const e of kept) if (e.ph === 'v' && e.id === ids[index] && (/Renderer/i.test(names.get(e.pid) ?? '') || !names.has(e.pid))) {
          for (const [k, v] of Object.entries(e.args?.dumps?.allocators ?? {})) { if (k.split('/').length > 2) continue; const size = parseInt(v.attrs?.size?.value ?? '0', 16); rows[k] = Math.round(((rows[k] ?? 0) + size / 2 ** 20) * 10) / 10; }
        }
        out[d.name] = rows;
      }
      return out;
    },
  };
}

async function scenarioLeak() {
  // The same fight entered, played 25 s and abandoned five times in one page ("Reprendre la sauvegarde" resumes into the
  // fight): after each one the parent must give back the iframe, its WebGL context and its heap.
  const save = await saveOf('lion-before-wolf-pack'); const session = await newSession({ saveText: save.text }); const out = { cycles: [], checkpoints: [] };
  const infra = process.env.PERF_MEMORY_DUMP === '1' ? await memoryInfra() : null;
  await session.page.goto(base, { waitUntil: 'load' });
  let cycle = 0; let measured = 0;
  await walk(session, { route: save.entry.route, decisions: save.entry.decisions, until: async () => measured >= 5, timeoutMs: 30 * 60 * 1000,
    onScene: async (scene) => {
      if (scene === 'map' && !out.checkpoints.length) { await sleep(2000); out.checkpoints.push(await checkpoint(session, 'map-before-fights')); }
      if (scene === 'combat') {
        // An abandoned fight's iframe stays until the defeat screen hands over: not a new fight.
        const stale = combatFrameOf(session.page); if (stale && (await G(stale))?.over) { await sleep(500); return; }
        cycle += 1; out.cycles.push(await playCombat(session, `leak-cycle-${cycle}`, { seconds: 25, quit: 'abandon' }));
      }
      if (scene === 'defeat' && measured < cycle) {
        // Measured on the defeat screen, once the parent has removed the fight's iframe.
        for (let i = 0; i < 40 && (await session.page.locator('iframe.combat-frame').count()); i += 1) await sleep(250);
        await sleep(1000); out.checkpoints.push(await checkpoint(session, `after-${cycle}-fights`)); await infra?.dump(`after-${cycle}-fights`); measured = cycle;
      }
    } }).catch((error) => { out.error = String(error).slice(0, 400); log(`leak: ${out.error}`); });
  // Cache or leak? A critical memory-pressure signal makes Chrome purge its caches; what stays is retained.
  await session.cdp.send('Memory.simulatePressureNotification', { level: 'critical' }).catch(() => {});
  await sleep(3000); out.checkpoints.push(await checkpoint(session, 'after-memory-pressure'));
  if (infra) { await infra.dump('after-memory-pressure'); out.memoryInfra = await infra.end(); log(`memory-infra: ${JSON.stringify(out.memoryInfra)}`); }
  await session.context.close();
  return out;
}

async function scenarioMobile() {
  const out = {};
  // Title and opening, then the first fight, on a phone viewport with the CPU slowed four times.
  const session = await newSession({ profile: MOBILE, cpu: 4 });
  await session.page.goto(base, { waitUntil: 'load' }); await session.page.locator('[data-action="new"]').waitFor({ timeout: 120000 });
  await sleep(2500); out.title = await record(session, 'mobile-title', 8);
  await session.page.locator('[data-action="new"]').click(); await session.page.locator('[data-action="confirm-new"]').click({ timeout: 1500 }).catch(() => {});
  await session.page.locator('.opening-sequence [data-skip]').waitFor({ timeout: 60000 }).catch(() => {}); await sleep(1500);
  out.opening = await record(session, 'mobile-living-opening', 12);
  await session.page.screenshot({ path: resolve(output, 'mobile-opening.png') }).catch(() => {});
  out.checkpoint = await checkpoint(session, 'mobile-opening', { gc: false });
  await session.context.close();
  out.fight = await scenarioFight('lion-before-wolf-pack', { profile: MOBILE, cpu: 4, seconds: 120, tag: '-mobile-cpu4' });
  out.fightBoss = await scenarioFight('finale-before-breach', { profile: MOBILE, cpu: 4, seconds: 120, tag: '-mobile-cpu4' });
  return out;
}

async function scenarioDpr() {
  // The same boss fight at three device pixel ratios: the runtime caps its renderer at 1.5 (legacyCombatRuntime.js:219).
  const out = {};
  for (const dpr of [1, 1.25, 1.75]) out[`dpr${dpr}`] = await scenarioFight('finale-before-breach', { profile: { ...DESKTOP, deviceScaleFactor: dpr }, seconds: 90, tag: `-dpr${dpr}` });
  return out;
}

const RUNNERS = {
  load: scenarioLoad, journey: scenarioJourney, leak: scenarioLeak, mobile: scenarioMobile, dpr: scenarioDpr,
  'fight-serpent': () => scenarioFight('lion-before-serpent-captain'),
  'fight-prophet': () => scenarioFight('scorpion-before-shadow-prophet'),
  'fight-breach': () => scenarioFight('finale-before-breach'),
  'fight-village': () => scenarioFight('lion-before-village-defense'),
  // The units' images on four battlefields (first fight, Lion boss, Scorpion boss, final breach), then abandon.
  sprites: async () => { const out = {}; for (const save of ['lion-before-wolf-pack', 'lion-before-serpent-captain', 'scorpion-before-shadow-prophet', 'finale-before-breach']) out[save] = await scenarioFight(save, { seconds: 2, tag: '-sprites' }); return out; },
  // The game's own reduced-motion setting (bloom and tilt off, OD-2026-11-05-B), for comparison only.
  'fight-breach-reduced': () => scenarioFight('finale-before-breach', { seconds: 90, tag: '-game-reduced-motion', gameMotion: 'reduce' }),
};
try {
  const probeSession = await newSession(); await probeSession.page.goto(base, { waitUntil: 'load' });
  report.gpu = await probeSession.page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c.getExtension('WEBGL_debug_renderer_info'); return c.getParameter(e.UNMASKED_RENDERER_WEBGL); });
  await probeSession.context.close(); log(`GPU: ${report.gpu}`);
  for (const name of scenarios) {
    const runner = RUNNERS[name]; if (!runner) throw new Error(`unknown scenario ${name}`);
    log(`== ${name}`); const t0 = Date.now();
    try { report.scenarios[name] = await runner(); } catch (error) { report.scenarios[name] = { error: String(error?.stack ?? error).slice(0, 800) }; log(`${name} failed: ${error}`); }
    report.scenarios[name].durationSeconds = Math.round((Date.now() - t0) / 1000);
    await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 1));
  }
} finally {
  report.durationSeconds = Math.round((Date.now() - started) / 1000);
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 1));
  await browser.close();
  log(`report: ${output}`);
}
