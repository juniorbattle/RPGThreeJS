import { unitById } from '../game/catalog';
import { getAvailableRunNodes } from '../game/runSystem';
import { assets } from '../render/assetManifest';
import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import type { GameState, RunNode, RunNodeType, UnitInstance } from '../game/types';

interface TravelViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  onSelect: (node: RunNode) => Promise<void>;
  onOpenClan: () => void;
}

interface TravelPartySlot {
  left: number;
  bottom: number;
  scale: number;
  z: number;
}

interface TravelHeroPalette {
  skin: string;
  hair: string;
  c1: string;
  c2: string;
  acc: string;
  metal: string;
  wpn: 'sword' | 'bow' | 'staff' | 'mace' | 'dagger' | 'club';
  head: 'helm' | 'hood-light' | 'hat' | 'hair' | 'bald' | 'darkhood';
}

// Presentation-only mapping. Risk/reward are derived from the node type so the
// cards read clearly; this never alters RunSystem data or outcomes.
const NODE_PRESENTATION: Record<RunNodeType, { label: string; risk: number; reward: number }> = {
  combat: { label: 'Combat', risk: 2, reward: 3 },
  event: { label: 'Événement', risk: 1, reward: 3 },
  mystery: { label: 'Mystère', risk: 2, reward: 2 },
  recruitment: { label: 'Recrutement', risk: 1, reward: 2 },
  shop: { label: 'Marchand', risk: 0, reward: 1 },
  refuge: { label: 'Refuge', risk: 0, reward: 1 },
  story: { label: 'Récit', risk: 1, reward: 2 },
  boss: { label: 'Boss', risk: 3, reward: 3 },
};

const TRAVEL_PARTY_LAYOUT: readonly TravelPartySlot[] = [
  { left: 39, bottom: 28.4, scale: 1, z: 1 },
  { left: 47, bottom: 29.6, scale: 1, z: 3 },
  { left: 55, bottom: 29.2, scale: 1, z: 2 },
  { left: 63, bottom: 28.1, scale: 1, z: 1 },
];

const TRAVEL_HERO_PALETTES: Record<string, TravelHeroPalette> = {
  knight: { skin: '#f0c39b', hair: '#6b4a2a', c1: '#4f63b5', c2: '#2f3c78', acc: '#d9b25a', metal: '#d2d8ea', wpn: 'sword', head: 'helm' },
  archer: { skin: '#f0c39b', hair: '#caa24a', c1: '#4f9f5e', c2: '#2f6b3c', acc: '#caa05a', metal: '#cfd6e6', wpn: 'bow', head: 'hood-light' },
  mage: { skin: '#f0c39b', hair: '#3a2a55', c1: '#7a4fb0', c2: '#4d2f78', acc: '#f4d98b', metal: '#e6c2ff', wpn: 'staff', head: 'hat' },
  cleric: { skin: '#f0c39b', hair: '#b06a3a', c1: '#ece6d4', c2: '#c9bfa0', acc: '#d9b25a', metal: '#fff3c4', wpn: 'mace', head: 'hair' },
};

const travelHeroSpriteCache = new Map<string, string>();

type TravelBackdropKey = keyof typeof assets.screens.travel.backdrops;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function ratingDots(value: number, max = 3): string {
  const filled = Math.max(0, Math.min(max, value));
  return (
    '<b>' + '◆'.repeat(filled) + '</b>' + '<em>' + '◇'.repeat(max - filled) + '</em>'
  );
}

function particleLayer(count = 10): string {
  let motes = '';
  for (let i = 0; i < count; i += 1) {
    const left = Math.round(Math.random() * 100);
    const delay = (Math.random() * 12).toFixed(2);
    const duration = (14 + Math.random() * 10).toFixed(2);
    const drift = (Math.random() * 24 - 12).toFixed(1);
    const scale = (0.45 + Math.random() * 0.4).toFixed(2);
    const alpha = (0.28 + Math.random() * 0.22).toFixed(2);
    motes += `<i style="--x:${left}%;--delay:${delay}s;--dur:${duration}s;--drift:${drift}px;--scale:${scale};--alpha:${alpha}"></i>`;
  }
  return motes;
}

