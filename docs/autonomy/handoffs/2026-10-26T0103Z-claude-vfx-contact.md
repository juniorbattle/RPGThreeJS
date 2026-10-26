# Lot 1 VFX contact publié — OD-2026-10-25-B

Run claude-vfx-contact-20261026T0103Z (agent claude, session interactive). L'opérateur a accepté que Claude compose les effets ; Claude publie, vérifie, et l'opérateur garde la revue artistique.

## Résultat

9 actions publiées dans `src/combat/vfx/generated/published-vfx-presets.json`. Elles ont été composées avec les fonctions du Composer (graine identique à celle du lab, `addSlot`, `addCasterMotion`, beats) et publiées par `handlePublishRequest`, le gestionnaire du bouton PUBLISH. Les candidats sont des sources CartoonCoffee déjà synchronisées, choisies sur planche contact.

| Action | Route | Composition | Mouvement |
| --- | --- | --- | --- |
| basic_greatsword_hit | tactique | Blue Slash v1 + Impact Hit Lv2 | — |
| basic_dagger_hit | tactique | Impact Cut V2 + Impact Hit Lv1 (rapides) | — |
| basic_long_spear_hit | tactique | Stab V7 vers la cible + Impact Hit Lv1 | — |
| w_break_guard | Stage | Blue Slash v21 + Impact Hit Lv3 (fort), puis Darkness Lv2 | fente `attack`, retour |
| d_cursed_blade | Stage | Blue Slash v17 + Darkness Lv3 | fente `attack`, retour |
| ro_sneak_attack | Stage | Blue Slash v2 Flurry B + Impact Cut V5 (rapides) | fente courte `attack` |
| l_long_thrust | Stage | Stab V5 vers la cible + Impact Hit Lv2 | pose `attack` tenue |
| enemy_heavy_strike | Stage | Impact Punch (fort) + Shockwave v2 au sol | fente `attack`, retour |
| enemy_venom_strike | Stage | Claw Slash v2 + Impact Poison Lv1 | fente `attack`, retour |

Le moment d'impact, qui fixe l'affichage des dégâts, tombe entre 0,18 et 0,29 s, juste après l'arrivée de la fente (0,2 s).

Le registre vidé le 7 septembre l'avait été par l'opérateur. Ses 33 anciennes publications ne sont pas restaurées ; elles restent dans l'historique (`6c86c96e^`) comme référence. Les tailles choisies sont du même ordre (BIG pour les gros coups et les estocs, MID pour les coups rapides).

## Corrections du lab

- **Publication ignorée à l'ouverture.** Sans brouillon local, le lab reconstruisait une graine avec l'art retiré au lieu d'ouvrir la composition publiée (`publishedEntryToDraft` était importé mais jamais utilisé). Avec une publication faite ailleurs, l'opérateur aurait vu l'ancienne planche morte et aurait pu la republier par-dessus. Désormais, une publication passe avant un brouillon absent ou intouché, et un vrai travail local reste prioritaire (`CombatVfxComposerPanel.ensureDraft`).
- **Tests d'interface isolés.** Les tests de l'interface du lab tournent sur un registre vide (overlay de développement). Ils supposaient implicitement un registre vide.
- **Test du registre durable.** `CasterMotionBackCompat` vérifiait que ce registre restait vide après le RESET ALL. Il vérifie maintenant qu'il est valide et ne contient que des actions connues du lab.

## Vérification

- `npm run vfx:validate-published` : PASS.
- Tests VFX : 32 fichiers, 969 tests.
- `npm test` : 162 fichiers, 2 850 tests, puis node:test 26/26 ; `tsc`, build, contrats, gate LOCKED, `git diff --check` : verts.
- **Chromium** (serveur de dev, arrêté ensuite) :
  - le lab affiche 9 actions ✓ et 25 restantes, et ouvre `basic_greatsword_hit` sur sa composition publiée ;
  - dans une vraie scène, les 9 actions jouent avec leurs textures CartoonCoffee, sans erreur, en graphismes normaux et réduits (secousse réduite à 0,1, ou 0,22 pour les coups forts) ;
  - dans un vrai combat (Patrouille Serpent), Blue Slash v1 s'affiche sur un Serpent et Brise-garde se lance dans le Combat Stage.
- Non jugé : le rendu final dans le Stage. La capture a saisi l'entaille au début de son animation, et Alistair était masqué par le panneau.
- Constat annexe, non corrigé : l'option QA « Tous les héros QA » place 12 unités pour 8 cases et bloque « Lancer le combat ».

## Prochaine action

L'opérateur revoit le lot contact en jeu ou dans le lab (PLAY IN COMBAT STAGE) et signale ce qui doit changer. Ensuite, Claude compose le lot 2, les projectiles : arc, grimoire, Tir précis, Tir calibré, Éclair Noir allié et ennemi, Tir entravant, Transpercement.

Compteurs : {"runtimeSourceFilesModified":2,"gameplayFilesModified":0,"testFilesModified":6,"publishedVfxActions":9,"newMedia":0,"imagegenCalls":0,"qaScenarios":1,"newQaJobs":0,"inheritedQaJobs":365,"liveQaJobsAfter":3,"inheritedWipPaths":0,"workflowFiles":6,"productProgress":1}. Publication normale sur origin autorisée par OD-2026-10-12-A.
