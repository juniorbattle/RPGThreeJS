import { currentLanguage } from './i18n';

/**
 * The three-letter code on a status badge, in English (OD-2026-11-15-C, guide « Statuses »). The French codes are unique
 * among the statuses, so they key the table; « FOR » is Might here, never the Strength stat, which is why the codes
 * are set by code at the two places that draw them and not looked up as texts.
 */
const ENGLISH_STATUS_CODES: Readonly<Record<string, string>> = Object.freeze({
  BRI: 'STG', ESS: 'WND', FUR: 'FRY', ENT: 'ROT', MUT: 'SIL', MAL: 'CRS', BRÛ: 'BRN', POI: 'PSN',
  AVE: 'BLD', FAI: 'WKN', RAL: 'SLW', PRO: 'TNT', REG: 'RGN', FOR: 'MGT', BAR: 'BAR',
});

export function statusShortCode(french: string): string {
  return currentLanguage() === 'en' ? ENGLISH_STATUS_CODES[french] ?? french : french;
}
