from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
CANONICAL_ROOT = ROOT / "public/assets/combat-stage/poses"
OUT = ROOT / "public/assets/dev/option-c/combat-poses-v2/full-roster-rebuild"
POSES = ("idle", "dash", "attack", "skill")
REVIEW_CATEGORIES = {
    "PASS_CANDIDATE",
    "TARGETED_REPAIR",
    "MASTER_REPAIR",
    "WEAPON_REPAIR",
    "POSE_REPAIR",
    "SCALE_REVIEW",
    "REGENERATE",
}


ROSTER = {
    "alistair": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/warrior_sheet_4x1",
        "weapon": "greatsword",
        "target_core": 342,
    },
    "archer": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/archer_sheet_4x1",
        "weapon": "bow and coherent arrow",
        "target_core": 334,
    },
    "white_mage": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/white_mage_sheet_4x1",
        "weapon": "solar holy staff",
        "target_core": 336,
    },
    "dark_mage": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/dark_mage_sheet_4x1",
        "weapon": "grimoire and arcane focus",
        "target_core": 336,
    },
    "rogue": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/rogue_sheet_4x1",
        "weapon": "matched dual daggers",
        "target_core": 326,
    },
    "lancer": {
        "category": "HERO",
        "family": "STANDARD_HUMANOID",
        "canonical": "heroes/lancer_sheet_4x1",
        "weapon": "long spear",
        "target_core": 350,
    },
    "goblin": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_goblin_4x1_2560x768",
        "weapon": "short cleaver",
        "target_core": 228,
    },
    "forest_badger": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_badger_4x1_2560x768",
        "weapon": "claws and bite",
        "target_core": 190,
    },
    "cave_bat": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_bat_4x1_2560x768",
        "weapon": "fangs and wing-assisted dive",
        "target_core": 198,
        "airborne": True,
    },
    "wild_boar": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_boar_4x1_2560x768",
        "weapon": "tusks and charge",
        "target_core": 222,
    },
    "cave_rat": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_cave_rat_4x1_2560x768",
        "weapon": "fangs and bite",
        "target_core": 170,
    },
    "forest_spider": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_forest_spider_4x1_2560x768",
        "weapon": "fangs and forelegs",
        "target_core": 192,
    },
    "marsh_toad": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_marsh_toad_4x1_2560x768",
        "weapon": "tongue and poison projection",
        "target_core": 178,
    },
    "serpent_raider": {
        "category": "ENEMY",
        "family": "STANDARD_HUMANOID",
        "canonical": "enemies/enemy_masked_assassin_4x1_2560x768",
        "weapon": "dagger or short blade",
        "target_core": 326,
    },
    "serpent_brute": {
        "category": "ENEMY",
        "family": "STANDARD_HUMANOID",
        "canonical": "enemies/enemy_serpent_mace_knight_4x1_2560x768",
        "weapon": "heavy mace",
        "target_core": 352,
    },
    "serpent_oracle": {
        "category": "ENEMY",
        "family": "STANDARD_HUMANOID",
        "canonical": "enemies/enemy_serpent_mage_4x1_2560x768",
        "weapon": "ritual staff",
        "target_core": 332,
    },
    "skeleton": {
        "category": "ENEMY",
        "family": "STANDARD_HUMANOID",
        "canonical": "enemies/enemy_skeleton_4x1_2560x768",
        "weapon": "sword and shield",
        "target_core": 334,
    },
    "venom_serpent": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_venom_serpent_4x1_2560x768",
        "weapon": "fangs, venom, and bite",
        "target_core": 194,
    },
    "wolf": {
        "category": "ENEMY",
        "family": "SMALL_CREATURE",
        "canonical": "enemies/enemy_wolf_4x1_2560x768",
        "weapon": "fangs and pounce",
        "target_core": 220,
    },
    "lion_champion": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_lion_king_boss_4x1_2560x768",
        "weapon": "regal greatsword and lion-themed helmet or mask",
        "target_core": 404,
    },
    "young_dragon_elite": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_dragon_elite_4x1_2560x768",
        "weapon": "claws, maw, wings, and breath",
        "target_core": 410,
    },
    "forest_troll_elite": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_ogre_elite_4x1_2560x768",
        "weapon": "massive wooden club",
        "target_core": 414,
    },
    "serpent_general_boss": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_serpent_champion_4x1_2560x768",
        "weapon": "shield and command weapon",
        "target_core": 398,
    },
    "serpent_duelist_elite": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_serpent_duelist_elite_4x1_2560x768",
        "weapon": "matched dual blades",
        "target_core": 386,
    },
    "serpent_elite_brute": {
        "category": "ELITE_BOSS",
        "family": "LARGE_ELITE_BOSS",
        "canonical": "bosses/enemy_serpent_halberd_elite_4x1_2560x768",
        "weapon": "heavy curved blade",
        "target_core": 406,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rel(path: Path) -> str:
    absolute = path if path.is_absolute() else ROOT / path
    return absolute.resolve().relative_to(ROOT.resolve()).as_posix()


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def checker(size: tuple[int, int], block: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (38, 42, 51, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, x + block - 1, y + block - 1), fill=(52, 57, 67, 255))
    return image


def contain(image: Image.Image, size: tuple[int, int], method=Image.Resampling.LANCZOS) -> Image.Image:
    copy = image.convert("RGBA")
    copy.thumbnail(size, method)
    return copy


def clean_magenta(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int32)
    distance = np.sqrt(
        (rgb[:, :, 0] - 255) ** 2 + rgb[:, :, 1] ** 2 + (rgb[:, :, 2] - 255) ** 2
    )
    hard = distance <= 82
    fringe = (distance > 82) & (distance < 150) & (rgb[:, :, 0] > 150) & (rgb[:, :, 2] > 150)
    rgba[hard, 3] = 0
    fade = np.clip((distance[fringe] - 82) / 68, 0.0, 1.0)
    rgba[fringe, 3] = (rgba[fringe, 3].astype(np.float32) * fade).astype(np.uint8)
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba, "RGBA")


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()


