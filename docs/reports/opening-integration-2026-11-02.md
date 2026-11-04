# Intégration de l'ouverture

| Champ | Valeur |
| --- | --- |
| `TASK` | `OPENING-INTEGRATION-2026-11-02` |
| `DOMAIN` | Présentation, récit, média |
| `BASELINE` | `dev @ 93262c21` |
| `BRANCH` | `dev` |
| `HEAD` | Commit de ce rapport |
| `STATUS` | Livré sur `dev`, à juger par l'opérateur en jeu |
| `MERGED_IN` | `NONE` (`dev` seulement) |
| `SUPERSEDES` | `docs/reports/opening-mockup-2026-11-02.md` pour l'état du code |
| `SUPERSEDED_BY` | `NONE` |
| `PRODUCTION_IMPACT` | Une partie neuve ouvre sur la séquence de 55 secondes au lieu des cinq panneaux |
| `CANONICAL_DOCS_UPDATED` | `docs/autonomy/OPENING_SEQUENCE_OPERATOR_DECISION_2026-11-02.md`, `docs/autonomy/OPERATOR_DECISIONS.md`, `AGENTS.md` |
| `EVIDENCE` | `src/ui/opening/OpeningSequence.test.ts`, suite complète, build, parties jouées avec Playwright en développement et sur le build de production, dans `tmp/opening-audit/play` (ignoré) |

Verdict de l'opérateur : « Tableau vivant ».

## Ce qui a changé

`CURRENT FACT`

- `OpeningSequence` (`src/ui/opening/`) remplace `PrologueView`. Il garde le champ `prologue` de `GameApp` et son `open()`.
- `prologue.ts` garde les cinq identifiants et ne porte plus que les phrases affichées. Les anciennes phrases des panneaux sont retirées de l'affichage et restent dans Git.
- `assets.prologueScenes` pointe sur les quatre tableaux. Le premier plan n'a pas d'image : sa bannière est dessinée par code. Les images peintes restent sur le disque et servent toujours de replis aux dialogues.
- Le code de la maquette, le plan d'arène et le bouton du laboratoire QA sont retirés. Ils restent dans `93262c21`.
- Les sprites des Serpents arrivent dans un fichier séparé, chargé au lancement de la séquence. Le fichier principal ne grossit donc pas de leur catalogue.

## Écarts avec la maquette et la fiche

- **Son.** Plus d'ambiance de feu à Bois-Clair ni d'ambiance de refuge au camp : `PRESENTATION_AND_MEDIA.md:93` réserve l'ambiance du refuge à son écran, et `COMBAT_AND_VFX.md:29` lie celle de Bois-Clair à son biome de combat. Seule la musique `drama` joue. Une ambiance dans la séquence demanderait un amendement.
- **C2.** Aucune réplique coupée, voir OD-2026-11-02-A. Une phrase reste dite deux fois mot pour mot à moins d'une minute d'écart : celle du Tournoi des Grands.

## Vérifications

`CURRENT FACT` Mêmes résultats en développement et sur le build de production :

| Scénario | Résultat |
| --- | --- |
| Partie neuve, sans aucun clic | Cinq plans dans l'ordre en 54,9 s, puis `acte_ouverture` sur le même camp, sans noir entre les deux |
| Passer au dernier plan | Héros retirés avant le dialogue, séquence disparue |
| Rechargement dans la séquence, puis dans le dialogue | Reprise au premier plan, carte atteinte ensuite |
| Rechargement depuis la carte | Retour à la carte, rien n'est rejoué |
| Mouvement réduit du système, tableau bloqué | Tout le texte du plan, Passer disponible, dialogue atteint |

Validateurs verts : suite complète (169 fichiers vitest et 26 tests `node:test`), `tsc`, build, `contracts:validate`, `cinematics:validate-narrative-staging`, gate LOCKED vide. Relecture indépendante des contrats avant l'intégration : pas d'amendement, sous les conditions reprises dans OD-2026-11-02-A.

## Mouvement réduit

`CURRENT FACT` Retour de l'opérateur le même jour : « je vois uniquement du texte avec une image de fond ». Cause mesurée : les effets d'animation de Windows sont désactivés sur son poste (`SPI_GETCLIENTAREAANIMATION` à faux), le navigateur annonce `prefers-reduced-motion: reduce`, et la première version de la variante réduite retirait tout le dessin : bannière, Serpents, silhouettes, marques. Les passes Playwright ne le montraient pas, car ce navigateur n'hérite pas de ce réglage sans émulation.

