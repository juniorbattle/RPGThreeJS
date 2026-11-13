# Figurants muets dans les tableaux de dialogue ordinaires — décision de l'opérateur (2026-11-13)

Statut : `APPROVED DECISION`. Décision prise sur la fiche de la dernière passe narrative, puis dans la session « Amendement des figurants dans les tableaux ». Elle est appliquée aux contrats par la tâche dédiée `PRODUCTION-CONTRACTS-TABLEAU-EXTRAS-1` (jeu de contrats 1.24.0). Le brouillon validé est `docs/content/drafts/TABLEAU_EXTRAS_AMENDMENT_DRAFT_2026-11-13.md`.

## OD-2026-11-13-G — Figurants muets, sprites existants

**Demande de l'opérateur** (remarque du bilan, [OD-2026-11-13-F](COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md)) : « habiller nos événements avec les civils et personnages génériques ».

**Choix sur la fiche** (https://claude.ai/artifact/R9fw53FQzStpwffR6GdC1q, entrée E1) : « Amendement, sprites existants ».

**Réponse de l'opérateur au brouillon** : « Oui, sans option B ». Il valide :
- le texte d'amendement de la section 4 du brouillon, mot à mot ;
- la liste de la section 2 : 15 dialogues et leurs figurants, avec la reprise du sprite du témoin dans l'Ours, le Dragon et le Scorpion ; l'acte final reste sans figurants ;
- sans l'option B : ni guerriers de l'Ours ni érudits du Scorpion comme figurants. La puce « Sprites » garde les seuls maîtres civils, et `bear_outpost_gathering`, `scorpion_oasis_gathering` et `scorpion_scholars` restent sans figurants.

### Dialogues habillés

| Partie | Dialogues |
| --- | --- |
| Lion | `refugee_trial`, `village_choice`, `ate_village_fear`, `rep_event_bois_clair_denunciation`, `rep_event_village_memorial_request`, `ate_bois_clair_night_watch`, `village_defense_aftermath`, `village_raid_aftermath`, `witnesses_on_road` |
| Ours | `bear_miners_testimony`, `bear_mines_defense_aftermath` |
| Dragon | `dragon_terrorized_village`, `dragon_freed_pilgrims` |
| Scorpion | `scorpion_phoenix_faithful`, `scorpion_temple_witnesses` |

Les sprites sont les maîtres civils existants, inchangés : `villageois`, `villageoise`, `refugee`, `refugee_mother` et `survivor` pour le Lion, `bear_miner`, `dragon_villager`, `dragon_pilgrim` et `phoenix_faithful`. Les seize maîtres civils ont le visage couvert (OD-2026-11-11-G), vérifié têtes agrandies. Les figurants de chaque dialogue sont ceux du brouillon : 43 en tout, quatre au plus par tableau. Ajouter un dialogue ou changer ses figurants demande une nouvelle approbation de l'opérateur, sans nouvel amendement.

## Amendement 1.24.0

`APPROVED DECISION`. Le texte est approuvé tel que rédigé dans la section 4 du brouillon, sans l'option B.

contracts-guardian a relu le diff réel le 2026-11-13, avant le commit. Résultat : PASS WITH WARNINGS, aucun changement de fond. Le texte est appliqué mot pour mot. Une seule précision est reprise, dans le manifeste et donc sans effet sur le sens : le `supersededRule` dit que la règle remplacée est la portée implicite des puces « Cast » et « Animated backdrop » des sets 1.13.0, 1.14.0 et 1.20.0. Ces puces ne réservaient pas les figurants aux tableaux vivants en toutes lettres. La seconde remarque concerne le code : les figurants sont cachés aux lecteurs d'écran et n'ont pas d'identifiant d'acteur. Elle est appliquée et vérifiée par le test de la surface.

Documents touchés :
- `docs/contracts/PRESENTATION_AND_MEDIA.md` : nouvelle section « Tableau extras — OD-2026-11-13-G », après « Post-demo moments » ;
- `docs/contracts/AUTHORING_AND_QA.md` : paragraphe « Tableau extras evidence — OD-2026-11-13-G », après « Plateau music evidence » ;
- `docs/contracts/README.md` et `docs/contracts/contracts.manifest.json` : l'entrée 1.24.0 et ses métadonnées.

La Constitution ne change pas.

**Ordre.** Relecture indépendante du diff réel, commit de cette décision, commit d'amendement, puis commit opérationnel qui inscrit le SHA de l'amendement comme baseline immuable. Ensuite seulement, le jeu montre les figurants.

**Ce qui ne change pas.** Le texte des dialogues, la mise en scène, la limite de quatre acteurs, les tableaux vivants et leurs décors animés, les sauvegardes V6 et la vérité de jeu. Aucune image générée.

**Acceptation.** L'acceptation artistique reste à l'opérateur, en regardant les tableaux.

## Livraison (2026-11-13)

`CURRENT FACT` Tâche dédiée, run `claude-tableau-extras-20261113T2014Z` :
- décision inscrite : `2b8e9c75` ;
- amendement appliqué : `133814ba`, jeu de contrats 1.24.0 ;
- baseline immuable `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35` inscrite dans `93d138b2` (AGENTS.md, protocole, invite récurrente, skills, `docs/README.md`, état, statut du projet) ;
- figurants dans le jeu : `src/cinematics/TableauExtras.ts` et `NarrativeSceneSurface.ts`, avec leur test `TableauExtras.test.ts`.

**Vérifié dans le vrai jeu, avec de vrais clics :** huit dialogues habillés des quatre parties, en réglages par défaut, avec le mouvement réduit du système émulé et avec le réglage du jeu. Le détail est dans `docs/reports/tableau-extras-2026-11-13.md`.

Mêmes figurants que dans la liste validée. Seules les places de `refugee_trial` et de `village_choice` sont ajustées en jeu, pour rester visibles quand une réplique d'Alistair passe à Cédric.

**Non vérifié dans le vrai jeu :** les deux dialogues de réputation à Bois-Clair, la veillée et les deux issues de Bois-Clair. Ils sont couverts par la page d'épreuve et par les tests.
