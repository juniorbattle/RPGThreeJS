# Images finales par OpenAI, recrutement, archère — OD-2026-11-11-F

- **Date** : 2026-11-11 au soir (America/Toronto), soit le 2026-11-12 en UTC.
- **Source** :
  - Trois questions de l’opérateur après l’audit final : produire les images avec OpenAI « dans la même logique que ce que nous avons » ; recruter les héros sur la carte ou par une interface de mercenaires ; changer la couleur de l’archère, trop proche des unités du Serpent.
  - La fiche d’arbitrages remplie le même soir : https://claude.ai/artifact/Ciy1GbrdFxu3gB6unVekQy. Les trois choix suivent la recommandation. Ses réponses ont été relues comme des données.
- **Statut** : ACTIVE. Aucun contrat touché. Les images finales forment le lot séparé mené avec l’opérateur (WORLD_AND_CHARACTERS « Provisional images ») ; seule la manière de le produire change pour OD-2026-11-09-C.

## Décisions

`APPROVED DECISION`

| ID | Choix | Note de l’opérateur | Portée |
| --- | --- | --- | --- |
| F1 | Images finales par un script OpenAI dans le dépôt, piloté par Claude, avec un pilote de 6 images d’un seul plateau d’abord. | — | Briefs tirés des registres (`awaitedFinal`) et de la direction artistique, avec en références les images approuvées et les maîtres Character V2. L’opérateur lance le script avec sa propre clé, que Claude ne lit jamais ; le coût passe sur son compte OpenAI. Les sorties arrivent hors Git avec une planche de relecture, et seules les images acceptées sont intégrées. Remplace pour le lot des images finales l’exécution par Codex prévue par OD-2026-11-09-C ; Codex peut toujours y contribuer sur demande. |
| F2 | Recrutement : la rencontre sur la carte, plus une seconde chance au refuge. | « prend aussi en compte les 6 autres heros » | Un héros rencontré mais pas recruté peut être engagé plus tard au refuge contre de l’or, plus cher et aux mêmes conditions de réputation. La note vise les six héros présents dans les données mais jamais recrutables : Aldric (Paladin), Morvan (Chevalier Noir), Lyra (Mage Rouge), Eldwin (Enchanteur), Talon (Ninja), Gunnar (Artilleur). Leur rencontre est à créer : c’est du canon, donc chaque scène sera soumise à l’opérateur. |
| F3 | L’archère Kestrel passe au bleu nuit. | — | Recoloration de son vert en bleu nuit sur son maître pixel, ses sprites et poses de combat, puis dans le brief de ses images finales. Le bleu nuit figure déjà dans sa palette d’identité (`assetManifest.ts`). |
