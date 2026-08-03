# VFX-R3G-QA — Revue visuelle des compétences défectueuses

Date : 2026-08-01  
Portée : diagnostic visuel uniquement — aucun correctif runtime, gameplay, mapping ou PNG appliqué.

## Résumé exécutif

Les dix compétences prioritaires ont été vérifiées dans le rendu réel via le VFX Workbench de `?qa=1&vfx=1`, puis leurs spritesheets ont été découpées cellule par cellule sans filtrage GPU.

Le défaut dominant n'est pas une erreur générale de calcul UV. Les définitions observées utilisent toutes des feuilles RGBA `1280×1280`, une grille `5×5`, `25` frames et des cellules carrées `256×256`. La formule UV R3G, le `flipY`, le `ClampToEdgeWrapping`, l'absence de mipmaps et l'inset d'un demi-texel sont cohérents.

En revanche, plusieurs cellules sources contiennent déjà des fragments visuels au bord supérieur ou inférieur, parfois issus de la phase suivante de l'animation. Ces fragments sont donc **dans la cellule elle-même** : augmenter l'inset UV ne peut pas les supprimer. Les grandes échelles et le blending additif rendent ensuite ces défauts beaucoup plus visibles.

Résultat : cinq effets sont bloquants en l'état (`Tourbillon d'Acier`, `Déferlement du Lion`, `Rempart du Serment`, `Éclipse Dévorante`, `Météore Obscur`), un sixième est clairement incorrect (`Brise-Garde`), et trois compétences utilisent une sémantique visuelle inadaptée (`Charge`, `Interposition`, `Vague de Flammes`). `Frappe Consacrée` nécessite surtout un recalage d'ancrage et d'échelle.

## Méthode QA

1. Vérification des identifiants dans `skills.ts`, `skillPresentation.ts`, `VfxPresets.ts` et `VfxSpriteSheets.ts`.
2. Lancement du rendu réel dans `http://localhost:5173/?qa=1&vfx=1`.
3. Utilisation du VFX Workbench en mode **Combat** afin d'isoler chaque preset tout en conservant la caméra, les unités, les ancres et le pipeline runtime réels.
4. Capture d'une frame représentative pour les dix compétences ; quatre temps supplémentaires ont été capturés pour `Brise-Garde`.
5. Découpe locale des spritesheets en `25` cellules `256×256`, sans filtrage GPU, avec bord rouge lorsqu'un alpha opaque touche la limite de cellule.
6. Inspection du calcul UV, des paramètres texture, du pivot, de l'alignement, de l'échelle, de la durée, du blending et du `renderOrder`.

## Routes et écrans utilisés

- Route QA : `/?qa=1&vfx=1`
- Écran : **QA Combat**
- Outil : **VFX Workbench**, mode **Combat**
- Rendu : paramètres graphiques standards ; effets observés sur la grille et les cibles réelles.

## Correspondance vérifiée

| Compétence | actionId | presetId | spriteSheetId | PNG runtime |
|---|---|---|---|---|
| Brise-Garde | `w_break_guard` | `sword_slash` | `basic_sword_slash_heavy` | `white_basic_sword_slash_heavy_5x5_25f_1280.png` |
| Charge | `w_charge` | `blunt_impact` | `basic_hammer_crush_heavy` | `white_basic_hammer_crush_heavy_5x5_25f_1280.png` |
| Tourbillon d'Acier | `w_whirl` | `skill_wind_slash_swirl` | `skill_wind_slash_swirl_medium` | `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` |
| Déferlement du Lion | `w_lion_surge` | `ultimate_lion_surge` | `basic_execution_slash_heavy` | `white_basic_execution_slash_heavy_5x5_25f_1280.png` |
| Frappe Consacrée | `p_holy_strike` | `skill_holy_radiance` | `skill_holy_radiance_burst_heavy` | `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` |
| Interposition | `p_interpose` | `leap_impact` | `basic_body_slam_heavy` | `white_basic_body_slam_heavy_5x5_25f_1280.png` |
| Rempart du Serment | `p_oathwall` | `skill_oathwall` | `skill_barrier_guard_heavy` + `skill_barrier_shield_ring_medium` | `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` + `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` |
| Éclipse Dévorante | `d_devouring_eclipse` | `ultimate_devouring_eclipse` | `skill_void_singularity_implosion_ultimate` | `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` |
| Vague de Flammes | `n_flame_wave` | `skill_fire_impact` | `skill_fire_impact_burst_medium` | `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` |
| Météore Obscur | `n_dark_meteor` | `ultimate_dark_meteor` | `skill_meteor_impact_burst_heavy` | `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` |

