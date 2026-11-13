# Musique propre à chaque partie du jeu — décision de l’opérateur (2026-11-13)

Statut : `APPROVED DECISION`. Décision prise dans la session « Identité musicale des plateaux », appliquée aux contrats par la tâche dédiée `PRODUCTION-CONTRACTS-PLATEAU-MUSIC-1` (jeu de contrats 1.23.0). Le brouillon validé est `docs/content/drafts/PLATEAU_MUSIC_DRAFT_2026-11-13.md` ; le rapport des esquisses, `docs/reports/plateau-music-2026-11-13.md`.

## OD-2026-11-13-E — Musique propre à chaque partie

**Demande de l’opérateur** : « on va travailler l’ambiance sonore et la musique pour chaque plateau, cela donne une identité propre à chaque partie du jeu ».

**Réponse de l’opérateur au brouillon** : « J’écoute et je valide ». Le brouillon est validé tel quel ; chaque question prend sa recommandation :
- 1 A : l’amendement 1.23.0 tel que rédigé, puis le branchement d’une ligne (`PLATEAU_MUSIC_IN_GAME = true`) ;
- 2 : les quatre identités telles qu’écrites (l’Ours, le Dragon, le Scorpion, l’acte final ; le Lion inchangé) ;
- 3 A : les mesures à cinq et à sept gardées en combat ;
- 4 A et 5 A : les fanfares de victoire et de défaite, et le titre, communs à tout le jeu ;
- 6 A : le Tournoi pour les combats de l’arène seulement, la Brèche partout ailleurs dans l’acte final ;
- 7 A : les entrées musicales seules pour les signatures de boss ; l’option B n’est pas retenue ;
- 8 A : le motif de l’entité dans le pont de la piste de la brèche, sur les deux niveaux ;
- 9 A : les chefs secondaires prennent l’entrée générale de leur partie ;
- 10 A : les ambiances de carte et de refuge restent communes ;
- 11 : les timbres tels quels, à retoucher un par un si l’un ne convainc pas en jeu.

**Sans l’option B (7 A).** Aucune puce n’est ajoutée à `COMBAT_AND_VFX`, et le `README` des contrats ne mentionne pas l’option B. La table fermée des sons reste à 158 identités sur 160. Les signatures des six boss de l’après-démo restent des entrées musicales, dans leur partie : Borin, Kaelen, le Grand Inquisiteur, le Prophète des Ombres et Maelor ; l’entité vit dans le pont de la brèche.

## Amendement 1.23.0

`APPROVED DECISION`, texte approuvé tel que rédigé dans le brouillon (lignes 53 à 67), sans l’option B. Relu sur le diff réel par contracts-guardian le 2026-11-13 avant le commit : PASS WITH WARNINGS, aucun changement de fond. Le texte est appliqué mot pour mot ; seule la décision est nommée, l’option B retirée du `README`, et le paragraphe de preuves placé sous son propre titre comme les autres tâches dédiées. Seule correction reprise : le `supersededRule` du manifeste nomme la phrase du set 1.20.0 qui est remplacée. La revue garde la redite de la phrase sur l’humeur, qui vient du texte approuvé. Documents touchés :
- `docs/contracts/PRESENTATION_AND_MEDIA.md` : la puce « Music » de « Post-demo moments » ;
- `docs/contracts/AUTHORING_AND_QA.md` : un paragraphe de preuves, après « Audio direction evidence » ;
- `docs/contracts/README.md` et `docs/contracts/contracts.manifest.json` : l’entrée 1.23.0 et ses métadonnées.

La Constitution ne change pas.

**Ordre.** Relecture indépendante du diff réel, commit d’amendement, puis commit opérationnel qui inscrit son SHA comme baseline immuable. Ensuite seulement, le jeu demande les pistes des plateaux : `PLATEAU_MUSIC_IN_GAME = true` dans `src/audio/music/parts.ts`, puis une vérification dans le navigateur avec un vrai geste, une carte, un dialogue, un combat et un boss de chaque partie.

**Ce qui ne change pas.** Les neuf contextes musicaux, toutes les autres règles de la direction audio (set 1.12.0), la table fermée des sons, les ambiances, les sauvegardes et la vérité de jeu. Les pistes du Lion restent identiques à l’octet, vérifiées par un test d’empreinte. Ni voix, ni son enregistré ou généré par IA.

**Acceptation.** L’acceptation artistique reste à l’opérateur, par l’écoute, partie par partie. Aucune mesure ni l’existence du laboratoire d’écoute ne vaut acceptation.