function travelBackdropForNode(node: RunNode): TravelBackdropKey {
  const context = `${node.type} ${node.contentId} ${node.label}`.toLocaleLowerCase('fr-FR');
  if (node.type === 'boss' || node.type === 'refuge' || /château|chateau|forteresse|fort|citadelle|ruine|ruines|vestige|vestiges|sceau|porte|refuge/.test(context)) return 'castle';
  if (node.type === 'shop' || node.type === 'recruitment' || /ville|village|bourg|marchand|valmir/.test(context)) return 'city';
  return 'default';
}

function chooseTravelBackdrop(choices: readonly RunNode[]): TravelBackdropKey {
  const contexts = choices.map((node) => travelBackdropForNode(node));
  if (contexts.includes('castle')) return 'castle';
  if (contexts.includes('city')) return 'city';
  return 'default';
}

function currentRunNode(state: GameState): RunNode | undefined {
  return state.run.graph.nodes.find((node) => node.id === state.run.currentNodeId);
}

function laneLabel(node: RunNode): string {
  if (node.z < -0.1) return 'Gauche';
  if (node.z > 0.1) return 'Droite';
  return 'Centre';
}

function roadmapObjective(state: GameState, choices: readonly RunNode[]): string {
  const current = currentRunNode(state);
  if (choices.length === 0) return current?.type === 'boss' ? 'Conclure la route du Lion.' : 'La route connue s’arrête ici.';
  if (choices.some((node) => node.type === 'boss')) return 'Atteindre la Porte du Sceau.';
  if (choices.some((node) => node.type === 'refuge')) return 'Atteindre le refuge et sécuriser le butin.';
  if (choices.some((node) => node.type === 'combat')) return 'Choisir le prochain embranchement et préparer l’affrontement.';
  return 'Choisir le prochain embranchement connu.';
}

function sortRoadmapNodes(nodes: readonly RunNode[]): RunNode[] {
  return [...nodes].sort((a, b) => a.depth - b.depth || a.z - b.z || a.x - b.x);
}

function renderRoadmapStep(node: RunNode, state: GameState, choices: readonly RunNode[]): string {
  const current = node.id === state.run.currentNodeId;
  const completed = !current && state.resolvedNodeIds.includes(node.id);
  const visited = !current && !completed && state.run.visitedNodeIds.includes(node.id);
  const branch = !current && choices.some((choice) => choice.id === node.id);
  const status = current ? 'current' : completed ? 'completed' : visited ? 'visited' : branch ? 'branch' : 'known';
  const statusLabel = current ? 'Position actuelle' : completed ? 'Terminée' : visited ? 'Parcourue' : branch ? 'Embranchement connu' : 'Découverte';
  const marker = current ? '◆' : completed ? '✓' : visited ? '↗' : branch ? '◇' : '•';
  const meta = NODE_PRESENTATION[node.type];
  return `<li class="roadmap-step roadmap-step--${status}">
    <span class="roadmap-step__marker">${marker}</span>
    <span class="roadmap-step__content"><strong>${escapeHtml(node.label)}</strong><small>${meta.label} · ${laneLabel(node)}</small></span>
    <em>${statusLabel}</em>
  </li>`;
}

function renderRoadmapSection(title: string, nodes: readonly RunNode[], state: GameState, choices: readonly RunNode[], emptyLabel: string): string {
  return `<li class="roadmap-section">
    <p class="roadmap-section__title">${title}</p>
    <ol class="roadmap-section__steps">
      ${nodes.length > 0 ? nodes.map((node) => renderRoadmapStep(node, state, choices)).join('') : `<li class="roadmap-section__empty">${emptyLabel}</li>`}
    </ol>
  </li>`;
}

