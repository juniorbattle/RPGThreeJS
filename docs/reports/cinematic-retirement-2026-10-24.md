# Retrait des vidéos et continuation statique

TASK: CINEMATIC-RETIREMENT-AND-STATIC-NARRATIVE
DOMAIN: présentation, média, Journey
BASELINE: 7fc1a63cfd1ef52ba69fcd752e5b1d4cec5563a1 / dev
BRANCH: dev
HEAD: ed401c1371be6bb79c8038bb0ef9997930756144 (tested source; metadata-only closure recorded in Git)
STATUS: HISTORICAL — retrait implémenté et vérifié dans la portée déclarée
MERGED_IN: NONE
SUPERSEDES: NONE — nouvelles règles OD-2026-10-24-A, preuves anciennes conservées
SUPERSEDED_BY: NONE
PRODUCTION_IMPACT: zéro vidéo active ou distribuée ; dialogues/tableaux existants conservent les huit moments
CANONICAL_DOCS_UPDATED: décision OD24-A, constitution/contrats set1.10.0, AGENTS/skills, plan démo, PC_PLAYTEST, plan statique et états/handoff
EVIDENCE: cinematic-retirement-2026-10-24/provenance.json, results.json, qa-job.json, driver-reviewed.mjs et cinq captures inspectées

APPROVED DECISION : l’opérateur abandonne les cinématiques, confirme retirer aussi les vidéos du jeu et prévoit une optimisation des dialogues statiques/NarrativeStage. Amendement indépendant PASS_AMENDMENT_ACTUAL_DIFF, commit da69ec63bff1bc35f4b2b03feffe94cbd9cad0d5 ; baseline enregistrée ensuite dans eb3d3d0d8f37c0dea14088e17b77f9a2ae3ded27 avant runtime.

CURRENT FACT : huit fichiers MP4 et manifeste archivés byte-identiquement dans `tools/cinematics/archive/production-videos-2026-10-24/`, avec SHA et matrice des références. Zéro descripteur public, allowlist active vide, huit IDs historiques. Les huit médias et cinq holds vidéo deviennent STATIC_TABLEAU dans le registre147beats généré ; texte et phases de dialogue, campagne, combat, ressources et V6 inchangés. Anciennes URL vidéo forcées en STILL. Cache public et injection de descripteur ne peuvent jouer/précharger en production. Les gardes existantes évitent un interlude vide ; dialogues et conséquences restent dans leur ordre canonique.

Vérification mécanique :176/176tests ciblés sur14fichiers ; TypeScript/build PASS ; staging75/75dialogues et282/282étapes de présentation runtime ; contrats8LOCKED/8IDs historiques/0vidéo-hold-précharge-fichier vidéo public, archives SHA PASS ; dist0MP4/WebM. Barrière LOCKED vide contre da69ec63 et diff whitespace PASS. Le build conserve son avertissement de taille des chunks.

Les premiers appels vitest incluaient involontairement des copies de baseline sous tmp ; relance limitée au source avec `--exclude tmp/**`. Les attentes vidéo désormais obsolètes ont été actualisées, sans modification des anciennes preuves. Les tests des helpers hold/vidéo gardent leurs assertions sur des fixtures DEV explicitement historiques. Une erreur Windows UNKNOWN/open du générateur a motivé sa seule correction d’écriture atomique temp→rename ; registre exclusivement régénéré, jamais édité à la main.

Le runner existant `run_cin6d6_route_browser_qa.mjs` possède un mode de retrait restreint au seul parcours natif ouverture→camp→audience, avec reprise des champs campagne observés, choix clavier et changement OS réduit en cours de scène. Nouvelle observation : aucune création/insertion/load/play vidéo ou requête MP4/WebM ; anciens contrôles cast≤4, surface unique, transitions, choix, vérité et console conservés. L’intégration du reçu qa-job assure l’identité source/driver/build de ce nouveau scénario. Aucune matrice complète ou autre campagne rejouée.

Scheduler officiel : prompt aligné sur le retrait et le plan statique ; PAUSED/90min/modèle/xhigh/projet/local et tous autres réglages strictement conservés hors prompt/updated_at. Le service supprime uniquement le LF final du prompt canonique. Les362jobs/acceptations hérités sont identiques ; candidats illustrés/manuels, bruts, lecteurs et preuves restent historiques.

