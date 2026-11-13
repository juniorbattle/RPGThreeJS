# Bilan de fin de conception : récit (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | `OD-2026-11-13-F-RECIT` (run `claude-bilan-recit-20261113T1644Z`) : arbitrages N1, N2, N3 et N5 |
| DOMAIN | Contenu narratif des plateaux et de l'acte final, combats de plateau, cartes de conséquences |
| BASELINE | `b2830891` sur `dev`, puis `7cbb0f74` fusionné en avance rapide (jeu de contrats 1.23.0, baseline immuable `6228a34fd69a01406ecf0fb7168a53f92a267d7b`) |
| BRANCH | worktree `claude/youthful-euler-32e164`, publié sur `dev` |
| HEAD | le commit de ce rapport |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE (applique `docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md`) |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Trois choix existants lancent désormais un combat (convoi de l'Ours, hameau du Dragon, érudits du Scorpion), et leur scène se rouvre après la victoire. La trahison gagne une réplique sur Bois-Clair, et les trois épilogues disent le sort de Maelor. Les drapeaux de choix, les poids et les verdicts des jugements, la réputation et le schéma de sauvegarde ne changent pas. Trois faits techniques de victoire s'ajoutent à `flags`. |
| CANONICAL_DOCS_UPDATED | `docs/content/drafts/PLATEAU_FORKS_AND_MAELOR_LINES_DRAFT_2026-11-13.md` : brouillon, relecture du gardien et validations de l'opérateur. L'état, `AGENTS.md` et `OPERATOR_DECISIONS.md` restent à la session parente. |
| EVIDENCE | Tests ciblés et suite complète, `tsc`, build, `narrative:validate`, `contracts:validate`, garde vide (section « Vérification »). Navigateur sur le serveur de dev du port 5181, avec de vrais clics sur les six branches, la trahison et l'épilogue de la Crainte. Les sauvegardes de test viennent du pilote QA (`tmp/qa-forks/`, non suivi). |

## Validations de l'opérateur

`APPROVED DECISION`. Le brouillon a été soumis question par question, avec les répliques exactes. Le gardien des contrats l'avait relu avant, et ses réserves étaient prises en compte. L'opérateur a répondu :
- Ours : « Valider tel quel ».
- Dragon : « Valider tel quel ».
- Scorpion : « Valider tel quel ».
- Trahison : « Réplique Bois-Clair ».
- Clôture : « Varie selon la fin ».
- Crédits : « Trame complète ».

Le détail mot à mot est dans le brouillon, §1 à §7 et §9.

## N1, un embranchement de combat par plateau

`CURRENT FACT`. Dans chacun des trois plateaux, un des deux choix existants garde ses effets et lance en plus un combat, après une réplique d'annonce ; l'autre l'évite à son prix inchangé.

| Plateau | Temps | Branche combat | Combat | Branche esquive, prix |
| --- | --- | --- | --- | --- |
| Ours | 5, `bear_ore_convoy` | « Saisir le minerai pour le clan. » | `bear_convoy_escort`, col enneigé, 2 éclaireurs et 1 mineur du Corbeau, 20 or | « Marquer le convoi… » : renonce aux 3 minerais et aux 40 or |
| Dragon | 4, `dragon_terrorized_village` | « Monter la garde et repousser le prochain raid. » | `dragon_village_raid`, sentier des contreforts, 2 pillards du Loup et 1 loup, 25 or | « Faire payer notre protection. » : 60 or, −2, manquement ; le Loup ne recule « pour cette nuit, du moins » |
| Scorpion | 3, `scorpion_scholars` | « Libérer le fidèle du Phénix. » | `scorpion_scholars_camp`, piste des caravanes, 3 érudits du Scorpion, 30 or | « Le laisser aux érudits. » : 50 or, −2, manquement, Eldwin fermé |

Les trois combats sont de rang normal et rapportent 0 de réputation (échelle de l'après-démo).

**La scène rouverte.** Chaque combat a pour `postCombatDialogueId` l'id de sa propre scène. La victoire pose un fait technique (`bearConvoyEscortDefeated`, `dragonVillageRaidRepelled`, `scorpionScholarsDefeated`), déclaré dans `victoryFacts` (`*Finale.ts`) et posé par `combatVictoryFacts` dans `GameApp.resolveCombat`. Le builder de la scène lit ce fait et renvoie sa version d'après-victoire : l'issue, puis la moitié de la rencontre du héros recrutable propre à cette branche (Gunnar, Lyra, Eldwin). Les répliques de ces rencontres ne changent pas : sur la branche du combat, elles se jouent désormais après le combat. La scène garde son id, son image et son humeur ; aucune clé de `moods.ts` n'est ajoutée.

**Code.**
- `withMeetingPart` (`heroMeetings.ts`) ne garde que la partie d'une rencontre qui suit les étapes hôtes données.
- Le hameau et les érudits passent de statiques à construits depuis l'état (`DRAGON_SCENE_BUILDERS`, `SCORPION_SCENE_BUILDERS`), sans changer d'id.
- Les cartes `bear`, `dragon` et `scorpion.consequences.json` déclarent chacune un fait `system` et le `leadsTo` de l'option qui combat.

**Jugement.** `conductWeights`, `deeds`, `forceFacts` et `honourFact` ne changent pas. À choix égaux, le verdict est identique, et un test le vérifie avec et sans le fait de victoire. Ni la voie d'honneur ni celle de force ne changent de condition.

## N2, la trahison rappelle Bois-Clair

`CURRENT FACT`. `finale_betrayal` reçoit l'étape `boisclair` (Maelor) entre `reveal` et `advice`. Elle a trois variantes : `missionGreed` et `silencedWitnesses` ensemble, `missionGreed` seul, `silencedWitnesses` seul. Elle est absente si le Lion n'a fait ni l'un ni l'autre. Quand elle paraît sans autre conseil suivi, la réplique de repli devient « Depuis, vous ne m’avez plus écouté… ». Deux échos `final_act` s'ajoutent à `lion.consequences.json` : `lion.bois_clair.sacrificed.betrayal` et `lion.witnesses.silenced.betrayal`.

## N3, le sort de Maelor

`CURRENT FACT`. Les trois épilogues reçoivent l'étape `maelor` (Kestrel) juste après le rappel des Sceaux, avec la réplique validée pour chaque fin (`MAELOR_FATE`, `finaleEpilogues.ts`). Elle ne pose ni ne lit aucun drapeau.

## N5, la trame des crédits

`APPROVED DECISION`. L'opérateur retient la trame complète en dix rubriques (brouillon, §7). Rien n'est écrit dans `src/ui/credits.ts` : le texte final, noms et rôles compris, viendra de l'opérateur, mot à mot. L'écran reste caché jusque-là.

## Vérification

- `npx tsc --noEmit` : propre.
- `npm run narrative:validate` : les cinq cartes `ok`, sans erreur. Le Lion passe de 48 à 50 échos, chaque plateau de 29 à 30 faits, et l'acte final reçoit 19 échos des quatre plateaux au lieu de 17 (comptes mis à jour dans `narrativeCoherence.test.ts`).
- `npm test` : 3446 tests verts sur 3456, 240 fichiers verts sur 244. Les 10 échecs, dans 4 fichiers, viennent de médias ignorés par git qui manquent à ce worktree mais existent dans le dossier principal : `public/assets/vfx/megapack-runtime/*.png` pour `spritesheetPng.test.ts`, `tmp/cinematics/...` pour trois tests de `tools/cinematics/`. Ce n'est pas une régression : ces fichiers ne touchent pas au récit.
- Après la fusion de `origin/dev` (`bbc93f01`, dont le commit de la suite d'un combat de Tournoi en direct et celui de la fin de l'acte sans Maelor), `tsc`, `narrative:validate` et tous les tests du récit restent verts. La suite vitest complète montre trois échecs hérités, reproduits à l'identique dans un worktree temporaire sur `origin/dev` seul, sans ce lot :
  - `src/campaign/plateaux/finale/finalePresentation.test.ts` : place de Maelor à la fin de la chronique ;
  - `src/game/GameAppLivingTableaux.test.ts` et `src/game/cin67NarrativeStageIntegration.test.ts` : suite de Bois-Clair après un raid gagné.

  Ils sont signalés à la session parente. `arenaTextures.test.ts` et le test des instruments des plateaux ont cédé une fois sous la charge de la suite complète ; ils passent seuls.
- `npm run build` : propre (avertissement de taille de bloc hérité).
- `npm run contracts:validate` : vert. Garde `git diff --exit-code 6228a34f… HEAD -- docs/contracts docs/game/GAME_CONSTITUTION.md` : vide.
- Tests nouveaux : `src/campaign/plateaux/plateauForks.test.ts` (8 tests).
  - Navigation : choix, annonce, combat, scène rouverte sans choix ni combat.
  - Arène, ennemis, récompense et fait de victoire de chaque combat.
  - Égalité des verdicts avec et sans le fait de victoire.
  - Les deux branches de chaque embranchement, jouées de bout en bout par le pilote QA depuis les sauvegardes de démo, avec la rencontre jouée une seule fois et du bon côté, et l'issue honneur ou force de chaque plateau.
  - Les trois variantes de la trahison et la réplique de repli.
  - Les trois épilogues.
- `heroMeetings.test.ts` : adapté (la version de la scène hôte où chaque branche rejoint sa rencontre), plus deux tests (découpage d'une rencontre, rencontre de la branche du combat seulement après la victoire).
- Pilotes de plateau (`src/qa/*PlateauDriver.test.ts`) : verts sans changement.
- Navigateur (dev, port 5181, `?qa=1&cin6a=golden` pour le bouton QA « Victoire » du combat). Chaque fois : vrai clic sur le choix, combat monté dans l'arène du plateau, victoire, scène rouverte, réaction du héros.
  - Ours, combat : « Escorte du convoi », +20 or, puis « Les chariots sont à nous… » et Gunnar « Vous avez pris le minerai… ». Sauvegarde : or 270 → 330, réputation −1, nœud résolu.
  - Ours, esquive : pas de combat, Gunnar « Vous avez marqué ce convoi… ».
  - Dragon, combat : « Raid sur le hameau », +25 or, le villageois, puis Lyra « Cette nuit, vous avez monté la garde avec moi… ».
  - Dragon, esquive : Kestrel « … Pour cette nuit, du moins. », Marian, puis Lyra, branche « rançonné ».
  - Scorpion, combat : « Camp des érudits », +30 or, l'aveu, l'érudit blessé, puis Eldwin, branche « libéré ».
  - Scorpion, esquive : l'érudit, Marian, puis Eldwin « Vous l’avez laissé aux érudits… ».
  - Trahison : après la finale du Tournoi, Maelor dit « Tout a commencé à Bois-Clair… pendant que les captifs partaient au nord. », puis sa liste des conseils.
  - Épilogue de la Crainte, après la brèche : Kestrel « Maelor n’est pas ressorti de la brèche… c’est aussi pour cela qu’ils nous craignent. ».

## Limites et suites

- L'équilibre des trois combats attend le test sur PC de l'opérateur. Le Scorpion oppose trois mages dès la région I.
- Le pilote QA ne joue pas la défaite. Comme pour tout combat, une défaite ramène au dernier point de sauvegarde, avant le choix.
- La dernière passe narrative sur les moments à forte tension, ajoutée par l'opérateur au même lot, suit dans un brouillon séparé.
- Remarque de l'opérateur pendant la vérification : les sprites de Lyra et de Gunnar paraissent trop grands dans les tableaux par rapport à la compagnie, et leur pose de repos semble inadaptée. Voir la section suivante.

## Dernière passe narrative des moments à enjeu

`APPROVED DECISION` puis `CURRENT FACT`. Remarque de l'opérateur au lancement des lots : « Le recit globale doit etre optimale surtout lors des moments de tensions ou a enjeux marquantes ».
- **Inventaire.** 35 moments, du prologue aux trois fins, en annexe : `docs/content/drafts/HIGH_STAKES_MOMENTS_INVENTORY_2026-11-13.md`. Le brouillon `docs/content/drafts/HIGH_STAKES_NARRATIVE_PASS_DRAFT_2026-11-13.md` porte la grille en cinq critères pour 17 moments et les retouches mot à mot, texte actuel et texte proposé.
- **Fiche.** Les retouches ont été soumises sur une fiche d'arbitrages privée (https://claude.ai/artifact/R9fw53FQzStpwffR6GdC1q). L'opérateur a accepté les treize (A1 à D2), sans note. Pour les figurants (E1), il a choisi « Amendement, sprites existants ».
- **Écrit dans le jeu, mot à mot.**
  - A1 : le mobile de Maelor dans toutes les variantes de `advice`.
  - A2 : Marian ferme la trahison sur « Je dis seulement… ».
  - A3 et A4 : la réponse de Marian à la brèche et les derniers mots de Maelor.
  - A5 : la fin de l'acte boucle sur Bois-Clair.
  - B1 : « Notre clan » dans le Respect et l'Équilibre.
  - B2 : la brèche de la Crainte.
  - C1 : `finale_pre_serpent_final` construite depuis l'état, avec la réplique de Kestrel selon l'issue du Lion.
  - C2 et C3 : les trois avant-épreuves construites depuis l'état. La variante du refus est lue depuis les drapeaux du jugement (`*FinaleTrialSelected` sans `*TrialRequested`), et la réponse de la compagnie change au Dragon et au Scorpion.
  - C4 : le ralliement à la première personne.
  - D1 : les témoins du Dragon et du Scorpion.
  - D2 : la villageoise de Bois-Clair.
- **Cohérence.** Les quatre échos `final_act` du ralliement nomment leur cause par les nouvelles phrases. `narrative:validate` passe sur les cinq cartes.
- **Tests.** `src/campaign/plateaux/narrativePass.test.ts` (10 tests) fixe chaque retouche dans ses conditions. Les tests qui citaient les anciens textes ont été adaptés : navigation de l'acte final, rotation des héros (par l'étape et non plus par le texte), pilote de l'acte final.
- **E1.** L'amendement des figurants est une tâche dédiée sur les contrats. Il sort du périmètre de cette session, qui ne touche pas aux contrats ; il est proposé à part.
- **Limite.** Pas de vérification au navigateur pour ces retouches de texte (le volet était fermé). La couverture vient des tests, des validateurs et des pilotes QA.

## Limite de quatre acteurs visibles (constat transmis par la session parente)

`CURRENT FACT`. La session parente signalait que `createGenericNarrativeTableau` garde jusqu'à sept acteurs (`.slice(0, 7)`), et que `dragon_wolf_traps` en montrerait cinq. J'ai calculé chaque composition que le jeu met en scène, par le même chemin que `GameApp` (tableau du dialogue, puis `applyFinalDialoguePresentationPlan`) :
- 75 dialogues du Lion ;
- 130 versions des dialogues de l'après-démo (scènes construites sous deux états, scènes rouvertes des embranchements comprises) ;
- les rassemblements de refuge, avec la compagnie ajoutée comme le fait `GameApp`.

Aucune composition ne dépasse quatre acteurs. Le tableau générique à sept n'est qu'une base, que le plan remplace toujours par des groupes d'au plus quatre (`DRAFT_VISIBLE_ACTOR_CAP`, `PostDemoPresentationPlans.ts`). Le fond de `dragon_wolf_traps` ne contient aucun personnage peint. Le « cinquième » vu à l'écran est vraisemblablement le portrait de l'orateur dans la boîte de dialogue, qui relève de l'interface. Aucune correction n'était donc à faire. Le test `src/cinematics/visibleActorCap.test.ts` protège désormais la limite pour tous ces dialogues ; il échoue bien quand le plafond du plan est relevé à six.

## Remarque de l'opérateur : taille et pose des héros dans les tableaux

`CURRENT FACT`, taille corrigée.
- **Cause.** Le tableau ajuste chaque image, en `contain`, dans des cadres de même largeur (`.narrative-cast__actor`). Les masters de la compagnie et des plateaux sont des toiles de 512×512 où le personnage occupe environ 66 % de la hauteur, au-dessus d'une marge de 10,9 %. Ceux des six héros recrutables (`archive/non-demo`, 640×768) le font occuper 84 %, au-dessus d'une marge de 4,4 %. Ils paraissaient donc environ 1,5 fois plus grands, et plus bas.
- **Correction.** `tools/art/frame_tableau_actors.py` recadre chaque master sans rééchantillonnage ni aucun pixel modifié. Le personnage est posé sur une toile carrée de 997 px où une unité de hauteur (`worldHeight` de la table des poses) prend la même part que sur les masters de la compagnie, avec la même marge sous les pieds. Les images sont dans `public/assets/characters/pixel/tableau/`.
- **Portée.** Le champ `tableau` des six profils (`assetManifest.ts`) n'est lu que par le tableau (`actorImage`, `NarrativeSceneSurface.ts`). Portraits, registre de compagnie et combat ne changent pas. Test : `src/cinematics/tableauActorFraming.test.ts`.
- **Mesure dans la page** (scène du hameau, dev) : Lyra 270 px, Alistair 286, Kestrel 275, Marian 308 avec son bâton. Les pieds sont alignés entre 698 et 704 px. Le volet du navigateur était masqué : les captures n'étaient pas fiables, la mesure vient du DOM.

`APPROVED DECISION` puis `CURRENT FACT`, pose de repos. Une planche des personnages des tableaux montre que la compagnie et tous les personnages des plateaux ont une pose de repos. Seuls les six héros recrutables étaient en pose d'action, car leur master, d'une autre chaîne, sert aussi de pose `prepare` en combat (OD-2026-11-13-A) :
- Aldric levait son marteau ;
- Morvan brandissait sa faux ;
- Lyra lançait un sort ;
- Eldwin incantait ;
- Talon sautait, shuriken en main ;
- Gunnar pointait son canon.

L'opérateur a choisi « Générer, pilote sur Lyra ». Il a validé le pilote (« Valider, lancer les cinq »), puis les cinq autres (« Intégrer les cinq »), sur planches avant/après.
- **Génération.** Commande `rest` de `tools/art/finalImages.ts` : un appel par héros, le master en première référence et le master d'Alistair en seconde, pour la pose seulement. La règle des visages couverts (OD-2026-11-11-G) est dans chaque prompt, et chaque pose a été vérifiée sur planche. La clé du projet est lue par l'outil depuis le `.env.local` du dossier principal, jamais affichée.
- **Intégration.** `frame_tableau_actors.py --rest` cadre chaque pose, sans rééchantillonnage, sur la convention de la compagnie, mesurée sur sa propre hauteur debout. Provenance et empreintes : `tools/art/provenance/tableau-rest-poses.json`, vérifiées par `tableauActorFraming.test.ts`.
- **Portée.** Seul le tableau change. Le combat garde ses quatre poses, le portrait et le registre gardent le master.
- **Limite.** Le volet du navigateur a été fermé pendant l'intégration. Le contrôle dans la page a été fait sur le recadrage du master (même convention : 63 à 67 % de la toile, même marge) ; il n'a pas été refait sur les poses de repos.
