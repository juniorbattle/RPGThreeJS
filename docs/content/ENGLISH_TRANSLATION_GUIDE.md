# English translation guide

Status: canonical, from the operator's sheet [OD-2026-11-15-C](../autonomy/ENGLISH_TRANSLATION_OPERATOR_DECISION_2026-11-15.md). French is the source and the default language. English renders the existing French faithfully: it never adds, removes or changes a fact, a choice, a consequence, a name or a reward. It is a display layer: the content files, durable ids and saves stay French.

## How the game finds English

- The French text is the key. `src/i18n/en/<zone>.json` maps each French text, exactly as the DOM shows it, to its English text. The game translates at display time (`tr()` in `src/i18n/i18n.ts`, and the DOM translator while English is on).
- Text built from pieces has holes: `« {0} est K.O. ! »` → `“{0} is KO!”`. Keep every hole the English needs, in any order; never invent a hole. A hole that only carried a French plural ending may be dropped.
- A missing English text shows its French. `src/i18n/catalogCoverage.test.ts` fails on a missing, orphaned or off-glossary entry inside `TRANSLATED_SCOPE`.
- Workbench: `node tools/i18n/report.mjs status`, `todo <zone> [regex] [limit]` (numbered list, French with the speaker), `merge <file.tsv>` (`id<TAB>English` lines), `orphans`. When a French text changes, its English entry becomes an orphan and the new text a missing key: translate the new text and delete the orphan.

## Register

- **Sober epic.** The French is formal and plain: `vous`, clean sentences, few archaisms. Write clear, dignified modern English. No thee/thou, no “’tis”, no inverted syntax for colour, no slang.
- **Contractions** only in familiar voices (Maelor when he is blunt, Kestrel, soldiers, raiders, villagers in distress), never in the opening, solemn lines, judgements, epilogues or system text.
- **Voices.** Alaric solemn and rigid; Maelor frank, practical, insinuating, his advice always reasonable on the surface; Séraphine measured and grave; Alistair steady, a shield's plainness; Kestrel terse; Marian warm and direct; Borin wary and proud; Kaelen ancient and cold; the Grand Inquisitor exact and legalistic.
- **The heir.** The player is the heir, the unseen « vous » (OD-2026-11-14-B): always “you”. “Heir” is neutral; never “he/him” for the heir. Rephrase without a pronoun, or use “their” only when nothing else reads well.
- **Faithfulness.** Keep the length and rhythm close; keep every image the French uses (the low gate is “our purse”). Do not explain, soften or sharpen. Keep the French's ambiguity where it has one.
- **British spelling:** honour, armour, defence, colour, grey, judgement, centre, travelling, -ise verbs.
- **Typography:** English quotes “ ” and ’, no space before ! ? : ;, “6%”, em dash — kept where the French uses it, ellipsis … kept. Sentence case for sentences; title case for names of places, chapters, skills and items.

## Glossary

### Title and world
| French | English |
| --- | --- |
| La Voie des Sceaux | The Way of the Seals |
| Chroniques d’Élyndra | Chronicles of Élyndra |
| Un RPG tactique où chaque serment laisse une trace. | A tactical RPG where every oath leaves its mark. |
| chronique (a playthrough) · Nouvelle chronique | chronicle · New Chronicle |
| la compagnie | the company |
| l’héritier | the heir |
| clan déchu · clan sans terre | fallen clan · landless clan |

