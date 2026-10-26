# Priorité aux actions de combat et au Composer VFX

**OD-2026-10-25-B — décision opérateur explicite, 25 octobre 2026 (America/Toronto).** Texte de l'opérateur dans la session Claude Code, après la livraison du lecteur d'animation narratif : « Honnetment je preferais plutot que tu te concentres sur composer vfx lab et finir nos actions competences utilises lors du combat tactic/stage ».

Contrats set 1.10.0 et baseline `da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5` inchangés. `COMBAT_AND_VFX.md` couvre déjà ce travail : le catalogue VFX est déclaré incomplet. On le termine par vérifications bornées d'asset, de registre, de visibilité, de timing et de mouvement réduit, liées à de vrais événements résolus. Aucun amendement.

## Décision

1. **Priorité de production :** le Composer VFX (lab de développement `?vfxlab=1`) et la finition des actions de compétence réellement utilisées en combat tactique et dans le Combat Stage. Pour chaque action : effet visible, poses, mouvement du lanceur, cadence, lisibilité de la cible et des PV, fin de l'effet, retour du contrôle, mouvement réduit.
2. **Pilote narratif Alistair (OD-2026-10-24-B) en pause :**
   - le lecteur d'animation par frames reste livré et inerte sur `dev` (`3e036189`, registre vide) ;
   - aucune session Codex n'est demandée pour le candidat `alistair-idle/v1` tant que l'opérateur ne la relance pas ;
   - la finition relationnelle de Bois-Clair passe après les actions de combat.
3. **Inchangé :**
   - vérité tactique (`legacyCombatRuntime.js`, `CombatBridge`), V6, canon ;
   - les 16 familles sonores bornées d'OD-2026-10-19-B et le report de la musique, des voix et des Ultimes ;
   - les PNG commerciaux CartoonCoffee, jamais commités (`.gitignore`) ;
   - l'acceptation artistique, qui reste à l'opérateur ;
   - le scheduler (PAUSED) et `main`.

## Constat qui fonde le plan

[Rapport de couverture](../reports/combat-vfx-coverage-2026-10-25.md), sur `dev@3e036189` :
- Sur les 34 actions de démo du lab, **3 affichent leur effet** (`w_charge`, `w_salvation`, `ni_shadow_step`).
- Les 31 autres pointent vers des planches retirées par R2C-C-1, que `VfxSystem` saute en silence. Comme `actionHasSpritesheetVfx` ne regarde que le type d'étape, ces actions perdent aussi le repli procédural : 13 d'entre elles n'ont plus rien de visible venant de leur preset.
- Le registre publié est vide depuis le 7 septembre (`6c86c96e`).
- Les poses `dash`, `attack` et `cast` ne s'appliquent qu'à travers des étapes de mouvement publiées : aucune n'existe.

## Plan proposé (PROPOSED FUTURE DESIGN)

Une famille à la fois, comme le demande le skill `combat-vfx-sprites` :

0. **Filet de sécurité runtime :**
   - le repli procédural revient dès qu'une planche ne se résout pas ;
   - un test garantit que chaque action de démo montre quelque chose ;
   - les faits d'état erronés (`vfxBasePresent`) sont corrigés.
1. **Contact :** attaques de base à l'épée, à la dague et à la lance, Brise-garde, Lame maudite, Attaque sournoise, Estocade longue, frappes ennemies.
2. **Projectiles :** arc, grimoire, Tir précis, Tir calibré, Trait sombre (allié et ennemi), Tir entravant, Clouage.
3. **Soins, bénédictions et altérations :** crosse, Rune de vigueur, Salut (finition), Maléfice, gardes et régénération du boss, Gel.
4. **Déplacement :** Charge, Bond du faucon, Pas de l'ombre, avec mouvement du lanceur et poses.
5. **Signatures de boss :** Choc, Séisme, Rafale, Frappe du titan, Brasier, Apocalypse.

Chaque action est composée dans le lab, avec les candidats locaux ou acquis par le serveur de dev, puis publiée dans `src/combat/vfx/generated/published-vfx-presets.json`. Elle est ensuite contrôlée par `npm run vfx:validate-published`, les tests VFX et une vérification dans le Combat Stage, en mouvement normal et réduit.

Mode d'auteur à confirmer par l'opérateur (UNDECIDED). La recommandation : Claude compose et publie des brouillons ; l'opérateur les revoit dans le lab et garde l'acceptation artistique.

## Suite

- **Mode d'auteur (APPROVED DECISION).** Réponse de l'opérateur : « Je compose moi-même les effets dans le lab. Fais le lot 0 (repli procédural et test de visibilité) et prépare le lab pour que je puisse enchaîner les actions. » L'opérateur compose et publie. Claude vérifie chaque série publiée et la commite sur `dev`. [Mode d'emploi](../project/VFX_COMPOSER_WORKFLOW.md).
- **Lot 0 livré** (run `claude-vfx-lot0-20261025T0845Z`) :
  - une étape dont la planche n'est plus enregistrée est dessinée par un substitut procédural de `VfxSystem`, à la même ancre et au même moment, en vue tactique comme dans le Combat Stage ;
  - `actionHasSpritesheetVfx` ne compte plus que les planches résolues ;
  - un test garantit que le preset de chacune des 34 actions dessine quelque chose ;
  - le lab marque l'état de chaque action, passe à la suivante non publiée, et ne compte plus comme travail un brouillon pré-rempli d'art retiré.
- **Lecture du contrat, à porter sur la prochaine fiche d'arbitrages.** `COMBAT_AND_VFX.md` interdit un effet de jeu fabriqué ou une substitution d'asset sans rapport. Le substitut n'est ni l'un ni l'autre : il est dessiné par les textures du moteur, sans fichier externe, déclenché par le même événement résolu, et sa famille vient du nom de la planche retirée. C'est un **placeholder de présentation** : il ne compte jamais comme couverture, qui reste à 3 sur 34. La lacune reste visible dans le lab, dans les avertissements de développement et dans les tests. Il touche aussi les retours génériques dont la planche est retirée : K.O., critique, `generic_hit`, attaques de base ennemies, `teleport_burst`. L'opérateur le verra donc pendant son playtest.
- **Mode d'auteur revu (APPROVED DECISION, 2026-10-25).** L'opérateur a ensuite répondu « Oui cela me va » à la proposition que Claude compose les effets famille par famille, publie et vérifie, l'opérateur gardant la revue et l'acceptation artistique, et pouvant toujours retoucher ou recomposer une action dans le lab.
- **Lot 1, contact, publié** (run `claude-vfx-contact-20261026T0103Z`) : 9 actions. Les candidats sont choisis parmi les sources CartoonCoffee déjà synchronisées, sur planche contact. Chaque action est composée avec les fonctions du Composer et publiée par le même gestionnaire que le bouton PUBLISH.
- Le registre vidé le 2026-09-07 par RESET ALL était un choix de l'opérateur (« user-owned modification ») : ses 33 publications ne sont pas restaurées. Elles restent consultables dans l'historique Git (`6c86c96e^`) comme référence.
