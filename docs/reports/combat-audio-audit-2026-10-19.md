# Audit approfondi de la couverture sonore

| Field | Value |
| --- | --- |
| TASK | DEEP-COMBAT-AUDIO-AUDIT |
| DOMAIN | Audio, combat, UI, campagne |
| BASELINE | `c01112e995a8e1641e8b11c8e1841fe9326caa72` sur `dev` |
| BRANCH | `dev` |
| HEAD | Commit contenant ce rapport ; aucun changement runtime |
| STATUS | REVIEWED_SOURCE_AUDIT_COMPLETE ; intégration combat à réaliser |
| MERGED_IN | NONE ; publication directe autorisée sur dev |
| SUPERSEDES | NONE ; complète l'inventaire UI précédent sans réécrire son acceptation |
| SUPERSEDED_BY | NONE |
| PRODUCTION_IMPACT | NONE ; audit et proposition uniquement |
| CANONICAL_DOCS_UPDATED | État/handoff et index opérateur ; aucune doctrine audio ni contrat modifié |
| EVIDENCE | Inventaire des propriétaires et handlers à la baseline ci-dessus ; revue indépendante contracts-guardian ; aucun nouveau gameplay ou test d'écoute revendiqué |

## Demande opérateur — OD-2026-10-19-A

APPROVED DECISION : « il manque toout de meme quelques emplacement on a pas de sons : dans notre combat par exemple il faut faire un audit pousse ». Autorisation de réaliser cet audit et de préparer un lot concret. Cette demande ne constitue pas une acceptation artistique de nouveaux fichiers ni l'activation d'une exception combat dans les contrats.

## Constat

CURRENT FACT : le combat de campagne est entièrement dépourvu de raccord audio. Ce n'est pas une panne de chargement des huit WAV intégrés : aucun appel sonore n'existe dans le runtime tactique, son bridge ou son protocole. Le premier lot est limité aux sons UI/campagne ; sa livraison ne couvrait pas le combat. Les préférences restent volontairement désactivées par défaut : même une action raccordée reste silencieuse tant que le joueur n'a pas activé les sons.

La recherche couvre les sources de production `src/` et `legacy-combat.html`, puis les handlers tactiques, campagne et menus. Elle distingue une absence d'appel démontrée dans le code d'un jugement d'écoute. L'accès CUA au navigateur local a expiré avant de fournir une session : aucune partie, sauvegarde ou préférence du joueur n'a été modifiée ; aucune nouvelle observation native n'est revendiquée. Les preuves UI antérieures conservent leur portée exacte.

## Pourquoi le combat reste silencieux

