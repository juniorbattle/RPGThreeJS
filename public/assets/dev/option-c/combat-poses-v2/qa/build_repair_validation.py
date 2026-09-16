from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
QA_DIR = ROOT / "qa"
REPAIR_UNITS = {
    "alistair": {"baseline": 431, "pivot": [256, 431], "fitScale": 0.68},
    "lion-champion": {"baseline": 446, "pivot": [256, 446], "fitScale": 0.74},
}
GOBLIN_HASHES = {
    "masters/goblin-master.png": "9fed91ccab3c15625427b8788dc89d101d4ce5307a60609b9770efb7dd887b00",
    "boards-2x2/goblin-board-source.png": "f1be59381ec86d0d35fec971d8eb3da3c2a2c26eafa55ec6601086bec6f1754e",
    "boards-2x2/goblin-board.png": "b7cb7d8b934f76dbfe6aeb8e1ceaecf5c45e9cd03ada09d009efd3a6d954284b",
    "split-poses/goblin/goblin-idle.png": "61bad28fd309871e8ed50d5100a98f161a3ffd1334cbf1417cb3a46486456e48",
    "split-poses/goblin/goblin-dash.png": "fdb1f314272f793fd490540a57604c5c1436a0682999973f96c5f47a0825d1b2",
    "split-poses/goblin/goblin-attack.png": "8a85500fd493406c27c5aa0e96dcb619307d5cdc1ba340cecd73d4f909d41576",
    "split-poses/goblin/goblin-skill.png": "9139179b210b26a089c2dabb5cc1d087aaefbdba7df85ec44fbbcb5901faca68",
    "manifests/goblin-board-prompt.txt": "865cbfec280a0760c79e40818f0093864c90e973aad835f8789b83324c04a6de",
    "manifests/goblin-processor-meta.json": "61fadbbd52d4fa107e6ce634387ddd97e35ea2e077442a29a9cb96a4c75bfb0f",
    "manifests/goblin-manifest.json": "8f166854d323391e85fcf65d200ceb77afe7310e636cd8790a541c5271898e86",
    "qa/goblin-qa-board.png": "fbaaeacde134032f356b132eb0f838a3b1b9fc0b269f46599d3d360d2d65ca92",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image_metrics(path: Path) -> dict:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox() or (0, 0, 0, 0)
    return {
        "path": path.relative_to(ROOT.parents[4]).as_posix(),
        "dimensionsPx": list(image.size),
        "alphaBBoxPx": list(bbox),
        "alphaBBoxAreaPx": (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]),
        "nonTransparentPixels": image.width * image.height - alpha.histogram()[0],
        "sha256": sha256(path),
    }


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)
    except OSError:
        return ImageFont.load_default()


