# P03 — proposition concrète de pilote continu10s

20octobre2026 ; run `codex-p03-pilot-proposal-20261020`, baseline dev6c5e7a86b8c813cdb53933d527c580850814c073. L'opérateur demande « next » après les poses corrigées. Cette suite prépare une demande précise de vidéo ; **aucune exception05, acceptation artistique des images ou soumission fournisseur n'est présumée**. L'ancienne [autorisation OD-2026-10-19-D](MANUAL_CAMP_CONTINUATION_OPERATOR_DECISION_2026-10-19.md) reste bornée au candidat04. Une question d'autorisation explicite du candidat05 a été présentée après préparation des éléments ci-dessous.

## Demande prête à examiner

- **Un seul candidat camp05**, sans remise à zéro des tentatives01–04, sans nouvelle série ou relance payante automatique.
- P03 uniquement, **10s continues**, MiniMax-H3,2K, ratio adaptatif ; caméra fixe durant tout le pilote, revue silencieuse à1×.
- [Image de départ : pose support-v3](../../tools/cinematics/candidates/manual-p03-20261020/p03-support-v3.png), SHA256 `0fd6533213c77bc5e95094fe254f8c7f9d64fec1a52e95d7a917dc9fe9e56068`.
- [Image d'arrivée : arrêt-v1](../../tools/cinematics/candidates/manual-p03-20261020/p03-stop-v1.png), SHA256 `63744ae86d599e80a78feb39fd6b1c9f07653d5a3b3ea5e81c61db023885ecfa`.
- [Prompt exact3765caractères](../../tools/cinematics/candidates/manual-p03-20261020/pilot-motion-prompt.txt), SHA256 `cc0abd436a2ad4377e383038c5ff6c5cccfb7da65f8f56d2928afcf510a66bbb` ; [proposition JSON non exécutable](../../tools/cinematics/candidates/manual-p03-20261020/pilot05-proposal.json) avec aperçu de la requête, sources et coût.
- Sortie future ignorée : `tmp/cinematics/cin4/production_manual_p03_20261020/shot_p03/candidate_05_raw.mp4`. Conserver le brut et ses métadonnées ; aucune promotion/remplacement de production.

**Estimation :1,30$US** pour10s à0,13$/s en2K ; les deux images restent dans le quota initial d'images non facturées annoncé. **Plafond demandé :1,50$US hors taxes**, un seul travail, pas d'ajout vidéo/audio payant. Solde, taxes et conditions propres au compte non consultés. Prix vérifié dans [la tarification officielle](https://platform.minimax.io/docs/pricing/overview) le20octobre2026 ; l'estimation n'est pas un débit effectué ni une garantie de tarif futur.

L'[API H3 actuelle](https://platform.minimax.io/docs/api-reference/video-generation-v2-create) documente les rôles `first_frame`/`last_frame`,2K et des durées entières4–15s. Le [guide officiel](https://platform.minimax.io/docs/guides/video-generation) documente un prompt≤7000caractères. Les deux PNG1672×941 sont sous les limites documentées. Aucune image, prompt ou clé n'a été envoyé à MiniMax dans cette préparation.

## Ce que l'outil existant doit encore permettre

Lecture de `tools/cinematics/minimax_h3_generate.mjs` et `minimax_task_checkpoint.mjs` : le runner valide déjà10s et2K, mais n'envoie qu'un `first_frame`. La garde rejette05 et lie l'exception04 à sa décision/durée12s/source/prompt/sortie. **Les deux fichiers et leurs tests n'ont pas été modifiés.** Ne pas lancer le runner en changeant l'ID de séquence ou en renumérotant05 en01/04.

Si autorisation explicite : ajustement borné du runner existant pour un `last_frame` optionnel, contrôles dimensions/SHA et reprise liée aux deux images ; exception manuelle05 exacte, liée à décision/prompts/sources/sortie/modèle/durée10s, jamais une augmentation du plafond autonome. Tous les refus existants doivent rester vrais ;06+ et05autonome refusés. Revue guardian de ce changement sensible de garde/validation et tests ciblés avant requête fournisseur. Réutiliser les chemins existants de polling/reprise/téléchargement, aucun nouveau SDK parallèle ou contournement de l'adaptateur.

L'option départ+arrivée vise la continuité des accessoires et l'arrêt ; elle ne garantit pas une marche juste. Des différences de décor entre images peuvent pousser le modèle à déformer le lieu : **refuser** cette déformation, ne pas l'accepter pour atteindre le dernier photogramme. Le comparateur de recadrages n'est pas une entrée vidéo ni une preuve de locomotion.

## Partition de revue

| Temps pilote | Critère observé séparément par acteur |
| --- | --- |
|0–1,4s | Préserver la phase d'appui v3, finir le premier pas par transfert réel ; départs décalés Alistair/Maelor/Marian. |
|1,4–7,8s | Au moins deux cycles complets chacun, contacts G-D-G-D-G ou inverse, pied chargé immobile relativement au sol proche ; bassin/genou/cheville cohérents. |
|7,8–9,6s | Foulée raccourcie, freinage par appuis, masse au-dessus du support puis second pied en équilibre. |
|9,6–10s | Racines stables, deux soles plantées, fin de tissus/respiration seulement ; pas de saut pour coller à l'arrivée. |

Livre fermé/main gauche et dague attachée de Maelor, bâton/main droite de Marian (levée avant translation, contact fixe quand posé), une épée/main droite d'Alistair hors sol/jambes/cape, identités V2 et pieds lisibles au-dessus des commandes. Aucun déplacement de caméra, coupe, flou, interpolation04, ralenti, translation globale du groupe, terrain qui glisse ou accessoire muté. Tout reste dans le camp avant la préparation dialoguée ; aucun franchissement, événement/canon/choix/gain ajouté.

Première lecture intégrale1× silencieuse, puis1× par acteur, ensuite seulement ralenti pour localiser un défaut. Toute case non observable reste NON ÉVALUABLE. Succès fournisseur/décodage n'est pas acceptation artistique. Pas de relance gratuite supposée après échec, crédit, temps limite ou qualité insuffisante : conserver tâche/brut/raison et demander une décision sur l'hypothèse suivante.

## État de préparation et prochaine action

**PROPOSAL_COMPLETE — VIDEO_SUBMISSION_NOT_AUTHORIZED.** Sources et prompt précis, coût/limites documentés ; aucune génération, polling, accès aux identifiants ou modification de garde. La prochaine action est la réponse opérateur à l'exception manuelle05 proposée. Un oui sur ce payload autoriserait un seul essai expérimental et la garde correspondante ; aucune acceptation artistique ni intégration finale n'en découlerait.

Conformité : set1.7.0 / baseline f4aae63 inchangée. Constitution/autorités/contrats/8slots/V6/canon/combat/audio préservés ; aucun source/public/MP4 modifié. Art/locomotion/raccords restent non observés ou en attente de verdict ; récurrence et scheduler inchangés. Matrice préparatoire du [dossier P03](CAMP_P03_REALIZATION_DOSSIER_2026-10-20.md) inchangée : PASS préservation, pas de nouveau verdict produit.339jobs/dispositions et anciennes preuves exacts. [Handoff](handoffs/2026-10-20T2200Z-codex-p03-pilot-proposal.md).