### People (given names stay, accents included; titles translate)
| French | English |
| --- | --- |
| Chef Alaric · Vieux Lion Alaric · Alaric | Chief Alaric · Old Lion Alaric · Alaric |
| Intendant Maelor | Steward Maelor |
| Sage Séraphine · la Sage | Sage Séraphine · the Sage |
| Alistair, Marian, Kestrel, Cedric, Garen, Elara, Aldric, Morvan, Lyra, Eldwin, Talon, Gunnar | unchanged |
| Ancien Ours Borin | Elder Bear Borin |
| Ancien Dragon Kaelen · Ancien Kaelen | Elder Dragon Kaelen · Elder Kaelen |
| Grand Inquisiteur | Grand Inquisitor |
| Général Serpent | Serpent General |
| Champion du Lion · du Loup · du Corbeau… | Champion of the Lion · of the Wolf · of the Raven… |
| Maître Espion du Corbeau · Espion du Corbeau | Raven Spymaster · Raven Spy |
| Chef des mineurs du Corbeau | Raven Mine Chief |
| Prophète des Ombres · Chaman des Ombres | Shadow Prophet · Shadow Shaman |
| Oracle Serpent · Duelliste Serpent · Pillard Serpent · Chasseur Serpent · Brute Serpent | Serpent Oracle · Serpent Duelist · Serpent Raider · Serpent Hunter · Serpent Brute |
| Villageoise / Survivant / Survivante / Ancienne de Bois-Clair | Clearwood Villager / Survivor / Survivor / Elder |
| Mineur de l’Ours · Guerrier de l’Ours | Bear Miner · Bear Warrior |
| Messager du Corbeau | Raven Messenger |
| Gardien du Dragon · Pèlerin du Dragon | Dragon Guardian · Dragon Pilgrim |
| Érudit du Scorpion | Scorpion Scholar |
| Fidèle du Phénix · Champion du Phénix · Chef des gardiens du Phénix | Phoenix Faithful · Champion of the Phoenix · Chief of the Phoenix Guardians |
| Fidèle égaré | Lost Faithful |
| Émissaire du Loup · Émissaire sans fief · Chef du Clan du Loup | Wolf Envoy · Landless Envoy · Chief of the Wolf Clan |
| Colporteuse · Courtière des routes · Marchand blessé | Peddler · Road Broker · Wounded Merchant |
| Quartier-maître du refuge | Refuge Quartermaster |
| Troll des pierres · Jeune dragon · Apparition du sanctuaire | Stone Troll · Young Dragon · Shrine Apparition |
| l’Entité · les démons · le Démon | the Entity · the demons · the Demon |
| Narrateur | Narrator |

### Clans, factions, seals
| French | English |
| --- | --- |
| Clan du Lion / du Serpent / de l’Ours / du Corbeau / du Dragon / du Loup / du Scorpion / du Phénix | Lion / Serpent / Bear / Raven / Dragon / Wolf / Scorpion / Phoenix Clan |
| le Lion, l’Ours… (the clan in speech) · les Serpents | the Lion, the Bear… · the Serpents |
| les Ombres Silencieuses · les Ombres | the Silent Shadows · the Shadows |
| le Sceau du Lion / de l’Ours / du Dragon / du Scorpion · les quatre Sceaux | the Seal of the Lion / of the Bear / of the Dragon / of the Scorpion · the four Seals |
| Sceau du Sage (accessory) | Sage’s Seal |
| Le Sceau … est obtenu. | The Seal of … is won. |

### Places
| French | English |
| --- | --- |
| Bois-Clair | Clearwood |
| Plaines du Courage · Terres du Lion | Plains of Courage · Lion Lands |
| Montagnes de la Résilience · mines sacrées | Mountains of Resilience · sacred mines |
| Pics Célestes | Celestial Peaks |
| Déserts Arides | Arid Deserts |
| Temple du Phénix | Temple of the Phoenix |
| Cristal d’Écho | Echo Crystal |
| Tournoi des Grands · le Tournoi | Tournament of the Great · the Tournament |
| Arène des Destins | Arena of Fates |
| la capitale · la brèche · la faille | the capital · the Breach · the rift |
| Refuge · Veillée avant le Sceau · Pied des Montagnes | Refuge · Vigil Before the Seal · Foot of the Mountains |

### Routes and endings
| French | English |
| --- | --- |
| par l’honneur · par la force · voie de l’honneur | by honour · by force · the way of honour |
| Le Respect · La Crainte · L’Équilibre | Respect · Fear · Balance |
| Jugement · Mérites | Judgement · Merits |
| Fin de chapitre · La route continue · Prochaine étape | End of Chapter · The Road Goes On · Next |