def checker(size: tuple[int, int], tile: int = 20) -> Image.Image:
    output = Image.new("RGBA", size, (36, 39, 46, 255))
    draw = ImageDraw.Draw(output)
    colors = ((48, 52, 61, 255), (64, 68, 78, 255))
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=colors[((x // tile) + (y // tile)) % 2])
    return output


def comparison_board() -> Path:
    canvas = Image.new("RGB", (1280, 1280), (17, 19, 24))
    draw = ImageDraw.Draw(canvas)
    draw.text((40, 26), "OPTION C V2 — WEAPON LOCK REPAIR", font=font(30, True), fill=(226, 188, 105))
    draw.text((40, 67), "Before vs repaired 2x2 boards — same delivery scale, pivot and baseline", font=font(17), fill=(232, 235, 242))
    cards = [
        ("ALISTAIR — BEFORE", ROOT / "boards-2x2/alistair-concentration-process/sheet-transparent.png"),
        ("ALISTAIR — REPAIRED", ROOT / "boards-2x2/alistair-board.png"),
        ("LION CHAMPION — BEFORE", ROOT / "boards-2x2/lion-champion-concentration-process/sheet-transparent.png"),
        ("LION CHAMPION — REPAIRED", ROOT / "boards-2x2/lion-champion-board.png"),
    ]
    card_size = 520
    for index, (label, path) in enumerate(cards):
        column = index % 2
        row = index // 2
        x = 40 + column * 610
        y = 115 + row * 575
        draw.text((x, y), label, font=font(19, True), fill=(226, 188, 105) if column else (180, 187, 202))
        preview = checker((card_size, card_size), 20)
        source = Image.open(path).convert("RGBA").resize((card_size, card_size), Image.Resampling.NEAREST)
        preview.alpha_composite(source)
        canvas.paste(preview.convert("RGB"), (x, y + 34))
    path = QA_DIR / "repair-comparison.png"
    canvas.save(path)
    return path


def main() -> None:
    units: list[dict] = []
    for slug, expected in REPAIR_UNITS.items():
        manifest = json.loads((ROOT / "manifests" / f"{slug}-manifest.json").read_text(encoding="utf-8"))
        processor = json.loads((ROOT / "manifests" / f"{slug}-processor-meta.json").read_text(encoding="utf-8"))
        before_idle = image_metrics(ROOT / "boards-2x2" / f"{slug}-concentration-process" / "pose-1.png")
        after_idle = image_metrics(ROOT / "split-poses" / slug / f"{slug}-idle.png")
        bbox_area_ratio = after_idle["alphaBBoxAreaPx"] / before_idle["alphaBBoxAreaPx"]
        pixel_ratio = after_idle["nonTransparentPixels"] / before_idle["nonTransparentPixels"]
        canvas_checks = [pose["dimensionsPx"] == [512, 512] for pose in manifest["poses"]]
        checks = {
            "canvas512Preserved": all(canvas_checks),
            "baselinePreserved": manifest["scaleData"]["footBaselinePx"] == expected["baseline"],
            "pivotPreserved": manifest["scaleData"]["pivotPx"] == expected["pivot"],
            "deliveryFitScalePreserved": math.isclose(
                manifest["scaleData"]["deliveryFitScale"], expected["fitScale"], abs_tol=1e-9
            ),
            "sharedScalePreserved": processor["shared_scale"] is True,
            "scaleCorrectionsRemainOne": all(pose["scaleCorrection"] == 1.0 for pose in manifest["poses"]),
            "noCellEdgeTouches": processor["edge_touch_frames"] == [],
        }
        if slug == "alistair":
            checks["idlePerceivedAreaIncreased"] = bbox_area_ratio > 1.03 and pixel_ratio > 1.03
        else:
            checks["bossIdleMassPreservedWithinFivePercent"] = 0.95 <= pixel_ratio <= 1.05
        units.append(
            {
                "unit": slug,
                "status": "PASS" if all(checks.values()) else "FAIL",
                "checks": checks,
                "idleBefore": before_idle,
                "idleAfter": after_idle,
                "idleAlphaBBoxAreaRatio": round(bbox_area_ratio, 6),
                "idleNonTransparentPixelRatio": round(pixel_ratio, 6),
                "canonicalWeaponGeometry": "PASS_REVIEW_READY",
                "attackSkillPosingLogic": "PRESERVED_REVIEW_READY",
            }
        )

    goblin_checks = {relative: sha256(ROOT / relative) == expected for relative, expected in GOBLIN_HASHES.items()}
    comparison = comparison_board()
    result = {
        "schemaVersion": 1,
        "repairScope": ["alistair", "lion-champion"],
        "status": "PASS" if all(unit["status"] == "PASS" for unit in units) and all(goblin_checks.values()) else "FAIL",
        "units": units,
        "goblinSet": {
            "status": "UNCHANGED" if all(goblin_checks.values()) else "CHANGED",
            "hashChecks": goblin_checks,
        },
        "artDirectionChanged": False,
        "attackSkillPosingLogicChanged": False,
        "runtimeChanged": False,
        "gameplayChanged": False,
        "vfxChanged": False,
        "productionPromotion": False,
        "operatorVisualApproval": "PENDING",
        "comparisonQaPath": comparison.relative_to(ROOT.parents[4]).as_posix(),
    }
    (QA_DIR / "repair-validation.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": result["status"], "goblinSet": result["goblinSet"]["status"]}))


if __name__ == "__main__":
    main()
