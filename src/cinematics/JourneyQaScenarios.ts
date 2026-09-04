import { CinematicPlayer } from './CinematicPlayer';
import { CinematicPreloader } from './CinematicPreloader';
import { CinematicRegistry } from './CinematicRegistry';
import type { VideoCinematicManifest, VideoCinematicResult } from './CinematicTypes';
import { JourneySession } from './JourneySession';
import {
  JOURNEY_SECONDARY_ACTION_IDS,
  type JourneyAgencyPresentation,
  type JourneyCommit,
  type JourneySessionState,
} from './JourneyTypes';

/**
 * Isolated DEV QA scenarios for the CIN-1 Journey runtime.
 *
 * Every scenario builds its own in-memory registry, player and session, so nothing here can touch
 * the campaign, a save, or the shipped `public/assets/cinematics/manifest.json`. The same functions
 * back the browser QA lab and the automated test suite, so what is asserted is what is clicked.
 *
 * The candidate descriptors below point at paths that intentionally do not exist: no real cinematic
 * is integrated in CIN-1, and the preloader must stay non-fatal when local media is missing.
 */
export const JOURNEY_QA_MANIFEST: VideoCinematicManifest = Object.freeze({
  version: 1 as const,
  cinematics: Object.freeze([
    {
      id: 'journey-qa-hold',
      title: 'Étape de voyage (QA)',
      sources: [],
      fallbackText: 'Surface de présentation gelée — aucune donnée de chronique modifiée.',
      placeholderOnly: true,
      durationMs: 1_200,
    },
    {
      id: 'journey-qa-candidate-a',
      title: 'Candidat A (QA)',
      sources: [{ src: '/assets/cinematics/qa/journey-qa-candidate-a.webm', type: 'video/webm' as const }],
    },
    {
      id: 'journey-qa-candidate-b',
      title: 'Candidat B (QA)',
      sources: [{ src: '/assets/cinematics/qa/journey-qa-candidate-b.webm', type: 'video/webm' as const }],
    },
  ]),
});

export interface JourneyQaScenarioInfo {
  id: string;
  title: string;
  summary: string;
  /** True when the scenario waits for a real click on the mounted surface. */
  interactive: boolean;
}

export const JOURNEY_QA_SCENARIOS: readonly JourneyQaScenarioInfo[] = Object.freeze([
  { id: 'journey-lifecycle', title: 'Cycle de vie', summary: 'IDLE → PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED', interactive: true },
  { id: 'journey-multi-choice', title: 'Choix multiples', summary: 'Trois routes présentées, une désactivée', interactive: true },
  { id: 'journey-continue', title: 'Continuation unique', summary: 'Zéro choix → affordance de continuation', interactive: true },
  { id: 'journey-secondary', title: 'Actions secondaires', summary: 'COMPANY · ROADMAP · SAVE · MENU · CAMP', interactive: true },
  { id: 'journey-skip', title: 'Passer la présentation', summary: 'Skip → même frontière d\'agency', interactive: true },
  { id: 'journey-unavailable', title: 'Média absent', summary: 'Fallback neutre → agency atteignable', interactive: true },
  { id: 'journey-reduced-motion', title: 'Mouvement réduit', summary: 'Bypass animation → agency atteignable', interactive: true },
  { id: 'journey-dispose', title: 'Abandon / nettoyage', summary: 'Dispose pendant PLAYING, zéro résidu DOM', interactive: false },
  { id: 'journey-preload-dedupe', title: 'Préchargement dédupliqué', summary: 'IDs répétés → une seule ressource', interactive: false },
  { id: 'journey-preload-release', title: 'Préchargement libéré', summary: 'release puis clear → zéro ressource', interactive: false },
]);

export interface JourneyQaScenarioContext {
  root?: HTMLElement;
  /** Invoked once an interactive surface is mounted. Undefined in the browser: a human clicks. */
  onInteractive?: (root: HTMLElement) => void;
  createVideoElement?: () => HTMLVideoElement;
  holdDurationMs?: number;
}

