export type UnitMotionScenario =
  | 'light'
  | 'heavy'
  | 'ranged'
  | 'cast'
  | 'support'
  | 'hit'
  | 'critical'
  | 'boss'
  | 'boss-charge'
  | 'boss-ultimate'
  | 'ko-revive';

export interface UnitMotionWorkbenchOptions {
  enabled: boolean;
  play: (scenario: UnitMotionScenario) => Promise<void>;
  reset: () => void;
}

export interface UnitMotionWorkbenchHandle {
  dispose: () => void;
}

const SCENARIOS: readonly { id: UnitMotionScenario; label: string }[] = [
  { id: 'light', label: 'Léger' },
  { id: 'heavy', label: 'Lourd' },
  { id: 'ranged', label: 'Distance' },
  { id: 'cast', label: 'Magie' },
  { id: 'support', label: 'Soutien' },
  { id: 'hit', label: 'Impact' },
  { id: 'critical', label: 'Critique' },
  { id: 'boss', label: 'Boss' },
  { id: 'boss-charge', label: 'Charge Boss' },
  { id: 'boss-ultimate', label: 'Ultime Boss' },
  { id: 'ko-revive', label: 'K.O. / Relève' },
];

export function installUnitMotionWorkbench(options: UnitMotionWorkbenchOptions): UnitMotionWorkbenchHandle {
  if (!options.enabled || typeof document === 'undefined') return { dispose: () => undefined };
  document.querySelector('#unit-motion-workbench')?.remove();
  const element = document.createElement('aside');
  element.id = 'unit-motion-workbench';
  element.setAttribute('aria-label', 'Atelier QA des mouvements');
  element.innerHTML = `<header><b>Mouvements</b><span>Transformations seules</span></header><div>${SCENARIOS.map(({ id, label }) => `<button type="button" data-motion="${id}">${label}</button>`).join('')}</div><button type="button" data-motion-reset>Baseline</button>`;
  let busy = false;
  element.querySelectorAll<HTMLButtonElement>('[data-motion]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (busy) return;
      const scenario = button.dataset.motion as UnitMotionScenario | undefined;
      if (!scenario) return;
      busy = true;
      element.dataset.busy = 'true';
      try {
        await options.play(scenario);
      } finally {
        busy = false;
        delete element.dataset.busy;
      }
    });
  });
  element.querySelector<HTMLButtonElement>('[data-motion-reset]')?.addEventListener('click', options.reset);
  document.body.append(element);
  return { dispose: () => element.remove() };
}
