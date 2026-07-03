# Asset bible — sprites personnages

## Direction

Direction artistique cible : `Stylized Pixel Art Fantasy` pour personnages, intégrée à une présentation `Stylized Painted Tactical HD-2D`.

Le décor donne l’ambiance. Les unités portent le gameplay. Les sprites doivent donc rester lisibles, cohérents et hiérarchisés : héros uniques, ennemis anonymes réutilisables, élites plus détaillées, boss narratifs immédiatement reconnaissables.

## Règles de production verrouillées

- Aucun sprite expérimental ne doit être référencé par `src/render/assetManifest.ts`, `src/combat/legacyCombatRuntime.js` ou les compositions de combat tant qu’il n’a pas été validé sur une planche comparative.
- Les fichiers de travail vont dans `public/assets/characters/pixel/validation/`.
- Les fichiers rejetés vont dans `public/assets/characters/pixel/rejected/`.
- Les sprites runtime validés restent dans :
  - `public/assets/characters/pixel/full/`
  - `public/assets/characters/pixel/dialogue/`
  - `public/assets/characters/pixel/ui/`
- Toute génération hors sujet est rejetée immédiatement et ne doit pas être copiée dans les chemins runtime.

## Contrat technique

Chaque personnage validé doit fournir trois variantes PNG transparentes :

| Variante | Taille | Usage | Règles |
| --- | ---: | --- | --- |
| `full` | `640×768` | combat, management | plein pied, baseline stable |
| `dialogue` | `768×1024` | DialogueView | plein pied, marge latérale sûre |
| `ui` | `384×384` | timeline, chips, panels | sujet centré, non rogné |

Critères bloquants :

- aucun fond blanc ;
- aucun magenta résiduel ;
- coins transparents ;
- sujet non collé aux bords ;
- arme et effets contenus dans le canvas ;
- pieds alignés sur une baseline cohérente ;
- style compatible avec les héros déjà en jeu.

## Hiérarchie visuelle

### Héros et recrues

- `playable_hero`
- 12 à 15 unités uniques prévues pour le jeu complet.
- Aucune simple recolor.
- Silhouette, couleur signature et rôle mécanique distincts.
- Niveau de détail supérieur aux ennemis génériques.

Démo Phase du Lion :

- Alistair : chevalier protecteur, vert/acier/or.
- Marian : clerc blanc/or.
- Elara : mage bleu/cyan/or.
- Kestrel : archère mobile, vert/cuir.
- Cedric : éclaireur nomade optionnel, plus léger que Kestrel.

### Ennemis humanoïdes génériques

- `faction_enemy`
- Humanoïdes, pas monstres ni hybrides.
- Tête réellement couverte par casque, capuche, masque ou chapeau.
- Aucun visage identifiable.
- Silhouette réutilisable par recolor.
- Détail inférieur aux élites, mais qualité pixel art équivalente.

Serpent générique cible :

- `serpent_raider` : assassin/voleur léger, capuche + masque, dagues ou lame courte.
- `serpent_brute` : soldat lourd, casque fermé, masse ou hache.
- `serpent_oracle` : lanceur rituel, masque + robe, bâton.

Palette Serpent :

- vert sombre ;
- noir/acier noirci ;
- cuivre/orange ;
- petites touches poison si caster.

### Élites et sous-boss

- `rarity: elite`
- Plus détaillés que les génériques.
- Silhouette menaçante et individualisée.
- Peuvent porter des emblèmes, ornements ou poses plus expressives.
- Les sprites détaillés Serpent existants sont réservés à cette catégorie.

### Boss

- `category: boss`
- Unique, narratif, très lisible.
- Peut occuper `2×2` cases.
- Sprite combat supérieur à `2.5×` selon le profil.
- Ne doit jamais être une recolor de générique.

### Monstres

- `monster` ou `elite_monster`
- Séparés des factions humanoïdes.
- Loups, serpents, gobelins, squelettes, trolls, wyrms, morts-vivants.
- Les monstres ne remplacent pas les soldats de clan.

## Processus d’acceptation

1. Produire les candidats dans `public/assets/characters/pixel/validation/<lot>/`.
2. Générer une planche comparative avec :
   - héros actuels ;
   - élites/sous-boss ;
   - boss ;
   - nouveaux candidats génériques.
3. Vérifier les critères artistiques et techniques.
4. Promouvoir uniquement les candidats validés vers les dossiers runtime.
5. Mettre à jour le manifeste et les QC.
6. Exécuter `npm.cmd test` et `npm.cmd run build`.

## État actuel Serpent générique

Les trois Serpents génériques (`serpent_raider`, `serpent_brute`, `serpent_oracle`) sont en statut `pending_art_proxy`.

Cela signifie :

- ils peuvent avoir un proxy temporaire pour éviter de casser le jeu ;
- ils ne sont pas artistiquement validés ;
- tout nouveau candidat doit rester dans `validation/` tant que la planche comparative n’est pas approuvée.

