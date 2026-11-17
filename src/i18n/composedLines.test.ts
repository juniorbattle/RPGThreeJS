// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { describeSkillFactsAt } from '../game/skillFacts';
import { skills } from '../game/skills';
import { tr, useCatalogForTests } from './i18n';

/** Every English catalogue of the repository, as the game loads them in English (OD-2026-11-15-C). */
function wholeCatalog(): Record<string, string> {
  const dir = path.resolve(process.cwd(), 'src/i18n/en');
  const entries: Record<string, string> = {};
  for (const file of readdirSync(dir)) {
    if (file.endsWith('.json')) Object.assign(entries, JSON.parse(readFileSync(path.join(dir, file), 'utf8')));
  }
  return entries;
}

/** French words that must not survive in an English line (a name or a code never matches these). */
const FRENCH = /(^|[\s(«“'’,;:·—])(le|la|les|des|du|de|un|une|et|est|vous|nous|pour|avec|dans|sur|pas|qui|que|au|aux|à|soi|alliés?|ennemis?|cible|zone|cases?|tours?|dégâts|portée|puissance|soin|frappe|sur|par|ses|son|sa|leurs?|touchés?|compris|autour|libre|ligne|cône|arrivée|lanceur|critique|précision|Brûlure|Ralenti|Affaibli|Entravé|Aveuglement|Malédiction|Régénération|Provocation|Mutisme|Barrière|Brisé)(?=[\s,.;:!?»”)·—]|$)/;

afterEach(() => useCatalogForTests(null));

describe('lines the game composes from pieces, in English (OD-2026-11-15-C)', () => {
  it('translates the facts line of every skill, at every level, for both sides', () => {
    useCatalogForTests(wholeCatalog());
    const offenders: string[] = [];
    for (const def of skills) for (const level of [0, 1, 2]) for (const team of ['player', 'foe'] as const) {
      const french = describeSkillFactsAt(def, level, team);
      const english = tr(french);
      if (FRENCH.test(english)) offenders.push(`${def.id} L${level} ${team}\n  FR ${french}\n  EN ${english}`);
    }
    expect(offenders.slice(0, 12).join('\n')).toBe('');
  });

  it('reads a status clause, a zone and a damage line the way the guide writes them', () => {
    useCatalogForTests(wholeCatalog());
    expect(tr('Brûlure 2 tours (perd 6 % de ses PV max + 8 par tour) : la cible'))
      .toBe('Burn 2 turns (loses 6% of max HP + 8 each turn): the target');
    expect(tr('Zone de 9 cases autour de la cible, alliés compris')).toBe('Area of 9 tiles around the target, allies included');
    expect(tr('Dégâts physiques, puissance 8, ignore 30 % de la défense, critique 15 %'))
      .toBe('Physical damage, power 8, ignores 30% of defence, crit 15%');
    expect(tr('Ennemi à 1-2 (ou case libre : déplacement seul)')).toBe('Enemy at range 1-2 (or free tile: move only)');
  });

  it('speaks a map marker and an epilogue banner list in English, as the whole chronicle plays them', () => {
    useCatalogForTests(wholeCatalog());
    expect(tr('Refuge du Lion, Jalon principal, Refuge, Étape de l’histoire, Fait, services réutilisables, voyage rapide possible'))
      .toBe('Lion Refuge, Main milestone, Refuge, Story step, Done, reusable services, fast travel available');
    expect(tr('Chemin des réserves, Étape structurante, Rencontre, Étape de l’histoire, Fermé, vers II · Bois-Clair'))
      .toBe('Path of the Reserves, Key step, Encounter, Story step, Closed, toward II · Clearwood');
    expect(tr('Déploiement — choisissez une unité puis une case disponible')).toBe('Deployment — choose a unit, then an available tile');
    const banners = tr('celles du Lion, de l’Ours, du Corbeau, du Dragon, du Loup, du Scorpion et du Phénix');
    expect(banners).toBe('those of the Lion, the Bear, the Raven, the Dragon, the Wolf, the Scorpion and the Phoenix');
  });

  it('reads a lead and its list, and a marker whose texts hold commas, as the other chronicles play them', () => {
    useCatalogForTests(wholeCatalog());
    const started = Date.now();
    expect(tr('Mes comptes gardent aussi le prix exigé pour votre aide et la souillure effacée avant qu’on puisse l’étudier.'))
      .toBe('My accounts also record the price demanded for your help and the taint erased before anyone could study it.');
    expect(tr('Mes comptes gardent aussi le droit de lire le codex avant le Grand Inquisiteur, exigé à l’audience, les sceaux du Phénix brisés sans leur rite et la page souillée brûlée avant qu’on puisse l’étudier.'))
      .toMatch(/^My accounts also record .+, .+ and .+.$/);
    expect(tr('Bêtes sous l’emprise des Ombres, Point secondaire, Élite, Au choix, une seule branche, À faire, prochaine étape, défi : Victoire en 8 manches, prime 2 gemmes rouges'))
      .toBe('Beasts in the Shadows’ Grip, Side point, Elite, Your choice, one branch only, To do, next step, challenge: Victory in 8 rounds, bounty 2 red gems');
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it('reads the map tooltip, a place, its kind, its state and its description laid end to end', () => {
    useCatalogForTests(wholeCatalog());
    for (const french of [
      'Camp du Lion · Jalon principal · À faire La compagnie se rassemble avant de demander le premier Sceau.',
      'Réserve forestière · Point secondaire · Fermé Réserves facultatives · Récompenses utilisables immédiatement, une seule ouverture.',
      'Piste des bêtes · Étape structurante · À faire Des créatures affamées rôdent sur la première piste.',
    ]) expect(FRENCH.test(tr(french)), tr(french)).toBe(false);
  });
});
