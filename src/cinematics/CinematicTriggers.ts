import type { VideoCinematicTrigger } from './CinematicTypes';

export interface VideoCinematicTriggerRegistry {
  beforeDialogue: Readonly<Record<string, string>>;
  beforeCombat: Readonly<Record<string, string>>;
  afterCombat: Readonly<Record<string, string>>;
  chapterBeat: Readonly<Record<string, string>>;
}

export const VIDEO_CINEMATIC_TRIGGERS: VideoCinematicTriggerRegistry = Object.freeze({
  beforeDialogue: Object.freeze({
    lion_finale_judgement: 'lion_judgement',
  }),
  beforeCombat: Object.freeze({
    serpent_captain: 'serpent_general_reveal',
    lion_chief: 'lion_champion_reveal',
  }),
  afterCombat: Object.freeze({}),
  chapterBeat: Object.freeze({}),
});

export function resolveVideoCinematicTrigger(
  trigger: VideoCinematicTrigger,
  registry: VideoCinematicTriggerRegistry = VIDEO_CINEMATIC_TRIGGERS,
): string | undefined {
  switch (trigger.hook) {
    case 'beforeDialogue': return registry.beforeDialogue[trigger.dialogueId];
    case 'beforeCombat': return registry.beforeCombat[trigger.combatId];
    case 'afterCombat': return registry.afterCombat[`${trigger.combatId}:${trigger.outcome}`] ?? registry.afterCombat[trigger.combatId];
    case 'chapterBeat': return registry.chapterBeat[trigger.beatId];
  }
}
