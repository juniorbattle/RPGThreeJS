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
  alaric: { cropY: '27%', scale: 3.25 },
  maelor: { cropY: '26%', scale: 3.25 },
  sage_seraphine: { cropY: '43%', scale: 3.4 },
};

export function resolveDialoguePortrait(actorId: string | undefined): DialoguePortrait | undefined {
  if (!actorId) return undefined;
  const profile = (assets.characterProfiles as Record<string, { ui?: string } | undefined>)[actorId];
  const src = resolveCharacterAsset(actorId, 'ui') ?? profile?.ui;
  if (!src?.startsWith('/')) return undefined;
  return { src, cropX: '50%', cropY: '33%', scale: 3.25, ...CROP_OVERRIDES[actorId] };
}
