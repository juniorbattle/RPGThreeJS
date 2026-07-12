import { combatConfigs, dialogues } from './content';
import { createInitialState, SaveRepository } from './store';
import type { CombatConfig, CombatResult, GameState, NarrativeEffect, RunNode } from './types';
import { createUnitInstance, getItemCategory, toCombatant } from './catalog';
import { applyCombatProgress } from './combatProgress';
import {
  addTemporaryLoot, enterRunNode, failRunToCheckpoint,
  getRunNode, secureRunLoot,
} from './runSystem';
import { changeReputation, getReputationRule } from './reputation';
import { getRestCost, getWoundedUnitCount, restUnits } from './management';
import { CombatBridge } from '../combat/CombatBridge';
import { DialogueView } from '../ui/DialogueView';
import { ManagementView } from '../ui/ManagementView';
import { TravelView } from '../ui/TravelView';
import { ExplorationView } from '../ui/ExplorationView';
import { PrologueView } from '../ui/PrologueView';
type AppMode = 'TITLE' | 'PROLOGUE' | 'TRAVEL' | 'NARRATIVE' | 'MANAGEMENT' | 'COMBAT' | 'RESULT';

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
  private pendingCombatId: string | null = null;

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
    this.renderTitle();
  }

  private renderTitle(): void {
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
    this.chrome.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
      this.state = this.saves.loadAuto() ?? this.saves.loadManual() ?? createInitialState();
      this.chrome.replaceChildren();
      const current = getRunNode(this.state.run);
      if (current && current.depth > 0 && !this.state.resolvedNodeIds.includes(current.id)) void this.resolveRunNode(current, true);
      else this.enterTravel();
    });
  }

  private enterTravel(): void {
    this.setMode('TRAVEL');
    this.canvas.hidden = true;
    this.chrome.replaceChildren();
    this.travel.open();
  }

  private async chooseRunNode(node: RunNode): Promise<void> {
    if (this.mode !== 'TRAVEL') return;
    this.travel.close();
    this.setMode('RESULT');
    const entered = enterRunNode(this.state.run, node.id);
    if (!entered) {
      this.enterTravel();
      return;
    }
    this.state.currentNodeId = entered.id;
    this.state.visitedNodeIds = [...this.state.run.visitedNodeIds];
    this.state.stepCounter += 1;
    this.saves.saveAuto(this.state);
    await this.resolveRunNode(entered, false);
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
        this.saves.saveAuto(this.state);
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
          this.saves.saveAuto(this.state);
          continue;
        }
        this.setMode('RESULT');
        if (action === 'shop') await this.openManagement('shop', 'valmir', 'permanent', false);
        if (action === 'clan') await this.openManagement('clan', undefined, 'temporary', false);
        if (action === 'skills') await this.openManagement('skills', undefined, 'temporary', false);
      }
      this.markResolved(node.id);
      this.enterTravel();
      return;
    }
    if (node.type === 'shop') {
      await this.openManagement('shop', node.contentId);
      this.markResolved(node.id);
      this.enterTravel();
      return;
    }
    if (node.type === 'combat' || node.type === 'boss') {
      if (!combatConfigs.has(node.contentId)) {
        await this.playDialogue(node.contentId);
        if (this.pendingCombatId) await this.flushPendingCombat(node);
        else {
          this.markResolved(node.id);
          this.enterTravel();
        }
        return;
      }
      await this.startCombat(node.contentId, node);
      return;
    }
    if (!initial && this.state.resolvedNodeIds.includes(node.id)) {
      this.enterTravel();
      return;
    }
    await this.playDialogue(node.contentId);
    if (this.pendingCombatId) {
      await this.flushPendingCombat(node);
    } else {
      this.markResolved(node.id);
      this.enterTravel();
    }
  }

  private async playDialogue(dialogueId: string): Promise<void> {
    const sequence = dialogues.get(dialogueId);
    if (!sequence) throw new Error(`Missing dialogue '${dialogueId}'.`);
    this.setMode('NARRATIVE');
    await this.dialogue.play(sequence);
    this.saves.saveAuto(this.state);
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
          if (
            this.state.clan.members.length < this.state.clan.maxSize
            && !this.state.clan.members.some((unit) => unit.id === effect.unitId)
          ) {
            this.state.clan.members.push(createUnitInstance(effect.unitId));
          }
          break;
        case 'startCombat':
          this.pendingCombatId = effect.combatId;
          break;
        case 'finishChapter':
          this.state.endingId = effect.endingId;
          break;
      }
      this.saves.saveAuto(this.state);
    }
  }

  private async flushPendingCombat(node: RunNode): Promise<void> {
    const combatId = this.pendingCombatId;
    this.pendingCombatId = null;
    if (combatId) await this.startCombat(combatId, node);
    else this.enterTravel();
  }

  private async startCombat(combatId: string, node: RunNode): Promise<void> {
    const config = combatConfigs.get(combatId);
    if (!config) throw new Error(`Missing combat '${combatId}'.`);
    this.saves.saveAuto(this.state);
    this.setMode('COMBAT');
    this.travel.close();
    this.chrome.replaceChildren();
    const combatants = this.state.clan.members.map((unit) => toCombatant(unit));
    const result = await this.combat.play({
      config,
      clan: combatants,
      inventory: this.state.inventory.consumables,
      preferredUnitIds: this.state.deployment.unitIds,
      reducedGraphics: this.state.settings.reducedGraphics,
    });
    await this.resolveCombat(result, node, config.rewards);
  }

  private async resolveCombat(
    result: CombatResult,
    node: RunNode,
    rewards: CombatConfig['rewards'],
  ): Promise<void> {
    if (!result.victory) {
      this.state = this.saves.loadAuto() ?? this.state;
      failRunToCheckpoint(this.state);
      this.saves.saveAuto(this.state);
      this.enterTravel();
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
    this.markResolved(node.id);
    this.saves.saveAuto(this.state);
    if (node.type === 'boss') {
      this.state.run.status = 'completed';
      secureRunLoot(this.state);
      const bossConfig = combatConfigs.get(result.combatId);
      if (bossConfig?.postCombatDialogueId) {
        await this.playDialogue(bossConfig.postCombatDialogueId);
        if (this.pendingCombatId) {
          await this.flushPendingCombat(node);
          return;
        }
      }
      await this.playDialogue('epilogue');
      this.saves.saveAuto(this.state);
      this.enterTravel();
      return;
    }
    this.enterTravel();
  }

  private markResolved(nodeId: string): void {
    if (!this.state.resolvedNodeIds.includes(nodeId)) this.state.resolvedNodeIds.push(nodeId);
    this.saves.saveAuto(this.state);
  }

  private async openManagement(
    tab: 'clan' | 'inventory' | 'shop' | 'skills',
    shopId?: string,
    shopWallet: 'temporary' | 'permanent' = 'temporary',
    returnToTravel = true,
  ): Promise<void> {
    if (this.mode !== 'RESULT' && this.mode !== 'TRAVEL') return;
    this.setMode('MANAGEMENT');
    await this.management.open(tab, shopId, shopWallet);
    this.saves.saveAuto(this.state);
    if (returnToTravel) this.enterTravel();
  }

  private async startNewChronicle(): Promise<void> {
    this.saves.clear();
    this.state = createInitialState();
    this.state.flags.prologueSeen = false;
    this.saves.saveAuto(this.state);
    this.chrome.replaceChildren();
    this.setMode('PROLOGUE');
    this.canvas.hidden = true;
    if (!this.state.flags.prologueSeen) {
      await this.prologue.open();
      this.state.flags.prologueSeen = true;
      this.saves.saveAuto(this.state);
    }
    this.enterTravel();
  }

  private setMode(mode: AppMode): void {
    this.mode = mode;
    document.body.dataset.mode = mode.toLowerCase();
  }

}
