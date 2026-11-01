# Direction audio, lots 2 à 6 — livraison technique

| Champ | Valeur |
| --- | --- |
| `TASK` | `PRODUCTION-CONTRACTS-AUDIO-DIRECTION-1`, lots 2 à 6 de [OD-2026-11-01-B](../autonomy/AUDIO_DIRECTION_OPERATOR_DECISION_2026-11-01.md) |
| `DOMAIN` | Média, audio, combat, outils QA |
| `BASELINE` | `dev @ 50394ed4`, set 1.12.0, baseline immuable `29aa94862f9cd5f2c73ba9569660ed26c41ceaf8` |
| `BRANCH` | `dev` |
| `HEAD` | Commit de ce rapport |
| `STATUS` | Review : livraison technique. L'acceptation à l'oreille reste à l'opérateur |
| `MERGED_IN` | `NONE` (`dev` seulement) |
| `SUPERSEDES` | `NONE` |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | Présentation seulement : musique, ambiances, sons, réglage des effets. Vérité du jeu, sauvegardes, récompenses et canon inchangés |
| `CANONICAL_DOCS_UPDATED` | `docs/combat/COMBAT_HD2D.md`, `AGENTS.md`, `docs/project/CURRENT_STATUS.md`, décision OD-2026-11-01-B, état autonome |
| `EVIDENCE` | Outils `tools/audio/` ; rendus WAV et résultats dans `tmp/audio-direction/` (ignoré). Limites en section 5 |

## 1. Verdict

CURRENT FACT. Le moteur et les pistes sont livrés et mesurés. Rien de ce rapport ne dit que c'est beau : je n'entends rien. Seule l'écoute de l'opérateur, dans le laboratoire, tranche.

## 2. Ce qui est livré

| Lot | Contenu | Commit |
| --- | --- | --- |
| 1 | Amendement 1.12.0 appliqué, baseline fixée | `29aa9486`, `50394ed4` |
| 2 | Bus commun et limiteur final, atténuation, effets actifs mais armés, nouvelle préférence, messages de niveau et d'issue, fanfare qui survit à la fermeture du combat | `1df283fe` |
| 3 | Pistes en sections avec tempo, tonalité et mesure propres, un pont écrit et un retour préparé par boucle, motif des Sceaux, couleurs de camp, deux niveaux, fanfares, entrée de boss, moins de grave | `9a4e1895` |
| 5 | Table des 75 scènes vers trois humeurs, ambiances de carte et de refuge | `a1bc2071` |
| 4, 6 | Table fermée de 158 sons, grammaire à trois couches, repères sur les 63 recettes et les 14 attaques, charge, coup et vague des 20, laboratoire d'écoute, retrait de la comparaison | `41cb32fa` |
| Réglages | Clé des repères par recette, poids sans le surcoût du tour, deux niveaux du boss, ambiance du refuge, outils de preuve | `cfda1962` |

Les ponts, écrits note à note :

| Piste | Boucle | Pont | Retour |
| --- | --- | --- | --- |
| Titre | ré dorien, 4 temps, 68 | si bémol, 3 temps, 90, flûte | ralenti sur la dominante, cor |
| Carte | sol mixolydien, 96, luth | si bémol, swing à 72, hautbois | accélère sur ré 7 |
| Refuge | fa, 3 temps, 60, harpe | ré bémol, 4 temps, 54, flûte | revient à 3 temps, attend sur do 7 |
| Tension | mi phrygien, 84 | fa phrygien, 5 temps, 92 | redescend d'un demi-ton |
| Drame | do mineur, 54, chœur | la bémol, 3 temps, 66, cordes | s'éteint sur sol 7 |
| Combat | la mineur, 126 | do mineur, 96, cuivres en quintes | accélère sur mi 7 |
| Boss | ré phrygien, 138 | fa mineur à 6 temps, chœur | demi-ton, puis la 7 |

## 3. Preuves exigées par `AUTHORING_AND_QA`