export interface JourneyQaScenarioOutcome {
  id: string;
  summary: string;
  trace: readonly JourneySessionState[];
  result?: VideoCinematicResult;
  commit?: JourneyCommit;
  details: Record<string, string | number | boolean>;
  residue: { cinematicOverlays: number; journeyOverlays: number; journeySurfaces: number };
}

/** A placeholder has no natural end, so it auto-advances like a clip that reached its last frame. */
const DEFAULT_HOLD_MS = 1_600;
/** The skip scenario must stay on screen long enough for the skip to be a real player action. */
const SKIP_HOLD_MS = 30_000;

function routeChoices(): JourneyAgencyPresentation {
  return {
    title: 'La route se divise',
    caption: 'Présentation seule — aucune décision de jeu n\'est déduite ici.',
    choices: [
      { id: 'qa-route-plains', label: 'Traverser les plaines', category: 'Voyage', difficulty: 'Calme', hint: 'Chemin le plus direct', reward: 'Ravitaillement' },
      { id: 'qa-route-pass', label: 'Forcer le col', category: 'Embuscade', difficulty: 'Rude', hint: 'Terrain défavorable', risk: 'Blessures' },
      { id: 'qa-route-sealed', label: 'Sanctuaire scellé', category: 'Verrouillé', difficulty: 'Inconnu', disabled: true },
    ],
  };
}

interface Harness {
  session: JourneySession;
  root: HTMLElement;
  videoFactoryCalls: () => number;
  holdMs: number;
  finish: (partial: Omit<JourneyQaScenarioOutcome, 'id' | 'trace' | 'residue'>) => JourneyQaScenarioOutcome;
}

function createHarness(id: string, context: JourneyQaScenarioContext): Harness {
  const root = context.root ?? document.body;
  const registry = new CinematicRegistry(JOURNEY_QA_MANIFEST);
  const player = new CinematicPlayer(registry, root);
  let videoFactoryCalls = 0;
  const preloader = new CinematicPreloader(registry, {
    createVideoElement: () => {
      videoFactoryCalls += 1;
      return context.createVideoElement?.() ?? document.createElement('video');
    },
  });
  const session = new JourneySession({ player, registry, root, preloader });
  return {
    session,
    root,
    videoFactoryCalls: () => videoFactoryCalls,
    holdMs: context.holdDurationMs ?? DEFAULT_HOLD_MS,
    finish: (partial) => {
      session.dispose();
      player.dispose();
      return {
        id,
        ...partial,
        trace: [...session.stateTrace],
        residue: {
          cinematicOverlays: root.querySelectorAll('.cinematic-overlay').length,
          journeyOverlays: root.querySelectorAll('.journey-overlay').length,
          journeySurfaces: root.querySelectorAll('.journey-surface').length,
        },
      };
    },
  };
}

async function runLifecycle(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-lifecycle', context);
  const result = await harness.session.presentCinematic('journey-qa-hold', { placeholderDurationMs: harness.holdMs });
  const frozen = harness.session.state;
  const commitPromise = harness.session.requestAgency({
    title: 'Étape franchie',
    caption: 'La présentation est gelée; l\'agency est disponible.',
    choices: [{ id: 'qa-continue-route', label: 'Poursuivre la route', category: 'Voyage' }],
  });
  const agencyState = harness.session.state;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `gel=${frozen} · agency=${agencyState} · après commit=${harness.session.state}`,
    result,
    commit,
    details: { frozenSurfaceMounted: harness.session.frozenSurface !== null },
  });
}

async function runMultiChoice(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-multi-choice', context);
  const result = await harness.session.presentCinematic('journey-qa-hold', { placeholderDurationMs: harness.holdMs });
  const commitPromise = harness.session.requestAgency(routeChoices());
  const buttons = harness.root.querySelectorAll('[data-journey-choice]').length;
  const disabled = harness.root.querySelectorAll('[data-journey-choice][disabled]').length;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `${buttons} routes présentées (${disabled} désactivée) · commit=${commit.kind}:${commit.id ?? '—'}`,
    result,
    commit,
    details: { choiceButtons: buttons, disabledButtons: disabled },
  });
}

