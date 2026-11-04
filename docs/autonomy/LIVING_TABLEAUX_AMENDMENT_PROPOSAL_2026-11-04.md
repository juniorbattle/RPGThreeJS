# Tableaux vivants aux moments clés : proposition d'amendement

**PROPOSED — pas en vigueur.** Le 2026-11-03, l'opérateur demande d'intégrer « ce même cutscene runtime animé » de l'ouverture à d'autres endroits clés du jeu, comme Bois-Clair et le jugement d'Alaric. Le 2026-11-04, à la question d'un amendement, il répond « Oui, préparer ». Ce document prépare cet amendement. Il ne modifie aucun contrat et n'autorise aucun code de production. Il ne vaut pas approbation : l'opérateur choisit d'abord sur la fiche d'arbitrages, puis approuve le texte final.

## Pourquoi un amendement

`CURRENT FACT` L'ouverture (OD-2026-11-02-A) est un lecteur réservé à elle seule. La relecture indépendante l'a jugée conforme au set 1.12.0 pour cette raison : un lecteur réutilisable, une arène ou une image générée demanderaient un amendement. Aucun contrat ne nomme l'ouverture ; elle repose sur sa décision seule.

`CURRENT FACT` Le contrat LOCKED `PRESENTATION_AND_MEDIA.md`, section *Cinematic retirement — OD-2026-10-24-A*, contient trois règles en jeu :

- il arrête « new cinematic, illustrated-montage and MiniMax production, including pilot generalization » ;
- il interdit « No video delay or empty replacement interlude » ;
- les huit moments historiques sont « presented through existing static dialogues/tableaux ».

Une séquence animée jouée avant le dialogue de Bois-Clair ou du jugement demande donc un amendement dédié, comme les sets 1.8.0 à 1.12.0 (relecture `contracts-guardian`, 2026-11-04).

`CURRENT FACT` Animer seulement le fond du tableau pendant le dialogue ne demande pas clairement d'amendement : feu, fumée, lumière et figurants au loin, sans interlude. Cela relève de « Static dialogue/NarrativeStage improvement », que le retrait autorise. Deux risques restent : le mot « static » de la constitution, et les règles de regard et de focus de DIALOGUE_STAGING, que les figurants ne doivent pas toucher. L'amendement lèverait ce doute par une phrase.

## Moments et matière disponible

Tous les fonds existent déjà, peints et approuvés : aucune image n'est à générer.

