# Traversal T0 — convergence finale des références

Baseline conservée : `campaign-structure-1`, `a9a74ff637945cf0c180b4f9c8e012916ba8b41e`.

Implémentation et contrôles Chromium terminés. Revue visuelle opérateur attendue avant tout commit. La dernière demande — refaire le coffre et donner à tous les événements narratifs une présence sur toute la route — est intégrée. [Galerie et vidéo](review.html).

## 1. Fichiers modifiés

- Présentation/runtime : `src/styles/traversal.css`, `src/traversal/TraversalT0Scene.ts`, `TraversalT0World.ts`, `TraversalT0Route.ts`, `TraversalWorldRenderer.ts`, `TraversalForkOverlay.ts`, `TraversalRunController.ts`, `TraversalT0Assets.ts`, `TraversalSpriteBounds.json`.
- Handoffs : `src/game/GameApp.ts`, `src/ui/SceneTransition.ts`.
- Tests correspondants : cinq fichiers Traversal et `src/ui/SceneTransition.test.ts` (liste exacte dans [changed-files.txt](changed-files.txt)).
- Nouveaux assets : quatre PNG dans `public/assets/generated/lion-phase/traversal/t0/world-v1/reference-convergence/`, deux PNG dans `entities/chest-v4/`.
- Audit : `tools/traversal/qa/taxonomy-v1/CONTENT-AUDIT.md`. Scripts QA : `qa-convergence.mjs`, `qa-convergence-contacts.mjs`, `qa-convergence-targeted.mjs`, `qa-convergence-production.mjs`, `package_convergence_motion.py`. Preuves finales sous ce dossier.

## 2. Ajustements visuels

Nouveaux lieux complets pour marchand, Cédric, réfugiés et caravane. Palette forêt HD-2D préservée, structures en arrière-plan, accessoires au bord proche, route lisible au centre. Les marges des sections se fondent et la courte section de forêt conserve ses proportions. Le premier plan occupe 18 % de hauteur pour laisser les accessoires au sol visibles. L’ambuscade conserve ses sources et sa composition.

## 3. Échelles

Mesures sur les silhouettes rendues : humains 66 %, petites créatures 58 %, coffre fermé 34 %, obstacle 49 % de la hauteur visible du camion. La formation d’ambuscade conserve son réglage 52 %. Des captures camion/humain, ennemi, coffre et obstacle sont disponibles dans la galerie, en 1463×823 et 960×720 pour les contrôles ciblés.

## 4. Événements facultatifs

Présence environnementale sur toute la chaussée : étals et bagages du marchand ; halte en ruines de Cédric ; tentes, feu et effets des réfugiés ; caravane endommagée de la branche narrative. Les trois dernières sections mesurent 1600 unités de route avec approche, cœur et sortie. Le marchand propose désormais Rencontrer / Ignorer sur les deux voies. Les lieux sont indépendants des acteurs et persistent après refus ; RunSystem n’enregistre le contournement canonique qu’après dépassement. Deux voies et même road-space conservés.

## 5. Coffre et collecte

Le coffre ancien est remplacé par deux états peints bois/fer, fermé et ouvert. Échelle et ancrage partagés pour éviter un rétrécissement à l’ouverture. Contact au pare-chocs, ouverture, étincelle, petit retour `+1 provision`, aucune pause ni décision. Or : motif de trois pièces pour le même pickup existant `+5`. Garde : `+1 garde`. Retour visuel de 1,35 s ; aucun texte QA affiché. Récompenses locales à l’aperçu, sans mutation persistante. [Provenance](ASSET-PROVENANCE.md), [empreintes](asset-hashes.json).

## 6. Carrefour

Terrain accepté et signalisation physique conservés. Deux flèches cohérentes avec la bifurcation, noms actualisés depuis RunSystem, petit panneau en haut à droite sans jauges ni métadonnées. La sélection confirme directement, reçoit un focus, puis le choix est appliqué sous couverture complète. Reprise automatique.

## 7. Famille de transitions

Freinage/redémarrage 400 ms, attente 120 ms, couverture/révélation 360 ms avec interpolation douce. Entrée du camion sur 760 ms après l’attente initiale, route fixe pendant l’entrée. Travel → T0, événement, combat, retour, fork et sortie utilisent la même famille de fondus. Le contexte change sous couverture ; les retours retrouvent exactement la position arrêtée.

## 8. Preuves Chromium

Trois parcours complets de l’application réelle : Rencontrer/Combattre, Ignorer/Fuir et évitement. Tous reviennent à Travel View, sans erreur JavaScript. Cinq retours de la route Rencontrer/Combattre sont vérifiés à position identique ; un sur chacun des deux autres parcours. Les contrôles déterministes complètent les cas physiques et les trois familles d’ennemis.

