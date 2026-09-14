/**
 * Phase 4C-GLM — DEV Labs
 *
 * Four labs (Sections 19-22):
 *   1. Character Lab — inspect a single character's animation/anchor/scale
 *   2. Tableau Lab — multi-character staging (1-4 actors)
 *   3. Strategic Lab — real combat runtime at strategic scale
 *   4. Combat Stage Lab — real combat runtime at combat-stage scale
 *
 * All labs are DEV-only.  Production never imports this module.
 * Uses real staging/combat components — no fake parallel implementations.
 */

import { SpriteFrameAnimationController } from '../../render/SpriteFrameAnimation';
import type { SpriteFrameAnimationDefinition } from '../../render/SpriteFrameAnimation';
import {
  isOptionCAnimationState,
  isOptionCSurface,
  isOptionCFacing,
  toSpriteFrameAnimationDefinition,
  validateCharacterDefinition,
  type OptionCAnimationState,
  type OptionCCharacterDefinition,
  type OptionCSurface,
  type OptionCFacing,
} from './OptionCCharacterSchema';
import { getIdentitySpec, PLAYABLE_ROSTER_CENSUS } from './OptionCCharacterRegistry';
import {
  getCharacterDefinition,
  getRegisteredCharacterIds,
  resolveCharacterAsset,
  resolveEnvironmentAsset,
} from './OptionCManifestResolver';
import {
  OptionCSelectiveLoader,
  NO_GLOBAL_OPTION_C_PRELOAD,
  type OptionCMemoryReport,
} from './OptionCSelectiveLoader';
import { ALL_PHASE4C_DEFINITIONS, SELECTED_BATCH, ensurePhase4cRegistered } from './OptionCCharacterDefinitions';

// ---------------------------------------------------------------------------
// Lab types
// ---------------------------------------------------------------------------

export type OptionCLabId = 'character' | 'tableau' | 'strategic' | 'combat-stage';

export interface OptionCLabState {
  readonly lab: OptionCLabId;
  readonly selectedCharacterId: string;
  readonly selectedSurface: OptionCSurface;
  readonly selectedAnimation: OptionCAnimationState;
  readonly facing: OptionCFacing;
  readonly mirror: boolean;
  readonly playing: boolean;
  readonly speed: number;
  readonly currentFrame: number;
  readonly backgroundDark: boolean;
  readonly showAnchors: boolean;
  // Tableau lab
  readonly tableauCast: readonly string[];
  readonly tableauSpeaker: string;
  // Combat stage lab
  readonly attackerId: string;
  readonly targetId: string;
}

// ---------------------------------------------------------------------------
// Character Lab (Section 20)
// ---------------------------------------------------------------------------

