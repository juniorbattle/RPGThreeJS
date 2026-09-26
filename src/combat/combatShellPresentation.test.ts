import { describe, expect, it } from 'vitest';
import { COMBAT_PORTRAIT_FRAMING } from './combatHudPresentation';
import { renderCombatResult, renderDeploymentCard, renderDeploymentPreview } from './combatShellPresentation';

describe('combat shell presentation', () => {
  it('uses the approved canonical combat portrait framing without changing selection state', () => {
    const unit = { name: 'Alistair', className: 'Chevalier', portrait: '/assets/characters/pixel/masters/alistair.png', hp: 88, maxhp: 100, mov: 2 };
    const snapshot = structuredClone(unit);
    const card = renderDeploymentCard(unit, 'alistair', true, false);
    const preview = renderDeploymentPreview(unit, false);
    expect(card).toContain(`--combat-portrait-scale:${COMBAT_PORTRAIT_FRAMING[unit.portrait]!.scale}`);
    expect(preview).toContain('88 / 100');
    expect(preview).toContain('MOV');
    expect(unit).toEqual(snapshot);
  });

  it('renders runtime reward and standing truth in one result family', () => {
    const markup = renderCombatResult({ tone: 'victory', title: 'Victoire', subtitle: 'Combat', detailLabel: 'Objectif sécurisé', detail: 'Passage sûr', buttonLabel: 'Continuer', participants: [{ name: 'A', alive: true }, { name: 'B', alive: false }], rewards: { gold: 40, materials: { red_gem: 2 }, reputation: 3 } });
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('Récompenses');
    expect(markup).toContain('Gemmes rouges');
    expect(markup).toContain('+40');
    expect(markup).toContain('A</span><b>Debout');
    expect(markup).toContain('B</span><b>K.O.');
    expect(markup).not.toContain('XP');
  });

  it('keeps defeat and wave completion on their existing actions and with distinct weight', () => {
    const base = { subtitle: 'La formation tient encore la ligne.', detailLabel: 'Mode', detail: 'Renforts', participants: [] };
    const wave = renderCombatResult({ ...base, tone: 'wave', title: 'Vague 1 vaincue', buttonLabel: 'Vague 2 ▶' });
    const defeat = renderCombatResult({ ...base, tone: 'defeat', title: 'Défaite', buttonLabel: 'Revenir à la carte' });
    expect(wave).toContain('Vague 2 ▶');
    expect(wave).not.toContain('État de la compagnie');
    expect(defeat).toContain('Route brisée');
    expect(defeat).toContain('État de la compagnie');
  });
});
