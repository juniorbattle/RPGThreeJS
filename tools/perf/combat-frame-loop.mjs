/**
 * M1 (OD-2026-11-15-A, 2026-11-15) — the combat page mounted and removed N times by a same-origin parent page, in a
 * Chromium with no DevTools session on the page, and the renderer process read from the OS after each removal.
 *
 * Why it exists: any DevTools session that enables Network keeps the content of the page's responses in the renderer
 * (Playwright does it on every page), so a Playwright run cannot tell a game leak from DevTools memory. Here the parent
 * page drives the loop itself (create the iframe, wait for the fight to boot, hold, remove, `gc()` three times) and
 * reports each step to a local sync server; the renderer's private bytes come from `Get-Process` on the children of
 * the browser this script spawned (never a system-wide scan). The game's own window is out of the picture: the parent
 * is an empty probe page, the iframe the real built `legacy-combat.html` (standalone fight by default).
 *
 * Runs against a production preview the caller started (Claude: `preview_start`, `vite preview` on 5189) and writes its
 * probe page to `dist/__combat-frame-loop.html` (dist/ is ignored and rebuilt by `npm run build`).
 *
 * Env: LOOP_BASE (http://localhost:5189), LOOP_SRC (/legacy-combat.html; `?campaign=1` loads the page without a fight),
 * LOOP_N (8), LOOP_HOLD (8000 ms on screen), LOOP_DEVTOOLS (none | network-default | network-zero: one raw DevTools
 * session on the page that only enables Network, with Chromium's default buffers or with zero buffers), LOOP_DUMP=1
 * (memory-infra allocator totals over the browser target only; its dumps force a full GC), LOOP_OUTPUT (under tmp/),
 * LOOP_SYNC_PORT (5193), LOOP_CDP_PORT (9333). From Git Bash, set MSYS_NO_PATHCONV=1 or LOOP_SRC becomes a Windows path.
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.LOOP_BASE ?? 'http://localhost:5189';
const src = process.env.LOOP_SRC ?? '/legacy-combat.html';
if (!src.startsWith('/')) throw new Error(`LOOP_SRC must be a same-origin path, got ${src} (Git Bash: set MSYS_NO_PATHCONV=1)`);
const n = Number(process.env.LOOP_N ?? 8);
const hold = Number(process.env.LOOP_HOLD ?? 8000);
const devtools = process.env.LOOP_DEVTOOLS ?? 'none';
if (!['none', 'network-default', 'network-zero'].includes(devtools)) throw new Error(`unknown LOOP_DEVTOOLS ${devtools}`);
const dump = process.env.LOOP_DUMP === '1';
const syncPort = Number(process.env.LOOP_SYNC_PORT ?? 5193);
const cdpPort = Number(process.env.LOOP_CDP_PORT ?? 9333);
const output = resolve(process.env.LOOP_OUTPUT ?? `tmp/perf/combat-frame-loop-${devtools}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
if (existsSync(output)) throw new Error('Refusing to overwrite evidence');
mkdirSync(resolve(output, '..'), { recursive: true });

writeFileSync('dist/__combat-frame-loop.html', `<!doctype html><html><body style="margin:0;background:#000"><script>
const q = new URLSearchParams(location.search), src = q.get('src'), n = +q.get('n'), hold = +q.get('hold'), sync = q.get('sync');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mark = (m) => fetch(sync + '/mark?m=' + encodeURIComponent(m), { mode: 'no-cors' }).catch(() => {});
const settle = async () => { for (let k = 0; k < 3; k += 1) { if (window.gc) gc(); await sleep(700); } };
const fightless = src.includes('campaign=1');
(async () => {
  await sleep(1500); await settle(); await mark('start'); await sleep(2500);
  for (let i = 1; i <= n; i += 1) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0'; f.src = src; document.body.append(f);
    const t0 = Date.now(); let booted = false;
    while (!booted && Date.now() - t0 < 60000) { try { booted = fightless ? f.contentDocument?.readyState === 'complete' : f.contentWindow.__BOOTED === true; } catch {} if (!booted) await sleep(200); }
    await sleep(hold); f.remove(); await sleep(800); await settle();
    await mark('after-' + i + '|' + (booted ? 'booted' : 'not-booted') + '|' + (Date.now() - t0)); await sleep(2500);
  }
  await mark('done');
})();
</script></body></html>`);

let onMark = () => {};
const server = createServer((req, res) => { const m = new URL(req.url, 'http://x').searchParams.get('m'); res.end('ok'); if (m) onMark(m); }).listen(syncPort);
const chrome = spawn(chromium.executablePath(), [
  '--headless=new', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--mute-audio', '--js-flags=--expose-gc',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'combat-frame-loop-'))}`, '--no-first-run', '--no-default-browser-check',
  // The browser endpoint stays open so the run can be inspected and closed cleanly; nothing attaches to the page unless
  // LOOP_DEVTOOLS asks, and an open endpoint with no page session enables no inspector agent.
  '--window-size=1463,800', '--force-device-scale-factor=1.75', `--remote-debugging-port=${cdpPort}`,
  // The start URL is opened through the browser endpoint below: headless Chromium sometimes left it unloaded (2026-11-15).
  'about:blank',
], { stdio: 'ignore' });
const loopUrl = `${base}/__combat-frame-loop.html?src=${encodeURIComponent(src)}&n=${n}&hold=${hold}&sync=${encodeURIComponent(`http://localhost:${syncPort}`)}`;

/** Raw DevTools client on the browser endpoint: nothing is enabled on the page unless asked. */
async function rawCdp() {
  let version = null;
  for (let i = 0; i < 40 && !version; i += 1) { try { version = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json(); } catch { await new Promise((r) => setTimeout(r, 250)); } }
  if (!version) throw new Error('DevTools endpoint did not answer');
  const ws = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } for (const l of listeners) l(d); };
  const send = (method, params = {}, sessionId) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  return { ws, send, listen: (l) => listeners.push(l) };
}