| Moment | Place exacte | Fond peint | Établi à ce point | Dit ensuite, à ne pas montrer d'avance |
| --- | --- | --- | --- | --- |
| `bois_clair_arrival` | avant `village_choice` | `bois-clair-tableau-burning.png` | « Bois-Clair brûle sous les torches des Serpents » (briefing d'Alaric) | enfants emmenés au nord, coffres en feu, place coupée par les flammes, blessés à la chapelle, réserves et puits |
| `bois_clair_saved` | après la victoire de `village_defense`, avec `missionSuccess` sans `missionGreed`, avant `village_defense_aftermath` | `bois-clair-tableau-aftermath-saved.png` | Serpents en fuite, enfants saufs | remerciements, récompense acceptée ou refusée ; sort des réserves et des puits |
| `bois_clair_sacrificed` | après la victoire de `village_raid`, avec `missionGreed`, avant `village_raid_aftermath` | `bois-clair-tableau-aftermath-sacrificed.png` | coffres pris, Serpents dispersés, villageois muets, villageoise blessée | provisions laissées ou tout emporté |
| `lion_judgement` | avant `lion_finale_judgement`, après `final_refuge` | `lion-judgement-tableau.png` | la compagnie arrive au camp du Lion et entre (« Entrons ») | verdict, choix, épreuve, champion |

`CURRENT FACT` Une défaite ou une retraite au combat de Bois-Clair ne joue aucune séquence d'issue (`resolveCin6aBoisClairAftermath`). Les deux issues précèdent un choix encore ouvert.

Figurines disponibles en pixel : les héros et Cedric (feuilles de combat), Alaric, Séraphine, Maelor, villageois, villageoise, réfugiés, survivant, miliciens, pillards et brutes Serpents (feuilles ou portraits réduits comme au camp de l'ouverture). Aucun enfant n'existe en pixel, et la séquence n'en montre pas.

## Plans envisagés

`PROPOSED FUTURE DESIGN` Chaque séquence garde la grammaire de l'ouverture : tableau peint, lumière, feu, fumée, caméra lente et figures pixel sur le grain du tableau. Aucune phrase nouvelle. Ces plans précisent la proposition ; ils ne valent pas script approuvé.

- **Arrivée à Bois-Clair.** La compagnie arrive à Bois-Clair ; la place brûle et des pillards passent avec leurs torches. La villageoise qui ouvre le dialogue apparaît, sans geste qui devance sa réplique. Le cadrage diffère de celui de l'ouverture, qui montre le même tableau, pour qu'on lise une arrivée et non une redite.
- **Bois-Clair sauvé.** Une place apaisée et éclairée, quelques volutes de fumée, des Serpents qui fuient au loin. Quelques villageois restent à distance, sans remerciement ni accolade. Réserves et puits restent hors champ.
- **Bois-Clair sacrifié.** Ruines, braises et fumée, des coffres immobiles. Maelor se tient là, la villageoise à l'écart, les villageois au loin. Personne ne charge ni ne distribue quoi que ce soit.
- **Jugement d'Alaric.** La compagnie entre dans la salle, et Alaric attend, seul. La séquence s'arrête avant qu'il ne parle, sans geste de verdict. Reste à vérifier que la salle du jugement n'est pas celle de l'audience, déjà vue au début de l'acte.

Distribution, dans la limite de quatre acteurs visibles :

| Séquence | Acteurs du récit | Figurants en décor |
| --- | --- | --- |
| Arrivée | la villageoise, et jusqu'à trois héros (Marian, Kestrel, Alistair ou Séraphine) | pillards qui passent |
| Sauvé | la villageoise, avec au plus Alistair et Maelor | villageois au loin, Serpents en fuite |
| Sacrifié | Maelor et la villageoise | villageois au loin |
| Jugement | Alaric, avec au plus Maelor, Séraphine et Alistair | gardes de la salle, s'il y en a |

## Décisions demandées à l'opérateur

La [fiche d'arbitrages](https://claude.ai/artifact/BYnM5CGndEWtVVSYwBD1nk), publiée le 2026-11-04, pose ces questions avec une recommandation pour chacune :

1. **Moments.** Les deux demandés, ou avec l'issue de Bois-Clair, ou aussi les autres moments historiques.
2. **Forme.** Une séquence avant le dialogue, un fond animé pendant, ou les deux.
3. **Durée.** Celle de chaque séquence.
4. **Calendrier.** Avant ou après le playtest PC.
5. **Texte.** Aucune légende, une réplique existante, ou des légendes écrites par l'opérateur.
6. **Figurants.** En décor hors du compte de quatre, ou dans le compte.
7. **Jugement.** Où s'arrête la séquence.
8. **Ouverture.** Elle garde sa décision, ou elle prend les règles communes.
9. **Méthode.** Une maquette d'abord, ou directement dans le jeu.
10. **Musique.** L'humeur du dialogue qui suit, ou le silence.
11. **Amendement.** Réécrire le texte selon ces choix et le soumettre.

## Texte d'amendement — brouillon révisé

Set proposé **1.13.0**, tâche `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-1`. La décision sera numérotée à l'approbation (OD-2026-11-XX) et aura son propre fichier. Ce brouillon suit les recommandations de la fiche. Il sera réécrit selon les choix de l'opérateur, puis relu sur le diff réel.

Documents touchés :

- `PRESENTATION_AND_MEDIA.md` : une nouvelle section en fin de fichier, plus deux renvois ;
- `GAME_CONSTITUTION.md` : une phrase ;
- `AUTHORING_AND_QA.md` : un paragraphe ;
- `AUTONOMOUS_WORK_PROTOCOL.md` : une phrase ;
- `README.md` et `contracts.manifest.json` : métadonnées ;
- le commit de baseline met aussi à jour `AGENTS.md` et le skill `contracts-compliance`.

### PRESENTATION_AND_MEDIA — nouvelle section, après *Audio direction*

> ## Living tableaux — OD-2026-11-XX
>
> Dedicated `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-1`, set 1.13.0, [operator decision](../autonomy/…). For code-animated sequences on existing approved tableaux only, it narrows two rules of the cinematic retirement section: "Stop new cinematic … production, including pilot generalization" and "No video delay or empty replacement interlude". Every other rule of OD-2026-10-24-A stays in force: zero active video; no video playback, preload, video-derived hold or shipped MP4; no generated or new illustrated image; no illustrated montage; no video or keyframe generation; no MiniMax; the eight historical identities and every archive.
>
> - **Medium.** A living tableau is a short sequence animated by code on an existing approved painted tableau. It may use light, fire, smoke, weather, a slow camera, and pixel figures drawn at the tableau's grain from existing Character V2 sheets or portraits. It uses no WebGL, video element, recorded media, generated image or new illustration.
> - **Moments, exhaustively.** `bois_clair_arrival`, before `village_choice`. `bois_clair_saved`, after a `village_defense` victory with `missionSuccess` and without `missionGreed`, before `village_defense_aftermath`. `bois_clair_sacrificed`, after a `village_raid` victory with `missionGreed`, before `village_raid_aftermath`. `lion_judgement`, before `lion_finale_judgement`. These beat ids name the moment only: no video slot is reopened and no video descriptor is activated. A sequence opens no new beat, and replaces no dialogue, choice, tableau or combat. The opening sequence stays governed by OD-2026-11-02-A and may share the player's code.
> - **When it plays.** A sequence plays only when its beat opens live for the first time. A resolved revisit, as resolved by RunSystem, a reload or a resume goes straight to the dialogue, as in the POI navigation rule that resolved revisits replay no one-shot presentation. This needs no new save field, and nothing transient is serialized.
> - **Length and agency.** At most 30 seconds, or 40 for `lion_judgement`. Click, Enter, or a visible skip control that meets the keyboard and focus rules of UI_AND_ACCESSIBILITY, moves to the next shot or straight to the dialogue. A sequence never blocks input, and never delays a save, reward, choice, combat or defeat recovery. A missing image or a script failure goes straight to the dialogue, with the same first step as today.
> - **Canon.** No new text: there are no captions. A sequence shows only facts already established at its point of the route. It never shows what the following dialogue says first, and never plays a choice, outcome, verdict or consequence before its canonical owner resolves it. A branch sequence reads the resolved outcome only through the existing presentation trigger. The `lion_judgement` sequence ends before Alaric speaks, and the Alaric climax is unchanged.
> - **Cast.** At most four visible narrative actors. Extras are moving scenery: they have no dialogue, focus or facing relation, are drawn behind the narrative actors, number at most twelve, and are never counted as actors or fed to the relational staging planner. Character V2 identities, equipment and authored facing hold.
> - **Animated backdrop.** During the following dialogue, its tableau may keep animated light, fire, smoke and distant extras under the same cast rule. That changes no staging, focus or text.
> - **Reduced motion.** OS or game reduced motion keeps a fixed camera and turns travel into fades. Fire, light and wind may stay animated. Every shot keeps its information.
> - **Audio.** A sequence takes the mood of its following dialogue through the existing mood table, with no new table key tied to the sequence. It adds no track or cue. Cinematic audio and voices stay DEFERRED.
> - **Ownership.** One shared presentation-only player serves these moments. It creates no route, outcome, resource or save field.

Renvois dans le même contrat :

- DIALOGUE_STAGING, après « none authorizes runtime video or new cinematic production » : « ; the living tableaux below are the only, code-animated, exception ».
- Cinematic retirement, à la fin du deuxième paragraphe : « The Living tableaux section narrows this stop for code-animated sequences on existing approved tableaux only. »

### GAME_CONSTITUTION — phrase ajoutée à la ligne 21

> Dedicated `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-1`, set 1.13.0, adds code-animated living tableaux on existing approved tableaux at the moments listed in PRESENTATION_AND_MEDIA. They precede the static dialogues and tableaux, and may animate their backdrop. They never replace them, and the static dialogues and tableaux keep each moment's text, choices and agency.

### AUTHORING_AND_QA — paragraphe ajouté

> Dedicated `PRODUCTION-CONTRACTS-LIVING-TABLEAUX-1`, set 1.13.0: each living tableau needs focused tests for first live opening only, resolved revisit, reload and resume, skip by pointer and keyboard, missing-image fallback, reduced motion, the four-actor limit with bounded extras, and the absence of new text. It also needs types, a build, and one native run through its boundary in normal and reduced motion, with inspected captures and a reload at the boundary. Operator artistic acceptance is by viewing; no machine check stands in for it.

### AUTONOMOUS_WORK_PROTOCOL — phrase ajoutée au paragraphe *Cinematic retirement continuation*

> Code-animated living tableaux are not generated cinematic candidates; set 1.13.0 governs them.

### Ordre

1. L'opérateur fait ses choix sur la fiche.
2. Le fichier de décision est numéroté, puis le texte est réécrit.
3. Relecture indépendante du diff réel.
4. L'opérateur approuve le texte.
5. Commit de l'amendement.
6. Commit opérationnel qui fixe la nouvelle baseline immuable dans `AGENTS.md` et le skill `contracts-compliance`.
7. Maquette ou intégration.

## Relectures du premier brouillon (2026-11-04)

**`contracts-guardian`.** Amendement requis pour une séquence avant le dialogue : PASS. Limites de média et de canon : PASS. Audio : PASS, avec la reformulation reprise ci-dessus. Le premier brouillon était BLOCKED sur cinq points, tous repris dans le brouillon révisé :

- la constitution et le protocole manquaient à la liste des documents ;
- la lecture unique n'avait pas de mécanisme : elle se règle désormais sur la première ouverture vivante, sans champ de sauvegarde ;
- les figurants n'étaient pas définis ;
- les identités historiques risquaient de rouvrir des créneaux vidéo ;
- la place de l'ouverture était floue.

Il demande aussi un test de revisite et de rechargement, et l'emplacement de la nouvelle section. La relecture du diff réel reste à faire après les choix de l'opérateur.

**`narrative-tableau`.** Le premier tableau donnait pour établis des faits que seul le dialogue de Bois-Clair énonce : enfants, coffres, chapelle. Ils sont déplacés dans la colonne « à ne pas montrer d'avance ». Autres corrections reprises :

- l'issue sauvée se place avant `village_defense_aftermath` ;
- les deux issues précèdent un choix ouvert ;
- les retours de villageois et le chargement des coffres sont retirés ;
- le champion n'est pas aux côtés d'Alaric avant le jugement : il n'y paraît que sur la route de l'épreuve, après le choix ;
- le cadrage de l'arrivée doit différer de celui de l'ouverture.
