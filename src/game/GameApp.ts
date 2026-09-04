import { combatConfigs } from './content';
import { createInitialState, SaveRepository } from './store';
import type { CombatConfig, CombatResult, GameState, NarrativeEffect, RunNode, UnitInstance } from './types';
import { createUnitInstance, getItemCategory, toCombatant } from './catalog';
import { applyCombatProgress } from './combatProgress';
import {
  addTemporaryLoot, enterRunNode, failRunToCheckpoint,
  getAvailableRunNodes, getRunNode, secureRunLoot,
} from './runSystem';
import { changeReputation, getReputationRule } from './reputation';
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
import { DialogueView } from '../ui/DialogueView';
import { ManagementView } from '../ui/ManagementView';
import { TravelView } from '../ui/TravelView';
import { ExplorationView } from '../ui/ExplorationView';
import { PrologueView } from '../ui/PrologueView';
import { sceneTransition } from '../ui/SceneTransition';
import type { TransitionVariant } from '../ui/SceneTransition';
import { CinematicPlayer } from '../cinematics/CinematicPlayer';
import { CinematicRegistry } from '../cinematics/CinematicRegistry';
import { resolveVideoCinematicTrigger } from '../cinematics/CinematicTriggers';
import type { VideoCinematicTrigger } from '../cinematics/CinematicTypes';
import {
  formatJourneyQaOutcome,
  JOURNEY_QA_SCENARIOS,
  runJourneyQaScenario,
} from '../cinematics/JourneyQaScenarios';
import { JourneyCampaignBoundary } from '../journey/JourneyCampaignBoundary';
import { resolveCampaignPresentation } from '../journey/JourneyPresentationPolicy';
import { evaluateRouteCommit } from '../journey/RouteCommitGuard';
import type { JourneySecondaryActionPresentation } from '../cinematics/JourneyTypes';
type AppMode = 'TITLE' | 'PROLOGUE' | 'TRAVEL' | 'JOURNEY' | 'NARRATIVE' | 'MANAGEMENT' | 'COMBAT' | 'RESULT' | 'QA';

