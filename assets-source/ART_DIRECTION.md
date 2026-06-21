# Direction artistique — forêt painterly

La forêt de référence combine une structure 3D tactique avec un habillage peint.
La géométrie reste responsable des silhouettes, des collisions, de la lumière et
des changements de caméra. Les images générées servent de concepts et de
matières, jamais de panneau représentant tout le décor.

## Cible

- Référence : `concepts/forest-arena-painterly-target.png`.
- Formes rondes, asymétriques et lisibles depuis la caméra tactique.
- Grandes masses de couleur avant les petits détails.
- Ombres froides bleu-vert et lumière chaude.
- Grille perceptible, mais intégrée au terrain.
- Aucun détail décoratif ne doit masquer une unité ou une zone d’effet.

## Matières générées

Les sources haute résolution se trouvent dans `textures/forest-kit`.
Les versions WebP 512 px destinées au runtime sont dans
`public/assets/3d/forest-kit/materials`.

- `grass`: herbe et mousse en aplats peints.
- `stone`: pierre froide, fissures souples et mousse.
- `bark`: rythme vertical chaud pour troncs et bois.
- `foliage`: masses de feuilles sombres avec accents lumineux.

Ces quatre images ont été produites avec la génération d’images intégrée, puis
redimensionnées et converties localement en WebP. Les prompts demandent une
texture orthographique sans perspective, sans texte, sans lumière directionnelle
et sans détail photographique.

## Contrat de production

1. Concept 2D validé.
2. Blockout et silhouettes dans Blender.
3. UV simples et matériaux partagés.
4. Habillage peint ou projection assistée à partir des passes Blender.
5. Nettoyage des raccords et cuisson.
6. Export GLB, textures WebP/KTX2 et validation dans Three.js.
7. Contrôle aux angles tactiques et cinématiques.

Le runtime doit conserver un mode réduit sans animation secondaire, bloom fort
ni ombres provenant des éléments lointains.
