export interface ExtractedKey { zone: string; sites: string[] }
export const DEV_ONLY_SOURCES: readonly RegExp[];
export const MANUAL_KEYS: readonly string[];
export const MANUAL_ITEM_KEYS: readonly string[];
export const MANUAL_INTERFACE_KEYS: readonly string[];
export const ZONES: readonly string[];
export function normalizeKey(text: string): string;
export function isFrenchText(text: string): boolean;
export function domPieces(text: string): string[];
export function extractFromSource(file: string, sourceText: string): Array<{ key: string; file: string; line: number; kind: string }>;
export function extractFromHtml(file: string, html: string): Array<{ key: string; file: string; line: number; kind: string }>;
export function isPlayerSource(relative: string): boolean;
export function listPlayerSources(root: string): string[];
export function zoneOf(relative: string): string;
export function extractAll(root: string, files?: string[]): Map<string, ExtractedKey>;
