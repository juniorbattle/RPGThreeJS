// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { DomTranslator } from './domTranslator';
import { currentLanguage, joinList, tf, tr, trSegments, useCatalogForTests } from './i18n';
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

  it('covers the lines the judgement and the epilogues build from pieces', () => {
    useCatalogForTests({
      'Vos mérites, pour la montagne :': 'Your merits, for the mountain:',
      'les mineurs sauvés': 'the miners saved', 'le convoi rendu, sans un coffre ouvert': 'the convoy returned, without a coffer opened',
      'les témoins écoutés': 'the witnesses heard',
      'Quatre Sceaux': 'Four Seals', 'le Sceau du Lion, qu’Alaric nous a confié': 'the Seal of the Lion, which Alaric entrusted to us',
      'le Sceau de l’Ours, arraché à Borin': 'the Seal of the Bear, wrested from Borin',
      'Certaines bannières se tiennent à nos côtés : {0}.': 'Some banners stand at our side: {0}.',
      'celles {0}': 'those of {0}', 'du Lion': 'the Lion', 'de l’Ours': 'the Bear',
      'D’autres nous observent de loin : {0}.': 'Others watch us from afar: {0}.', 'du Corbeau': 'the Raven',
      'Alaric rend son verdict. Le Sceau est à vous.': 'Alaric gives his verdict. The Seal is yours.',
      'Les noms des morts sont lus. Personne ne les oublie.': 'The names of the dead are read. No one forgets them.',
    });
    expect(tr('Vos mérites, pour la montagne : les mineurs sauvés, le convoi rendu, sans un coffre ouvert et les témoins écoutés.'))
      .toBe('Your merits, for the mountain: the miners saved, the convoy returned, without a coffer opened and the witnesses heard.');
    expect(tr('Quatre Sceaux : le Sceau du Lion, qu’Alaric nous a confié ; le Sceau de l’Ours, arraché à Borin.'))
      .toBe('Four Seals: the Seal of the Lion, which Alaric entrusted to us; the Seal of the Bear, wrested from Borin.');
    expect(tr('Certaines bannières se tiennent à nos côtés : celles du Lion et de l’Ours. D’autres nous observent de loin : celles du Corbeau.'))
      .toBe('Some banners stand at our side: those of the Lion and the Bear. Others watch us from afar: those of the Raven.');
    expect(tr('Alaric rend son verdict. Le Sceau est à vous. Les noms des morts sont lus. Personne ne les oublie.'))
      .toBe('Alaric gives his verdict. The Seal is yours. The names of the dead are read. No one forgets them.');
  });

  it('translates a line cut in French as a whole, then cuts the English again', () => {
    const line = 'Notre clan a perdu ses terres. Nous sommes encore là. Mais rien ne se perd.';
    const cutInFrench = ['Notre clan a perdu ses terres. Nous sommes encore là.', 'Mais rien ne se perd.'];
    expect(trSegments(cutInFrench, (text) => [text])).toEqual(cutInFrench);
    useCatalogForTests({ [line]: 'Our clan lost its lands. We are still here. But nothing is lost.' });
    const paginate = (text: string) => text.split('. ').map((part, index, all) => (index < all.length - 1 ? part + '.' : part));
    expect(trSegments(cutInFrench, paginate)).toEqual(['Our clan lost its lands.', 'We are still here.', 'But nothing is lost.']);
    expect(trSegments(['Une phrase sans traduction.'], paginate)).toEqual(['Une phrase sans traduction.']);
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