export class OptionCCharacterLab {
  private readonly root: HTMLElement;
  private animation: SpriteFrameAnimationController<OptionCAnimationState> | null = null;
  private frameRequest = 0;
  private state: OptionCLabState;
  private readonly loader = new OptionCSelectiveLoader();

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = {
      lab: 'character',
      selectedCharacterId: 'archer',
      selectedSurface: 'tableau',
      selectedAnimation: 'idle',
      facing: 'RIGHT',
      mirror: false,
      playing: true,
      speed: 1,
      currentFrame: 0,
      backgroundDark: true,
      showAnchors: true,
      tableauCast: [],
      tableauSpeaker: '',
      attackerId: 'archer',
      targetId: 'warrior',
    };
  }

  start(): void {
    document.body.classList.add('option-c-phase4c-lab');
    this.render();
    this.startAnimation();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest);
    this.loader.clear();
    document.body.classList.remove('option-c-phase4c-lab');
    this.root.replaceChildren();
  }

  private startAnimation(): void {
    const tick = (now: number) => {
      if (this.animation && this.state.playing) {
        const sample = this.animation.sample(now / this.state.speed);
        this.state = { ...this.state, currentFrame: sample.frameIndex };
        this.updateFrameDisplay(sample.frameUrl, sample.frameIndex, sample.state);
      }
      this.frameRequest = requestAnimationFrame(tick);
    };
    this.frameRequest = requestAnimationFrame(tick);
  }

  private updateFrameDisplay(frameUrl: string, frameIndex: number, state: OptionCAnimationState): void {
    const img = this.root.querySelector<HTMLImageElement>('.lab-character-display img');
    if (img && img.src !== frameUrl) img.src = frameUrl;
    const frameLabel = this.root.querySelector('[data-lab-frame]');
    if (frameLabel) frameLabel.textContent = `${frameIndex + 1}`;
    const stateLabel = this.root.querySelector('[data-lab-state]');
    if (stateLabel) stateLabel.textContent = state;
    document.body.dataset.optionC4cLabFrame = String(frameIndex + 1);
    document.body.dataset.optionC4cLabState = state;
  }

  private selectCharacter(characterId: string): void {
    const def = getCharacterDefinition(characterId);
    if (!def) return;
    const firstAnim = def.animations[0];
    const animState = firstAnim ? firstAnim.state : 'idle';
    this.state = { ...this.state, selectedCharacterId: characterId, selectedAnimation: animState };
    this.setupAnimation();
    this.render();
  }

  private selectAnimation(state: OptionCAnimationState): void {
    this.state = { ...this.state, selectedAnimation: state };
    this.setupAnimation();
    this.render();
  }

  private setupAnimation(): void {
    const def = getCharacterDefinition(this.state.selectedCharacterId);
    if (!def) return;
    const animMeta = def.animations.find((a) => a.state === this.state.selectedAnimation);
    if (!animMeta) return;
    // Pass ALL animation definitions so one-shot returnState transitions work
    const allSpriteDefs = def.animations.map((a) => toSpriteFrameAnimationDefinition(a));
    this.animation = new SpriteFrameAnimationController(
      allSpriteDefs,
      this.state.selectedAnimation,
      performance.now(),
    );
  }

  private render(): void {
    const def = getCharacterDefinition(this.state.selectedCharacterId);
    if (!def) {
      this.root.innerHTML = '<section class="lab-failure">Character not found in registry.</section>';
      return;
    }
    const identity = getIdentitySpec(def.identity.id);
    const validationError = validateCharacterDefinition(def);
    const allChars = getRegisteredCharacterIds();

    this.root.innerHTML = `
      <section class="option-c-phase4c-lab" data-lab="character">
        <header class="lab-header">
          <span class="lab-badge">DEV ONLY</span>
          <b>OPTION C · CHARACTER LAB</b>
          <small>Phase 4C-GLM scaling inspection</small>
        </header>
        <div class="lab-body">
          <aside class="lab-controls">
            <div class="lab-control-group">
              <label>Character</label>
              <div class="lab-button-row" data-control="character">
                ${allChars.map((id) => {
                  const d = getCharacterDefinition(id)!;
                  return `<button type="button" data-character="${id}" class="${id === this.state.selectedCharacterId ? 'is-active' : ''}">${d.identity.displayName}</button>`;
                }).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Animation State</label>
              <div class="lab-button-row" data-control="animation">
                ${def.animations.map((a) => `<button type="button" data-animation="${a.state}" class="${a.state === this.state.selectedAnimation ? 'is-active' : ''}">${a.state}</button>`).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Surface</label>
              <div class="lab-button-row" data-control="surface">
                ${['tableau', 'strategic', 'combat-stage'].map((s) => `<button type="button" data-surface="${s}" class="${s === this.state.selectedSurface ? 'is-active' : ''}">${s}</button>`).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Facing / Mirror</label>
              <div class="lab-button-row" data-control="facing">
                <button type="button" data-facing="LEFT" class="${this.state.facing === 'LEFT' ? 'is-active' : ''}">LEFT</button>
                <button type="button" data-facing="RIGHT" class="${this.state.facing === 'RIGHT' ? 'is-active' : ''}">RIGHT</button>
                <button type="button" data-mirror="${!this.state.mirror}">Mirror: ${this.state.mirror ? 'ON' : 'OFF'}</button>
              </div>
            </div>
            <div class="lab-control-group">
              <label>Playback</label>
              <div class="lab-button-row" data-control="playback">
                <button type="button" data-play="${!this.state.playing}">${this.state.playing ? 'Pause' : 'Play'}</button>
                <button type="button" data-speed="0.5">0.5x</button>
                <button type="button" data-speed="1">1x</button>
                <button type="button" data-speed="2">2x</button>
              </div>
            </div>
            <div class="lab-control-group">
              <label>Display</label>
              <div class="lab-button-row" data-control="display">
                <button type="button" data-bg="${!this.state.backgroundDark}">BG: ${this.state.backgroundDark ? 'Dark' : 'Light'}</button>
                <button type="button" data-anchors="${!this.state.showAnchors}">Anchors: ${this.state.showAnchors ? 'ON' : 'OFF'}</button>
              </div>
            </div>
          </aside>
          <div class="lab-display-area">
            <div class="lab-character-display ${this.state.backgroundDark ? 'is-dark' : 'is-light'}" style="${this.state.mirror ? 'transform: scaleX(-1);' : ''}">
              <img src="${def.surfaceAssets[this.state.selectedSurface === 'travel' ? 'tableau' : this.state.selectedSurface === 'combat-stage' ? 'combatStage' : this.state.selectedSurface] ?? def.identity.canonicalSource}" alt="${def.identity.displayName}" />
              ${this.state.showAnchors ? this.renderAnchors(def) : ''}
            </div>
            <div class="lab-metadata">
              <dl>
                <dt>Character ID</dt><dd>${def.identity.id}</dd>
                <dt>Display Name</dt><dd>${def.identity.displayName}</dd>
                <dt>State</dt><dd data-lab-state>${this.state.selectedAnimation}</dd>
                <dt>Frame</dt><dd data-lab-frame>1</dd>
                <dt>Scale</dt><dd>tableau=${def.scales.tableau} strategic=${def.scales.strategic} combat=${def.scales.combatStage} ${def.scales.draftScale ? '(DRAFT_SCALE)' : ''}</dd>
                <dt>Anchor</dt><dd>foot=(${def.anchors.footCenter.x},${def.anchors.footCenter.y}) body=(${def.anchors.bodyCenter.x},${def.anchors.bodyCenter.y})</dd>
                <dt>Source</dt><dd>${def.identity.canonicalSource}</dd>
                <dt>Status</dt><dd>${def.masterStatus} / ${def.runtimeStatus}</dd>
                <dt>Weapon</dt><dd>${def.identity.weapon}</dd>
                <dt>Archetype</dt><dd>${def.identity.archetype}</dd>
                <dt>Frame Count</dt><dd>${def.animations.find((a) => a.state === this.state.selectedAnimation)?.frameCount ?? '?'}</dd>
                <dt>Frame Duration</dt><dd>${def.animations.find((a) => a.state === this.state.selectedAnimation)?.frameDurationMs ?? '?'}ms</dd>
                <dt>Loop</dt><dd>${def.animations.find((a) => a.state === this.state.selectedAnimation)?.loop ?? '?'}</dd>
                <dt>Validation</dt><dd>${validationError ? `<span class="lab-error">${validationError}</span>` : '<span class="lab-ok">PASS</span>'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>
    `;
    this.wireControls();
  }

  private renderAnchors(def: OptionCCharacterDefinition): string {
    const { footCenter, bodyCenter, headReference, weaponReference } = def.anchors;
    const toPercent = (v: number, max: number) => `${(v / max) * 100}%`;
    return `
      <div class="lab-anchor lab-anchor-foot" style="left:${toPercent(footCenter.x, 512)};top:${toPercent(footCenter.y, 512)}" title="FOOT_CENTER"></div>
      <div class="lab-anchor lab-anchor-body" style="left:${toPercent(bodyCenter.x, 512)};top:${toPercent(bodyCenter.y, 512)}" title="BODY_CENTER"></div>
      <div class="lab-anchor lab-anchor-head" style="left:${toPercent(headReference.x, 512)};top:${toPercent(headReference.y, 512)}" title="HEAD_REFERENCE"></div>
      ${weaponReference ? `<div class="lab-anchor lab-anchor-weapon" style="left:${toPercent(weaponReference.x, 512)};top:${toPercent(weaponReference.y, 512)}" title="WEAPON_REFERENCE"></div>` : ''}
    `;
  }

  private wireControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-character]').forEach((btn) => {
      btn.addEventListener('click', () => this.selectCharacter(btn.dataset.character!));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-animation]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const state = btn.dataset.animation;
        if (state && isOptionCAnimationState(state)) this.selectAnimation(state);
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-surface]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.surface!;
        if (isOptionCSurface(s)) {
          this.state = { ...this.state, selectedSurface: s };
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-facing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.facing!;
        if (isOptionCFacing(f)) {
          this.state = { ...this.state, facing: f };
          this.render();
        }
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-mirror]')?.addEventListener('click', () => {
      this.state = { ...this.state, mirror: !this.state.mirror };
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-play]')?.addEventListener('click', () => {
      this.state = { ...this.state, playing: !this.state.playing };
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed!);
        if (Number.isFinite(speed) && speed > 0) {
          this.state = { ...this.state, speed };
          this.render();
        }
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-bg]')?.addEventListener('click', () => {
      this.state = { ...this.state, backgroundDark: !this.state.backgroundDark };
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-anchors]')?.addEventListener('click', () => {
      this.state = { ...this.state, showAnchors: !this.state.showAnchors };
      this.render();
    });
  }
}

