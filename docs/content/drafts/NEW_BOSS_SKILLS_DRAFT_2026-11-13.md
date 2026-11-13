# Nouvelles compétences de boss : brouillon (C3 et C4)

Statut : **VALIDÉ** le 2026-11-13 et **en jeu** (OD-2026-11-13-F, C3 et C4) : voir « Validations de l'opérateur » en fin de document et le rapport `docs/reports/bilan-combat-2026-11-13.md`. Run `claude-bilan-combat-20261113T1644Z`.

Déjà fait dans ce lot, sans attendre :
- **C1** : le Gardien de flamme a Gel, le Champion du Phénix a Transpercement, et un test exige l'attaque lourde chez les 32 boss et élites ;
- **C2** : le Fidèle égaré a Apocalypse ;
- **C5** : les trois armes sont renommées.

## 1. Ce que tu as demandé

- **C3.** Kaelen, le Grand Inquisiteur et l'Entité de la brèche frappent sur leur stat faible à l'attaque lourde. Ils reçoivent une attaque lourde magique, créée maintenant. Le Brasier du Démon est revu dans le même mouvement.
- **C4.** Maelor reçoit une compétence à lui, pour ne plus être le double du Prophète des Ombres.
- **Règles.** Chaque compétence nouvelle a son effet propre (OD-2026-11-01-A). Les 15 boss gardent des couples attaque lourde + ultime tous différents (B1, audit final du 2026-11-11). Chaque ultime frappe sur la stat forte de son boss (B4, même audit).
- **Ta remarque du lancement.** Les compétences nouvelles sont proportionnées à leur rang : ici, des attaques lourdes, donc en dessous des ultimes.

## 2. Les 15 couples aujourd'hui

Une attaque lourde coûte 4 PA et un ultime 5 PA. FOR et MAG sont les statistiques du boss avant l'échelle de son plateau.

| # | Boss | Partie | FOR / MAG | Attaque lourde | Ultime | Écart |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Général Serpent | Lion | 30 / 8 | Onde de Choc (phys.) | Rafale Mortelle (phys.) | |
| 2 | Champion du Lion | Lion | 28 / 6 | Onde de Choc | Exécution (phys.) | |
| 3 | Chef des mineurs du Corbeau | Ours | 27 / 4 | Onde de Choc | Frappe Sismique (phys.) | |
| 4 | Maître Espion du Corbeau | Ours | 24 / 10 | Transpercement (phys.) | Exécution | |
| 5 | Ancien Ours Borin | Ours | 29 / 4 | Onde de Choc | Frappe du Titan (phys.) | |
| 6 | Chef du Clan du Loup | Dragon | 28 / 4 | Transpercement | Frappe Sismique | |
| 7 | Chaman des Ombres | Dragon | 8 / 28 | Gel (mag.) | Apocalypse (mag.) | |
| 8 | **Ancien Dragon Kaelen** | Dragon | 22 / **26** | Onde de Choc | Brasier Infernal (mag.) | **lourde sur FOR, sa stat faible** |
| 9 | Chef des gardiens du Phénix | Scorpion | 27 / 10 | Transpercement | Frappe du Titan | |
| 10 | Prophète des Ombres | Scorpion | 6 / 28 | Gel | Brasier Infernal | **même couple que Maelor** |
| 11 | **Grand Inquisiteur** | Scorpion | 16 / **28** | Transpercement | Apocalypse | **lourde sur FOR** |
| 12 | Champion du Serpent | Acte final | 29 / 8 | Transpercement | Rafale Mortelle | |
| 13 | **Champion changé en démon** | Acte final | **30** / 26 | Transpercement | Brasier Infernal | **ultime sur MAG, sa stat faible (B4)** |
| 14 | **Maelor** | Acte final | 10 / 28 | Gel | Brasier Infernal | **même couple que le Prophète** |
| 15 | **Entité de la brèche** | Acte final | 20 / **30** | Onde de Choc | Apocalypse | **lourde sur FOR** |

## 3. Pourquoi il faut des compétences nouvelles

Le catalogue n'a que trois attaques lourdes : Onde de Choc et Transpercement, physiques, et Gel, la seule magique. Il a deux ultimes magiques, Brasier et Apocalypse. Avec le Gel seul, on ne peut former que deux couples magiques : Gel + Apocalypse, qui est déjà au Chaman, et Gel + Brasier, qui est déjà au Prophète. Kaelen, l'Inquisiteur, l'Entité et Maelor ne peuvent donc pas tous recevoir une attaque lourde magique sans répéter un couple.

