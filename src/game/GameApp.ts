import { combatConfigs } from './content';
import { createInitialState, SaveRepository } from './store';
import type { CombatConfig, CombatResult, DialogueSequence, GameState, NarrativeEffect, RunNode, UnitInstance } from './types';
import { createUnitInstance, getItemCategory, toCombatant, itemById } from './catalog';
import { applyCombatProgress } from './combatProgress';
import {
  creditRunReward, enterRunNode,
  getAvailableRunNodes, getRunNode, secureRunLoot,
  selectPoiMap, enterPoi, bypassPoi, isPoiNeutralized, settlePoiNavigation,
  commitPoiEliteFight, resolvePoiEliteVictory,
} from './runSystem';
import { createPoiChestAdapter } from './poiContentAdapters';
import { beginPoiEliteEncounter, retreatPoiElite, waitPoiTurn } from './poiExpedition';
import { LOT_E_ELITES } from '../campaign/LionPoiAuthoring';
import { PoiEncounterView } from '../ui/PoiEncounterView';
import { changeReputation, getReputationRule } from './reputation';
import { CampaignStatusHud, selectCampaignStatus } from '../ui/CampaignStatusHud';
import { CLAN_ANCHOR_DIALOGUES } from './campaignGrammarContent';
import { resolveCharacterUnitId } from '../render/CharacterVisualRegistry';
import {
  lionBossVictoryFacts,
  resolveLionFinaleExecution,
  resolvePendingLionFinaleCombat,
  resolveSelectedLionFinaleCombat,
} from './lionFinale';
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
import { UiSoundPlayer } from '../ui/UiSoundPlayer';
import { UiSoundSettings } from '../ui/UiSoundSettings';
import { ExplorationView } from '../ui/ExplorationView';
import { resolveRefugePresentation } from '../ui/RefugePresentation';
import { PrologueView } from '../ui/PrologueView';
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

type QaPartyMode = 'campaign' | 'full';
type QaSkillMode = 'normal' | 'all';
type QaApMode = 'normal' | 'full';
type QaHpMode = 'normal' | 'restored';
type QaInventoryMode = 'campaign' | 'qa';
type QaGraphicsMode = 'normal' | 'reduced';
type QaDeployMode = 'normal' | 'full';

interface NarrativeDialogueOptions {
  cinematicId?: string;
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
  { id: 'MENU', label: 'Menu' },
]);