async function runContinue(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-continue', context);
  const result = await harness.session.presentCinematic('journey-qa-hold', { placeholderDurationMs: harness.holdMs });
  const commitPromise = harness.session.requestAgency({
    title: 'Successeur unique',
    choices: [],
    continueLabel: 'Poursuivre le voyage',
  });
  const continueButtons = harness.root.querySelectorAll('[data-journey-continue]').length;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `affordance de continuation ×${continueButtons} · commit=${commit.kind}`,
    result,
    commit,
    details: { continueButtons, choiceButtons: harness.root.querySelectorAll('[data-journey-choice]').length },
  });
}

async function runSecondary(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-secondary', context);
  const result = await harness.session.presentCinematic('journey-qa-hold', { placeholderDurationMs: harness.holdMs });
  const commitPromise = harness.session.requestAgency({
    title: 'Actions secondaires',
    caption: 'Aucune action n\'est branchée sur un système de production en CIN-1.',
    choices: [{ id: 'qa-route-onward', label: 'Continuer la route' }],
    secondary: JOURNEY_SECONDARY_ACTION_IDS.map((actionId) => ({ id: actionId, label: actionId })),
  });
  const secondaryButtons = harness.root.querySelectorAll('[data-journey-secondary]').length;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `${secondaryButtons} actions secondaires · commit=${commit.kind}:${commit.id ?? '—'}`,
    result,
    commit,
    details: { secondaryButtons },
  });
}

async function runSkip(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-skip', context);
  const presentPromise = harness.session.presentCinematic('journey-qa-hold', {
    placeholderDurationMs: context.holdDurationMs ?? SKIP_HOLD_MS,
  });
  context.onInteractive?.(harness.root);
  const result = await presentPromise;
  const frozen = harness.session.state;
  const commitPromise = harness.session.requestAgency({
    title: 'Présentation passée',
    caption: 'Le skip ne décide d\'aucun événement de jeu.',
    choices: [{ id: 'qa-route-onward', label: 'Continuer la route' }],
  });
  const agencyState = harness.session.state;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `skip → ${result.reason} · ${frozen} → ${agencyState} · commit=${commit.kind}`,
    result,
    commit,
    details: { reachedFreeze: frozen === 'FREEZE', reachedAgency: agencyState === 'AGENCY' },
  });
}

async function runUnavailable(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-unavailable', context);
  const result = await harness.session.presentCinematic('journey-qa-absent-clip');
  const fallback = harness.root.querySelector<HTMLElement>('.journey-surface')?.dataset.journeyFallback ?? 'aucun';
  const commitPromise = harness.session.requestAgency({
    title: 'Média indisponible',
    caption: 'La progression n\'est jamais bloquée par une cinématique manquante.',
    choices: [{ id: 'qa-route-onward', label: 'Continuer la route' }],
  });
  const agencyState = harness.session.state;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `${result.reason} → surface neutre (${fallback}) → ${agencyState}`,
    result,
    commit,
    details: { neutralFallback: fallback, reachedAgency: agencyState === 'AGENCY' },
  });
}

async function runReducedMotion(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-reduced-motion', context);
  const result = await harness.session.presentCinematic('journey-qa-hold', { reducedMotion: true });
  const cinematicOverlays = harness.root.querySelectorAll('.cinematic-overlay').length;
  const commitPromise = harness.session.requestAgency({
    title: 'Mouvement réduit',
    caption: 'Animation contournée, agency toujours accessible au clavier.',
    choices: [{ id: 'qa-route-onward', label: 'Continuer la route' }],
  });
  const agencyState = harness.session.state;
  context.onInteractive?.(harness.root);
  const commit = await commitPromise;
  return harness.finish({
    summary: `${result.reason} · aucun lecteur vidéo monté (${cinematicOverlays}) → ${agencyState}`,
    result,
    commit,
    details: { cinematicOverlaysDuringFreeze: cinematicOverlays, reachedAgency: agencyState === 'AGENCY' },
  });
}

