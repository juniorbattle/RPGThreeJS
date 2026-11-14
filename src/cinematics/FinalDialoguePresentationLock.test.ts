/**
 * The Lion dialogue presentation lock is exactly what its generator writes (`npm run cinematics:generate-dialogue-lock`):
 * a dialogue whose shape changes, or a staging rule edited in the generator, shows here until the lock is regenerated.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as committed from './FinalDialoguePresentation.generated';
import {
  DIALOGUE_PRESENTATION_LOCK_FILE,
  buildDialoguePresentationLock,
  renderDialoguePresentationLock,
  validateDialoguePresentationLock,
  type DialoguePresentationLock,
} from '../../tools/cinematics/dialoguePresentationLock';

let built: DialoguePresentationLock | undefined;
const lock = (): DialoguePresentationLock => (built ??= buildDialoguePresentationLock(committed));

describe('the Lion dialogue presentation lock', () => {
  it('is exactly what the generator writes', () => {
    const file = readFileSync(DIALOGUE_PRESENTATION_LOCK_FILE, 'utf8').replace(/\r\n/g, '\n');
    expect(renderDialoguePresentationLock(lock()) === file, 'Regenerate it: npm run cinematics:generate-dialogue-lock').toBe(true);
  });

  it('passes the generator checks', () => {
    expect(validateDialoguePresentationLock(lock())).toEqual([]);
  });
});