| Exigence | État | Preuve |
| --- | --- | --- |
| Sons déterministes, dans leurs limites et la table | Tenu | `measure-cues.mjs` : 158 sons, 20,5 Mo sur 32, crête 0,2, plus long 1,4 s, deux rendus identiques à -140 dBFS près |
| Tout repère vise un son connu, sans dépendre d'un résultat | Tenu | `src/audio/cues.test.ts` |
| Humeur de chaque scène | Tenu | `src/audio/moods.test.ts` : les 75 scènes sont placées, aucune en trop |
| Pas d'audio avant un vrai geste, préférence restaurée comprise | Tenu | Tests du lecteur ; `journey-check.mjs` : 0 contexte avant le geste et après un événement synthétique, 1 après |
| Choix de couper honoré, le volume seul ne coupe jamais | Tenu | Tests du lecteur |
| Rejet des messages de niveau et d'issue | Tenu | Session et origine étrangères, champs en trop, issue répétée : tests du pont et du lecteur |
| Fanfare, entrée de boss, atténuation, crête | Tenu | `director-check.mjs` : fanfares passées à 7,74 s et 8,04 s, boss à 5,86 s, -5 dB rendue en 0,90 s, crête -1,17 dBFS à volume maximal et -3,97 dBFS aux volumes d'usine, sous le seuil du limiteur |
| Fanfare non coupée par la surface suivante | Tenu | `director-check.mjs` et parcours réel : la piste demandée n'entre qu'à la fin |
| Deux voix de signature au plus, résultat jamais évincé | Tenu | Tests du lecteur |
| Regroupement à 500 ms, retour à 15 s | Tenu | Tests du lecteur |
| Issue et suite aléatoire identiques, audio actif ou coupé | Tenu | `truth-check.mjs` : 8 actions sur le vrai `CombatBridge`, mêmes 20 valeurs affichées, même journal |
| Aucune frame principale de plus de 50 ms due aux sons | Tenu sur cette machine | Aucune tâche longue à l'observateur du navigateur ; rendu de toute la table 1,25 s ; plan de section le plus lent 5,1 ms |
| Parcours réel titre, carte, refuge, tension, drame, combat, ultime, boss, victoire, défaite, ambiances de carte et de refuge | Tenu | `journey-check.mjs`, voir ci-dessous |

Le parcours a deux parties, en vrais clics, avec un seul `AudioContext`, crête en direct de 0,38 et aucune erreur de page. La campagne va du titre à l'écran du refuge : titre, drame, refuge, carte avec son ambiance, tension, combat, fanfare, écran du refuge avec son ambiance. Ses deux combats n'y sont pas joués : le pilote répond par le message de résultat du combat, sur le même chemin qu'une victoire. Le mode QA, sur le vrai `CombatBridge`, joue un vrai ultime avec charge, coup et vague, le niveau Action, la victoire, l'entrée de boss et la défaite.

## 4. Mesures

Sortie réelle du moteur, volume d'usine, avant limiteur. Sonie BS.1770, énergie sous 250 Hz.

| Piste | LUFS | Sous 250 Hz | Audit |
| --- | --- | --- | --- |
| Combat, Action | -22,4 | 21 % | -16,6 LUFS, 80 % |
| Combat, Réflexion | -26,7 | 36 % | n'existait pas |
| Boss, Action | -22,1 | 47 % | -16,2 LUFS, 80 % |
| Boss, Réflexion | -26,4 | 62 % | n'existait pas |
| Titre | -22,1 | 41 % | -15,3 LUFS |
| Carte | -22,9 | 20 % | -16,7 LUFS |
| Refuge | -26,7 | 9 % | -20,7 LUFS (dialogue) |
| Tension | -25,5 | 62 % | n'existait pas |
| Drame | -26,2 | 8 % | n'existait pas |
| Fanfare de victoire | -20,1 | 25 % | n'existait pas |
| Fanfare de défaite | -24,8 | 9 % | n'existait pas |

Ambiances : route forestière -28,8, Bois-Clair -29,8, sanctuaire -31,4, carte -30,1, refuge -31,1 LUFS.

Forme : boucle de combat 89,5 s, carte 92,1 s, boss 81,6 s, contre 14,5, 20 et 17,1 s à l'audit.

Masquage, indicateur par bande contre la musique de combat niveau Action : les 16 familles passent d'une médiane de -9,2 dB à +8,0 dB, et de 14 familles sous la musique à aucune. Sons composés : médiane +10,0 dB, 4 sur 82 sous la musique. Signatures : +11,6 dB, 4 sur 60, avant l'atténuation de 5 dB qui les accompagne. Au niveau Réflexion, les médianes montent à +13 à +16 dB.

## 5. Limites

- **Je n'entends rien.** Le motif, les ponts, les retours, les timbres et les 60 sons sur mesure sont écrits et mesurés, jamais écoutés. Un accord peut sonner faux sans qu'aucun test ne le voie.
- **Couleur Breath of Fire 3.** Accords enrichis et swing dans la carte et le refuge restent une hypothèse de travail, non confirmée.
- **Références.** Procédés seulement. Aucune source publique ne détaille les modulations de ces jeux : aucun pont n'imite une piste nommée.
- **Mesures.** Machine de développement, Chromium sans écran, deux passages de 40 s environ par piste. Le masquage reste un indicateur sur la moyenne de la musique, pas un modèle psychoacoustique.
- **Combat QA.** Le rendu logiciel fait tourner le temps des effets très lentement : le parcours prouve le câblage, pas le calage du son sur l'image à 60 images par seconde. Ce calage reste à juger en jeu.
- **`tools/demo-continuous-production-qa.mjs`.** Adapté aux effets actifs par défaut, non relancé en entier.
- **Attaques de base des héros.** Elles passent par les recettes partagées et leurs étapes `sfx`, sans son sur mesure.
- **Relecture.** La relecture indépendante de conformité a trouvé deux écarts, corrigés dans `cfda1962` : les repères de plusieurs recettes d'une même action se masquaient, et le poids suivait le surcoût du tour. Les chiffres de masquage de la section 4 datent d'avant ces réglages, qui ne changent ni la musique de combat ni les sons.