function renderRoadmap(state: GameState, choices: readonly RunNode[]): string {
  const revealed = new Set(state.run.revealedNodeIds);
  const discovered = sortRoadmapNodes(state.run.graph.nodes.filter((node) => revealed.has(node.id)));
  const current = currentRunNode(state);
  const currentId = current?.id ?? '';
  const branchIds = new Set(choices.map((node) => node.id));
  const past = sortRoadmapNodes(discovered.filter((node) => node.id !== currentId && !branchIds.has(node.id) && (state.resolvedNodeIds.includes(node.id) || state.run.visitedNodeIds.includes(node.id))));
  const branches = sortRoadmapNodes(choices);
  const known = sortRoadmapNodes(discovered.filter((node) => node.id !== currentId && !branchIds.has(node.id) && !past.some((pastNode) => pastNode.id === node.id)));
  const completedCount = discovered.filter((node) => state.resolvedNodeIds.includes(node.id)).length;
  const roadmapList = [
    renderRoadmapSection('1 · Étapes passées', past, state, choices, 'Aucune étape passée.'),
    renderRoadmapSection('2 · Position actuelle', current ? [current] : [], state, choices, 'Position inconnue.'),
    renderRoadmapSection('3 · Branches connues', branches, state, choices, 'Aucun embranchement connu.'),
    known.length > 0 ? renderRoadmapSection('Repères découverts', known, state, choices, 'Aucun repère découvert.') : '',
  ].join('');
  const branchList = choices.length > 0
    ? choices.map((node) => `<li><span>${escapeHtml(node.icon)}</span><strong>${escapeHtml(node.label)}</strong><em>${NODE_PRESENTATION[node.type].label} · ${laneLabel(node)}</em></li>`).join('')
    : '<li class="roadmap-branches__empty">Aucun embranchement connu.</li>';
  return `<div class="travel-roadmap" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="travel-roadmap-title" hidden tabindex="-1">
    <section class="travel-roadmap__panel">
      <header class="travel-roadmap__header">
        <span></span>
        <h2 id="travel-roadmap-title">Feuille de route</h2>
        <button type="button" data-action="roadmap-close" aria-label="Fermer la feuille de route">×</button>
      </header>
      <div class="travel-roadmap__body">
        <div class="travel-roadmap__timeline">
          <p class="travel-roadmap__kicker">Itinéraire découvert</p>
          <ol class="travel-roadmap__list">
            ${roadmapList}
          </ol>
        </div>
        <aside class="travel-roadmap__side">
          <section class="travel-roadmap__card">
            <p class="travel-roadmap__kicker">Position actuelle</p>
            <strong>${escapeHtml(current?.label ?? 'Route inconnue')}</strong>
            <span>${current ? `${NODE_PRESENTATION[current.type].label} · ${laneLabel(current)}` : 'Aucune position'}</span>
          </section>
          <section class="travel-roadmap__card">
            <p class="travel-roadmap__kicker">Prochains embranchements connus</p>
            <ul class="roadmap-branches">${branchList}</ul>
          </section>
          <section class="travel-roadmap__card">
            <p class="travel-roadmap__kicker">Objectif courant</p>
            <strong>${escapeHtml(roadmapObjective(state, choices))}</strong>
          </section>
          <section class="travel-roadmap__card travel-roadmap__summary">
            <p class="travel-roadmap__kicker">Résumé du run</p>
            <dl>
              <div><dt>Run</dt><dd>${escapeHtml(state.run.regionId)}</dd></div>
              <div><dt>Étapes parcourues</dt><dd>${state.run.visitedNodeIds.length}</dd></div>
              <div><dt>Étapes terminées</dt><dd>${completedCount}</dd></div>
              <div><dt>Butin</dt><dd>${state.run.temporaryLoot.gold}</dd></div>
              <div><dt>Réputation</dt><dd>${state.reputation}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  </div>`;
}