type QaPartyMode = 'campaign' | 'full';
type QaSkillMode = 'normal' | 'all';
type QaApMode = 'normal' | 'full';
type QaHpMode = 'normal' | 'restored';
type QaInventoryMode = 'campaign' | 'qa';
type QaGraphicsMode = 'normal' | 'reduced';
type QaDeployMode = 'normal' | 'full';

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
  private mode: AppMode = 'TITLE';
  private state: GameState = createInitialState();
  private readonly saves = new SaveRepository();
  private readonly chrome = document.createElement('div');
  private readonly dialogue: DialogueView;
  private readonly management: ManagementView;
  private readonly combat: CombatBridge;
  private readonly travel: TravelView;
  private readonly exploration: ExplorationView;
  private readonly prologue: PrologueView;
  private readonly cinematicRegistry = new CinematicRegistry();
  private readonly cinematicPlayer = new CinematicPlayer(this.cinematicRegistry);
  private pendingCombatId: string | null = null;
  private pendingChapterBeatId: string | null = null;
  // Presentation policy only. TravelView stays the production default; Journey is DEV-selected.
  private readonly campaignPresentation = resolveCampaignPresentation({
    search: window.location.search,
    dev: import.meta.env.DEV,
  });
  private journeyBoundary: JourneyCampaignBoundary | null = null;
  // Latched after a catastrophic Journey failure so the fallback can never recurse into Journey.
  private journeyUnavailable = false;
  private routeCommitInFlight = false;
  private readonly qaEnabled = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('qa') === '1';
  private readonly cinematicQaEnabled = this.qaEnabled
    && new URLSearchParams(window.location.search).get('cinematic') === '1';
  private qaParams: QaParams | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.chrome.className = 'game-chrome';
    this.root.append(this.chrome);
    this.dialogue = new DialogueView({
      root,
      getState: () => this.state,
      applyEffects: (effects) => this.applyEffects(effects),
    });
    this.management = new ManagementView({
      root,
      getState: () => this.state,
      onChange: () => {
        this.saves.saveAuto(this.state);
      },
    });
    this.combat = new CombatBridge(root);
    this.travel = new TravelView({
      root,
      getState: () => this.state,
      onSelect: (node) => this.chooseRunNode(node),
      onOpenClan: () => void this.openManagement('clan'),
      onSave: () => this.saves.saveManual(this.state),
      onOpenMenu: () => this.renderTitle(),
    });
    this.exploration = new ExplorationView({ root });
    this.prologue = new PrologueView(root);
  }

  async start(): Promise<void> {
    await this.cinematicRegistry.load();
    if (this.cinematicQaEnabled) this.renderCinematicQa();
    else this.renderTitle();
  }

  dispose(): void {
    this.disposeJourney();
    this.cinematicPlayer.dispose();
    this.combat.dispose();
    this.travel.close();
    this.exploration.close();
    this.prologue.close();
  }

  private renderTitle(): void {
    this.disposeJourney();
    this.setMode('TITLE');
    this.travel.close();
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
    this.chrome.querySelector('[data-action="qa"]')?.addEventListener('click', () => this.renderQaLab());
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
    this.travel.close();
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
    this.travel.close();
    this.exploration.close();
    this.prologue.close();
    this.combat.close();
    this.canvas.hidden = true;
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
    if (scenario === 'real-hold') {
      const held = await this.cinematicPlayer.playHeld('lion_judgement', {
        allowSkip: false,
        muted: true,
        reducedMotion: false,
        timeoutMs: 12_000,
        stallTimeoutMs: 5_000,
      });
      result = held.result;
      if (held.surface) {
        const video = held.surface.querySelector<HTMLVideoElement>('.cinematic-overlay__video');
        if (video && held.result.reason === 'ended') {
          const sample = document.createElement('canvas');
          sample.width = 640;
          sample.height = 360;
          sample.dataset.cinematicFrameSample = 'true';
          sample.setAttribute('aria-label', 'Échantillon Chromium de la frame finale décodée');
          sample.style.cssText = 'position:absolute;left:clamp(18px,4vw,56px);bottom:clamp(18px,4vw,48px);width:min(40vw,640px);height:auto;z-index:5;border:1px solid rgba(226,193,112,.75);box-shadow:0 14px 50px rgba(0,0,0,.55)';
          const context = sample.getContext('2d', { willReadFrequently: true });
          context?.drawImage(video, 0, 0, sample.width, sample.height);
          if (context) {
            const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
            let minimum = 255;
            let maximum = 0;
            let total = 0;
            for (let index = 0; index < pixels.length; index += 4) {
              const luminance = Math.round((pixels[index]! + pixels[index + 1]! + pixels[index + 2]!) / 3);
              minimum = Math.min(minimum, luminance);
              maximum = Math.max(maximum, luminance);
              total += luminance;
            }
            sample.dataset.luminance = `${minimum}/${Math.round(total / (pixels.length / 4))}/${maximum}`;
          }
          held.surface.append(sample);
        }
        const release = document.createElement('button');
        release.type = 'button';
        release.className = 'cinematic-overlay__control';
        release.dataset.cinematicRelease = 'true';
        release.textContent = 'Continuer / Release';
        release.style.cssText = 'position:absolute;right:clamp(18px,4vw,56px);bottom:clamp(18px,4vw,48px);z-index:5';
        release.addEventListener('click', () => {
          held.release();
          const residue = document.querySelectorAll('.cinematic-overlay, .cinematic-overlay__video, [data-cinematic-frame-sample]').length;
          this.renderCinematicQa(`Vidéo réelle : ${held.result.reason} · played ${held.result.played} · résidu DOM ${residue}.`);
        }, { once: true });
        held.surface.append(release);
        release.focus();
        return;
      }
    } else if (scenario === 'missing') result = await this.cinematicPlayer.play('missing-cinematic', { reducedMotion: false });
    else if (scenario === 'reduced') result = await this.cinematicPlayer.play('qa-placeholder', { reducedMotion: true });
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
    const id = resolveVideoCinematicTrigger(trigger);
    if (!id) return undefined;
    return () => this.cinematicPlayer.play(id, { reducedMotion: this.state.settings.reducedGraphics });
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
    const cinematicId = resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId });
    if (cinematicId) {
      await sceneTransition.run({
        variant: config.encounterRank === 'boss' ? 'boss' : 'combat',
        label: config.encounterLabel,
        interlude: () => this.cinematicPlayer.play(cinematicId, { reducedMotion: p.graphics === 'reduced' }),
        task: async () => undefined,
        holdMs: 0,
      });
    }
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
  private async enterCampaignPresentation(): Promise<void> {
    if (this.usesJourneyPresentation()) {
      await this.enterJourney();
      return;
    }
    await this.enterTravel();
  }

  private usesJourneyPresentation(): boolean {
    return this.campaignPresentation === 'journey' && !this.journeyUnavailable;
  }

  private async enterTravel(): Promise<void> {
    await sceneTransition.run({
      variant: 'travel',
      task: async () => {
        this.showTravel();
        this.saves.saveAuto(this.state);
      },
    });
  }

  private showTravel(): void {
    this.disposeJourney();
    this.setMode('TRAVEL');
    this.canvas.hidden = true;
    this.chrome.replaceChildren();
    this.travel.open();
  }

  private async enterJourney(): Promise<void> {
    await sceneTransition.run({
      variant: 'travel',
      task: async () => {
        this.travel.close();
        this.setMode('JOURNEY');
        this.canvas.hidden = true;
        this.chrome.replaceChildren();
        this.saves.saveAuto(this.state);
      },
    });
    await this.runJourneyBoundary();
  }

  /**
   * Presents the current campaign boundary through the Journey runtime until the player either
   * commits a route, leaves for the title, or the presentation itself fails.
   */
  private async runJourneyBoundary(): Promise<void> {
    let rejections = 0;
    while (this.mode === 'JOURNEY') {
      const current = getRunNode(this.state.run);
      const available = getAvailableRunNodes(this.state);
      let outcome;
      try {
        outcome = await this.ensureJourneyBoundary().present({
          currentNodeId: current?.id ?? null,
          currentContentId: current?.contentId ?? null,
          ...(current?.label ? { currentLabel: current.label } : {}),
          available,
          secondary: JOURNEY_SECONDARY_ACTIONS,
          reducedMotion: this.state.settings.reducedGraphics,
        });
      } catch (error) {
        await this.failJourneyToTravel(error);
        return;
      }
      if (outcome.kind === 'node' && outcome.id) {
        if (await this.commitRunNodeChoice(outcome.id)) return;
        rejections += 1;
        if (rejections >= JOURNEY_MAX_REJECTIONS) {
          await this.failJourneyToTravel(new Error('Journey route commit repeatedly rejected.'));
          return;
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

  /**
   * Journey system failure — distinct from a missing clip, which CIN-1 already degrades safely.
   * Journey is latched off for the rest of the session so the fallback cannot recurse.
   */
  private async failJourneyToTravel(error: unknown): Promise<void> {
    console.error('[Journey] Presentation failed; falling back to TravelView.', error);
    this.disposeJourney();
    this.journeyUnavailable = true;
    await this.enterTravel();
  }

  private ensureJourneyBoundary(): JourneyCampaignBoundary {
    this.journeyBoundary ??= new JourneyCampaignBoundary({
      player: this.cinematicPlayer,
      registry: this.cinematicRegistry,
    });
    return this.journeyBoundary;
  }

  private disposeJourney(): void {
    this.journeyBoundary?.dispose();
    this.journeyBoundary = null;
  }

  /** Returns true when the same Journey boundary should be presented again. */
  private async handleJourneySecondary(actionId: string): Promise<boolean> {
    if (actionId === 'SAVE') {
      this.saves.saveManual(this.state);
      return true;
    }
    if (actionId === 'COMPANY') {
      // Option B: the boundary is deterministically rebuilt from unchanged route state afterwards.
      await this.openManagement('clan', undefined, 'temporary', false);
      if (this.mode !== 'JOURNEY') this.setMode('JOURNEY');
      return true;
    }
    if (actionId === 'MENU') {
      this.renderTitle();
      return false;
    }
    return true;
  }

  private async chooseRunNode(node: RunNode): Promise<void> {
    await this.commitRunNodeChoice(node.id);
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
    this.routeCommitInFlight = true;
    try {
      this.travel.close();
      this.disposeJourney();
      this.setMode('RESULT');
      const entered = enterRunNode(this.state.run, node.id);
      if (!entered) {
        await this.enterCampaignPresentation();
        return false;
      }
      this.state.currentNodeId = entered.id;
      this.state.visitedNodeIds = [...this.state.run.visitedNodeIds];
      if (
        ['event', 'mystery', 'recruitment'].includes(entered.type)
        && !this.state.seenUniqueEvents.includes(entered.contentId)
      ) {
        this.state.seenUniqueEvents.push(entered.contentId);
      }
      this.state.stepCounter += 1;
      await this.resolveRunNode(entered, false);
      return true;
    } finally {
      this.routeCommitInFlight = false;
    }
  }

  private async resolveRunNode(node: RunNode, initial: boolean): Promise<void> {
    if (node.type === 'refuge') {
      const securedFlag = `refugeSecured:${node.id}`;
      let securedGold = 0;
      if (!this.state.flags[securedFlag]) {
        if (getReputationRule(this.state.reputation).min >= 60) {
          addTemporaryLoot(this.state.run, { category: 'consumables', itemId: 'potion', quantity: 1 });
        }
        securedGold = secureRunLoot(this.state).gold;
        this.state.flags[securedFlag] = true;
      }
      let refugeMessage = '';
      while (true) {
        this.setMode('NARRATIVE');
        const restCost = getRestCost(this.state);
        const woundedCount = getWoundedUnitCount(this.state);
        const action = await this.exploration.open(getReputationRule(this.state.reputation).label, securedGold, {
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
          refugeMessage = restUnits(this.state)
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
      await this.playPostNodeNarrative(node.id);
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
          await this.playPostNodeNarrative(node.id);
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
      await this.playPostNodeNarrative(node.id);
      await this.enterCampaignPresentation();
    }
  }

  private async playDialogue(dialogueId: string, fallbackLabel?: string): Promise<void> {
    const resolved = resolveGameDialogue(dialogueId, this.state);
    if (!resolved) throw new Error(`Missing dialogue '${dialogueId}'.`);
    const { sequence } = resolved;
    let playPromise: Promise<void> | null = null;
    const interlude = this.cinematicInterlude({ hook: 'beforeDialogue', dialogueId });
    await sceneTransition.run({
      variant: 'dialogue',
      label: sequence.title ?? fallbackLabel ?? '',
      interlude,
      ...(interlude ? { holdMs: 0 } : {}),
      task: async () => {
        this.setMode('NARRATIVE');
        playPromise = this.dialogue.play(sequence);
      },
    });
    await playPromise;
    const chapterBeatId = this.pendingChapterBeatId;
    this.pendingChapterBeatId = null;
    if (chapterBeatId) await this.playStandaloneCinematic({ hook: 'chapterBeat', beatId: chapterBeatId }, sequence.title ?? fallbackLabel ?? '');
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

  private async playPostNodeNarrative(nodeId: string): Promise<void> {
    await this.maybePlayATEs(nodeId);
    await this.maybePlayReputationEvent(nodeId);
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
            addTemporaryLoot(this.state.run, { gold: effect.amount });
          } else {
            const cost = Math.abs(effect.amount);
            const fromLoot = Math.min(cost, this.state.run.temporaryLoot.gold);
            this.state.run.temporaryLoot.gold -= fromLoot;
            this.state.gold = Math.max(0, this.state.gold - (cost - fromLoot));
          }
          break;
        case 'addReputation':
          changeReputation(this.state, effect.amount, 'narrative');
          break;
        case 'addItem':
          {
            const category = getItemCategory(effect.itemId) ?? 'consumables';
            addTemporaryLoot(this.state.run, {
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
    const config = combatConfigs.get(combatId);
    if (!config) throw new Error(`Missing combat '${combatId}'.`);
    if (config.preCombatDialogueId) {
      await this.playDialogue(config.preCombatDialogueId, node.label);
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
    const interlude = this.cinematicInterlude({ hook: 'beforeCombat', combatId });
    await sceneTransition.run({
      variant,
      label: config.encounterLabel,
      interlude,
      ...(interlude ? { holdMs: 0 } : {}),
      task: async () => {
        this.setMode('COMBAT');
        this.travel.close();
        this.chrome.replaceChildren();
        const combatSession = this.combat.start({
          config,
          clan: combatants,
          inventory: this.state.inventory.consumables,
          preferredUnitIds: this.state.deployment.unitIds,
          reducedGraphics: this.state.settings.reducedGraphics,
          devQa: false,
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
      this.state = this.saves.loadAuto() ?? this.state;
      failRunToCheckpoint(this.state);
      this.saves.saveAuto(this.state);
      await sceneTransition.run({
        variant: 'result',
        label: 'Défaite',
        task: async () => {},
      });
      await this.enterCampaignPresentation();
      return;
    }
    const encounterLimit = combatConfigs.get(result.combatId)?.maxPlayerUnits ?? 4;
    applyCombatProgress(this.state, result, encounterLimit);
    this.state.currentNodeId = node.id;
    addTemporaryLoot(this.state.run, { gold: rewards.gold });
    for (const [itemId, quantity] of Object.entries(rewards.materials ?? {})) {
      addTemporaryLoot(this.state.run, { category: 'materials', itemId, quantity });
    }
    changeReputation(this.state, rewards.reputation, `combat:${result.combatId}`);
    Object.assign(this.state.flags, lionBossVictoryFacts(result.combatId));
    this.markResolved(node.id);
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
    await this.playPostNodeNarrative(node.id);
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
    if (this.mode !== 'RESULT' && this.mode !== 'TRAVEL' && this.mode !== 'JOURNEY') return;
    this.setMode('MANAGEMENT');
    await this.management.open(tab, shopId, shopWallet);
    this.saves.saveAuto(this.state);
    if (returnToTravel) {
      // Only TravelView's own Company button reaches this branch; Journey rebuilds its boundary.
      this.showTravel();
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
    await this.enterCampaignPresentation();
  }

  private async continueChronicle(): Promise<void> {
    let current: RunNode | undefined;
    await sceneTransition.run({
      variant: 'launch',
      label: 'La chronique reprend',
      task: async () => {
        this.state = this.saves.loadAuto() ?? this.saves.loadManual() ?? createInitialState();
        this.prologue.close();
        this.exploration.close();
        this.combat.close();
        this.travel.close();
        this.disposeJourney();
        // Neutral holding mode: the presentation is chosen only after the resume profile is known,
        // so a reload never mounts a campaign surface it is about to replace.
        this.setMode('RESULT');
        this.canvas.hidden = true;
        this.chrome.replaceChildren();
        current = getRunNode(this.state.run);
      },
    });
    const pendingFinaleCombat = resolvePendingLionFinaleCombat(this.state.flags);
    if (
      current
      && current.depth > 0
      && (pendingFinaleCombat !== null || !this.state.resolvedNodeIds.includes(current.id))
    ) {
      // Unresolved node or a durable pending finale boss: resume gameplay directly, never replay a
      // committed route choice just to show a cinematic.
      await this.resolveRunNode(current, true);
      return;
    }
    await this.enterCampaignPresentation();
  }

  private setMode(mode: AppMode): void {
    this.mode = mode;
    document.body.dataset.mode = mode.toLowerCase();
    document.body.classList.remove('mode-entering');
    void document.body.offsetWidth;
    document.body.classList.add('mode-entering');
  }

}
