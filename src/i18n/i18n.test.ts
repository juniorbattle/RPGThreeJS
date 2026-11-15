// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { DomTranslator } from './domTranslator';
import { currentLanguage, joinList, tf, tr, useCatalogForTests } from './i18n';
import { LANGUAGE_PREFERENCE_KEY, readLanguagePreference, writeLanguagePreference } from './language';

const ENTRIES = {
  'Continuer': 'Continue',
  'Qu’allez-vous sauver ?': 'What will you save?',
  'Bois-Clair': 'Clearwood',
  'Le Dragon': 'The Dragon',
  'Prochaine étape : {0}.': 'Next: {0}.',
  '{0} est K.O. !': '{0} is KO!',
  '{0} est {1} — tour passé.': '{0} is {1} — turn skipped.',
  'Brisé': 'Staggered',
  'Brûlure': 'Burn',
  'Poison': 'Poison',
  'Réputation': 'Reputation',
  'Foudre Céleste': 'Celestial Lightning',
  'Du minerai volé.{0}': 'Stolen ore.{0}',
  'À Bois-Clair, la bourse du clan nous a tenus debout.': 'At Clearwood, the clan’s purse kept us standing.',
  'Vous m’avez écouté : {0}.': 'You listened to me: {0}.',
  'emporter les coffres': 'carry off the coffers',
  'faire taire les témoins': 'silence the witnesses',
  'couvrir la fuite': 'cover the escape',
  '{1} devant {0}': '{0} faces {1}',
};

afterEach(() => {
  useCatalogForTests(null);
  localStorage.clear();
});

describe('i18n lookup (OD-2026-11-15-C)', () => {
  it('returns French unchanged while French is the language', () => {
    expect(currentLanguage()).toBe('fr');
    expect(tr('Continuer')).toBe('Continuer');
    expect(tf('{0} est K.O. !', 'Kestrel')).toBe('{0} est K.O. !'.replace('{0}', 'Kestrel'));
  });

  it('finds exact texts, keeping the surrounding whitespace', () => {
    useCatalogForTests(ENTRIES);
    expect(tr('Continuer')).toBe('Continue');
    expect(tr('  Qu’allez-vous   sauver ? ')).toBe('  What will you save? ');
  });

  it('falls back to the French text when no English is known', () => {
    useCatalogForTests(ENTRIES);
    expect(tr('Une phrase sans traduction.')).toBe('Une phrase sans traduction.');
    expect(tr('Kestrel')).toBe('Kestrel');
  });

  it('fills templates and translates their holes', () => {
    useCatalogForTests(ENTRIES);
    expect(tr('Prochaine étape : le Dragon.')).toBe('Next: the Dragon.');
    expect(tr('Kestrel est K.O. !')).toBe('Kestrel is KO!');
    expect(tr('Borin est Brisé — tour passé.')).toBe('Borin is Staggered — turn skipped.');
    expect(tr('Du minerai volé. À Bois-Clair, la bourse du clan nous a tenus debout.')).toBe('Stolen ore. At Clearwood, the clan’s purse kept us standing.');
    expect(tr('Du minerai volé.')).toBe('Stolen ore.');
    expect(tr('Alaric devant Borin')).toBe('Borin faces Alaric');
  });

  it('rebuilds French lists, symbols, capitals and joined pieces', () => {
    useCatalogForTests(ENTRIES);
    expect(tr('Vous m’avez écouté : emporter les coffres, faire taire les témoins et couvrir la fuite.'))
      .toBe('You listened to me: carry off the coffers, silence the witnesses and cover the escape.');
    expect(tr('+10 Réputation')).toBe('+10 Reputation');
    expect(tr('Continuer ◆')).toBe('Continue ◆');
    expect(tr('FOUDRE CÉLESTE !')).toBe('CELESTIAL LIGHTNING!');
    expect(tr('Brûlure · Poison')).toBe('Burn · Poison');
    expect(tr('50 %')).toBe('50%');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('keeps the language choice outside the saves, on its own key', () => {
    expect(readLanguagePreference()).toBeNull();
    writeLanguagePreference('en');
    expect(localStorage.getItem(LANGUAGE_PREFERENCE_KEY)).toBe('{"language":"en"}');
    expect(readLanguagePreference()).toBe('en');
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, '{"language":"de"}');
    expect(readLanguagePreference()).toBeNull();
  });
});

describe('DOM translation (OD-2026-11-15-C)', () => {
  it('translates texts and readable attributes as they appear, and gives the French back', async () => {
    useCatalogForTests(ENTRIES);
    document.body.innerHTML = '<main><button aria-label="Continuer">Continuer</button><p class="dialogue__text-reveal">Bois-Clair</p></main>';
    const translator = new DomTranslator(document, tr);
    translator.start();
    const button = document.querySelector('button')!;
    expect(button.textContent).toBe('Continue');
    expect(button.getAttribute('aria-label')).toBe('Continue');
    expect(document.querySelector('p')!.textContent).toBe('Bois-Clair');
    const added = document.createElement('span');
    added.textContent = 'Bois-Clair';
    document.querySelector('main')!.append(added);
    await Promise.resolve();
    expect(added.textContent).toBe('Clearwood');
    added.firstChild!.textContent = 'Réputation';
    await Promise.resolve();
    expect(added.textContent).toBe('Reputation');
    translator.stop();
    expect(button.textContent).toBe('Continuer');
    expect(button.getAttribute('aria-label')).toBe('Continuer');
    expect(added.textContent).toBe('Réputation');
  });
});