// ---------------------------------------------------------------------------
// Tableau Lab (Section 19) — multi-character staging
// ---------------------------------------------------------------------------

export class OptionCTableauLab {
  private readonly root: HTMLElement;
  private cast: string[] = ['archer', 'warrior'];
  private speaker: string = 'archer';
  private facing: OptionCFacing = 'RIGHT';
  private mirror = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  start(): void {
    document.body.classList.add('option-c-phase4c-tableau-lab');
    this.render();
  }

  dispose(): void {
    document.body.classList.remove('option-c-phase4c-tableau-lab');
    this.root.replaceChildren();
  }

  private render(): void {
    const allChars = getRegisteredCharacterIds();
    const positions: readonly string[] = ['FAR_LEFT', 'LEFT', 'CENTER', 'RIGHT', 'FAR_RIGHT'];
    this.root.innerHTML = `
      <section class="option-c-phase4c-lab" data-lab="tableau">
        <header class="lab-header">
          <span class="lab-badge">DEV ONLY</span>
          <b>OPTION C · TABLEAU LAB</b>
          <small>Multi-character staging (1-4 actors)</small>
        </header>
        <div class="lab-body">
          <aside class="lab-controls">
            <div class="lab-control-group">
              <label>Cast Size</label>
              <div class="lab-button-row" data-control="cast-size">
                ${[1, 2, 3, 4].map((n) => `<button type="button" data-cast-size="${n}" class="${this.cast.length === n ? 'is-active' : ''}">${n} actor${n > 1 ? 's' : ''}</button>`).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Cast Members</label>
              <div class="lab-cast-list" data-control="cast-members">
                ${this.cast.map((id, i) => {
                  const def = getCharacterDefinition(id);
                  return `<div class="lab-cast-slot">
                    <select data-cast-slot="${i}">
                      ${allChars.map((cid) => {
                        const d = getCharacterDefinition(cid)!;
                        return `<option value="${cid}" ${cid === id ? 'selected' : ''}>${d.identity.displayName}</option>`;
                      }).join('')}
                    </select>
                    <button type="button" data-speaker="${i}" class="${this.speaker === id ? 'is-active' : ''}">Speaker</button>
                  </div>`;
                }).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Facing / Mirror</label>
              <div class="lab-button-row" data-control="facing">
                <button type="button" data-facing="LEFT" class="${this.facing === 'LEFT' ? 'is-active' : ''}">LEFT</button>
                <button type="button" data-facing="RIGHT" class="${this.facing === 'RIGHT' ? 'is-active' : ''}">RIGHT</button>
                <button type="button" data-mirror="${!this.mirror}">Mirror: ${this.mirror ? 'ON' : 'OFF'}</button>
              </div>
            </div>
          </aside>
          <div class="lab-display-area">
            <div class="lab-tableau-stage">
              ${this.cast.map((id, i) => {
                const def = getCharacterDefinition(id);
                if (!def) return '';
                const pos = positions[Math.min(i, positions.length - 1)] ?? 'CENTER';
                const isSpeaker = this.speaker === id;
                const facingDir = isSpeaker ? this.facing : (this.facing === 'LEFT' ? 'RIGHT' : 'LEFT');
                const mirrorStyle = facingDir === 'LEFT' ? 'transform: scaleX(-1);' : '';
                return `<div class="lab-tableau-actor ${isSpeaker ? 'is-speaking' : 'is-listening'}" data-actor-id="${id}" data-position="${pos}" data-facing="${facingDir}" style="--actor-pos: ${i};">
                  <img src="${def.surfaceAssets.tableau}" alt="${def.identity.displayName}" style="${mirrorStyle}" />
                  <div class="lab-actor-label">${def.identity.displayName} · ${pos} · ${isSpeaker ? 'SPEAKER' : 'LISTENER'}</div>
                </div>`;
              }).join('')}
            </div>
            <div class="lab-metadata">
              <dl>
                <dt>Cast Count</dt><dd>${this.cast.length}</dd>
                <dt>Speaker</dt><dd>${getCharacterDefinition(this.speaker)?.identity.displayName ?? 'none'}</dd>
                <dt>Facing</dt><dd>${this.facing}</dd>
                <dt>Mirror</dt><dd>${this.mirror ? 'ON' : 'OFF'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>
    `;
    this.wireControls();
  }

