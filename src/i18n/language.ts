/**
 * The player's language from the settings menu (OD-2026-11-15-C, A6). Kept on this device, outside the saves, like the
 * reduced-motion choice: loading a chronicle never changes it. French is the source and the default; the browser's own
 * language is never read.
 */
export type Language = 'fr' | 'en';

export const LANGUAGE_PREFERENCE_KEY = 'rpg-threejs:language-preference:v1';

/** The stored choice, or null when the player never chose (the game then plays in French). */
export function readLanguagePreference(): Language | null {
  try {
    const raw = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (raw === null) return null;
    const value = JSON.parse(raw) as { language?: unknown } | null;
    return value?.language === 'en' || value?.language === 'fr' ? value.language : null;
  } catch {
    return null;
  }
}

export function writeLanguagePreference(language: Language): void {
  try { localStorage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify({ language })); }
  catch { /* A denied preference write never blocks the change for this session. */ }
}
