# Audience d'Alaric — candidat illustré hors runtime

Run `codex-illustrated-audience-20261021T1754Z`; source `ab6a45fb60b3d80b2dc298e38fb354ff051302b5`, branche `dev`. Autorisations OD-2026-10-21-A/B, contrats1.8.0. Art final et intégration non acceptés.

## Frontière vérifiée avant génération

- `src/cinematics/Cin6aPresentation.ts:17` associe `beforeDialogue lion_briefing` à `alaric_audience_arrival`.
- `src/campaign/LionCampaignStructure.ts:92` définit `lion-audience`, famille `ALARIC_AUDIENCE`, quatre acteurs requis : Alaric, Alistair, Sage Séraphine, Maelor.
- `src/game/content.ts:294` ouvre `lion_briefing` : le mandat Bois-Clair commence au premier texte d'Alaric. Les choix de l'étape3 accordent acceptation, réputation et éventuellement60or. Aucun de ces faits ne peut apparaître dans le montage préalable.
- Références inspectées : salle `demo-environment-pack-v1/cinematic-source/alaric-audience-cinematic-source.png`, quatre masters V2 dans `public/assets/characters/pixel/masters/`. La salle est intacte, éclairée par fenêtres dorées/bougies, trône à droite. V2 impose casque/épée/bâton d'Alaric, armure/cape rouge/épée basse d'Alistair, voile/bâton-lanterne de Séraphine, capuche violette/livre tenu/dague de Maelor.

## Progression causale proposée — six illustrations, vingt secondes

1. **La distance de l'audience (4s)** : plan large, délégation déjà dans la salle à gauche, Alaric debout près du trône à droite. Rend lisibles lieu, axe et distance sociale, sans jouer un trajet.
2. **S'arrêter devant le Lion (3s)** : plan moyen de la délégation à son emplacement d'écoute ; Alistair stabilise son épée basse. L'approche se termine, aucune marche continue revendiquée.
3. **Le livre ramené contre soi (3s)** : Maelor cale son livre existant contre le torse, regard vers Alaric ; Séraphine présente en second plan. Le groupe se rend disponible, aucun document transmis.
4. **Une attention commune (3s)** : Séraphine tient son bâton immobile et tourne son attention vers Alaric ; Alistair suit le même axe. Le geste précédent aboutit à une écoute partagée.
5. **Alaric se tourne vers eux (3s)** : plan moyen de l'autorité, debout, mains toujours occupées par son équipement V2 ; regard orienté vers la délégation. Reconnaissance de présence seulement, aucun salut, ordre, récompense ou jugement.
6. **Avant la première parole (4s)** : retour large rapproché, quatre acteurs arrêtés face à face, mêmes places/objets/lumière. Le dernier plan raccorde au tableau avant `lion_briefing:1`, sans prononcer ni illustrer le mandat.

Chaque image est intégrée, distincte, lisible sans sa légende. Fondus de l'image entière, pauses, aucune translation/zoom artificiel. Les positions gauche/droite et les mains portant chaque objet doivent rester cohérentes. Deux corrections ciblées maximum ; aucune image verte régénérée.
