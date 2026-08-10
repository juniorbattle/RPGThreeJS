import type { MegaPackHeldReviewEntry, AlternativeCandidate, HeldCandidateVerdict, CandidateAvailability } from './MegaPackHeldReview';
import { getAlternativesFor, getNeedsAltEntries, isDirectionalAction, getCandidateAvailability } from './MegaPackHeldReview';

type SourceTeam = 'player' | 'foe';

interface QaDecision {
  actionKey: string;
  candidateId: string;
  verdict: HeldCandidateVerdict;
  notes: string;
  direction: string;
  timestamp?: number;
}

export interface FinalSelection {
  candidateId: string;
  verdict: 'LOCK' | 'PRESENTATION_TUNE_ONLY';
}

export interface ReviewState {
  decisions: Record<string, QaDecision>;
  finalSelections: Record<string, FinalSelection>;
  selectedCandidateByAction: Record<string, string>;
  directionMap: Record<string, string>;
  notesByCandidate: Record<string, string>;
}

interface PlaybackSnapshot {
  actionKey: string;
  candidateId: string;
  direction: SourceTeam;
  entry: MegaPackHeldReviewEntry;
}

interface MegaPackHeldReviewWorkbenchOptions {
  enabled: boolean;
  entries: readonly MegaPackHeldReviewEntry[];
  play: (entry: MegaPackHeldReviewEntry, sourceTeam: SourceTeam) => Promise<void>;
}

const STYLE_ID = 'r2ca-held-review-style';
const ROOT_ID = 'r2ca-held-review';
const STORAGE_KEY = 'r2ca-qa-decisions';

/** V2 key format: `${actionKey}::${candidateId}`. V1 keys are bare actionIds. */
export function decisionKey(actionKey: string, candidateId: string): string {
  return `${actionKey}::${candidateId}`;
}

/** Parse raw localStorage object into V2 decision map (V1 backward compat). */
export function parseRawDecisions(raw: Record<string, QaDecision>): Record<string, QaDecision> {
  const result: Record<string, QaDecision> = {};
  for (const [key, value] of Object.entries(raw)) {
    const v = value as QaDecision;
    if (key.includes('::')) {
      result[key] = v;
    } else if (v && v.candidateId) {
      result[decisionKey(key, v.candidateId)] = v;
    }
  }
  return result;
}

/** Build V3 export payload from ReviewState. */
export function buildExportPayload(state: ReviewState): {
  version: number;
  decisions: QaDecision[];
  finalSelections: Record<string, FinalSelection>;
} {
  const allDecisions = Object.values(state.decisions).map((d) => {
    const dKey = decisionKey(d.actionKey, d.candidateId);
    return { ...d, notes: state.notesByCandidate[dKey] ?? d.notes ?? '' };
  });
  return { version: 3, decisions: allDecisions, finalSelections: state.finalSelections };
}

// ----------------------------------------------------------- pure state functions

export function createReviewState(): ReviewState {
  return {
    decisions: {},
    finalSelections: {},
    selectedCandidateByAction: {},
    directionMap: {},
    notesByCandidate: {},
  };
}