function outlineTravelSprite(canvas: HTMLCanvasElement, step: number): HTMLCanvasElement {
  const sourceContext = canvas.getContext('2d');
  if (!sourceContext) return canvas;
  const width = canvas.width;
  const height = canvas.height;
  const source = sourceContext.getImageData(0, 0, width, height).data;
  const outlined = document.createElement('canvas');
  outlined.width = width;
  outlined.height = height;
  const outputContext = outlined.getContext('2d');
  if (!outputContext) return canvas;
  const output = outputContext.createImageData(width, height);
  const data = output.data;
  const alphaAt = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? 0 : source[(y * width + x) * 4 + 3] ?? 0);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    if ((source[offset + 3] ?? 0) <= 40 && (alphaAt(x - step, y) > 40 || alphaAt(x + step, y) > 40 || alphaAt(x, y - step) > 40 || alphaAt(x, y + step) > 40)) {
      data[offset] = 22;
      data[offset + 1] = 16;
      data[offset + 2] = 30;
      data[offset + 3] = 255;
    }
  }
  outputContext.putImageData(output, 0, 0);
  outputContext.drawImage(canvas, 0, 0);
  return outlined;
}

function travelHeroSprite(kind: string): string {
  const paletteKey = TRAVEL_HERO_PALETTES[kind] ? kind : 'knight';
  const cached = travelHeroSpriteCache.get(paletteKey);
  if (cached) return cached;
  const palette = TRAVEL_HERO_PALETTES[paletteKey]!;
  const gridWidth = 22;
  const gridHeight = 30;
  const scale = 8;
  const canvas = document.createElement('canvas');
  canvas.width = gridWidth * scale;
  canvas.height = gridHeight * scale;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.imageSmoothingEnabled = false;
  const rect = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(x * scale, y * scale, width * scale, height * scale);
  };
  const shade = (x: number, y: number, width: number, height: number) => {
    context.fillStyle = 'rgba(0,0,0,.22)';
    context.fillRect(x * scale, y * scale, width * scale, height * scale);
  };
  rect(8, 19, 3, 7, palette.c2); rect(11, 19, 3, 7, palette.c2); rect(8, 25, 3, 1, '#23202b'); rect(11, 25, 3, 1, '#23202b');
  rect(5, 11, 2, 7, palette.c1); rect(15, 11, 2, 7, palette.c1); rect(5, 17, 2, 2, palette.skin); rect(15, 17, 2, 2, palette.skin);
  rect(7, 11, 8, 8, palette.c1); shade(7, 16, 8, 3); rect(7, 17, 8, 1, palette.acc); rect(10, 12, 2, 3, palette.acc);
  rect(7, 3, 8, 8, palette.skin); shade(7, 9, 8, 2); rect(9, 6, 1, 2, '#241a14'); rect(13, 6, 1, 2, '#241a14');
  if (palette.head === 'helm') { rect(6, 2, 10, 3, palette.metal); rect(6, 5, 10, 1, palette.metal); rect(6, 6, 1, 4, palette.metal); rect(15, 6, 1, 4, palette.metal); rect(8, 4, 6, 1, '#9aa3bd'); }
  else if (palette.head === 'hat') { rect(5, 1, 12, 2, palette.c1); rect(7, 0, 8, 1, palette.c1); rect(8, 0, 6, 2, palette.c2); rect(6, 2, 10, 1, palette.acc); }
  else if (palette.head === 'hood-light') { rect(5, 1, 12, 4, palette.c1); rect(6, 5, 2, 5, palette.c1); rect(14, 5, 2, 5, palette.c1); }
  else if (palette.head === 'darkhood') { rect(5, 0, 12, 6, palette.c1); rect(6, 6, 2, 5, palette.c1); rect(14, 6, 2, 5, palette.c1); context.fillStyle = 'rgba(0,0,0,.45)'; context.fillRect(7 * scale, 5 * scale, 8 * scale, 4 * scale); rect(9, 7, 1, 2, '#c79bff'); rect(13, 7, 1, 2, '#c79bff'); }
  else if (palette.head === 'bald') rect(6, 2, 10, 3, palette.skin);
  else { rect(5, 1, 12, 4, palette.hair); rect(6, 4, 1, 3, palette.hair); rect(15, 4, 1, 3, palette.hair); }
  if (palette.wpn === 'sword') { rect(16, 4, 1, 11, palette.metal); rect(17, 5, 1, 8, '#aeb6cd'); rect(15, 14, 3, 1, palette.acc); rect(16, 15, 1, 3, palette.c2); }
  else if (palette.wpn === 'bow') { rect(4, 7, 1, 12, palette.acc); rect(5, 7, 1, 2, palette.acc); rect(5, 17, 1, 2, palette.acc); context.strokeStyle = '#e7e0c6'; context.lineWidth = scale * 0.4; context.beginPath(); context.moveTo(4.5 * scale, 7 * scale); context.lineTo(4.5 * scale, 19 * scale); context.stroke(); }
  else if (palette.wpn === 'staff') { rect(16, 3, 1, 15, palette.c2); const glow = context.createRadialGradient(16.5 * scale, 3 * scale, 1, 16.5 * scale, 3 * scale, 3.5 * scale); glow.addColorStop(0, '#ffffff'); glow.addColorStop(0.5, palette.metal); glow.addColorStop(1, 'rgba(0,0,0,0)'); context.fillStyle = glow; context.fillRect(13 * scale, 0, 8 * scale, 7 * scale); }
  else if (palette.wpn === 'mace') { rect(16, 7, 1, 11, palette.c2); rect(15, 5, 3, 3, palette.metal); rect(15, 4, 3, 1, palette.acc); }
  else if (palette.wpn === 'dagger') { rect(16, 11, 1, 5, palette.metal); rect(15, 15, 3, 1, palette.acc); }
  else if (palette.wpn === 'club') { rect(16, 6, 2, 12, palette.c2); rect(15, 5, 4, 4, '#7a6038'); }
  const result = outlineTravelSprite(canvas, scale).toDataURL('image/png');
  travelHeroSpriteCache.set(paletteKey, result);
  return result;
}

