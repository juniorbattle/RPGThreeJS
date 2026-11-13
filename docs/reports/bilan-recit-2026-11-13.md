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
- Remarque de l'opérateur pendant la vérification : les sprites de Lyra et de Gunnar paraissent trop grands dans les tableaux par rapport à la compagnie, et leur pose de repos semble inadaptée. Elle est traitée à part, dans un travail de présentation.
