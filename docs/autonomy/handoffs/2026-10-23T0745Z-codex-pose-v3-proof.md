# Bois-Clair v3 : preuve livrée, verdict artistique attendu

Run codex-pose-v3-proof-20261023T0745Z. Début UTC2026-10-23T07:45:51Z ; checkpoint2026-10-23T08:05:51.835Z. Base dev95bc2a228b0b50e100a6edfcc617731d2efbdf98 ; main00b96f1b502539618790b1c0d8d642f86d3dcf7f.

## Reprise et préservation

L'ancienne session codex-pose-pilot-20261023T0425Z est en systemError. Son heartbeat05:04 dépassait105min ; audit CIM hôte sans worker Git/build/QA associé. Verrou archivé, nouveau verrou acquis atomiquement. Les24chemins non committés ont été préservés exactement dans le snapshot32ac8034067b21dfca7a8917a9e18ed30bd154e4, publié normalement avant reprise. Aucun reset/clean/checkout. Le serveur de revue21636/5461 et le preview5438 restent disponibles.

## Résultat concret

La v3 héritée réutilise ses sept images/24s sans génération : trois coupes et trois fondus entiers1/1/0.8s. Le driver v2 est repris dans une version séparée, adaptée aux médias/durées/transitions propres. Un scénario, trois tentatives : Chromium inaccessible dans le sandbox avant ouverture ; nouvelle assertion d'opacité trop précise pour un curseur arrondi0.1s ; une correction minimale borne le smoothstep à±0.05s, puis PASS11. Toutes les assertions héritées restent présentes. Reçus échoués, ancien driver et options sont conservés.

[Lecteur v3](../../../tools/cinematics/candidates/illustrated-sequences/bois_clair_sacrificed/v3/index.html) · [Comparaison v1](../../../tools/cinematics/candidates/illustrated-sequences/bois_clair_sacrificed/v3/index.html?historical=1) · [Revue](../../../tools/cinematics/candidates/illustrated-sequences/bois_clair_sacrificed/v3/review.md) · [Clôture et SHA](../../../tools/cinematics/candidates/illustrated-sequences/bois_clair_sacrificed/v3/review-closeout.json).

Le reçu brut est SUCCEEDED/NOT_ACCEPTED. La clôture distincte constate provenance/source/driver/reader/médias/paramètres/digest éligibles.11contrôles : chronologie normale24s, six frontières,3coupes+3fondus, chargement/ordre, pause horloge+opacité non nulle/reprise sousOSreduce, clavier/fin, contain/44px et bornes1366/620/390, console, fallback image07. La v1 exacte est lue18s sans légendes dans ce même scénario. Aucune acceptation v2 transférée.

Les sept images et six paires ont été inspectées ainsi que les captures des fondus normaux/final/narrow/pauseOS. Le repli puis l'attention de Maelor et la fermeture protectrice de la Villageoise sont plus lisibles que les poses proches de la v1. Le fondu04→05 superpose davantage bras/livre/tête ; le gant droit reste près du fourreau. Petites variations de plis/sol/appuis/échelle finale explicites. Aucun dégainage, offre, don, départ, choix futur, culpabilité canonique ou mouvement corporel continu affirmé. Les observationsIAB demandées jusqu'à la fin utilisentOSreduce ; le scénario enregistré porte la temporalité normale exacte.

## Statuts et prochaine action

**GENERATED / TECHNICALLY_VERIFIED / ART_REVIEW_PENDING / READY_FOR_OPERATOR_REVIEW**. Acceptation de la méthode PENDING, généralisationfalse, runtimeNOT_ADOPTED. Guardian : PASS_V3_TECHNICAL_AND_PRESERVATION_SCOPED et PASS_CLOSEOUT_METADATA_SCOPED. HTML testé conservé ; seul le texte de statut du footer livré est actualisé, inversion exacte et SHA testés/livrés enregistrés. Lecteur/séquence/images inchangés après preuve.

**Attendre le verdict artistique explicite opérateur sur les images ET le montage/méthode bois_clair_sacrificed/v3. Sans nouveau verdict, préserver le checkpoint sans génération, QA ou synthèse répétée. Les six autres scènes restent verrouillées ; aucun changement du scheduler.**

## Vérifications et compteurs

63tests ciblés (CIN6a39 + lionFinale24), TypeScript, contracts8/8, barrièresGitLOCKED vides et diffcheck PASS. Aucun build/campagne entière rejoué pour offline. Les357jobs/acceptations historiques, file historique, v1/v2/camp/readers/src/public/contrats et réglages scheduler sont préservés ;360jobs au total. Scheduler ACTIVE/xhigh/90min, SHA4c39ebf8a7dba98ccc1cf0c16356acf55c1278c5a58544687d137cd102252433.

0source runtime/0imagegen/0nouveau média ;18fichiersQA/preuves ajoutés ;3métadonnées candidat modifiées ;5chemins workflow ;24WIPhérités ;44chemins sélectionnés pour publication. La règle .gitattributes est bornée àv3 et conserve les octets des reçus SHA. Pas dePR/main/force/vidéo/keyframe/MiniMax/MP4/audio. Art/PCglobal/balance/matériel/audio/mobile aprèsPC restent ouverts.

| Contrôle | Verdict et portée |
| --- | --- |
| GAME_CONSTITUTION | PASS : candidat offline, aucun propriétaire de vérité changé |
| ART_DIRECTION / CHARACTERS / ENVIRONMENTS | PASS préservation, deux acteursV2 et lieu détruit ; art en attente |
| NARRATIVE_CAMPAIGN / NARRATIVE_PRESENTATION | PASS : après victoire village_raid/missionGreed, avant dialogue1/provisions |
| SAVE | PASS préservation, aucune donnée durable/transitoire ajoutée |
| UI_ACCESSIBILITY / QA_EVIDENCE | PASS technique propre, échecs et reçus historiques préservés |
| REPOSITORY_GOVERNANCE | PASS : publication normale dev, byte-preservation et barrières vides |
| TRAVERSAL / COMBAT | N/A, inchangés |

Constitution,index,manifest,AUTONOMOUS_WORK_PROTOCOL,WORLD_AND_CHARACTERS,CAMPAIGN_AND_STATE,PRESENTATION_AND_MEDIA,UI_AND_ACCESSIBILITY,AUTHORING_AND_QA lus. Set1.9.0 ; baseline immuable32c8439f6dea1d09f428c5c081392ab0c700e356. Aucune règleLOCKED changée.

Publication vérifiée : livraison1c0c0f72b0e6792db7b8bfc77b3eca22b24ef16f sur origin/dev ; main inchangé. Les40blobsv3 correspondent aux octets revus, y compris CRLF conservé par la règle locale. RunEndedAt2026-10-23T08:09:54.234Z ; aucun WIP produit restant. Le commit de clôture suivant ne modifie que l'étatMD/JSON et ce handoff. Après sa publication, supprimer uniquement la brancheWIP propre et libérer le verrou possédé.