`CURRENT FACT` Corrigé : chaque plan se fige sur une image complète, garde ses fondus et n'a aucun mouvement. Vérifié plan par plan en émulant la préférence.

`CURRENT FACT` Le même réglage met le combat en graphismes réduits (`legacyCombatRuntime.js:106`, `:2378`) : pas de bloom ni de bascule de netteté, particules réduites à 45 %, intensité des flashs d'effet à 60 %, pas de ralenti ni de projecteur, arène allégée, ombres des sprites retirées. Le contrat interdit au jeu de passer outre (`UI_AND_ACCESSIBILITY.md:25`).

## Conseillers absents et premier plan

`CURRENT FACT` Retour de l'opérateur le même jour : Séraphine et Maelor absents du premier dialogue, avec de fines lignes verticales. Cause reproduite à l'identique : leurs deux images n'arrivaient pas, et Chrome dessinait le contour d'une image cassée. Le jeu avait perdu son serveur en cours de partie : le serveur de vérification venait d'être arrêté et le port 5173 sert RPGCards, qui répond par une page HTML à toute adresse. Alistair et Marian restaient visibles parce que la séquence les avait déjà chargés. Aucun fichier ne manque.

`CURRENT FACT` Le jeu est renforcé : la séquence charge aussi Séraphine et Maelor, et une image d'acteur manquante laisse sa place vide au lieu du contour cassé.

`CURRENT FACT` Le premier plan, une bannière sur fond noir, n'était pas compréhensible. Il devient une scène sur `dragon-roost-area`, fond sans signe de faction : une bannière sans emblème plantée parmi des lances et des feux, secouée par le vent, dont la hampe casse sur « la défaite » avant qu'elle ne s'abatte. Le tissu est simulé, puis posé à plat une fois au sol. Les silhouettes de l'aqueduc sont redessinées pour se lire comme des personnes.

## Éléments intégrés et mouvement réduit vivant

`CURRENT FACT` Retour de l'opérateur le 2026-11-03, captures à l'appui : « rien ne bouge », des « bugs sur les images », des éléments « mal intégrés ». Trois causes établies :

- Les effets d'animation de Windows sont toujours désactivés (`SPI_GETCLIENTAREAANIMATION` à faux, relu le 2026-11-03). Le jeu passait en mouvement réduit, et cette variante figeait chaque plan sur une image.
- Les lignes pointillées et le trait blanc du premier plan étaient un défaut : dans l'image figée, les gerbes d'étincelles de la chute étaient dessinées toutes à leur point de départ, donc alignées.
- Lances, flammes, bannière et silhouettes étaient dessinées en aplats nets, sans le grain ni la lumière du tableau peint.

`CURRENT FACT` Corrections :

- **Couche d'éléments.** Ce que le code ajoute à un tableau est dessiné en pixels de l'image, à la résolution du tableau, assombri par la nuit de la scène puis éclairé par ses propres feux et sa lune, avant d'être posé avec la caméra du tableau (`src/ui/opening/openingLayer.ts`). Le canvas suit la densité de l'écran.
- **Feux.** Les flammes sont simulées sur le grain du tableau, environ deux pixels, en cinq teintes franches. Elles brûlent aux feux de la bataille, et à la place des feux peints : braseros de la salle du trône, brasero, torches et toits de Bois-Clair, feu du camp. Positions relevées dans les images, puis vérifiées à l'œil.
- **Premier plan.** Bannière de lin à bordure, coutures et pièces, toujours sans emblème. Ses plis suivent la courbure du tissu simulé. La hampe casse sur « la défaite », tombe en biais, se rattrape sur ses échardes et reste penchée, le tissu pendu à sa traverse. Les lances, les boucliers, deux étendards en lambeaux et des débris sous chaque feu prennent la lumière de la scène. Le cadrage descend pour garder les feux et le sol au-dessus du bandeau.
- **Silhouettes.** Personnages encapuchonnés avec bâton, liseré de lune et foulée sous la robe.
- **Bandeaux.** Le format de référence passe de 2,39:1 à 2:1, ce qui rend de l'image aux fenêtres étroites.