| Scénario demandé | Preuve principale | Résultat |
|---|---|---|
| 1. Conduite libre | `live/meet-fight/clean-travel.png` | validé |
| 2. Ambuscade obligatoire | approche, `decision-0.2.png`, combat réel et retour | validé, aucune option Ignorer |
| 3. Événement Rencontrer | marchand local + Cédric + branche canonique, vidéo | validé |
| 4. Événement Ignorer | `contacts/report.json`, `targeted/report.json`, parcours ignore-flee | scène persistante, bypass différé |
| 5. Combat évité | parcours avoid, aucune décision à .3 | validé |
| 6. Combat engagé | parcours meet-fight, `random-combat.png` | moteur existant et retour |
| 7. Fuite | `targeted/flee-visible.png` et rapport | autre voie, adversaires encore visibles |
| 8. Coffre | `contacts/road-cache-moving-collection.png` et rapport | mouvement, aucune pause/UI/fade |
| 9. Or | `contacts/gold-moving-collection.png` et rapport | mouvement, aucune pause/UI/fade |
| 10. Obstacle | `contacts/obstacle-readable.png` et rapport | voie basse, aucune UI narrative |
| 11. Approche du fork | `live/meet-fight/fork-approach.png` | bifurcation avant choix |
| 12. Choix direct | `fork-direct-choice.png` | aucune confirmation supplémentaire |
| 13. Fondu/commit/reprise | `targeted/report.json` et vidéo | opacité 1 au commit, variante et reprise |
| 14. Retour événement | télémétrie `live/*/report.json` et vidéo | même progression avant/après |
| 15. Fin T0 | `exit-right.png`, `travel-return.png`, vidéo intégrale | sortie et retour Travel |

## 9. Enregistrement

[Vidéo courte](transition-review.webm), environ 28 s à vitesse réelle, 12 images/s. Conduite → approche de Cédric → arrêt/handoff → dialogue canonique → retour → conduite ; puis coupe pour omettre le trajet sans interaction ; approche du carrefour → choix → fondu → reprise. [Minutage exact](transition-review.json), [parcours intégral](live/meet-fight/journey.webm). Les frames de contrôle ont été inspectées.

## 10. Tests ciblés

**14 fichiers, 52 tests réussis** : Traversal, retour Travel, transitions et autorité route. [Journal](focused-tests.log).

## 11. Suite complète

**144 fichiers, 2455 tests réussis, aucun échec.** [Journal](full-tests.log), [résultats JSON](full-tests.json). Les anciens échecs VFX connus d’autres baselines ne se reproduisent pas ici ; aucun résultat historique n’a été substitué à cette exécution.

## 12. TypeScript, build et vérifications

`npm run build` réussit, incluant `tsc --noEmit` puis Vite. Seul avertissement de taille des bundles (>500 kB). `git diff --check` réussit. Le build final a également été ouvert dans Chromium avec `?qa=1&traversal=t0` : écran titre visible, aucune scène Traversal, aucune erreur JS. [Build](build.log), [garde production](production-gate.json).

## 13. Limites intentionnelles

Les récompenses des petits pickups restent locales à la prévisualisation ; obstacles sans dégâts persistants. Les combats QA utilisent le bouton de victoire existant pour contrôler handoffs et retours : ce travail ne valide pas leur équilibrage. Les contrôles ciblés utilisent une horloge déterministe et un handoff simplifié ; la vidéo et les trois parcours complets utilisent l’application réelle. Le rendu complet 3D n’est pas remplacé : ce travail conserve l’architecture HD-2D en sections peintes. Validation esthétique finale par l’opérateur avant promotion/versionnement.

## 14. Production désactivée

`TRAVERSAL_PRODUCTION_GATE.enabled = false`, `designAssetsReady = false`. Test de garde et vérification Chromium du build réussis. Aucune activation par URL en production.

## 15. T0 uniquement et autorités préservées

`rolloutLegIds = ['T0']`. Campaign Structure, RunSystem, Character V2, contenus/choix canoniques et schéma de sauvegarde inchangés. Aucun média déjà suivi dans Git modifié ; copies des quatre nouvelles scènes identiques à leurs sources générées. [Audit de préservation](preservation.json).

## 16. Versionnement

Travail laissé **non commité, non poussé** sur la branche et le commit demandés. Aucun fichier préexistant de QA hors de cette passe supprimé. Les nouveaux assets et preuves sont prêts pour revue visuelle.
