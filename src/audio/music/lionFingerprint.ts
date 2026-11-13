/**
 * Fingerprint of the Lion's music (dev and tests only): the written tracks, what the generator makes of them over two
 * rounds of each form, the voice profiles, every computed sample and every room. The plateaux add tracks, timbres and
 * rooms beside the Lion's; this proves that the Lion's own music stays byte-identical while they do.
 */
import { compute, plan, type SampledInstrument } from './bank';
import { composePass } from './compose';
import { impulseResponse, type HallId } from './hall';
import { THEMES, type MusicContextId } from './themes';
import { PROFILES, type VoiceInstrument } from './voices';

export const LION_CONTEXTS: readonly MusicContextId[] = ['title', 'map', 'refuge', 'tension', 'drama', 'combat', 'boss', 'victory', 'defeat'];
export const LION_VOICES: readonly VoiceInstrument[] = ['strings', 'flute', 'reed', 'horn', 'brass', 'choir'];
export const LION_SAMPLED: readonly SampledInstrument[] = ['harp', 'lute', 'pizz', 'timpani', 'drum', 'kit', 'frame', 'cymbal'];
export const LION_HALLS: readonly HallId[] = ['hall', 'chapel', 'field'];

/** FNV-1a over a string. */
export const fnv = (text: string): string => [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261).toString(16).padStart(8, '0');
/** Samples quantised to 1e-6, so the hash reads the sound and not the last bit of a float. */
const samples = (data: Float32Array): string => fnv(Array.from(data, (x) => Math.round(x * 1e6)).join(','));

export function lionTrackFingerprint(id: MusicContextId): string {
  const theme = THEMES[id];
  const passes = Array.from({ length: theme.form.length * 2 + 1 }, (_, pass) => composePass(theme, pass));
  return fnv(JSON.stringify(theme)) + fnv(JSON.stringify(passes));
}

export function lionFingerprint(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of LION_CONTEXTS) out[`track:${id}`] = lionTrackFingerprint(id);
  for (const voice of LION_VOICES) out[`voice:${voice}`] = fnv(JSON.stringify(PROFILES[voice]));
  for (const instrument of LION_SAMPLED) out[`sampled:${instrument}`] = fnv(JSON.stringify(plan([instrument]))) + fnv(plan([instrument]).map((item) => samples(compute(48000, item))).join('/'));
  for (const hall of LION_HALLS) out[`hall:${hall}`] = impulseResponse(48000, hall).map(samples).join('');
  return out;
}