def core_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 24 else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        return None
    extent = max(bbox[2] - bbox[0], bbox[3] - bbox[1])
    radius = max(2, round(extent * 0.012))
    kernel = radius * 2 + 1
    if kernel > 3:
        opened = alpha.filter(ImageFilter.MinFilter(kernel)).filter(ImageFilter.MaxFilter(kernel))
        opened_bbox = opened.getbbox()
        if opened_bbox is not None:
            bbox = opened_bbox
    return bbox


def box_size(box: tuple[int, int, int, int]) -> tuple[int, int]:
    return box[2] - box[0], box[3] - box[1]


def normalize_master(unit: str, source: Path, prompt_file: Path) -> dict:
    spec = ROSTER[unit]
    raw = Image.open(source).convert("RGBA")
    clean = clean_magenta(raw)
    full = alpha_bbox(clean)
    core = core_bbox(clean)
    if full is None or core is None:
        raise RuntimeError(f"{unit}: no subject detected after magenta cleanup")

    core_w, core_h = box_size(core)
    full_w, full_h = box_size(full)
    target_core = int(spec["target_core"])
    authored_scale = target_core / max(core_w, core_h)
    projected_full = (round(full_w * authored_scale), round(full_h * authored_scale))
    safe_limit = 488
    safe = projected_full[0] <= safe_limit and projected_full[1] <= safe_limit
    applied_scale = authored_scale if safe else min(authored_scale, safe_limit / max(full_w, full_h))
    scale_limited_by_extreme = applied_scale + 1e-7 < authored_scale

    resized = clean.resize(
        (max(1, round(raw.width * applied_scale)), max(1, round(raw.height * applied_scale))),
        Image.Resampling.NEAREST,
    )
    scaled_full = alpha_bbox(resized)
    scaled_core = core_bbox(resized)
    if scaled_full is None or scaled_core is None:
        raise RuntimeError(f"{unit}: normalized subject vanished")

    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    core_center_x = (scaled_core[0] + scaled_core[2]) / 2
    core_bottom = scaled_core[3]
    baseline = 456
    airborne_offset = 104 if spec.get("airborne") else 0
    x = round(256 - core_center_x)
    y = round(baseline - airborne_offset - core_bottom)

    left, top, right, bottom = (
        x + scaled_full[0],
        y + scaled_full[1],
        x + scaled_full[2],
        y + scaled_full[3],
    )
    margin = 12
    if left < margin:
        x += margin - left
    if right > 512 - margin:
        x -= right - (512 - margin)
    if top < margin:
        y += margin - top
    if bottom > 512 - margin:
        y -= bottom - (512 - margin)
    canvas.alpha_composite(resized, (x, y))

    master_path = OUT / "masters" / f"{unit}-master.png"
    clean_path = OUT / "raw/masters" / f"{unit}-clean.png"
    raw_path = OUT / "raw/masters" / f"{unit}-raw.png"
    shutil.copy2(source, raw_path)
    clean.save(clean_path)
    canvas.save(master_path)

    output_full = alpha_bbox(canvas)
    output_core = core_bbox(canvas)
    assert output_full is not None and output_core is not None
    metrics = {
        "unitId": unit,
        "family": spec["family"],
        "weaponOrAnatomy": spec["weapon"],
        "canvas": [512, 512],
        "baseline": baseline,
        "pivot": [256, baseline],
        "airborneOffset": airborne_offset,
        "targetCoreExtentPx": target_core,
        "sourceDimensions": list(raw.size),
        "sourceAlphaBBox": list(full),
        "sourceCoreBBox": list(core),
        "authoredBodyMassScale": authored_scale,
        "appliedScale": applied_scale,
        "scaleLimitedByExtremeAppendage": scale_limited_by_extreme,
        "normalizedAlphaBBox": list(output_full),
        "normalizedCoreBBox": list(output_core),
        "normalizedCoreExtentPx": max(box_size(output_core)),
        "transparentMargins": [output_full[0], output_full[1], 512 - output_full[2], 512 - output_full[3]],
        "safeMarginsPass": min(output_full[0], output_full[1], 512 - output_full[2], 512 - output_full[3]) >= 8,
        "rawPath": rel(raw_path),
        "cleanPath": rel(clean_path),
        "masterPath": rel(master_path),
        "promptPath": rel(prompt_file),
        "rawSha256": sha256(raw_path),
        "masterSha256": sha256(master_path),
        "perPoseAutoScaling": False,
        "fitToContent": False,
    }
    (OUT / "manifests/master-metrics" / f"{unit}.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )
    return metrics


def split_board_cells(image: Image.Image) -> list[Image.Image]:
    width, height = image.size
    xs = (0, width // 2, width)
    ys = (0, height // 2, height)
    return [
        image.crop((xs[col], ys[row], xs[col + 1], ys[row + 1]))
        for row in range(2)
        for col in range(2)
    ]


def remove_small_edge_components(
    image: Image.Image,
    edge: int = 2,
    max_component_area: int | None = None,
) -> tuple[Image.Image, list[dict]]:
    """Remove only small, disconnected generation bleed anchored to a 2x2 cell edge."""
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    mask = rgba[:, :, 3] > 12
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    seeds: list[tuple[int, int]] = []
    for y in range(height):
        for x in (*range(edge), *range(width - edge, width)):
            if mask[y, x] and not visited[y, x]:
                seeds.append((y, x))
    for x in range(width):
        for y in (*range(edge), *range(height - edge, height)):
            if mask[y, x] and not visited[y, x]:
                seeds.append((y, x))

    removed: list[dict] = []
    total_alpha = int(mask.sum())
    for seed_y, seed_x in seeds:
        if visited[seed_y, seed_x] or not mask[seed_y, seed_x]:
            continue
        queue = deque([(seed_y, seed_x)])
        visited[seed_y, seed_x] = True
        pixels: list[tuple[int, int]] = []
        min_x = max_x = seed_x
        min_y = max_y = seed_y
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))
        component_w = max_x - min_x + 1
        component_h = max_y - min_y + 1
        component_area = len(pixels)
        area_limit = max_component_area if max_component_area is not None else max(2200, round(total_alpha * 0.035))
        small_area = component_area <= area_limit
        narrow_fragment = min(component_w, component_h) <= 72
        if small_area and narrow_fragment:
            ys = np.fromiter((item[0] for item in pixels), dtype=np.int32)
            xs = np.fromiter((item[1] for item in pixels), dtype=np.int32)
            rgba[ys, xs] = 0
            removed.append({
                "bbox": [min_x, min_y, max_x + 1, max_y + 1],
                "alphaPixels": component_area,
            })
    return Image.fromarray(rgba, "RGBA"), removed


def process_board(unit: str, source: Path, prompt_file: Path) -> dict:
    spec = ROSTER[unit]
    master = Image.open(OUT / "masters" / f"{unit}-master.png").convert("RGBA")
    master_core = core_bbox(master)
    if master_core is None:
        raise RuntimeError(f"{unit}: normalized master missing")
    master_core_extent = max(box_size(master_core))

    raw = Image.open(source).convert("RGBA")
    clean = clean_magenta(raw)
    raw_cells = split_board_cells(clean)
    cells: list[Image.Image] = []
    edge_cleanup: list[list[dict]] = []
    for cell in raw_cells:
        cleaned_cell, removed = remove_small_edge_components(cell)
        cells.append(cleaned_cell)
        edge_cleanup.append(removed)
    idle_core = core_bbox(cells[0])
    if idle_core is None:
        raise RuntimeError(f"{unit}: idle cell has no subject")
    board_idle_core_extent = max(box_size(idle_core))
    shared_scale = master_core_extent / board_idle_core_extent

    out_frames: list[Image.Image] = []
    pose_metrics: list[dict] = []
    baseline = 456
    airborne_offset = 104 if spec.get("airborne") else 0
    for pose_index, (pose, cell) in enumerate(zip(POSES, cells, strict=True)):
        before_full = alpha_bbox(cell)
        before_core = core_bbox(cell)
        if before_full is None or before_core is None:
            raise RuntimeError(f"{unit}/{pose}: no subject")
        source_edge_touch = (
            before_full[0] <= 2
            or before_full[1] <= 2
            or before_full[2] >= cell.width - 2
            or before_full[3] >= cell.height - 2
        )
        scaled = cell.resize(
            (max(1, round(cell.width * shared_scale)), max(1, round(cell.height * shared_scale))),
            Image.Resampling.NEAREST,
        )
        scaled_full = alpha_bbox(scaled)
        scaled_core = core_bbox(scaled)
        if scaled_full is None or scaled_core is None:
            raise RuntimeError(f"{unit}/{pose}: scaled subject vanished")
        frame = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        core_center_x = (scaled_core[0] + scaled_core[2]) / 2
        core_bottom = scaled_core[3]
        x = round(256 - core_center_x)
        y = round(baseline - airborne_offset - core_bottom)

        left, top, right, bottom = (
            x + scaled_full[0],
            y + scaled_full[1],
            x + scaled_full[2],
            y + scaled_full[3],
        )
        margin = 8
        if left < margin:
            x += margin - left
        if right > 512 - margin:
            x -= right - (512 - margin)
        if top < margin:
            y += margin - top
        if bottom > 512 - margin:
            y -= bottom - (512 - margin)
        frame.alpha_composite(scaled, (x, y))
        targeted_output_cleanup: list[dict] = []
        if unit == "alistair" and pose == "skill":
            frame, targeted_output_cleanup = remove_small_edge_components(frame, edge=90, max_component_area=10000)
        output_full = alpha_bbox(frame)
        output_core = core_bbox(frame)
        if output_full is None or output_core is None:
            raise RuntimeError(f"{unit}/{pose}: output empty")
        margins = [output_full[0], output_full[1], 512 - output_full[2], 512 - output_full[3]]
        clipped_after_transform = min(margins) <= 0
        path = OUT / "split-poses" / unit / f"{unit}-{pose}.png"
        frame.save(path)
        out_frames.append(frame)
        pose_metrics.append(
            {
                "pose": pose,
                "path": rel(path),
                "sha256": sha256(path),
                "sourceCellDimensions": list(cell.size),
                "sourceAlphaBBox": list(before_full),
                "sourceCoreBBox": list(before_core),
                "sourceEdgeTouch": source_edge_touch,
                "removedEdgeFragments": edge_cleanup[pose_index],
                "targetedOutputEdgeCleanup": targeted_output_cleanup,
                "sharedScale": shared_scale,
                "outputAlphaBBox": list(output_full),
                "outputCoreBBox": list(output_core),
                "outputCoreExtentPx": max(box_size(output_core)),
                "transparentMargins": margins,
                "cropped": clipped_after_transform,
            }
        )

    board = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for index, frame in enumerate(out_frames):
        board.alpha_composite(frame, ((index % 2) * 512, (index // 2) * 512))
    board_path = OUT / "boards-2x2" / f"{unit}-board.png"
    raw_path = OUT / "raw/boards-2x2" / f"{unit}-raw.png"
    clean_path = OUT / "raw/boards-2x2" / f"{unit}-clean.png"
    if source.resolve() != raw_path.resolve():
        shutil.copy2(source, raw_path)
    clean.save(clean_path)
    board.save(board_path)
    metrics = {
        "unitId": unit,
        "canvasPerPose": [512, 512],
        "boardCanvas": [1024, 1024],
        "masterCoreExtentPx": master_core_extent,
        "boardIdleCoreExtentPx": board_idle_core_extent,
        "sharedBoardToMasterScale": shared_scale,
        "perPoseAutoScaling": False,
        "fitToContent": False,
        "scaleCorrectionOverride": 0,
        "rawPath": rel(raw_path),
        "cleanPath": rel(clean_path),
        "boardPath": rel(board_path),
        "promptPath": rel(prompt_file),
        "rawSha256": sha256(raw_path),
        "boardSha256": sha256(board_path),
        "poses": pose_metrics,
    }
    (OUT / "manifests/board-metrics" / f"{unit}.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )
    return metrics


def build_master_review() -> None:
    missing = [unit for unit in ROSTER if not (OUT / "masters" / f"{unit}-master.png").is_file()]
    if missing:
        raise RuntimeError(f"missing masters: {missing}")
    cols, rows = 5, 5
    tile_w, tile_h, header = 420, 410, 88
    display_scale = 0.66
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "FULL ROSTER REBUILD — NORMALIZED MASTERS", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "Uniform display transform; body-mass families remain directly comparable.", font=font(18), fill=(164, 190, 216, 255))
    family_colors = {
        "SMALL_CREATURE": (104, 205, 150, 255),
        "STANDARD_HUMANOID": (102, 174, 245, 255),
        "LARGE_ELITE_BOSS": (244, 179, 76, 255),
    }
    for index, (unit, spec) in enumerate(ROSTER.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        tile = checker((tile_w, tile_h - 52), 14)
        canvas.alpha_composite(tile, (x, y))
        sprite = Image.open(OUT / "masters" / f"{unit}-master.png").convert("RGBA")
        side = round(512 * display_scale)
        shown = sprite.resize((side, side), Image.Resampling.NEAREST)
        px = x + (tile_w - side) // 2
        py = y + 342 - round(456 * display_scale)
        canvas.alpha_composite(shown, (px, py))
        draw.line((x + 10, y + 342, x + tile_w - 10, y + 342), fill=(224, 85, 88, 180), width=2)
        color = family_colors[str(spec["family"])]
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=color, width=2)
        draw.text((x + 12, y + tile_h - 48), unit, font=font(17, True), fill=(239, 242, 247, 255))
        draw.text((x + 12, y + tile_h - 25), f"{spec['family']}  core={spec['target_core']}px", font=font(13), fill=color)
    target = OUT / "qa/master-roster-board.png"
    canvas.save(target)

    metrics = [json.loads((OUT / "manifests/master-metrics" / f"{unit}.json").read_text(encoding="utf-8")) for unit in ROSTER]
    summary = {
        "status": "PASS_MACHINE_AWAITING_VISUAL_REVIEW",
        "masters": len(metrics),
        "expectedMasters": 25,
        "commonCanvas": all(item["canvas"] == [512, 512] for item in metrics),
        "commonBaseline": all(item["baseline"] == 456 for item in metrics),
        "commonPivotX": all(item["pivot"][0] == 256 for item in metrics),
        "safeMarginsFailures": [item["unitId"] for item in metrics if not item["safeMarginsPass"]],
        "scaleLimitedByExtremeAppendage": [item["unitId"] for item in metrics if item["scaleLimitedByExtremeAppendage"]],
        "perPoseAutoScalingUsed": False,
        "fitToContentUsed": False,
        "reviewBoard": rel(target),
    }
    (OUT / "qa/master-normalization-validation.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


def draw_sprite_on_review_tile(
    canvas: Image.Image,
    sprite: Image.Image,
    origin: tuple[int, int],
    tile_size: tuple[int, int],
    scale: float,
    baseline_y: int,
) -> None:
    shown_side = round(512 * scale)
    shown = sprite.convert("RGBA").resize((shown_side, shown_side), Image.Resampling.NEAREST)
    x = origin[0] + (tile_size[0] - shown_side) // 2
    y = origin[1] + baseline_y - round(456 * scale)
    canvas.alpha_composite(shown, (x, y))


def build_pose_roster_review(pose: str) -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 380, 390, 88
    scale = 0.61
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), f"FULL ROSTER — {pose.upper()} REVIEW", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "One uniform display transform; normalized body scale is preserved across the roster.", font=font(18), fill=(164, 190, 216, 255))
    family_colors = {
        "SMALL_CREATURE": (104, 205, 150, 255),
        "STANDARD_HUMANOID": (102, 174, 245, 255),
        "LARGE_ELITE_BOSS": (244, 179, 76, 255),
    }
    for index, (unit, spec) in enumerate(ROSTER.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 48), 14), (x, y))
        sprite = Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
        draw_sprite_on_review_tile(canvas, sprite, (x, y), (tile_w, tile_h - 48), scale, 330)
        draw.line((x + 8, y + 330, x + tile_w - 8, y + 330), fill=(224, 85, 88, 180), width=2)
        color = family_colors[str(spec["family"])]
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=color, width=2)
        draw.text((x + 10, y + tile_h - 42), unit, font=font(16, True), fill=(239, 242, 247, 255))
        draw.text((x + 10, y + tile_h - 22), str(spec["family"]), font=font(12), fill=color)
    target = OUT / "qa" / f"{pose}-roster-board.png"
    canvas.save(target)
    return target