Le Démon a le même problème de l'autre côté. Pour lui donner un ultime physique, il faudrait le combiner à Transpercement ou à Onde de Choc. Or les huit couples ainsi possibles sont tous pris. Il doit donc changer d'attaque lourde.

## 4. Ma recommandation : quatre attaques lourdes magiques, une par boss

Les quatre se règlent comme le Gel, l'attaque lourde magique qui existe déjà. Les chiffres ne bougent pas : rien n'est rééquilibré.

| | Valeur |
| --- | --- |
| PA | 4 |
| Portée | 0 à 7 cases |
| Cible | une seule, rayon 0 |
| Type | magique |
| Puissance | 16, multiplicateur ×1,2 |
| Précision | 0,85 |
| Statut | 2 tours |

Seuls le statut et l'effet changent d'une compétence à l'autre.

**Grandeur et impact.** Ce sont des attaques lourdes, réglées comme Gel et Transpercement :
- impact vers 0,4 seconde, durée d'environ 1,2 seconde ;
- un tremblement d'écran court ;
- ni ralenti, ni caméra d'ultime, ni charge.

Elles restent visiblement en dessous de l'ultime du même boss, mais au-dessus de son action légère.

### A. Kaelen : « Foudre Céleste »

- **Description en jeu** : « Frappe magique monocible à longue portée : la foudre tombe du ciel et aveugle la cible. »
- **Statut** : Aveuglement (précision −40 %), 2 tours.
- **Effet** :
  1. la tête de son bâton s'allume d'un bleu glacé, la couleur de ses poses ;
  2. un petit anneau de nuées se forme au-dessus de la cible ;
  3. un éclair blanc et bleu tombe d'un trait sur elle ;
  4. un éclat blanc, une gerbe d'étincelles bleu ciel, un court tremblement.
  - Couleurs : les palettes de la foudre et du ciel.
  - Aucun cristal : le Cristal d'Écho n'est pas à lui.
- **Pourquoi** : les Pics Célestes, l'orage des sommets. Rien d'autre dans le jeu ne fait tomber la foudre.
- **Son** : la composition « incantation, arcane, lourde » (`fx.cast.arcane.h`), qui existe déjà dans la table.

### B. Grand Inquisiteur : « Sentence »

- **Description en jeu** : « Frappe magique monocible à longue portée : l'Inquisiteur prononce sa sentence et réduit la cible au silence. »
- **Statut** : Mutisme (aucune compétence), 2 tours.
- **Effet** :
  1. un cercle de fines lignes de cuivre se trace au sol sous la cible ;
  2. le sable tourbillonne ;
  3. un dard de lumière ambrée, en forme de queue de scorpion comme la tête de son bâton, s'abat d'en haut ;
  4. la cible reste un instant cernée d'une poussière ambrée qui retombe.
  - Couleurs : ambre, cuivre et sable, celles de ses poses.
  - Aucune forme de sceau, pour ne pas évoquer les quatre Sceaux.
- **Pourquoi** : l'inquisiteur juge et fait taire.
- **Son** : `fx.cast.fire.h`, qui existe déjà.
- **Variante** : Affaibli au lieu du Mutisme, si deux tours sans compétences te paraissent trop durs pour une attaque qui revient tous les quatre tours.

### C. Maelor : « Serment rompu » (C4)

- **Description en jeu** : « Frappe magique monocible à longue portée qui dissipe les protections de la cible. »
- **Statut** : aucun. La compétence retire les effets positifs de la cible : Barrière, Force, Régénération. C'est la dissipation qui existe déjà sur Casse-Faille ; ce n'est pas une règle nouvelle.
- **Effet** :
  1. une encre noire et froide jaillit de sa main ouverte et file jusqu'à la cible ;
  2. autour de la cible, des liens de lumière, ses protections, se brisent en éclats blancs ;
  3. l'encre se referme sur elle puis se dissipe.
  - Couleurs : noir d'encre et blanc froid, jamais de violet, comme les Ombres de ses poses.
