import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const output = resolve(root, 'docs/reports/dialogue-static-tableau-v2-review');
const imageDir = resolve(output, 'screenshots');
const port = 5199;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', `${port}`, '--strictPort'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited: ${serverLog}`);
    try { if ((await fetch(`${base}/tools/dialogue/static-tableau-v2-proof.html`)).ok) return; } catch { /* startup */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Vite did not become ready: ${serverLog}`);
}

const slug = (value) => value.replace(/[^a-z0-9_-]/gi, '-').slice(0, 85);
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

async function measure(page, meta) {
  return page.evaluate((details) => {
    const rect = (element) => {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom };
    };
    const intersect = (a, b) => {
      if (!a || !b) return 0;
      return Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x))
        * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
    };
    const alphaCache = window.__staticTableauAlphaCache ??= new Map();
    const alphaBounds = (image) => {
      if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return null;
      const src = image.currentSrc || image.src;
      if (alphaCache.has(src)) return alphaCache.get(src);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return null;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width; let top = canvas.height; let right = -1; let bottom = -1;
      for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      const bounds = right < left ? [0, 0, canvas.width, canvas.height] : [left, top, right + 1, bottom + 1];
      alphaCache.set(src, bounds);
      return bounds;
    };
    const card = document.querySelector('.dialogue__box');
    const cardRect = rect(card);
    const choicePanel = document.querySelector('.dialogue__choices');
    const choiceRects = [...document.querySelectorAll('.dialogue-choice')].map(rect);
    const actors = [...document.querySelectorAll('.narrative-cast__actor')].map((element) => {
      const image = element.querySelector('img');
      const box = rect(element);
      const alpha = alphaBounds(image);
      const scale = alpha && box ? Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight) : 0;
      const contentLeft = box ? box.x + (box.width - image.naturalWidth * scale) / 2 : 0;
      const contentTop = box ? box.bottom - image.naturalHeight * scale : 0;
      const leftAlpha = element.dataset.facing === 'LEFT' && alpha ? image.naturalWidth - alpha[2] : alpha?.[0] ?? 0;
      const rightAlpha = element.dataset.facing === 'LEFT' && alpha ? image.naturalWidth - alpha[0] : alpha?.[2] ?? 0;
      const body = alpha ? {
        x: contentLeft + leftAlpha * scale,
        y: contentTop + alpha[1] * scale,
        width: (rightAlpha - leftAlpha) * scale,
        height: (alpha[3] - alpha[1]) * scale,
      } : null;
      if (body) { body.right = body.x + body.width; body.bottom = body.y + body.height; }
      const visibleHeight = body ? Math.max(0, Math.min(innerHeight, body.bottom) - Math.max(0, body.y)) : 0;
      const faceBand = body ? { ...body, height: Math.min(body.height * .2, innerHeight * .13), bottom: body.y + Math.min(body.height * .2, innerHeight * .13) } : null;
      return {
        actorId: element.dataset.actorId ?? '',
        semanticScreenPosition: element.dataset.screenPosition ?? '',
        compositionProfile: element.dataset.compositionProfile ?? '',
        state: element.dataset.castState ?? '',
        visualScale: Number(element.style.getPropertyValue('--narrative-actor-scale')),
        anchorX: box ? box.x + box.width / 2 : 0,
        figureY: box?.y ?? null,
        figureHeight: box?.height ?? 0,
        facing: element.dataset.facing ?? '',
        opacity: Number(getComputedStyle(element).opacity),
        centerX: body ? body.x + body.width / 2 : 0,
        visibleHeadY: body?.y ?? null,
        visibleBodyHeight: visibleHeight,
        visibleBodyWidth: body?.width ?? 0,
        visibleBodyRatio: visibleHeight / innerHeight,
        cropBottomRatio: body?.height ? Math.max(0, body.bottom - innerHeight) / body.height : 0,
        imageReady: Boolean(alpha),
        body,
        faceObstruction: faceBand && cardRect ? intersect(faceBand, cardRect) / (faceBand.width * faceBand.height) : 0,
        actorCardOverlap: body && cardRect ? intersect(body, cardRect) / (body.width * visibleHeight || 1) : 0,
      };
    });
    const actorOverlaps = [];
    for (let i = 0; i < actors.length; i += 1) for (let j = i + 1; j < actors.length; j += 1) {
      const a = actors[i]; const b = actors[j];
      const area = intersect(a.body, b.body);
      actorOverlaps.push({ actors: [a.actorId, b.actorId], ratio: area / Math.max(1, Math.min(a.visibleBodyHeight * a.visibleBodyWidth, b.visibleBodyHeight * b.visibleBodyWidth)) });
    }
    const active = actors.find((actor) => actor.state === 'ACTIVE');
    const cardContent = [...(card?.querySelectorAll('.dialogue__speaker-block,.dialogue__text,.dialogue__outcomes') ?? [])]
      .filter((element) => getComputedStyle(element).display !== 'none' && !element.hidden);
    return {
      ...details,
      phaseId: document.querySelector('.narrative-scene-surface')?.getAttribute('data-visual-phase') ?? '',
      compositionProfile: document.querySelector('.narrative-scene-surface')?.getAttribute('data-composition-profile') ?? '',
      actorIds: actors.map((actor) => actor.actorId),
      viewport: { width: innerWidth, height: innerHeight },
      card: cardRect,
      cardContentOverflow: cardContent.some((element) => {
        const r = element.getBoundingClientRect();
        return r.top < cardRect.y - 1 || r.bottom > cardRect.bottom + 1;
      }),
      choicePanel: rect(choicePanel),
      choiceRects,
      actorCardFaceObstruction: actors.some((actor) => actor.faceObstruction > .01),
      activeSpeakerVisible: Boolean(active && active.visibleHeadY >= 0 && active.visibleHeadY < innerHeight && active.imageReady),
      actors,
      actorOverlaps,
      pageOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
    };
  }, meta);
}

function galleryHtml(entries, summary) {
  const groups = new Map();
  for (const entry of entries) {
    const values = groups.get(entry.dialogueId) ?? [];
    values.push(entry); groups.set(entry.dialogueId, values);
  }
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Static Tableau V2 review</title><style>
  :root{font:14px/1.4 system-ui;background:#07121d;color:#f4e8cd}body{margin:0;padding:24px}h1{margin:0 0 6px}p{color:#b9c3ca}nav{position:sticky;top:0;background:#07121de8;padding:10px 0;z-index:2}nav a{display:block;color:#e6bf78;margin:0 10px 6px 0}section{border-top:1px solid #796540;margin-top:28px;padding-top:12px}h2{color:#f2d49a}small{color:#aac0d0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px}figure{margin:0;padding:8px;background:#101e2c;border:1px solid #8c7049}img{display:block;width:100%;height:auto;max-height:560px;object-fit:contain;background:#02060a}figcaption{margin-top:7px;color:#d9dfe2}code{color:#f0ce91}
  </style></head><body><h1>Static Tableau V2 — exhaustive review</h1><p>${summary.dialogues} dialogues · ${summary.visualPhases} visual phases · ${summary.choiceStates} choices · ${summary.screenshots} desktop captures. <a href="composition-audit.json">Machine-readable geometry</a></p><nav>${[...groups.keys()].map((id) => `<a href="#${escapeHtml(id)}">${escapeHtml(id)}</a>`).join('')}</nav>${[...groups].map(([id, items]) => `<section id="${escapeHtml(id)}"><h2>${escapeHtml(id)}</h2><div class="grid">${items.map((item) => `<figure><a href="screenshots/${escapeHtml(item.screenshot)}"><img src="screenshots/${escapeHtml(item.screenshot)}" loading="lazy" alt="${escapeHtml(id)} ${escapeHtml(item.kind)}"></a><figcaption><code>${escapeHtml(item.phaseId)}</code> · ${escapeHtml(item.kind)} · ${escapeHtml(item.speakerId)} · ${escapeHtml(item.compositionProfile)} · ${item.actorIds.length} actors · ${item.viewport.width}×${item.viewport.height}<br><small>${escapeHtml(item.actorIds.join(', '))}</small></figcaption></figure>`).join('')}</div></section>`).join('')}</body></html>`;
}

