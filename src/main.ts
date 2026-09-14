import './styles/app.css';
import { GameApp } from './game/GameApp';

const root = document.querySelector<HTMLElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#world-canvas');

if (!root || !canvas) {
  throw new Error('RPGThreeJS bootstrap failed: application roots are missing.');
}

const optionCProofEnabled = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('devOptionC') === 'forest-road';

if (optionCProofEnabled) {
  void import('./dev/optionCPhase4b/OptionCPhase4bProof').then(({ OptionCPhase4bProof }) => {
    const proof = new OptionCPhase4bProof(root, canvas);
    window.addEventListener('pagehide', () => proof.dispose(), { once: true });
    return proof.start();
  });
} else {
  const app = new GameApp(root, canvas);
  window.addEventListener('pagehide', () => app.dispose(), { once: true });
  void app.start();
}
