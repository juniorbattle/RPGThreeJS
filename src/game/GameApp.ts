import { combatConfigs } from './content';
import { createInitialState, SaveRepository } from './store';
import type { CombatConfig, CombatResult, DialogueSequence, GameState, NarrativeEffect, RunNode, UnitInstance } from './types';
import { createRecruitInstance, createUnitInstance, getItemCategory, toCombatant, itemById } from './catalog';
import { applyCombatProgress } from './combatProgress';
import {
  creditRunReward, enterRunNode,
  getAvailableRunNodes, getRunNode, secureRunLoot, travelToResolvedPoi,
  selectPoiMap, enterPoi, bypassPoi, isPoiNeutralized, settlePoiNavigation,
  commitPoiEliteFight, resolvePoiEliteVictory, runNodesAllowedByCommitment, creditChallengePrime, challengeVerdict,
  setClanRelation, topologyForRun, type ChallengeVerdict } from './runSystem';
import { createPoiChestAdapter } from './poiContentAdapters';
import { beginPoiEliteEncounter, retreatPoiElite } from './poiExpedition';
import { areLionFinalRefugeServicesOpen } from '../campaign/LionFinalRefugeServices';
import { PoiEncounterView } from '../ui/PoiEncounterView';
import { changeReputation, getReputationRule } from './reputation';
import { calibrateLionAmount } from './lionReputationCalibration';
import { anyCombatConfig, playableCombatConfig } from './playableContent';
import {
  closeCurrentPlateau, combatVictoryFacts, completePlateauChronicle, continueCampaign, nextPlayablePlateau,
  pendingPlateauFinaleCombat, plateauEpilogueDialogueId, plateauFinaleOf, runPlateauId,
} from './plateauProgression';
import { resolvePlateauFinaleExecution, resolvePendingPlateauFinaleCombat } from './plateauFinale';
import { isDraftContent, POST_DEMO_COMBATS } from './postDemoContent';
import { loadBearEndForDragonQa, loadDragonEndForScorpionQa, loadEpilogueStartQa, loadLionEndForBearQa, loadScorpionEndForFinaleQa } from '../qa/postDemoQaSaves';
import { CampaignStatusHud, selectCampaignStatus } from '../ui/CampaignStatusHud';
import { resolveCharacterUnitId } from '../render/CharacterVisualRegistry';
import { resolveLionFinaleExecution, resolveSelectedLionFinaleCombat } from './lionFinale';
import { ateSeenFlag } from './contextualDialogue';
import { resolveGameAteRules, resolveGameDialogue } from './contextualDialogueContent';
import { selectGameReputationEvent } from './reputationEventContent';
import {
  recordReputationEventSelection,
  type ReputationEventSelection,
} from './reputationEventDirector';
import { getRestCost, getWoundedUnitCount, restUnits } from './management';
import { CombatBridge } from '../combat/CombatBridge';
import { DialogueView, resolveDialogueBackdrop } from '../ui/DialogueView';
import { ManagementView } from '../ui/ManagementView';
import { PoiMapView } from '../ui/PoiMapView';
import { openTournamentBoard } from '../ui/TournamentBoardView';
import {
  completeCampaignEnding, finalActCombatConfig, isEpilogueCombat, isTournamentComplete, isTournamentNodeId, nextEpilogueStep,
  nextTournamentStep, tournamentBoard, type EpilogueStep,
} from './finalAct';
import { chronicleEndWords, type ChronicleEndWords } from './chronicleEndWords';
import { FINALE_TOURNAMENT_ARRIVAL } from '../campaign/plateaux/finale/finaleTournament';
import { FINALE_TOURNAMENT_BOARD_IMAGE } from '../campaign/plateaux/finale/finalePresentation';
import { provisionalMark } from './postDemoContent';
import { sceneMood, type NarrativeMood } from '../audio/moods';
import { prefersReducedMotion } from '../ui/ReducedMotion';
import type { LivingScript } from '../ui/living/LivingTableauPlayer';
import { CREDITS_LINES, hasCredits } from '../ui/credits';
import { RefugeHireView } from '../ui/RefugeHireView';
import { canRecruit, hireAtRefuge, refugeHireOffers } from './refugeRecruitment';
import { UiSoundPlayer, type MusicContextId } from '../ui/UiSoundPlayer';
import { UiSoundSettings } from '../ui/UiSoundSettings';
import { readMotionPreference, writeMotionPreference } from '../ui/MotionPreference';
import { ExplorationView, type ExplorationAction } from '../ui/ExplorationView';
import { resolveFinalRefugeServicesPresentation, resolveRefugePresentation, type RefugePresentation } from '../ui/RefugePresentation';
import { OpeningSequence } from '../ui/opening/OpeningSequence';
import { sceneTransition } from '../ui/SceneTransition';
import type { TransitionVariant } from '../ui/SceneTransition';
import { CinematicPlayer } from '../cinematics/CinematicPlayer';
import { CinematicRegistry } from '../cinematics/CinematicRegistry';
import { resolveVideoCinematicTrigger } from '../cinematics/CinematicTriggers';
import type { VideoCinematicTrigger } from '../cinematics/CinematicTypes';
import {
  resolveCin6aBoisClairAftermath,
  resolveCin6aJourneyTrigger,
  resolveCin6cJourneyTrigger,
  resolveCin6aRefugeArrival,
  resolveCin6aSerpentEnding,
  resolveCin6bLionTrialEnding,
} from '../cinematics/Cin6aPresentation';
import {
  formatJourneyQaOutcome,
  JOURNEY_QA_SCENARIOS,
  runJourneyQaScenario,
} from '../cinematics/JourneyQaScenarios';
import { JourneyCampaignBoundary, type JourneyBoundaryRequest } from '../journey/JourneyCampaignBoundary';
import { resolveCampaignPresentation } from '../journey/JourneyPresentationPolicy';
import { evaluateRouteCommit } from '../journey/RouteCommitGuard';
import type { JourneySecondaryActionPresentation } from '../cinematics/JourneyTypes';
import { NarrativeStage } from '../cinematics/NarrativeStage';
import { resolveCinematicPresentation, resolveDialoguePresentation } from '../cinematics/NarrativePresentationResolver';
import type { ResolvedPresentationBeat } from '../cinematics/NarrativePresentationMode';
import { resolveNarrativeAuthoringMedia } from '../cinematics/NarrativePresentationPolicy';
import { createNarrativeDialogueResolver, resolveRepresentedDialogueActors } from '../cinematics/NarrativeDialogueAdapter';
import { applyFinalDialoguePresentationPlan } from '../cinematics/DialoguePresentationSegments';
import { resolveCinematicReduction, shouldPlayDialoguePreludeVideo } from '../cinematics/CinematicReductionPolicy';
import { isApprovedProductionVideo } from '../cinematics/ApprovedProductionVideos';
import {
  createGenericNarrativeTableau,
  resolveNarrativeCombatTableau,
  resolveNarrativeDialogueTableau,
  validateDialogueCast,
  type NarrativeTableauSpec,
} from '../cinematics/NarrativeTableau';
type AppMode = 'TITLE' | 'PROLOGUE' | 'TRAVEL' | 'JOURNEY' | 'NARRATIVE' | 'MANAGEMENT' | 'COMBAT' | 'RESULT' | 'QA';
/** Presentation surface → music context (OD-2026-11-01-B); COMBAT is set by CombatBridge from the encounter rank. */
const MODE_MUSIC: Readonly<Record<AppMode, MusicContextId | null>> = {
  TITLE: 'title', QA: 'title', TRAVEL: 'map', RESULT: 'map',
  PROLOGUE: 'drama', JOURNEY: 'refuge', NARRATIVE: 'refuge', MANAGEMENT: 'refuge',
  COMBAT: null,
};
/** Surfaces with their own ambience. Management keeps what it opened over, so it stays presentation of the hub. */
const MODE_AMBIENCE: Readonly<Partial<Record<AppMode, string>>> = { TRAVEL: 'map', RESULT: 'map' };

type QaPartyMode = 'campaign' | 'full';
type QaSkillMode = 'normal' | 'all';
type QaApMode = 'normal' | 'full';
type QaHpMode = 'normal' | 'restored';
type QaInventoryMode = 'campaign' | 'qa';
type QaGraphicsMode = 'normal' | 'reduced';
type QaDeployMode = 'normal' | 'full';

interface NarrativeDialogueOptions {
  cinematicId?: string;
  /** The beat opens live for the first time (set 1.13.0): only then may its living tableau play. Never on a resume. */
  live?: boolean;
  tableau?: NarrativeTableauSpec;
  preserveBackdrop?: boolean;
}

interface QaParams {
  party: QaPartyMode;
  skills: QaSkillMode;
  ap: QaApMode;
  hp: QaHpMode;
  inventory: QaInventoryMode;
  graphics: QaGraphicsMode;
  deployLimit: QaDeployMode;
}

const QA_FULL_CONSUMABLES: Record<string, number> = {
  potion: 9, revive_vial: 9, ether: 9, antidote: 9,
  bomb: 9, grenade_incendiaire: 9, grenade_entravante: 9, grenade_aveuglante: 9,
};

const QA_HERO_IDS = [
  'warrior', 'white_mage', 'dark_mage', 'archer', 'rogue', 'lancer',
  'paladin', 'dark_knight', 'red_mage', 'enchanter', 'ninja', 'artillerist',
] as const;

// Generic Journey secondary actions wired to the systems that already own them. CAMP is absent on
// purpose: real refuge nodes own camp gameplay, so a fake generic entry point would be a lie.
const JOURNEY_SECONDARY_ACTIONS: readonly JourneySecondaryActionPresentation[] = Object.freeze([
  { id: 'COMPANY', label: 'Compagnie' },
  { id: 'SAVE', label: 'Sauvegarder' },
  { id: 'MENU', label: 'Écran titre' },
]);

/** Bounded re-presentations after a rejected commit, so a stale callback cannot spin forever. */
const JOURNEY_MAX_REJECTIONS = 3;

/** How long a dialogue takes to fade into the map (final audit 2026-11-11, A5). */
const STAGE_CROSSFADE_MS = 480;

