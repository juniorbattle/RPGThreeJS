import { campaignNodes, combatConfigs, dialogues, mysteryPools } from './content';
import { chooseMysteryEvent, tickCombatCooldowns } from './mystery';
import { buildCampaignAdjacency } from './campaignNavigation';
import { createInitialState, SaveRepository } from './store';
import type { CampaignNode, CombatResult, GameState, NarrativeEffect } from './types';
import { createUnitInstance, getItemCategory, toCombatant } from './catalog';
import { applyCombatProgress } from './combatProgress';
import { CombatBridge } from '../combat/CombatBridge';
import { DialogueView } from '../ui/DialogueView';
import { ManagementView } from '../ui/ManagementView';
import { WorldMap } from '../world/WorldMap';

type AppMode = 'TITLE' | 'WORLD_MAP' | 'NARRATIVE' | 'MANAGEMENT' | 'COMBAT' | 'RESULT';

export class GameApp {
  private mode: AppMode = 'TITLE';
  private state: GameState = createInitialState();
  private readonly saves = new SaveRepository();
  private readonly chrome = document.createElement('div');
  private readonly labelLayer = document.createElement('div');
  private readonly dialogue: DialogueView;
  private readonly management: ManagementView;
  private readonly combat: CombatBridge;
  private world: WorldMap | null = null;
  private pendingCombatId: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.chrome.className = 'game-chrome';
    this.labelLayer.className = 'map-labels';
    this.root.append(this.labelLayer, this.chrome);
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
        this.renderHud();
      },
    });
    this.combat = new CombatBridge(root);
  }

  async start(): Promise<void> {
    this.renderTitle();
  }

  private renderTitle(): void {
    this.setMode('TITLE');
    this.canvas.hidden = true;
    this.labelLayer.hidden = true;
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
        <small>Combat tactique · choix narratifs · conséquences persistantes</small>
      </section>
    `;
    this.chrome.querySelector('[data-action="new"]')?.addEventListener('click', () => {
      this.saves.clear();
      this.state = createInitialState();
      this.saves.saveAuto(this.state);
      this.enterMap(true);
    });
    this.chrome.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
      this.state = this.saves.loadAuto() ?? this.saves.loadManual() ?? createInitialState();
      this.enterMap(false);
      const current = campaignNodes.find((node) => node.id === this.state.currentNodeId);
      const randomCombatCompleted = current?.type === 'random-combat'
        && this.state.combatCooldowns[current.id] !== undefined;
      if (current && !this.state.resolvedNodeIds.includes(current.id) && !randomCombatCompleted) {
        void this.resolveNode(current, true);
      }
    });
  }

  private enterMap(triggerCurrent: boolean): void {
    this.setMode('WORLD_MAP');
    this.ensureWorld();
    this.world?.setVisible(true);
    this.renderHud();
    this.world?.update(this.state);
    if (triggerCurrent) {
      const current = campaignNodes.find((node) => node.id === this.state.currentNodeId);
      if (current) void this.resolveNode(current, true);
    }
  }

  private ensureWorld(): void {
    if (this.world) return;
    this.world = new WorldMap({
      canvas: this.canvas,
      labelLayer: this.labelLayer,
      nodes: campaignNodes,
      onSelect: (node) => void this.selectNode(node),
    });
  }

  private async selectNode(node: CampaignNode): Promise<void> {
    if (this.mode !== 'WORLD_MAP') return;
    const current = campaignNodes.find((candidate) => candidate.id === this.state.currentNodeId);
    const adjacent = buildCampaignAdjacency(campaignNodes).get(current?.id ?? '');
    if (!adjacent?.has(node.id)) return;
    if (this.state.combatCooldowns[node.id] !== undefined) return;
    const revisiting = this.state.visitedNodeIds.includes(node.id);
    this.setMode('RESULT');
    await this.world?.travelTo(node);
    this.state.currentNodeId = node.id;
    if (!revisiting) this.state.visitedNodeIds.push(node.id);
    this.state.stepCounter += 1;
    tickCombatCooldowns(this.state);
    this.saves.saveAuto(this.state);
    this.renderHud();
    this.world?.update(this.state);
    await this.resolveNode(node, false, revisiting);
  }

  private async resolveNode(node: CampaignNode, initial: boolean, revisiting = false): Promise<void> {
    if (node.type === 'shop') {
      await this.openManagement('shop', node.shopId ?? 'valmir');
      this.markResolved(node.id);
      this.enterMap(false);
      return;
    }
    if (revisiting && this.state.resolvedNodeIds.includes(node.id)) {
      this.enterMap(false);
      return;
    }
    if (node.type === 'random-combat') {
      await this.startCombat(node.combatId!, node);
      return;
    }
    if (node.type === 'story-combat') {
      if (!this.state.resolvedNodeIds.includes(node.id)) await this.startCombat(node.combatId!, node);
      else this.enterMap(false);
      return;
    }
    if (node.type === 'mystery') {
      const pool = mysteryPools.get(node.mysteryPoolId ?? '');
      if (!pool) throw new Error(`Missing mystery pool '${node.mysteryPoolId}'.`);
      const event = chooseMysteryEvent(node.id, pool, this.state);
      this.saves.saveAuto(this.state);
      await this.playDialogue(event.dialogueId);
      if (this.pendingCombatId) {
        await this.flushPendingCombat(node);
      } else {
        this.markResolved(node.id);
        this.enterMap(false);
      }
      return;
    }
    if (node.type === 'boss') {
      await this.playDialogue(node.dialogueId!);
      const combatId = this.state.flags.missionSuccess === false ? 'lion_chief' : 'forest_patrol';
      await this.startCombat(combatId, node);
      return;
    }
    if (node.dialogueId && (!this.state.resolvedNodeIds.includes(node.id) || initial)) {
      await this.playDialogue(node.dialogueId);
      if (node.id === 'village') {
        this.markResolved(node.id);
        await this.flushPendingCombat(campaignNodes.find((candidate) => candidate.id === 'village-battle')!);
        return;
      }
      this.markResolved(node.id);
    }
    this.enterMap(false);
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
          this.state.gold += effect.amount;
          break;
        case 'addReputation':
          this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + effect.amount));
          break;
        case 'addItem':
          {
            const category = getItemCategory(effect.itemId) ?? 'consumables';
            this.state.inventory[category][effect.itemId] =
              (this.state.inventory[category][effect.itemId] ?? 0) + effect.quantity;
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

  private async flushPendingCombat(node: CampaignNode): Promise<void> {
    const combatId = this.pendingCombatId;
    this.pendingCombatId = null;
    if (combatId) await this.startCombat(combatId, node);
    else this.enterMap(false);
  }

  private async startCombat(combatId: string, node: CampaignNode): Promise<void> {
    const config = combatConfigs.get(combatId);
    if (!config) throw new Error(`Missing combat '${combatId}'.`);
    this.saves.saveAuto(this.state);
    this.setMode('COMBAT');
    this.world?.setVisible(false);
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
    node: CampaignNode,
    rewards: { gold: number; reputation: number },
  ): Promise<void> {
    if (!result.victory) {
      this.state = this.saves.loadAuto() ?? this.state;
      this.enterMap(false);
      return;
    }
    const encounterLimit = combatConfigs.get(result.combatId)?.maxPlayerUnits ?? 4;
    applyCombatProgress(this.state, result, encounterLimit);
    this.state.currentNodeId = node.id;
    this.state.gold += rewards.gold;
    this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + rewards.reputation));
    if (node.type === 'random-combat') {
      this.state.combatCooldowns[node.id] = this.state.stepCounter + 3;
    } else {
      this.markResolved(node.id);
    }
    this.saves.saveAuto(this.state);
    if (node.type === 'boss') {
      const ending = campaignNodes.find((candidate) => candidate.id === 'end')!;
      this.state.currentNodeId = ending.id;
      await this.resolveNode(ending, false);
      return;
    }
    this.enterMap(false);
  }

  private markResolved(nodeId: string): void {
    if (!this.state.resolvedNodeIds.includes(nodeId)) this.state.resolvedNodeIds.push(nodeId);
    this.saves.saveAuto(this.state);
  }

  private renderHud(): void {
    const current = campaignNodes.find((node) => node.id === this.state.currentNodeId);
    this.chrome.innerHTML = `
      <header class="map-hud">
        <div>
          <p class="eyebrow">Terres du Lion</p>
          <strong>${current?.label ?? 'Route inconnue'}</strong>
        </div>
        <div class="map-hud__stats">
          <span>🪙 ${this.state.gold}</span>
          <span>♜ ${this.state.reputation}%</span>
          <span>⚔ ${this.state.clan.members.length}</span>
        </div>
        <div class="map-hud__actions">
          <button type="button" data-action="clan">Compagnie</button>
          <button type="button" data-action="graphics">FX ${this.state.settings.reducedGraphics ? 'réduits' : 'HD'}</button>
          <button type="button" data-action="save">Sauvegarder</button>
          <button type="button" data-action="title">Menu</button>
        </div>
      </header>
      <aside class="objective-chip">
        <span>Objectif</span>
        <strong>${this.getObjective()}</strong>
      </aside>
    `;
    this.chrome.querySelector('[data-action="clan"]')?.addEventListener('click', () => {
      void this.openManagement('clan');
    });
    this.chrome.querySelector('[data-action="graphics"]')?.addEventListener('click', () => {
      this.state.settings.reducedGraphics = !this.state.settings.reducedGraphics;
      this.saves.saveAuto(this.state);
      this.world?.update(this.state);
      this.renderHud();
    });
    this.chrome.querySelector('[data-action="save"]')?.addEventListener('click', () => {
      this.saves.saveManual(this.state);
      const button = this.chrome.querySelector<HTMLButtonElement>('[data-action="save"]');
      if (button) button.textContent = 'Sauvegardé ✓';
    });
    this.chrome.querySelector('[data-action="title"]')?.addEventListener('click', () => this.renderTitle());
  }

  private async openManagement(tab: 'clan' | 'inventory' | 'shop', shopId?: string): Promise<void> {
    if (this.mode !== 'WORLD_MAP' && this.mode !== 'RESULT') return;
    this.setMode('MANAGEMENT');
    await this.management.open(tab, shopId);
    this.saves.saveAuto(this.state);
    this.enterMap(false);
  }

  private setMode(mode: AppMode): void {
    this.mode = mode;
    document.body.dataset.mode = mode.toLowerCase();
  }

  private getObjective(): string {
    if (this.state.endingId) return 'Le Sceau du Lion répond désormais à votre appel.';
    if (this.state.currentNodeId === 'camp' || this.state.currentNodeId === 'lion') {
      return 'Prêter serment au Chef du Lion.';
    }
    if (this.state.currentNodeId === 'mystery-a' || this.state.currentNodeId === 'random-a') {
      return 'Atteindre Valmir et reconnaître les routes occupées.';
    }
    if (this.state.currentNodeId === 'village') {
      return 'Résoudre la crise de Valmir puis affronter les pillards.';
    }
    if (this.state.currentNodeId === 'village-battle') {
      return 'Poursuivre vers les ruines et préparer le jugement final.';
    }
    if (this.state.currentNodeId === 'mystery-b') {
      return 'Découvrir le secret des ruines anciennes.';
    }
    if (this.state.currentNodeId === 'finale') {
      return 'Faire face au jugement du Chef du Lion.';
    }
    return 'Atteindre la Porte du Sceau.';
  }
}
