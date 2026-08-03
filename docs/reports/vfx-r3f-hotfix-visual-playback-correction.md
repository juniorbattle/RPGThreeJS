# VFX-R3F-HOTFIX — Visual Playback Correction

## Résultat

Le faux effet de « spritesheet qui monte » est corrigé sans modifier les PNG ni
les règles de combat. L’ordre des 25 frames et `flipY` étaient corrects. Le
déplacement visible venait surtout de l’alignement bas simulé par un décalage Y
fixe alors que le sprite changeait d’échelle : le bord inférieur se déplaçait
pendant le pulse.

Le runtime utilise maintenant le vrai pivot de `THREE.Sprite` :

- `center = (0.5, 0)` pour les effets `align: bottom` ;
- `center = (0.5, 0.5)` pour les effets centrés ;
- la position reste exactement sur l’ancre pendant le pulse ;
- le même principe est appliqué aux billboards et aux descentes célestes ;
- les projectiles conservent leur pivot centré et leur orientation dynamique.

## Diagnostic par catégorie

| Catégorie | Résultat | Conclusion |
|---|---|---|
| A — ordre UV | Correct | Lecture row-major : 0 haut-gauche, 4 haut-droite, 5 ligne 2 colonne 1, 24 bas-droite. |
| B — `flipY` / GPU | Correct | `flipY = true` est désormais un invariant nommé et testé. |
| C — mouvement dans les frames | Présent sur certains effets | La dissipation verticale de fin est intentionnelle ; aucun PNG n’a été retouché. |
| D — ancre / alignement | Cause principale | Le faux pivot basé sur un offset Y ne compensait pas le changement d’échelle. |
| E — timing | Conforme | Les durées R3F permettent une lecture suffisante des 25 frames. |
| F — pulse d’échelle | Facteur amplificateur | Le pulse révélait le défaut d’ancrage, sans être lui-même incorrect. |
| G — combinaison | Cause observée | D + F, avec parfois une dissipation C, produisaient l’impression de défilement. |

## Contrôle des contenus alpha

Les centroïdes alpha ont été mesurés sur les candidats critiques. Certains
contenus se dissipent naturellement vers le haut entre leur frame de pic et leur
dernière frame (`generic_hit`, `arrow_shot`, `boss_slam`,
`boss_apocalypse_v2`, `ultimate_silent_assassin`). Les effets feu, soin, vide
et météore restent plus stables. Ce mouvement appartient aux images et ne
justifie pas une inversion d’UV ou un changement global de `flipY`.

## Fichiers modifiés

- `src/combat/vfx/VfxSpriteSheets.ts`
  - invariant explicite `VFX_SPRITE_SHEET_FLIP_Y` ;
  - helper pur `getVfxSpriteSheetFrameUv()` ;
  - lecture des frames centralisée.
- `src/combat/vfx/VfxSystem.ts`
  - helper `configureVfxSpriteSheetPivot()` ;
  - vrai pivot bas pour billboard et sky-descent ;
  - suppression des offsets Y artificiels.
- `src/combat/vfx/VfxSpriteSheets.test.ts`
  - mapping exact des frames 0, 4, 5 et 24 ;
  - invariant `flipY` et UV vérifiés.
- `src/combat/vfx/VfxR3F.test.ts`
  - baseline indépendante du pulse d’échelle ;
  - pivot centré inchangé pour les autres effets.

Aucun PNG, manifeste, preset, mapping de compétence ou fichier de gameplay n’a
été modifié.

## QA visuelle

Le VFX Workbench (`?qa=1&vfx=1`) a servi à rejouer :

- impact générique ;
- trait précis ;
- impact de flamme ;
- floraison réparatrice ;
- rune du vide ;
- météore noir ;
- écrasement colossal ;
- champ apocalypse ;
- assassin silencieux.

Les effets restent attachés à leur ancre pendant le pulse. Les changements de
forme internes aux frames restent visibles sans déplacement du billboard. Les
effets lourds disparaissent correctement, aucune plane ne reste bloquée, et le
mode graphique réduit conserve le rendu principal.

## Sécurité

- Aucun changement de dégâts, PA/AP, ciblage, IA, statut, déplacement ou caméra.
- Aucun changement de texture source ou de manifeste runtime.
- Les projectiles et autres effets directionnels conservent leur rotation.
- Le correctif fonctionne avec les multiplicateurs de taille des boss 2×2.

## Validation

Commandes finales :

```powershell
npm.cmd test
npm.cmd run build
git diff --check
git status --short
```
