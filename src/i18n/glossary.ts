/**
 * The glossary retained on the operator's sheet (OD-2026-11-15-C, G1–G12). Each French term found in a catalog entry
 * requires its English form in the translation, so every route names people, places and rules the same way.
 */
export interface GlossaryTerm { french: RegExp; english: RegExp; label: string }

const term = (french: RegExp, english: RegExp, label: string): GlossaryTerm => ({ french, english, label });

export const GLOSSARY: readonly GlossaryTerm[] = Object.freeze([
  term(/La Voie des Sceaux/, /The Way of the Seals/, 'La Voie des Sceaux → The Way of the Seals'),
  term(/Élyndra/, /Élyndra/, 'Élyndra stays'),
  term(/Bois-Clair/, /Clearwood/, 'Bois-Clair → Clearwood'),
  term(/\bSceaux\b/, /\bSeals\b/i, 'Sceaux → Seals'),
  term(/\bSceau\b/, /\bSeals?\b/i, 'Sceau → Seal'),
  term(/\bOurs\b/, /\bBears?\b/, 'Ours → Bear'),
  term(/\bCorbeaux?\b/, /\bRavens?\b/, 'Corbeau → Raven'),
  term(/\bLoups?\b/, /\bWol(f|ves)\b/, 'Loup → Wolf'),
  term(/\bPhénix\b/, /\bPhoenix\b/, 'Phénix → Phoenix'),
  term(/\bSerpents?\b/, /\bSerpents?\b/, 'Serpent stays Serpent'),
  term(/\bSéraphine\b/, /\bSéraphine\b/, 'Séraphine keeps her accent'),
  term(/\bIntendant\b/, /\bSteward\b/, 'Intendant → Steward'),
  term(/Grand Inquisiteur/, /Grand Inquisitor/, 'Grand Inquisiteur → Grand Inquisitor'),
  term(/Ancien Ours/, /Elder Bear/, 'Ancien Ours → Elder Bear'),
  term(/Ancien Dragon/, /Elder Dragon/, 'Ancien Dragon → Elder Dragon'),
  term(/Maître Espion/, /Spymaster/, 'Maître Espion → Spymaster'),
  term(/Tournoi des Grands/, /Tournament of the Great/, 'Tournoi des Grands → Tournament of the Great'),
  term(/Arène des Destins/, /Arena of Fates/, 'Arène des Destins → Arena of Fates'),
  term(/\bOmbres Silencieuses\b/, /\bSilent Shadows\b/, 'Ombres Silencieuses → Silent Shadows'),
  term(/\b(les|des|aux) Ombres\b/, /\bShadows?\b/, 'les Ombres → the Shadows'),
  term(/\bPV\b/, /\bHP\b/, 'PV → HP'),
  term(/\bPA\b/, /\bAP\b/, 'PA → AP'),
  term(/\bBrûlure\b/, /\bBurn/, 'Brûlure → Burn'),
  term(/\bBrisée?s?\b/, /\b(Staggered|BROKEN|broken|Broken|shattered|Shattered|STAGGERED)\b/, 'Brisé → Staggered'),
  term(/\bMutisme\b/, /\bSilence\b/, 'Mutisme → Silence'),
  term(/\bEssoufflée?s?\b/, /\bWinded\b/i, 'Essoufflé → Winded'),
  term(/\bFurie\b/, /\bFury\b/i, 'Furie → Fury'),
  term(/\bDéfi\b/, /\bChallenge\b/i, 'Défi → Challenge'),
  term(/Registre de [Cc]ompagnie/, /Company Roster/, 'Registre de Compagnie → Company Roster'),
  term(/\bchronique\b/i, /\bchronicles?\b/i, 'chronique → chronicle'),
]);