export class TravelView {
  private element: HTMLElement | null = null;
  private busy = false;

  constructor(private readonly options: TravelViewOptions) {}

  open(): void {
    this.close();
    const state = this.options.getState();
    const choices = getAvailableRunNodes(state.run);
    const backdropKey = chooseTravelBackdrop(choices);
    const roadmap = renderRoadmap(state, choices);
    const deployed = state.deployment.unitIds
      .map((id) => state.clan.members.find((unit) => unit.id === id))
      .filter((unit): unit is UnitInstance => Boolean(unit))
      .slice(0, 4);
    const section = document.createElement('section');
    section.className = 'travel-view ui-screen';
    section.dataset.travelBackdrop = backdropKey;
    applyScreenEnvironment(section, 'travel');
    section.style.setProperty('--travel-sky', `url('${assets.screens.travel.backdrops[backdropKey]}')`);
    section.style.setProperty('--travel-mist', `url('${assets.screens.travel.mist}')`);
    section.innerHTML = `
      <div class="travel-view__sky"></div>
      <div class="travel-view__mist"></div>
      <div class="travel-view__glow"></div>
      <div class="travel-view__particles" aria-hidden="true">${particleLayer()}</div>
      <div class="travel-view__vignette"></div>
      <div class="travel-view__scene-dim" aria-hidden="true"></div>
      <header class="travel-view__hud ui-hud ui-panel ui-panel--hud">
        <div class="travel-view__heading"><p class="eyebrow ui-eyebrow">Run · ${escapeHtml(state.run.regionId).toUpperCase()}</p><strong>Choisissez la prochaine étape</strong></div>
        <div class="travel-view__resources ui-hud__stats">
          <span class="ui-chip"><b>♛</b> Butin ${state.run.temporaryLoot.gold}</span>
          <span class="ui-chip"><b>✶</b> Réputation ${state.reputation}</span>
        </div>
        <div class="travel-view__hud-actions ui-hud__actions">
          <button class="ui-button ui-button--hud" type="button" data-action="clan">Compagnie</button>
          <button class="ui-button ui-button--hud" type="button" data-action="roadmap" aria-haspopup="dialog">Feuille de route</button>
        </div>
      </header>
      <div class="travel-view__choices">
        ${choices.map((node) => {
          const meta = NODE_PRESENTATION[node.type];
          return `
          <button type="button" class="route-choice route-choice--${node.type} ui-route-card" data-node="${escapeHtml(node.id)}">
            <span class="route-choice__type">${meta.label}</span>
            <span class="route-choice__main"><span class="route-choice__icon">${escapeHtml(node.icon)}</span><strong class="route-choice__title">${escapeHtml(node.label)}</strong></span>
            <span class="route-choice__meta">
              <span class="route-choice__stat route-choice__stat--risk"><small>Risque</small><span class="dots">${ratingDots(meta.risk)}</span></span>
              <span class="route-choice__stat route-choice__stat--reward"><small>Récompense</small><span class="dots">${ratingDots(meta.reward)}</span></span>
            </span>
          </button>
        `;
        }).join('') || '<p class="travel-view__end">La route s’achève ici.</p>'}
      </div>
      <div class="travel-party" aria-label="Compagnie en marche">
        ${deployed.map((unit, index) => {
          const definition = unitById.get(unit.definitionId);
          const kind = definition?.combatKind ?? 'knight';
          const slot = TRAVEL_PARTY_LAYOUT[index] ?? TRAVEL_PARTY_LAYOUT[TRAVEL_PARTY_LAYOUT.length - 1]!;
          return `<figure class="travel-hero travel-hero--${escapeHtml(kind)}" style="--hero-left:${slot.left}%;--hero-bottom:${slot.bottom}%;--hero-scale:${slot.scale};--hero-z:${slot.z}">
            <span class="travel-hero__shadow" aria-hidden="true"></span>
            <img class="travel-hero__sprite" src="${travelHeroSprite(kind)}" alt="${escapeHtml(unit.name)}">
            <figcaption>${escapeHtml(unit.name)}</figcaption>
          </figure>`;
        }).join('')}
      </div>
      <footer class="travel-view__secondary" aria-label="Options secondaires">
        <span>⚙ Options</span><i></i><span>▣ Crédits</span>
      </footer>
      ${roadmap}
    `;
    this.options.root.append(section);
    this.element = section;
    section.querySelector('[data-action="roadmap"]')?.addEventListener('click', () => this.openRoadmap());
    section.querySelectorAll('[data-action="roadmap-close"]').forEach((button) => button.addEventListener('click', () => this.closeRoadmap()));
    const roadmapElement = section.querySelector<HTMLElement>('.travel-roadmap');
    roadmapElement?.addEventListener('click', (event) => {
      if (event.target === roadmapElement) this.closeRoadmap();
    });
    section.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeRoadmap();
    });
    section.querySelector('[data-action="clan"]')?.addEventListener('click', () => this.options.onOpenClan());
    section.querySelectorAll<HTMLButtonElement>('[data-node]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (this.busy) return;
        const node = choices.find((candidate) => candidate.id === button.dataset.node);
        if (!node) return;
        this.busy = true;
        button.classList.add('is-selected');
        section.classList.add('is-travelling');
        section.querySelectorAll('button').forEach((candidate) => {
          candidate.disabled = true;
          candidate.setAttribute('aria-disabled', 'true');
        });
        await new Promise((resolve) => window.setTimeout(resolve, 420));
        this.close();
        await this.options.onSelect(node);
      });
    });
  }

  private openRoadmap(): void {
    const roadmap = this.element?.querySelector<HTMLElement>('.travel-roadmap');
    if (!roadmap) return;
    roadmap.hidden = false;
    roadmap.setAttribute('aria-hidden', 'false');
    this.element?.classList.add('is-roadmap-open');
    roadmap.focus();
  }

  private closeRoadmap(): void {
    const roadmap = this.element?.querySelector<HTMLElement>('.travel-roadmap');
    if (!roadmap || roadmap.hidden) return;
    roadmap.hidden = true;
    roadmap.setAttribute('aria-hidden', 'true');
    this.element?.classList.remove('is-roadmap-open');
  }

  close(): void {
    this.element?.remove();
    this.element = null;
    this.busy = false;
  }
}

