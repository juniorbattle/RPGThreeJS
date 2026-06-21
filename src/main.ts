import './styles/app.css';
import { GameApp } from './game/GameApp';

const root = document.querySelector<HTMLElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#world-canvas');

if (!root || !canvas) {
  throw new Error('RPGThreeJS bootstrap failed: application roots are missing.');
}

const app = new GameApp(root, canvas);
void app.start();