  private wireControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-cast-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.castSize!, 10);
        if (n >= 1 && n <= 4) {
          const defaults = ['archer', 'warrior', 'white_mage', 'dark_knight'];
          this.cast = defaults.slice(0, n);
          if (!this.cast.includes(this.speaker)) this.speaker = this.cast[0]!;
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLSelectElement>('[data-cast-slot]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const i = parseInt(sel.dataset.castSlot!, 10);
        const newId = sel.value;
        if (i >= 0 && i < this.cast.length && getCharacterDefinition(newId)) {
          this.cast[i] = newId;
          if (this.speaker === newId) this.speaker = this.cast[0]!;
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-speaker]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.speaker!, 10);
        if (i >= 0 && i < this.cast.length) {
          this.speaker = this.cast[i]!;
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-facing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.facing!;
        if (isOptionCFacing(f)) this.facing = f;
        this.render();
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-mirror]')?.addEventListener('click', () => {
      this.mirror = !this.mirror;
      this.render();
    });
  }
}

// ---------------------------------------------------------------------------
// Strategic Lab (Section 21) + Combat Stage Lab (Section 22)
// ---------------------------------------------------------------------------

export class OptionCCombatLab {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private surface: 'strategic' | 'combat-stage' = 'strategic';
  private selectedCharacter: string = 'archer';
  private animationState: OptionCAnimationState = 'idle';
  private readonly loader = new OptionCSelectiveLoader();
  private memoryReport: OptionCMemoryReport | null = null;
  private animation: SpriteFrameAnimationController<OptionCAnimationState> | null = null;
  private frameRequest = 0;

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.root = root;
    this.canvas = canvas;
  }

  start(): void {
    document.body.classList.add('option-c-phase4c-combat-lab');
    this.setupAnimation();
    this.render();
    this.startAnimation();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest);
    document.body.classList.remove('option-c-phase4c-combat-lab');
    this.loader.clear();
    this.root.replaceChildren();
  }

  private setupAnimation(): void {
    const def = getCharacterDefinition(this.selectedCharacter);
    if (!def) return;
    const animMeta = def.animations.find((a) => a.state === this.animationState);
    if (!animMeta) return;
    const allSpriteDefs = def.animations.map((a) => toSpriteFrameAnimationDefinition(a));
    this.animation = new SpriteFrameAnimationController(
      allSpriteDefs,
      this.animationState,
      performance.now(),
    );
  }

  private startAnimation(): void {
    const tick = (now: number) => {
      if (this.animation) {
        const sample = this.animation.sample(now);
        this.updateFrameDisplay(sample.frameUrl, sample.frameIndex, sample.state);
      }
      this.frameRequest = requestAnimationFrame(tick);
    };
    this.frameRequest = requestAnimationFrame(tick);
  }

  private updateFrameDisplay(frameUrl: string, frameIndex: number, state: OptionCAnimationState): void {
    const img = this.root.querySelector<HTMLImageElement>('.lab-combat-actor img');
    if (img && img.src !== frameUrl && !frameUrl.includes('undefined')) img.src = frameUrl;
    const frameLabel = this.root.querySelector('[data-lab-frame]');
    if (frameLabel) frameLabel.textContent = `${frameIndex + 1}`;
    const stateLabel = this.root.querySelector('[data-lab-state]');
    if (stateLabel) stateLabel.textContent = state;
  }

  private async loadSurface(): Promise<void> {
    if (this.surface === 'strategic') {
      await this.loader.loadStrategic('forest-road', [this.selectedCharacter]);
    } else {
      await this.loader.loadCombatStage('forest-road', this.selectedCharacter, 'warrior', this.animationState);
    }
    this.memoryReport = this.loader.getMemoryReport();
  }

  private render(): void {
    const allChars = getRegisteredCharacterIds();
    const envAsset = resolveEnvironmentAsset({ family: 'forest-road', surface: this.surface });
    const def = getCharacterDefinition(this.selectedCharacter);
    const animMeta = def?.animations.find((a) => a.state === this.animationState);
    const initialFrame = animMeta?.frames[0] ?? def?.surfaceAssets[this.surface === 'combat-stage' ? 'combatStage' : this.surface] ?? '';
    const scale = this.surface === 'strategic' ? (def?.scales.strategic ?? 0.7) : (def?.scales.combatStage ?? 1);
    this.root.innerHTML = `
      <section class="option-c-phase4c-lab" data-lab="${this.surface}">
        <header class="lab-header">
          <span class="lab-badge">DEV ONLY</span>
          <b>OPTION C · ${this.surface === 'strategic' ? 'STRATEGIC' : 'COMBAT STAGE'} LAB</b>
          <small>Real runtime combat presentation</small>
        </header>
        <div class="lab-body">
          <aside class="lab-controls">
            <div class="lab-control-group">
              <label>Surface</label>
              <div class="lab-button-row" data-control="surface">
                <button type="button" data-surface="strategic" class="${this.surface === 'strategic' ? 'is-active' : ''}">STRATEGIC</button>
                <button type="button" data-surface="combat-stage" class="${this.surface === 'combat-stage' ? 'is-active' : ''}">COMBAT STAGE</button>
              </div>
            </div>
            <div class="lab-control-group">
              <label>Character</label>
              <div class="lab-button-row" data-control="character">
                ${allChars.map((id) => {
                  const d = getCharacterDefinition(id)!;
                  return `<button type="button" data-character="${id}" class="${id === this.selectedCharacter ? 'is-active' : ''}">${d.identity.displayName}</button>`;
                }).join('')}
              </div>
            </div>
            <div class="lab-control-group">
              <label>Animation</label>
              <div class="lab-button-row" data-control="animation">
                ${['idle', 'dash', 'attack', 'skill', 'cast'].map((s) => `<button type="button" data-animation="${s}" class="${s === this.animationState ? 'is-active' : ''}">${s}</button>`).join('')}
              </div>
            </div>
          </aside>
          <div class="lab-display-area">
            <div class="lab-combat-stage ${this.surface}">
              <img src="${envAsset.url}" alt="${this.surface} background" class="lab-env-bg" />
              <div class="lab-combat-actor" style="--actor-scale:${scale}">
                <img src="${initialFrame}" alt="${this.selectedCharacter}" />
              </div>
            </div>
            <div class="lab-metadata">
              <dl>
                <dt>Surface</dt><dd>${this.surface}</dd>
                <dt>Character</dt><dd>${def?.identity.displayName ?? '?'}</dd>
                <dt>Animation</dt><dd data-lab-state>${this.animationState}</dd>
                <dt>Frame</dt><dd data-lab-frame>1</dd>
                <dt>Scale</dt><dd>${scale} ${def?.scales.draftScale ? '(DRAFT_SCALE)' : ''}</dd>
                <dt>Environment</dt><dd>${envAsset.semanticKey}</dd>
                <dt>NO_GLOBAL_PRELOAD</dt><dd>${NO_GLOBAL_OPTION_C_PRELOAD ? 'YES' : 'NO'}</dd>
                <dt>Cache Entries</dt><dd>${this.loader.getCacheSize()}</dd>
                <dt>Memory (est.)</dt><dd data-lab-memory>${this.memoryReport ? `${(this.memoryReport.estimatedDecodedRgbaBytes / 1024 / 1024).toFixed(1)} MB` : 'not loaded'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>
    `;
    this.wireControls();
    void this.loadSurface().then(() => this.updateMemoryDisplay());
  }

  private updateMemoryDisplay(): void {
    const memEl = this.root.querySelector('[data-lab-memory]');
    if (memEl && this.memoryReport) {
      memEl.textContent = `${(this.memoryReport.estimatedDecodedRgbaBytes / 1024 / 1024).toFixed(1)} MB`;
    }
  }

  private wireControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-surface]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.surface as 'strategic' | 'combat-stage';
        if (s === 'strategic' || s === 'combat-stage') {
          this.surface = s;
          this.setupAnimation();
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-character]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.character!;
        if (getCharacterDefinition(id)) {
          this.selectedCharacter = id;
          this.setupAnimation();
          this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-animation]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.animation!;
        if (isOptionCAnimationState(s)) {
          this.animationState = s;
          this.setupAnimation();
          this.render();
        }
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Lab router
// ---------------------------------------------------------------------------