- **Pourquoi** : l'intendant connaît les défenses de la compagnie, et c'est lui qui a rompu son serment. Le Prophète, lui, garde le Gel.
- **Son** : `fx.cast.blood.h`, qui existe déjà. Le brouillon proposait d'abord `fx.cast.shadow.m`, mais cette composition n'existe pas en poids lourd.

### D. Entité de la brèche : « Étreinte de la brèche »

- **Description en jeu** : « Frappe magique monocible à longue portée : des rubans d'encre sortent du sol et entravent la cible. »
- **Statut** : Entravé, 2 tours.
- **Effet** :
  1. des rubans d'encre noire sortent du sol sous la cible ;
  2. ils s'enroulent autour d'elle, liserés de blanc froid comme le bord de la brèche ;
  3. ils se resserrent puis se dissolvent en gouttes.
  - Couleurs : noir d'encre et blanc froid, jamais de violet.
- **Pourquoi** : l'Entité sort de la brèche et y retient ce qu'elle touche. Maelor brise les défenses, puis l'Entité retient : les deux phases du combat ne se ressemblent pas.
- **Son** : `fx.cast.ice.h`, le froid de la brèche, qui existe déjà.

## 5. Le Démon (« Champion changé en démon »)

**Recommandé : Gel + Frappe du Titan.**
- L'ultime devient physique et frappe sur sa FOR 30 (B4).
- Il garde une grande zone, comme le Brasier qu'il remplace : rayon 2,5, avec Ralenti.
- L'attaque lourde devient le Gel, sur sa MAG 26. Le Gel est le froid des Ombres qui l'ont corrompu.
- Aucune compétence nouvelle.

**Variantes** :
- **Gel + Exécution** : une seule grande entaille, qui ressemble à ses griffes, mais sur une seule cible.
- **Étreinte de la brèche + Frappe du Titan** : l'encre de la brèche ; il partagerait alors la compétence de l'Entité.
- **Garder tel quel** : l'ultime reste sur MAG 26, contre B4.

## 6. Les 15 couples après (recommandation)

| # | Boss | Attaque lourde | Ultime |
| --- | --- | --- | --- |
| 1 | Général Serpent | Onde de Choc | Rafale Mortelle |
| 2 | Champion du Lion | Onde de Choc | Exécution |
| 3 | Chef des mineurs du Corbeau | Onde de Choc | Frappe Sismique |
| 4 | Maître Espion du Corbeau | Transpercement | Exécution |
| 5 | Ancien Ours Borin | Onde de Choc | Frappe du Titan |
| 6 | Chef du Clan du Loup | Transpercement | Frappe Sismique |
| 7 | Chaman des Ombres | Gel | Apocalypse |
| 8 | Ancien Dragon Kaelen | **Foudre Céleste** (MAG) | Brasier Infernal |
| 9 | Chef des gardiens du Phénix | Transpercement | Frappe du Titan |
| 10 | Prophète des Ombres | Gel | Brasier Infernal |
| 11 | Grand Inquisiteur | **Sentence** (MAG) | Apocalypse |
| 12 | Champion du Serpent | Transpercement | Rafale Mortelle |
| 13 | Champion changé en démon | **Gel** (MAG 26) | **Frappe du Titan** (FOR 30) |
| 14 | Maelor | **Serment rompu** (MAG) | Brasier Infernal |
| 15 | Entité de la brèche | **Étreinte de la brèche** (MAG) | Apocalypse |

Résultat :
- les 15 couples sont tous différents, alors qu'aujourd'hui le Prophète et Maelor en partagent un ;
- chaque attaque lourde et chaque ultime frappe sur la stat forte de son boss, sauf l'attaque lourde du Démon, sur sa MAG 26 ;
- un test verrouillera ces couples.

## 7. Option plus légère : deux compétences au lieu de quatre

- **Kaelen et l'Inquisiteur** partagent une même attaque lourde magique, par exemple « Verdict » : les deux chefs qui jugent la compagnie.
- **Maelor et l'Entité** partagent « Serment rompu ». Les deux phases de la brèche ont alors la même attaque lourde.
- **B1 reste tenu** : Verdict + Brasier, Verdict + Apocalypse, Serment + Brasier, Serment + Apocalypse.
- **Le prix** : moins d'identité propre par boss. Je recommande les quatre.

## 8. Sons, effets et contrats

