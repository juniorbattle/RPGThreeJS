# Générateur du verrou de présentation du Lion : réparé, corrections intégrées (2026-11-13)

| Champ | Valeur |
| --- | --- |
| TASK | Réparer le générateur du verrou de présentation des dialogues du Lion (run `claude-staging-generator-20261114T0347Z`), puis y intégrer les trois corrections de mise en scène validées par « Oui, corrige-les » |
| DOMAIN | Outillage (générateur du verrou), présentation narrative (mise en scène des dialogues du Lion) |
| BASELINE | `a20e6438` sur `dev` (contrats 1.24.0, baseline `133814bac45cc31c8eda7aa0fa1acb16a9ca7e35`) |
| BRANCH | worktree `claude/vigilant-chatterjee-156e12`, publié sur `dev` |
| HEAD | le commit de ce rapport, après `91384e27` (réparation) et `6b67c458` (corrections) |
| STATUS | merged : livré sur `origin/dev` |
| MERGED_IN | `dev` |
| SUPERSEDES | NONE. Complète la section « La correction des scènes du Lion » de [l'arc de Maelor](maelor-arc-2026-11-13.md). |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | Aucun changement visible. Le placement des trois scènes corrigées est écrit dans le verrou au lieu d'être appliqué à la résolution. Le plan que le jeu résout est identique octet pour octet pour tous les dialogues du Lion et toutes leurs variantes. Aucune réplique, aucun choix, aucun acteur ni aucun champ de sauvegarde ne change. |
| CANONICAL_DOCS_UPDATED | `.agents/skills/cinematics-journey/SKILL.md` : le skill attribuait le verrou à `generate_cin6d6_runtime_registry.ts`, qui n'écrit que `FinalPresentationRegistry.generated.ts`. Je n'ai touché ni l'état, ni `AGENTS.md`, ni les décisions : la session parente les consolide. |
| EVIDENCE | `tsc`, suite complète, build, `cinematics:validate-narrative-staging`, `contracts:validate`, garde vide. Instantané du placement effectif avant et après, identique. Navigateur : planche avant/après et résultat JSON dans `docs/reports/lion-staging-generator-2026-11-13/`. |

## La cause

`CURRENT FACT`.

`tools/cinematics/generate_cin6ea4_dialogue_lock.ts` parcourait tout le registre des dialogues. Il exigeait pour chacun une entrée dans `tools/cinematics/specs/narrative_dialogue_staging.json`, une spécification figée au 2026-09-13 (71 entrées). Deux dialogues ont été ajoutés ensuite par la grammaire de campagne, `first_refuge_gathering` et `roadside_peddler`. Ils ont leurs propres plans (`CAMPAIGN_GRAMMAR_PLANS` dans `NarrativePresentationPlans.ts`), mais pas d'entrée dans cette spécification. Le script s'arrêtait donc sur le premier dans l'ordre alphabétique.

Ce n'était pas le seul obstacle. Le script imposait aussi 73 dialogues, 251 étapes et 28 choix ; il y en a aujourd'hui 75, 256 et 29. Surtout, le verrou ne correspondait plus à ce que le script produisait. Une régénération à blanc aurait changé 13 plans canoniques et 50 variantes. Des acteurs auraient bougé : le dragon aurait quitté son nid, Witness Road aurait été redécoupé, et Alaric se serait tourné vers d'autres interlocuteurs. Voici les écarts :

1. **32 plans écrits ou retouchés à la main le 2026-09-18 :**
   - Witness Road et ses deux dialogues de combat (`e749b822`) ;
   - 28 variantes du jugement d'Alaric, où les répliques du bluff ont été insérées sans régénération (`2fb6988c`) ;
   - une variante ajoutée à la main (`7b26af55`), que les scénarios d'accessibilité ne produisent pas.
2. **Les vidéos sources reclassées.** Le retrait des vidéos (OD-2026-10-24-A) a reclassé 9 vidéos sources. Les segments verrouillés gardent la transition avec laquelle ils ont été revus.
3. **Deux dialogues modifiés par OD-2026-11-04-C.** La réplique 3 de `final_refuge` est retirée, et Kestrel décrit le nid du dragon. `NarrativePresentationPlans.ts` dérive leur plan actuel du plan verrouillé.
4. **Les preuves historiques réécrites.** Le script réécrivait aussi les audits et rapports datés de CIN-6E-A.4R (`tools/cinematics/specs/final_*.json`, `docs/reports/cin-6e-a-4*`).

## La réparation (`91384e27`)

`CURRENT FACT`.

- **Deux fichiers.** `tools/cinematics/dialoguePresentationLock.ts` construit le verrou. `generate_cin6ea4_dialogue_lock.ts` l'écrit : `npm run cinematics:generate-dialogue-lock`, ou `-- --check` pour seulement comparer.
- **Chaque écart devient une entrée explicite :**
  - les dialogues mis en scène hors du verrou, lus dans `CAMPAIGN_GRAMMAR_DIALOGUES` ;
  - le classement des vidéos au moment du verrou ;
  - les formes, au moment du verrou, des deux dialogues de OD-2026-11-04-C ;
  - les 32 plans écrits à la main, recopiés tels quels avec leur origine dans `tools/cinematics/specs/dialogue_presentation_authored_plans.json`.
- **L'ordre des clés** suit le fichier commité. Une régénération ne montre donc que les vrais changements.
- **Les contrôles avant écriture :**
  - chaque plan couvre ses étapes dans l'ordre, montre chaque orateur et au plus quatre acteurs ;
  - dans un plan généré, chaque orateur se tourne vers son interlocuteur, la compagnie tient la gauche et l'adversaire la droite, avec un civil menacé admis au centre ;
  - chaque variante atteignable a son plan.
- **Les audits datés** ne sont plus réécrits. L'ancien code reste dans l'historique du fichier.
- **Le test.** `src/cinematics/FinalDialoguePresentationLock.test.ts` échoue si le verrou commité diffère d'une régénération.
- **Le résultat.** La régénération à vide redonne le fichier actuel octet pour octet.

## Les trois corrections dans le générateur (`6b67c458`)

`APPROVED DECISION` : « Oui, corrige-les » (2026-11-13).

- **La règle.** `STAGING_CORRECTED_SEGMENTS` nomme les trois segments, et la règle de `LockedStagingCorrections.ts` est portée telle quelle dans le générateur. La compagnie tient la gauche. Un civil menacé se tient au centre, entre elle et l'ennemi. Celui qu'elle affronte tient la droite. Chaque orateur se tourne vers celui à qui il parle.
- **Le verrou change pour quatre plans :** les trois segments canoniques et la variante où Cédric parle pour la compagnie, soit 59 lignes.
- **Le module et son test sont supprimés.** `resolveFinalDialoguePresentationPlan` retrouve sa version d'avant `f8b101c9`.
- **Le nouveau test.** `src/cinematics/LionStagingCorrections.test.ts` (7 tests) fige le placement validé, acteur par acteur et réplique par réplique. Il le vérifie tel que le jeu le résout (avec et sans Cédric) et tel que le verrou l'écrit.

## Vérification

`CURRENT FACT`.

- **Instantané du placement effectif.** Avant et après, il couvre 494 entrées : les plans résolus pour chaque dialogue et chaque variante, les tableaux appliqués et l'audit complet de mise en scène. Il est identique octet pour octet.
- **Navigateur.** La page de preuve `tools/dialogue/static-tableau-v2-proof.html` tourne sur le serveur de dev du port 5187, lancé par `preview_start`. Captures Playwright en 1600×900, avec et sans mouvement réduit. Les positions et orientations des acteurs relevées dans le DOM sont identiques avant et après (`result.json`). Planche : `before-after-three-scenes.jpg`. Deux prises successives ne donnent pas les mêmes pixels, même sans changement de code, parce que le tableau est animé. La comparaison porte donc sur le DOM.
- **Commandes :**
  - `npx tsc --noEmit` : vert.
  - `npm test` : vitest donne 3531 tests verts, avec les 5 échecs hérités de `tools/cinematics` dans un worktree neuf (`tmp/`, ffprobe) et le fichier `minimax_task_checkpoint`. Comme vitest sort en échec, `node --test tools/qa/qa-job.test.mjs` a été lancé à part : 26/26.
  - `npm run build` : vert.
  - `npm run cinematics:validate-narrative-staging` : `ok`, avec les deux mêmes étapes inaccessibles.
  - `npm run contracts:validate` : vert. La garde est vide.
- **Non vérifié :** les trois scènes dans une vraie partie, qui demande de rejouer le chapitre. La variante avec Cédric est fixée par les tests.

## Constats non corrigés

`UNDECIDED`. Ils relèvent de l'opérateur.

- **Alaric s'adresse à Maelor absent.** Dans 7 variantes atteignables du jugement d'Alaric, celles du mensonge éhonté retouchées à la main le 2026-09-18, la réplique `brazen-lie-rebuked` s'adresse à Maelor alors qu'il n'est pas en scène. Alaric se tourne vers la gauche, vers personne. Ces plans sont recopiés tels quels pour ne rien changer au jeu. Les corriger revient à les retirer de `dialogue_presentation_authored_plans.json` et à régénérer, ce qui demande un nouveau contrôle visuel.
- **La spécification de mise en scène reste figée.** `narrative_dialogue_staging.json` garde ses 71 entrées. Le générateur ne la lit plus. `npm run cinematics:validate-narrative-staging -- --write` la régénérerait.
- **Deux paragraphes de décision sont dépassés.** Les lignes 197 à 202 de `docs/autonomy/COMPLETENESS_REVIEW_OPERATOR_DECISION_2026-11-13.md` décrivent encore le module et le générateur en panne. C'est à la session parente de les mettre à jour.
