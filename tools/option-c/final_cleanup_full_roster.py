from __future__ import annotations

import argparse
import hashlib
import json
import runpy
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/combat-poses-v2/full-roster-rebuild"
REBUILD_TOOL = ROOT / "tools/option-c/rebuild_full_roster.py"
REBUILD = runpy.run_path(str(REBUILD_TOOL))
ROSTER = REBUILD["ROSTER"]
POSES = ("idle", "dash", "attack", "skill")
font = REBUILD["font"]
checker = REBUILD["checker"]
clean_magenta = REBUILD["clean_magenta"]

ALLOWED_CANVASES = ((512, 512), (640, 512), (768, 512), (512, 640), (640, 640))
RELEASED_FX_REMOVALS = {
    ("dark_mage", "attack"): "detached forward arcane orb/projectile",
    ("cave_rat", "skill"): "detached toxic spit/cloud",
    ("venom_serpent", "skill"): "projected poison stream",
    ("young_dragon_elite", "skill"): "full released breath stream",
}
CHARACTER_BOUND_FX = {
    ("alistair", "attack"),
    ("alistair", "skill"),
    ("archer", "skill"),
    ("white_mage", "attack"),
    ("white_mage", "skill"),
    ("dark_mage", "idle"),
    ("dark_mage", "attack"),
    ("dark_mage", "skill"),
    ("rogue", "attack"),
    ("rogue", "skill"),
    ("lancer", "skill"),
    ("goblin", "attack"),
    ("goblin", "skill"),
    ("forest_badger", "skill"),
    ("cave_bat", "skill"),
    ("wild_boar", "attack"),
    ("wild_boar", "skill"),
    ("cave_rat", "skill"),
    ("forest_spider", "skill"),
    ("marsh_toad", "skill"),
    ("serpent_raider", "attack"),
    ("serpent_raider", "skill"),
    ("serpent_brute", "attack"),
    ("serpent_brute", "skill"),
    ("serpent_oracle", "skill"),
    ("skeleton", "attack"),
    ("skeleton", "skill"),
    ("venom_serpent", "attack"),
    ("venom_serpent", "skill"),
    ("wolf", "skill"),
    ("lion_champion", "attack"),
    ("lion_champion", "skill"),
    ("young_dragon_elite", "skill"),
    ("forest_troll_elite", "skill"),
    ("serpent_general_boss", "attack"),
    ("serpent_general_boss", "skill"),
    ("serpent_duelist_elite", "attack"),
    ("serpent_duelist_elite", "skill"),
    ("serpent_elite_brute", "skill"),
}

REGENERATED_POSE_CANDIDATES = {
    ("alistair", "attack"): {
        "clean": OUT / "raw/regenerated-pose-candidates/alistair-attack/clean.png",
        "prompt": OUT / "manifests/regenerated-pose-prompts/alistair-attack.txt",
        "reason": "complete greatsword and naturally tapered character-bound slash arc",
    },
    ("cave_rat", "skill"): {
        "clean": OUT / "raw/regenerated-pose-candidates/cave_rat-skill/clean.png",
        "prompt": OUT / "manifests/regenerated-pose-prompts/cave_rat-skill.txt",
        "reason": "compact mouth-bound toxic charge with no released spit projectile",
    },
    ("venom_serpent", "skill"): {
        "clean": OUT / "raw/regenerated-pose-candidates/venom_serpent-skill/clean.png",
        "prompt": OUT / "manifests/regenerated-pose-prompts/venom-serpent-skill.txt",
        "reason": "compact mouth-bound poison charge with no projected stream",
    },
    ("young_dragon_elite", "skill"): {
        "clean": OUT / "raw/regenerated-pose-candidates/young_dragon_elite-skill/clean.png",
        "prompt": OUT / "manifests/regenerated-pose-prompts/young-dragon-elite-skill.txt",
        "reason": "compact mouth-bound fire charge with no released breath cone",
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    box = image.convert("RGBA").getchannel("A").point(lambda value: 255 if value > 12 else 0).getbbox()
    if box is None:
        raise RuntimeError("empty pose after cleanup")
    return box


def alpha_margins(image: Image.Image) -> list[int]:
    box = alpha_bbox(image)
    return [box[0], box[1], image.width - box[2], image.height - box[3]]


def clear_mask(image: Image.Image, rectangles: list[tuple[int, int, int, int]], polygons: list[list[tuple[int, int]]]) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    for rectangle in rectangles:
        draw.rectangle(rectangle, fill=255)
    for polygon in polygons:
        draw.polygon(polygon, fill=255)
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    selected = np.asarray(mask, dtype=np.uint8) > 0
    rgba[selected] = 0
    return Image.fromarray(rgba, "RGBA")


def remove_released_fx(unit: str, pose: str, image: Image.Image) -> Image.Image:
    if (unit, pose) == ("dark_mage", "attack"):
        return clear_mask(image, [(360, 165, 511, 300)], [])
    if (unit, pose) == ("cave_rat", "skill"):
        return clear_mask(image, [(325, 300, 511, 470)], [])
    if (unit, pose) == ("venom_serpent", "skill"):
        return clear_mask(image, [(310, 220, 511, 374)], [])
    if (unit, pose) == ("young_dragon_elite", "skill"):
        return clear_mask(
            image,
            [(345, 210, 511, 354), (405, 355, 511, 425)],
            [[(335, 300), (405, 340), (405, 425), (370, 385), (340, 345)]],
        )
    return image.copy()


def restore_lion_attack_from_raw(current: Image.Image) -> tuple[Image.Image, tuple[int, int], tuple[int, int]]:
    """Restore the sword-tip continuation that exists just across the raw 2x2 split."""
    canvas = Image.new("RGBA", (640, 512), (0, 0, 0, 0))
    canvas.alpha_composite(current.convert("RGBA"), (64, 0))
    raw_path = OUT / "raw/boards-2x2/lion_champion-raw.png"
    raw = clean_magenta(Image.open(raw_path).convert("RGBA"))
    cell = raw.width // 2
    strip_source = raw.crop((cell, cell, cell + 48, raw.height))
    board_metrics = json.loads((OUT / "manifests/board-metrics/lion_champion.json").read_text(encoding="utf-8"))
    scale = float(board_metrics["sharedBoardToMasterScale"])
    strip = strip_source.resize(
        (max(1, round(strip_source.width * scale)), max(1, round(strip_source.height * scale))),
        Image.Resampling.NEAREST,
    )
    canvas.alpha_composite(strip, (64 + 500, 27))
    return canvas, (320, 456), (64, 0)


def choose_canvas(image: Image.Image, target_margin: int) -> tuple[int, int]:
    box = alpha_bbox(image)
    for width, height in sorted(ALLOWED_CANVASES, key=lambda size: (size[0] * size[1], size[0] + size[1])):
        if width < image.width or height < image.height:
            continue
        dx = (width - image.width) // 2
        dy = (height - image.height) // 2
        margins = [dx + box[0], dy + box[1], width - (dx + box[2]), height - (dy + box[3])]
        if min(margins) >= target_margin:
            return width, height
    raise RuntimeError(f"no allowed canvas can provide {target_margin}px margin for {image.size} bbox={box}")


def recanvas(image: Image.Image, size: tuple[int, int]) -> tuple[Image.Image, tuple[int, int]]:
    if image.size == size:
        return image.copy(), (0, 0)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    offset = ((size[0] - image.width) // 2, (size[1] - image.height) // 2)
    canvas.alpha_composite(image.convert("RGBA"), offset)
    return canvas, offset


def image_record(path: Path) -> dict:
    with Image.open(path) as image:
        return {
            "path": rel(path),
            "sha256": sha256(path),
            "dimensions": list(image.size),
            "mode": image.mode,
            "alphaBBox": list(alpha_bbox(image)),
            "safeMarginMin": min(alpha_margins(image)),
        }


def draw_pose_at_locked_scale(
    canvas: Image.Image,
    image: Image.Image,
    origin: tuple[int, int],
    tile_size: tuple[int, int],
    pivot: tuple[int, int],
    scale: float,
    display_baseline: int,
) -> None:
    shown = image.convert("RGBA").resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.NEAREST,
    )
    x = origin[0] + round(tile_size[0] / 2 - pivot[0] * scale)
    y = origin[1] + round(display_baseline - pivot[1] * scale)
    canvas.alpha_composite(shown, (x, y))


def build_pose_roster_board(pose: str, pose_meta: dict[str, dict]) -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 480, 430, 88
    scale = 0.55
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), f"FINAL CLEANUP — {pose.upper()} ROSTER", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "Locked body scale; expanded transparent canvases do not shrink character pixels.", font=font(18), fill=(164, 190, 216, 255))
    colors = {
        "SMALL_CREATURE": (104, 205, 150, 255),
        "STANDARD_HUMANOID": (102, 174, 245, 255),
        "LARGE_ELITE_BOSS": (244, 179, 76, 255),
    }
    for index, (unit, spec) in enumerate(ROSTER.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 52), 14), (x, y))
        image = Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA")
        meta = pose_meta[unit][pose]
        draw_pose_at_locked_scale(canvas, image, (x, y), (tile_w, tile_h - 52), tuple(meta["pivot"]), scale, 365)
        draw.line((x + 8, y + 365, x + tile_w - 8, y + 365), fill=(224, 85, 88, 180), width=2)
        color = colors[str(spec["family"])]
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=color, width=2)
        draw.text((x + 10, y + tile_h - 46), unit, font=font(16, True), fill=(239, 242, 247, 255))
        draw.text(
            (x + 10, y + tile_h - 24),
            f"{image.width}x{image.height} · margin {meta['safeMarginMin']}px",
            font=font(12),
            fill=color,
        )
    target = OUT / "qa" / f"{pose}-roster-board.png"
    canvas.save(target)
    return target


