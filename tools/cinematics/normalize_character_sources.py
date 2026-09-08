#!/usr/bin/env python3
"""Audit canonical cinematic character PNGs and build deterministic review renders.

The canonical files are opened read-only. Generated comparison images live under tmp/ and the
machine-readable measurements are written to the tracked CIN-6.6 scale registry.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageOps


CANONICAL_ROOT = Path("public/assets/characters/pixel/full")
METADATA_PATH = Path("tools/cinematics/specs/cinematic_character_scale.json")
REVIEW_ROOT = Path("tmp/cinematics/normalized-characters")
REVIEW_SIZE = (520, 700)
FOOT_BASELINE_Y = 650
REVIEW_REFERENCE_HEIGHT = 470
FRAMING_PROFILES = {
    "WIDE": {"referenceVisibleBodyHeightPx": 500, "description": "Two-to-four subject establishing geography."},
    "MEDIUM": {"referenceVisibleBodyHeightPx": 640, "description": "Two-subject conversational or reaction staging."},
    "CLOSE": {"referenceVisibleBodyHeightPx": 790, "description": "Restrained character focus; not a default framing."},
}

SMALL_BEASTS = {"cave_bat", "cave_rat", "forest_badger", "forest_viper", "marsh_toad", "river_crab"}
MEDIUM_BEASTS = {"forest_spider", "mountain_ram", "venom_serpent", "wild_boar", "wolf"}
LARGE_BEASTS = {"forest_troll_elite", "giant_mygale", "swamp_crocodile", "troll", "young_dragon_elite"}
UNDEAD = {"skeleton", "undead_champion"}
SPECTRAL = {"shrine_apparition"}

# Cinematic stature is deliberately curated instead of treating combat-stage height as literal
# anatomy. 1.0 is a typical adult human. Review renders preserve these differences.
RELATIVE_STATURE: dict[str, float] = {
    "alaric": 1.08, "aldric": 1.01, "alistair": 1.02, "cedric": 0.99,
    "chroniqueur": 0.98, "elara": 1.01, "eldwin": 1.00,
    "future_herbalist": 0.98, "future_lion_scribe": 0.96,
    "future_lion_spearman": 1.02, "future_shadow_envoy": 1.03,
    "goblin": 0.76, "gunnar": 1.05, "kestrel": 0.98, "lancer": 1.01,
    "lion_champion": 1.09, "lyra": 0.99, "maelor": 1.00, "marian": 1.00,
    "refugee_mother": 0.98, "sage_seraphine": 1.00, "seal_guardian": 1.13,
    "seraphine": 1.00, "serpent_brute": 1.13, "serpent_duelist_elite": 1.04,
    "serpent_general_boss": 1.18, "serpent_oracle": 1.01, "serpent_raider": 1.03,
    "survivor": 0.98, "talon": 1.00, "villageoise": 0.97,
    "wounded_merchant": 1.00,
    "cave_bat": 0.34, "cave_rat": 0.32, "forest_badger": 0.42,
    "forest_viper": 0.36, "marsh_toad": 0.40, "river_crab": 0.34,
    "forest_spider": 0.56, "mountain_ram": 0.72, "venom_serpent": 0.62,
    "wild_boar": 0.68, "wolf": 0.66, "forest_troll_elite": 1.22,
    "giant_mygale": 0.86, "swamp_crocodile": 0.76, "troll": 1.18,
    "young_dragon_elite": 1.24, "skeleton": 1.00, "undead_champion": 1.09,
    "shrine_apparition": 1.06,
}

MAJOR_HUMANS = [
    "alistair", "marian", "elara", "kestrel", "sage_seraphine", "seraphine",
    "alaric", "lion_champion", "cedric", "lancer", "maelor", "gunnar", "talon",
]


def find_project_root(start: Path) -> Path:
    current = start.resolve()
    while current != current.parent:
        if (current / "package.json").is_file():
            return current
        current = current.parent
    raise FileNotFoundError("Could not locate repository root.")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def category_for(character_id: str) -> str:
    if character_id in SMALL_BEASTS:
        return "BEAST_SMALL"
    if character_id in MEDIUM_BEASTS:
        return "BEAST_MEDIUM"
    if character_id in LARGE_BEASTS:
        return "BEAST_LARGE"
    if character_id in UNDEAD:
        return "UNDEAD"
    if character_id in SPECTRAL:
        return "SPECTRAL"
    if character_id in {"goblin", "seal_guardian"}:
        return "HUMANOID"
    return "HUMAN"


def inspect_asset(path: Path, root: Path) -> tuple[dict[str, Any], Image.Image]:
    character_id = path.stem
    with Image.open(path) as source:
        rgba = source.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError(f"{path} contains no visible alpha pixels.")
    left, top, right, bottom = bbox
    visible_width = right - left
    visible_height = bottom - top
    relative_stature = RELATIVE_STATURE.get(character_id, 1.0)
    review_height = round(REVIEW_REFERENCE_HEIGHT * relative_stature)
    trimmed = rgba.crop(bbox)
    review_width = max(1, round(trimmed.width * review_height / trimmed.height))
    rendered = trimmed.resize((review_width, review_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", REVIEW_SIZE, (18, 20, 27, 255))
    x = (REVIEW_SIZE[0] - rendered.width) // 2
    y = FOOT_BASELINE_Y - rendered.height
    canvas.alpha_composite(rendered, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.line((18, FOOT_BASELINE_Y, REVIEW_SIZE[0] - 18, FOOT_BASELINE_Y), fill=(235, 193, 99, 190), width=2)
    draw.text((16, 14), f"{character_id}  stature {relative_stature:.2f}", fill=(244, 233, 207, 255))
    entry = {
        "id": character_id,
        "asset": path.relative_to(root).as_posix(),
        "sourceSha256": sha256(path),
        "category": category_for(character_id),
        "relativeStature": relative_stature,
        "sourceWidth": rgba.width,
        "sourceHeight": rgba.height,
        "alphaBounds": {"left": left, "top": top, "right": right, "bottom": bottom},
        "visibleBodyWidth": visible_width,
        "visibleBodyHeight": visible_height,
        "footAnchor": {
            "sourceX": round((left + right - 1) / 2, 3),
            "sourceY": bottom - 1,
            "normalizedX": round(((left + right - 1) / 2) / rgba.width, 6),
            "normalizedY": round((bottom - 1) / rgba.height, 6),
        },
        "visualCenter": {
            "sourceX": round((left + right - 1) / 2, 3),
            "sourceY": round((top + bottom - 1) / 2, 3),
            "normalizedX": round(((left + right - 1) / 2) / rgba.width, 6),
            "normalizedY": round(((top + bottom - 1) / 2) / rgba.height, 6),
        },
        "transparentMargins": {
            "left": left, "top": top, "right": rgba.width - right, "bottom": rgba.height - bottom,
        },
        "reviewBodyHeightPx": review_height,
    }
    return entry, canvas.convert("RGB")


def write_contact_sheet(review_paths: dict[str, Path], output: Path) -> None:
    selected = [character_id for character_id in MAJOR_HUMANS if character_id in review_paths]
    thumb_size = (260, 350)
    columns = 4
    rows = (len(selected) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb_size[0], rows * thumb_size[1]), (10, 12, 17))
    for index, character_id in enumerate(selected):
        with Image.open(review_paths[character_id]) as review:
            thumb = ImageOps.fit(review.convert("RGB"), thumb_size, method=Image.Resampling.LANCZOS)
        sheet.paste(thumb, ((index % columns) * thumb_size[0], (index // columns) * thumb_size[1]))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True)


def build(project_root: Path) -> dict[str, Any]:
    canonical_root = project_root / CANONICAL_ROOT
    review_root = project_root / REVIEW_ROOT
    review_root.mkdir(parents=True, exist_ok=True)
    entries: list[dict[str, Any]] = []
    review_paths: dict[str, Path] = {}
    for path in sorted(canonical_root.glob("*.png"), key=lambda item: item.stem):
        entry, review = inspect_asset(path, project_root)
        output = review_root / f"{path.stem}.png"
        review.save(output, format="PNG", optimize=True)
        entries.append(entry)
        review_paths[path.stem] = output
    if not entries:
        raise ValueError(f"No PNG assets found under {canonical_root}.")
    write_contact_sheet(review_paths, review_root / "major-human-contact-sheet.png")
    return {
        "schemaVersion": 1,
        "canonicalRoot": CANONICAL_ROOT.as_posix() + "/",
        "canonicalFacing": "SCREEN_RIGHT",
        "measurementConvention": "alpha bounding box, centered foot anchor at last visible alpha row",
        "reviewConvention": {
            "canvasWidth": REVIEW_SIZE[0], "canvasHeight": REVIEW_SIZE[1],
            "footBaselineY": FOOT_BASELINE_Y, "referenceBodyHeightPx": REVIEW_REFERENCE_HEIGHT,
            "physicalHeightPolicy": "character-specific relativeStature; never uniform body height",
        },
        "framingProfiles": FRAMING_PROFILES,
        "characters": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate deterministic metadata without writing it.")
    args = parser.parse_args()
    project_root = find_project_root(Path(__file__).parent)
    metadata = build(project_root)
    encoded = json.dumps(metadata, indent=2, ensure_ascii=False) + "\n"
    metadata_path = project_root / METADATA_PATH
    if args.check:
        if not metadata_path.is_file() or metadata_path.read_text(encoding="utf-8") != encoded:
            raise SystemExit("Cinematic character scale metadata is stale; run normalize_character_sources.py.")
        print(f"PASS: {len(metadata['characters'])} canonical files match deterministic scale metadata.")
        return
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(encoded, encoding="utf-8")
    print(f"Wrote {len(metadata['characters'])} scale profiles and ignored normalized review renders.")


if __name__ == "__main__":
    main()