### Rules, resources, ranks
| French | English |
| --- | --- |
| Or · Réputation · gemme rouge · minerai de fer | Gold · Reputation · red gem · iron ore |
| Hostile · Méfiant · Neutre · Respecté · Renommé | Hostile · Wary · Neutral · Respected · Renowned |
| allié · neutre · ennemi (clan relation) | ally · neutral · enemy |
| PV · PA · FOR · MAG · END · DEX · CHA · DÉPL | HP · AP · STR · MAG · END · DEX · CHA · MOV |
| Niv. · élite · boss · chef | Lv. · elite · boss · chief |
| compétence · attaque de base · attaque lourde · Ultime · Don inné | skill · basic attack · heavy attack · Ultimate · Innate gift |
| Déploiement · Lancer le combat · Manche · Vague 1 / 2 | Deployment · Start the battle · Round · Wave 1 / 2 |
| Victoire · Défaite · Abandonner | Victory · Defeat · Abandon |
| Défi · Prime · condition | Challenge · Bounty · condition |
| Coffre · Gardien · Mystère · Événement · Combat | Chest · Guardian · Mystery · Event · Battle |
| Combattre · Se replier | Fight · Retreat |
| Échoppe · Forge · Registre de Compagnie · Inventaire | Shop · Forge · Company Roster · Inventory |
| Réglages · Son · Affichage · Commandes · Mouvement réduit | Settings · Sound · Display · Controls · Reduced motion |
| Continuer · Passer · Retour · Fermer · Confirmer | Continue · Skip · Back · Close · Confirm |

### Statuses (French form kept: noun for noun, adjective for adjective)
| French | English | Short code |
| --- | --- | --- |
| Brûlure | Burn | BRN |
| Poison | Poison | PSN |
| Régénération | Regeneration | RGN |
| Ralenti | Slowed | SLW |
| Force | Might | MGT |
| Affaibli | Weakened | WKN |
| Barrière | Barrier | BAR |
| Malédiction | Curse | CRS |
| Brisé | Staggered | STG |
| Aveuglement | Blindness | BLD |
| Entravé | Rooted | ROT |
| Mutisme | Silence | SIL |
| Provocation | Taunt | TNT |
| Essoufflé | Winded | WND |
| Furie | Fury | FRY |
| Garde | Guard | GRD |

### Combat floating labels
| French | English |
| --- | --- |
| PURIFIÉ · DISSIPÉ | CLEANSED · DISPELLED |
| K.O. · RATÉ | KO · MISS |
| DOS ! | FROM BEHIND! |
| DOUBLE ! · PERCE ! | DOUBLE! · PIERCE! |
| GARDE + · CHARGE · CHARGE BRISÉE | GUARD + · CHARGE · CHARGE BROKEN |
| ULTIME · FURIE · SIGNATURE · BOSS | ULTIMATE · FURY · SIGNATURE · BOSS |
| Rupture N % | Break N% |

### Weapons and items
| French | English |
| --- | --- |
| Espadon · Masse · Faux · Lance · Grimoire · Crosse · Rapière · Baguette · Arc long · Shuriken · Dague · Canon à main | Greatsword · Mace · Scythe · Spear · Grimoire · Crosier · Rapier · Wand · Longbow · Shuriken · Dagger · Hand Cannon |
| novice · d’acier · sacré(e) | Novice · Steel · Sacred |
| Potion · Éther · Antidote · Bombe · Fiole de résurrection | Potion · Ether · Antidote · Bomb · Vial of Revival |
| Grenade incendiaire / entravante / aveuglante | Incendiary / Binding / Blinding Grenade |
| Marteau de l’Ours · Lance de guerre | Hammer of the Bear · War Spear |

Skill names translate as closely as the French allows; when the code id already says it in English (`w_lion_surge`, `p_oathwall`, `p_radiant_judgement`), use those words: Lion’s Surge, Oathwall, Radiant Judgement.
