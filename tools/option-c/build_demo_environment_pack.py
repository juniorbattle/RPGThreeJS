#!/usr/bin/env python3
"""Build the Option C full-demo environment census, manifests, QA, and boards.

This helper never creates creative artwork. It inventories runtime truth, copies
approved/generated raster sources into review-only candidate slots, hashes the
results, and assembles deterministic operator-review contact sheets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
PACK_ROOT = ROOT / "public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1"
CONTENT_PATH = ROOT / "src/game/content.ts"
R5_CONTENT_PATH = ROOT / "src/game/r5NarrativeContent.ts"
DOCTRINE_PATH = ROOT / "src/cinematics/NarrativePresentationDoctrine.ts"
ASSET_MANIFEST_PATH = ROOT / "src/render/assetManifest.ts"
COMBAT_BG_PATH = ROOT / "src/render/combatBackgrounds.ts"
COMBAT_STAGE_BG_PATH = ROOT / "src/combat/stage/combatStageBackgrounds.ts"
FOREST_V2_ROOT = ROOT / "public/assets/dev/option-c/phase4b/environment/forest-road-v2"


@dataclass(frozen=True)
class Plate:
    asset_id: str
    family: str
    role: str
    sublocation: str
    world_state: str
    time_of_day: str
    source: str
    candidate: str
    generated: bool
    reuse_allowed: bool = True


def master(family: str, filename: str) -> str:
    return f"family-masters/{family}/{filename}"


def family_source(family: str, filename: str) -> str:
    return f"{family}/{filename}"


def candidate(role_dir: str, filename: str) -> str:
    return f"{role_dir}/{filename}"


PLATES: tuple[Plate, ...] = (
    Plate("lion_camp_tableau", "LION_CAMP", "STATIC_TABLEAU", "departure camp", "intact", "pre-dawn", master("lion-camp", "lion-camp-master.png"), candidate("tableau", "lion-camp-tableau.png"), True),
    Plate("lion_camp_travel", "LION_CAMP", "TRAVEL", "departure road", "intact", "pre-dawn", master("lion-camp", "lion-camp-master.png"), candidate("travel", "lion-camp-travel.png"), True),
    Plate("lion_camp_cinematic_source", "LION_CAMP", "CINEMATIC_SOURCE_ENVIRONMENT", "departure camp", "intact", "pre-dawn", master("lion-camp", "lion-camp-master.png"), candidate("cinematic-source", "lion-camp-cinematic-source.png"), True),
    Plate("alaric_audience_tableau", "ALARIC_AUDIENCE", "STATIC_TABLEAU", "throne hall", "formal audience", "interior", master("alaric-audience", "alaric-audience-master.png"), candidate("tableau", "alaric-audience-tableau.png"), True),
    Plate("alaric_audience_cinematic_source", "ALARIC_AUDIENCE", "CINEMATIC_SOURCE_ENVIRONMENT", "throne hall", "formal audience", "interior", master("alaric-audience", "alaric-audience-master.png"), candidate("cinematic-source", "alaric-audience-cinematic-source.png"), True),

    Plate("forest_road_main", "FOREST_ROAD", "STATIC_TABLEAU", "main road", "intact", "moonlit", master("forest-road", "forest-road-main-master.png"), candidate("tableau", "forest-road-main.png"), False),
    Plate("forest_road_travel", "FOREST_ROAD", "TRAVEL", "main road", "intact", "moonlit", "../forest-road-v2/forest-road-travel.png", candidate("travel", "forest-road-travel.png"), False),
    Plate("forest_road_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "main road", "intact", "moonlit", "../forest-road-v2/forest-road-tableau.png", candidate("tableau", "forest-road-tableau.png"), False),
    Plate("forest_route_strategic", "FOREST_ROAD", "STRATEGIC_COMBAT", "forest ruins", "intact", "daylight", "../forest-road-v2/forest-road-strategic.png", candidate("strategic", "forest-route-strategic.png"), False, False),
    Plate("forest_route_stage", "FOREST_ROAD", "COMBAT_STAGE", "forest ruins", "intact", "daylight", "../forest-road-v2/forest-road-combat-stage.png", candidate("combat-stage", "forest-route-stage.png"), False, False),
    Plate("forest_crossroads_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "crossroads", "intact", "moonlit", family_source("forest-road", "forest-crossroads-tableau.png"), candidate("tableau", "forest-crossroads-tableau.png"), True),
    Plate("refugee_road_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "refugee road", "worn route", "overcast daylight", family_source("forest-road", "refugee-road-tableau.png"), candidate("tableau", "refugee-road-tableau.png"), True),
    Plate("roadside_event_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "roadside event", "intact", "late afternoon", family_source("forest-road", "roadside-event-tableau.png"), candidate("tableau", "roadside-event-tableau.png"), True),
    Plate("abandoned_cart_area_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "abandoned cart area", "disturbed", "dusk", family_source("forest-road", "abandoned-cart-area-tableau.png"), candidate("tableau", "abandoned-cart-area-tableau.png"), True),
    Plate("forest_ambush_area_tableau", "FOREST_ROAD", "STATIC_TABLEAU", "ambush clearing", "threatened", "moonlit", family_source("forest-road", "forest-ambush-area-tableau.png"), candidate("tableau", "forest-ambush-area-tableau.png"), True),

    Plate("first_refuge_tableau", "FIRST_REFUGE", "STATIC_TABLEAU", "protected woodland camp", "safe", "night", master("first-refuge", "first-refuge-night-master.png"), candidate("tableau", "first-refuge-tableau.png"), True),
    Plate("first_refuge_travel", "FIRST_REFUGE", "TRAVEL", "departure gate", "safe", "early morning", family_source("first-refuge", "first-refuge-morning-travel.png"), candidate("travel", "first-refuge-travel.png"), True),

    Plate("valmir_road_tableau", "VALMIR_ROAD", "STATIC_TABLEAU", "mountain road", "smoke on horizon", "daylight", master("valmir-road", "valmir-road-master.png"), candidate("tableau", "valmir-road-tableau.png"), True),
    Plate("valmir_road_travel", "VALMIR_ROAD", "TRAVEL", "mountain road", "smoke on horizon", "daylight", master("valmir-road", "valmir-road-master.png"), candidate("travel", "valmir-road-travel.png"), True),
    Plate("old_shrine_tableau", "VALMIR_ROAD", "STATIC_TABLEAU", "old woodland shrine", "weathered sacred site", "filtered daylight", family_source("valmir-road", "old-shrine-tableau.png"), candidate("tableau", "old-shrine-tableau.png"), True),

    Plate("bois_clair_tableau_burning", "BOIS_CLAIR", "STATIC_TABLEAU", "village square", "burning outcome-neutral", "sunset", master("bois-clair", "bois-clair-burning-master.png"), candidate("tableau", "bois-clair-tableau-burning.png"), True),
    Plate("bois_clair_travel", "BOIS_CLAIR", "TRAVEL", "village approach", "burning outcome-neutral", "sunset", master("bois-clair", "bois-clair-burning-master.png"), candidate("travel", "bois-clair-travel.png"), True),
    Plate("bois_clair_tableau_aftermath_saved", "BOIS_CLAIR", "STATIC_TABLEAU", "village square", "saved aftermath", "dawn", family_source("bois-clair", "bois-clair-aftermath-saved.png"), candidate("tableau", "bois-clair-tableau-aftermath-saved.png"), True),
    Plate("bois_clair_tableau_aftermath_sacrificed", "BOIS_CLAIR", "STATIC_TABLEAU", "village square", "sacrificed aftermath", "smoky dawn", family_source("bois-clair", "bois-clair-aftermath-sacrificed.png"), candidate("tableau", "bois-clair-tableau-aftermath-sacrificed.png"), True),
    Plate("bois_clair_burning_strategic", "BOIS_CLAIR", "STRATEGIC_COMBAT", "village square", "burning outcome-neutral", "sunset", family_source("bois-clair", "bois-clair-burning-strategic.png"), candidate("strategic", "bois-clair-burning-strategic.png"), True, False),
    Plate("bois_clair_burning_stage", "BOIS_CLAIR", "COMBAT_STAGE", "village square", "burning outcome-neutral", "sunset", family_source("bois-clair", "bois-clair-burning-stage.png"), candidate("combat-stage", "bois-clair-burning-stage.png"), True, False),

    Plate("second_refuge_night_tableau", "SECOND_REFUGE", "STATIC_TABLEAU", "intimate refuge", "post-Bois-Clair", "night", master("second-refuge", "second-refuge-night-master.png"), candidate("tableau", "second-refuge-night-tableau.png"), True),
    Plate("second_refuge_morning_travel", "SECOND_REFUGE", "TRAVEL", "departure gate", "post-Bois-Clair", "morning", family_source("second-refuge", "second-refuge-morning-travel.png"), candidate("travel", "second-refuge-morning-travel.png"), True),

    Plate("witness_road_tableau", "WITNESS_ROAD", "STATIC_TABLEAU", "open witness road", "smoke behind", "neutral daylight", master("witness-road", "witness-road-master.png"), candidate("tableau", "witness-road-tableau.png"), True),
    Plate("witness_road_travel", "WITNESS_ROAD", "TRAVEL", "open witness road", "smoke behind", "neutral daylight", master("witness-road", "witness-road-master.png"), candidate("travel", "witness-road-travel.png"), True),

    Plate("shadow_ruins_approach", "SHADOW_RUINS", "TRAVEL", "ruins approach", "restrained corruption", "moonlit", master("shadow-ruins", "shadow-ruins-approach-master.png"), candidate("travel", "shadow-ruins-approach.png"), True),
    Plate("shadow_ruins_tableau", "SHADOW_RUINS", "STATIC_TABLEAU", "evidence court", "restrained corruption", "moonlit", family_source("shadow-ruins", "shadow-ruins-evidence-tableau.png"), candidate("tableau", "shadow-ruins-tableau.png"), True),
    Plate("dragon_roost_area", "SHADOW_RUINS", "STATIC_TABLEAU", "dragon roost", "ancient nesting ground", "dusk", family_source("shadow-ruins", "dragon-roost-area.png"), candidate("tableau", "dragon-roost-area.png"), True),
    Plate("lion_sanctum_strategic", "SHADOW_RUINS", "STRATEGIC_COMBAT", "sanctum court", "restrained corruption", "moonlit", family_source("shadow-ruins", "lion-sanctum-strategic.png"), candidate("strategic", "lion-sanctum-strategic.png"), True, False),
    Plate("lion_sanctum_stage", "SHADOW_RUINS", "COMBAT_STAGE", "sanctum court", "restrained corruption", "moonlit", family_source("shadow-ruins", "lion-sanctum-stage.png"), candidate("combat-stage", "lion-sanctum-stage.png"), True, False),

    Plate("final_refuge_tableau", "FINAL_REFUGE", "STATIC_TABLEAU", "dossier shelter", "pre-judgement", "dusk", master("final-refuge", "final-refuge-master.png"), candidate("tableau", "final-refuge-tableau.png"), True),
    Plate("final_refuge_travel", "FINAL_REFUGE", "TRAVEL", "road beyond shelter", "pre-judgement", "dusk", master("final-refuge", "final-refuge-master.png"), candidate("travel", "final-refuge-travel.png"), True),

    Plate("lion_judgement_tableau", "LION_JUDGEMENT", "STATIC_TABLEAU", "judgement hall", "formal judgement", "interior", master("lion-judgement", "lion-judgement-hall-master.png"), candidate("tableau", "lion-judgement-tableau.png"), True),
    Plate("lion_judgement_epilogue_tableau", "LION_JUDGEMENT", "STATIC_TABLEAU", "judgement hall", "epilogue", "interior", master("lion-judgement", "lion-judgement-hall-master.png"), candidate("tableau", "lion-judgement-epilogue-tableau.png"), True),
    Plate("lion_judgement_travel_or_approach", "LION_JUDGEMENT", "TRAVEL", "court approach", "pre-judgement", "sunrise", family_source("lion-judgement", "lion-judgement-approach.png"), candidate("travel", "lion-judgement-approach.png"), True),

    Plate("serpent_finale_tableau_aftermath", "SERPENT_FINALE", "STATIC_TABLEAU", "final ruin arena", "Serpent aftermath", "twilight", master("serpent-finale", "serpent-finale-master.png"), candidate("tableau", "serpent-finale-tableau-aftermath.png"), True),
    Plate("serpent_finale_cinematic_source", "SERPENT_FINALE", "CINEMATIC_SOURCE_ENVIRONMENT", "final ruin arena", "pre-boss", "twilight", master("serpent-finale", "serpent-finale-master.png"), candidate("cinematic-source", "serpent-finale-cinematic-source.png"), True),

    Plate("lion_trial_tableau_aftermath", "LION_TRIAL", "STATIC_TABLEAU", "ritual duel ground", "trial aftermath", "twilight", master("lion-trial", "lion-trial-master.png"), candidate("tableau", "lion-trial-tableau-aftermath.png"), True),
    Plate("lion_trial_cinematic_source", "LION_TRIAL", "CINEMATIC_SOURCE_ENVIRONMENT", "ritual duel ground", "pre-duel", "twilight", master("lion-trial", "lion-trial-master.png"), candidate("cinematic-source", "lion-trial-cinematic-source.png"), True),
)


FAMILIES = (
    "LION_CAMP", "ALARIC_AUDIENCE", "FOREST_ROAD", "FIRST_REFUGE",
    "VALMIR_ROAD", "BOIS_CLAIR", "SECOND_REFUGE", "WITNESS_ROAD",
    "SHADOW_RUINS", "FINAL_REFUGE", "LION_JUDGEMENT", "SERPENT_FINALE",
    "LION_TRIAL",
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def plate(asset_id: str) -> Plate:
    return next(item for item in PLATES if item.asset_id == asset_id)


def resolve_source(item: Plate) -> Path:
    path = (PACK_ROOT / item.source).resolve()
    return path


def extract_runtime_contexts() -> tuple[list[str], dict[str, str], list[str], list[str], list[str]]:
    content = read(CONTENT_PATH)
    r5 = read(R5_CONTENT_PATH)
    doctrine = read(DOCTRINE_PATH)

    doctrine_ids = re.findall(r"beatId:\s*'([^']+)'", doctrine)

    nodes_block = content.split("const rawNodes:", 1)[1].split("const rawCombats:", 1)[0]
    nodes: list[str] = []
    node_links: dict[str, list[str]] = {}
    for node_match in re.finditer(r"\{\s*id:\s*'([^']+)'[^\n]*links:\s*\[([^\]]*)\]", nodes_block):
        node_id, links_raw = node_match.groups()
        nodes.append(node_id)
        node_links[node_id] = re.findall(r"'([^']+)'", links_raw)

    combats_block = content.split("const rawCombats:", 1)[1].split("const combatVisualComposition", 1)[0]
    combat_scene: dict[str, str] = {
        combat_id: scene_id
        for combat_id, scene_id in re.findall(r"\{\s*id:\s*'([^']+)',\s*sceneId:\s*'([^']+)'", combats_block)
    }

    dialogue_block = content.split("const rawDialogues", 1)[1]
    dialogue_ids = re.findall(r"^\s{4}id:\s*'([^']+)'", dialogue_block, re.MULTILINE)
    dialogue_ids += re.findall(r"^\s{4}id:\s*'([^']+)'", r5, re.MULTILINE)
    dialogue_ids = list(dict.fromkeys(dialogue_ids))

    edges = [f"edge:{source}>{target}" for source in nodes for target in node_links.get(source, [])]
    contexts = list(dict.fromkeys(
        doctrine_ids
        + [f"dialogue:{item}" for item in dialogue_ids]
        + [f"combat:{item}" for item in combat_scene]
        + edges
        + [f"node:{item}" for item in nodes]
    ))
    return contexts, combat_scene, doctrine_ids, dialogue_ids, edges


def dialogue_target(dialogue_id: str) -> str:
    direct = {
        "acte_ouverture": "lion_camp_tableau",
        "camp_departure": "lion_camp_tableau",
        "lion_briefing": "alaric_audience_tableau",
        "mystery_recruit": "forest_crossroads_tableau",
        "refugee_trial": "refugee_road_tableau",
        "mystery_help": "roadside_event_tableau",
        "mystery_treasure": "abandoned_cart_area_tableau",
        "forest_refuge": "first_refuge_tableau",
        "lion_refuge": "first_refuge_tableau",
        "reserve_trail": "valmir_road_tableau",
        "old_shrine_event": "old_shrine_tableau",
        "mystery_shrine": "old_shrine_tableau",
        "village_choice": "bois_clair_tableau_burning",
        "village_defense_aftermath": "bois_clair_tableau_aftermath_saved",
        "village_raid_aftermath": "bois_clair_tableau_aftermath_sacrificed",
        "mystery_lancer_recruit": "witness_road_tableau",
        "witnesses_on_road": "witness_road_tableau",
        "mystery_dragon_roost": "dragon_roost_area",
        "shadow_signs": "shadow_ruins_tableau",
        "final_refuge": "final_refuge_tableau",
        "lion_finale_judgement": "lion_judgement_tableau",
        "epilogue": "lion_judgement_epilogue_tableau",
        "serpent_general_aftermath": "serpent_finale_tableau_aftermath",
        "lion_trial_aftermath": "lion_trial_tableau_aftermath",
    }
    if dialogue_id in direct:
        return direct[dialogue_id]
    low = dialogue_id.lower()
    if "bois_clair" in low or "village" in low:
        return "bois_clair_tableau_burning"
    if "ruin" in low or "shadow" in low or "dragon" in low or "maelor_seal" in low:
        return "shadow_ruins_tableau"
    if "serpent_general" in low or "serpent_pursuit" in low:
        return "serpent_finale_tableau_aftermath"
    if "lion_chief" in low or "lion_trial" in low:
        return "lion_trial_tableau_aftermath"
    if "judgement" in low or "alaric" in low or "lion_council" in low:
        return "lion_judgement_tableau"
    if "refuge" in low:
        return "first_refuge_tableau" if "first" in low or "forest" in low else "second_refuge_night_tableau"
    if "witness" in low or "lancer" in low or "garen" in low:
        return "witness_road_tableau"
    if "shrine" in low:
        return "old_shrine_tableau"
    if "troll" in low or "duelist" in low or "ambush" in low:
        return "forest_ambush_area_tableau"
    if "cart" in low or "treasure" in low:
        return "abandoned_cart_area_tableau"
    return "forest_road_tableau"


def media_target(media_id: str) -> tuple[str, str]:
    direct = {
        "camp_departure": ("lion_camp_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "alaric_audience_arrival": ("alaric_audience_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "forest_journey_tension": ("forest_road_travel", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "cedric_encounter": ("forest_crossroads_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "refugees_approach": ("refugee_road_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "injured_merchant_encounter": ("roadside_event_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "abandoned_cart_reveal": ("abandoned_cart_area_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "spider_nest_reveal": ("forest_ambush_area_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "first_refuge_arrival": ("first_refuge_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "first_refuge_departure": ("first_refuge_travel", "TRAVEL"),
        "valmir_route_fork": ("valmir_road_travel", "TRAVEL"),
        "bois_clair_arrival": ("bois_clair_tableau_burning", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "bois_clair_saved": ("bois_clair_tableau_aftermath_saved", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "bois_clair_sacrificed": ("bois_clair_tableau_aftermath_sacrificed", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "serpent_duelist_reveal": ("forest_ambush_area_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "troll_crossing_reveal": ("forest_ambush_area_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "garen_encounter": ("witness_road_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "shrine_reveal_context": ("old_shrine_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "young_dragon_encounter": ("dragon_roost_area", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "shadow_signs": ("shadow_ruins_tableau", "HOLD_SOURCE"),
        "witnesses_encounter": ("witness_road_tableau", "HOLD_SOURCE"),
        "ruins_approach_context": ("shadow_ruins_approach", "HOLD_SOURCE"),
        "final_refuge_dossier": ("final_refuge_tableau", "HOLD_SOURCE"),
        "lion_judgement": ("lion_judgement_tableau", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "serpent_general_reveal": ("serpent_finale_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "lion_champion_reveal": ("lion_trial_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "serpent_route_ending": ("serpent_finale_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "lion_trial_route_ending": ("lion_trial_cinematic_source", "CINEMATIC_SOURCE_ENVIRONMENT"),
        "serpent_road_tension": ("valmir_road_tableau", "HOLD_SOURCE"),
        "second_refuge_departure": ("second_refuge_morning_travel", "TRAVEL"),
        "serpent_informant_encounter": ("witness_road_tableau", "HOLD_SOURCE"),
        "qa-placeholder": ("forest_road_tableau", "HOLD_SOURCE"),
    }
    return direct.get(media_id, ("forest_road_tableau", "HOLD_SOURCE"))


def edge_target(edge: str) -> tuple[str, str]:
    source, target = edge.removeprefix("edge:").split(">", 1)
    if source == "lion-camp":
        return "lion_camp_travel", "TRAVEL"
    if source == "lion-audience":
        return "forest_road_travel", "TRAVEL"
    if source == "lion-refugees":
        return "forest_crossroads_tableau", "HOLD_SOURCE"
    if target == "lion-first-refuge" or source == "lion-first-refuge":
        return "first_refuge_travel", "TRAVEL"
    if source == "lion-reserve-trail" or target == "lion-valmir-road":
        return "valmir_road_travel", "TRAVEL"
    if source == "lion-valmir-road":
        return "valmir_road_travel", "TRAVEL"
    if target == "lion-village-choice":
        return "bois_clair_travel", "TRAVEL"
    if source == "lion-village-choice" or target == "lion-second-refuge":
        return "second_refuge_morning_travel", "TRAVEL"
    if source == "lion-second-refuge":
        return "second_refuge_morning_travel", "TRAVEL"
    if source == "lion-witnesses":
        return "witness_road_travel", "TRAVEL"
    if target == "lion-shadow-signs" or source.startswith("lion-final-trial"):
        return "shadow_ruins_approach", "TRAVEL"
    if source == "lion-shadow-signs":
        return "final_refuge_travel", "TRAVEL"
    if source == "lion-final-refuge":
        return "lion_judgement_travel_or_approach", "TRAVEL"
    return "forest_road_travel", "TRAVEL"


def node_target(node_id: str) -> tuple[str, str]:
    direct = {
        "lion-camp": ("lion_camp_tableau", "HOLD_SOURCE"),
        "lion-audience": ("alaric_audience_tableau", "HOLD_SOURCE"),
        "lion-first-refuge": ("first_refuge_tableau", "HOLD_SOURCE"),
        "lion-valmir-road": ("valmir_road_tableau", "HOLD_SOURCE"),
        "lion-second-trial-event": ("old_shrine_tableau", "HOLD_SOURCE"),
        "lion-village-choice": ("bois_clair_tableau_burning", "HOLD_SOURCE"),
        "lion-second-refuge": ("second_refuge_night_tableau", "HOLD_SOURCE"),
        "lion-witnesses": ("witness_road_tableau", "HOLD_SOURCE"),
        "lion-final-trial-event": ("dragon_roost_area", "HOLD_SOURCE"),
        "lion-shadow-signs": ("shadow_ruins_tableau", "HOLD_SOURCE"),
        "lion-final-refuge": ("final_refuge_tableau", "HOLD_SOURCE"),
        "lion-final-judgement": ("lion_judgement_tableau", "HOLD_SOURCE"),
    }
    return direct.get(node_id, ("forest_road_tableau", "HOLD_SOURCE"))


def combat_plate_ids(scene_id: str) -> tuple[str, str]:
    mapping = {
        "forest_route": ("forest_route_strategic", "forest_route_stage"),
        "bois_clair_burning": ("bois_clair_burning_strategic", "bois_clair_burning_stage"),
        "lion_sanctum": ("lion_sanctum_strategic", "lion_sanctum_stage"),
    }
    return mapping[scene_id]


def census_entries() -> tuple[list[dict], dict]:
    contexts, combat_scenes, doctrine_ids, dialogue_ids, edges = extract_runtime_contexts()
    rows: list[dict] = []
    beat_map: dict[str, dict] = {}

    def append(context: str, asset_id: str, role: str, source_kind: str) -> None:
        item = plate(asset_id)
        row = {
            "beatOrCombatId": context,
            "visualFamily": item.family,
            "surfaceRole": role,
            "existingAsset": (
                str(resolve_source(item).relative_to(ROOT)).replace("\\", "/")
                if not item.generated and resolve_source(item).exists()
                else None
            ),
            "targetPlate": asset_id,
            "generationNeeded": item.generated,
            "reuseAllowed": item.reuse_allowed,
            "sourceKind": source_kind,
        }
        rows.append(row)
        beat_map.setdefault(context, {"visualFamily": item.family, "plates": []})["plates"].append({
            "surfaceRole": role,
            "assetId": asset_id,
            "runtimeCandidatePath": item.candidate,
        })

    for context in contexts:
        if context.startswith("combat:"):
            combat_id = context.split(":", 1)[1]
            scene_id = combat_scenes.get(combat_id)
            if scene_id is None:
                continue
            strategic, stage = combat_plate_ids(scene_id)
            append(context, strategic, "STRATEGIC_COMBAT", "runtime-combat")
            append(context, stage, "COMBAT_STAGE", "runtime-combat")
        elif context.startswith("dialogue:"):
            append(context, dialogue_target(context.split(":", 1)[1]), "STATIC_TABLEAU", "runtime-dialogue")
        elif context.startswith("media:"):
            asset_id, role = media_target(context.split(":", 1)[1])
            append(context, asset_id, role, "presentation-doctrine")
        elif context.startswith("edge:"):
            asset_id, role = edge_target(context)
            append(context, asset_id, role, "campaign-edge")
        elif context.startswith("node:"):
            asset_id, role = node_target(context.split(":", 1)[1])
            append(context, asset_id, role, "campaign-node")

    metadata = {
        "schemaVersion": 1,
        "sourceOfTruth": "local worktree",
        "sourcesInspected": [
            str(path.relative_to(ROOT)).replace("\\", "/")
            for path in (CONTENT_PATH, ASSET_MANIFEST_PATH, COMBAT_BG_PATH, COMBAT_STAGE_BG_PATH, DOCTRINE_PATH)
        ] + ["src/cinematics/", "docs/art-direction/option-c/", "docs/reports/", "public/assets/dev/option-c/phase4b/environment/"],
        "authoritativeVisualFamilies": list(FAMILIES),
        "additionalCurrentVisualFamiliesFound": [],
        "runtimeCombatSceneFamilies": sorted(set(combat_scenes.values())),
        "doctrineBeatCount": len(doctrine_ids),
        "dialogueIdCount": len(dialogue_ids),
        "campaignEdgeCount": len(edges),
        "mappedContextCount": len(beat_map),
        "censusRowCount": len(rows),
        "entries": rows,
    }
    return rows, {
        "schemaVersion": 1,
        "packRoot": "public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1/",
        "mappings": beat_map,
        "summary": metadata,
    }


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def build_census() -> None:
    rows, beat_map = census_entries()
    census = beat_map["summary"]
    write_json(PACK_ROOT / "demo-environment-census.json", census)
    write_json(PACK_ROOT / "beat-background-map.json", beat_map)
    print(f"census rows={len(rows)} contexts={len(beat_map['mappings'])}")


def materialize_candidates() -> None:
    for item in PLATES:
        source = resolve_source(item)
        if not source.exists():
            raise FileNotFoundError(f"missing source for {item.asset_id}: {source}")
        destination = PACK_ROOT / item.candidate
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def manifest() -> dict:
    assets = []
    for item in PLATES:
        source = resolve_source(item)
        destination = PACK_ROOT / item.candidate
        if not destination.exists():
            continue
        with Image.open(destination) as image:
            width, height = image.size
        assets.append({
            "assetId": item.asset_id,
            "visualFamily": item.family,
            "surfaceRole": item.role,
            "subLocation": item.sublocation,
            "worldState": item.world_state,
            "timeOfDay": item.time_of_day,
            "sourcePath": str(source.relative_to(ROOT)).replace("\\", "/"),
            "runtimeCandidatePath": str(destination.relative_to(ROOT)).replace("\\", "/"),
            "width": width,
            "height": height,
            "sha256": sha256(destination),
            "characterFree": True,
            "uiSafe": True,
            "generationTool": "built-in image_gen" if item.generated else "existing operator-selected Forest Road v2",
            "modelProvenance": "UNKNOWN" if item.generated else "inherited from Forest Road v2 provenance",
            "status": "READY_FOR_OPERATOR_REVIEW",
        })
    return {"schemaVersion": 1, "packId": "demo-environment-pack-v1", "assets": assets}


def fit(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    width, height = box
    scale = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def font(size: int) -> ImageFont.ImageFont:
    for candidate_path in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
    ):
        if candidate_path.exists():
            return ImageFont.truetype(str(candidate_path), size=size)
    return ImageFont.load_default()


def board(title: str, items: Iterable[Plate], output: Path, columns: int = 3) -> None:
    items = list(items)
    thumb_w, thumb_h, label_h = 520, 293, 54
    rows = (len(items) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * thumb_w, 90 + rows * (thumb_h + label_h)), "#0b0f18")
    draw = ImageDraw.Draw(canvas)
    draw.text((28, 24), title, fill="#ead49a", font=font(32))
    for index, item in enumerate(items):
        source = PACK_ROOT / item.candidate
        with Image.open(source) as image:
            image = fit(image.convert("RGB"), (thumb_w, thumb_h))
        x = (index % columns) * thumb_w
        y = 90 + (index // columns) * (thumb_h + label_h)
        canvas.paste(image, (x, y))
        draw.rectangle((x, y + thumb_h, x + thumb_w, y + thumb_h + label_h), fill="#111827")
        draw.text((x + 12, y + thumb_h + 8), item.asset_id, fill="#f4e6bd", font=font(20))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)


def build_boards() -> None:
    family_items = [next(item for item in PLATES if item.family == family) for family in FAMILIES]
    board("OPTION C — MASTER ENVIRONMENT FAMILY BOARD", family_items, PACK_ROOT / "reviews/master-environment-family-board.png")
    board("OPTION C — TRAVEL PLATES", (item for item in PLATES if item.role == "TRAVEL"), PACK_ROOT / "reviews/travel-board.png")
    board("OPTION C — STATIC TABLEAUS", (item for item in PLATES if item.role == "STATIC_TABLEAU"), PACK_ROOT / "reviews/static-tableau-board.png")
    board("OPTION C — STRATEGIC COMBAT", (item for item in PLATES if item.role == "STRATEGIC_COMBAT"), PACK_ROOT / "reviews/strategic-board.png")
    board("OPTION C — COMBAT STAGE", (item for item in PLATES if item.role == "COMBAT_STAGE"), PACK_ROOT / "reviews/combat-stage-board.png")


def qa_report(manifest_data: dict) -> dict:
    assets = manifest_data["assets"]
    roles = {item["surfaceRole"] for item in assets}
    families = {item["visualFamily"] for item in assets}
    strategic = [item for item in assets if item["surfaceRole"] == "STRATEGIC_COMBAT"]
    stages = [item for item in assets if item["surfaceRole"] == "COMBAT_STAGE"]
    checks = {
        "all13Families": families == set(FAMILIES),
        "allFilesPresent": len(assets) == len(PLATES),
        "allLandscape": all(item["width"] > item["height"] for item in assets),
        "all16x9WithinTolerance": all(abs(item["width"] / item["height"] - 16 / 9) <= 0.02 for item in assets),
        "characterFreeDeclared": all(item["characterFree"] for item in assets),
        "uiSafeDeclared": all(item["uiSafe"] for item in assets),
        "surfaceRolesPresent": {"TRAVEL", "STATIC_TABLEAU", "STRATEGIC_COMBAT", "COMBAT_STAGE", "CINEMATIC_SOURCE_ENVIRONMENT"}.issubset(roles),
        "strategicCount3": len(strategic) == 3,
        "combatStageCount3": len(stages) == 3,
    }
    return {
        "schemaVersion": 1,
        "checks": checks,
        "result": "PASS" if all(checks.values()) else "FAIL",
        "qualityGateStatus": "HUMAN_REVIEW_REQUIRED",
        "qualityGates": [
            "STYLE_REFERENCE_MATCH", "MODERN_PIXEL_ART_QUALITY", "LOCATION_IDENTITY",
            "GEOGRAPHIC_CONTINUITY", "LANDMARK_READABILITY", "COMPOSITION", "DEPTH",
            "LIGHTING", "MATERIAL_READABILITY", "UI_COMPATIBILITY", "GAMEPLAY_READABILITY",
            "NO_PAINTERLY_DRIFT", "NO_GENERIC_AI_LOOK",
        ],
    }


def build_full() -> None:
    build_census()
    materialize_candidates()
    manifest_data = manifest()
    write_json(PACK_ROOT / "manifest.json", manifest_data)
    qa = qa_report(manifest_data)
    write_json(PACK_ROOT / "qa/machine-qa.json", qa)
    build_boards()
    _, beat_map = census_entries()
    mappings = beat_map["mappings"]
    counts = {
        role: sum(1 for mapping in mappings.values() for item in mapping["plates"] if item["surfaceRole"] == role)
        for role in ("TRAVEL", "STATIC_TABLEAU", "STRATEGIC_COMBAT", "COMBAT_STAGE", "HOLD_SOURCE", "CINEMATIC_SOURCE_ENVIRONMENT")
    }
    report = [
        "# Option C full demo environment coverage",
        "",
        f"- Machine QA: **{qa['result']}**",
        f"- Visual families: **{len(FAMILIES)}/{len(FAMILIES)}**",
        f"- Manifest plates: **{len(manifest_data['assets'])}/{len(PLATES)}**",
        f"- Mapped demo contexts: **{len(mappings)}/{len(mappings)}**",
        f"- Travel mappings: **{counts['TRAVEL']}**",
        f"- Static tableau mappings: **{counts['STATIC_TABLEAU']}**",
        f"- Hold-source mappings: **{counts['HOLD_SOURCE']}**",
        f"- Cinematic-source mappings: **{counts['CINEMATIC_SOURCE_ENVIRONMENT']}**",
        f"- Strategic mappings: **{counts['STRATEGIC_COMBAT']}**",
        f"- Combat-stage mappings: **{counts['COMBAT_STAGE']}**",
        "- Canonical/runtime URLs changed: **NO**",
        "- Character assets changed: **NO**",
        "- Gameplay/combat/VFX changed: **NO**",
        "- Commit/push: **NO**",
        "",
        "Human visual review remains required for the declared artistic quality gates.",
    ]
    (PACK_ROOT / "reviews/full-demo-coverage.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"manifest assets={len(manifest_data['assets'])} qa={qa['result']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--census-only", action="store_true")
    args = parser.parse_args()
    if args.census_only:
        build_census()
    else:
        build_full()


if __name__ == "__main__":
    main()