let browser;
try {
  await mkdir(imageDir, { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${base}/tools/dialogue/static-tableau-v2-proof.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.tableauProof));
  const catalog = await page.evaluate(() => window.tableauProof.catalog);
  const metrics = [];
  const gallery = [];
  let imageIndex = 0;
  for (const dialogue of catalog) {
    const firstByPhase = new Map(dialogue.phases.map((phase) => [phase.phaseId, phase.stepIds[0]]));
    const handoffByPhase = new Map();
    for (const phase of dialogue.phases) {
      const firstActor = dialogue.steps.find((step) => step.stepId === phase.stepIds[0])?.actorId;
      const handoff = phase.stepIds.slice(1).map((id) => dialogue.steps.find((step) => step.stepId === id))
        .find((step) => step && step.actorId !== firstActor);
      if (handoff) handoffByPhase.set(phase.phaseId, handoff.stepId);
    }
    for (const step of dialogue.steps) {
      const phase = dialogue.phases.find((candidate) => candidate.stepIds.includes(step.stepId));
      if (!phase) throw new Error(`Unmapped phase for ${dialogue.dialogueId}:${step.stepId}`);
      await page.evaluate(({ dialogueId, stepId }) => window.tableauProof.show(dialogueId, stepId), { dialogueId: dialogue.dialogueId, stepId: step.stepId });
      await page.waitForTimeout(450);
      const info = await measure(page, { dialogueId: dialogue.dialogueId, stepId: step.stepId, family: dialogue.family, speakerId: step.actorId, state: 'speech' });
      metrics.push(info);
      const kinds = [];
      if (firstByPhase.get(phase.phaseId) === step.stepId) kinds.push('phase-opening');
      if (handoffByPhase.get(phase.phaseId) === step.stepId) kinds.push('speaker-handoff');
      if (kinds.length) {
        const screenshot = `${String(++imageIndex).padStart(3, '0')}-${slug(dialogue.dialogueId)}-${slug(phase.phaseId)}-${kinds.join('-')}.jpg`;
        await page.screenshot({ path: resolve(imageDir, screenshot), type: 'jpeg', quality: 78 });
        gallery.push({ ...info, kind: kinds.join('+'), screenshot });
      }
      if (step.choiceCount) {
        await page.evaluate(({ dialogueId, stepId }) => window.tableauProof.show(dialogueId, stepId, true), { dialogueId: dialogue.dialogueId, stepId: step.stepId });
        await page.waitForTimeout(320);
        const choiceInfo = await measure(page, { dialogueId: dialogue.dialogueId, stepId: step.stepId, family: dialogue.family, speakerId: step.actorId, state: 'choice' });
        metrics.push(choiceInfo);
        const screenshot = `${String(++imageIndex).padStart(3, '0')}-${slug(dialogue.dialogueId)}-${slug(phase.phaseId)}-choice.jpg`;
        await page.screenshot({ path: resolve(imageDir, screenshot), type: 'jpeg', quality: 78 });
        gallery.push({ ...choiceInfo, kind: 'choice', screenshot });
      }
    }
    process.stdout.write(`Reviewed ${dialogue.dialogueId} (${dialogue.phases.length} phases, ${dialogue.steps.length} steps)\n`);
  }
  const representativeProfiles = [...new Set(gallery.map((entry) => entry.compositionProfile))];
  const responsiveViewports = [
    { width: 1366, height: 768 },
    { width: 620, height: 780 },
    { width: 390, height: 844 },
  ];
  for (const profile of representativeProfiles) {
    const openings = gallery.filter((entry) => entry.compositionProfile === profile && entry.kind.includes('phase-opening'));
    const sample = openings.find((entry) => gallery.some((choice) => choice.dialogueId === entry.dialogueId
      && choice.phaseId === entry.phaseId && choice.kind === 'choice')) ?? openings[0];
    if (!sample) throw new Error(`No opening screenshot for composition profile ${profile}`);
    const choice = gallery.find((entry) => entry.dialogueId === sample.dialogueId
      && entry.phaseId === sample.phaseId && entry.kind === 'choice');
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport);
      for (const entry of [sample, choice].filter(Boolean)) {
        await page.evaluate(({ dialogueId, stepId, activateChoices }) => window.tableauProof.show(dialogueId, stepId, activateChoices), {
          dialogueId: entry.dialogueId, stepId: entry.stepId, activateChoices: entry.kind === 'choice',
        });
        await page.waitForTimeout(450);
        const info = await measure(page, {
          dialogueId: entry.dialogueId, stepId: entry.stepId, family: entry.family,
          speakerId: entry.speakerId, state: entry.kind === 'choice' ? 'choice' : 'speech',
        });
        metrics.push(info);
        const kind = `${entry.kind}-${viewport.width}x${viewport.height}`;
        const screenshot = `${String(++imageIndex).padStart(3, '0')}-${slug(entry.dialogueId)}-${slug(entry.phaseId)}-${kind}.jpg`;
        await page.screenshot({ path: resolve(imageDir, screenshot), type: 'jpeg', quality: 78 });
        gallery.push({ ...info, kind, screenshot });
      }
    }
    process.stdout.write(`Responsive profile ${profile}: ${sample.dialogueId}${choice ? ' with choices' : ''}\n`);
  }
  const summary = {
    dialogues: catalog.length,
    visualPhases: catalog.reduce((n, entry) => n + entry.phases.length, 0),
    canonicalSteps: catalog.reduce((n, entry) => n + entry.steps.length, 0),
    choiceStates: catalog.reduce((n, entry) => n + entry.steps.filter((step) => step.choiceCount).length, 0),
    auditedStates: metrics.length,
    screenshots: gallery.length,
    desktopScreenshots: gallery.filter((entry) => entry.viewport.width === 1440).length,
    representativeScreenshots: gallery.filter((entry) => entry.viewport.width !== 1440).length,
    pageErrors,
  };
  await writeFile(resolve(output, 'composition-audit.json'), `${JSON.stringify({ summary, catalog, metrics }, null, 2)}\n`);
  await writeFile(resolve(output, 'gallery.html'), galleryHtml(gallery, summary));
  await writeFile(resolve(output, 'gallery-index.json'), `${JSON.stringify(gallery.map(({ dialogueId, phaseId, stepId, kind, screenshot, actorIds, compositionProfile, viewport }) => ({ dialogueId, phaseId, stepId, kind, screenshot, actorIds, compositionProfile, viewport })), null, 2)}\n`);
  process.stdout.write(`SUMMARY ${JSON.stringify(summary)}\n`);
  if (pageErrors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
