import './styles/app.css';
import { GameApp } from './game/GameApp';

const root = document.querySelector<HTMLElement>('#app');
const canvas = document.querySelector<HTMLCanvasElement>('#world-canvas');

if (!root || !canvas) {
  throw new Error('RPGThreeJS bootstrap failed: application roots are missing.');
}

const optionCProofEnabled = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('devOptionC') === 'forest-road';

const optionC4cLabEnabled = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('devOptionC') === 'phase4c-labs';

if (optionCProofEnabled) {
  void import('./dev/optionCPhase4b/OptionCPhase4bProof').then(({ OptionCPhase4bProof }) => {
    const proof = new OptionCPhase4bProof(root, canvas);
    window.addEventListener('pagehide', () => proof.dispose(), { once: true });
    return proof.start();
  });
} else if (optionC4cLabEnabled) {
  void import('./dev/optionCPhase4c/OptionCPhase4cLabs').then(({ OptionCPhase4cLabRouter }) => {
    const labs = new OptionCPhase4cLabRouter(root, canvas);
    window.addEventListener('pagehide', () => labs.dispose(), { once: true });
    return labs.start();
  });
} else {
  const app = new GameApp(root, canvas);
  window.addEventListener('pagehide', () => app.dispose(), { once: true });
  void app.start();
}
