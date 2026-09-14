import type { DialogueSequence } from './types';

/**
 * Presentation plans are selected by runtime-visible structure, not prose.
 * Text-only contextual variants therefore share a plan, while inserted steps,
 * speaker substitutions, and choice-state changes receive distinct plans.
 */
export function dialoguePresentationShapeSignature(sequence: Readonly<DialogueSequence>): string {
  return sequence.steps
    .map((step) => `${step.id}@${step.actorId ?? `speaker:${step.speaker}`}@${step.choices?.length ?? 0}`)
    .join('|');
}