export class OptionCPhase4cLabRouter {
  private characterLab: OptionCCharacterLab | null = null;
  private tableauLab: OptionCTableauLab | null = null;
  private combatLab: OptionCCombatLab | null = null;
  private currentLab: OptionCLabId = 'character';

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {}

  start(): void {
    ensurePhase4cRegistered();
    this.renderRouter();
    this.showLab('character');
  }

  dispose(): void {
    this.characterLab?.dispose();
    this.tableauLab?.dispose();
    this.combatLab?.dispose();
    this.root.replaceChildren();
  }

  private showLab(lab: OptionCLabId): void {
    this.currentLab = lab;
    this.characterLab?.dispose();
    this.tableauLab?.dispose();
    this.combatLab?.dispose();
    this.characterLab = null;
    this.tableauLab = null;
    this.combatLab = null;

    const labRoot = this.root.querySelector<HTMLElement>('.lab-content');
    if (!labRoot) return;
    labRoot.replaceChildren();

    if (lab === 'character') {
      this.characterLab = new OptionCCharacterLab(labRoot);
      this.characterLab.start();
    } else if (lab === 'tableau') {
      this.tableauLab = new OptionCTableauLab(labRoot);
      this.tableauLab.start();
    } else if (lab === 'strategic' || lab === 'combat-stage') {
      this.combatLab = new OptionCCombatLab(labRoot, this.canvas);
      this.combatLab.start();
    }
    this.updateActiveButton();
  }

  private updateActiveButton(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-lab-switch]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.labSwitch === this.currentLab);
    });
  }

  private renderRouter(): void {
    this.root.innerHTML = `
      <section class="option-c-phase4c-lab-router">
        <header class="lab-header">
          <span class="lab-badge">DEV ONLY</span>
          <b>OPTION C · PHASE 4C-GLM LABS</b>
          <small>Scaling foundation inspection</small>
        </header>
        <nav class="lab-nav">
          <button type="button" data-lab-switch="character" class="is-active">Character Lab</button>
          <button type="button" data-lab-switch="tableau">Tableau Lab</button>
          <button type="button" data-lab-switch="strategic">Strategic Lab</button>
          <button type="button" data-lab-switch="combat-stage">Combat Stage Lab</button>
        </nav>
        <div class="lab-content"></div>
      </section>
    `;
    this.root.querySelectorAll<HTMLButtonElement>('[data-lab-switch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lab = btn.dataset.labSwitch as OptionCLabId;
        if (lab) this.showLab(lab);
      });
    });
  }
}