async function runDispose(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-dispose', context);
  const presentPromise = harness.session.presentCinematic('journey-qa-hold', { placeholderDurationMs: harness.holdMs });
  harness.session.dispose();
  const result = await presentPromise;
  return harness.finish({
    summary: `dispose pendant PLAYING → ${result.reason} · état=${harness.session.state}`,
    result,
    details: { disposedState: harness.session.state },
  });
}

async function runPreloadDedupe(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-preload-dedupe', context);
  harness.session.preloadCandidates(['journey-qa-candidate-a', 'journey-qa-candidate-a', 'journey-qa-candidate-b']);
  harness.session.preloadCandidates(['journey-qa-candidate-a', 'journey-qa-hold', 'journey-qa-absent-clip']);
  const preloader = harness.session.candidatePreloader;
  return harness.finish({
    summary: `6 demandes → ${harness.videoFactoryCalls()} ressources créées · ${preloader.size} IDs suivis`,
    details: {
      videoElementsCreated: harness.videoFactoryCalls(),
      trackedIds: preloader.size,
      placeholderStatus: preloader.statusOf('journey-qa-hold') ?? 'aucun',
      unknownStatus: preloader.statusOf('journey-qa-absent-clip') ?? 'aucun',
    },
  });
}

async function runPreloadRelease(context: JourneyQaScenarioContext): Promise<JourneyQaScenarioOutcome> {
  const harness = createHarness('journey-preload-release', context);
  const preloader = harness.session.candidatePreloader;
  harness.session.preloadCandidates(['journey-qa-candidate-a', 'journey-qa-candidate-b']);
  const afterPreload = preloader.size;
  harness.session.releaseCandidates(['journey-qa-candidate-a']);
  const afterRelease = preloader.size;
  preloader.clear();
  return harness.finish({
    summary: `préchargés=${afterPreload} → release=${afterRelease} → clear=${preloader.size}`,
    details: { afterPreload, afterRelease, afterClear: preloader.size, retained: preloader.retainedCount },
  });
}

const RUNNERS: Record<string, (context: JourneyQaScenarioContext) => Promise<JourneyQaScenarioOutcome>> = {
  'journey-lifecycle': runLifecycle,
  'journey-multi-choice': runMultiChoice,
  'journey-continue': runContinue,
  'journey-secondary': runSecondary,
  'journey-skip': runSkip,
  'journey-unavailable': runUnavailable,
  'journey-reduced-motion': runReducedMotion,
  'journey-dispose': runDispose,
  'journey-preload-dedupe': runPreloadDedupe,
  'journey-preload-release': runPreloadRelease,
};

export function runJourneyQaScenario(
  id: string,
  context: JourneyQaScenarioContext = {},
): Promise<JourneyQaScenarioOutcome> {
  const runner = RUNNERS[id];
  if (!runner) {
    return Promise.resolve({
      id,
      summary: `Scénario inconnu : ${id}`,
      trace: ['IDLE'],
      details: {},
      residue: { cinematicOverlays: 0, journeyOverlays: 0, journeySurfaces: 0 },
    });
  }
  return runner(context);
}

export function formatJourneyQaOutcome(outcome: JourneyQaScenarioOutcome): string {
  const details = Object.entries(outcome.details).map(([key, value]) => `${key}=${value}`).join(' · ');
  const residue = `résidu DOM : cinematic=${outcome.residue.cinematicOverlays} journey=${outcome.residue.journeyOverlays} surface=${outcome.residue.journeySurfaces}`;
  return [outcome.summary, `trace : ${outcome.trace.join(' → ')}`, details, residue]
    .filter((part) => part.length > 0)
    .join(' | ');
}
