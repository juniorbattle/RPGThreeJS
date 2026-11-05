import './styles/app.css';
import './ui/dialogue-alignment.css';
import { GameApp } from './game/GameApp';
import { installGamepadNavigator } from './ui/GamepadNavigator';

const root = document.querySelector<HTMLElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#world-canvas');

if (!root || !canvas) {
  throw new Error('RPGThreeJS bootstrap failed: application roots are missing.');
}

const app = new GameApp(root, canvas);
const gamepad = installGamepadNavigator(window, { announce: true });
window.addEventListener('pagehide', () => { gamepad?.dispose(); app.dispose(); }, { once: true });
void app.start();
