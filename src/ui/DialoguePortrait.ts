import { assets } from '../render/assetManifest';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';

export interface DialoguePortrait {
  src: string;
  cropX: string;
  cropY: string;
  scale: number;
}

/** Presentation metadata only. The image always comes from the canonical character roles. */
const CROP_OVERRIDES: Readonly<Record<string, Partial<Omit<DialoguePortrait, 'src'>>>> = {
  sage_seraphine: { cropY: '90%' },
  marian: { cropY: '100%' },
  serpent_oracle: { cropY: '105%' },
  refugee_mother: { cropY: '95%' },
  serpent_brute: { cropY: '95%' },
  lion_champion: { cropY: '45%' },
  serpent_general_boss: { cropY: '42%' },
  serpent_duelist_elite: { cropY: '45%' },
  shrine_apparition: { cropY: '60%' },
  forest_troll_elite: { cropY: '50%' },
  young_dragon_elite: { cropX: '-50%', cropY: '82%' },
};

export function resolveDialoguePortrait(actorId: string | undefined): DialoguePortrait | undefined {
  if (!actorId) return undefined;
  const profile = (assets.characterProfiles as Record<string, { ui?: string } | undefined>)[actorId];
  const src = resolveCharacterAsset(actorId, 'ui') ?? profile?.ui;
  if (!src?.startsWith('/')) return undefined;
  return { src, cropX: '50%', cropY: '88%', scale: 4.3, ...CROP_OVERRIDES[actorId] };
}