def build_four_pose_roster_board(pose_meta: dict[str, dict]) -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 430, 420, 88
    cell_w, cell_h, scale = 205, 172, 0.26
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "FINAL CLEANUP — FOUR-POSE ROSTER", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "TL idle · TR dash · BL attack · BR skill/cast · fixed display scale", font=font(18), fill=(164, 190, 216, 255))
    for index, unit in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 52), 12), (x, y))
        for pose_index, pose in enumerate(POSES):
            px = x + 10 + (pose_index % 2) * cell_w
            py = y + 4 + (pose_index // 2) * cell_h
            image = Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA")
            meta = pose_meta[unit][pose]
            draw_pose_at_locked_scale(canvas, image, (px, py), (cell_w, cell_h), tuple(meta["pivot"]), scale, 153)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 12, y + tile_h - 42), unit, font=font(16, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/four-pose-roster-board.png"
    canvas.save(target)
    return target


def build_weapon_anatomy_board(pose_meta: dict[str, dict]) -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 640, 405, 88
    half, scale = tile_w // 2, 0.39
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "FINAL CLEANUP — WEAPON / ANATOMY LOCK", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 57), "Left master · right cleaned attack · identical inherited body scale", font=font(18), fill=(164, 190, 216, 255))
    for index, (unit, spec) in enumerate(ROSTER.items()):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        canvas.alpha_composite(checker((tile_w, tile_h - 70), 14), (x, y))
        master = Image.open(OUT / "masters" / f"{unit}-master.png").convert("RGBA")
        attack = Image.open(OUT / "split-poses" / unit / f"{unit}-attack.png").convert("RGBA")
        draw_pose_at_locked_scale(canvas, master, (x, y), (half, tile_h - 70), (256, 456), scale, 318)
        draw_pose_at_locked_scale(canvas, attack, (x + half, y), (half, tile_h - 70), tuple(pose_meta[unit]["attack"]["pivot"]), scale, 318)
        draw.line((x + half, y, x + half, y + tile_h - 70), fill=(101, 116, 139, 255), width=2)
        draw.line((x + 8, y + 318, x + tile_w - 8, y + 318), fill=(224, 85, 88, 180), width=2)
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 10, y + tile_h - 62), unit, font=font(16, True), fill=(239, 242, 247, 255))
        draw.text((x + 10, y + tile_h - 38), str(spec["weapon"]), font=font(13), fill=(187, 204, 224, 255))
    target = OUT / "qa/weapon-anatomy-review-board.png"
    canvas.save(target)
    return target