export function loadReviewStateFromRaw(raw: unknown): ReviewState {
  if (!raw || typeof raw !== 'object') return createReviewState();
  const parsed = raw as Record<string, unknown>;

  if (parsed.decisions && typeof parsed.decisions === 'object') {
    const decisions = parseRawDecisions(parsed.decisions as Record<string, QaDecision>);
    const finalSelections = (parsed.finalSelections ?? {}) as Record<string, FinalSelection>;
    const selectedCandidateByAction = (parsed.selectedCandidateByAction ?? {}) as Record<string, string>;
    const directionMap = (parsed.directionMap ?? {}) as Record<string, string>;
    const notesByCandidate = (parsed.notesByCandidate ?? {}) as Record<string, string>;
    return { decisions, finalSelections, selectedCandidateByAction, directionMap, notesByCandidate };
  }

  const decisions = parseRawDecisions(parsed as Record<string, QaDecision>);
  const finalSelections: Record<string, FinalSelection> = {};
  const selectedCandidateByAction: Record<string, string> = {};
  const notesByCandidate: Record<string, string> = {};
  for (const [key, d] of Object.entries(decisions)) {
    if (d.verdict === 'LOCK' || d.verdict === 'PRESENTATION_TUNE_ONLY') {
      finalSelections[d.actionKey] = { candidateId: d.candidateId, verdict: d.verdict };
      selectedCandidateByAction[d.actionKey] = d.candidateId;
    }
    if (d.notes) notesByCandidate[key] = d.notes;
  }
  return { decisions, finalSelections, selectedCandidateByAction, directionMap: {}, notesByCandidate };
}

export function resolveSelectedCandidate(actionKey: string, defaultCandidateId: string, state: ReviewState): string {
  return state.selectedCandidateByAction[actionKey]
    ?? state.finalSelections[actionKey]?.candidateId
    ?? defaultCandidateId;
}

export function resolveNextUnresolvedAction(
  currentActionKey: string,
  state: ReviewState,
  targetActions: readonly { actionId: string }[],
): { actionId: string } | null {
  const unresolved = targetActions.filter((a) => !state.finalSelections[a.actionId]);
  if (unresolved.length === 0) return null;

  const currentIdx = targetActions.findIndex((a) => a.actionId === currentActionKey);
  for (let i = 1; i <= targetActions.length; i++) {
    const idx = (currentIdx + i) % targetActions.length;
    const action = targetActions[idx];
    if (action && !state.finalSelections[action.actionId]) {
      return action;
    }
  }
  return null;
}

export function getActionStatus(actionKey: string, state: ReviewState): 'RESOLVED' | 'UNRESOLVED' {
  return state.finalSelections[actionKey] ? 'RESOLVED' : 'UNRESOLVED';
}

export function getCandidateVerdict(actionKey: string, candidateId: string, state: ReviewState): HeldCandidateVerdict | 'NOT_REVIEWED' {
  const dKey = decisionKey(actionKey, candidateId);
  return state.decisions[dKey]?.verdict ?? 'NOT_REVIEWED';
}

export function getProgress(state: ReviewState, targetActions: readonly { actionId: string }[]): number {
  return targetActions.filter((a) => state.finalSelections[a.actionId]).length;
}

export function applyVerdict(
  actionKey: string,
  candidateId: string,
  verdict: HeldCandidateVerdict,
  notes: string,
  direction: string,
  state: ReviewState,
): ReviewState {
  const dKey = decisionKey(actionKey, candidateId);
  const newDecisions: Record<string, QaDecision> = {
    ...state.decisions,
    [dKey]: { actionKey, candidateId, verdict, notes, direction, timestamp: Date.now() },
  };
  const newNotes = { ...state.notesByCandidate, [dKey]: notes };
  const newSelectedCandidate = { ...state.selectedCandidateByAction, [actionKey]: candidateId };
  const newDirectionMap = { ...state.directionMap, [actionKey]: direction };

  let newFinalSelections = state.finalSelections;
  if (verdict === 'LOCK' || verdict === 'PRESENTATION_TUNE_ONLY') {
    newFinalSelections = { ...state.finalSelections, [actionKey]: { candidateId, verdict } };
  }

  return {
    decisions: newDecisions,
    finalSelections: newFinalSelections,
    selectedCandidateByAction: newSelectedCandidate,
    directionMap: newDirectionMap,
    notesByCandidate: newNotes,
  };
}

export function applyNotes(actionKey: string, candidateId: string, notes: string, state: ReviewState): ReviewState {
  const dKey = decisionKey(actionKey, candidateId);
  return {
    ...state,
    notesByCandidate: { ...state.notesByCandidate, [dKey]: notes },
  };
}