PROPOSED FUTURE DESIGN : première passe visuelle `village_raid_aftermath`, selon `STATIC_NARRATIVE_FINISHING_PLAN_2026-10-24.md` : relations et destinataires clairs, Maelor/habitante distincts, facing stable, objets et contexte détruit cohérents, poses V2 existantes. Cette passe est planifiée ; elle n’est pas certifiée par le retrait technique. Aucune chorégraphie du pilote abandonné n’est ajoutée au canon. Acceptation artistique/global PC/équilibre/confort matériel opérateur ; mobile après PC.

CURRENT FACT — clôture native : un scénario production corrigé SUCCEEDED/provenanceStable, source ed401c13. Nouvelle partie sans état/outcome injecté, trois dialogues, accès audience par marqueur POI reachable/focus/Enter puis move natif, choix mission au clavier. Quatre acteurs/une surface au camp et à l’audience, choix79px dans le viewport, EXIT/BREATH/ENTRY4→2→4≈439ms, aucun event vidéo créé/monté/load/play, élément ou requête vidéo. OSfalse→true/gamefalse conserve surface/cast et sauvegarde brute lors de la bascule. Après reload, seuls currentNodeId/resolvedNodeIds/flags/endingId/memberDefinitions sont comparés identiques ; aucune nouvelle preuve d’égalité brute V6/inventaire/or au reload. Console/page/network erreurs0.

Le premier lancement sandbox n’avait aucun navigateur dans son chemin isolé et n’a joué aucune étape. Le premier scénario hôte conservait l’ancienne attente Journey, devenue périmée depuis la navigation POI ; reçu FAILED retenu. Une seule correction minimale du harness utilise les commandes POI existantes dans le mode retrait, conserve la branche historique et ajoute les vérifications natives de focus/sélection/résolution. Le même scénario corrigé est vert ; aucune autre route rejouée.365jobs au total,362hérités/acceptations deepEqual,3nouveaux dont2FAILED/NOT_ACCEPTED conservés et1SUCCEEDED revu scoped. Port5463 libéré ; anciens aperçus intacts.

La règle Git -text du manifeste archivé et des preuves protège leurs octets contre autocrlf ; tous9SHAs d’archives sont vérifiés aussi dans les blobs commités. La preuve promue contient les octets exacts du driver exécuté, reçu/résultat et cinq captures avec SHA. Le reçu brut conserve SUCCEEDED/NOT_ACCEPTED ; le registre courant porte l’acceptation technique scoped après inspection indépendante. [Camp](cinematic-retirement-2026-10-24/opening-camp.png), [audience](cinematic-retirement-2026-10-24/opening-audience.png), [choix](cinematic-retirement-2026-10-24/opening-camp-audience-lion_briefing-3-choices.png). La capture avant bascule OS montre volontairement une révélation partielle de texte ; elle ne prouve pas un texte complet.

Revue indépendante : PASS_TECHNIQUE_RETRAIT_SCOPE. Barrières LOCKED baseline→HEAD et statut protégés vides après amendement.

| Domaine | Verdict | Limite/preuve |
| --- | --- | --- |
| GAME_CONSTITUTION | PASS | OD24-A/set1.10.0 retrait dédié |
| ART_DIRECTION | PASS | Aucun remaster/acceptation nouvelle |
| CHARACTERS | PASS | V2 et quatre acteurs visibles |
| ENVIRONMENTS | PASS | Décors existants et archives conservés |
| NARRATIVE / CAMPAIGN | PASS |147IDs, choix, textes et propriétaires préservés |
| NARRATIVE_PRESENTATION | PASS |0vidéo/hold vidéo/précharge, tableaux existants |
| TRAVERSAL | N/A | Définitivement retiré, aucun changement |
| COMBAT | N/A | Résolution inchangée |
| SAVE | PASS | Champs observés stables au reload ; pas de V6 globale déduite |
| UI / ACCESSIBILITY | PASS | Clavier/focus/choix79px/OS observés |
| QA_EVIDENCE | PASS | Source/driver/build/digest et5captures vérifiés |
| REPOSITORY_GOVERNANCE | PASS |9archivesSHA,362QApréservées,gates/publication dev |