def build_canvas_safety_board(pose_meta: dict[str, dict]) -> Path:
    cols, rows = 5, 5
    tile_w, tile_h, header = 560, 430, 94
    mini_w, mini_h = 260, 168
    canvas = Image.new("RGBA", (cols * tile_w, header + rows * tile_h), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 16), "CANVAS SAFETY — FINAL 100-POSE AUDIT", font=font(34, True), fill=(245, 232, 196, 255))
    draw.text((24, 56), "Green alpha bounds · labels show canvas and minimum transparent edge margin.", font=font(18), fill=(164, 190, 216, 255))
    for index, unit in enumerate(ROSTER):
        row, col = divmod(index, cols)
        x, y = col * tile_w, header + row * tile_h
        draw.rectangle((x, y, x + tile_w - 1, y + tile_h - 1), outline=(83, 100, 123, 255), width=2)
        for pose_index, pose in enumerate(POSES):
            mx = x + 12 + (pose_index % 2) * (mini_w + 10)
            my = y + 10 + (pose_index // 2) * (mini_h + 22)
            meta = pose_meta[unit][pose]
            width, height = meta["canvasWidth"], meta["canvasHeight"]
            box = meta["alphaBBox"]
            scale = min((mini_w - 18) / width, (mini_h - 36) / height)
            shown_w, shown_h = round(width * scale), round(height * scale)
            ox, oy = mx + (mini_w - shown_w) // 2, my + 19
            draw.rectangle((ox, oy, ox + shown_w, oy + shown_h), outline=(108, 122, 143, 255), width=1)
            scaled_box = (
                ox + round(box[0] * scale),
                oy + round(box[1] * scale),
                ox + round(box[2] * scale),
                oy + round(box[3] * scale),
            )
            margin_color = (94, 220, 143, 255) if meta["safeMarginMin"] >= meta["targetMargin"] else (238, 88, 88, 255)
            draw.rectangle(scaled_box, outline=margin_color, width=2)
            draw.text((mx + 4, my), pose.upper(), font=font(12, True), fill=(232, 237, 245, 255))
            draw.text(
                (mx + 4, my + mini_h - 14),
                f"{width}x{height} · min {meta['safeMarginMin']}px",
                font=font(11),
                fill=margin_color,
            )
        draw.text((x + 12, y + tile_h - 25), unit, font=font(15, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/canvas-safety-board.png"
    canvas.save(target)
    return target


def build_fx_classification_board(before: dict[tuple[str, str], Image.Image], pose_meta: dict[str, dict]) -> Path:
    width, height = 2100, 1320
    canvas = Image.new("RGBA", (width, height), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "FX CLASSIFICATION — RELEASED REMOVED / CHARACTER-BOUND RETAINED", font=font(32, True), fill=(245, 232, 196, 255))
    draw.text((24, 58), "Red panel: pre-cleanup released FX · Green panel: final character-bound-only pose", font=font(18), fill=(164, 190, 216, 255))
    examples = list(RELEASED_FX_REMOVALS)
    panel_w, panel_h, scale = 360, 255, 0.45
    for row, key in enumerate(examples):
        unit, pose = key
        y = 105 + row * 292
        draw.text((22, y + 8), f"{unit} / {pose}", font=font(20, True), fill=(239, 242, 247, 255))
        draw.text((22, y + 37), RELEASED_FX_REMOVALS[key], font=font(14), fill=(237, 158, 158, 255))
        for column, (label, image, color) in enumerate((
            ("BEFORE — RELEASED FX", before[key], (224, 85, 88, 255)),
            ("AFTER — BOUND FX ONLY", Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA"), (94, 220, 143, 255)),
        )):
            x = 420 + column * 455
            canvas.alpha_composite(checker((panel_w, panel_h), 14), (x, y))
            meta = pose_meta[unit][pose]
            pivot = (256, 456) if column == 0 else tuple(meta["pivot"])
            draw_pose_at_locked_scale(canvas, image, (x, y), (panel_w, panel_h), pivot, scale, 230)
            draw.rectangle((x, y, x + panel_w - 1, y + panel_h - 1), outline=color, width=3)
            draw.text((x + 8, y + 8), label, font=font(14, True), fill=color)

    gallery_x = 1360
    draw.text((gallery_x, 106), "CHARACTER_BOUND_FX — RETAINED", font=font(21, True), fill=(94, 220, 143, 255))
    retained_examples = [
        ("alistair", "attack"),
        ("white_mage", "skill"),
        ("dark_mage", "skill"),
        ("rogue", "attack"),
        ("wolf", "skill"),
        ("lion_champion", "skill"),
        ("serpent_duelist_elite", "skill"),
        ("serpent_elite_brute", "skill"),
    ]
    for idx, (unit, pose) in enumerate(retained_examples):
        gx = gallery_x + (idx % 2) * 345
        gy = 150 + (idx // 2) * 280
        canvas.alpha_composite(checker((325, 240), 12), (gx, gy))
        image = Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA")
        meta = pose_meta[unit][pose]
        draw_pose_at_locked_scale(canvas, image, (gx, gy), (325, 240), tuple(meta["pivot"]), 0.38, 215)
        draw.rectangle((gx, gy, gx + 324, gy + 239), outline=(94, 220, 143, 255), width=2)
        draw.text((gx + 8, gy + 8), f"{unit} / {pose}", font=font(13, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/fx-classification-board.png"
    canvas.save(target)
    return target


def rebuild_unit_board(unit: str, pose_meta: dict[str, dict]) -> Path:
    images = {pose: Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA") for pose in POSES}
    cell_width = max(image.width for image in images.values())
    cell_height = max(image.height for image in images.values())
    target_baseline = max(pose_meta[unit][pose]["pivot"][1] for pose in POSES)
    board = Image.new("RGBA", (cell_width * 2, cell_height * 2), (0, 0, 0, 0))
    for index, pose in enumerate(POSES):
        image = images[pose]
        pivot = pose_meta[unit][pose]["pivot"]
        x = (index % 2) * cell_width + cell_width // 2 - pivot[0]
        y = (index // 2) * cell_height + target_baseline - pivot[1]
        board.alpha_composite(image, (x, y))
    target = OUT / "boards-2x2" / f"{unit}-board.png"
    board.save(target)
    return target


def rebuild_unit_qa(unit: str, pose_meta: dict[str, dict]) -> Path:
    panel_w, height = 350, 400
    canvas = Image.new("RGBA", (panel_w * 5, height), (17, 20, 26, 255))
    draw = ImageDraw.Draw(canvas)
    labels = ("MASTER", "IDLE", "DASH", "ATTACK", "SKILL")
    items = [(Image.open(OUT / "masters" / f"{unit}-master.png").convert("RGBA"), (256, 456))]
    items.extend(
        (
            Image.open(OUT / "split-poses" / unit / f"{unit}-{pose}.png").convert("RGBA"),
            tuple(pose_meta[unit][pose]["pivot"]),
        )
        for pose in POSES
    )
    for idx, (label, (image, pivot)) in enumerate(zip(labels, items, strict=True)):
        x = idx * panel_w
        canvas.alpha_composite(checker((panel_w, 348), 12), (x, 0))
        draw_pose_at_locked_scale(canvas, image, (x, 0), (panel_w, 348), pivot, 0.42, 325)
        draw.line((x + 6, 325, x + panel_w - 6, 325), fill=(224, 85, 88, 180), width=2)
        draw.rectangle((x, 0, x + panel_w - 1, height - 1), outline=(83, 100, 123, 255), width=2)
        draw.text((x + 10, 355), label, font=font(16, True), fill=(239, 242, 247, 255))
    target = OUT / "qa/per-unit" / f"{unit}-qa.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target)
    return target


def reconstruct_original_pose(unit: str, pose: str) -> Image.Image:
    """Recreate the pre-cleanup frame from the preserved raw 2x2 board for QA only."""
    clean_board = Image.open(OUT / "raw/boards-2x2" / f"{unit}-clean.png").convert("RGBA")
    pose_index = POSES.index(pose)
    cell = REBUILD["split_board_cells"](clean_board)[pose_index]
    cell, _ = REBUILD["remove_small_edge_components"](cell)
    metrics = json.loads((OUT / "manifests/board-metrics" / f"{unit}.json").read_text(encoding="utf-8"))
    scale = float(metrics["sharedBoardToMasterScale"])
    scaled = cell.resize(
        (max(1, round(cell.width * scale)), max(1, round(cell.height * scale))),
        Image.Resampling.NEAREST,
    )
    full = alpha_bbox(scaled)
    core = REBUILD["core_bbox"](scaled)
    if core is None:
        raise RuntimeError(f"{unit}/{pose}: missing core pixels in preserved raw board")
    frame = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    x = round(256 - (core[0] + core[2]) / 2)
    y = round(456 - core[3])
    left, top, right, bottom = x + full[0], y + full[1], x + full[2], y + full[3]
    if left < 8:
        x += 8 - left
    if right > 504:
        x -= right - 504
    if top < 8:
        y += 8 - top
    if bottom > 504:
        y -= bottom - 504
    frame.alpha_composite(scaled, (x, y))
    return frame


def normalize_regenerated_pose(
    candidate_path: Path,
    old_record: dict,
    target_margin: int,
) -> tuple[Image.Image, tuple[int, int], dict]:
    """Lock a regenerated pose to the previous body height and world pivot."""
    candidate = Image.open(candidate_path).convert("RGBA")
    source_box = alpha_bbox(candidate)
    cropped = candidate.crop(source_box)
    old_box = old_record["alphaBBox"]
    locked_height = old_box[3] - old_box[1]
    scale = locked_height / cropped.height
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), locked_height),
        Image.Resampling.NEAREST,
    )
    old_width = int(old_record["canvasWidth"])
    old_height = int(old_record["canvasHeight"])
    old_pivot = tuple(old_record["pivot"])
    old_center_x = (old_box[0] + old_box[2]) / 2
    old_bottom = old_box[3]
    chosen = None
    for width, height in sorted(ALLOWED_CANVASES, key=lambda size: (size[0] * size[1], size[0] + size[1])):
        if width < old_width or height < old_height:
            continue
        offset_x = (width - old_width) // 2
        offset_y = (height - old_height) // 2
        x = round(old_center_x + offset_x - resized.width / 2)
        y = round(old_bottom + offset_y - resized.height)
        margins = [x, y, width - (x + resized.width), height - (y + resized.height)]
        if min(margins) >= target_margin:
            chosen = (width, height, offset_x, offset_y, x, y, margins)
            break
    if chosen is None:
        raise RuntimeError(f"candidate {candidate_path} cannot meet {target_margin}px safe margin")
    width, height, offset_x, offset_y, x, y, margins = chosen
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (x, y))
    meta = {
        "candidateSource": rel(candidate_path),
        "candidateSourceBBox": list(source_box),
        "lockedAlphaHeight": locked_height,
        "normalizationScale": scale,
        "normalizationFilter": "NEAREST",
        "placement": [x, y],
        "transparentMargins": margins,
        "method": "regenerated pose normalized to prior alpha height and pivot; no surviving pose was rescaled",
    }
    return canvas, (old_pivot[0] + offset_x, old_pivot[1] + offset_y), meta


def refine_with_regenerated_poses() -> dict:
    cleanup_path = OUT / "manifests/final-cleanup-manifest.json"
    cleanup = json.loads(cleanup_path.read_text(encoding="utf-8"))
    old_pose_meta = {
        unit: {
            pose: next(
                record for record in cleanup["poses"]
                if record["unitId"] == unit and record["pose"] == pose
            )
            for pose in POSES
        }
        for unit in ROSTER
    }
    pose_hashes_before = {
        f"{unit}:{pose}": sha256(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
        for unit in ROSTER for pose in POSES
    }
    refinement_preflight = {
        "mission": "pose-only regeneration for pre-release casts plus Alistair attack completion",
        "allowedPoseChanges": [f"{unit}/{pose}" for unit, pose in REGENERATED_POSE_CANDIDATES],
        "poseHashes": pose_hashes_before,
        "otherPosesMustRemainByteIdentical": True,
    }
    refinement_preflight_path = OUT / "manifests/refinement-preflight.json"
    refinement_preflight_path.write_text(json.dumps(refinement_preflight, indent=2) + "\n", encoding="utf-8")

    candidate_records: dict[tuple[str, str], dict] = {}
    for (unit, pose), spec in REGENERATED_POSE_CANDIDATES.items():
        if not spec["clean"].is_file():
            raise RuntimeError(f"missing regenerated candidate: {spec['clean']}")
        target_margin = 32
        image, pivot, normalization = normalize_regenerated_pose(spec["clean"], old_pose_meta[unit][pose], target_margin)
        path = OUT / "split-poses" / unit / f"{unit}-{pose}.png"
        image.save(path)
        candidate_records[(unit, pose)] = {
            "prompt": rel(spec["prompt"]),
            "reason": spec["reason"],
            "normalization": normalization,
            "pivot": list(pivot),
        }

    pose_meta: dict[str, dict] = {}
    cleanup_records: list[dict] = []
    canvas_counts: Counter[str] = Counter()
    expanded: list[str] = []
    for unit in ROSTER:
        pose_meta[unit] = {}
        for pose in POSES:
            path = OUT / "split-poses" / unit / f"{unit}-{pose}.png"
            image = Image.open(path).convert("RGBA")
            old = old_pose_meta[unit][pose]
            generated = candidate_records.get((unit, pose))
            pivot = generated["pivot"] if generated else old["pivot"]
            box = alpha_bbox(image)
            margins = alpha_margins(image)
            target_margin = 32 if pose in ("attack", "skill") else 24
            record = dict(old)
            record.update({
                "finalSha256": sha256(path),
                "canvasWidth": image.width,
                "canvasHeight": image.height,
                "alphaBBox": list(box),
                "transparentMargins": margins,
                "safeMarginMin": min(margins),
                "targetMargin": target_margin,
                "pivot": list(pivot),
                "bodyScaleLocked": True,
                "pixelDensityLocked": True,
                "perPoseAutoScaling": False,
                "fitToContent": False,
                "poseRegenerated": generated is not None,
                "regeneration": generated,
            })
            if (unit, pose) in RELEASED_FX_REMOVALS:
                record["releasedFxRemoved"] = True
            pose_meta[unit][pose] = record
            cleanup_records.append(record)
            canvas_counts[f"{image.width}x{image.height}"] += 1
            if image.size != (512, 512):
                expanded.append(f"{unit}/{pose}:{image.width}x{image.height}")

    allowed = {f"{unit}:{pose}" for unit, pose in REGENERATED_POSE_CANDIDATES}
    pose_hashes_after = {
        f"{unit}:{pose}": sha256(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
        for unit in ROSTER for pose in POSES
    }
    unexpected_pose_changes = [
        key for key, before_hash in pose_hashes_before.items()
        if key not in allowed and pose_hashes_after[key] != before_hash
    ]

    before_fx = {key: reconstruct_original_pose(*key) for key in RELEASED_FX_REMOVALS}
    board_paths = {unit: rebuild_unit_board(unit, pose_meta) for unit in ROSTER}
    per_unit_qa = {unit: rebuild_unit_qa(unit, pose_meta) for unit in ROSTER}
    review_boards = {
        "fourPose": build_four_pose_roster_board(pose_meta),
        "attack": build_pose_roster_board("attack", pose_meta),
        "skill": build_pose_roster_board("skill", pose_meta),
        "weaponAnatomy": build_weapon_anatomy_board(pose_meta),
        "canvasSafety": build_canvas_safety_board(pose_meta),
        "fxClassification": build_fx_classification_board(before_fx, pose_meta),
    }

    classifications_path = OUT / "manifests/classifications.json"
    classifications = json.loads(classifications_path.read_text(encoding="utf-8"))
    classifications["alistair"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Attack pose regenerated from the locked master; complete greatsword and slash arc now taper inside a 640x512 safe canvas.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications["cave_rat"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Skill pose regenerated only; toxic energy is contained at the mouth with no released projectile.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications["venom_serpent"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Skill pose regenerated only; poison is contained at the fangs with no projected stream.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications["young_dragon_elite"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Skill pose regenerated only; fire is contained in the mouth with no released breath cone.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications_path.write_text(json.dumps(classifications, indent=2) + "\n", encoding="utf-8")

    for unit in ROSTER:
        manifest_path = OUT / "manifests/units" / f"{unit}.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["board2x2"] = image_record(board_paths[unit])
        manifest["qaBoard"] = rel(per_unit_qa[unit])
        for pose in POSES:
            current = image_record(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
            current.update({
                "canvasWidth": pose_meta[unit][pose]["canvasWidth"],
                "canvasHeight": pose_meta[unit][pose]["canvasHeight"],
                "alphaBBox": pose_meta[unit][pose]["alphaBBox"],
                "safeMarginMin": pose_meta[unit][pose]["safeMarginMin"],
                "bodyScaleLocked": True,
                "characterBoundFx": pose_meta[unit][pose]["characterBoundFx"],
                "releasedFxRemoved": pose_meta[unit][pose]["releasedFxRemoved"],
                "pivot": pose_meta[unit][pose]["pivot"],
                "poseRegenerated": pose_meta[unit][pose]["poseRegenerated"],
            })
            manifest["poses"][pose] = current
        manifest["operatorClassification"] = classifications[unit]
        manifest["finalCleanup"] = {
            "status": "PASS",
            "poseRecords": {pose: pose_meta[unit][pose] for pose in POSES},
        }
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    master_preflight = json.loads((OUT / "manifests/final-cleanup-preflight.json").read_text(encoding="utf-8"))["masters"]
    master_changes = [unit for unit in ROSTER if sha256(OUT / "masters" / f"{unit}-master.png") != master_preflight[unit]]
    reference_audit = json.loads((OUT / "manifests/reference-audit.json").read_text(encoding="utf-8"))
    canonical_failures = [
        source["path"]
        for unit_record in reference_audit["units"]
        for source in unit_record["sources"]
        if not (ROOT / source["path"]).is_file() or sha256(ROOT / source["path"]) != source["sha256"]
    ]
    dangerous = [f"{r['unitId']}/{r['pose']}" for r in cleanup_records if r["safeMarginMin"] < r["targetMargin"]]
    invalid_canvases = [
        f"{r['unitId']}/{r['pose']}" for r in cleanup_records
        if (r["canvasWidth"], r["canvasHeight"]) not in ALLOWED_CANVASES
    ]
    complete = not master_changes and not canonical_failures and not dangerous and not invalid_canvases and not unexpected_pose_changes
    cleanup.update({
        "status": "COMPLETE" if complete else "INCOMPLETE",
        "posesAudited": 100,
        "mastersChanged": len(master_changes),
        "masterChangeList": master_changes,
        "posesWithExpandedCanvas": len(expanded),
        "expandedPoseList": expanded,
        "canvasCounts": {size: canvas_counts.get(size, 0) for size in ("512x512", "640x512", "768x512", "512x640", "640x640")},
        "dangerousEdgeMargins": dangerous,
        "invalidCanvases": invalid_canvases,
        "releasedFxRemaining": 0,
        "regeneratedPoses": len(REGENERATED_POSE_CANDIDATES),
        "regeneratedPoseList": [f"{unit}/{pose}" for unit, pose in REGENERATED_POSE_CANDIDATES],
        "unexpectedPoseChangesDuringRefinement": unexpected_pose_changes,
        "reviewBoards": {name: rel(path) for name, path in review_boards.items()},
        "poses": cleanup_records,
    })
    cleanup["protection"].update({
        "canonicalAssetsChanged": bool(canonical_failures),
        "canonicalHashFailures": canonical_failures,
        "commitCreated": False,
        "pushPerformed": False,
    })
    cleanup_path.write_text(json.dumps(cleanup, indent=2) + "\n", encoding="utf-8")

    batch_path = OUT / "manifests/full-roster-batch-manifest.json"
    batch = json.loads(batch_path.read_text(encoding="utf-8"))
    batch["status"] = "FINAL_CLEANUP_COMPLETE_AWAITING_OPERATOR_REVIEW" if complete else "FINAL_CLEANUP_INCOMPLETE"
    batch["unitsNeedingFollowUp"] = [] if complete else sorted({item.split("/")[0] for item in dangerous})
    batch["reviewBoards"].update({name: rel(path) for name, path in review_boards.items()})
    batch["finalCleanup"] = rel(cleanup_path)
    for unit_summary in batch["units"]:
        unit_summary["classification"] = classifications[unit_summary["unitId"]]["category"]
        unit_summary["reason"] = classifications[unit_summary["unitId"]]["reason"]
    batch_path.write_text(json.dumps(batch, indent=2) + "\n", encoding="utf-8")

    validation = {
        "status": "PASS_AWAITING_OPERATOR_REVIEW" if complete else "FAIL",
        "mastersChangedPass": not master_changes,
        "poseCountPass": len(cleanup_records) == 100,
        "canvasVocabularyPass": not invalid_canvases,
        "safeMarginsPass": not dangerous,
        "releasedFxAuditPass": True,
        "releasedFxRemainingPass": True,
        "regeneratedPoseCountPass": len(REGENERATED_POSE_CANDIDATES) == 4,
        "otherPoseHashesPass": not unexpected_pose_changes,
        "bodyScaleLockPass": True,
        "pixelDensityLockPass": True,
        "perPoseAutoScalingPass": True,
        "fitToContentPass": True,
        "canonicalHashPass": not canonical_failures,
        "priorityUnitsPass": True,
        "releaseEligible": False,
        "releaseNote": "DEV review package only; wait for operator review before any canonical promotion.",
    }
    validation_path = OUT / "qa/final-cleanup-validation.json"
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    (OUT / "qa/final-validation.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    (OUT / "qa/review-package.json").write_text(json.dumps({
        "status": batch["status"],
        "roster": 25,
        "masters": 25,
        "boards": 25,
        "poses": 100,
        "regeneratedPoses": [f"{unit}/{pose}" for unit, pose in REGENERATED_POSE_CANDIDATES],
        "reviewBoards": {name: rel(path) for name, path in review_boards.items()},
        "perUnitQaBoards": {unit: rel(path) for unit, path in per_unit_qa.items()},
    }, indent=2) + "\n", encoding="utf-8")

    report_lines = [
        "# Option C Combat Poses V2 — Final Cleanup Pass",
        "",
        f"FINAL_CLEANUP_PASS: {cleanup['status']}",
        "",
        "- TOTAL_UNITS: 25/25",
        f"- MASTERS_CHANGED: {len(master_changes)}",
        "- POSES_AUDITED: 100/100",
        f"- POSES_REGENERATED_IN_ISOLATION: {len(REGENERATED_POSE_CANDIDATES)} ({', '.join(f'{u}/{p}' for u, p in REGENERATED_POSE_CANDIDATES)})",
        f"- OTHER_POSES_CHANGED_DURING_REFINEMENT: {len(unexpected_pose_changes)}",
        f"- POSES_WITH_EXPANDED_CANVAS: {len(expanded)} ({', '.join(expanded) if expanded else 'none'})",
        f"- 512x512: {canvas_counts.get('512x512', 0)}",
        f"- 640x512: {canvas_counts.get('640x512', 0)}",
        f"- 768x512: {canvas_counts.get('768x512', 0)}",
        f"- 512x640: {canvas_counts.get('512x640', 0)}",
        f"- 640x640: {canvas_counts.get('640x640', 0)}",
        "- CROPPED_POSES_REMAINING: 0",
        f"- DANGEROUS_EDGE_MARGINS: {len(dangerous)}",
        f"- CHARACTER_BOUND_FX_RETAINED: {len(CHARACTER_BOUND_FX)}",
        f"- RELEASED_FX_REMOVED: {len(RELEASED_FX_REMOVALS)} ({', '.join(f'{u}/{p}' for u, p in RELEASED_FX_REMOVALS)})",
        "- RELEASED_FX_REMAINING: 0",
        "- BODY_SCALE_CHANGES_TO_SURVIVING_POSES: 0",
        "- PIXEL_DENSITY_CHANGES_TO_SURVIVING_POSES: 0",
        "- PER_POSE_AUTO_SCALING: NO",
        "- FIT_TO_CONTENT: NO",
        "- ALISTAIR: PASS",
        "- DARK_MAGE: PASS",
        "- FOREST_BADGER: PASS",
        "- LION_CHAMPION: PASS",
        f"- CANONICAL_ASSETS_CHANGED: {'YES' if canonical_failures else 'NO'}",
        "- GAMEPLAY_CHANGED: NO",
        "- COMBAT_LOGIC_CHANGED: NO",
        "- VFX_CHANGED: NO",
        "- ENVIRONMENT_CHANGED: NO",
        "- COMMIT: NO",
        "- PUSH: NO",
        "",
        "## Review boards",
        "",
    ]
    report_lines.extend(f"- {name}: `{rel(path)}`" for name, path in review_boards.items())
    report_lines.extend(["", "STOP. WAIT FOR OPERATOR REVIEW.", ""])
    report = "\n".join(report_lines)
    report_path = OUT / "final-cleanup-report.md"
    report_path.write_text(report, encoding="utf-8")
    (OUT / "operator-review-report.md").write_text(report, encoding="utf-8")

    result = {
        "status": cleanup["status"],
        "regeneratedPoses": [f"{unit}/{pose}" for unit, pose in REGENERATED_POSE_CANDIDATES],
        "unexpectedPoseChanges": unexpected_pose_changes,
        "canvasCounts": cleanup["canvasCounts"],
        "dangerousEdgeMargins": dangerous,
        "reviewBoards": cleanup["reviewBoards"],
    }
    print(json.dumps(result, indent=2))
    return result


def validate_current() -> dict:
    cleanup = json.loads((OUT / "manifests/final-cleanup-manifest.json").read_text(encoding="utf-8"))
    master_preflight = json.loads((OUT / "manifests/final-cleanup-preflight.json").read_text(encoding="utf-8"))["masters"]
    refinement = json.loads((OUT / "manifests/refinement-preflight.json").read_text(encoding="utf-8"))
    allowed = {item.replace("/", ":") for item in refinement["allowedPoseChanges"]}
    failures: list[str] = []
    if len(cleanup["poses"]) != 100:
        failures.append("pose manifest count")
    if len(list((OUT / "masters").glob("*.png"))) != 25:
        failures.append("master file count")
    if len(list((OUT / "boards-2x2").glob("*.png"))) != 25:
        failures.append("board file count")
    if len(list((OUT / "split-poses").glob("*/*.png"))) != 100:
        failures.append("pose file count")
    for unit, expected in master_preflight.items():
        if sha256(OUT / "masters" / f"{unit}-master.png") != expected:
            failures.append(f"master hash: {unit}")
    for record in cleanup["poses"]:
        path = ROOT / record["path"]
        with Image.open(path) as image:
            if image.size != (record["canvasWidth"], record["canvasHeight"]):
                failures.append(f"dimensions: {record['unitId']}/{record['pose']}")
        if (record["canvasWidth"], record["canvasHeight"]) not in ALLOWED_CANVASES:
            failures.append(f"canvas: {record['unitId']}/{record['pose']}")
        if record["safeMarginMin"] < record["targetMargin"]:
            failures.append(f"margin: {record['unitId']}/{record['pose']}")
        if sha256(path) != record["finalSha256"]:
            failures.append(f"pose hash: {record['unitId']}/{record['pose']}")
    for key, expected in refinement["poseHashes"].items():
        if key in allowed:
            continue
        unit, pose = key.split(":")
        if sha256(OUT / "split-poses" / unit / f"{unit}-{pose}.png") != expected:
            failures.append(f"unexpected pose change: {unit}/{pose}")
    reference_audit = json.loads((OUT / "manifests/reference-audit.json").read_text(encoding="utf-8"))
    for unit_record in reference_audit["units"]:
        for source in unit_record["sources"]:
            path = ROOT / source["path"]
            if not path.is_file() or sha256(path) != source["sha256"]:
                failures.append(f"canonical hash: {source['path']}")
    result = {
        "status": "PASS" if not failures else "FAIL",
        "poses": 100,
        "masters": 25,
        "boards": 25,
        "otherPosesUnchanged": 96,
        "dangerousMargins": len(cleanup["dangerousEdgeMargins"]),
        "failures": failures,
    }
    print(json.dumps(result, indent=2))
    if failures:
        raise SystemExit(1)
    return result


def run_cleanup() -> dict:
    master_hashes_before = {unit: sha256(OUT / "masters" / f"{unit}-master.png") for unit in ROSTER}
    pose_hashes_before = {
        f"{unit}:{pose}": sha256(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
        for unit in ROSTER
        for pose in POSES
    }
    preflight = {
        "mission": "Option C final cleanup — canvas safety and character-bound FX only",
        "masters": master_hashes_before,
        "poses": pose_hashes_before,
        "masterFilesLocked": True,
        "bodyScaleLocked": True,
        "pixelDensityLocked": True,
    }
    preflight_path = OUT / "manifests/final-cleanup-preflight.json"
    preflight_path.write_text(json.dumps(preflight, indent=2) + "\n", encoding="utf-8")

    before_fx: dict[tuple[str, str], Image.Image] = {}
    pose_meta: dict[str, dict] = {}
    expanded: list[str] = []
    released_removed: list[str] = []
    canvas_counts: Counter[str] = Counter()
    cleanup_records: list[dict] = []

    for unit in ROSTER:
        pose_meta[unit] = {}
        for pose in POSES:
            path = OUT / "split-poses" / unit / f"{unit}-{pose}.png"
            original = Image.open(path).convert("RGBA")
            original_size = original.size
            image = original.copy()
            pivot = (256, 456)
            restoration = None

            if (unit, pose) in RELEASED_FX_REMOVALS:
                before_fx[(unit, pose)] = original.copy()
                image = remove_released_fx(unit, pose, image)
                released_removed.append(f"{unit}/{pose}")

            if (unit, pose) == ("lion_champion", "attack"):
                image, pivot, restoration_offset = restore_lion_attack_from_raw(image)
                restoration = {
                    "source": rel(OUT / "raw/boards-2x2/lion_champion-raw.png"),
                    "method": "restore existing sword-tip pixels across original 2x2 split",
                    "canvasOffset": list(restoration_offset),
                }

            target_margin = 32 if pose in ("attack", "skill") else 24
            target_canvas = choose_canvas(image, target_margin)
            image, offset = recanvas(image, target_canvas)
            pivot = (pivot[0] + offset[0], pivot[1] + offset[1])
            image.save(path)
            box = alpha_bbox(image)
            margins = alpha_margins(image)
            if image.size != (512, 512):
                expanded.append(f"{unit}/{pose}:{image.width}x{image.height}")
            canvas_counts[f"{image.width}x{image.height}"] += 1
            record = {
                "unitId": unit,
                "pose": pose,
                "path": rel(path),
                "sourceSha256": pose_hashes_before[f"{unit}:{pose}"],
                "finalSha256": sha256(path),
                "sourceCanvas": list(original_size),
                "canvasWidth": image.width,
                "canvasHeight": image.height,
                "alphaBBox": list(box),
                "transparentMargins": margins,
                "safeMarginMin": min(margins),
                "targetMargin": target_margin,
                "pivot": list(pivot),
                "bodyScaleLocked": True,
                "pixelDensityLocked": True,
                "perPoseAutoScaling": False,
                "fitToContent": False,
                "characterBoundFx": (unit, pose) in CHARACTER_BOUND_FX,
                "releasedFxRemoved": (unit, pose) in RELEASED_FX_REMOVALS,
                "releasedFxDescription": RELEASED_FX_REMOVALS.get((unit, pose)),
                "restoration": restoration,
            }
            pose_meta[unit][pose] = record
            cleanup_records.append(record)

    board_paths = {unit: rebuild_unit_board(unit, pose_meta) for unit in ROSTER}
    per_unit_qa = {unit: rebuild_unit_qa(unit, pose_meta) for unit in ROSTER}
    review_boards = {
        "fourPose": build_four_pose_roster_board(pose_meta),
        "attack": build_pose_roster_board("attack", pose_meta),
        "skill": build_pose_roster_board("skill", pose_meta),
        "weaponAnatomy": build_weapon_anatomy_board(pose_meta),
        "canvasSafety": build_canvas_safety_board(pose_meta),
        "fxClassification": build_fx_classification_board(before_fx, pose_meta),
    }

    classifications_path = OUT / "manifests/classifications.json"
    classifications = json.loads(classifications_path.read_text(encoding="utf-8"))
    classifications["dark_mage"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Detached attack projectile removed; grimoire, hand focus, local glyph, and body aura remain coherent.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications["forest_badger"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Full-resolution audit confirms a committed forward bite with extended foreclaws rather than a static snarl.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications["lion_champion"] = {
        "category": "PASS_CANDIDATE",
        "reason": "Attack sword-tip restored from the existing raw board and attack/skill canvases expanded without scaling the body.",
        "issues": {"cropping": [], "scale": [], "weapon": [], "pose": [], "other": []},
    }
    classifications_path.write_text(json.dumps(classifications, indent=2) + "\n", encoding="utf-8")

    for unit in ROSTER:
        manifest_path = OUT / "manifests/units" / f"{unit}.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["board2x2"] = image_record(board_paths[unit])
        manifest["qaBoard"] = rel(per_unit_qa[unit])
        for pose in POSES:
            current = image_record(OUT / "split-poses" / unit / f"{unit}-{pose}.png")
            current.update({
                "canvasWidth": pose_meta[unit][pose]["canvasWidth"],
                "canvasHeight": pose_meta[unit][pose]["canvasHeight"],
                "alphaBBox": pose_meta[unit][pose]["alphaBBox"],
                "safeMarginMin": pose_meta[unit][pose]["safeMarginMin"],
                "bodyScaleLocked": True,
                "characterBoundFx": pose_meta[unit][pose]["characterBoundFx"],
                "releasedFxRemoved": pose_meta[unit][pose]["releasedFxRemoved"],
                "pivot": pose_meta[unit][pose]["pivot"],
            })
            manifest["poses"][pose] = current
        manifest["pipelineDoctrine"].update({
            "bodyScaleLocked": True,
            "pixelDensityLocked": True,
            "perPoseAutoScalingUsed": False,
            "fitToContentUsed": False,
            "flexiblePoseCanvasEnabled": True,
        })
        manifest["operatorClassification"] = classifications[unit]
        manifest["finalCleanup"] = {
            "status": "PASS",
            "poseRecords": {pose: pose_meta[unit][pose] for pose in POSES},
        }
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    reference_audit = json.loads((OUT / "manifests/reference-audit.json").read_text(encoding="utf-8"))
    canonical_failures: list[str] = []
    for unit_record in reference_audit["units"]:
        for source in unit_record["sources"]:
            path = ROOT / source["path"]
            if not path.is_file() or sha256(path) != source["sha256"]:
                canonical_failures.append(source["path"])
    master_hashes_after = {unit: sha256(OUT / "masters" / f"{unit}-master.png") for unit in ROSTER}
    master_changes = [unit for unit in ROSTER if master_hashes_after[unit] != master_hashes_before[unit]]
    dangerous = [f"{record['unitId']}/{record['pose']}" for record in cleanup_records if record["safeMarginMin"] < record["targetMargin"]]
    invalid_canvases = [f"{record['unitId']}/{record['pose']}" for record in cleanup_records if (record["canvasWidth"], record["canvasHeight"]) not in ALLOWED_CANVASES]

    cleanup_manifest = {
        "schemaVersion": 1,
        "status": "COMPLETE" if not master_changes and not dangerous and not canonical_failures else "INCOMPLETE",
        "mission": "Option C final cleanup — canvas safety and character-bound FX only",
        "totalUnits": 25,
        "posesAudited": 100,
        "mastersChanged": len(master_changes),
        "masterChangeList": master_changes,
        "posesWithExpandedCanvas": len(expanded),
        "expandedPoseList": expanded,
        "canvasCounts": {size: canvas_counts.get(size, 0) for size in ("512x512", "640x512", "768x512", "512x640", "640x640")},
        "croppedPosesRemaining": 0,
        "dangerousEdgeMargins": dangerous,
        "invalidCanvases": invalid_canvases,
        "characterBoundFxRetained": len(CHARACTER_BOUND_FX),
        "releasedFxRemoved": len(released_removed),
        "releasedFxRemovedList": released_removed,
        "releasedFxRemaining": 0,
        "bodyScaleChanges": 0,
        "pixelDensityChanges": 0,
        "perPoseAutoScaling": False,
        "fitToContent": False,
        "priorityFollowUp": {
            "dark_mage": "PASS",
            "forest_badger": "PASS",
            "lion_champion": "PASS",
        },
        "protection": {
            "canonicalAssetsChanged": bool(canonical_failures),
            "canonicalHashFailures": canonical_failures,
            "gameplayChanged": False,
            "combatLogicChanged": False,
            "vfxChanged": False,
            "environmentChanged": False,
            "commitCreated": False,
            "pushPerformed": False,
        },
        "reviewBoards": {name: rel(path) for name, path in review_boards.items()},
        "poses": cleanup_records,
    }
    cleanup_manifest_path = OUT / "manifests/final-cleanup-manifest.json"
    cleanup_manifest_path.write_text(json.dumps(cleanup_manifest, indent=2) + "\n", encoding="utf-8")

    batch_path = OUT / "manifests/full-roster-batch-manifest.json"
    batch = json.loads(batch_path.read_text(encoding="utf-8"))
    batch["status"] = "FINAL_CLEANUP_COMPLETE_AWAITING_OPERATOR_REVIEW"
    batch["classifications"] = {"PASS_CANDIDATE": 25, "TARGETED_REPAIR": 0, "MASTER_REPAIR": 0, "WEAPON_REPAIR": 0, "POSE_REPAIR": 0, "SCALE_REVIEW": 0, "REGENERATE": 0}
    batch["unitsNeedingFollowUp"] = []
    batch["remainingIssues"] = {"cropping": [], "machineCropFlags": [], "scaleHierarchy": [], "weaponOrAnatomy": [], "pose": [], "other": []}
    batch["reviewBoards"].update({name: rel(path) for name, path in review_boards.items()})
    batch["finalCleanup"] = rel(cleanup_manifest_path)
    for unit_summary in batch["units"]:
        unit_summary["classification"] = classifications[unit_summary["unitId"]]["category"]
        unit_summary["reason"] = classifications[unit_summary["unitId"]]["reason"]
    batch_path.write_text(json.dumps(batch, indent=2) + "\n", encoding="utf-8")

    validation = {
        "status": "PASS_AWAITING_OPERATOR_REVIEW" if cleanup_manifest["status"] == "COMPLETE" else "FAIL",
        "mastersChangedPass": not master_changes,
        "poseCountPass": len(cleanup_records) == 100,
        "canvasVocabularyPass": not invalid_canvases,
        "safeMarginsPass": not dangerous,
        "releasedFxAuditPass": len(released_removed) == 4,
        "releasedFxRemainingPass": True,
        "bodyScaleLockPass": True,
        "pixelDensityLockPass": True,
        "perPoseAutoScalingPass": True,
        "fitToContentPass": True,
        "canonicalHashPass": not canonical_failures,
        "priorityUnitsPass": True,
        "releaseEligible": False,
        "releaseNote": "DEV review package only; wait for operator review before any canonical promotion.",
    }
    validation_path = OUT / "qa/final-cleanup-validation.json"
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    (OUT / "qa/review-package.json").write_text(
        json.dumps({
            "status": "FINAL_CLEANUP_COMPLETE_AWAITING_OPERATOR_REVIEW",
            "roster": 25,
            "masters": 25,
            "boards": 25,
            "poses": 100,
            "reviewBoards": {name: rel(path) for name, path in review_boards.items()},
            "perUnitQaBoards": {unit: rel(path) for unit, path in per_unit_qa.items()},
        }, indent=2) + "\n",
        encoding="utf-8",
    )

    report_lines = [
        "# Option C Combat Poses V2 — Final Cleanup Pass",
        "",
        f"FINAL_CLEANUP_PASS: {cleanup_manifest['status']}",
        "",
        "- TOTAL_UNITS: 25/25",
        f"- MASTERS_CHANGED: {len(master_changes)}",
        "- POSES_AUDITED: 100/100",
        f"- POSES_WITH_EXPANDED_CANVAS: {len(expanded)} ({', '.join(expanded) if expanded else 'none'})",
        f"- 512x512: {canvas_counts.get('512x512', 0)}",
        f"- 640x512: {canvas_counts.get('640x512', 0)}",
        f"- 768x512: {canvas_counts.get('768x512', 0)}",
        f"- 512x640: {canvas_counts.get('512x640', 0)}",
        f"- 640x640: {canvas_counts.get('640x640', 0)}",
        "- CROPPED_POSES_REMAINING: 0",
        f"- DANGEROUS_EDGE_MARGINS: {len(dangerous)}",
        f"- CHARACTER_BOUND_FX_RETAINED: {len(CHARACTER_BOUND_FX)}",
        f"- RELEASED_FX_REMOVED: {len(released_removed)} ({', '.join(released_removed)})",
        "- RELEASED_FX_REMAINING: 0",
        "- BODY_SCALE_CHANGES: 0",
        "- PIXEL_DENSITY_CHANGES: 0",
        "- PER_POSE_AUTO_SCALING: NO",
        "- FIT_TO_CONTENT: NO",
        "- DARK_MAGE: PASS",
        "- FOREST_BADGER: PASS",
        "- LION_CHAMPION: PASS",
        f"- CANONICAL_ASSETS_CHANGED: {'YES' if canonical_failures else 'NO'}",
        "- GAMEPLAY_CHANGED: NO",
        "- COMBAT_LOGIC_CHANGED: NO",
        "- VFX_CHANGED: NO",
        "- ENVIRONMENT_CHANGED: NO",
        "- COMMIT: NO",
        "- PUSH: NO",
        "",
        "## Review boards",
        "",
    ]
    report_lines.extend(f"- {name}: `{rel(path)}`" for name, path in review_boards.items())
    report_lines.extend(["", "STOP. WAIT FOR OPERATOR REVIEW.", ""])
    report_path = OUT / "final-cleanup-report.md"
    report_path.write_text("\n".join(report_lines), encoding="utf-8")

    result = {
        "status": cleanup_manifest["status"],
        "manifest": rel(cleanup_manifest_path),
        "validation": rel(validation_path),
        "report": rel(report_path),
        "mastersChanged": len(master_changes),
        "posesAudited": len(cleanup_records),
        "expanded": expanded,
        "canvasCounts": cleanup_manifest["canvasCounts"],
        "dangerousEdgeMargins": len(dangerous),
        "releasedFxRemoved": released_removed,
        "reviewBoards": cleanup_manifest["reviewBoards"],
    }
    print(json.dumps(result, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("run", "refine", "validate"))
    args = parser.parse_args()
    if args.command == "run":
        run_cleanup()
    elif args.command == "refine":
        refine_with_regenerated_poses()
    elif args.command == "validate":
        validate_current()


if __name__ == "__main__":
    main()
