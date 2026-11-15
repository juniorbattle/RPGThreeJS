import './styles/app.css';
import './ui/dialogue-alignment.css';
import { GameApp } from './game/GameApp';
import { installGamepadNavigator } from './ui/GamepadNavigator';
import { initLanguage } from './i18n/i18n';

const root = document.querySelector<HTMLElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#world-canvas');

if (!root || !canvas) {
  throw new Error('RPGThreeJS bootstrap failed: application roots are missing.');
}

// OD-2026-11-15-C: the stored language applies before the first screen; French starts at once.
void initLanguage().then(() => {
  const app = new GameApp(root, canvas);
  const gamepad = installGamepadNavigator(window, { announce: true });
  window.addEventListener('pagehide', () => { gamepad?.dispose(); app.dispose(); }, { once: true });
  void app.start();
});
