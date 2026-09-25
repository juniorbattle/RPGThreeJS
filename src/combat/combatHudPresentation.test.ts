import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  COMBAT_PORTRAIT_FRAMING, combatHudCameraFov, combatPortraitCrop, combatPortraitFraming, renderCombatActionDock, renderCombatActionPreview, renderCombatObjective,
  renderCombatSkillRows, renderCombatStatuses, renderCombatTurnOrder,
  renderCombatUnitCard, selectedCombatAction,
} from './combatHudPresentation';

describe('combat HUD presentation', () => {
  const unit = Object.freeze({
    name: 'Kestrel', className: 'Archer', team: 'player' as const,
    portrait: '/assets/characters/pixel/masters/kestrel.png',
    hp: 72, maxhp: 90, ap: 3, maxap: 5, alive: true,
    aptitude: Object.freeze({ name: 'Tir de précision', desc: '+5% de précision à portée maximale.' }),
    statuses: Object.freeze([{ label: 'Brûlure', shortCode: 'BRÛ', turns: 2, color: '#fff0c2', borderColor: '#ff983d', indicatorUrl: '/assets/status-indicators/runtime/status_burn_indicator.png' }]),
  });

  it('renders the selected identity, HP, AP, passive and canonical portrait without a duplicate sprite', () => {
    const html = renderCombatUnitCard(unit, '<button class="stats-toggle">Afficher stats</button>');
    expect(html).toContain('/assets/characters/pixel/masters/kestrel.png');
    expect(html).toContain('Kestrel');
    expect(html).toContain('Archer');
    expect(html).toContain('72 / 90');
    expect(html).toContain('aria-label="3 sur 5 points d\'action"');
    expect((html.match(/class="on"/g) ?? []).length).toBe(3);
    expect(html).toContain('Tir de précision');
    expect(html).not.toContain('du-sprite');
    expect(html).not.toContain('Niv.');
  });

  it('shows runtime level only when supplied and falls back to an initial without a portrait', () => {
    const html = renderCombatUnitCard({ ...unit, portrait: '', level: 12, statuses: [] }, '');
    expect(html).toContain('Niv. 12');
    expect(html).toContain('<span>K</span>');
    expect(html).not.toContain('<img');
  });

  it('uses canonical crop metadata so creature portraits remain recognizable', () => {
    expect(combatPortraitCrop('/assets/characters/pixel/masters/archer.png')).toBe('upper-body');
    expect(combatPortraitCrop('/assets/characters/pixel/masters/wolf.png')).toBe('creature');
    expect(renderCombatUnitCard({ ...unit, name: 'Loup', portrait: '/assets/characters/pixel/masters/wolf.png', statuses: [] }, '')).toContain('combat-portrait--creature');
  });

  it('applies combat-only framing to exact canonical portrait paths', () => {
    const wolf = '/assets/characters/pixel/masters/wolf.png';
    expect(combatPortraitFraming(wolf)).toEqual({
      crop: 'creature',
      style: ' style="--combat-portrait-scale:2.45;--combat-portrait-x:-21%;--combat-portrait-y:-38%"',
    });
    expect(combatPortraitCrop('/assets/characters/pixel/masters/serpent_raider.png')).toBe('upper-body');
    expect(combatPortraitCrop('/assets/characters/pixel/masters/serpent_general_boss.png')).toBe('elite');
    expect(combatPortraitFraming('/other/wolf.png').style).toBe('');
    const html = renderCombatTurnOrder([{ name: 'Loup', team: 'foe', portrait: wolf, alive: true, active: true }], 1, '1 / 1');
    expect(html).toContain('--combat-portrait-x:-21%');
    expect((html.match(/<img/g) ?? []).length).toBe(1);
  });

  it('explicitly frames every built-in runtime and recruit portrait at its canonical path', () => {
    const runtime = readFileSync(resolve('src/combat/legacyCombatRuntime.js'), 'utf8');
    const recruits = readFileSync(resolve('src/game/catalog.ts'), 'utf8');
    const portraitFields = [...(runtime + recruits).matchAll(/portrait\s*:\s*'([^']+\.png)'/g)].map(match => match[1]!);
    const bossPortraits = [...runtime.matchAll(/(?:serpent_captain|serpent_general_boss|alaric|lion_chief):'([^']+\.png)'/g)].map(match => match[1]!);
    const reachable = [...new Set([...portraitFields, ...bossPortraits])].sort();
    expect(reachable).toHaveLength(36);
    expect(Object.keys(COMBAT_PORTRAIT_FRAMING).sort()).toEqual(reachable);
    for (const portrait of reachable) {
      expect(existsSync(resolve('public', portrait.slice(1))), portrait).toBe(true);
      const framing = COMBAT_PORTRAIT_FRAMING[portrait]!;
      expect(framing.scale).toBeGreaterThan(1);
      expect(Number.isFinite(framing.x) && Number.isFinite(framing.y)).toBe(true);
      const card = renderCombatUnitCard({ ...unit, portrait, statuses: [] }, '');
      const turn = renderCombatTurnOrder([{ name: unit.name, team: 'player', portrait, alive: true, active: true }], 1, '1 / 1');
      for (const html of [card, turn]) {
        expect(html).toContain(`src="${portrait}"`);
        expect(html).toContain(`--combat-portrait-scale:${framing.scale}`);
        expect(html).toContain(`--combat-portrait-x:${framing.x}%`);
        expect(html).toContain(`--combat-portrait-y:${framing.y}%`);
      }
    }
    expect(combatPortraitFraming('/assets/characters/pixel/masters/future.png').style).toBe('');
    expect(combatPortraitCrop('/assets/characters/pixel/masters/future.png')).toBe('contain');
  });

  it('highlights only the runtime active actor in turn order', () => {
    const html = renderCombatTurnOrder([
      { name: 'Kestrel', team: 'player', portrait: unit.portrait, alive: true, active: true },
      { name: 'Loup', team: 'foe', portrait: '/assets/wolf.png', alive: true, active: false },
    ], 2, '1 / 2');
    expect(html).toContain('Manche');
    expect((html.match(/chip ally active/g) ?? []).length).toBe(1);
    expect(html).toContain('chip foe');
    expect(html).toContain('Loup');
  });

  it('maps movement, target and submenu state to the selected action', () => {
    expect(selectedCombatAction('move')).toBe('move');
    expect(selectedCombatAction('target', 'attack')).toBe('attack');
    expect(selectedCombatAction('target', 'item')).toBe('item');
    expect(selectedCombatAction('target', 'a_precise_shot')).toBe('skill');
    expect(selectedCombatAction('menu', undefined, 'skill')).toBe('skill');
    expect(selectedCombatAction('menu')).toBeNull();
  });

  it('renders action availability and selected state from supplied values', () => {
    const html = renderCombatActionDock([
      { key: 'move', label: 'Déplacer', icon: '✣', detail: 'MOV 3', disabled: false },
      { key: 'skill', label: 'Compétences', icon: '✦', detail: '1 PA', disabled: true },
    ], 'move');
    expect(html).toContain('action-move');
    expect(html).toContain('is-selected');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('action-skill campaign-ui-button campaign-ui-button--disabled dis');
    expect(html).toContain(' disabled');
  });

  it('renders real skill descriptions, costs and disabled availability', () => {
    const html = renderCombatSkillRows([
      { id: 'a_precise_shot', name: 'Tir précis', cost: 2, description: 'Dégâts élevés à distance.', disabled: true },
      { id: 'a_arrow_rain', name: 'Pluie de flèches', cost: 3, description: 'Attaque de zone.', disabled: false },
    ]);
    expect(html).toContain('Tir précis');
    expect(html).toContain('Dégâts élevés à distance.');
    expect(html).toContain('2 PA');
    expect(html).toContain('data-s="a_precise_shot" disabled');
    expect(html).toContain('Pluie de flèches');
  });

  it('renders target preview metrics only when the runtime supplies them', () => {
    const html = renderCombatActionPreview({ attacker: 'Kestrel', action: 'Tir précis', target: 'Loup', targetCount: 1, helpful: false, cost: 2, accuracy: 86, estimate: 27, valueLabel: 'Dégâts' });
    expect(html).toContain('Kestrel');
    expect(html).toContain('Tir précis');
    expect(html).toContain('Loup');
    expect(html).toContain('86%');
    expect(html).toContain('Dégâts ~27');
    expect(html).toContain('2 PA');
    const support = renderCombatActionPreview({ attacker: 'Clerc', action: 'Soin', target: 'Kestrel', targetCount: 1, helpful: true, cost: 2, estimate: 18, valueLabel: 'Soin' });
    expect(support).toContain('Soin ~18');
    expect(support).not.toContain('%');
  });

  it('renders status assets, durations and KO without changing status input', () => {
    const html = renderCombatStatuses(unit.statuses);
    expect(html).toContain('status_burn_indicator.png');
    expect(html).toContain('Brûlure, 2 tours');
    expect(html).toContain('status-chip__turns">2');
    expect(renderCombatStatuses([], false)).toContain('K.O.');
    expect(unit.statuses[0]!.turns).toBe(2);
  });

  it('renders current objective progress and requested expansion', () => {
    const objective = Object.freeze({ title: 'Starving Pack', condition: 'Éliminer les pillards', round: 'Manche 1', foesDone: 1, foesTotal: 3, squadLabel: 'Escouade debout', squadValue: '4 / 4', expanded: true });
    const html = renderCombatObjective(objective);
    expect(html).toContain('<details open>');
    expect(html).toContain('Éliminer les pillards');
    expect(html).toContain('1 / 3');
    expect(html).toContain('Manche 1');
    expect(html).toContain('4 / 4');
  });

  it('escapes dynamic runtime text without mutating the supplied objects', () => {
    const hostile = Object.freeze({ ...unit, name: '<script>alert(1)</script>', statuses: [] });
    const html = renderCombatUnitCard(hostile, '');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(hostile.name).toBe('<script>alert(1)</script>');
  });

  it('widens the tactical camera field only for narrow HUD layouts', () => {
    expect(combatHudCameraFov(1440, 33)).toBe(33);
    expect(combatHudCameraFov(620, 33)).toBeGreaterThan(33);
    expect(combatHudCameraFov(390, 33)).toBeGreaterThan(59);
  });
});
