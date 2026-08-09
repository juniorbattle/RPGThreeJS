import type { MegaPackHeldReviewEntry } from './MegaPackHeldReview';

type SourceTeam = 'player' | 'foe';

interface MegaPackHeldReviewWorkbenchOptions {
  enabled: boolean;
  entries: readonly MegaPackHeldReviewEntry[];
  play: (entry: MegaPackHeldReviewEntry, sourceTeam: SourceTeam) => Promise<void>;
}

const STYLE_ID = 'r2ca-held-review-style';
const ROOT_ID = 'r2ca-held-review';

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function routeLabel(entry: MegaPackHeldReviewEntry) {
  return entry.route === 'stage'
    ? 'Stage reel - forest_route_stage.webp'
    : 'Tactique reelle - forest_route.webp';
}

function addWorkbenchStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{position:fixed;z-index:10040;right:18px;bottom:18px;width:min(390px,calc(100vw - 36px));background:rgba(5,14,30,.94);border:1px solid #5488a6;border-radius:12px;box-shadow:0 15px 45px rgba(0,0,0,.52);padding:14px;color:#d7e7ee;font:12px/1.35 system-ui,sans-serif;backdrop-filter:blur(9px)}
    #${ROOT_ID} h2{margin:0;color:#9fe5ff;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
    #${ROOT_ID} .r2ca-subtitle{display:block;margin:4px 0 12px;color:#8fa5b2;font-size:11px}
    #${ROOT_ID} label{display:grid;gap:4px;margin:8px 0;color:#b6d3e0;font-size:11px;font-weight:700}
    #${ROOT_ID} select,#${ROOT_ID} button{border:1px solid #395d77;border-radius:7px;background:#0c2134;color:#eff8ff;font:inherit;padding:8px}
    #${ROOT_ID} select{width:100%}
    #${ROOT_ID} button{cursor:pointer;font-weight:800;letter-spacing:.02em}
    #${ROOT_ID} button:hover:not(:disabled){border-color:#84dfff;background:#123550}
    #${ROOT_ID} button:disabled{cursor:wait;opacity:.55}
    #${ROOT_ID} .r2ca-meta{display:grid;gap:5px;margin:10px 0;padding:9px;border-left:2px solid #66cfea;background:rgba(27,57,76,.42);color:#b9d9e7}
    #${ROOT_ID} .r2ca-meta b{color:#f1c76c}
    #${ROOT_ID} .r2ca-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    #${ROOT_ID} .r2ca-play{grid-column:1/-1;border-color:#52b9d2;background:#0f3b52}
    #${ROOT_ID} .r2ca-status{display:block;min-height:16px;margin-top:9px;color:#a7c5d3}
    #${ROOT_ID} .r2ca-note{display:block;margin-top:9px;color:#728c9b;font-size:10px}
  `;
  document.head.appendChild(style);
}

/**
 * Local-only R2C-A review interface. It intentionally accepts a held source
 * separately from a real action route so visual reviewers can test a
 * candidate in every relevant real presentation context before any promotion.
 */
export function installMegaPackHeldReviewWorkbench(options: MegaPackHeldReviewWorkbenchOptions) {
  if (!options.enabled || !options.entries.length || typeof document === 'undefined' || document.getElementById(ROOT_ID)) return () => {};
  addWorkbenchStyle();
  const firstEntry = options.entries[0]!;

  const root = createElement('aside');
  root.id = ROOT_ID;
  root.setAttribute('aria-label', 'R2C-A held candidate visual review');
  const title = createElement('h2');
  title.textContent = 'R2C-A source review';
  const subtitle = createElement('span', 'r2ca-subtitle');
  subtitle.textContent = 'Local only - held sources never enter the production registry.';
  const actionLabel = createElement('label');
  actionLabel.textContent = 'Action route';
  const actionSelect = createElement('select');
  const sourceLabel = createElement('label');
  sourceLabel.textContent = 'Held candidate source';
  const sourceSelect = createElement('select');
  const sideLabel = createElement('label');
  sideLabel.textContent = 'Direction';
  const sideSelect = createElement('select');
  const meta = createElement('div', 'r2ca-meta');
  const controls = createElement('div', 'r2ca-controls');
  const playButton = createElement('button', 'r2ca-play');
  playButton.type = 'button';
  playButton.textContent = 'Lire dans la route reelle';
  const replayButton = createElement('button');
  replayButton.type = 'button';
  replayButton.textContent = 'Rejouer';
  const status = createElement('span', 'r2ca-status');
  const note = createElement('span', 'r2ca-note');
  note.textContent = 'Le lecteur ne lance pas executeAction : il ne change ni degats, ni PA, ni IA, ni routes de run.';

  for (const entry of options.entries) {
    const option = document.createElement('option');
    option.value = entry.actionId;
    option.textContent = `${entry.displayName} (${entry.actionId})`;
    actionSelect.appendChild(option);
  }
  for (const entry of options.entries) {
    const option = document.createElement('option');
    option.value = entry.sourceId;
    option.textContent = `${entry.sourceId} - ${entry.sourceFilename}`;
    sourceSelect.appendChild(option);
  }
  for (const value of ['player', 'foe'] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value === 'player' ? 'Allie vers ennemi' : 'Ennemi vers allie';
    sideSelect.appendChild(option);
  }

  let selectedAction: MegaPackHeldReviewEntry = firstEntry;
  let selectedSource: MegaPackHeldReviewEntry = firstEntry;
  let running = false;

  const selectedEntry = (): MegaPackHeldReviewEntry => ({
    ...selectedAction,
    sourceId: selectedSource.sourceId,
    sourceFilename: selectedSource.sourceFilename,
    source: selectedSource.source,
  });
  const render = () => {
    const entry = selectedEntry();
    meta.replaceChildren();
    const route = createElement('span');
    route.innerHTML = `<b>Route :</b> ${routeLabel(selectedAction)} (${selectedAction.routeReason})`;
    const native = createElement('span');
    native.innerHTML = `<b>Source :</b> ${entry.source.sheetWidthPx}x${entry.source.sheetHeightPx} - ${entry.source.cols}x${entry.source.rows} - ${entry.source.frameCount} frames`;
    const verdict = createElement('span');
    verdict.innerHTML = `<b>Verdict provisoire :</b> ${selectedAction.provisionalVerdict}`;
    meta.append(route, native, verdict);
    status.textContent = running ? 'Review playback in progress...' : selectedAction.rationale;
  };
  const syncSourceToAction = () => {
    sourceSelect.value = selectedAction.sourceId;
    selectedSource = options.entries.find((entry) => entry.sourceId === sourceSelect.value) ?? selectedAction;
  };
  actionSelect.addEventListener('change', () => {
    selectedAction = options.entries.find((entry) => entry.actionId === actionSelect.value) ?? firstEntry;
    syncSourceToAction();
    render();
  });
  sourceSelect.addEventListener('change', () => {
    selectedSource = options.entries.find((entry) => entry.sourceId === sourceSelect.value) ?? selectedAction;
    render();
  });
  const play = async () => {
    if (running) return;
    running = true;
    playButton.disabled = true;
    replayButton.disabled = true;
    render();
    try {
      await options.play(selectedEntry(), sideSelect.value as SourceTeam);
      status.textContent = 'Lecture terminee. Consignez le verdict visuel dans le rapport R2C-A.';
    } catch (error) {
      console.warn('[R2C-A] Held candidate review failed safely.', error);
      status.textContent = 'Lecture interrompue sans impact sur le runtime de production.';
    } finally {
      running = false;
      playButton.disabled = false;
      replayButton.disabled = false;
    }
  };
  playButton.addEventListener('click', play);
  replayButton.addEventListener('click', play);
  controls.append(playButton, replayButton);
  actionLabel.appendChild(actionSelect);
  sourceLabel.appendChild(sourceSelect);
  sideLabel.appendChild(sideSelect);
  root.append(title, subtitle, actionLabel, sourceLabel, sideLabel, meta, controls, status, note);
  document.body.appendChild(root);
  render();

  return () => {
    playButton.removeEventListener('click', play);
    replayButton.removeEventListener('click', play);
    root.remove();
  };
}