def build_four_pose_roster_review() -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 390, 410, 88
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "FULL ROSTER — FOUR-POSE REVIEW", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "TL idle · TR dash · BL attack · BR skill/cast", font=font(18), fill=(164, 190, 216, 255))
    for index, unit in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 44), 12), (x, y))
        board = Image.open(OUT / "boards-2x2" / f"{unit}-board.png").convert("RGBA")
        shown = board.resize((350, 350), Image.Resampling.NEAREST)
        canvas.alpha_composite(shown, (x + 20, y + 4))
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 12, y + tile_h - 37), unit, font=font(16, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/four-pose-roster-board.png"
    canvas.save(target)
    return target


def build_relative_scale_review() -> Path:
    grouped = {
        family: [unit for unit, spec in ROSTER.items() if spec["family"] == family]
        for family in ("SMALL_CREATURE", "STANDARD_HUMANOID", "LARGE_ELITE_BOSS")
    }
    width, header, band_h, slot_w = 2600, 100, 510, 250
    canvas = Image.new("RGBA", (width, header + band_h * 3), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "RELATIVE SCALE — SHARED BASELINE AND DISPLAY SCALE", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "Masters only; no fit-to-content. Family hierarchy is intentionally visible.", font=font(18), fill=(164, 190, 216, 255))
    colors = {
        "SMALL_CREATURE": (104, 205, 150, 255),
        "STANDARD_HUMANOID": (102, 174, 245, 255),
        "LARGE_ELITE_BOSS": (244, 179, 76, 255),
    }
    scale = 0.60
    for band, (family, units) in enumerate(grouped.items()):
        y = header + band * band_h
        canvas.alpha_composite(checker((width, band_h), 16), (0, y))
        baseline = y + 420
        draw.text((18, y + 12), family, font=font(22, True), fill=colors[family])
        draw.line((0, baseline, width, baseline), fill=(224, 85, 88, 220), width=3)
        offset = (width - len(units) * slot_w) // 2
        for idx, unit in enumerate(units):
            x = offset + idx * slot_w
            sprite = Image.open(OUT / "masters" / f"{unit}-master.png")
            draw_sprite_on_review_tile(canvas, sprite, (x, y), (slot_w, band_h), scale, 420)
            draw.text((x + 5, y + 455), unit, font=font(14, True), fill=(239, 242, 247, 255))
            draw.text((x + 5, y + 477), f"core {ROSTER[unit]['target_core']}px", font=font(12), fill=colors[family])
    target = OUT / "qa/relative-scale-board.png"
    canvas.save(target)
    return target


def build_weapon_anatomy_review() -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 560, 390, 88
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "WEAPON / ANATOMY LOCK — MASTER vs ATTACK", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "Left: normalized master · Right: attack contact pose", font=font(18), fill=(164, 190, 216, 255))
    scale = 0.46
    for index, (unit, spec) in enumerate(ROSTER.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 66), 14), (x, y))
        master = Image.open(OUT / "masters" / f"{unit}-master.png")
        attack = Image.open(OUT / "split-poses" / unit / f"{unit}-attack.png")
        draw_sprite_on_review_tile(canvas, master, (x, y), (tile_w // 2, tile_h - 66), scale, 306)
        draw_sprite_on_review_tile(canvas, attack, (x + tile_w // 2, y), (tile_w // 2, tile_h - 66), scale, 306)
        draw.line((x + tile_w // 2, y, x + tile_w // 2, y + tile_h - 66), fill=(101, 116, 139, 255), width=2)
        draw.line((x + 8, y + 306, x + tile_w - 8, y + 306), fill=(224, 85, 88, 180), width=2)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 10, y + tile_h - 59), unit, font=font(16, True), fill=(239, 242, 247, 255))
        draw.text((x + 10, y + tile_h - 36), str(spec["weapon"]), font=font(13), fill=(187, 204, 224, 255))
    target = OUT / "qa/weapon-anatomy-review-board.png"
    canvas.save(target)
    return target


def build_unit_qa_board(unit: str) -> Path:
    width, height, panel = 1500, 360, 300
    canvas = Image.new("RGBA", (width, height), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    labels = ("MASTER", "IDLE", "DASH", "ATTACK", "SKILL")
    paths = [OUT / "masters" / f"{unit}-master.png"] + [
        OUT / "split-poses" / unit / f"{unit}-{pose}.png" for pose in POSES
    ]
    for idx, (label, path) in enumerate(zip(labels, paths, strict=True)):
        x = idx * panel
        canvas.alpha_composite(checker((panel, 310), 12), (x, 0))
        draw_sprite_on_review_tile(canvas, Image.open(path), (x, 0), (panel, 310), 0.54, 288)
        draw.line((x + 6, 288, x + panel - 6, 288), fill=(224, 85, 88, 180), width=2)
        draw.rectangle((x, 0, x + panel - 1, height - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 10, 316), label, font=font(16, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/per-unit" / f"{unit}-qa.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target)
    return target


def build_review_package() -> dict:
    missing = []
    for unit in ROSTER:
        if not (OUT / "masters" / f"{unit}-master.png").is_file():
            missing.append(f"master:{unit}")
        if not (OUT / "boards-2x2" / f"{unit}-board.png").is_file():
            missing.append(f"board:{unit}")
        for pose in POSES:
            if not (OUT / "split-poses" / unit / f"{unit}-{pose}.png").is_file():
                missing.append(f"pose:{unit}:{pose}")
    if missing:
        raise RuntimeError(f"incomplete output set: {missing}")

    boards = {"master": OUT / "qa/master-roster-board.png"}
    for pose in POSES:
        boards[pose] = build_pose_roster_review(pose)
    boards["fourPose"] = build_four_pose_roster_review()
    boards["relativeScale"] = build_relative_scale_review()
    boards["weaponAnatomy"] = build_weapon_anatomy_review()
    per_unit = {unit: build_unit_qa_board(unit) for unit in ROSTER}
    result = {
        "status": "REVIEW_PACKAGE_COMPLETE_AWAITING_STRICT_CLASSIFICATION",
        "roster": len(ROSTER),
        "masters": sum((OUT / "masters" / f"{unit}-master.png").is_file() for unit in ROSTER),
        "boards": sum((OUT / "boards-2x2" / f"{unit}-board.png").is_file() for unit in ROSTER),
        "poses": sum((OUT / "split-poses" / unit / f"{unit}-{pose}.png").is_file() for unit in ROSTER for pose in POSES),
        "reviewBoards": {key: rel(path) for key, path in boards.items()},
        "perUnitQaBoards": {unit: rel(path) for unit, path in per_unit.items()},
    }
    (OUT / "qa/review-package.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return result


def image_record(path: Path) -> dict:
    with Image.open(path) as image:
        dimensions = list(image.size)
        mode = image.mode
    return {"path": rel(path), "sha256": sha256(path), "dimensions": dimensions, "mode": mode}


def finalize_package(classification_file: Path) -> dict:
    classifications = json.loads(classification_file.read_text(encoding="utf-8"))
    if set(classifications) != set(ROSTER):
        missing = sorted(set(ROSTER) - set(classifications))
        extra = sorted(set(classifications) - set(ROSTER))
        raise RuntimeError(f"classification roster mismatch: missing={missing}, extra={extra}")
    invalid = {
        unit: record.get("category")
        for unit, record in classifications.items()
        if record.get("category") not in REVIEW_CATEGORIES
    }
    if invalid:
        raise RuntimeError(f"invalid review categories: {invalid}")

    reference_audit = json.loads((OUT / "manifests/reference-audit.json").read_text(encoding="utf-8"))
    canonical_hash_failures: list[str] = []
    canonical_sources = 0
    for unit_record in reference_audit["units"]:
        for source in unit_record["sources"]:
            canonical_sources += 1
            current = ROOT / source["path"]
            if not current.is_file() or sha256(current) != source["sha256"]:
                canonical_hash_failures.append(source["path"])
    style_path = ROOT / reference_audit["artStyleAuthority"]["path"]
    style_hash_pass = (
        style_path.is_file()
        and sha256(style_path) == reference_audit["artStyleAuthority"]["sha256"]
        and sha256(style_path) == "e4470e9506df2f4c84af286060e85b69983c87cb5bba27d1bb576f50847b7bd7"
    )

    unit_manifest_dir = OUT / "manifests/units"
    unit_manifest_dir.mkdir(parents=True, exist_ok=True)
    unit_summaries: list[dict] = []
    machine_crops: list[str] = []
    scale_overrides = 0
    edge_fragments_removed = 0
    for unit, spec in ROSTER.items():
        master_metrics = json.loads((OUT / "manifests/master-metrics" / f"{unit}.json").read_text(encoding="utf-8"))
        board_metrics = json.loads((OUT / "manifests/board-metrics" / f"{unit}.json").read_text(encoding="utf-8"))
        scale_overrides += int(board_metrics["scaleCorrectionOverride"] != 0)
        for pose in board_metrics["poses"]:
            if pose["cropped"]:
                machine_crops.append(f"{unit}:{pose['pose']}")
            edge_fragments_removed += len(pose.get("removedEdgeFragments", []))
            edge_fragments_removed += len(pose.get("targetedOutputEdgeCleanup", []))
        master_path = OUT / "masters" / f"{unit}-master.png"
        board_path = OUT / "boards-2x2" / f"{unit}-board.png"
        pose_records = {
            pose: image_record(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
            for pose in POSES
        }
        all_pose_dimensions_pass = all(record["dimensions"] == [512, 512] for record in pose_records.values())
        manifest = {
            "schemaVersion": 1,
            "mission": "Option C full 25-unit roster rebuild",
            "unitId": unit,
            "category": spec["category"],
            "scaleFamily": spec["family"],
            "weaponOrAnatomyLock": spec["weapon"],
            "artStyleAuthority": reference_audit["artStyleAuthority"],
            "canonicalIdentityReference": next(item for item in reference_audit["units"] if item["unitId"] == unit),
            "master": image_record(master_path),
            "board2x2": image_record(board_path),
            "poses": pose_records,
            "prompts": {
                "master": rel(OUT / "manifests/master-prompts" / f"{unit}.txt"),
                "board": rel(OUT / "manifests/board-prompts" / f"{unit}.txt"),
            },
            "metrics": {
                "master": rel(OUT / "manifests/master-metrics" / f"{unit}.json"),
                "board": rel(OUT / "manifests/board-metrics" / f"{unit}.json"),
            },
            "qaBoard": rel(OUT / "qa/per-unit" / f"{unit}-qa.png"),
            "pipelineDoctrine": {
                "masterNormalizedBeforePoses": True,
                "commonMasterCanvas": [512, 512],
                "commonBaseline": 456,
                "commonPivotX": 256,
                "perPoseAutoScalingUsed": False,
                "fitToContentUsed": False,
                "sharedBoardToMasterScale": board_metrics["sharedBoardToMasterScale"],
                "scaleCorrectionOverride": board_metrics["scaleCorrectionOverride"],
            },
            "machineValidation": {
                "masterDimensionsPass": image_record(master_path)["dimensions"] == [512, 512],
                "boardDimensionsPass": image_record(board_path)["dimensions"] == [1024, 1024],
                "poseDimensionsPass": all_pose_dimensions_pass,
                "outputCropFlags": [pose["pose"] for pose in board_metrics["poses"] if pose["cropped"]],
                "allOutputsNonEmpty": all(alpha_bbox(Image.open(ROOT / record["path"]).convert("RGBA")) is not None for record in pose_records.values()),
            },
            "operatorClassification": classifications[unit],
        }
        manifest_path = unit_manifest_dir / f"{unit}.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        unit_summaries.append({
            "unitId": unit,
            "classification": classifications[unit]["category"],
            "reason": classifications[unit]["reason"],
            "manifest": rel(manifest_path),
            "qaBoard": manifest["qaBoard"],
        })

    classification_counts = {
        category: sum(record["category"] == category for record in classifications.values())
        for category in sorted(REVIEW_CATEGORIES)
    }
    cropping_issues = [
        f"{unit}:{issue}"
        for unit, record in classifications.items()
        for issue in record["issues"].get("cropping", [])
    ]
    scale_issues = [
        f"{unit}:{issue}"
        for unit, record in classifications.items()
        for issue in record["issues"].get("scale", [])
    ]
    weapon_issues = [
        f"{unit}:{issue}"
        for unit, record in classifications.items()
        for issue in record["issues"].get("weapon", [])
    ]
    pose_issues = [
        f"{unit}:{issue}"
        for unit, record in classifications.items()
        for issue in record["issues"].get("pose", [])
    ]
    other_issues = [
        f"{unit}:{issue}"
        for unit, record in classifications.items()
        for issue in record["issues"].get("other", [])
    ]
    follow_up = [unit for unit in ROSTER if classifications[unit]["category"] != "PASS_CANDIDATE"]
    review_package = json.loads((OUT / "qa/review-package.json").read_text(encoding="utf-8"))
    batch = {
        "schemaVersion": 1,
        "status": "REVIEW_PACKAGE_COMPLETE_WITH_FOLLOW_UP" if follow_up else "PASS_CANDIDATE_PACKAGE_COMPLETE",
        "mission": "Option C full 25-unit roster rebuild from corrected normalized masters",
        "artStyleAuthority": reference_audit["artStyleAuthority"],
        "counts": {
            "totalRosterProcessed": 25,
            "expectedRoster": 25,
            "mastersRebuilt": 25,
            "expectedMasters": 25,
            "fourPoseBoards": 25,
            "expectedFourPoseBoards": 25,
            "finalPoses": 100,
            "expectedFinalPoses": 100,
            "perUnitManifests": 25,
            "canonicalIdentitySourcesVerified": canonical_sources,
            "edgeBleedFragmentsRemoved": edge_fragments_removed,
        },
        "pipeline": {
            "masterNormalizationCompleted": True,
            "mastersCompletedBeforePoseProduction": True,
            "perPoseAutoScalingUsed": False,
            "fitToContentUsed": False,
            "scaleCorrectionOverridesUsed": scale_overrides,
        },
        "remainingIssues": {
            "cropping": cropping_issues,
            "machineCropFlags": machine_crops,
            "scaleHierarchy": scale_issues,
            "weaponOrAnatomy": weapon_issues,
            "pose": pose_issues,
            "other": other_issues,
        },
        "classifications": classification_counts,
        "unitsNeedingFollowUp": follow_up,
        "reviewBoards": review_package["reviewBoards"],
        "units": unit_summaries,
        "integrity": {
            "styleAuthorityHashPass": style_hash_pass,
            "canonicalAssetsChanged": bool(canonical_hash_failures),
            "canonicalHashFailures": canonical_hash_failures,
            "gameplayChanged": False,
            "combatLogicChanged": False,
            "vfxChanged": False,
            "commitCreated": False,
            "pushPerformed": False,
        },
    }
    batch_path = OUT / "manifests/full-roster-batch-manifest.json"
    batch_path.write_text(json.dumps(batch, indent=2) + "\n", encoding="utf-8")

    final_validation = {
        "status": "PASS_STRUCTURE_WITH_DOCUMENTED_FOLLOW_UP" if follow_up else "PASS_STRUCTURE_AND_REVIEW",
        "artifactCountsPass": len(unit_summaries) == 25,
        "masterCountPass": len(list((OUT / "masters").glob("*-master.png"))) == 25,
        "boardCountPass": len(list((OUT / "boards-2x2").glob("*-board.png"))) == 25,
        "poseCountPass": len(list((OUT / "split-poses").glob("*/*.png"))) == 100,
        "perUnitManifestCountPass": len(list(unit_manifest_dir.glob("*.json"))) == 25,
        "reviewBoardCountPass": len(review_package["reviewBoards"]) == 8,
        "uniqueClassificationPerUnitPass": len(classifications) == 25,
        "classificationVocabularyPass": not invalid,
        "pipelineDoctrinePass": scale_overrides == 0 and not machine_crops,
        "styleAuthorityHashPass": style_hash_pass,
        "canonicalIdentityHashPass": not canonical_hash_failures,
        "remainingFollowUpCount": len(follow_up),
        "releaseEligible": False,
        "releaseNote": "DEV review package only; PASS_CANDIDATE units are not canonical promotion approval.",
    }
    final_validation_path = OUT / "qa/final-validation.json"
    final_validation_path.write_text(json.dumps(final_validation, indent=2) + "\n", encoding="utf-8")

    report_lines = [
        "# Option C Full Roster Rebuild — Operator Review",
        "",
        f"Status: `{batch['status']}`",
        "",
        "The complete package is present in the fresh DEV namespace. PASS_CANDIDATE is a review classification only; nothing has been promoted to canonical production.",
        "",
        "## Mandatory report fields",
        "",
        "- total roster processed: 25/25",
        "- masters rebuilt: 25/25",
        "- four-pose boards: 25/25",
        "- final poses: 100/100",
        "- master normalization completed: YES",
        "- per-pose auto-scaling used: NO",
        "- fit-to-content used: NO",
        f"- scaleCorrection overrides used: {scale_overrides}",
        f"- cropping issues remaining: {len(cropping_issues) + len(machine_crops)}",
        f"- scale hierarchy issues remaining: {len(scale_issues)}",
        f"- weapon/anatomy issues remaining: {len(weapon_issues)}",
        f"- units needing follow-up: {', '.join(follow_up) if follow_up else 'none'}",
        f"- canonical assets changed: {'YES' if canonical_hash_failures else 'NO'}",
        "- gameplay changed: NO",
        "- combat logic changed: NO",
        "- VFX changed: NO",
        "- commit: NO",
        "- push: NO",
        "",
        "## Classification summary",
        "",
    ]
    report_lines.extend(f"- {category}: {count}" for category, count in classification_counts.items())
    report_lines.extend(["", "## Follow-up", ""])
    for unit in follow_up:
        report_lines.append(f"- `{unit}` — **{classifications[unit]['category']}**: {classifications[unit]['reason']}")
    report_lines.extend([
        "",
        "## Review package",
        "",
    ])
    report_lines.extend(f"- {name}: `{path}`" for name, path in review_package["reviewBoards"].items())
    report_lines.extend([
        "",
        f"Canonical identity hash audit: {'PASS' if not canonical_hash_failures else 'FAIL'} ({canonical_sources} source files checked).",
        f"Art-style authority hash audit: {'PASS' if style_hash_pass else 'FAIL'}.",
        "",
    ])
    report_path = OUT / "operator-review-report.md"
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    result = {
        "status": batch["status"],
        "batchManifest": rel(batch_path),
        "operatorReport": rel(report_path),
        "finalValidation": rel(final_validation_path),
        "counts": batch["counts"],
        "classifications": classification_counts,
        "unitsNeedingFollowUp": follow_up,
        "remainingIssueCounts": {
            "cropping": len(cropping_issues) + len(machine_crops),
            "scaleHierarchy": len(scale_issues),
            "weaponOrAnatomy": len(weapon_issues),
            "pose": len(pose_issues),
            "other": len(other_issues),
        },
        "canonicalAssetsChanged": bool(canonical_hash_failures),
    }
    print(json.dumps(result, indent=2))
    return result


def prepare(style_reference: Path) -> None:
    for subdir in (
        "references/canonical",
        "references",
        "raw/masters",
        "raw/boards-2x2",
        "masters",
        "boards-2x2",
        "split-poses",
        "qa",
        "manifests/master-prompts",
        "manifests/board-prompts",
        "manifests/master-metrics",
        "manifests/board-metrics",
    ):
        (OUT / subdir).mkdir(parents=True, exist_ok=True)
    for unit in ROSTER:
        (OUT / "split-poses" / unit).mkdir(parents=True, exist_ok=True)

    copied_style = OUT / "references/art-style-authority.png"
    shutil.copy2(style_reference, copied_style)
    records = []
    roster_board = Image.new("RGBA", (5 * 360, 5 * 390 + 90), (17, 20, 26, 255))
    roster_draw = ImageDraw.Draw(roster_board)
    roster_draw.text((24, 22), "CANONICAL GAMEPLAY-IDENTITY AUDIT — NOT STYLE AUTHORITY", font=font(32, True), fill=(245, 228, 183, 255))

    for index, (unit, spec) in enumerate(ROSTER.items()):
        source_dir = CANONICAL_ROOT / str(spec["canonical"])
        files = sorted(source_dir.glob("*.png"))
        if len(files) != 4:
            raise RuntimeError(f"{unit}: expected four canonical PNGs in {source_dir}, found {len(files)}")
        board = Image.new("RGBA", (1024, 1120), (16, 19, 25, 255))
        draw = ImageDraw.Draw(board)
        draw.text((26, 20), f"{unit} — CANONICAL IDENTITY ONLY", font=font(25, True), fill=(245, 228, 183, 255))
        source_records = []
        for pose_index, file_path in enumerate(files):
            cell = checker((512, 512), 16)
            sprite = contain(Image.open(file_path), (464, 452))
            cell.alpha_composite(sprite, ((512 - sprite.width) // 2, 44 + 452 - sprite.height))
            cell_draw = ImageDraw.Draw(cell)
            cell_draw.text((14, 12), f"CANONICAL POSE {pose_index + 1}", font=font(16, True), fill=(211, 218, 229, 255))
            board.alpha_composite(cell, ((pose_index % 2) * 512, 76 + (pose_index // 2) * 512))
            source_records.append({
                "path": rel(file_path),
                "sha256": sha256(file_path),
                "dimensions": list(Image.open(file_path).size),
            })
        reference_path = OUT / "references/canonical" / f"{unit}.png"
        board.save(reference_path)
        records.append({
            "unitId": unit,
            "category": spec["category"],
            "family": spec["family"],
            "weaponOrAnatomy": spec["weapon"],
            "canonicalFolder": rel(source_dir),
            "referenceBoard": rel(reference_path),
            "sources": source_records,
        })

        row, col = divmod(index, 5)
        tile = checker((360, 340), 14)
        exemplar = contain(Image.open(files[0]), (320, 300), Image.Resampling.LANCZOS)
        tile.alpha_composite(exemplar, ((360 - exemplar.width) // 2, 328 - exemplar.height))
        x, y = col * 360, 90 + row * 390
        roster_board.alpha_composite(tile, (x, y))
        roster_draw.rectangle((x, y, x + 359, y + 389), outline=(66, 73, 86, 255), width=2)
        roster_draw.text((x + 12, y + 347), unit, font=font(17, True), fill=(238, 241, 247, 255))
        roster_draw.text((x + 12, y + 370), str(spec["family"]), font=font(13), fill=(163, 190, 215, 255))

    canonical_board = OUT / "qa/canonical-identity-roster.png"
    roster_board.save(canonical_board)
    manifest = {
        "schemaVersion": 1,
        "mission": "Option C full 25-unit roster rebuild",
        "policy": "CANONICAL_ASSETS_ARE_READ_ONLY_GAMEPLAY_IDENTITY_AUTHORITY",
        "artStyleAuthority": {
            "path": rel(copied_style),
            "sha256": sha256(copied_style),
            "sourcePath": str(style_reference),
            "role": "PRIMARY_AND_ONLY_ART_STYLE_AUTHORITY",
        },
        "canonicalIdentityRosterBoard": rel(canonical_board),
        "units": records,
    }
    (OUT / "manifests/reference-audit.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"prepared": len(records), "styleSha256": manifest["artStyleAuthority"]["sha256"], "output": rel(OUT)}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    prepare_parser = sub.add_parser("prepare")
    prepare_parser.add_argument("--style-reference", type=Path, required=True)
    master_parser = sub.add_parser("process-master")
    master_parser.add_argument("--unit", choices=ROSTER, required=True)
    master_parser.add_argument("--input", type=Path, required=True)
    master_parser.add_argument("--prompt-file", type=Path, required=True)
    board_parser = sub.add_parser("process-board")
    board_parser.add_argument("--unit", choices=ROSTER, required=True)
    board_parser.add_argument("--input", type=Path, required=True)
    board_parser.add_argument("--prompt-file", type=Path, required=True)
    sub.add_parser("review-masters")
    sub.add_parser("review-package")
    final_parser = sub.add_parser("finalize-package")
    final_parser.add_argument("--classifications", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args.style_reference)
    elif args.command == "process-master":
        print(json.dumps(normalize_master(args.unit, args.input, args.prompt_file), indent=2))
    elif args.command == "process-board":
        print(json.dumps(process_board(args.unit, args.input, args.prompt_file), indent=2))
    elif args.command == "review-masters":
        build_master_review()
    elif args.command == "review-package":
        build_review_package()
    elif args.command == "finalize-package":
        finalize_package(args.classifications)


if __name__ == "__main__":
    main()