const rendererMemory = () => {
  const raw = execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ParentProcessId=${chrome.pid}' | Where-Object { $_.CommandLine -like '*--type=renderer*' } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { [pscustomobject]@{ priv = $p.PrivateMemorySize64; ws = $p.WorkingSet64 } } } | ConvertTo-Json"`).toString();
  const top = (raw.trim() ? [].concat(JSON.parse(raw)) : []).sort((a, b) => b.priv - a.priv)[0];
  return { privateMb: Math.round((top?.priv ?? 0) / 2 ** 20), workingSetMb: Math.round((top?.ws ?? 0) / 2 ** 20) };
};

const report = { schemaVersion: 1, recordedAt: new Date().toISOString(), base, src, n, hold, devtools, dump, commit: execSync('git rev-parse HEAD').toString().trim(), marks: [] };
let cdp = null;
try {
  cdp = await rawCdp();
  if (devtools === 'none') {
    // A new page from the browser target: no session is attached to it.
    const created = await cdp.send('Target.createTarget', { url: loopUrl }); if (created.error) throw new Error(`createTarget: ${created.error.message}`);
  } else {
    // One session on a blank page enables Network only, then sends it to the loop page.
    const { result: created } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { result: attached } = await cdp.send('Target.attachToTarget', { targetId: created.targetId, flatten: true });
    const enabled = await cdp.send('Network.enable', devtools === 'network-zero' ? { maxTotalBufferSize: 0, maxResourceBufferSize: 0 } : {}, attached.sessionId);
    if (enabled.error) throw new Error(`Network.enable: ${enabled.error.message}`);
    const navigated = await cdp.send('Page.navigate', { url: loopUrl }, attached.sessionId); if (navigated.error) throw new Error(`navigate: ${navigated.error.message}`);
  }
  const kept = []; let traced = null; const dumps = [];
  if (dump) {
    cdp.listen((d) => { if (d.method === 'Tracing.dataCollected') for (const e of d.params.value) if ((e.ph === 'M' && e.name === 'process_name') || e.ph === 'v') kept.push(e); if (d.method === 'Tracing.tracingComplete') traced?.(); });
    await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['disabled-by-default-memory-infra'], excludedCategories: ['*'], recordMode: 'recordAsMuchAsPossible', memoryDumpConfig: { triggers: [] } }, transferMode: 'ReportEvents' });
  }
  await new Promise((done, fail) => {
    const timer = setTimeout(() => fail(new Error('loop timeout')), (n * (hold + 75000)) + 60000);
    // A page that never reports (seen twice on 2026-11-15, cause not found) fails fast with what the browser shows.
    const watchdog = setTimeout(async () => { let pages = null; try { pages = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).map((t) => `${t.type} ${t.url}`); } catch { /* */ } clearTimeout(timer); fail(new Error(`no start mark after 45 s; targets ${JSON.stringify(pages)}`)); }, 45000);
    onMark = (m) => {
      clearTimeout(watchdog);
      if (m === 'done') { clearTimeout(timer); done(); return; }
      const row = { mark: m, ...rendererMemory() }; report.marks.push(row);
      if (dump) { dumps.push(m); void cdp.send('Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'detailed' }); }
      console.log(`${m.padEnd(26)} renderer private ${row.privateMb} MB, working set ${row.workingSetMb} MB`);
    };
  });
  if (dump) {
    const complete = new Promise((r) => { traced = r; }); await cdp.send('Tracing.end'); await complete;
    const names = new Map(); for (const e of kept) if (e.ph === 'M') names.set(e.pid, e.args.name);
    const ids = [...new Set(kept.filter((e) => e.ph === 'v').map((e) => e.id))];
    report.allocators = Object.fromEntries(dumps.map((mark, i) => {
      const rows = {};
      for (const e of kept) {
        if (e.ph !== 'v' || e.id !== ids[i] || !/Renderer/i.test(names.get(e.pid) ?? '')) continue;
        for (const [k, v] of Object.entries(e.args?.dumps?.allocators ?? {})) {
          if (k.split('/').length > 3 || !(k.split('/').length <= 1 || k.startsWith('partition_alloc/partitions/'))) continue;
          rows[k] = Math.round(((rows[k] ?? 0) + parseInt(v.attrs?.size?.value ?? '0', 16) / 2 ** 20) * 10) / 10;
        }
      }
      return [mark, rows];
    }));
  }
  const after = report.marks.filter((r) => r.mark.startsWith('after-'));
  if (after.length >= 3) {
    report.growthPerFightAfterFirstMb = +((after.at(-1).privateMb - after[0].privateMb) / (after.length - 1)).toFixed(1);
    const tail = after.slice(Math.floor(after.length / 2));
    report.growthPerFightSecondHalfMb = +((tail.at(-1).privateMb - tail[0].privateMb) / Math.max(1, tail.length - 1)).toFixed(1);
    console.log(`growth per fight after the first ${report.growthPerFightAfterFirstMb} MB; over the second half ${report.growthPerFightSecondHalfMb} MB`);
  }
} finally {
  writeFileSync(output, JSON.stringify(report, null, 1));
  console.log(`report: ${output}`);
  // The spawned browser is closed through its own DevTools command when one is open, else this script's child is ended.
  if (cdp) { try { await cdp.send('Browser.close'); } catch { /* */ } cdp.ws.close(); } else chrome.kill();
  server.close();
}