- **Table des sons fermée** : 158 identités sur 160 aujourd'hui (`src/audio/cueTable.ts`). Les quatre compétences prennent des compositions qui existent déjà : incantation × arcane, feu, sang, glace. **Aucune identité nouvelle**, donc la table reste à 158.
- **Pas de signature** : ce ne sont pas des signatures de boss. Le contrat en fixe huit (`COMBAT_AND_VFX.md`, « Signature cues ») ; en ajouter une demanderait un amendement. Elles ne sont pas des ultimes non plus. Elles se composent comme le Gel et le Transpercement.
- **Son au lancement** : la famille « incantation », celle de tout sort ennemi.
- **Effets** : chaque compétence a sa recette propre dans `src/combat/fx/fxSkills.ts`, comme le veut OD-2026-11-01-A, et le jeu 1.20.0 pour les compétences ennemies nouvelles (« New enemy skills get procedural FX recipes and signatures under the existing rules »).
- **Règles de combat** : rien de nouveau. Les statuts (Aveuglement, Mutisme, Entravé) et la dissipation existent déjà.
- **Conclusion** : **aucun changement de contrat**. La garde des contrats reste vide.
- **Ce que l'implémentation touchera** :
  - le catalogue (`src/game/skills.ts`) et les recettes (`fxSkills.ts`) ;
  - le geste sonore (`fxSounds.ts`) et la présentation (`skillPresentation.ts`) ;
  - les kits des cinq boss (`legacyCombatRuntime.js`) et leur miroir (`DemoVfxActionScope.ts`) ;
  - les tests qui comptent les compétences et les recettes.

## 9. Un écart trouvé en chemin (C5)

En étendant le test arme/image à toutes les unités qui combattent, j'ai trouvé un seul écart : **la Bête corrompue** (Ours) combat avec « Griffes », et son attaque de base joue l'effet des griffes. Or son image montre un bélier des montagnes, avec des cornes et des sabots, sans griffes.

Je n'ai rien changé : un nom d'arme est à toi. Le test le note comme exception en attente de ta décision.

**Proposition** : « Charge », un nom d'arme qui existe déjà, avec son effet de coup de bélier (celui du sanglier). Statistiques et son inchangés.

## 10. Tes réponses

1. **Les quatre compétences**, avec leurs noms et leurs effets (§4) ?
   - Les quatre (recommandé) ;
   - l'option légère à deux (§7) ;
   - tes noms à toi.
2. **Le Démon** (§5) ?
   - Gel + Frappe du Titan (recommandé) ;
   - une variante ;
   - garder.
3. **La Bête corrompue** (§9) ?
   - « Charge » ;
   - garder « Griffes ».

## Validations de l'opérateur

À « Valides-tu les quatre nouvelles attaques lourdes et le Démon, comme dans le brouillon ? », l'opérateur a répondu le 2026-11-13 : « Yes, all four ».

**Retenu, et mis en jeu tel quel :**
- les quatre attaques lourdes magiques, avec leurs noms, descriptions, chiffres, statuts et effets (§4) ;
- pour la Sentence, le Mutisme, et non la variante ;
- le Démon avec Gel + Frappe du Titan (§5).

Le tableau du §6 est verrouillé par un test (`combatBossTempo.test.ts`).

**Deux précisions faites en implémentant :**
- **Son de « Serment rompu ».** Il prend `fx.cast.blood.h` et non `fx.cast.shadow.m` : la composition ombre n'existe pas en poids lourd, et une attaque lourde doit sonner lourd. La table reste à 158 identités.
- **Trois effets renforcés.** À l'écran, la Sentence, Serment rompu et l'Étreinte se lisaient sous le Gel. Je les ai renforcés sans changer leur dessin : un pilier de lumière ambrée pour le dard de la Sentence, une encre plus visible pour les deux autres.

**La Bête corrompue (§9).** À « Renommer l'arme de la Bête corrompue en « Charge » ? », l'opérateur a répondu le 2026-11-13 : « Yes, « Charge » ».
- La bête combat avec « Charge » ◆ au lieu de « Griffes ».
- Les statistiques et la portée (1 à 2) ne changent pas.
- L'attaque de base prend l'effet de coup de bélier du sanglier.
- Le son au lancement ne change pas.
- La marque sonore à l'impact suit l'effet : coup lourd, terre, au lieu de la morsure des griffes. Le §9 disait « son inchangé » : ce n'est vrai que du son au lancement.
- Le test arme/image n'a plus d'exception.