## Preuves visuelles

### Rendu runtime

- [Brise-Garde — pic](evidence/vfx-r3g/01-brise-garde-peak.png) ; [t=0](evidence/vfx-r3g/01-brise-garde-t000.png), [t=60](evidence/vfx-r3g/01-brise-garde-t060.png), [t=120](evidence/vfx-r3g/01-brise-garde-t120.png), [t=180](evidence/vfx-r3g/01-brise-garde-t180.png)
- [Charge](evidence/vfx-r3g/02-charge-peak.png)
- [Tourbillon d'Acier](evidence/vfx-r3g/03-tourbillon-acier-peak.png)
- [Déferlement du Lion](evidence/vfx-r3g/04-deferlement-lion-peak.png)
- [Frappe Consacrée](evidence/vfx-r3g/05-frappe-consacree-peak.png)
- [Interposition](evidence/vfx-r3g/06-interposition-peak.png)
- [Rempart du Serment](evidence/vfx-r3g/07-rempart-serment-peak.png)
- [Éclipse Dévorante](evidence/vfx-r3g/08-eclipse-devorante-peak.png)
- [Vague de Flammes](evidence/vfx-r3g/09-vague-flammes-peak.png)
- [Météore Obscur](evidence/vfx-r3g/10-meteore-obscur-peak.png)

### Audit des cellules sources

- [Vue d'ensemble des spritesheets](evidence/vfx-r3g/sheet-audit/00-runtime-sheets-overview.png)
- [Brise-Garde — 25 frames](evidence/vfx-r3g/sheet-audit/brise-garde-frames.png)
- [Charge — 25 frames](evidence/vfx-r3g/sheet-audit/charge-frames.png)
- [Tourbillon — 25 frames](evidence/vfx-r3g/sheet-audit/tourbillon-acier-frames.png)
- [Déferlement — 25 frames](evidence/vfx-r3g/sheet-audit/deferlement-lion-frames.png)
- [Frappe Consacrée — 25 frames](evidence/vfx-r3g/sheet-audit/frappe-consacree-frames.png)
- [Interposition — 25 frames](evidence/vfx-r3g/sheet-audit/interposition-frames.png)
- [Rempart, garde — 25 frames](evidence/vfx-r3g/sheet-audit/rempart-garde-frames.png)
- [Rempart, anneau — 25 frames](evidence/vfx-r3g/sheet-audit/rempart-anneau-frames.png)
- [Éclipse — 25 frames](evidence/vfx-r3g/sheet-audit/eclipse-devorante-frames.png)
- [Vague de Flammes — 25 frames](evidence/vfx-r3g/sheet-audit/vague-flammes-frames.png)
- [Météore — 25 frames](evidence/vfx-r3g/sheet-audit/meteore-obscur-frames.png)
- [Mesures alpha/limites par frame](evidence/vfx-r3g/sheet-audit/sheet-analysis.json)

## Diagnostic par compétence

Codes de cause : **A** UV bleeding ; **B** formule UV ; **C** composition source incorrecte ; **D** métadonnées grille/aspect ; **E** mauvais preset ; **F** ancre/alignement ; **G** échelle amplificatrice ; **H** blending ; **I** timing ; **J** sémantique ; **K** acceptable.

| displayName | actionId | presetId | spriteSheetId | runtimePng | visualStatus | observedSymptoms | rootCauseHypothesis | confidence | evidence | recommendedFixType | recommendedFix | priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Brise-Garde | `w_break_guard` | `sword_slash` | `basic_sword_slash_heavy` | `white_basic_sword_slash_heavy_5x5_25f_1280.png` | bad slicing | Deux impacts blancs détachés apparaissent au même instant ; la seconde bande se trouve sous l'arc principal. | **C + G**. Les frames médianes contiennent déjà des fragments en bord inférieur ; l'échelle effective d'environ `2.28` les agrandit. Pas d'indice d'une formule UV globalement erronée. | Haute | [runtime t=60](evidence/vfx-r3g/01-brise-garde-t060.png), [frames](evidence/vfx-r3g/sheet-audit/brise-garde-frames.png) | asset-regeneration | Recomposer/repackager la feuille avec une action unique centrée et une marge transparente sûre par cellule ; conserver l'ID runtime, puis recalibrer l'échelle seulement après remplacement. | P1 |
| Charge | `w_charge` | `blunt_impact` | `basic_hammer_crush_heavy` | `white_basic_hammer_crush_heavy_5x5_25f_1280.png` | wrong preset | Explosion radiale blanche sur la tête/le torse de la cible ; aucune lecture directionnelle de charge ou de collision. | **E + F + J**. La feuille est un impact de marteau radial, techniquement lisible mais sémantiquement générique et ancrée trop haut pour cette action. | Haute | [runtime](evidence/vfx-r3g/02-charge-peak.png), [frames](evidence/vfx-r3g/sheet-audit/charge-frames.png) | needs-manual-review | Auditer les assets runtime directionnels disponibles et remapper vers un dash/impact orienté source→cible ; conserver un impact secondaire bref au point de collision. | P1 |
| Tourbillon d'Acier | `w_whirl` | `skill_wind_slash_swirl` | `skill_wind_slash_swirl_medium` | `cyan_skill_wind_slash_swirl_medium_5x5_25f_1280.png` | broken | Tourbillon cyan au-dessus de la cible accompagné d'un fragment séparé plus bas ; rupture nette de la silhouette de l'effet. | **C + G**. Plusieurs cellules médianes embarquent une seconde phase au bord inférieur ; l'échelle effective d'environ `3.36` rend la découpe flagrante. | Haute | [runtime](evidence/vfx-r3g/03-tourbillon-acier-peak.png), [frames](evidence/vfx-r3g/sheet-audit/tourbillon-acier-frames.png) | asset-regeneration | Régénérer/repacker un tourbillon contenu dans chaque cellule avec marge ; vérifier sa lecture circulaire autour de l'attaquant avant de rétablir une grande échelle. | P0 |
| Déferlement du Lion | `w_lion_surge` | `ultimate_lion_surge` | `basic_execution_slash_heavy` | `white_basic_execution_slash_heavy_5x5_25f_1280.png` | broken | Immense entaille diagonale dans la partie haute et seconde bande/impact détaché en bas ; l'ultimate couvre une très grande zone sans former un geste cohérent. | **C + G**. La feuille contient des débordements inter-phases dans les cellules ; l'échelle effective d'environ `4.66` transforme le défaut source en artefact majeur. | Haute | [runtime](evidence/vfx-r3g/04-deferlement-lion-peak.png), [frames](evidence/vfx-r3g/sheet-audit/deferlement-lion-frames.png) | asset-regeneration | Refaire la feuille avec cadrage d'ultimate et padding par frame ; conserver le grand impact, mais sans phase voisine dans la même cellule. Recalibrer ensuite l'échelle. | P0 |
| Frappe Consacrée | `p_holy_strike` | `skill_holy_radiance` | `skill_holy_radiance_burst_heavy` | `gold_skill_holy_radiance_burst_heavy_5x5_25f_1280.png` | bad placement | Le burst or/blanc est cohérent mais centré sur la tête/le haut du torse, avec une présence trop volumineuse pour une frappe 2 PA. | **F + G**, avec quelques contacts de bord source tardifs mais sans double cellule dominante dans le rendu observé. | Moyenne-haute | [runtime](evidence/vfx-r3g/05-frappe-consacree-peak.png), [frames](evidence/vfx-r3g/sheet-audit/frappe-consacree-frames.png) | preset-anchor-align | Descendre l'ancre vers le centre du corps/point d'impact et réduire légèrement l'échelle ; conserver la feuille tant que le QA animé ne révèle pas de fragment détaché. | P2 |
| Interposition | `p_interpose` | `leap_impact` | `basic_body_slam_heavy` | `white_basic_body_slam_heavy_5x5_25f_1280.png` | wrong preset | Explosion radiale massive au niveau tête/torse ; la compétence défensive de repositionnement se lit comme un coup offensif. | **E + F + J**, avec **C** secondaire sur plusieurs frames tardives qui touchent les bords. | Haute | [runtime](evidence/vfx-r3g/06-interposition-peak.png), [frames](evidence/vfx-r3g/sheet-audit/interposition-frames.png) | needs-manual-review | Remapper vers un déplacement protecteur/arrivée au sol plus discret, ancré aux pieds, puis réserver l'impact radial à une vraie attaque de saut. | P1 |
| Rempart du Serment | `p_oathwall` | `skill_oathwall` | `skill_barrier_guard_heavy` + `skill_barrier_shield_ring_medium` | `blue_skill_barrier_guard_heavy_5x5_25f_1280.png` + `green_skill_barrier_shield_ring_medium_5x5_25f_1280.png` | broken | Sphère protectrice lisible mais traversée par des bandes bleues horizontales aux extrémités ; impression de cellules superposées. | **C + G** sur la couche `guard`. L'anneau secondaire est globalement cohérent ; la feuille de garde contient des fragments de rangée suivante/précédente dans de nombreuses cellules. | Haute | [runtime](evidence/vfx-r3g/07-rempart-serment-peak.png), [garde](evidence/vfx-r3g/sheet-audit/rempart-garde-frames.png), [anneau](evidence/vfx-r3g/sheet-audit/rempart-anneau-frames.png) | replace-spritesheet | Remplacer ou repacker uniquement `skill_barrier_guard_heavy`; conserver l'anneau validable. Maintenir les IDs/metadata si la correction est pixel-only. | P0 |
| Éclipse Dévorante | `d_devouring_eclipse` | `ultimate_devouring_eclipse` | `skill_void_singularity_implosion_ultimate` | `purpleblack_skill_void_singularity_implosion_ultimate_5x5_25f_1280.png` | broken | Masse violette décentrée et fragment/smear au sol ; l'effet paraît scindé et sort largement de sa zone logique. | **C + F + G**, amplifié par **H**. La composition source déborde dans les cellules et l'échelle effective d'environ `6.48`, l'ancre basse et l'additif amplifient tout artefact. | Haute | [runtime](evidence/vfx-r3g/08-eclipse-devorante-peak.png), [frames](evidence/vfx-r3g/sheet-audit/eclipse-devorante-frames.png) | asset-regeneration | Régénérer/repacker l'implosion avec un centre stable et du padding ; ensuite réduire/repositionner l'ultimate et vérifier le blending, sans diminuer sa puissance visuelle globale. | P0 |
| Vague de Flammes | `n_flame_wave` | `skill_fire_impact` | `skill_fire_impact_burst_medium` | `orange_skill_fire_impact_burst_medium_5x5_25f_1280.png` | wrong preset | Le rendu est un projectile puis burst radial placé au-dessus de la cible, pas une vague ou un front de flammes. La feuille elle-même est largement cohérente. | **E + F + J**. Il s'agit d'un impact centré sur cible, alors que le nom et la zone attendent une lecture de ligne/cone/onde. | Haute | [runtime](evidence/vfx-r3g/09-vague-flammes-peak.png), [frames](evidence/vfx-r3g/sheet-audit/vague-flammes-frames.png) | needs-manual-review | Remapper vers un VFX de ligne/cone orienté dans l'axe de la compétence ; si aucun asset propre n'existe, réserver cette feuille à un projectile de feu et produire une vague dédiée. | P1 |
| Météore Obscur | `n_dark_meteor` | `ultimate_dark_meteor` | `skill_meteor_impact_burst_heavy` | `orange_skill_meteor_impact_burst_heavy_5x5_25f_1280.png` | broken | Grande bande de météore/feu séparée en haut de l'écran et impact massif en bas ; plusieurs phases semblent affichées dans la même frame. | **C + G**, puis **F**. Les cellules 5–24 contiennent des phases voisines en haut/bas et touchent fortement leurs limites ; l'échelle effective d'environ `4.48` expose ces fragments. | Haute | [runtime](evidence/vfx-r3g/10-meteore-obscur-peak.png), [frames](evidence/vfx-r3g/sheet-audit/meteore-obscur-frames.png) | asset-regeneration | Recréer/repacker la feuille pour qu'une seule phase existe par cellule avec marge. La descente et l'impact pourront ensuite être mis en scène comme plans séparés, sans changer la zone de dégâts. | P0 |

## Classification des causes racines

### C — Composition source incorrecte / cellules surchargées

Confirmé pour :

- `Brise-Garde`
- `Tourbillon d'Acier`
- `Déferlement du Lion`
- couche de garde de `Rempart du Serment`
- `Éclipse Dévorante`
- `Météore Obscur`

Le contact alpha avec une limite ne prouve pas à lui seul une cellule voisine, mais les planches extraites montrent ici des éléments visuellement distincts dans plusieurs cellules. Le défaut reste visible sans filtrage GPU.

### E/J — Mauvais preset ou mauvaise sémantique

Confirmé pour :

- `Charge` : impact radial sans mouvement directionnel.
- `Interposition` : body slam offensif pour une action protectrice.
- `Vague de Flammes` : burst local au lieu d'une vague/ligne/cone.

### F/G — Ancrage et échelle

- `Frappe Consacrée` : principal défaut ; correction ciblée possible sans nouvel asset immédiat.
- `Charge`, `Interposition`, `Vague de Flammes` : aggravent une sémantique déjà inadéquate.
- Tous les P0 : les grandes échelles rendent les erreurs source catastrophiques, mais les réduire seules ne corrigerait pas la composition.

### A/B/D — UV runtime ou métadonnées

- Aucun mismatch `rows`, `cols`, `frameCount` ou `frameAspect` n'a été trouvé.
- Aucun défaut global de formule UV n'est démontré.
- L'inset demi-texel R3G est cohérent pour empêcher un échantillonnage bilinéaire de la cellule voisine.
- Une augmentation arbitraire de l'inset rognerait les effets sans supprimer les fragments déjà présents dans les cellules.

## Correctifs recommandés

### Lot 1 — Assets bloquants

Priorité asset/repack avant tout réglage runtime :

1. `Météore Obscur`
2. `Éclipse Dévorante`
3. `Déferlement du Lion`
4. `Tourbillon d'Acier`
5. `Rempart du Serment` — couche `guard` seulement
6. `Brise-Garde`

Chaque cellule doit contenir une seule frame complète, centrée, avec marge alpha sûre sur les quatre côtés. Les IDs et chemins runtime peuvent rester stables si la feuille est corrigée en place après validation.

### Lot 2 — Remapping de présentation

Après audit des assets runtime propres :

- `Charge` → dash/impact directionnel source→cible.
- `Interposition` → déplacement protecteur + arrivée ancrée au sol.
- `Vague de Flammes` → ligne/cone/onde orientée.

### Lot 3 — Calibration légère

- Descendre et réduire légèrement `Frappe Consacrée`.
- Recalibrer échelle, ancre et blending des P0 uniquement après remplacement des feuilles.
- Rejouer les dix actions en mode normal et graphique réduit.

## Réponses aux questions de conclusion

1. **VFX réellement cassés après R3G** : `Tourbillon d'Acier`, `Déferlement du Lion`, `Rempart du Serment`, `Éclipse Dévorante`, `Météore Obscur`. `Brise-Garde` reste clairement incorrect mais moins catastrophique.
2. **VFX surtout à polir** : `Frappe Consacrée`.
3. **Problèmes d'ancrage/placement** : `Frappe Consacrée`; secondairement `Charge`, `Interposition`, `Vague de Flammes` et les ultimates surdimensionnés.
4. **Problèmes ressemblant à du slicing** : six feuilles présentent des fragments de cellule, mais le diagnostic dominant est **composition source C**, pas formule UV B.
5. **Assets à remplacer/régénérer** : les six feuilles du Lot 1 ; `Rempart` peut conserver son anneau secondaire.
6. **Effet de l'inset demi-texel R3G** : il est correct et a probablement supprimé le véritable bleeding bilinéaire à la frontière d'un texel, mais aucune comparaison avant/après ne permet de quantifier son gain. Il ne peut pas réparer les cellules sources déjà contaminées.
7. **Nouveau correctif UV runtime nécessaire** : non, pas sur la base des preuves actuelles. Un nouvel inset serait un contournement destructif et incomplet.
8. **Prochaine passe** : d'abord **asset regeneration/repack**, puis un petit lot Code mode ciblé pour les remappings et ancres. Ne pas lancer un nouveau refactor du système UV.

## Risques restants

- Une simple réduction d'échelle peut masquer partiellement les bandes sans corriger le défaut ; elle ne doit pas être considérée comme validation.
- Le blending additif peut réexposer de faibles résidus alpha après repack ; chaque nouvelle feuille doit être testée avec son blending final.
- Les planches statiques identifient les défauts de cellule, mais un QA animé complet reste requis pour valider le rythme, le fade et l'impact.
- Les remappings sémantiques doivent réutiliser un asset runtime validé ou passer par validation visuelle avant promotion.

## Sécurité gameplay

Cette passe n'a modifié ni gameplay, ni dégâts, ni PA, ni ciblage, ni IA, ni règles de combat, ni mapping VFX, ni PNG runtime. Seuls ce rapport et les fichiers de preuve diagnostique ont été ajoutés.
