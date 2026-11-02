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

## Limites

- Personne n'a confirmé par écrit avoir vu la séquence en temps réel avec le son : le verdict porte sur le choix de version.
- Figurants : plus de quatre Serpents visibles au plan 3 et six silhouettes au plan 4, lus comme du décor. L'opérateur peut demander de les réduire.
- Le plan `STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md:7` déconseillait une succession automatique d'images. Il n'est pas LOCKED et le choix B2 l'emporte ici.
- Téléphone : non regardé. Le passage mobile est prévu après le contenu (OD-2026-11-01-C).
- Le pilote `tools/demo-continuous-production-qa.mjs` a reçu son nouveau sélecteur mais n'a pas été relancé en entier.
