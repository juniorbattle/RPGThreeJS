import type { VfxContext } from './VfxTypes';
import { getVfxPreset, VFX_PRESET_IDS } from './VfxPresets';
import type { VfxSystem } from './VfxSystem';
import { skillById } from '../../game/skills';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS } from '../skillPresentation';
import {
  COMBAT_VFX_SKILL_IDS,
  applyResolvedPresentationToContext,
  resolveCombatVfxPresentation,
} from '../combatVfxPresentation';

export type VfxWorkbenchTarget = 'default' | 'active' | 'hovered';
export type VfxWorkbenchMode = 'raw' | 'combat';

export interface VfxWorkbenchOptions {
  system: VfxSystem;
  getContext: (target: VfxWorkbenchTarget) => VfxContext | null;
}

export const isVfxWorkbenchEnabled = (isDevelopment: boolean) => isDevelopment;

const skillLabel = (id: string) => skillById.get(id)?.name ?? id;

export function installVfxWorkbench(options: VfxWorkbenchOptions) {
  if (!isVfxWorkbenchEnabled(import.meta.env.DEV) || typeof document === 'undefined') return () => undefined;

  const panel = document.createElement('aside');
  panel.id = 'combat-vfx-workbench';
  panel.hidden = true;
  panel.style.cssText = [
    'position:fixed',
    'left:18px',
    'top:190px',
    'z-index:80',
    'width:250px',
    'padding:13px',
    'border:1px solid rgba(112,198,255,.55)',
    'border-radius:12px',
    'background:rgba(5,14,28,.94)',
    'box-shadow:0 14px 42px rgba(0,0,0,.55)',
    'color:#e8f2ff',
    'font:600 12px/1.35 Inter,system-ui,sans-serif',
    'pointer-events:auto',
  ].join(';');
  panel.innerHTML = `
    <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">
      <strong style="color:#8cd7ff;letter-spacing:.12em">VFX WORKBENCH</strong>
      <button type="button" data-vfx-close aria-label="Fermer" style="border:0;background:transparent;color:#b9c9dd;cursor:pointer">×</button>
    </header>
    <div style="display:flex;gap:4px;margin-bottom:8px">
      <label style="flex:1;display:flex;gap:4px;align-items:center;cursor:pointer">
        <input type="radio" name="vfx-mode" value="combat" data-vfx-mode="combat" checked> Combat
      </label>
      <label style="flex:1;display:flex;gap:4px;align-items:center;cursor:pointer">
        <input type="radio" name="vfx-mode" value="raw" data-vfx-mode="raw"> Raw
      </label>
    </div>
    <select data-vfx-skill style="width:100%;padding:7px;border:1px solid #385271;border-radius:6px;background:#0b1b31;color:#fff">
      <optgroup label="Hero Skills">${HERO_SKILL_IDS.map((id) => `<option value="${id}">${skillLabel(id)}</option>`).join('')}</optgroup>
      <optgroup label="Enemy / Boss">${ENEMY_SKILL_IDS.map((id) => `<option value="${id}">${skillLabel(id)}</option>`).join('')}</optgroup>
    </select>
    <select data-vfx-preset style="width:100%;padding:7px;border:1px solid #385271;border-radius:6px;background:#0b1b31;color:#fff;display:none">
      ${VFX_PRESET_IDS.map((id) => `<option value="${id}">${getVfxPreset(id)?.label ?? id}</option>`).join('')}
    </select>
    <div data-vfx-resolved style="display:none;margin-top:7px;padding:7px;border:1px solid #2a3f5a;border-radius:6px;background:#0a1525;font-size:11px;line-height:1.5;color:#91abc8">
      <div data-vfx-resolved-preset></div>
      <div data-vfx-resolved-tier></div>
      <div data-vfx-resolved-scale></div>
      <div data-vfx-resolved-orient></div>
      <div data-vfx-resolved-intensity></div>
      <div data-vfx-resolved-particles></div>
      <div data-vfx-resolved-duration></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
      <button type="button" data-vfx-play="default">Play</button>
      <button type="button" data-vfx-play="active">Unité active</button>
      <button type="button" data-vfx-play="hovered" style="grid-column:1/-1">Cible survolée</button>
    </div>
    <div data-vfx-raw-controls>
      <label style="display:block;margin-top:10px">Intensité <output data-vfx-intensity-output>1.00</output>
        <input data-vfx-intensity type="range" min="0.5" max="1.5" value="1" step="0.05" style="width:100%">
      </label>
      <label style="display:block;margin-top:6px">Particules <output data-vfx-particles-output>1.00</output>
        <input data-vfx-particles type="range" min="0.5" max="1.5" value="1" step="0.05" style="width:100%">
      </label>
      <label style="display:block;margin-top:6px">Durée <output data-vfx-duration-output>1.00</output>
        <input data-vfx-duration type="range" min="0.6" max="1.4" value="1" step="0.05" style="width:100%">
      </label>
    </div>
    <label style="display:flex;gap:7px;align-items:center;margin:9px 0">
      <input data-vfx-reduced type="checkbox"> Aperçu graphique réduit
    </label>
    <button type="button" data-vfx-copy style="width:100%">Copier le preset JSON</button>
    <small data-vfx-status style="display:block;min-height:16px;margin-top:7px;color:#91abc8">Ctrl + Alt + V — Combat Preview = authoritative QA</small>
  `;

  for (const button of panel.querySelectorAll('button')) {
    button.style.cssText += ';padding:7px;border:1px solid #385271;border-radius:6px;background:#10243d;color:#dcecff;cursor:pointer';
  }
  document.body.appendChild(panel);

  const select = panel.querySelector<HTMLSelectElement>('[data-vfx-preset]');
  const skillSelect = panel.querySelector<HTMLSelectElement>('[data-vfx-skill]');
  const intensity = panel.querySelector<HTMLInputElement>('[data-vfx-intensity]');
  const particleScale = panel.querySelector<HTMLInputElement>('[data-vfx-particles]');
  const durationScale = panel.querySelector<HTMLInputElement>('[data-vfx-duration]');
  const reduced = panel.querySelector<HTMLInputElement>('[data-vfx-reduced]');
  const status = panel.querySelector<HTMLElement>('[data-vfx-status]');
  const rawControls = panel.querySelector<HTMLElement>('[data-vfx-raw-controls]');
  const resolvedPanel = panel.querySelector<HTMLElement>('[data-vfx-resolved]');
  if (!select || !skillSelect || !intensity || !particleScale || !durationScale || !reduced || !status || !rawControls || !resolvedPanel) {
    panel.remove();
    return () => undefined;
  }

  const resolvedPreset = panel.querySelector<HTMLElement>('[data-vfx-resolved-preset]');
  const resolvedTier = panel.querySelector<HTMLElement>('[data-vfx-resolved-tier]');
  const resolvedScale = panel.querySelector<HTMLElement>('[data-vfx-resolved-scale]');
  const resolvedOrient = panel.querySelector<HTMLElement>('[data-vfx-resolved-orient]');
  const resolvedIntensity = panel.querySelector<HTMLElement>('[data-vfx-resolved-intensity]');
  const resolvedParticles = panel.querySelector<HTMLElement>('[data-vfx-resolved-particles]');
  const resolvedDuration = panel.querySelector<HTMLElement>('[data-vfx-resolved-duration]');

  const bindOutput = (input: HTMLInputElement, selector: string) => {
    const output = panel.querySelector<HTMLOutputElement>(selector);
    const refresh = () => { if (output) output.value = Number(input.value).toFixed(2); };
    input.addEventListener('input', refresh);
    refresh();
  };
  bindOutput(intensity, '[data-vfx-intensity-output]');
  bindOutput(particleScale, '[data-vfx-particles-output]');
  bindOutput(durationScale, '[data-vfx-duration-output]');

  let mode: VfxWorkbenchMode = 'combat';

  const updateResolvedDisplay = () => {
    if (mode !== 'combat') { resolvedPanel.style.display = 'none'; return; }
    const resolved = resolveCombatVfxPresentation(skillSelect.value);
    if (!resolved) { resolvedPanel.style.display = 'none'; return; }
    resolvedPanel.style.display = 'block';
    if (resolvedPreset) resolvedPreset.textContent = `Preset: ${resolved.presetId}`;
    if (resolvedTier) resolvedTier.textContent = `Tier: ${resolved.tier}${resolved.visualTier ? ` (visual ${resolved.visualTier})` : ''}${resolved.ultimate ? ' — ULTIMATE' : ''}`;
    if (resolvedScale) resolvedScale.textContent = `Scale: ${resolved.scaleTier} × ${resolved.presentationScale.toFixed(2)}`;
    if (resolvedOrient) resolvedOrient.textContent = `Orientation: ${resolved.orientation ?? 'none'}`;
    if (resolvedIntensity) resolvedIntensity.textContent = `Intensity: ${resolved.intensity.toFixed(2)}`;
    if (resolvedParticles) resolvedParticles.textContent = `Particles: ${resolved.particleScale.toFixed(2)}`;
    if (resolvedDuration) resolvedDuration.textContent = `Duration: ${resolved.durationScale.toFixed(2)}`;
  };

  const setMode = (newMode: VfxWorkbenchMode) => {
    mode = newMode;
    const isCombat = mode === 'combat';
    skillSelect.style.display = isCombat ? 'block' : 'none';
    select.style.display = isCombat ? 'none' : 'block';
    rawControls.style.display = isCombat ? 'none' : 'block';
    updateResolvedDisplay();
  };

  for (const radio of panel.querySelectorAll<HTMLInputElement>('[data-vfx-mode]')) {
    radio.addEventListener('change', () => { if (radio.checked) setMode(radio.value as VfxWorkbenchMode); });
  }
  skillSelect.addEventListener('change', updateResolvedDisplay);
  setMode('combat');

  const play = (target: VfxWorkbenchTarget) => {
    const base = options.getContext(target);
    if (!base) {
      status.textContent = target === 'hovered' ? 'Survolez une cible valide.' : 'Aucune unité disponible.';
      return;
    }
    if (mode === 'combat') {
      const resolved = resolveCombatVfxPresentation(skillSelect.value);
      if (!resolved) {
        status.textContent = `Non résolu : ${skillSelect.value}`;
        return;
      }
      const context = applyResolvedPresentationToContext(resolved, {
        ...base,
        reducedGraphics: reduced.checked,
      });
      const result = options.system.play(resolved.presetId, context);
      status.textContent = result.played ? `Combat : ${resolved.skillId} → ${resolved.presetId}` : `Preset absent : ${resolved.presetId}`;
      void result.completion.catch((error: unknown) => {
        console.warn('[CombatVfx] Workbench combat playback failed safely.', error);
        status.textContent = 'Lecture interrompue sans impact combat.';
      });
      return;
    }
    const context: VfxContext = {
      ...base,
      intensity: Number(intensity.value),
      particleScale: Number(particleScale.value),
      durationScale: Number(durationScale.value),
      reducedGraphics: reduced.checked,
    };
    const result = options.system.play(select.value, context);
    status.textContent = result.played ? `Raw : ${select.value}` : `Preset absent : ${select.value}`;
    void result.completion.catch((error: unknown) => {
      console.warn('[CombatVfx] Workbench raw playback failed safely.', error);
      status.textContent = 'Lecture interrompue sans impact combat.';
    });
  };

  for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-vfx-play]')) {
    button.addEventListener('click', () => play(button.dataset.vfxPlay as VfxWorkbenchTarget));
  }
  panel.querySelector('[data-vfx-close]')?.addEventListener('click', () => { panel.hidden = true; });
  panel.querySelector('[data-vfx-copy]')?.addEventListener('click', () => {
    const presetId = mode === 'combat'
      ? resolveCombatVfxPresentation(skillSelect.value)?.presetId ?? select.value
      : select.value;
    const preset = getVfxPreset(presetId);
    if (!preset) return;
    const text = JSON.stringify(preset, null, 2);
    void navigator.clipboard?.writeText(text).then(
      () => { status.textContent = 'Preset copié.'; },
      () => { status.textContent = 'Copie refusée par le navigateur.'; },
    );
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.altKey && event.code === 'KeyV') {
      event.preventDefault();
      panel.hidden = !panel.hidden;
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Browser-driven QA cannot emit Ctrl+Alt+V because that chord is reserved
  // for its virtual clipboard. Keep the shortcut as the primary entry point,
  // and allow an explicit dev-only URL opt-in for automated visual checks.
  if (new URLSearchParams(window.location.search).get('vfx') === '1') {
    panel.hidden = false;
  }

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    panel.remove();
  };
}