export function applySelectedCandidate(actionKey: string, candidateId: string, state: ReviewState): ReviewState {
  return {
    ...state,
    selectedCandidateByAction: { ...state.selectedCandidateByAction, [actionKey]: candidateId },
  };
}

export function applyDirection(actionKey: string, direction: string, state: ReviewState): ReviewState {
  return {
    ...state,
    directionMap: { ...state.directionMap, [actionKey]: direction },
  };
}

const STATE_STORAGE_KEY = 'r2ca-qa-state';

function loadState(): ReviewState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (raw) return loadReviewStateFromRaw(JSON.parse(raw));
  } catch { /* ignore */ }
  try {
    const oldRaw = localStorage.getItem(STORAGE_KEY);
    if (oldRaw) return loadReviewStateFromRaw(JSON.parse(oldRaw));
  } catch { /* ignore */ }
  return createReviewState();
}

function saveState(state: ReviewState): void {
  try { localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function exportState(state: ReviewState): void {
  const payload = buildExportPayload(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'r2ca-qa-decisions.json';
  a.click();
  URL.revokeObjectURL(url);
}

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
    #${ROOT_ID}{position:fixed;z-index:10040;right:18px;bottom:18px;width:min(420px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow-y:auto;background:rgba(5,14,30,.94);border:1px solid #5488a6;border-radius:12px;box-shadow:0 15px 45px rgba(0,0,0,.52);padding:14px;color:#d7e7ee;font:12px/1.35 system-ui,sans-serif;backdrop-filter:blur(9px)}
    #${ROOT_ID} h2{margin:0;color:#9fe5ff;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
    #${ROOT_ID} .r2ca-subtitle{display:block;margin:4px 0 12px;color:#8fa5b2;font-size:11px}
    #${ROOT_ID} label{display:grid;gap:4px;margin:8px 0;color:#b6d3e0;font-size:11px;font-weight:700}
    #${ROOT_ID} .r2ca-help{color:#7a96a6;font-size:10px;font-weight:400}
    #${ROOT_ID} select,#${ROOT_ID} button,#${ROOT_ID} textarea,#${ROOT_ID} input{border:1px solid #395d77;border-radius:7px;background:#0c2134;color:#eff8ff;font:inherit;padding:8px}
    #${ROOT_ID} select{width:100%}
    #${ROOT_ID} textarea{width:100%;resize:vertical;min-height:44px}
    #${ROOT_ID} button{cursor:pointer;font-weight:800;letter-spacing:.02em}
    #${ROOT_ID} button:hover:not(:disabled){border-color:#84dfff;background:#123550}
    #${ROOT_ID} button:disabled{cursor:wait;opacity:.55}
    #${ROOT_ID} .r2ca-meta{display:grid;gap:5px;margin:10px 0;padding:9px;border-left:2px solid #66cfea;background:rgba(27,57,76,.42);color:#b9d9e7}
    #${ROOT_ID} .r2ca-meta b{color:#f1c76c}
    #${ROOT_ID} .r2ca-route{display:grid;gap:3px;margin:8px 0;padding:8px;border:1px solid #395d77;border-radius:6px;background:rgba(12,33,52,.6);color:#a7c5d3}
    #${ROOT_ID} .r2ca-route b{color:#9fe5ff}
    #${ROOT_ID} .r2ca-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    #${ROOT_ID} .r2ca-play{grid-column:1/-1;border-color:#52b9d2;background:#0f3b52}
    #${ROOT_ID} .r2ca-decisions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 0}
    #${ROOT_ID} .r2ca-btn-lock{border-color:#3a8c4a;background:#0d2f1a}
    #${ROOT_ID} .r2ca-btn-tune{border-color:#b8941e;background:#2a2410}
    #${ROOT_ID} .r2ca-btn-reject{border-color:#a6423a;background:#2a1010}
    #${ROOT_ID} .r2ca-nav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
    #${ROOT_ID} .r2ca-status{display:block;min-height:16px;margin-top:9px;color:#a7c5d3}
    #${ROOT_ID} .r2ca-note{display:block;margin-top:9px;color:#728c9b;font-size:10px}
    #${ROOT_ID} .r2ca-progress{display:block;margin:6px 0;color:#8fa5b2;font-size:11px}
    #${ROOT_ID}.r2ca-playing{background:rgba(5,14,30,.22);backdrop-filter:blur(3px);border-color:rgba(84,136,166,.4)}
    #${ROOT_ID}.r2ca-playing .r2ca-help,#${ROOT_ID}.r2ca-playing .r2ca-note,#${ROOT_ID}.r2ca-playing .r2ca-decisions,#${ROOT_ID}.r2ca-playing .r2ca-nav,#${ROOT_ID}.r2ca-playing label:not(.r2ca-playback-info){display:none}
    #${ROOT_ID} .r2ca-playback-info{display:none;grid-gap:3px;padding:8px;border:1px solid #52b9d2;border-radius:6px;background:rgba(15,59,82,.6);color:#9fe5ff;font-size:11px}
    #${ROOT_ID}.r2ca-playing .r2ca-playback-info{display:grid}
    #${ROOT_ID} .r2ca-avail-ready{color:#5fd17a}
    #${ROOT_ID} .r2ca-avail-unavailable{color:#ff6a6a}
    #${ROOT_ID} .r2ca-error{display:block;padding:8px;border:1px solid #a6423a;border-radius:6px;background:rgba(42,16,16,.7);color:#ff8a7a;font-size:11px;margin-top:8px}
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
  const needsAltEntries = getNeedsAltEntries();
  let state = loadState();

  // C2: Last playback snapshot for replay
  let lastSnapshot: PlaybackSnapshot | null = null;

  const root = createElement('aside');
  root.id = ROOT_ID;
  root.setAttribute('aria-label', 'R2C-A held candidate visual review');
  const title = createElement('h2');
  title.textContent = 'R2C-A source review';
  const subtitle = createElement('span', 'r2ca-subtitle');
  subtitle.textContent = 'Local only — held sources never enter the production registry.';

  const actionLabel = createElement('label');
  actionLabel.textContent = 'ACTION TO REVIEW';
  const actionHelp = createElement('span', 'r2ca-help');
  actionHelp.textContent = 'Choose the combat action whose VFX source you want to evaluate.';
  actionLabel.appendChild(actionHelp);
  const actionSelect = createElement('select');
  actionLabel.appendChild(actionSelect);

  const sourceLabel = createElement('label');
  sourceLabel.textContent = 'VFX SOURCE CANDIDATE';
  const sourceHelp = createElement('span', 'r2ca-help');
  sourceHelp.textContent = 'Choose the CartoonCoffee spritesheet to test for this action.';
  sourceLabel.appendChild(sourceHelp);
  const sourceSelect = createElement('select');
  sourceLabel.appendChild(sourceSelect);

  const routeBox = createElement('div', 'r2ca-route');

  const sideLabel = createElement('label');
  sideLabel.textContent = 'DIRECTION';
  const sideHelp = createElement('span', 'r2ca-help');
  sideHelp.textContent = 'ALLY → ENEMY tests LEFT → RIGHT. ENEMY → ALLY tests RIGHT → LEFT.';
  sideLabel.appendChild(sideHelp);
  const sideSelect = createElement('select');
  sideLabel.appendChild(sideSelect);

  const meta = createElement('div', 'r2ca-meta');

  const decisionLabel = createElement('label');
  decisionLabel.textContent = 'SOURCE DECISION';
  const decisionBox = createElement('div', 'r2ca-decisions');
  const lockBtn = createElement('button', 'r2ca-btn-lock');
  lockBtn.type = 'button'; lockBtn.textContent = 'LOCK SOURCE';
  const tuneBtn = createElement('button', 'r2ca-btn-tune');
  tuneBtn.type = 'button'; tuneBtn.textContent = 'TUNE PRESENTATION';
  const rejectBtn = createElement('button', 'r2ca-btn-reject');
  rejectBtn.type = 'button'; rejectBtn.textContent = 'REJECT SOURCE';
  decisionBox.append(lockBtn, tuneBtn, rejectBtn);
  decisionLabel.appendChild(decisionBox);

  const notesLabel = createElement('label');
  notesLabel.textContent = 'VISUAL NOTES';
  const notesArea = createElement('textarea');
  notesArea.placeholder = 'e.g. "too explosive for basic attack", "good slash but needs scale -20%"';
  notesLabel.appendChild(notesArea);

  const navBox = createElement('div', 'r2ca-nav');
  const nextBtn = createElement('button');
  nextBtn.type = 'button'; nextBtn.textContent = 'NEXT ACTION →';
  const exportBtn = createElement('button');
  exportBtn.type = 'button'; exportBtn.textContent = 'EXPORT QA DECISIONS';
  navBox.append(nextBtn, exportBtn);

  const controls = createElement('div', 'r2ca-controls');
  const playButton = createElement('button', 'r2ca-play');
  playButton.type = 'button';
  playButton.textContent = '▶ PLAY IN REAL ROUTE';
  const replayButton = createElement('button');
  replayButton.type = 'button';
  replayButton.textContent = '↻ REPLAY';
  controls.append(playButton, replayButton);

  // C6: Active playback parameters display
  const playbackInfo = createElement('label', 'r2ca-playback-info');
  playbackInfo.textContent = 'PLAYBACK PARAMETERS';

  const progress = createElement('span', 'r2ca-progress');
  const actionStatusEl = createElement('span', 'r2ca-status');
  const candidateStatusEl = createElement('span', 'r2ca-status');
  const status = createElement('span', 'r2ca-status');
  const errorBox = createElement('span', 'r2ca-error');
  errorBox.style.display = 'none';
  const note = createElement('span', 'r2ca-note');
  note.textContent = 'The player does not call executeAction: no damage, AP, AI, or run routing changes.';

  for (const entry of options.entries) {
    const option = document.createElement('option');
    option.value = entry.actionId;
    const tag = entry.provisionalVerdict === 'NEEDS_ALT' ? ' [NEEDS_ALT]' : '';
    option.textContent = `${entry.displayName}${tag}`;
    actionSelect.appendChild(option);
  }
  for (const value of ['player', 'foe'] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value === 'player' ? 'ALLY → ENEMY' : 'ENEMY → ALLY';
    sideSelect.appendChild(option);
  }

  let selectedAction: MegaPackHeldReviewEntry = firstEntry;
  let selectedCandidateId: string = firstEntry.sourceId;
  let selectedSource: MegaPackHeldReviewEntry['source'] = firstEntry.source;
  let selectedFilename: string = firstEntry.sourceFilename;
  let running = false;

  const resolveCandidateSource = (candidateId: string): { source: MegaPackHeldReviewEntry['source']; filename: string } => {
    if (candidateId === selectedAction.sourceId) {
      return { source: selectedAction.source, filename: selectedAction.sourceFilename };
    }
    const alts = getAlternativesFor(selectedAction.actionId);
    const alt = alts.find((a) => a.candidateId === candidateId);
    if (alt) return { source: alt.source, filename: alt.sourceFilename };
    return { source: selectedAction.source, filename: selectedAction.sourceFilename };
  };

  const buildSourceOptions = () => {
    sourceSelect.replaceChildren();
    const curOpt = document.createElement('option');
    curOpt.value = selectedAction.sourceId;
    const curAvail = getCandidateAvailability(selectedAction.sourceId);
    curOpt.textContent = `CURRENT — ${selectedAction.sourceId}${curAvail !== 'READY' ? ' (UNAVAILABLE)' : ''}`;
    sourceSelect.appendChild(curOpt);
    const alts = getAlternativesFor(selectedAction.actionId);
    for (const alt of alts) {
      const opt = document.createElement('option');
      opt.value = alt.candidateId;
      const availTag = alt.availability !== 'READY' ? ' (UNAVAILABLE)' : '';
      opt.textContent = `${alt.label}${availTag}`;
      if (alt.availability !== 'READY') opt.disabled = true;
      sourceSelect.appendChild(opt);
    }
    // R2C-A.1.2: Restore remembered candidate, not always CURRENT
    selectedCandidateId = resolveSelectedCandidate(selectedAction.actionId, selectedAction.sourceId, state);
    const resolved = resolveCandidateSource(selectedCandidateId);
    selectedSource = resolved.source;
    selectedFilename = resolved.filename;
    sourceSelect.value = selectedCandidateId;
  };

  const selectedEntry = (): MegaPackHeldReviewEntry => ({
    ...selectedAction,
    sourceId: selectedCandidateId,
    sourceFilename: selectedFilename,
    source: selectedSource,
  });

  const render = () => {
    const entry = selectedEntry();
    routeBox.replaceChildren();
    const routeTitle = createElement('span');
    routeTitle.innerHTML = `<b>PRESENTATION ROUTE</b>: ${entry.route === 'stage' ? 'Combat Stage' : 'Tactical'}`;
    const routeReason = createElement('span');
    routeReason.innerHTML = `Reason: ${entry.routeReason}`;
    const routeBg = createElement('span');
    routeBg.innerHTML = `Background: ${entry.route === 'stage' ? 'forest_route_stage.webp' : 'forest_route.webp'}`;
    routeBox.append(routeTitle, routeReason, routeBg);

    meta.replaceChildren();
    const avail = getCandidateAvailability(selectedCandidateId);
    const availClass = avail === 'READY' ? 'r2ca-avail-ready' : 'r2ca-avail-unavailable';
    const native = createElement('span');
    native.innerHTML = `<b>Candidate ID:</b> ${selectedCandidateId}<br><b>Filename:</b> ${selectedFilename}<br><b>Native:</b> ${entry.source.sheetWidthPx}×${entry.source.sheetHeightPx} — ${entry.source.cols}×${entry.source.rows} — ${entry.source.frameCount} frames<br><b>Availability:</b> <span class="${availClass}">${avail}</span>`;
    const verdict = createElement('span');
    verdict.innerHTML = `<b>Provisional:</b> ${selectedAction.provisionalVerdict}`;
    meta.append(native, verdict);

    // R2C-A.1.2: Progress based on finalSelections, not any decision
    const resolved = getProgress(state, needsAltEntries);
    progress.textContent = `${resolved} / ${needsAltEntries.length} SOURCE-RESOLVED`;

    // C3/C4: Restore per-action direction from state
    const directional = isDirectionalAction(selectedAction);
    if (directional) {
      sideSelect.disabled = false;
      const savedDir = state.directionMap[selectedAction.actionId];
      sideSelect.value = savedDir ?? 'player';
      sideHelp.textContent = 'ALLY → ENEMY tests LEFT → RIGHT. ENEMY → ALLY tests RIGHT → LEFT.';
    } else {
      sideSelect.disabled = true;
      sideHelp.textContent = 'Non-directional action — direction disabled.';
    }

    // R2C-A.1.2: Restore notes from notesByCandidate (independent of verdict)
    const dKey = decisionKey(selectedAction.actionId, selectedCandidateId);
    notesArea.value = state.notesByCandidate[dKey] ?? state.decisions[dKey]?.notes ?? '';

    // R2C-A.1.2: Action status display
    const actionStatus = getActionStatus(selectedAction.actionId, state);
    if (actionStatus === 'RESOLVED') {
      const fin = state.finalSelections[selectedAction.actionId]!;
      actionStatusEl.innerHTML = `<b>ACTION STATUS:</b> RESOLVED — Final: ${fin.candidateId} (${fin.verdict})`;
    } else {
      actionStatusEl.innerHTML = `<b>ACTION STATUS:</b> UNRESOLVED`;
    }

    // R2C-A.1.2: Candidate status display
    const candVerdict = getCandidateVerdict(selectedAction.actionId, selectedCandidateId, state);
    const hasNotes = Boolean(state.notesByCandidate[dKey]);
    candidateStatusEl.innerHTML = `<b>CANDIDATE:</b> ${selectedCandidateId} — Decision: ${candVerdict}${hasNotes ? ' (notes saved)' : ''}`;

    // Hide error on re-render
    errorBox.style.display = 'none';

    status.textContent = running ? 'Playback in progress...' : selectedAction.rationale;
  };

  const saveDecision = (verdict: HeldCandidateVerdict) => {
    state = applyVerdict(selectedAction.actionId, selectedCandidateId, verdict, notesArea.value, sideSelect.value, state);
    saveState(state);
    status.textContent = `Saved: ${verdict} for ${selectedAction.actionId} (candidate ${selectedCandidateId})`;
    render();
  };

  const showPlaybackInfo = (snap: PlaybackSnapshot) => {
    playbackInfo.replaceChildren();
    const dirLabel = snap.direction === 'player' ? 'ALLY → ENEMY' : 'ENEMY → ALLY';
    playbackInfo.innerHTML = `<b>PLAYING</b><br>Action: ${snap.actionKey}<br>Candidate: ${snap.candidateId}<br>Direction: ${dirLabel}<br>Route: ${snap.entry.route === 'stage' ? 'STAGE' : 'TACTICAL'}`;
  };

  const showQaError = (candidateId: string, reason: string) => {
    errorBox.style.display = 'block';
    errorBox.innerHTML = `<b>VFX candidate unavailable:</b> ${candidateId}<br><b>Reason:</b> ${reason}`;
    console.error(`[R2C-A] VFX candidate unavailable: ${candidateId} — ${reason}`);
  };

  actionSelect.addEventListener('change', () => {
    // R2C-A.1.2: Save current direction before switching
    if (isDirectionalAction(selectedAction)) {
      state = applyDirection(selectedAction.actionId, sideSelect.value, state);
    }
    selectedAction = options.entries.find((e) => e.actionId === actionSelect.value) ?? firstEntry;
    buildSourceOptions();
    render();
  });
  sourceSelect.addEventListener('change', () => {
    // R2C-A.1.2: Remember selected candidate per action (browsing does NOT change finalSelection)
    const id = sourceSelect.value;
    selectedCandidateId = id;
    const resolved = resolveCandidateSource(id);
    selectedSource = resolved.source;
    selectedFilename = resolved.filename;
    state = applySelectedCandidate(selectedAction.actionId, id, state);
    saveState(state);
    render();
  });
  sideSelect.addEventListener('change', () => {
    // C3/C4: Save direction per action
    state = applyDirection(selectedAction.actionId, sideSelect.value, state);
    saveState(state);
  });
  notesArea.addEventListener('input', () => {
    // R2C-A.1.2: Always persist notes, even without verdict
    state = applyNotes(selectedAction.actionId, selectedCandidateId, notesArea.value, state);
    saveState(state);
  });
  lockBtn.addEventListener('click', () => saveDecision('LOCK'));
  tuneBtn.addEventListener('click', () => saveDecision('PRESENTATION_TUNE_ONLY'));
  rejectBtn.addEventListener('click', () => saveDecision('REJECT'));
  exportBtn.addEventListener('click', () => exportState(state));
  nextBtn.addEventListener('click', () => {
    // R2C-A.1.2: Save current direction before navigating
    if (isDirectionalAction(selectedAction)) {
      state = applyDirection(selectedAction.actionId, sideSelect.value, state);
      saveState(state);
    }
    const next = resolveNextUnresolvedAction(selectedAction.actionId, state, needsAltEntries);
    if (next) {
      selectedAction = options.entries.find((e) => e.actionId === next.actionId) ?? firstEntry;
      actionSelect.value = next.actionId;
      buildSourceOptions();
      render();
    } else {
      const resolved = getProgress(state, needsAltEntries);
      if (resolved === needsAltEntries.length) {
        status.textContent = `SOURCE REVIEW COMPLETE — ${resolved} / ${needsAltEntries.length}`;
        nextBtn.disabled = true;
        nextBtn.textContent = 'REVIEW COMPLETE';
      } else {
        status.textContent = 'All actions reviewed!';
      }
    }
  });

  const play = async () => {
    if (running) return;
    // A5/A6: Check availability before playback
    const avail = getCandidateAvailability(selectedCandidateId);
    if (avail !== 'READY') {
      showQaError(selectedCandidateId, `candidate ${avail.toLowerCase()}`);
      return;
    }
    // C2: Capture immutable playback snapshot
    const snapshot: PlaybackSnapshot = {
      actionKey: selectedAction.actionId,
      candidateId: selectedCandidateId,
      direction: sideSelect.value as SourceTeam,
      entry: selectedEntry(),
    };
    lastSnapshot = snapshot;
    running = true;
    playButton.disabled = true;
    replayButton.disabled = true;
    // B1: Enter transparent playback state
    root.classList.add('r2ca-playing');
    showPlaybackInfo(snapshot);
    render();
    try {
      await options.play(snapshot.entry, snapshot.direction);
      status.textContent = 'Playback complete. Record your decision below.';
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'runtime review source not resolved';
      showQaError(snapshot.candidateId, reason);
      status.textContent = 'Playback failed — see error above.';
    } finally {
      running = false;
      playButton.disabled = false;
      replayButton.disabled = false;
      // B2: Restore normal panel opacity
      root.classList.remove('r2ca-playing');
      render();
    }
  };
  playButton.addEventListener('click', play);

  // C7: Replay uses last snapshot unless parameters changed
  replayButton.addEventListener('click', () => {
    if (running) return;
    if (lastSnapshot) {
      // Rebuild snapshot from current selection (parameters may have changed)
      const avail = getCandidateAvailability(selectedCandidateId);
      if (avail !== 'READY') {
        showQaError(selectedCandidateId, `candidate ${avail.toLowerCase()}`);
        return;
      }
      const snapshot: PlaybackSnapshot = {
        actionKey: selectedAction.actionId,
        candidateId: selectedCandidateId,
        direction: sideSelect.value as SourceTeam,
        entry: selectedEntry(),
      };
      lastSnapshot = snapshot;
      running = true;
      playButton.disabled = true;
      replayButton.disabled = true;
      root.classList.add('r2ca-playing');
      showPlaybackInfo(snapshot);
      render();
      options.play(snapshot.entry, snapshot.direction).then(() => {
        status.textContent = 'Replay complete.';
      }).catch((error) => {
        const reason = error instanceof Error ? error.message : 'runtime review source not resolved';
        showQaError(snapshot.candidateId, reason);
      }).finally(() => {
        running = false;
        playButton.disabled = false;
        replayButton.disabled = false;
        root.classList.remove('r2ca-playing');
        render();
      });
    } else {
      play();
    }
  });

  root.append(title, subtitle, actionLabel, sourceLabel, routeBox, sideLabel, meta, actionStatusEl, candidateStatusEl, decisionLabel, notesLabel, controls, navBox, playbackInfo, progress, status, errorBox, note);
  document.body.appendChild(root);
  buildSourceOptions();
  render();

  return () => {
    playButton.removeEventListener('click', play);
    root.remove();
  };
}