`CURRENT FACT` Mouvement réduit, conformément à `UI_AND_ACCESSIBILITY.md:25` et `PRESENTATION_AND_MEDIA.md:26` (fondu doux, sans grand déplacement) : la caméra reste fixe, sans tremblement ni gerbe. La bannière debout se fond dans la bannière brisée sur « la défaite ». Les Serpents apparaissent en fondu à l'endroit où la marche les aurait laissés, et respirent sur place. Le feu, la lumière, la fumée et le vent restent animés sur place. Les silhouettes de l'aqueduc continuent de marcher : petites, lointaines et lentes, elles ne font pas partie des grands déplacements visés par le contrat. Le texte de chaque plan reste affiché d'un bloc.

## Camp, conseillers et aqueduc

`CURRENT FACT` Retour de l'opérateur le 2026-11-03 : les silhouettes de l'aqueduc sont à retravailler, et le camp demande un feu animé, les héros au centre de la scène, bien intégrés, puis les conseillers.

- **Héros.** Les portraits de dialogue posés par-dessus l'image sont retirés. Alistair, Marian, Kestrel et Elara sont dessinés dans le tableau avec leurs feuilles pixel de combat, au double exact, donc sur le grain du tableau. Ils se rassemblent au milieu du camp, sur le sol, à l'échelle des tentes et des caisses : deux viennent du feu, deux des chariots, et ils se font face comme dans le dialogue. Lumière par multiplication, chaude côté feu et froide côté nuit, qui garde les noirs de la pixel art ; liseré du feu et de la lune, ombre de contact, ombre portée étirée à l'opposé du feu. En mouvement réduit, ils apparaissent en fondu à leur place et respirent.
- **Conseillers.** Séraphine et Maelor, qui ouvrent le dialogue suivant, se tiennent de part et d'autre du feu, à gauche, où le dialogue les place. Ils n'ont pas de feuille de combat : leur portrait est réduit à la densité des héros comme le fait `tools/pixel-sprites` pour les unités sans pose (réduction, bords francs, contour, trame de respiration), dans le navigateur, sans fichier nouveau. Le contrat LOCKED `PRESENTATION_AND_MEDIA.md` limite la composition à quatre acteurs visibles : les héros s'effacent de 7,6 s à 8,7 s, puis les conseillers apparaissent à 8,8 s et 9 s, et le dialogue s'ouvre sur eux. Six personnages ensemble demanderaient un amendement.
- **Feu du camp.** Le feu simulé en masse ronde est remplacé par un feu de langues (`TongueFire`) : cinq langues qui ondulent, s'étirent et lâchent des flammèches, sur le même grain et dans les mêmes cinq teintes. Fumée qui monte du foyer, braises.
- **Aqueduc.** Les silhouettes de 58 pixels, plus hautes que les arches, sont remplacées par une file de seize personnages encapuchonnés d'une dizaine de cellules, à l'échelle de l'ouvrage, posés sur le tablier relevé dans l'image. Certains portent une lance ou un bâton, aucune bannière. Liseré de lune, quatre pas, sortie et entrée derrière les deux ruines du premier plan, brume éclairée derrière la file.

`CURRENT FACT` Vérifications : suite complète, build, contrats, validateur de mise en scène et porte LOCKED verts. Dans le jeu, la séquence complète atteint le dialogue de Séraphine en 54,9 s, Passer au camp fait d'abord disparaître le canvas, la reprise après rechargement et le mouvement réduit avec une image bloquée tiennent.

## Limites

- Personne n'a confirmé par écrit avoir vu la séquence en temps réel avec le son : le verdict porte sur le choix de version.
- Figurants : plus de quatre Serpents visibles au plan 3 et six silhouettes au plan 4, lus comme du décor. L'opérateur peut demander de les réduire.
- Le plan `STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md:7` déconseillait une succession automatique d'images. Il n'est pas LOCKED et le choix B2 l'emporte ici.
- Téléphone : non regardé. Le passage mobile est prévu après le contenu (OD-2026-11-01-C).
- Le pilote `tools/demo-continuous-production-qa.mjs` a reçu son nouveau sélecteur mais n'a pas été relancé en entier.