/** Bounded re-presentations after a rejected commit, so a stale callback cannot spin forever. */
const JOURNEY_MAX_REJECTIONS = 3;

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
  private readonly prologue: PrologueView;
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
    this.soundSettings = new UiSoundSettings(root, this.uiSounds);
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
    this.combat = new CombatBridge(root, { player: this.uiSounds, openSettings: restore => this.soundSettings.open(restore), closeSettings: () => this.soundSettings.close() });
    this.exploration = new ExplorationView({ root, statusHud: this.statusHud, onSound: id => this.uiSounds.play(id) });
    this.poiEncounter = new PoiEncounterView(root, id => this.uiSounds.play(id));
    this.poiMap = new PoiMapView({root,
      onMove: id => this.choosePoi(id),
      onWait: () => this.waitOnPoi(),
      onFightElite: id => this.challengePoiElite(id),
      onBypass: id => this.ignorePoi(id),
      onCompany: () => void this.openPoiCompany(),
      onSave: () => {if(!this.routeCommitInFlight){this.saves.saveManual(this.state);this.uiSounds.play('saved');}},
      onSounds: () => this.soundSettings.open(),
      onSound: id => this.uiSounds.play(id),
      onMenu: () => {if(!this.routeCommitInFlight){this.uiSounds.play('back');this.renderTitle();}},
      onReducedMotion: () => {
        if(this.routeCommitInFlight)return;
        this.state.settings.reducedGraphics = !this.state.settings.reducedGraphics;
        this.uiSounds.play('confirm');
        this.showPoiMap();
        this.root.querySelector<HTMLButtonElement>('[data-poi-action="motion"]')?.focus();
      },
    });
    this.prologue = new PrologueView(root);
  }

  async start(): Promise<void> {
    await this.cinematicRegistry.load();
    if (this.cinematicQaEnabled) this.renderCinematicQa();
    else this.renderTitle();
  }

  dispose(): void {
    this.disposed = true;
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
        <p class="title-screen__lead">Un RPG tactique HD-2D où chaque serment laisse une trace.</p>
        <div class="title-screen__actions">
          <button type="button" data-action="new">Nouvelle chronique</button>
          <button type="button" data-action="continue" ${this.saves.hasSave() ? '' : 'disabled'}>Continuer</button>
          <button type="button" data-action="sounds">Sons</button>
          ${this.qaEnabled ? '<button type="button" class="title-screen__qa" data-action="qa">QA rencontres</button>' : ''}
        </div>
        <nav class="title-screen__nav">
          <span class="title-screen__nav-link">⚙ Options</span>
          <span class="title-screen__nav-sep"></span>
          <span class="title-screen__nav-link">📖 Crédits</span>
          <span class="title-screen__nav-sep"></span>
          <span class="title-screen__nav-link">◆ Feuille de route</span>
        </nav>
      </section>
    `;
    this.chrome.querySelector('[data-action="new"]')?.addEventListener('click', () => void this.startNewChronicle());
    this.chrome.querySelector('[data-action="continue"]')?.addEventListener('click', () => void this.continueChronicle());
    this.chrome.querySelector('[data-action="sounds"]')?.addEventListener('click', () => this.soundSettings.open());
    this.chrome.querySelector('[data-action="qa"]')?.addEventListener('click', () => this.renderQaLab());
    (this.chrome.querySelector<HTMLButtonElement>('[data-action="continue"]:not(:disabled)')
      ?? this.chrome.querySelector<HTMLButtonElement>('[data-action="new"]'))?.focus();
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
    const encounterCards = [...combatConfigs.values()].map((config) => `
      <button type="button" class="qa-lab__encounter qa-lab__encounter--${config.encounterRank}" data-qa-combat="${config.id}">
        <span>${config.encounterRank}</span>
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
          <button type="button" data-qa-back>Retour au titre</button>
        </header>
        <p class="qa-lab__lead">Mode QA isolé : aucun résultat, récompense, PV ou objet consommé n'est appliqué à la chronique.</p>
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
    const config = combatConfigs.get(combatId);
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
      && resolvePendingLionFinaleCombat(this.state.flags) === null;
  }

  private async enterCampaignPresentation(): Promise<void> {
    if(this.disposed)return;
    settlePoiNavigation(this.state);
    if(this.state.run.poiExpedition?.encounter){await this.presentPoiElite();return;}
    // Existing terminal and preparation presentation retain agency; navigation stays on the map.
    if (this.hasCompletedPoiChronicle()) {
      this.poiMap.close(); delete document.body.dataset.campaignSurface;
      await this.enterJourney(); return;
    }
    if (!this.journeyUnavailable && this.state.run.currentNodeId === 'lion-final-refuge'
      && this.state.resolvedNodeIds.includes('lion-final-refuge')) {
      this.poiMap.close(); delete document.body.dataset.campaignSurface;
      await this.enterJourney(); return;
    }
    this.showPoiMap();
  }

  private usesJourneyPresentation(): boolean {
    return this.campaignPresentation === 'journey' && !this.journeyUnavailable;
  }

  private showPoiMap(focusId = this.state.run.currentNodeId): void {
    this.activeNarrativeStage?.prepareGlobalHandoff();

    this.disposeJourney();
    this.disposeNarrativeStage();
    this.exploration.close();
    this.setMode('TRAVEL');
    document.body.dataset.campaignSurface = 'poi-map';
    this.canvas.hidden = true;
    this.chrome.replaceChildren();
    const model = selectPoiMap(this.state);
    this.saves.saveAuto(this.state);
    this.poiMap.open(model, focusId, this.state.settings.reducedGraphics);
  }

  private async choosePoi(nodeId: string): Promise<void> {
    if (this.mode !== 'TRAVEL' || this.routeCommitInFlight) return;
    this.routeCommitInFlight = true;
    const origin = this.state.run.currentNodeId;
    let entered: ReturnType<typeof enterPoi>;
    try {
      entered = enterPoi(this.state, nodeId);
      if (!entered) {this.showPoiMap();return;}
      this.saves.saveAuto(this.state);
      if(this.state.run.currentNodeId !== origin) this.uiSounds.play('travel-start');
      const travel = this.poiMap.animateTravel(origin, this.state.run.currentNodeId);
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

  private async waitOnPoi(): Promise<void> {
    if(this.mode!=='TRAVEL'||this.routeCommitInFlight)return;
    if(!waitPoiTurn(this.state,selectPoiMap(this.state)))return;
    this.uiSounds.play('confirm');
    this.saves.saveAuto(this.state);
    await this.enterCampaignPresentation();
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
    const def=LOT_E_ELITES.find(def=>def.id===encounter.eliteId)!;
    this.showPoiMap(encounter.targetNodeId);this.setMode('RESULT');
    this.saves.saveAuto(this.state);
    const choice=await this.poiEncounter.choose({title:def.label,
      description:encounter.kind==='rear'?'La menace a rejoint votre position. Combattez ou regagnez le point sûr précédent.'
        :'Ce passage est occupé. Combattez ou restez à votre position sûre.',
      lines:['Combat d’élite · Déploiement : 3 unités maximum.',
        `${def.combat.rewards.temporaryGold} or à la victoire. Le lieu conserve son propre contenu.`]});
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
    const config=combatConfigs.get(combatId)!;
    try{
      let session:ReturnType<CombatBridge['start']>|undefined;
      await sceneTransition.run({variant:'combat',label:config.encounterLabel,task:async()=>{
        this.setMode('COMBAT');this.chrome.replaceChildren();
        session=this.combat.start({config,clan:this.state.clan.members.filter(unit=>unit.currentHealth>0).map(unit=>toCombatant(unit)),
          inventory:this.state.inventory.consumables,preferredUnitIds:this.state.deployment.unitIds,
          reducedGraphics:this.state.settings.reducedGraphics});
        await session.ready;
      }});
      const result=await session!.result;
      this.combat.close();
      if(!result.victory){this.restoreAfterDefeat();return;}
      else if(!resolvePoiEliteVictory(this.state,encounterId,result))throw new Error('Stale elite combat result');
      // Durable reward and defeated fact commit together before any presentation can be interrupted.
      this.saves.saveAuto(this.state);
    }finally{this.routeCommitInFlight=false;}
    await this.enterCampaignPresentation();
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
        this.renderTitle();
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

  /** Returns true when the same Journey boundary should be presented again. */
  private async handleJourneySecondary(actionId: string): Promise<boolean> {
    if (actionId === 'SAVE') {
      this.saves.saveManual(this.state);
      this.uiSounds.play('saved');
      return true;
    }
    if (actionId === 'COMPANY') {
      // Option B: the boundary is deterministically rebuilt from unchanged route state afterwards.
      await this.openManagement('clan', undefined, 'temporary', false);
      if (this.mode !== 'NARRATIVE') this.setMode('NARRATIVE');
      return true;
    }
    if (actionId === 'MENU') {
      this.renderTitle();
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
      listAvailable: () => getAvailableRunNodes(this.state),
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
    const pendingFinale = node.type === 'boss' ? resolvePendingLionFinaleCombat(this.state.flags) : null;
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
      const gatheringId = CLAN_ANCHOR_DIALOGUES[node.id];
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
      let refugeMessage = '';
      while (true) {
        this.setMode('NARRATIVE');
        const restCost = getRestCost(this.state);
        const woundedCount = getWoundedUnitCount(this.state);
        const action = await this.exploration.open(presentation, getReputationRule(this.state.reputation).label, securedGold, {
          cost: restCost,
          woundedCount,
          canRest: woundedCount > 0 && this.state.gold >= restCost,
          message: refugeMessage,
        });
        refugeMessage = '';
        securedGold = 0;
        if (action === 'continue') break;
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
      const pendingFinaleCombat = resolvePendingLionFinaleCombat(this.state.flags);
      if (pendingFinaleCombat) {
        await this.startCombat(pendingFinaleCombat, node);
        return;
      }
    }
    if (node.type === 'combat' || node.type === 'boss') {
      if (!combatConfigs.has(node.contentId)) {
        await this.playDialogue(node.contentId, node.label);
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
    await this.playDialogue(node.contentId, node.label);
    if (this.pendingCombatId) {
      await this.flushPendingCombat(node);
    } else {
      this.markResolved(node.id);
      if (await this.playPostNodeNarrative(node.id, node)) return;
      await this.enterCampaignPresentation();
    }
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
      this.setMode('NARRATIVE');
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
      const firstPresentation = stepPresentation(sequence.steps[0]!);
      await stage.presentDialogueTableau(
        tableau?.stillImage ?? resolveDialogueBackdrop(sequence),
        firstPresentation.phaseId,
        tableauTransitionSource,
      );
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
          {
            const coreIds = new Set(['warrior', 'white_mage', 'dark_mage', 'archer']);
            const chapterRecruits = this.state.clan.members.filter((m) => !coreIds.has(m.definitionId)).length;
            if (
              chapterRecruits < 2
              && this.state.clan.members.length < this.state.clan.maxSize
              && !this.state.clan.members.some((unit) => unit.id === effect.unitId)
            ) {
              this.state.clan.members.push(createUnitInstance(effect.unitId));
            }
          }
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
              changeReputation(this.state, execution.reputationDelta, `lion-finale:${execution.trialCause ?? execution.route}`);
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
    const config = combatConfigs.get(combatId);
    if (!config) throw new Error(`Missing combat '${combatId}'.`);
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
    await sceneTransition.run({
      variant,
      label: config.encounterLabel,
      interlude,
      ...(interlude ? { holdMs: 0 } : {}),
      task: async () => {
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
        });
        resolveCombatStart(combatSession);
        await combatSession.ready;
      },
    });
    const combatSession = await combatStarted;
    const result = await combatSession.result;
    await this.resolveCombat(result, node, config.rewards);
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
    const encounterLimit = combatConfigs.get(result.combatId)?.maxPlayerUnits ?? 4;
    applyCombatProgress(this.state, result, encounterLimit);
    this.state.currentNodeId = node.id;
    creditRunReward(this.state, { gold: rewards.gold });
    for (const [itemId, quantity] of Object.entries(rewards.materials ?? {})) {
      creditRunReward(this.state, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, rewards.reputation, `combat:${result.combatId}`);
    Object.assign(this.state.flags, lionBossVictoryFacts(result.combatId));
    this.markResolved(node.id);
    await this.playJourneyCinematic(
      resolveCin6aBoisClairAftermath(result.combatId, result.victory, this.state.flags),
      result.victory ? 'Conséquence' : 'Défaite',
    );
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      const bossConfig = combatConfigs.get(result.combatId);
      if (bossConfig?.postCombatDialogueId) {
        await this.playDialogue(bossConfig.postCombatDialogueId, node.label);
        if (this.pendingCombatId) {
          await this.flushPendingCombat(node);
          return;
        }
      }
      await this.playJourneyCinematic(
        resolveCin6bLionTrialEnding(result.combatId, result.victory, this.state.flags)
          ?? resolveCin6aSerpentEnding(result.combatId, result.victory, this.state.flags),
        'Épilogue',
      );
      await this.playDialogue('epilogue');
      await this.enterCampaignPresentation();
      return;
    }
    const combatConfig = combatConfigs.get(result.combatId);
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
        this.state.flags.prologueSeen = false;
        try {
          localStorage.removeItem('rpg-tutorial-seen');
          localStorage.removeItem('rpg-boss-tutorial-seen');
        } catch {}
        this.saves.saveAuto(this.state);
        this.chrome.replaceChildren();
        this.setMode('PROLOGUE');
        this.canvas.hidden = true;
        prologuePromise = this.prologue.open();
      },
    });
    await prologuePromise;
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
    this.chrome.querySelector('[data-action="defeat-menu"]')?.addEventListener('click', () => this.renderTitle());
    this.chrome.querySelector<HTMLButtonElement>('button')?.focus();
  }

  private async continueChronicle(): Promise<void> {
    await sceneTransition.run({
      variant: 'launch',
      label: 'La chronique reprend',
      task: async () => {
        this.state = this.saves.loadAuto() ?? this.saves.loadManual() ?? createInitialState();
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
    const current = getRunNode(this.state.run);
    if(this.state.run.poiExpedition?.encounter){await this.presentPoiElite();return;}
    const pendingFinaleCombat = resolvePendingLionFinaleCombat(this.state.flags);
    if (
      current
      && current.depth > 0
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

  private setMode(mode: AppMode): void {
    this.soundSettings.close();
    if (mode !== 'NARRATIVE' && mode !== 'JOURNEY') this.statusHud?.hide();
    this.mode = mode;
    document.body.dataset.mode = mode.toLowerCase();
    document.body.classList.remove('mode-entering');
    void document.body.offsetWidth;
    document.body.classList.add('mode-entering');
  }

}