1. [CombatBridge.ts:48](../../src/combat/CombatBridge.ts#L48) monte un document iframe séparé. [protocol.ts:46](../../src/combat/protocol.ts#L46) ne transmet ni préférence ni événement audio ; le bridge ne possède aucun service sonore.
2. [UiSoundPlayer.ts:32](../../src/ui/UiSoundPlayer.ts#L32) écoute les gestes du document parent. Un pointerdown/keydown dans l'iframe ne remonte pas vers ces listeners DOM. Après une suspension du contexte, le joueur qui reste dans le combat ne dispose donc d'aucun raccord local pour le réveiller.
3. [legacyCombatRuntime.js:2218](../../src/combat/legacyCombatRuntime.js#L2218) propose uniquement Effets HD et Aide & commandes. Aucun accès aux réglages de son n'est présent dans le combat.
4. Les huit fichiers existants décrivent des retours UI (`navigate`, `confirm`, `back`, `refused`, `saved`, `reward`, `recover`, `travel-start`). Ils ne fournissent pas de bruit d'épée, flèche, magie, impact ou résultat de bataille.
5. OD-2026-10-18-F et le set1.6.0 excluent explicitement les sons du combat iframe. L'absence respecte cette ancienne limite ; elle constitue maintenant un besoin produit identifié, pas une preuve que l'audio de combat aurait été livré.

## Matrice des emplacements tactiques

CURRENT FACT : **toutes les lignes ci-dessous sont actuellement sans raccord sonore**. « Réemploi » et « Nouveau » décrivent une PROPOSED FUTURE DESIGN, pas un fichier créé ou accepté. P1 = noyau jouable prioritaire ; P2 = finition ou cas plus avancé.

| Priorité | Action réellement présente | Point source actuel | Proposition et condition exacte |
| --- | --- | --- | --- |
| P1 | Choisir un héros au déploiement ; changer de page | `openDeployMenu` 2426, `onDeploy` 2442 | Réemploi navigate si sélection/page change ; pas sur restauration du focus |
| P1 | Placer, déplacer ou retirer un pion au déploiement | `activateBattlefieldCell` 2168, `deployUnit` 2399 | Réemploi confirm/back après placement ou retrait effectif ; un seul retour pour un remplacement |
| P1 | Auto ; retirer toute la formation | `autoDeploy` 2411, `resetDeploy` 2406 | Un retour pour l'intention réussie, pas un son par unité recréée |
| P1 | Lancer le combat | `beginBattle` 2421 | Confirm après `canStartDeployment` ; pas sur bouton désactivé |
| P1 | Ouvrir Attaquer, Compétences ou Objets | `onMenu` 2285 ; sous-menus 2287, 2294, 2307 | Réemploi confirm à l'ouverture volontaire ; jamais depuis chaque `openActionMenu` automatique |
| P1 | Choisir une attaque, un élan, une compétence ou un objet | `enterTarget` 2105 | Confirm après PA/portée validés ; choisir n'est pas encore toucher ou consommer |
| P1 | Cible/case invalide ; PA insuffisants ; aucune cible | `announceBattlefieldRejection` 2163, `enterTarget` 2105 | Réemploi refused sur refus explicite, pointer et clavier ; ne pas annoncer un raté de combat |
| P1 | Retour, Escape, clic droit ; annulation de déplacement | `closeSubmenu` 2261, `cancelToMenu` 2113, `undoMove` 2123 | Back seulement quand l'état de sélection/déplacement a effectivement changé |
| P2 | Sélection explicite d'une unité à inspecter | `activateBattlefieldCell` 2179 | Navigate si l'unité change ; `selectUnit` appelé automatiquement au tour reste silencieux |
| P1 | Déplacement tactique joueur **et ennemi** | `moveAlong` 1120 ; IA 2008 | Nouveau pas bref à cadence bornée lors des étapes animées ; arrêt à l'annulation/dispose ; aucun son sur calcul de chemin |
| P2 | Saut, téléportation, échange ou recul de compétence | `doMove` 1712, `performSkillMovement` 1777 | Famille de mouvement dédiée si incluse dans un lot ultérieur ; distinguer départ/arrivée sans doublon |
| P1 | Attaque de lame légère / dague | `attackAnim` 1681 ; résolution 1897 | Nouveau départ de frappe ; impact seulement si touche réellement résolue |
| P1 | Arme lourde | mêmes propriétaires | Nouveau départ grave ; ne pas confondre attaque et gain de critique |
| P1 | Estoc de lance | mêmes propriétaires ; `l_long_thrust` | Nouveau estoc ; couvrir aussi une seconde cible de Percée réellement atteinte |
| P1 | Arc / projectile physique | `projectile` 1539 ; `attackAnim` 1698 | Nouveau lâcher ; toucher/raté émis séparément par la résolution |
| P1 | Magie offensive et Éclair Noir | `attackAnim` 1681 ; `executeActionCore` 1816 | Nouveau départ magique + impact ; pas depuis chaque sprite/anneau VFX |
| P1 | Dégâts réellement appliqués, alliés ou ennemis | `applyDamage` 1354 | Nouveau impact ; observer la variation réelle de PV sans recalculer dégâts ou hasard |
| P1 | Attaque ratée | branches `rollHit` 1863, 1899, 1900 | Nouveau raté sur la branche existante ; aucun deuxième tirage de précision |
| P1 | Coup critique ; cible Brisée | résolution 1865–1872, 1901–1909 | Accent critique dédupliqué, prioritaire sur impact générique ; Brisé n'est pas un blocage/parade |
| P1 | Soin par arme, compétence ou potion | `applyHeal` 1371 ; effets 1875, 1893, 1898 | Réemploi recover à auditionner en combat, après gain réel de PV ; aucune guérison sonore sur cible déjà pleine |
| P1 | Objet consommé | consommation 1854, 1894 ; `itemSpec` 2298 | Retour selon effet réel : soin, réanimation, PA, purification, bombe/grenade ; ne pas ajouter automatiquement un deuxième confirm à l'impact |
| P1 | Malus appliqué ou renouvelé | `applyStatus` 1372 ; effets 1877, 1899, 1923 | Nouveau malus, seulement si la durée/présence change ; pas un son par badge rendu |
| P2 | Bonus, barrière, PA restaurés | effets 1877, 1885, 1895 | Nouveau soutien ; PA seulement si delta positif ; ne pas interpréter barrière comme une parade inexistante |
| P2 | Purification, dissipation, vol de bonus | résolution 1881, 1896, 1926–1927 | Son dédié/réemploi à auditionner uniquement si une altération a réellement été retirée/transférée |
| P2 | Poison/brûlure, régénération ; tour empêché | `tickStatusDamage` 1151, `beginTurn` 1168 | Retour borné de l'effet réellement traité ; séparer tick de statut et attaque ; pas tous les rafraîchissements |
| P1 | K.O. | `knockOut` 1373 | Nouveau K.O. unique sur vivant → K.O., sans voix ; ne pas rejouer au chargement ou sur corps déjà à terre |
| P2 | Réanimation | `reviveUnit` 1387 ; résolution 1879, 1894 | Soin renforcé/famille dédiée après K.O. → vivant, pas depuis reconstruction initiale du roster |
| P1 | Arrivée d'un tour jouable ; Attendre | `beginTurn` 1170, `endTurn` 1176 | Nouveau signal discret pour la main rendue au joueur ; confirm pour Attendre explicite ; éviter une cloche pour chaque ennemi |
| P2 | Souffle / Garde de fin de tour | `endTurn` 1179–1182 | Pas de nouvelle règle : petit retour éventuel du gain existant ; éviter trois sons superposés avec Attendre et nouveau tour |
| P1 | Victoire / défaite | `winWave` 2332, `endGame` 2339 | Deux courts effets de résultat, émis une fois sur issue réelle ; pas une musique ou une nouvelle récompense |
| P1 | Continuer / recharger la sauvegarde | `showCombatResult` 2325 ; `notifyCampaignResult` 99 | Confirm au bouton accepté ; nettoyage des voix de session avant démontage ; aucune autre restauration ou issue audio |
| P2 | Tutoriel, aide, réglages, journal, statistiques | 2225, 2229, 2247, 2468–2517 | Réemploi navigate/confirm/back sur transitions volontaires ; pas lors d'une mise à jour du journal |
| P1 | Activer/couper le son et régler le volume pendant le combat | `renderSettings` 2218 + parent `UiSoundSettings` | Accès aux **mêmes** préférences, sans deuxième stockage/consentement ; focus sûr au retour dans l'iframe |

CURRENT FACT : la Garde augmente l'END dans le modèle courant ; aucune branche autonome « parade réussie » ne justifie un son de parade. `RATÉ`, critique, `DOS`, Brisé et K.O. existent et ne doivent pas être confondus. Les compétences multi-effets et les VFX multi-impacts ne signifient pas automatiquement plusieurs résolutions de dégâts.

## Couverture minimale des six premiers héros

| Classe / équipement initial | Première compétence source | Sons proposés nécessaires |
| --- | --- | --- |
| Guerrier / `novice_greatsword` | `w_break_guard` — Brise-Garde | Frappe lourde, impact/raté, malus curse si appliqué |
| Mage blanc / `novice_crosier` | `w_salvation` — Lumière Salvatrice | Soin réel ; distinguer attaque ennemie et soin allié du bâton |
| Mage noir / `novice_grimoire` | `n_dark_bolt` — Éclair Noir | Départ/impact magique, raté éventuel, root si appliqué |
| Archer / `novice_longbow` | `a_precise_shot` — Tir Précis | Lâcher de flèche, impact/raté/critique, blind si appliqué |
| Rôdeur / `novice_dagger` | `ro_sneak_attack` — Coup Sournois | Frappe légère, impact/critique, weak si appliqué ; orientation existante respectée |
| Lancier / `novice_spear` | `l_long_thrust` — Estoc Long | Estoc, impact/raté, slow si appliqué ; Percée de l'arme observe sa vraie seconde cible |

Sources : [catalog.ts:109](../../src/game/catalog.ts#L109), équipements initiaux [catalog.ts:316](../../src/game/catalog.ts#L316), [skills.ts](../../src/game/skills.ts). Ce tableau ne modifie ni compétences, PA, probabilités, formations, soin ou récompenses ; les niveaux supérieurs et Ultimates sont inventoriés par familles, pas rouverts comme chantier de gameplay.

## Autres trous dans l'interface de campagne

CURRENT FACT : les raccords déjà présents restent acquis ; il n'est pas nécessaire de tout refaire. Les preuves natives du précédent rapport ne certifient pas chaque bouton présent dans le code.

| Surface | Couverture actuelle | Manque précis / proposition |
| --- | --- | --- |
| Titre | Réglages Sons accessibles | Nouvelle partie et Continuer sans cue explicite (`GameApp` 272–274) ; confirm seulement après intention acceptée, pas au chargement |
| Carte | POI/régions, aide/détails, compagnie, retour panneau, sauvegarde et vrai déplacement raccordés | Menu, mouvement réduit, Attendre, contourner et engagement élite sans retour dédié (`PoiMapView` 125–129 ; `waitOnPoi` 748) ; confirmer uniquement l'action effectivement acceptée |
| Carte : Ma position, glisser/défiler | Pas de cue | Silence acceptable pour recentrage/scroll ; éviter du bruit continu et conserver le focus |
| Dialogue combat/repli | Aucun callback audio dans `PoiEncounterView` | Combattre, repli et Escape sans retour ; confirm/back après choix accepté, pas à l'affichage du panneau |
| Coffre | reward après octroi/sauvegarde effectifs | Continuer du panneau sans retour ; aucun nouveau reward à la fermeture/réouverture |
| Refuge | recover après repos réellement réussi | Ouverture Clan/Shop/Amélioration et Reprendre la route silencieuses (`ExplorationView` 102 ; `GameApp` 1069–1085) ; confirm/back selon intention, conserver recover sans doublon |
| Gestion compagnie | Onglets, héros, détails, équipement, achats/ventes, craft/amélioration réussis et consommation raccordés | Changement Acheter/Vendre/Craft sans navigate (957–959). Certains refus d'équipement/craft/amélioration/objet retournent false sans refused (934–990), contrairement aux achats/ventes ; ne sonoriser que le refus réellement expliqué, pas les boutons disabled |
| Gestion : cible de consommable | Soin réel raccordé | Sélecteur natif de cible sans retour dédié ; priorité basse, pas un son par focus automatique |
| Dialogue narratif | confirm sur choix/avance, refused sur choix bloqué | Ne pas ajouter de son par lettre, changement automatique de locuteur, montage tableau ou application d'effets |
| Prologue | Pas de raccord audio dans `PrologueView` | Avancer/Passer silencieux ; éventuel retour UI uniquement, pas voix/ambiance ou nouvelle cinématique |
| Écran de reprise après défaite | Aucun appel sonore dans handlers `GameApp` 1536–1541 | Recharger/menu silencieux ; confirm/back sur intention, jamais une cue prétendant qu'une sauvegarde a déjà réussi |
| Réglages audio | Fermer/Escape joue back ; mute/volume agissent | Aucun son nécessaire pour mute, volume0 ou restauration de préférence. Un aperçu sonore n'est pas requis et resterait un choix séparé |
| Ancien TravelView / laboratoires QA | TravelView n'est plus monté par GameApp ; seuls ses commentaires historiques restent | Ne pas reconstruire l'ancienne navigation ni sonoriser les outils de debug ; aucun retour physique Traversal |
| Vidéos/Journey/transitions automatiques | Hors lot UI | Silence intentionnel dans ce chantier ; musique, voix, boucles d'ambiance et son vidéo restent différés |

## Plan concret proposé

PROPOSED FUTURE DESIGN ; **aucun nouveau fichier audio généré et aucun raccord activé par cet audit**.

### 1. Raccord partagé et retours UI combat

Conserver un seul propriétaire audio parent, volume et mute. Prévoir une interface de présentation typée et bornée dans CombatBridge ; vérifier iframe courante, origine, session et identifiants autorisés. Le runtime émet les intentions/événements déjà résolus ; le parent ne recalcule rien. Détacher tous les raccords et arrêter les voix de la session quand l'iframe disparaît.

Le réveil doit recevoir le **véritable événement trusted** capté dans le document iframe same-origin via un raccord explicite de lifecycle. Un `MessageEvent.isTrusted` ne prouve pas un geste utilisateur. Aucun son sur iframeReady, init, reload, préférence restaurée ou focus programmatique. Rendre Sons accessible depuis les réglages du combat et ramener correctement le focus.

Réutiliser les huit fichiers UI acceptés aux actions adaptées, avec une exception de périmètre dédiée avant activation dans l'iframe. Corriger aussi les ouvertures/retours silencieux du refuge, les choix combat/repli et les changements de sous-onglet réellement identifiés. Aucun changement de leur vérité ou de leur coût.

### 2. Socle FX pour les combats ordinaires et les six héros

Proposition de **16 familles courtes** à produire et auditionner : pas tactique, lame légère, arme lourde, estoc, lâcher de flèche, départ magique, impact magique, impact physique, raté, accent critique, malus, soutien, K.O., tour joueur, victoire et défaite. Le soin peut réutiliser recover après audition en contexte. Ce sont des familles de besoins, pas seize assets déjà approuvés. Réanimation/purification et mouvements avancés pourront être précisés ensuite ; aucun Ultimate ou voix de personnage à créer dans ce socle.

Ne pas copier tel quel les limites du lecteur UI : ses deux voix, son intervalle global de50ms et ses fichiers limités à600ms conviennent à de brefs clics mais pourraient couper un impact, un critique et un K.O. consécutifs. Définir dans le lot dédié une priorité et un budget explicites : résultat/K.O./critique avant accent générique, pas tactiques à cadence bornée, impacts de zone regroupés, aucune file retardée. Les limites actuelles restent inchangées jusqu'à cet accord et à son implémentation.

Observer la résolution existante avec session + token d'action (`executeAction` 1939) + phase + cible. Les ticks de statut/tours hors action demandent leur propre identifiant d'événement. `onceAsync` assure déjà le point d'impact de la chorégraphie ; ni les appels VFX répétés, ni les profils Stage, ni `renderPanel`, `previewAt`, `refreshTurnbar` ou la boucle `animate` ne doivent devenir des producteurs de cues. Les branches hit/critique/KO existantes décident seules ; ne jamais appeler à nouveau `rollHit`, `computeDamage` ou le RNG pour choisir un effet audio. Un raté peut avoir un départ d'arme, mais aucun impact réussi.

### 3. Preuves attendues pour ce futur lot

- Tests ciblés : événement unique clavier/pointeur, aucune cue de succès sur refus ; refused seulement sur refus explicite expliqué ; silence sur no-op/reload ; isolation d'une ancienne session, vraie origine/iframe, sortie et échecs audio non bloquants.
- Réutiliser `tools/demo-continuous-production-qa.mjs` et une sauvegarde native gagnée compatible : déploiement, déplacement, attaque et première compétence accessible, potion, tour ennemi, puis retour. Aucun équipement, PA, issue ou sauvegarde fabriqué ; pas de nouvelle campagne complète pour un son.
- Prover les familles par les héros réellement recrutés et leurs combats utiles ; pas de promesse de couvrir seize familles avec un unique tir. Les contextes d'écoute, reçus et limites doivent rester distincts de l'acceptation artistique opérateur.
- Vérifier mute/volume depuis l'iframe, chargement direct/reload sans son automatique, abandon/dispose et vrai arrière-plan. Le critère native hidden/suspend du lot précédent reste ouvert : ne pas le remplacer par un événement simulé ou un autre test.
- Aucun nouveau runner permanent requis à ce stade ; tests et pilote existants à étendre seulement après cadrage du lot autorisé.

## Revue de conformité et limites

Le contracts-guardian réutilisé a relu la frontière iframe et les propriétaires. PASS pour l'audit : constitution, campagne/save, combat, présentation, UI/accessibilité, QA et gouvernance ; contrats lus set1.6.0, baseline `8fdc797bb52f5b501a00adb2a25b3623f4017086`. Aucune modification LOCKED. L'activation combat reste différée et nécessite l'amendement ciblé prévu par cette frontière explicite, y compris pour réutiliser un clic UI dans l'iframe.

Vérifications de clôture : diff --check, barrière LOCKED et contracts:validate. Aucun build, test runtime ni nouveau scénario gameplay nécessaire pour cet audit documentaire ; aucun PASS natif ajouté. Les335 jobs historiques et leurs acceptations, les objets différés, les huit vidéos, les sauvegardes et les réglages du scheduler sont conservés.

Prochaine action produit unique : préparer le lot borné « sons du combat » à partir de cette matrice : raccord aux mêmes réglages, retours UI, puis socle FX des six héros, avec son amendement dédié avant activation.