export class GameApp {
  private disposed = false;
  private mode: AppMode = 'TITLE';
  private state: GameState = createInitialState();
  private readonly statusHud = new CampaignStatusHud(() => selectCampaignStatus(this.state));
  private readonly chrome = document.createElement('div');
  private readonly dialogue: DialogueView;
  private readonly management: ManagementView;
  private readonly combat: CombatBridge;
  private readonly poiMap: PoiMapView;
  private readonly poiEncounter: PoiEncounterView;
  private readonly exploration: ExplorationView;
  private readonly prologue: OpeningSequence;
  private readonly refugeHire: RefugeHireView;
  private readonly cinematicRegistry = new CinematicRegistry();
  private readonly cinematicPlayer = new CinematicPlayer(this.cinematicRegistry);
  private pendingCombatId: string | null = null;
  private pendingChapterBeatId: string | null = null;
  // Narrative presentation policy; campaign navigation is always POI.
  private readonly campaignPresentation = resolveCampaignPresentation({
    search: window.location.search,
    dev: import.meta.env.DEV,
  });
  private readonly narrativeMediaMode = resolveNarrativeAuthoringMedia({
    search: window.location.search,
    dev: import.meta.env.DEV,
  });
  private journeyBoundary: JourneyCampaignBoundary | null = null;
  private lastNarrativeCinematicBeat: ResolvedPresentationBeat | undefined;
  /** The living tableau on screen and the backdrop that keeps its tableau alive under the dialogue (set 1.13.0). */
  private livingPlayer: { close: () => void } | null = null;
  private livingBackdrop: { dispose: () => void } | null = null;
  private activeNarrativeStage: NarrativeStage | null = null;
  // Latched after a catastrophic Journey failure so the fallback can never recurse into Journey.
  private journeyUnavailable = false;
  private routeCommitInFlight = false;
  private readonly qaEnabled = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('qa') === '1';
  private readonly cinematicQaEnabled = this.qaEnabled
    && new URLSearchParams(window.location.search).get('cinematic') === '1';
  private readonly saves = new SaveRepository();
  private readonly uiSounds = new UiSoundPlayer();
  private readonly soundSettings: UiSoundSettings;
  // Explicit DEV-only end-to-end fixture: it only exposes the existing combat QA controls while
  // the real campaign/Journey controller continues to own route, dialogue and state progression.
  private readonly cin6aGoldenQaEnabled = this.qaEnabled
    && this.campaignPresentation === 'journey'
    && new URLSearchParams(window.location.search).get('cin6a') === 'golden';
  private qaParams: QaParams | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.soundSettings = new UiSoundSettings(root, this.uiSounds, {
      motion: { get: () => this.state.settings.reducedGraphics, set: reduced => this.setReducedMotion(reduced) },
    });
    this.applyMotionPreference();
    if (import.meta.env.DEV) Object.assign(window, { __rpgMusic: () => this.uiSounds.musicSnapshot() });
    this.chrome.className = 'game-chrome';
    this.root.append(this.chrome);
    this.dialogue = new DialogueView({
      root,
      getState: () => this.state,
      applyEffects: (effects) => this.applyEffects(effects),
      onSound: id => this.uiSounds.play(id),
    });
    this.management = new ManagementView({
      root,
      getState: () => this.state,
      onChange: () => {
        this.saves.saveAuto(this.state);
      },
      onSound: id => this.uiSounds.play(id),
    });
    this.combat = new CombatBridge(root, { player: this.uiSounds, openSettings: restore => this.openSettings(restore), closeSettings: () => this.soundSettings.close() });
    this.exploration = new ExplorationView({ root, statusHud: this.statusHud, onSound: id => this.uiSounds.play(id) });
    this.poiEncounter = new PoiEncounterView(root, id => this.uiSounds.play(id));
    this.poiMap = new PoiMapView({root,
      onMove: id => this.choosePoi(id),
      onFightElite: id => this.challengePoiElite(id),
      onBypass: id => this.ignorePoi(id),
      onCompany: () => void this.openPoiCompany(),
      onSave: () => {if(!this.routeCommitInFlight){this.saves.saveManual(this.state);this.uiSounds.play('saved');this.showSaveNotice();}},
      onSettings: () => this.openSettings(),
      onSound: id => this.uiSounds.play(id),
      onMenu: () => {if(!this.routeCommitInFlight){this.saves.saveAuto(this.state);this.uiSounds.play('back');this.returnToTitle();}},
    });
    this.prologue = new OpeningSequence(root);
    this.refugeHire = new RefugeHireView(root);
  }

  /**
   * The single settings menu (OD-2026-11-05-B). A motion change made over the map redraws the map once the menu
   * closes, so the atlas follows the new choice; any other surface reads the setting when it next plays.
   */
  private openSettings(returnFocus?: () => void): void {
    const before = this.state.settings.reducedGraphics;
    const previous = document.activeElement as HTMLElement | null;
    this.soundSettings.open(() => {
      if (this.state.settings.reducedGraphics !== before && document.body.dataset.campaignSurface === 'poi-map' && document.body.dataset.mode === 'travel' && !this.routeCommitInFlight) {
        this.showPoiMap();
        this.root.querySelector<HTMLButtonElement>('[data-poi-action="settings"]')?.focus();
        return;
      }
      if (returnFocus) returnFocus();
      else if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    });
  }

  /** The player's motion choice lives on this device; the running fight follows it at once. Presentation only. */
  private setReducedMotion(reduced: boolean): void {
    this.state.settings.reducedGraphics = reduced;
    writeMotionPreference(reduced);
    this.combat.setReducedGraphics(reduced);
    this.syncMotionClass();
  }

  /**
   * The in-game choice reaches the CSS-only animations (curtain, overlays, screen entries) through one body class,
   * beside the OS media query (final audit 2026-11-11, A5).
   */
  private syncMotionClass(): void {
    document.body.classList.toggle('motion-reduced', this.state.settings.reducedGraphics === true);
  }

  /** A new or loaded chronicle takes the motion choice stored on this device, when the player made one. */
  private applyMotionPreference(): void {
    const stored = readMotionPreference();
    if (stored !== null) this.state.settings.reducedGraphics = stored;
    this.syncMotionClass();
  }

  async start(): Promise<void> {
    await this.cinematicRegistry.load();
    if (this.cinematicQaEnabled) this.renderCinematicQa();
    else this.renderTitle();
  }

  dispose(): void {
    this.disposed = true;
    this.livingPlayer?.close();
    this.livingBackdrop?.dispose();
    this.soundSettings.close();
    this.uiSounds.dispose();
    this.poiEncounter.close();
    this.poiMap.close();

    this.disposeJourney();
    this.disposeNarrativeStage();
    this.cinematicPlayer.dispose();
    this.combat.dispose();
    this.exploration.close();
    this.prologue.close();
  }

  private renderTitle(): void {
    this.poiEncounter.close();
    this.poiMap.close();
    delete document.body.dataset.campaignSurface;

    this.disposeJourney();
    this.disposeNarrativeStage();
    this.setMode('TITLE');
    this.exploration.close();
    this.prologue.close();
    this.combat.close();
    this.canvas.hidden = true;
    this.chrome.innerHTML = `
      <section class="title-screen">
        <div class="title-screen__sigil">✦</div>
        <p class="eyebrow">Chroniques d'Élyndra</p>
        <h1>La Voie<br><span>des Sceaux</span></h1>
        <p class="title-screen__lead">Un RPG tactique où chaque serment laisse une trace.</p>
        <div class="title-screen__actions">
          <button type="button" data-action="new" class="${this.saves.hasSave() ? '' : 'is-primary'}">Nouvelle chronique</button>
          <button type="button" data-action="continue" class="${this.saves.hasSave() ? 'is-primary' : ''}" ${this.saves.hasSave() ? '' : 'disabled'}>Continuer</button>
          <button type="button" data-action="settings">Réglages</button>
          ${hasCredits() ? '<button type="button" data-action="credits">Crédits</button>' : ''}
          ${this.qaEnabled ? '<button type="button" class="title-screen__qa" data-action="qa">QA rencontres</button>' : ''}
        </div>
      </section>
    `;
    this.chrome.querySelector('[data-action="new"]')?.addEventListener('click', () => {
      if (this.saves.hasSave()) this.confirmNewChronicle();
      else void this.startNewChronicle();
    });
    this.chrome.querySelector('[data-action="continue"]')?.addEventListener('click', () => void this.continueChronicle());
    this.chrome.querySelector('[data-action="settings"]')?.addEventListener('click', () => this.openSettings());
    this.chrome.querySelector('[data-action="credits"]')?.addEventListener('click', () => this.showCredits());
    this.chrome.querySelector('[data-action="qa"]')?.addEventListener('click', () => this.renderQaLab());
    (this.chrome.querySelector<HTMLButtonElement>('[data-action="continue"]:not(:disabled)')
      ?? this.chrome.querySelector<HTMLButtonElement>('[data-action="new"]'))?.focus();
  }

  /** The credits, from the operator's text only (OD-2026-11-11-E, final audit B9); Retour or Escape goes back. */
  private showCredits(): void {
    const section = document.createElement('section');
    section.className = 'title-screen title-screen--credits ui-screen';
    section.setAttribute('aria-labelledby', 'credits-title');
    const title = document.createElement('h1');
    title.id = 'credits-title';
    title.textContent = 'Crédits';
    const list = document.createElement('div');
    list.className = 'title-screen__credits';
    for (const line of CREDITS_LINES) {
      const row = document.createElement('p');
      row.textContent = line || ' ';
      list.append(row);
    }
    const actions = document.createElement('div');
    actions.className = 'title-screen__actions';
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Retour';
    back.addEventListener('click', () => this.renderTitle());
    actions.append(back);
    section.append(title, list, actions);
    section.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); this.renderTitle(); } });
    this.chrome.replaceChildren(section);
    back.focus();
  }

  /**
   * Final audit 2026-11-11 (A3): a new chronicle erases every save, so with a chronicle in progress the title asks
   * first. Keeping the chronicle is the default focus; Escape keeps it too.
   */
  private confirmNewChronicle(): void {
    const actions = this.chrome.querySelector<HTMLElement>('.title-screen__actions');
    if (!actions) return;
    actions.outerHTML = `
      <div class="title-screen__confirm" role="alertdialog" aria-modal="false" aria-labelledby="new-chronicle-warning">
        <p id="new-chronicle-warning">Une nouvelle chronique efface la chronique en cours et toutes ses sauvegardes.</p>
        <div class="title-screen__actions">
          <button type="button" data-action="confirm-new">Effacer et commencer</button>
          <button type="button" data-action="keep-chronicle" class="is-primary">Garder ma chronique</button>
        </div>
      </div>`;
    const panel = this.chrome.querySelector<HTMLElement>('.title-screen__confirm');
    const keep = () => { this.uiSounds.play('back'); this.renderTitle(); };
    panel?.querySelector('[data-action="confirm-new"]')?.addEventListener('click', () => void this.startNewChronicle());
    panel?.querySelector('[data-action="keep-chronicle"]')?.addEventListener('click', keep);
    panel?.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      keep();
    });
    panel?.querySelector<HTMLButtonElement>('[data-action="keep-chronicle"]')?.focus();
  }

  private saveNotice: HTMLElement | null = null;
  private saveNoticeTimer = 0;

  /** A save is confirmed on screen too, never by its sound alone (UI contract: audio carries no needed information). */
  private showSaveNotice(): void {
    this.showNotice('Partie sauvegardée', 2600);
  }

  /** Set 1.18.0: RunSystem's verdict on a challenge prime, kept until the company is back on the map, then stated. */
  private pendingChallengeVerdict: ChallengeVerdict | null = null;
  private showChallengeVerdict(verdict: ChallengeVerdict | null): void {
    if (!verdict) return;
    this.pendingChallengeVerdict = null;
    this.showNotice(verdict.held
      ? `Défi réussi · ${verdict.condition} · +${verdict.prime}`
      : `Défi manqué · ${verdict.condition} · pas de prime`, 5200);
  }

  private showNotice(text: string, durationMs: number): void {
    if (!this.saveNotice?.isConnected) {
      this.saveNotice = document.createElement('p');
      this.saveNotice.className = 'save-notice';
      this.saveNotice.setAttribute('role', 'status');
      this.saveNotice.setAttribute('aria-live', 'polite');
      document.body.append(this.saveNotice);
    }
    const notice = this.saveNotice;
    notice.textContent = text;
    notice.classList.add('is-visible');
    window.clearTimeout(this.saveNoticeTimer);
    this.saveNoticeTimer = window.setTimeout(() => { notice.classList.remove('is-visible'); notice.textContent = ''; }, durationMs);
  }

  private renderQaLab(message = ''): void {
    if (!this.qaEnabled) {
      this.renderTitle();
      return;
    }
    if (!this.qaParams) {
      this.qaParams = {
        party: 'campaign',
        skills: 'normal',
        ap: 'normal',
        hp: 'normal',
        inventory: 'campaign',
        graphics: this.state.settings.reducedGraphics ? 'reduced' : 'normal',
        deployLimit: 'normal',
      };
    }
    const p = this.qaParams;
    this.disposeJourney();
    this.setMode('QA');
    this.exploration.close();
    this.prologue.close();
    this.combat.close();
    this.canvas.hidden = true;
    // Set 1.20.0: the post-demo draft fights follow the demo's, labelled as drafts.
    const encounterCards = [...combatConfigs.values(), ...POST_DEMO_COMBATS.values()].map((config) => `
      <button type="button" class="qa-lab__encounter qa-lab__encounter--${config.encounterRank}" data-qa-combat="${config.id}">
        <span>${isDraftContent(config.id) ? 'brouillon · ' : ''}${config.encounterRank}</span>
        <b>${config.encounterLabel}</b>
        <small>${config.objective}</small>
      </button>
    `).join('');
    const radio = (group: string, value: string, label: string, checked: boolean) =>
      `<label class="qa-lab__radio${checked ? ' is-checked' : ''}"><input type="radio" name="qa-${group}" value="${value}" ${checked ? 'checked' : ''}>${label}</label>`;
    this.chrome.innerHTML = `
      <section class="qa-lab ui-screen" aria-label="Laboratoire QA de combat">
        <header class="qa-lab__header">
          <div><p class="eyebrow">Développement local</p><h1>Laboratoire de combat</h1></div>
          <div class="qa-lab__header-actions"><button type="button" data-qa-sounds>Laboratoire d'écoute</button><button type="button" data-qa-back>Retour au titre</button></div>
        </header>
        <p class="qa-lab__lead">Mode QA isolé : aucun résultat, récompense, PV ou objet consommé n'est appliqué à la chronique.</p>
        <div class="qa-lab__header-actions" aria-label="Tableaux vivants"><button type="button" data-qa-living="bois_clair_arrival">Tableau vivant · Arrivée à Bois-Clair</button><button type="button" data-qa-living="bois_clair_saved">Bois-Clair sauvé</button><button type="button" data-qa-living="bois_clair_sacrificed">Bois-Clair sacrifié</button><button type="button" data-qa-living="lion_judgement">Jugement du Lion</button><button type="button" data-qa-living="alaric_audience_arrival">Audience d’Alaric</button><button type="button" data-qa-living="serpent_route_ending">Fin Serpent</button><button type="button" data-qa-living="lion_trial_route_ending">Fin de l’épreuve</button><button type="button" data-qa-living-mockup="bear_arrival_moment">Maquette · Arrivée chez Borin</button></div>
        <div class="qa-lab__header-actions" aria-label="Après-démo"><button type="button" data-qa-postdemo="honour">Ours · depuis une fin du Lion par l’honneur</button><button type="button" data-qa-postdemo="force">Ours · depuis une fin du Lion par la force</button><button type="button" data-qa-postdemo="dragon-honour">Dragon · depuis une fin de l’Ours par l’honneur</button><button type="button" data-qa-postdemo="dragon-force">Dragon · depuis une fin de l’Ours par la force</button><button type="button" data-qa-postdemo="scorpion-honour">Scorpion · depuis une fin du Dragon par l’honneur</button><button type="button" data-qa-postdemo="scorpion-force">Scorpion · depuis une fin du Dragon par la force</button><button type="button" data-qa-postdemo="finale-honour">Acte final · depuis une fin du Scorpion par l’honneur</button><button type="button" data-qa-postdemo="finale-force">Acte final · depuis une fin du Scorpion par la force</button><button type="button" data-qa-postdemo="ending-respect">Fin · le Respect</button><button type="button" data-qa-postdemo="ending-fear">Fin · la Crainte</button><button type="button" data-qa-postdemo="ending-balance">Fin · l’Équilibre</button></div>
        ${message ? `<p class="qa-lab__result">${message}</p>` : ''}
        <div class="qa-lab__params">
          <fieldset>
            <legend>Groupe</legend>
            ${radio('party', 'campaign', 'Party actuelle', p.party === 'campaign')}
            ${radio('party', 'full', 'Full roster QA', p.party === 'full')}
          </fieldset>
          <fieldset>
            <legend>Compétences</legend>
            ${radio('skills', 'normal', 'Déblocage normal', p.skills === 'normal')}
            ${radio('skills', 'all', 'Toutes compétences', p.skills === 'all')}
          </fieldset>
          <fieldset>
            <legend>PA</legend>
            ${radio('ap', 'normal', 'AP normal', p.ap === 'normal')}
            ${radio('ap', 'full', 'AP plein', p.ap === 'full')}
          </fieldset>
          <fieldset>
            <legend>PV</legend>
            ${radio('hp', 'normal', 'PV actuels', p.hp === 'normal')}
            ${radio('hp', 'restored', 'PV restaurés', p.hp === 'restored')}
          </fieldset>
          <fieldset>
            <legend>Inventaire</legend>
            ${radio('inventory', 'campaign', 'Inventaire campagne', p.inventory === 'campaign')}
            ${radio('inventory', 'qa', 'Inventaire QA complet ×9', p.inventory === 'qa')}
          </fieldset>
          <fieldset>
            <legend>Graphismes</legend>
            ${radio('graphics', 'normal', 'Normal', p.graphics === 'normal')}
            ${radio('graphics', 'reduced', 'Réduit', p.graphics === 'reduced')}
          </fieldset>
          <fieldset>
            <legend>Déploiement</legend>
            ${radio('deployLimit', 'normal', 'Limite normale', p.deployLimit === 'normal')}
            ${radio('deployLimit', 'full', 'Tous les héros QA', p.deployLimit === 'full')}
          </fieldset>
        </div>
        <div class="qa-lab__grid">${encounterCards}</div>
      </section>
    `;
    this.chrome.querySelector('[data-qa-back]')?.addEventListener('click', () => this.renderTitle());
    // Set 1.20.0 (post-demo QA): replaces the autosave with a genuine ended demo Lion save, then continues it like any save.
    this.chrome.querySelectorAll<HTMLButtonElement>('[data-qa-postdemo]').forEach((button) => button.addEventListener('click', () => {
      if (!import.meta.env.DEV) return;
      const start = button.dataset.qaPostdemo ?? 'honour';
      const route = start.endsWith('force') ? 'force' : 'honour';
      const load = start.startsWith('ending-') ? loadEpilogueStartQa(start.slice('ending-'.length) as 'respect' | 'fear' | 'balance')
        : start.startsWith('finale-') ? loadScorpionEndForFinaleQa(route)
        : start.startsWith('scorpion-') ? loadDragonEndForScorpionQa(route)
        : start.startsWith('dragon-') ? loadBearEndForDragonQa(route) : loadLionEndForBearQa(route);
      void load.then((save) => {
        this.saves.saveAuto(save);
        void this.continueChronicle();
      });
    }));
    // Dev-only preview of each living tableau (set 1.13.0, OD-2026-11-04-A), with the mood of the dialogue it precedes.
    this.chrome.querySelectorAll<HTMLButtonElement>('[data-qa-living]').forEach((button) => button.addEventListener('click', () => {
      if (!import.meta.env.DEV) return;
      const id = button.dataset.qaLiving ?? '';
      const following = { bois_clair_arrival: 'village_choice', bois_clair_saved: 'village_defense_aftermath', bois_clair_sacrificed: 'village_raid_aftermath', lion_judgement: 'lion_finale_judgement', alaric_audience_arrival: 'lion_briefing', serpent_route_ending: 'epilogue', lion_trial_route_ending: 'epilogue' }[id];
      if (!following) return;
      const before = this.uiSounds.musicSnapshot().context;
      void this.playLivingTableau(id, following).then(() => {
        this.uiSounds.setMusicContext(before);
        this.renderQaLab();
      });
    }));
    // Dev-only mock-ups of proposed post-demo living tableaux (PLATEAU_MOMENTS_DRAFT_2026-11-13), not wired to the game.
    this.chrome.querySelectorAll<HTMLButtonElement>('[data-qa-living-mockup]').forEach((button) => button.addEventListener('click', () => {
      if (!import.meta.env.DEV) return;
      const id = button.dataset.qaLivingMockup ?? '';
      const before = this.uiSounds.musicSnapshot().context;
      void import('../ui/living/livingMockups').then(async ({ LIVING_MOCKUPS }) => {
        const mockup = LIVING_MOCKUPS[id];
        if (mockup) await this.presentLivingScript(mockup.script, mockup.following);
        this.uiSounds.setMusicContext(before);
        this.renderQaLab();
      });
    }));
    this.chrome.querySelector('[data-qa-sounds]')?.addEventListener('click', () => {
      if (import.meta.env.DEV) void import('../ui/AudioListeningLab').then(({ AudioListeningLab }) => new AudioListeningLab(this.root, this.uiSounds).open());
    });
    this.chrome.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        const group = input.name.split('qa-')[1] as keyof QaParams | undefined;
        if (group && this.qaParams) {
          this.qaParams[group] = input.value as never;
          this.renderQaLab(message);
        }
      });
    });
    this.chrome.querySelectorAll<HTMLButtonElement>('[data-qa-combat]').forEach((button) => {
      button.addEventListener('click', () => void this.startQaCombat(button.dataset.qaCombat ?? ''));
    });
  }

  private renderCinematicQa(message = ''): void {
    if (!this.cinematicQaEnabled) {
      this.renderTitle();
      return;
    }
    this.disposeJourney();
    this.setMode('QA');
    this.exploration.close();
    this.prologue.close();
    this.combat.close();
    this.canvas.hidden = true;
    const requestedRealId = new URLSearchParams(window.location.search).get('real') ?? 'camp_departure';
    const selectedRealId = this.cinematicRegistry.get(requestedRealId) ? requestedRealId : 'camp_departure';
    const selectedDialogueId = [
      'lion_briefing', 'village_choice', 'shadow_signs', 'final_refuge',
      'mystery_recruit', 'mystery_lancer_recruit', 'mystery_help', 'mystery_treasure',
      'old_shrine_event', 'mystery_shrine', 'mystery_dragon_roost', 'serpent_informant',
    ].find((dialogueId) => (
      resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId })
        ?? resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId }, { flags: this.state.flags })
    ) === selectedRealId);
    this.chrome.innerHTML = `
      <section class="qa-lab cinematic-qa ui-screen" aria-label="Laboratoire QA cinématique">
        <header class="qa-lab__header">
          <div><p class="eyebrow">Développement local</p><h1>Laboratoire cinématique</h1></div>
          <button type="button" data-cinematic-back>Retour au titre</button>
        </header>
        <p class="qa-lab__lead">Lecteur isolé : aucune donnée de chronique, de combat ou de sauvegarde n'est modifiée.</p>
        <p class="qa-lab__lead" data-cinematic-registry>Registre chargé : ${this.cinematicRegistry.values().map((entry) => entry.id).join(', ') || 'vide'}.</p>
        ${message ? `<p class="qa-lab__result">${message}</p>` : ''}
        <h2 class="qa-lab__section">Lecteur autonome</h2>
        <div class="cinematic-qa__grid">
          <button type="button" data-cinematic-qa="placeholder"><b>Placeholder</b><span>Lecture, Continuer et nettoyage</span></button>
          <button type="button" data-cinematic-qa="missing"><b>ID absent</b><span>Fallback immédiat sans blocage</span></button>
          <button type="button" data-cinematic-qa="reduced"><b>Mouvement réduit</b><span>Continuation immédiate</span></button>
          <button type="button" data-cinematic-qa="abort"><b>Annulation</b><span>Abort et règlement exact</span></button>
          <button type="button" data-cinematic-qa="transition"><b>Transition</b><span>Interlude couvert et interactif</span></button>
          <button type="button" data-cinematic-qa="real-selected"><b>Vidéo CIN-6A sélectionnée</b><span>${selectedRealId} — fin naturelle, Skip et nettoyage</span></button>
          <button type="button" data-cinematic-qa="real-selected-hold"><b>Hold CIN-6A sélectionné</b><span>${selectedRealId} — frame finale Chromium, Release et nettoyage</span></button>
          ${selectedDialogueId ? `<button type="button" data-cinematic-qa="real-selected-dialogue"><b>Dialogue CIN-6.5 sélectionné</b><span>${selectedRealId} → ${selectedDialogueId}</span></button>` : ''}
          <button type="button" data-cinematic-qa="real-hold"><b>Vidéo réelle + hold</b><span>lion_judgement naturel, frame finale, Release et nettoyage</span></button>
          <button type="button" data-cinematic-qa="real-dialogue"><b>Flux Lion réel</b><span>lion_judgement → lion_finale_judgement</span></button>
          <button type="button" data-cinematic-qa="reduced-dialogue"><b>Flux Lion réduit</b><span>Bypass mouvement → lion_finale_judgement</span></button>
          <button type="button" data-cinematic-qa="failure-dialogue"><b>Échec média + dialogue</b><span>ID absent → lion_finale_judgement</span></button>
        </div>
        <h2 class="qa-lab__section">Runtime Cinematic Journey (CIN-1)</h2>
        <p class="qa-lab__lead">Registre cinématique en mémoire, isolé du manifeste de production. Les scénarios interactifs attendent un vrai clic.</p>
        <div class="cinematic-qa__grid">
          ${JOURNEY_QA_SCENARIOS.map((scenario) => `
            <button type="button" data-cinematic-qa="${scenario.id}"><b>${scenario.title}</b><span>${scenario.summary}</span></button>
          `).join('')}
        </div>
      </section>
    `;
    this.chrome.querySelector('[data-cinematic-back]')?.addEventListener('click', () => this.renderTitle());
    this.chrome.querySelectorAll<HTMLButtonElement>('[data-cinematic-qa]').forEach((button) => {
      button.addEventListener('click', () => void this.runCinematicQa(button.dataset.cinematicQa ?? ''));
    });
  }

  private async runCinematicQa(scenario: string): Promise<void> {
    if (scenario.startsWith('journey-')) {
      const outcome = await runJourneyQaScenario(scenario);
      this.renderCinematicQa(`${scenario} — ${formatJourneyQaOutcome(outcome)}`);
      return;
    }
    if (scenario === 'real-dialogue') {
      await this.playDialogue('lion_finale_judgement');
      return;
    }
    if (scenario === 'real-selected-dialogue') {
      const requestedRealId = new URLSearchParams(window.location.search).get('real') ?? '';
      const selectedDialogueId = [
        'lion_briefing', 'village_choice', 'shadow_signs', 'final_refuge',
        'mystery_recruit', 'mystery_lancer_recruit', 'mystery_help', 'mystery_treasure',
        'old_shrine_event', 'mystery_shrine', 'mystery_dragon_roost', 'serpent_informant',
      ].find((dialogueId) => (
        resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId })
          ?? resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId }, { flags: this.state.flags })
      ) === requestedRealId);
      if (!selectedDialogueId) {
        this.renderCinematicQa(`Aucun dialogue Journey CIN-6.5 n'est associé à ${requestedRealId || '<absent>'}.`);
        return;
      }
      await this.playDialogue(selectedDialogueId);
      return;
    }
    if (scenario === 'reduced-dialogue') {
      const previous = this.state.settings.reducedGraphics;
      this.state.settings.reducedGraphics = true;
      try {
        await this.playDialogue('lion_finale_judgement');
      } finally {
        this.state.settings.reducedGraphics = previous;
      }
      return;
    }
    if (scenario === 'failure-dialogue') {
      const resolved = resolveGameDialogue('lion_finale_judgement', this.state);
      if (!resolved) throw new Error("Missing dialogue 'lion_finale_judgement'.");
      await sceneTransition.run({
        variant: 'dialogue',
        label: resolved.sequence.title ?? '',
        interlude: () => this.cinematicPlayer.play('cin3-controlled-missing', { reducedMotion: false }),
        task: async () => {
          this.setMode('NARRATIVE');
          void this.dialogue.play(resolved.sequence);
        },
        holdMs: 0,
      });
      return;
    }
    let result: Awaited<ReturnType<CinematicPlayer['play']>> | undefined;
    const requestedRealId = new URLSearchParams(window.location.search).get('real') ?? 'camp_departure';
    const selectedRealId = this.cinematicRegistry.get(requestedRealId) ? requestedRealId : 'camp_departure';
    const selectedDuration = this.cinematicRegistry.get(selectedRealId)?.durationMs ?? 0;
    if (scenario === 'real-hold' || scenario === 'real-selected-hold') {
      const heldId = scenario === 'real-hold' ? 'lion_judgement' : selectedRealId;
      const heldDuration = this.cinematicRegistry.get(heldId)?.durationMs ?? 0;
      const held = await this.cinematicPlayer.playHeld(heldId, {
        allowSkip: false,
        muted: true,
        reducedMotion: false,
        timeoutMs: Math.max(12_000, heldDuration + 5_000),
        stallTimeoutMs: 5_000,
      });
      result = held.result;
      if (held.surface) {
        const freezeFrame = held.surface.querySelector<HTMLCanvasElement>('.cinematic-overlay__freeze-frame');
        if (freezeFrame && held.result.reason === 'ended' && !freezeFrame.hidden) {
          const context = freezeFrame.getContext('2d', { willReadFrequently: true });
          if (context) {
            const pixels = context.getImageData(0, 0, freezeFrame.width, freezeFrame.height).data;
            let minimum = 255;
            let maximum = 0;
            let total = 0;
            for (let index = 0; index < pixels.length; index += 4) {
              const luminance = Math.round((pixels[index]! + pixels[index + 1]! + pixels[index + 2]!) / 3);
              minimum = Math.min(minimum, luminance);
              maximum = Math.max(maximum, luminance);
              total += luminance;
            }
            freezeFrame.dataset.luminance = `${minimum}/${Math.round(total / (pixels.length / 4))}/${maximum}`;
          }
        }
        const release = document.createElement('button');
        release.type = 'button';
        release.className = 'cinematic-overlay__control';
        release.dataset.cinematicRelease = 'true';
        release.textContent = 'Continuer / Release';
        // The frozen cinematic is deliberately inert. Keep this DEV-only QA affordance as a
        // sibling above it so a human can exercise the real release path without weakening the
        // production surface's passive accessibility contract.
        release.style.cssText = 'position:fixed;right:clamp(18px,4vw,56px);bottom:clamp(18px,4vw,48px);z-index:9300';
        release.addEventListener('click', () => {
          release.remove();
          held.release();
          const residue = document.querySelectorAll('.cinematic-overlay, .cinematic-overlay__video, .cinematic-overlay__freeze-frame, [data-cinematic-release]').length;
          this.renderCinematicQa(`Vidéo réelle ${heldId} : ${held.result.reason} · played ${held.result.played} · résidu DOM ${residue}.`);
        }, { once: true });
        document.body.append(release);
        release.focus();
        return;
      }
    } else if (scenario === 'real-selected') result = await this.cinematicPlayer.play(selectedRealId, {
      muted: true,
      reducedMotion: false,
      timeoutMs: Math.max(12_000, selectedDuration + 5_000),
      stallTimeoutMs: 5_000,
    });
    else if (scenario === 'missing') result = await this.cinematicPlayer.play('missing-cinematic', { reducedMotion: false });
    else if (scenario === 'reduced') result = await this.cinematicPlayer.play(selectedRealId, { reducedMotion: true });
    else if (scenario === 'abort') {
      const controller = new AbortController();
      window.setTimeout(() => controller.abort(), 180);
      result = await this.cinematicPlayer.play('qa-placeholder', { signal: controller.signal, reducedMotion: false, placeholderDurationMs: 5_000 });
    } else if (scenario === 'transition') {
      let transitionResult;
      await sceneTransition.run({
        variant: 'fade',
        label: 'Interlude cinématique',
        interlude: async () => { transitionResult = await this.cinematicPlayer.play('qa-placeholder', { reducedMotion: false, placeholderDurationMs: 5_000 }); },
        task: async () => undefined,
        holdMs: 0,
      });
      result = transitionResult;
    } else result = await this.cinematicPlayer.play('qa-placeholder', { reducedMotion: false, placeholderDurationMs: 5_000 });
    this.renderCinematicQa(`Résultat : ${result?.reason ?? 'inconnu'} · overlay ${document.querySelector('.cinematic-overlay') ? 'actif' : 'nettoyé'}.`);
  }

  private cinematicInterlude(trigger: VideoCinematicTrigger): (() => Promise<unknown>) | undefined {
    const id = resolveVideoCinematicTrigger(trigger)
      ?? (this.usesJourneyPresentation()
        ? resolveCin6aJourneyTrigger(trigger) ?? resolveCin6cJourneyTrigger(trigger, { flags: this.state.flags })
        : undefined);
    if (!id || !isApprovedProductionVideo(id)) return undefined;
    if (this.usesJourneyPresentation()) {
      const tableau = trigger.hook === 'beforeCombat' ? resolveNarrativeCombatTableau(trigger.combatId) : undefined;
      return () => this.playNarrativeCinematic(id, tableau);
    }
    return () => this.cinematicPlayer.play(id, { reducedMotion: this.state.settings.reducedGraphics });
  }

  private async playNarrativeCinematic(id: string, tableau?: NarrativeTableauSpec): Promise<unknown> {
    if (!isApprovedProductionVideo(id)) return undefined;
    const stage = this.createNarrativeStage(tableau);
    try {
      const beat = resolveCinematicPresentation(id);
      const result = beat?.mode === 'CINEMATIC_VIDEO'
        ? await stage.presentCinematicBeat(beat, { reducedMotion: this.state.settings.reducedGraphics })
        : await stage.presentCinematic(id, { reducedMotion: this.state.settings.reducedGraphics });
      this.lastNarrativeCinematicBeat = beat;
      this.ensureJourneyBoundary().markCinematicPresented(id);
      return result;
    } finally {
      this.disposeNarrativeStage(stage);
    }
  }

  private async playJourneyCinematic(id: string | undefined, label = ''): Promise<void> {
    if (!id || !isApprovedProductionVideo(id) || !this.usesJourneyPresentation()) return;
    await sceneTransition.run({
      variant: 'fade',
      label,
      interlude: () => this.playNarrativeCinematic(id),
      task: async () => undefined,
      holdMs: 0,
    });
  }

  /**
   * A living tableau before the dialogue it precedes (set 1.13.0, OD-2026-11-04-A), with that dialogue's mood. It reads
   * and writes no game state; a missing picture skips it. Returns whether it was shown.
   */
  private async playLivingTableau(id: string, followingDialogueId: string): Promise<boolean> {
    const { LIVING_TABLEAUX } = await import('../ui/living/livingTableaux');
    const script = LIVING_TABLEAUX[id];
    return script ? this.presentLivingScript(script, followingDialogueId) : false;
  }

  /** Plays one living tableau script with the mood of the dialogue it precedes; the QA lab's mock-ups use it directly. */
  private async presentLivingScript(script: LivingScript, followingDialogueId: string): Promise<boolean> {
    const { LivingTableauPlayer } = await import('../ui/living/LivingTableauPlayer');
    if (this.disposed) return false;
    this.setMode('NARRATIVE', { mood: sceneMood(followingDialogueId) });
    const player = new LivingTableauPlayer(this.root);
    this.livingPlayer = player;
    const done = player.open(script, { reducedMotion: this.state.settings.reducedGraphics });
    await player.ready;
    player.start();
    const outcome = await done;
    if (this.livingPlayer === player) this.livingPlayer = null;
    return outcome !== 'missing';
  }

  /** The tableau behind a dialogue that follows a living tableau keeps its light, fire and smoke alive. */
  private async attachLivingBackdrop(stageElement: HTMLElement, dialogueId: string): Promise<void> {
    this.livingBackdrop?.dispose();
    this.livingBackdrop = null;
    const [{ LIVING_BACKDROPS, LIVING_TABLEAUX, livingBackdropFits }, { LivingBackdrop }] = await Promise.all([import('../ui/living/livingTableaux'), import('../ui/living/LivingBackdrop')]);
    const host = stageElement.querySelector<HTMLElement>('.narrative-scene-surface__environment');
    // A backdrop is drawn only over the picture it was made for (set 1.14.0).
    if (!host || !livingBackdropFits(dialogueId, host.style.backgroundImage)) return;
    const painter = LIVING_TABLEAUX[LIVING_BACKDROPS[dialogueId] ?? '']?.backdrop?.();
    if (painter && !this.disposed) this.livingBackdrop = new LivingBackdrop(host, painter, prefersReducedMotion(this.state.settings.reducedGraphics));
  }

  private async playStandaloneCinematic(trigger: VideoCinematicTrigger, label = ''): Promise<void> {
    const interlude = this.cinematicInterlude(trigger);
    if (!interlude) return;
    await sceneTransition.run({ variant: 'fade', label, interlude, task: async () => undefined, holdMs: 0 });
  }

  private buildQaSquad(): UnitInstance[] {
    return QA_HERO_IDS.map((id) => createUnitInstance(id));
  }

  private async startQaCombat(combatId: string): Promise<void> {
    if (!this.qaEnabled || !this.qaParams) return;
    const config = playableCombatConfig(combatId);
    if (!config) return;
    const p = this.qaParams;
    const narrativeCinematicId = this.usesJourneyPresentation()
      ? resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId })
        ?? resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId })
        ?? resolveCin6cJourneyTrigger({ hook: 'beforeCombat', combatId }, { flags: this.state.flags })
      : undefined;
    if (narrativeCinematicId && config.preCombatDialogueId) {
      await this.playDialogue(config.preCombatDialogueId, config.encounterLabel, {
        cinematicId: narrativeCinematicId,
        tableau: resolveNarrativeCombatTableau(combatId),
        preserveBackdrop: false,
      });
    } else {
      const cinematicInterlude = this.cinematicInterlude({ hook: 'beforeCombat', combatId });
      if (cinematicInterlude) {
        await sceneTransition.run({
          variant: config.encounterRank === 'boss' ? 'boss' : 'combat',
          label: config.encounterLabel,
          interlude: cinematicInterlude,
          task: async () => undefined,
          holdMs: 0,
        });
      }
    }
    this.activeNarrativeStage?.prepareGlobalHandoff();
    this.disposeNarrativeStage();
    this.setMode('COMBAT');
    this.chrome.replaceChildren();
    const squad = p.party === 'full'
      ? this.buildQaSquad()
      : this.state.clan.members.filter((unit) => unit.currentHealth > 0);
    const clan = squad.map((unit) => {
      const combatant = toCombatant(unit, { qaUnlockAllSkills: p.skills === 'all' });
      if (p.hp === 'restored') combatant.currentHealth = combatant.stats.maxHealth;
      return combatant;
    });
    const inventory = p.inventory === 'qa'
      ? { ...QA_FULL_CONSUMABLES }
      : { ...this.state.inventory.consumables };
    try {
      const result = await this.combat.play({
        config,
        clan,
        inventory,
        preferredUnitIds: p.party === 'full' ? [] : this.state.deployment.unitIds,
        reducedGraphics: p.graphics === 'reduced',
        devQa: true,
        qaFullAp: p.ap === 'full',
        qaDeployAll: p.party === 'full' && p.deployLimit === 'full',
      });
      this.renderQaLab(`${config.encounterLabel} — ${result.victory ? 'victoire de test' : 'défaite de test'}.`);
    } catch (error) {
      this.combat.close();
      const message = error instanceof Error ? error.message : String(error);
      this.renderQaLab(`${config.encounterLabel} — erreur QA : ${message}`);
    }
  }

  /**
   * The single semantic campaign-presentation boundary.
   *
   * Every flow that used to return to TravelView returns here instead. It decides only HOW the
   * current campaign boundary is presented — never what the campaign is.
   */
  private hasCompletedPoiChronicle(): boolean {
    return this.state.run.status === 'completed' && Boolean(this.state.endingId)
      && getRunNode(this.state.run)?.links.length === 0
      && pendingPlateauFinaleCombat(this.state) === null;
  }

  private async enterCampaignPresentation(): Promise<void> {
    if(this.disposed)return;
    settlePoiNavigation(this.state);
    if(this.state.run.poiExpedition?.encounter){await this.presentPoiElite();return;}
    // Set 1.20.0 (post-demo Lot 4): the final act opens on the Tournament's board; once the arena is left, on the
    // capital's first scene, then its map.
    if (runPlateauId(this.state) === 'finale' && this.state.run.status !== 'completed') {
      if (!isTournamentComplete(this.state)) { await this.showTournamentBoard(); return; }
      const start = getRunNode(this.state.run);
      if (start && start.depth === 0 && !this.state.resolvedNodeIds.includes(start.id)) {
        this.setMode('RESULT');
        await this.resolveRunNode(start, false);
        return;
      }
    }
    // Set 1.20.0 (post-demo Lot 5): once the breach is won, RunSystem names each step of the ending's epilogue.
    const epilogue = nextEpilogueStep(this.state);
    if (epilogue) { await this.playEpilogueStep(epilogue); return; }
    // Existing terminal and preparation presentation retain agency; navigation stays on the map.
    if (this.hasCompletedPoiChronicle()) {
      this.poiMap.close(); delete document.body.dataset.campaignSurface;
      await this.enterJourney(); return;
    }
    if (areLionFinalRefugeServicesOpen(this.state)) {
      // Set 1.15.0: the services come first, then the existing preparation boundary and the map.
      await this.openFinalRefugeServices();
      if (this.disposed) return;
      if (this.journeyUnavailable) { this.showPoiMap(); return; }
    }
    if (!this.journeyUnavailable && this.state.run.currentNodeId === 'lion-final-refuge'
      && this.state.resolvedNodeIds.includes('lion-final-refuge')) {
      this.poiMap.close(); delete document.body.dataset.campaignSurface;
      await this.enterJourney(); return;
    }
    this.showPoiMap();
  }

  /**
   * Set 1.20.0 (post-demo Lot 5): plays the epilogue step RunSystem names, then returns to the campaign boundary, which
   * asks RunSystem again. A scene that left the epilogue where it was ends the presentation at the chronicle's end.
   */
  private async playEpilogueStep(step: EpilogueStep): Promise<void> {
    this.poiMap.close(); delete document.body.dataset.campaignSurface;
    this.disposeJourney();
    this.saves.saveAuto(this.state);
    const node = getRunNode(this.state.run);
    if (!node) return;
    this.setMode('RESULT');
    if (step.kind === 'combat') { await this.startCombat(step.combatId, node); return; }
    await this.playDialogue(step.dialogueId, node.label);
    this.saves.saveAuto(this.state);
    const next = nextEpilogueStep(this.state);
    if (next && JSON.stringify(next) === JSON.stringify(step)) { await this.enterJourney(); return; }
    await this.enterCampaignPresentation();
  }

  /** Set 1.20.0 (post-demo Lot 4): the Tournament's board, read from RunSystem; it opens on the Tournament's scene once. */
  private async showTournamentBoard(): Promise<void> {
    this.disposeJourney();
    this.exploration.close();
    this.poiMap.close();
    if (!tournamentBoard(this.state).entered) {
      this.setMode('RESULT');
      await this.playDialogue(FINALE_TOURNAMENT_ARRIVAL.dialogueId, 'L’Arène des Destins');
    }
    this.disposeNarrativeStage();
    this.setMode('TRAVEL');
    document.body.dataset.campaignSurface = 'tournament-board';
    this.canvas.hidden = true;
    this.saves.saveAuto(this.state);
    openTournamentBoard(this.chrome, tournamentBoard(this.state), nextTournamentStep(this.state), {
      onNext: () => void this.playTournamentStep(),
      onCompany: () => void this.openTournamentCompany(),
      onSave: () => { this.saves.saveManual(this.state); this.uiSounds.play('saved'); this.showSaveNotice(); },
      onSettings: () => this.openSettings(),
      onMenu: () => { this.saves.saveAuto(this.state); this.uiSounds.play('back'); this.returnToTitle(); },
    }, {
      // OD-2026-11-11-F (F1): the final act's own arena; the mark shows only while the act's art is provisional.
      backdrop: FINALE_TOURNAMENT_BOARD_IMAGE,
      mark: provisionalMark(FINALE_TOURNAMENT_ARRIVAL.dialogueId),
    });
  }

  private async openTournamentCompany(): Promise<void> {
    await this.openManagement('clan', undefined, 'temporary', false);
    await this.showTournamentBoard();
  }

  /** Plays the step RunSystem names next on the board: a fight, the scene that opens an entry, or the one after it. */
  private async playTournamentStep(): Promise<void> {
    if (this.mode !== 'TRAVEL' || this.routeCommitInFlight) return;
    const step = nextTournamentStep(this.state);
    if (!step) { await this.enterCampaignPresentation(); return; }
    const { entry } = step;
    const node: RunNode = { id: entry.nodeId, type: 'combat', depth: 0, links: [], contentId: entry.combatId, label: entry.label, icon: '⚔', x: 0, z: 0 };
    this.setMode('RESULT');
    if (step.action === 'fight') { await this.startCombat(entry.combatId, node); return; }
    await this.playDialogue(step.action === 'opening' ? entry.openingDialogueId! : entry.afterDialogueId!, entry.label);
    if (this.pendingCombatId) { await this.flushPendingCombat(node); return; }
    await this.enterCampaignPresentation();
  }

  private usesJourneyPresentation(): boolean {
    return this.campaignPresentation === 'journey' && !this.journeyUnavailable;
  }

  /** Without an explicit point, the map selects the step the company would most likely take next. */
  private showPoiMap(focusId?: string): void {
    const leavingStage = this.activeNarrativeStage;
    leavingStage?.prepareGlobalHandoff();

    this.disposeJourney();
    // Final audit 2026-11-11 (A5): a dialogue crossfades into the map instead of cutting; under a curtain, in reduced
    // motion, or with no stage, the stage goes at once as before.
    if (leavingStage && !sceneTransition.isActive && !prefersReducedMotion(this.state.settings.reducedGraphics)) {
      this.activeNarrativeStage = null;
      leavingStage.element.classList.add('narrative-stage--leaving');
      leavingStage.element.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => leavingStage.dispose(), STAGE_CROSSFADE_MS);
    } else this.disposeNarrativeStage();
    this.exploration.close();
    this.setMode('TRAVEL');
    document.body.dataset.campaignSurface = 'poi-map';
    this.canvas.hidden = true;
    this.chrome.replaceChildren();
    const model = selectPoiMap(this.state);
    this.saves.saveAuto(this.state);
    this.poiMap.open(model, focusId, this.state.settings.reducedGraphics);
    if (this.pendingChallengeVerdict) this.showChallengeVerdict(this.pendingChallengeVerdict);
  }

  private async choosePoi(nodeId: string): Promise<void> {
    if (this.mode !== 'TRAVEL' || this.routeCommitInFlight) return;
    this.routeCommitInFlight = true;
    const origin = this.state.run.currentNodeId;
    let entered: ReturnType<typeof enterPoi>;
    let route: string[] | undefined;
    try {
      // An adjacent move first; otherwise the set 1.16.0 travel to a resolved POI, both revalidated by RunSystem.
      entered = enterPoi(this.state, nodeId);
      if (!entered) {
        const travelled = travelToResolvedPoi(this.state, nodeId);
        entered = travelled;
        route = travelled?.route;
      }
      if (!entered) {this.showPoiMap();return;}
      this.saves.saveAuto(this.state);
      if(this.state.run.currentNodeId !== origin) this.uiSounds.play('travel-start');
      const travel = this.poiMap.animateTravel(origin, this.state.run.currentNodeId, route);
      if (travel) await travel;
    } finally {
      this.routeCommitInFlight = false;
    }
    if (this.disposed || this.mode !== 'TRAVEL') return;
    if (entered.interception) {await this.presentPoiElite();return;}
    if (!entered.activate) {await this.enterCampaignPresentation();return;}
    this.poiMap.close();
    this.setMode('RESULT');
    await this.resolveRunNode(entered.node, false);
  }

  private async challengePoiElite(eliteId:string): Promise<void> {
    if(this.mode!=='TRAVEL'||this.routeCommitInFlight)return;
    const threat=selectPoiMap(this.state).threats.find(threat=>threat.id===eliteId&&threat.canFight);
    if(!threat||!beginPoiEliteEncounter(this.state,eliteId,'contested',threat.positionId))return;
    this.saves.saveAuto(this.state);await this.presentPoiElite();
  }

  private async presentPoiElite(): Promise<void> {
    const encounter=this.state.run.poiExpedition?.encounter;
    if(!encounter)return;
    if(encounter.phase==='combat'){await this.fightPoiElite(encounter.id);return;}
    const def=topologyForRun(this.state.run).guardians.find(def=>def.id===encounter.eliteId)!;
    this.showPoiMap(encounter.targetNodeId);this.setMode('RESULT');
    this.saves.saveAuto(this.state);
    const challenge=selectPoiMap(this.state).threats.find(threat=>threat.id===def.id)?.challenge;
    const choice=await this.poiEncounter.choose({title:def.label,
      description:encounter.kind==='rear'?'La menace a rejoint votre position. Combattez ou regagnez le point sûr précédent.'
        :'Ce gardien tient le coffre. Combattez, ou restez à votre position sûre.',
      lines:[challenge?`Défi · ${challenge.condition} · Prime : ${challenge.prime} si la condition est tenue.`:'Combat d’élite · Déploiement : 3 unités maximum.',
        ...((anyCombatConfig(def.combat.id)?.waves??1)>1?[`${anyCombatConfig(def.combat.id)!.waves} vagues d’ennemis : la seconde entre dès que la première tombe, sans soin entre les deux.`]:[]),
        `${def.combat.rewards.temporaryGold} or à la victoire. Le coffre s’ouvre ensuite.`]});
    if(this.disposed||this.state.run.poiExpedition?.encounter?.id!==encounter.id)return;
    if(choice==='retreat'){
      if(!retreatPoiElite(this.state,selectPoiMap(this.state)))throw new Error('Unavailable safe elite retreat');
      this.saves.saveAuto(this.state);this.showPoiMap(this.state.run.currentNodeId);return;
    }
    await this.fightPoiElite(encounter.id);
  }

  private async fightPoiElite(encounterId:string): Promise<void> {
    if(this.routeCommitInFlight)return;
    const combatId=commitPoiEliteFight(this.state,encounterId);
    if(!combatId)return;
    this.routeCommitInFlight=true;
    this.saves.saveAuto(this.state);
    this.poiMap.close();this.disposeJourney();this.disposeNarrativeStage();
    const config=playableCombatConfig(combatId)!;
    let verdict:ChallengeVerdict|null=null;
    try{
      let session:ReturnType<CombatBridge['start']>|undefined;
      const mountCombat=async()=>{
        this.setMode('COMBAT');this.chrome.replaceChildren();
        session=this.combat.start({config,clan:this.state.clan.members.filter(unit=>unit.currentHealth>0).map(unit=>toCombatant(unit)),
          inventory:this.state.inventory.consumables,preferredUnitIds:this.state.deployment.unitIds,
          reducedGraphics:this.state.settings.reducedGraphics,holdOnResult:true,plateauId:runPlateauId(this.state)});
        await session.ready;
      };
      if(!await sceneTransition.run({variant:'combat',label:config.encounterLabel,task:mountCombat}))await mountCombat();
      const result=await session!.result;
      await this.closeCombatUnderCurtain(result.victory);
      if(!result.victory){this.restoreAfterDefeat();return;}
      else if(!resolvePoiEliteVictory(this.state,encounterId,result))throw new Error('Stale elite combat result');
      // Durable reward, challenge prime and defeated fact commit together before any presentation can be interrupted.
      this.saves.saveAuto(this.state);
      verdict=challengeVerdict(result);
    }finally{this.routeCommitInFlight=false;}
    await this.enterCampaignPresentation();
    this.showChallengeVerdict(verdict);
  }

  private ignorePoi(nodeId: string): void {
    if (this.mode !== 'TRAVEL' || this.routeCommitInFlight) return;
    const result = bypassPoi(this.state, nodeId);
    if (!result) return;
    this.showPoiMap(nodeId);
  }

  private async openPoiCompany(): Promise<void> {
    if (this.mode !== 'TRAVEL' || this.routeCommitInFlight) return;
    this.poiMap.close();
    await this.openManagement('clan', undefined, 'temporary', false);
    this.showPoiMap();
  }

  private async enterJourney(): Promise<void> {
    this.activeNarrativeStage?.prepareGlobalHandoff();
    let boundaryPromise: Promise<void> | null = null;
    try {
      await sceneTransition.run({
        variant: 'travel',
        task: async () => {


          this.disposeNarrativeStage();
          this.setMode('NARRATIVE');
          this.canvas.hidden = true;
          this.chrome.replaceChildren();
          this.saves.saveAuto(this.state);
          const boundary = this.ensureJourneyBoundary();
          boundaryPromise = this.runJourneyBoundary();
          await Promise.race([boundary.waitUntilSurfaceReady(), boundaryPromise]);
        },
      });
      await boundaryPromise;
    } catch (error) {
      // Recovery must start after SceneTransition releases its lock, including pre-ready failure.
      await this.failJourneyToTravel(error);
    }
  }

  /**
   * Presents the current campaign boundary through the Journey runtime until the player either
   * commits a route, leaves for the title, or the presentation itself fails.
   */
  private async runJourneyBoundary(): Promise<void> {
    let rejections = 0;
    while (this.mode === 'NARRATIVE') {
      const current = getRunNode(this.state.run);
      const available = getAvailableRunNodes(this.state);
      const outcome = await this.ensureJourneyBoundary().present({
        currentNodeId: current?.id ?? null,
        currentContentId: current?.contentId ?? null,
        ...(current?.label ? { currentLabel: current.label } : {}),
        available,
        secondary: JOURNEY_SECONDARY_ACTIONS,
        ...this.chronicleEndWords(available.length === 0),
        reducedMotion: this.state.settings.reducedGraphics,
        ...(current?.id === 'lion-final-refuge'
          ? { presentationOnly: { eyebrow: 'Préparation', title: 'Avant le jugement', continueLabel: 'Carte de campagne' } }
          : {}),
      });
      if (outcome.kind === 'presentation-continue') {
        this.showPoiMap();
        return;
      }
      if (outcome.kind === 'node' && outcome.id) {
        if (await this.commitRunNodeChoice(outcome.id)) return;
        rejections += 1;
        if (rejections >= JOURNEY_MAX_REJECTIONS) {
          throw new Error('Journey route commit repeatedly rejected.');
        }
        continue;
      }
      if (outcome.kind === 'secondary' && outcome.id) {
        if (await this.handleJourneySecondary(outcome.id)) continue;
        return;
      }
      if (outcome.kind === 'terminal') {
        // A chronicle whose next plateau is built continues the campaign; one that ends returns to the title.
        if (nextPlayablePlateau(this.state)) {
          if (await this.continueIntoNextPlateau()) continue;
          return;
        }
        this.returnToTitle();
        return;
      }
      return;
    }
  }

  private async failJourneyToTravel(error: unknown): Promise<void> {
    console.error('[Journey] Presentation failed; restoring safe campaign surface.', error);
    this.disposeJourney(); this.journeyUnavailable = true;
    if (this.hasCompletedPoiChronicle()) this.renderTitle();
    else this.showPoiMap();
  }

  private ensureJourneyBoundary(): JourneyCampaignBoundary {
    this.journeyBoundary ??= new JourneyCampaignBoundary({
      player: this.cinematicPlayer,
      statusHud: this.statusHud,
      registry: this.cinematicRegistry,
      mediaMode: this.narrativeMediaMode,
      dev: import.meta.env.DEV,
    });
    return this.journeyBoundary;
  }

  private disposeJourney(): void {
    this.journeyBoundary?.dispose();
    this.journeyBoundary = null;
  }

  private createNarrativeStage(tableau?: NarrativeTableauSpec): NarrativeStage {
    this.disposeNarrativeStage();
    const stage = new NarrativeStage({
      player: this.cinematicPlayer,
      statusHud: this.statusHud,
      registry: this.cinematicRegistry,
      mediaMode: this.narrativeMediaMode,
      dev: import.meta.env.DEV,
      reducedMotion: this.state.settings.reducedGraphics,
    });
    if (tableau) stage.setTableau(tableau);
    this.activeNarrativeStage = stage;
    return stage;
  }

  private disposeNarrativeStage(stage: NarrativeStage | null = this.activeNarrativeStage): void {
    if (!stage) return;
    stage.dispose();
    if (this.activeNarrativeStage === stage) this.activeNarrativeStage = null;
  }

  /**
   * Set 1.20.0: the end panel's words. A closed campaign names its ending; a chronicle whose next plateau is built says
   * that the route goes on, and its main action continues the campaign (playtest defect of 2026-11-09: the panel said
   * that no route followed while the continuation hid in the header).
   */
  private chronicleEndWords(terminal: boolean): { terminal?: ChronicleEndWords } {
    const words = chronicleEndWords(this.state, terminal);
    return words ? { terminal: words } : {};
  }

  /** Continues the campaign into the next plateau. Returns true when the same Journey boundary should be presented again. */
  private async continueIntoNextPlateau(): Promise<boolean> {
    if (!continueCampaign(this.state)) return true;
    this.saves.saveAuto(this.state);
    this.disposeJourney();
    // The final act opens on the Tournament (post-demo Lot 4).
    if (runPlateauId(this.state) === 'finale') { this.setMode('RESULT'); await this.enterCampaignPresentation(); return false; }
    // The new plateau opens on its first POI's scene, then its map.
    const start = getRunNode(this.state.run);
    if (start) { this.setMode('RESULT'); await this.resolveRunNode(start, false); } else this.showPoiMap();
    return false;
  }

  /** Returns true when the same Journey boundary should be presented again. */
  private async handleJourneySecondary(actionId: string): Promise<boolean> {
    if (actionId === 'SAVE') {
      this.saves.saveManual(this.state);
      this.uiSounds.play('saved');
      this.showSaveNotice();
      return true;
    }
    if (actionId === 'COMPANY') {
      // Option B: the boundary is deterministically rebuilt from unchanged route state afterwards.
      await this.openManagement('clan', undefined, 'temporary', false);
      if (this.mode !== 'NARRATIVE') this.setMode('NARRATIVE');
      return true;
    }
    if (actionId === 'MENU') {
      this.saves.saveAuto(this.state);
      this.returnToTitle();
      return false;
    }
    return true;
  }

  /**
   * THE authoritative route commit path. TravelView and Journey both enter here, and neither may
   * duplicate any of these operations. Returns true only when a node was actually entered.
   */
  private async commitRunNodeChoice(nodeId: string): Promise<boolean> {
    // Re-verified against RunSystem, never against the DOM: a stale or unavailable node is refused.
    const decision = evaluateRouteCommit({
      mode: this.mode,
      commitInFlight: this.routeCommitInFlight,
      nodeId,
      // Set 1.17.0: a Journey commit never steps outside a branch commitment.
      listAvailable: () => runNodesAllowedByCommitment(this.state, getAvailableRunNodes(this.state)),
    });
    if (!decision.authorized) {
      console.warn(`[Campaign] Refused route commit '${nodeId}' (${decision.rejection}).`);
      return false;
    }
    const node = decision.node;
    let entered: RunNode | null = null;
    this.routeCommitInFlight = true;
    try {
      this.disposeJourney();
      this.setMode('RESULT');
      entered = enterRunNode(this.state.run, node.id);
      if (entered) {
        this.state.currentNodeId = entered.id;
        this.state.visitedNodeIds = [...this.state.run.visitedNodeIds];
        if (
          ['event', 'mystery', 'recruitment'].includes(entered.type)
          && !this.state.seenUniqueEvents.includes(entered.contentId)
        ) {
          this.state.seenUniqueEvents.push(entered.contentId);
        }
        this.state.stepCounter += 1;
      }
    } finally {
      // The mutex protects only the single authoritative RunSystem mutation. Holding it while
      // `resolveRunNode` awaits the next Journey boundary would reject that legitimate next choice.
      this.routeCommitInFlight = false;
    }
    if (!entered) {
      await this.enterCampaignPresentation();
      return false;
    }
    await this.resolveRunNode(entered, false);
    return true;
  }

  private async resolveRunNode(node: RunNode, initial: boolean): Promise<void> {
    // Pending canonical finale combat survives a resolved story node. Ordinary resolved combats
    // and neutralized branches must be refused before any tactical or narrative entry.
    const pendingFinale = node.type === 'boss' ? pendingPlateauFinaleCombat(this.state) : null;
    if (node.type !== 'refuge' && !pendingFinale
      && (this.state.resolvedNodeIds.includes(node.id) || isPoiNeutralized(this.state, node.id))) {
      await this.enterCampaignPresentation();
      return;
    }
    if (node.type === 'chest') {
      const loot=createPoiChestAdapter()(this.state,node.id);
      if(loot){
        this.setMode('RESULT');this.saves.saveAuto(this.state);
        this.uiSounds.play('reward');
        await this.poiEncounter.reward({title:'Coffre ouvert',description:'Ces réserves rejoignent votre or et votre inventaire. Elles sont utilisables immédiatement.',
          lines:[...(loot.gold?[`${loot.gold} or`]:[]),...Object.entries(loot.items).map(([id,count])=>`${count} × ${itemById.get(id)?.name??id}`)]});
      }
      await this.enterCampaignPresentation();return;
    }
    if (node.type === 'refuge') {
      const presentation = resolveRefugePresentation(node);
      if (!presentation) throw new Error(`Missing interactive refuge presentation for ${node.id}`);
      const refugeBackground = this.exploration.prepareBackground(presentation.background);
      const securedFlag = `refugeSecured:${node.id}`;
      if (!this.state.flags[securedFlag]) {
        await this.playJourneyCinematic(resolveCin6aRefugeArrival(node.id), node.label);
      }
      let securedGold = 0;
      if (!this.state.flags[securedFlag]) {
        if (getReputationRule(this.state.reputation).min >= 60) {
          creditRunReward(this.state, { category: 'consumables', itemId: 'potion', quantity: 1 });
        }
        securedGold = secureRunLoot(this.state).gold;
        this.state.flags[securedFlag] = true;
      }
      const gatheringId = presentation.gatheringDialogueId;
      const gatheringFlag = `clanArrival:${node.id}`;
      if (gatheringId && !this.state.flags[gatheringFlag]) {
        const sequence = resolveGameDialogue(gatheringId, this.state)!.sequence;
        const speakingActors = new Set(sequence.steps.map(step => step.actorId).filter((id): id is string => Boolean(id)));
        const clanActors = this.state.clan.members.map(member => resolveCharacterUnitId(member.definitionId))
          .filter((id): id is string => typeof id === 'string' && !speakingActors.has(id))
          .slice(0, Math.max(0, 4 - speakingActors.size));
        await this.playDialogue(gatheringId, node.label, {
          tableau: createGenericNarrativeTableau(sequence, clanActors),
        });
        this.state.flags[gatheringFlag] = true;
      }
      await refugeBackground;
      this.disposeNarrativeStage();
      this.statusHud?.hide();
      this.saves.saveAuto(this.state);
      await this.runRefugeServices(presentation, securedGold);
      this.markResolved(node.id);
      if (await this.playPostNodeNarrative(node.id, node)) return;
      await this.enterCampaignPresentation();
      return;
    }
    if (node.type === 'shop') {
      await this.openManagement('shop', node.contentId, 'temporary', false);
      this.markResolved(node.id);
      await this.enterCampaignPresentation();
      return;
    }
    if (node.type === 'boss') {
      const pendingFinaleCombat = pendingPlateauFinaleCombat(this.state);
      if (pendingFinaleCombat) {
        await this.startCombat(pendingFinaleCombat, node);
        return;
      }
    }
    if (node.type === 'combat' || node.type === 'boss') {
      if (!anyCombatConfig(node.contentId)) {
        await this.playDialogue(node.contentId, node.label, { live: !initial });
        if (this.pendingCombatId) await this.flushPendingCombat(node);
        else {
          this.markResolved(node.id);
          if (await this.playPostNodeNarrative(node.id, node)) return;
          await this.enterCampaignPresentation();
        }
        return;
      }
      await this.startCombat(node.contentId, node);
      return;
    }
    if (!initial && this.state.resolvedNodeIds.includes(node.id)) {
      await this.enterCampaignPresentation();
      return;
    }
    await this.playDialogue(node.contentId, node.label, { live: !initial });
    if (this.pendingCombatId) {
      await this.flushPendingCombat(node);
    } else {
      this.markResolved(node.id);
      if (await this.playPostNodeNarrative(node.id, node)) return;
      await this.enterCampaignPresentation();
    }
  }

  /**
   * The refuge services loop shared by the two refuges and, since set 1.15.0, the final refuge:
   * the same owners, shop stock, prices, recipes and rest cost. Returns once the player continues.
   * `openFirst` lets a caller open the first hub under its own curtain.
   */
  private async runRefugeServices(
    presentation: RefugePresentation,
    securedGold: number,
    openFirst?: (open: () => Promise<ExplorationAction>) => Promise<ExplorationAction>,
  ): Promise<void> {
    let refugeMessage = '';
    let first = true;
    while (true) {
      const open = () => {
        this.setMode('NARRATIVE', { ambience: 'refuge' });
        const restCost = getRestCost(this.state);
        const woundedCount = getWoundedUnitCount(this.state);
        return this.exploration.open(presentation, getReputationRule(this.state.reputation).label, securedGold, {
          cost: restCost,
          woundedCount,
          canRest: woundedCount > 0 && this.state.gold >= restCost,
          message: refugeMessage,
          hireCount: refugeHireOffers(this.state).length,
        });
      };
      const action = first && openFirst ? await openFirst(open) : await open();
      first = false;
      refugeMessage = '';
      securedGold = 0;
      if (action === 'continue') break;
      if (action === 'hire') {
        // OD-2026-11-11-F (F2): a hero met but not recruited, engaged at the refuge; refugeRecruitment.ts decides.
        const offers = refugeHireOffers(this.state);
        const chosen = await this.refugeHire.open(offers, this.state.gold);
        const offer = offers.find((candidate) => candidate.unitId === chosen);
        if (chosen && offer && hireAtRefuge(this.state, chosen)) {
          this.saves.saveAuto(this.state);
          this.uiSounds.play('saved');
          refugeMessage = `${offer.name} rejoint la compagnie pour ${offer.price} or.`;
        }
        continue;
      }
      if (action === 'rest') {
        const costBeforeRest = getRestCost(this.state);
        const rested = restUnits(this.state);
        if (rested) this.saves.saveAuto(this.state);
        if (rested) this.uiSounds.play('recover');
        refugeMessage = rested
          ? `Repos effectu&eacute; : ${costBeforeRest} or d&eacute;pens&eacute;.`
          : getWoundedUnitCount(this.state) === 0
            ? 'Aucune unit&eacute; bless&eacute;e : le repos est inutile.'
            : 'Or insuffisant pour soigner la compagnie.';
        continue;
      }
      this.setMode('RESULT');
      if (action === 'shop') await this.openManagement('shop', 'valmir', 'permanent', false);
      if (action === 'clan') await this.openManagement('clan', undefined, 'temporary', false);
      if (action === 'skills') await this.openManagement('skills', undefined, 'temporary', false);
    }
  }

  /**
   * Set 1.15.0 (OD-2026-11-05-E): after the unchanged final refuge dialogue, and on each return
   * before the judgement, the existing refuge services open on the FINAL_REFUGE plate. Nothing is
   * secured, granted or saved beyond what those services already own.
   */
  private async openFinalRefugeServices(): Promise<void> {
    const node = getRunNode(this.state.run);
    const presentation = node ? resolveFinalRefugeServicesPresentation(node) : null;
    if (!presentation) throw new Error('Missing final refuge services presentation');
    this.activeNarrativeStage?.prepareGlobalHandoff();
    await this.runRefugeServices(presentation, 0, async (open) => {
      let opened: Promise<ExplorationAction> | undefined;
      await sceneTransition.run({
        variant: 'travel',
        label: presentation.title,
        task: async () => {
          this.poiMap.close(); delete document.body.dataset.campaignSurface;
          this.disposeJourney();
          this.disposeNarrativeStage();
          this.canvas.hidden = true;
          this.chrome.replaceChildren();
          this.statusHud?.hide();
          this.saves.saveAuto(this.state);
          await this.exploration.prepareBackground(presentation.background);
          opened = open();
          await Promise.race([this.exploration.waitUntilSurfaceReady(), opened]);
        },
      });
      return opened ?? open();
    });
  }

  private async playDialogue(
    dialogueId: string,
    fallbackLabel?: string,
    narrativeOptions: NarrativeDialogueOptions = {},
  ): Promise<void> {
    const resolved = resolveGameDialogue(dialogueId, this.state);
    if (!resolved) throw new Error(`Missing dialogue '${dialogueId}'.`);
    const { sequence } = resolved;

    // Dialogue staging also uses NarrativeStage directly, independently of the campaign boundary,
    // while dialogue truth and route semantics retain their existing owners.
    await this.playNarrativeDialogue(sequence, {
      ...narrativeOptions,
      cinematicId: narrativeOptions.cinematicId
        ?? resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId })
        ?? resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId })
        ?? resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId }, { flags: this.state.flags }),
      tableau: narrativeOptions.tableau ?? resolveNarrativeDialogueTableau(dialogueId, sequence),
    });

    const chapterBeatId = this.pendingChapterBeatId;
    this.pendingChapterBeatId = null;
    if (chapterBeatId) await this.playStandaloneCinematic({ hook: 'chapterBeat', beatId: chapterBeatId }, sequence.title ?? fallbackLabel ?? '');
  }

  private async playNarrativeDialogue(
    sequence: DialogueSequence,
    options: NarrativeDialogueOptions,
  ): Promise<void> {
    let tableau = applyFinalDialoguePresentationPlan(sequence, options.tableau);
    const presentationBeat = resolveDialoguePresentation(sequence.id);
    let stepPresentation = createNarrativeDialogueResolver(sequence, tableau, {
      mediaMode: 'STILL',
      hasMovingMedia: false,
    });
    let alignment = validateDialogueCast(
      tableau,
      sequence,
      resolveRepresentedDialogueActors(sequence, stepPresentation),
    );
    if (alignment.status === 'FAIL') {
      console.warn(`[NarrativeStage] Rebuilding ${tableau.id} with canonical generic Tableau staging: ${alignment.unresolved.join(', ')}`);
      tableau = applyFinalDialoguePresentationPlan(sequence, createGenericNarrativeTableau(sequence));
      stepPresentation = createNarrativeDialogueResolver(sequence, tableau, {
        mediaMode: 'STILL',
        hasMovingMedia: false,
      });
      alignment = validateDialogueCast(
        tableau,
        sequence,
        resolveRepresentedDialogueActors(sequence, stepPresentation),
      );
      if (alignment.status === 'FAIL') {
        throw new Error(`[NarrativeStage] Canonical Tableau staging failed for ${sequence.id}: ${alignment.unresolved.join(', ')}`);
      }
    }
    const stage = this.createNarrativeStage(tableau);
    stage.bindDialogue(sequence);
    stage.element.dataset.dialogueCastAlignment = alignment.status;
    const openDialogue = async () => {
      this.setMode('NARRATIVE', { mood: sceneMood(sequence.id) });
      await this.dialogue.play(sequence, {
        mode: 'narrative-stage',
        root: stage.dialogueLayer,
        stepPresentation,
        beforeStepChange: (step, presentation) => stage.activateDialogueStep(
          step.id,
          presentation.mode,
          presentation.anchorId,
          presentation.phaseId,
          step.actorId,
          presentation.presentationStrategy,
          presentation.layoutProfile,
          presentation.layoutPlacement,
          presentation.dialogueSurfaceMode,
          presentation.speakerFacing,
          presentation.speakerLookTarget,
          presentation.addressedTo,
          presentation.addressResolution,
        ),
        reducedMotion: this.state.settings.reducedGraphics,
      });
    };
    let completed = false;
    try {
      let tableauTransitionSource: 'NONE' | 'VIDEO' = 'NONE';
      const cinematicDecision = options.cinematicId ? resolveCinematicReduction(options.cinematicId) : undefined;
      if (cinematicDecision) stage.element.dataset.cinematicReduction = cinematicDecision.classification;
      if (
        options.cinematicId
        && this.narrativeMediaMode === 'VIDEO'
        && shouldPlayDialoguePreludeVideo(options.cinematicId)
      ) {
        const videoBeat = resolveCinematicPresentation(options.cinematicId);
        if (videoBeat) await stage.presentCinematicBeat(videoBeat, { reducedMotion: this.state.settings.reducedGraphics, passive: true });
        else await stage.presentCinematic(options.cinematicId, { reducedMotion: this.state.settings.reducedGraphics, passive: true });
        this.ensureJourneyBoundary().markCinematicPresented(options.cinematicId);
        this.lastNarrativeCinematicBeat = videoBeat;
        tableauTransitionSource = 'VIDEO';
      }
      if (presentationBeat) stage.setPresentationBeat(presentationBeat);
      if (options.live && options.cinematicId) await this.playLivingTableau(options.cinematicId, sequence.id);
      const firstPresentation = stepPresentation(sequence.steps[0]!);
      await stage.presentDialogueTableau(
        tableau?.stillImage ?? resolveDialogueBackdrop(sequence),
        firstPresentation.phaseId,
        tableauTransitionSource,
      );
      await this.attachLivingBackdrop(stage.element, sequence.id);
      await openDialogue();
      if (options.preserveBackdrop === true && stage.frozenSurface) {
        this.ensureJourneyBoundary().captureBackdrop(stage.frozenSurface);
      }
      completed = true;
    } finally {
      if (!completed) this.disposeNarrativeStage(stage);
    }
  }

  private async maybePlayATEs(nodeId: string): Promise<void> {
    for (const rule of resolveGameAteRules(nodeId, this.state)) {
      await this.playDialogue(rule.dialogueId);
      if (rule.once) this.state.flags[ateSeenFlag(rule)] = true;
    }
  }

  private async maybePlayReputationEvent(nodeId: string): Promise<ReputationEventSelection | null> {
    const selection = selectGameReputationEvent(nodeId, this.state);
    if (!selection?.selectedEvent) return selection;
    await this.playDialogue(selection.selectedEvent.dialogueId);
    recordReputationEventSelection(this.state, selection);
    return selection;
  }

  private async playPostNodeNarrative(nodeId: string, node: RunNode): Promise<boolean> {
    await this.maybePlayATEs(nodeId);
    if (this.pendingCombatId) {
      await this.flushPendingCombat(node);
      return true;
    }
    await this.maybePlayReputationEvent(nodeId);
    if (this.pendingCombatId) {
      await this.flushPendingCombat(node);
      return true;
    }
    return false;
  }

  private async applyEffects(effects: NarrativeEffect[]): Promise<void> {
    for (const effect of effects) {
      if (effect.delayMs) await new Promise((resolve) => window.setTimeout(resolve, effect.delayMs));
      switch (effect.type) {
        case 'setFlag':
          this.state.flags[effect.key] = effect.value;
          break;
        case 'addGold':
          if (effect.amount >= 0) {
            creditRunReward(this.state, { gold: effect.amount });
          } else {
            const cost = Math.abs(effect.amount);
            this.state.gold = Math.max(0, this.state.gold - cost);
          }
          break;
        case 'addReputation':
          changeReputation(this.state, effect.amount, 'narrative');
          break;
        case 'addItem':
          {
            const category = getItemCategory(effect.itemId) ?? 'consumables';
            creditRunReward(this.state, {
              category,
              itemId: effect.itemId,
              quantity: effect.quantity,
            });
          }
          break;
        case 'recruitUnit':
          // OD-2026-11-11-F (F2): eight recruitable heroes, two per plateau; refugeRecruitment.ts owns the rule.
          if (canRecruit(this.state, effect.unitId)) this.state.clan.members.push(createRecruitInstance(effect.unitId));
          break;
        case 'startCombat':
          this.pendingCombatId = effect.combatId;
          break;
        case 'resolveLionFinale':
          {
            const existingCombat = resolveSelectedLionFinaleCombat(this.state.flags);
            if (existingCombat) {
              this.pendingCombatId = existingCombat;
              break;
            }
            const execution = resolveLionFinaleExecution(this.state, effect.intent);
            Object.assign(this.state.flags, execution.flagChanges);
            if (execution.reputationDelta !== 0) {
              changeReputation(this.state, calibrateLionAmount({ kind: 'finale', amount: execution.reputationDelta }), `lion-finale:${execution.trialCause ?? execution.route}`);
            }
            this.pendingCombatId = execution.combatId;
            // Route selection is a durable boundary. A reload can now resume
            // the selected boss without replaying judgement or its effects.
            this.saves.saveAuto(this.state);
          }
          break;
        case 'finishChapter':
          this.state.endingId = effect.endingId;
          this.pendingChapterBeatId = effect.endingId;
          // Set 1.20.0: RunSystem records the Lion's outcome and relations as the chronicle ends.
          closeCurrentPlateau(this.state);
          break;
        case 'setClanRelation':
          setClanRelation(this.state, effect.clan, effect.stance, effect.cause);
          break;
        case 'resolvePlateauFinale':
          {
            const finale = plateauFinaleOf(effect.plateauId);
            if (!finale) throw new Error(`No finale for plateau '${effect.plateauId}'.`);
            const existingCombat = resolvePendingPlateauFinaleCombat(finale, this.state.flags);
            if (existingCombat) {
              this.pendingCombatId = existingCombat;
              break;
            }
            const execution = resolvePlateauFinaleExecution(finale, this.state, effect.intent);
            Object.assign(this.state.flags, execution.flagChanges);
            if (execution.reputationDelta !== 0) {
              changeReputation(this.state, execution.reputationDelta, `${effect.plateauId}-finale:${execution.trialCause ?? execution.route}`);
            }
            this.pendingCombatId = execution.combatId;
            this.saves.saveAuto(this.state);
          }
          break;
        case 'completePlateau':
          completePlateauChronicle(this.state, effect.plateauId);
          break;
        case 'completeEpilogue':
          completeCampaignEnding(this.state);
          break;
      }
    }
  }

  private async flushPendingCombat(node: RunNode): Promise<void> {
    const combatId = this.pendingCombatId;
    this.pendingCombatId = null;
    if (combatId) await this.startCombat(combatId, node);
    else await this.enterCampaignPresentation();
  }

  private async startCombat(combatId: string, node: RunNode): Promise<void> {
    // A dialogue may have prepared a passive Journey snapshot. Combat never owns that backdrop.
    this.disposeJourney();
    this.disposeNarrativeStage();
    // Set 1.20.0 (OD-2026-11-08-A): a Lion fight plays with its calibrated reputation reward.
    const playable = playableCombatConfig(combatId);
    if (!playable) throw new Error(`Missing combat '${combatId}'.`);
    // Set 1.20.0 (post-demo Lot 4): RunSystem adds a final-act fight's clan supports and enemy-clan foes; never saved.
    const config = finalActCombatConfig(this.state, playable);
    const narrativeTableau = this.usesJourneyPresentation() ? resolveNarrativeCombatTableau(combatId) : undefined;
    const narrativeCinematicId = this.usesJourneyPresentation()
      ? resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId })
        ?? resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId })
        ?? resolveCin6cJourneyTrigger(
          { hook: 'beforeCombat', combatId },
          { flags: this.state.flags, boundaryResolved: this.state.resolvedNodeIds.includes(node.id) },
        )
      : undefined;
    if (config.preCombatDialogueId) {
      await this.playDialogue(config.preCombatDialogueId, node.label, {
        ...(narrativeCinematicId ? { cinematicId: narrativeCinematicId } : {}),
        ...(narrativeTableau ? { tableau: narrativeTableau } : {}),
        preserveBackdrop: false,
      });
      if (this.pendingCombatId) {
        await this.flushPendingCombat(node);
        return;
      }
    }
    const variant: TransitionVariant = config.encounterRank === 'boss' ? 'boss' : 'combat';
    const combatants = this.state.clan.members.filter((unit) => unit.currentHealth > 0).map((unit) => toCombatant(unit));
    let resolveCombatStart!: (session: ReturnType<CombatBridge['start']>) => void;
    const combatStarted = new Promise<ReturnType<CombatBridge['start']>>((resolve) => {
      resolveCombatStart = resolve;
    });
    const interlude = narrativeCinematicId && config.preCombatDialogueId
      ? undefined
      : this.cinematicInterlude({ hook: 'beforeCombat', combatId });
    this.activeNarrativeStage?.prepareGlobalHandoff();
    const mountCombat = async () => {
      this.disposeJourney();
      this.disposeNarrativeStage();
      this.setMode('COMBAT');
      this.chrome.replaceChildren();
      const combatSession = this.combat.start({
        config,
        clan: combatants,
        inventory: this.state.inventory.consumables,
        preferredUnitIds: this.state.deployment.unitIds,
        reducedGraphics: this.state.settings.reducedGraphics,
        devQa: this.cin6aGoldenQaEnabled,
        holdOnResult: true,
        // Set 1.22.0 (OD-2026-11-11-E, B2): RunSystem names the fight's plateau; foes scale by its factor.
        plateauId: runPlateauId(this.state),
      });
      resolveCombatStart(combatSession);
      await combatSession.ready;
    };
    const curtained = await sceneTransition.run({
      variant,
      label: config.encounterLabel,
      interlude,
      ...(interlude ? { holdMs: 0 } : {}),
      task: mountCombat,
    });
    // Final audit 2026-11-11 (A4): a curtain already up must never leave the fight unmounted and the game waiting.
    if (!curtained) await mountCombat();
    const combatSession = await combatStarted;
    const result = await combatSession.result;
    await this.closeCombatUnderCurtain(result.victory);
    await this.resolveCombat(result, node, config.rewards);
  }

  /**
   * Final audit 2026-11-11 (A5): the fight leaves under the shared curtain. The frame is closed under black and the
   * curtain stays up until the next surface sets its mode (setMode) or the next transition lifts it.
   */
  private async closeCombatUnderCurtain(victory: boolean): Promise<void> {
    await sceneTransition.cover({ variant: 'result', label: victory ? 'Victoire' : 'Défaite' });
    this.combat.close();
  }

  /** Every return to the title from play goes under the shared curtain (final audit 2026-11-11, A5). */
  private returnToTitle(): void {
    void sceneTransition.run({ variant: 'fade', task: async () => this.renderTitle(), holdMs: 200 })
      .then((curtained) => { if (!curtained) this.renderTitle(); });
  }

  private async resolveCombat(
    result: CombatResult,
    node: RunNode,
    rewards: CombatConfig['rewards'],
  ): Promise<void> {
    await this.playStandaloneCinematic({ hook: 'afterCombat', combatId: result.combatId, outcome: result.victory ? 'victory' : 'defeat' }, result.victory ? 'Victoire' : 'Défaite');
    if (!result.victory) {

      this.restoreAfterDefeat();
      return;
    }
    const encounterLimit = anyCombatConfig(result.combatId)?.maxPlayerUnits ?? 4;
    applyCombatProgress(this.state, result, encounterLimit);
    // Set 1.20.0 (post-demo Lot 4): a Tournament fight belongs to the board, not to the map.
    const onBoard = isTournamentNodeId(node.id);
    // Set 1.20.0 (post-demo Lot 5): the Fear ending's last stand belongs to the epilogue, after the run has ended.
    const inEpilogue = isEpilogueCombat(result.combatId);
    if (!onBoard && !inEpilogue) this.state.currentNodeId = node.id;
    creditRunReward(this.state, { gold: rewards.gold });
    for (const [itemId, quantity] of Object.entries(rewards.materials ?? {})) {
      creditRunReward(this.state, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, rewards.reputation, `combat:${result.combatId}`);
    // Set 1.18.0: RunSystem decides the challenge prime with the existing rewards, before the node is marked resolved.
    // The verdict is stated once the company is back on the map, after any aftermath dialogue.
    this.pendingChallengeVerdict = creditChallengePrime(this.state, result);
    Object.assign(this.state.flags, combatVictoryFacts(result.combatId));
    if (inEpilogue) { this.saves.saveAuto(this.state); await this.enterCampaignPresentation(); return; }
    if (!onBoard) this.markResolved(node.id);
    // The Bois-Clair outcome reads the resolved result only through its existing presentation trigger (set 1.13.0).
    const boisClairAftermath = resolveCin6aBoisClairAftermath(result.combatId, result.victory, this.state.flags);
    const aftermathDialogue = anyCombatConfig(result.combatId)?.postCombatDialogueId;
    const livedAftermath = boisClairAftermath && aftermathDialogue ? await this.playLivingTableau(boisClairAftermath, aftermathDialogue) : false;
    if (!livedAftermath) await this.playJourneyCinematic(boisClairAftermath, result.victory ? 'Conséquence' : 'Défaite');
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      const bossConfig = anyCombatConfig(result.combatId);
      if (bossConfig?.postCombatDialogueId) {
        await this.playDialogue(bossConfig.postCombatDialogueId, node.label);
        if (this.pendingCombatId) {
          await this.flushPendingCombat(node);
          return;
        }
      }
      // The route ending reads the resolved result only through its existing presentation trigger (set 1.14.0); its
      // living tableau takes the place of the static Journey still, which stays its fallback.
      const routeEnding = resolveCin6bLionTrialEnding(result.combatId, result.victory, this.state.flags)
        ?? resolveCin6aSerpentEnding(result.combatId, result.victory, this.state.flags);
      const livedEnding = routeEnding ? await this.playLivingTableau(routeEnding, 'epilogue') : false;
      if (!livedEnding) await this.playJourneyCinematic(routeEnding, 'Épilogue');
      await this.playDialogue(plateauEpilogueDialogueId(this.state));
      await this.enterCampaignPresentation();
      return;
    }
    const combatConfig = anyCombatConfig(result.combatId);
    if (combatConfig?.postCombatDialogueId) {
      await this.playDialogue(combatConfig.postCombatDialogueId, node.label);
      if (this.pendingCombatId) {
        await this.flushPendingCombat(node);
        return;
      }
    }
    if (await this.playPostNodeNarrative(node.id, node)) return;
    await this.enterCampaignPresentation();
  }

  private markResolved(nodeId: string): void {
    if (!this.state.resolvedNodeIds.includes(nodeId)) this.state.resolvedNodeIds.push(nodeId);
  }

  private async openManagement(
    tab: 'clan' | 'inventory' | 'shop' | 'skills',
    shopId?: string,
    shopWallet: 'temporary' | 'permanent' = 'temporary',
    returnToTravel = true,
  ): Promise<void> {
    if (this.mode !== 'RESULT' && this.mode !== 'TRAVEL' && this.mode !== 'JOURNEY' && this.mode !== 'NARRATIVE') return;
    this.setMode('MANAGEMENT');
    await this.management.open(tab, shopId, shopWallet);
    this.saves.saveAuto(this.state);
    if (returnToTravel) {
      // Only TravelView's own Company button reaches this branch; Journey rebuilds its boundary.
      this.showPoiMap();
      this.saves.saveAuto(this.state);
    }
  }

  private async startNewChronicle(): Promise<void> {
    let prologuePromise: Promise<void> | null = null;
    await sceneTransition.run({
      variant: 'launch',
      label: 'Une chronique s’éveille',
      task: async () => {
        this.saves.clear();
        this.state = createInitialState();
        this.applyMotionPreference();
        this.state.flags.prologueSeen = false;
        try {
          localStorage.removeItem('rpg-tutorial-seen');
          localStorage.removeItem('rpg-boss-tutorial-seen');
        } catch {}
        this.saves.saveAuto(this.state);
        this.chrome.replaceChildren();
        this.setMode('PROLOGUE');
        this.canvas.hidden = true;
        prologuePromise = this.prologue.open({ reducedMotion: this.state.settings.reducedGraphics });
        await this.prologue.ready;
      },
    });
    await this.playOpening(prologuePromise);
  }

  /** `prologueSeen` reaches the disk with the map's first save: a reload anywhere in here resumes at the first panel. */
  private async playOpening(prologue: Promise<void> | null): Promise<void> {
    await this.prologue.ready;
    this.prologue.start();
    await prologue;
    this.state.flags.prologueSeen = true;
    await this.playDialogue('acte_ouverture');
    if (this.usesJourneyPresentation()) {
      await this.playDialogue('camp_departure', 'Camp du Lion', { cinematicId: 'camp_departure' });
    }
    await this.enterCampaignPresentation();
  }

  private restoreAfterDefeat(): void {
    const preference = this.state.settings.reducedGraphics;
    const restored = this.saves.loadRecovery(this.state);
    if (restored) { this.state = restored; this.state.settings.reducedGraphics = preference; }
    this.pendingCombatId = null;
    this.combat.close(); this.poiMap.close(); this.poiEncounter.close();
    this.disposeJourney(); this.disposeNarrativeStage(); this.exploration.close();
    this.setMode('RESULT'); this.canvas.hidden = true;
    delete document.body.dataset.campaignSurface;
    this.chrome.innerHTML = `<section class="title-screen title-screen--recovery ui-screen" aria-labelledby="defeat-title"><h1 id="defeat-title">Défaite</h1><p class="title-screen__lead">${restored ? 'La dernière sauvegarde de cette partie a été rechargée. Les changements non sauvegardés ont été annulés.' : 'Aucune sauvegarde valide de cette partie ne peut être rechargée. Les sauvegardes existantes sont conservées.'}</p><div class="title-screen__actions">${restored ? '<button type="button" data-action="resume-save">Reprendre la sauvegarde</button>' : ''}<button type="button" data-action="defeat-menu">Retour au menu</button></div></section>`;
    this.chrome.querySelector<HTMLButtonElement>('[data-action="resume-save"]')?.addEventListener('click', () => {
      if (this.mode !== 'RESULT') return;
      this.setMode('TRAVEL'); this.chrome.replaceChildren();
      void this.resumeSavedCampaign();
    });
    this.chrome.querySelector('[data-action="defeat-menu"]')?.addEventListener('click', () => this.returnToTitle());
    this.chrome.querySelector<HTMLButtonElement>('button')?.focus();
  }

  private async continueChronicle(): Promise<void> {
    await sceneTransition.run({
      variant: 'launch',
      label: 'La chronique reprend',
      task: async () => {
        // OD-2026-11-11-E (final audit B9): the most recent of the automatic and manual saves.
        this.state = this.saves.loadLatest() ?? createInitialState();
        this.applyMotionPreference();
        this.prologue.close();
        this.exploration.close();
        this.combat.close();
        this.poiMap.close();
        this.disposeJourney();

        // Neutral holding mode: the presentation is chosen only after the resume profile is known,
        // so a reload never mounts a campaign surface it is about to replace.
        this.setMode('RESULT');
        this.canvas.hidden = true;
        this.chrome.replaceChildren();

      },
    });
    await this.resumeSavedCampaign();
  }

  private async resumeSavedCampaign(): Promise<void> {
    if (this.state.flags.prologueSeen === false) {
      this.setMode('PROLOGUE');
      await this.playOpening(this.prologue.open({ reducedMotion: this.state.settings.reducedGraphics }));
      return;
    }
    const current = getRunNode(this.state.run);
    if(this.state.run.poiExpedition?.encounter){await this.presentPoiElite();return;}
    const pendingFinaleCombat = pendingPlateauFinaleCombat(this.state);
    // Set 1.20.0 (post-demo Lot 4): a save made during the Tournament resumes on its board, never on the capital's POI.
    const inTournament = runPlateauId(this.state) === 'finale' && !isTournamentComplete(this.state);
    if (
      current && !inTournament
      // Set 1.20.0: a post-demo plateau's first POI is a scene of its own, resumed like any other unresolved POI.
      && (current.depth > 0 || runPlateauId(this.state) !== 'lion')
      && (pendingFinaleCombat !== null || (!this.state.resolvedNodeIds.includes(current.id)
        && !isPoiNeutralized(this.state, current.id)
        && !this.state.run.bypassedRouteNodeIds?.includes(current.id)))
    ) {
      // Unresolved node or a durable pending finale boss: resume gameplay directly, never replay a
      // committed route choice just to show a cinematic.
      await this.resolveRunNode(current, true);
      return;
    }
    await this.enterCampaignPresentation();
  }

  private setMode(mode: AppMode, surface: { mood?: NarrativeMood; ambience?: string } = {}): void {
    this.soundSettings.close();
    // Music follows the presentation surface and the scene's mood only; combat picks combat or boss itself
    // (CombatBridge). It is optional presentation: a failure never blocks the transition.
    try {
      const music = surface.mood ?? MODE_MUSIC[mode];
      if (music) this.uiSounds.setMusicContext(music);
      if (mode !== 'COMBAT' && mode !== 'MANAGEMENT') this.uiSounds.setMusicScene(surface.ambience ?? MODE_AMBIENCE[mode] ?? null);
    } catch { /* silent */ }
    if (mode !== 'NARRATIVE' && mode !== 'JOURNEY') this.statusHud?.hide();
    this.mode = mode;
    document.body.dataset.mode = mode.toLowerCase();
    // A curtain held over a fight's exit lifts once the next surface has painted (final audit 2026-11-11, A5).
    if (mode !== 'COMBAT' && sceneTransition.isHeld) sceneTransition.releaseWhenReady();
    document.body.classList.remove('mode-entering');
    void document.body.offsetWidth;
    document.body.classList.add('mode-entering');
  }

}
