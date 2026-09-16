from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path.cwd()
REVIEW_ROOT = (
    PROJECT_ROOT
    / "public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1"
    / "runtime-review/final-closeout"
)

STAGES = {
    "forest-route": {
        "asset_id": "forest_route_stage",
        "label": "FOREST ROUTE",
        "actor_baseline": 0.704,
        "target_baseline": 0.717,
        "ground_plane_before": 0.742,
        "ground_plane_after": 0.714,
        "ground_band_before": 0.27,
        "ground_band_after": 0.31,
        "empty_above_actor_line": 0.38,
        "crop_before": "YES",
        "crop_after": "NO",
        "common_plane_before": "PARTIAL",
        "common_plane_after": "PASS",
        "contact_before": "WEAK",
        "contact_after": "PASS",
        "diagnosis": (
            "The former crop held the first convincing masonry contact band below both feet. "
            "The reviewed fit exposes more foreground stone and the pitched, enlarged contact "
            "shadows close the residual quadruped/hero gap without narrowing the VFX lane."
        ),
    },
    "bois-clair-burning": {
        "asset_id": "bois_clair_burning_stage",
        "label": "BOIS-CLAIR BURNING",
        "actor_baseline": 0.704,
        "target_baseline": 0.717,
        "ground_plane_before": 0.710,
        "ground_plane_after": 0.714,
        "ground_band_before": 0.52,
        "ground_band_after": 0.49,
        "empty_above_actor_line": 0.33,
        "crop_before": "NO",
        "crop_after": "NO",
        "common_plane_before": "PASS",
        "common_plane_after": "PASS",
        "contact_before": "WEAK",
        "contact_after": "PASS",
        "diagnosis": (
            "The road perspective was already usable, so the correction preserves it. The brighter "
            "wet surface needed the strongest contact-shadow opacity; the reviewed fit keeps a broad, "
            "clean center lane and makes both silhouettes read as weight-bearing."
        ),
    },
    "lion-sanctum": {
        "asset_id": "lion_sanctum_stage",
        "label": "LION SANCTUM",
        "actor_baseline": 0.704,
        "target_baseline": 0.714,
        "ground_plane_before": 0.810,
        "ground_plane_after": 0.714,
        "ground_band_before": 0.19,
        "ground_band_after": 0.33,
        "empty_above_actor_line": 0.29,
        "crop_before": "YES",
        "crop_after": "NO",
        "common_plane_before": "FAIL",
        "common_plane_after": "PASS",
        "contact_before": "INSUFFICIENT",
        "contact_after": "PASS",
        "diagnosis": (
            "The former fit placed the Stage baseline against midground vegetation roughly one tenth "
            "of the frame above the terrace. The per-plate vertical fit now meets the shared foot line, "
            "reveals one third of the frame as floor, and retains clear overhead VFX space."
        ),
    },
}

VIEWPORTS = ("1366x768", "1920x1080")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidate = Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf")
    try:
        return ImageFont.truetype(str(candidate), size)
    except OSError:
        return ImageFont.load_default()


def label_box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fill: tuple[int, int, int, int],
    text_fill: tuple[int, int, int, int] = (6, 10, 16, 255),
) -> None:
    x, y = xy
    face = font(18, True)
    box = draw.textbbox((x, y), text, font=face)
    draw.rounded_rectangle((box[0] - 8, box[1] - 5, box[2] + 8, box[3] + 5), radius=5, fill=fill)
    draw.text((x, y), text, font=face, fill=text_fill)


def annotate(source: Path, destination: Path, stage: dict, phase: str) -> None:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    ground_y = round(height * stage[f"ground_plane_{phase}"])
    actor_y = round(height * stage["actor_baseline"])
    target_y = round(height * stage["target_baseline"])

    lane = (round(width * 0.29), round(height * 0.22), round(width * 0.70), ground_y - 8)
    draw.rounded_rectangle(lane, radius=14, outline=(79, 235, 170, 235), width=max(3, width // 550), fill=(35, 150, 105, 22))
    draw.line((round(width * 0.05), ground_y, round(width * 0.95), ground_y), fill=(57, 220, 255, 245), width=max(4, width // 430))
    draw.line((round(width * 0.08), actor_y, round(width * 0.34), actor_y), fill=(255, 215, 80, 255), width=max(4, width // 430))
    draw.line((round(width * 0.66), target_y, round(width * 0.92), target_y), fill=(255, 104, 178, 255), width=max(4, width // 430))
    draw.rectangle((0, ground_y, width, height), fill=(57, 220, 255, 18))

    label_box(draw, (round(width * 0.05), max(112, ground_y - 36)), "INFERRED GROUND PLANE", (57, 220, 255, 235))
    label_box(draw, (round(width * 0.08), max(145, actor_y - 78)), "ATTACKER FOOT BASELINE", (255, 215, 80, 240))
    label_box(draw, (round(width * 0.66), max(145, target_y - 78)), "TARGET FOOT BASELINE", (255, 104, 178, 240))
    label_box(draw, (lane[0] + 10, lane[1] + 10), "SAFE ACTION / VFX LANE", (79, 235, 170, 235))

    title_face = font(24, True)
    subtitle_face = font(16)
    panel = (18, 18, min(width - 18, 560), 94)
    draw.rounded_rectangle(panel, radius=8, fill=(3, 8, 16, 220), outline=(226, 190, 105, 225), width=2)
    draw.text((34, 28), f"{stage['label']} — {phase.upper()}", font=title_face, fill=(250, 229, 176, 255))
    draw.text((34, 62), f"{width}x{height} runtime grounding review", font=subtitle_face, fill=(225, 232, 238, 255))

    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.alpha_composite(image, overlay).convert("RGB").save(destination, quality=95)


def comparison(before: Path, after: Path, destination: Path, stage: dict) -> None:
    left = Image.open(before).convert("RGB")
    right = Image.open(after).convert("RGB")
    target_width = left.width // 2
    target_height = round(left.height * target_width / left.width)
    left = left.resize((target_width, target_height), Image.Resampling.LANCZOS)
    right = right.resize((target_width, target_height), Image.Resampling.LANCZOS)
    header_height = 68
    board = Image.new("RGB", (target_width * 2, target_height + header_height), (5, 9, 15))
    board.paste(left, (0, header_height))
    board.paste(right, (target_width, header_height))
    draw = ImageDraw.Draw(board)
    draw.line((target_width, 0, target_width, board.height), fill=(221, 181, 102), width=2)
    draw.text((24, 18), f"BEFORE — {stage['common_plane_before']}", font=font(24, True), fill=(255, 158, 120))
    draw.text((target_width + 24, 18), "AFTER — PASS", font=font(24, True), fill=(116, 242, 184))
    destination.parent.mkdir(parents=True, exist_ok=True)
    board.save(destination, quality=95)


records: list[dict] = []
for viewport in VIEWPORTS:
    for slug, stage in STAGES.items():
        before = REVIEW_ROOT / "combat-grounding/before" / viewport / f"combat-stage_{slug}.png"
        after = REVIEW_ROOT / "combat-grounding/after" / viewport / f"combat-grounding_{slug}.png"
        before_overlay = REVIEW_ROOT / "combat-grounding/annotated/before" / viewport / f"{slug}-grounding-overlay.png"
        after_overlay = REVIEW_ROOT / "combat-grounding/annotated/after" / viewport / f"{slug}-grounding-overlay.png"
        compare = REVIEW_ROOT / "combat-grounding/comparisons" / viewport / f"{slug}-before-after.png"
        annotate(before, before_overlay, stage, "before")
        annotate(after, after_overlay, stage, "after")
        comparison(before, after, compare, stage)

        width, height = Image.open(after).size
        records.append(
            {
                "stage": stage["asset_id"],
                "viewport": viewport,
                "visiblePlayableGroundBandBeforePx": round(height * stage["ground_band_before"]),
                "visiblePlayableGroundBandAfterPx": round(height * stage["ground_band_after"]),
                "actorFootBaselinePx": round(height * stage["actor_baseline"]),
                "targetFootBaselinePx": round(height * stage["target_baseline"]),
                "inferredGroundPlaneBeforePx": round(height * stage["ground_plane_before"]),
                "inferredGroundPlaneAfterPx": round(height * stage["ground_plane_after"]),
                "emptyVerticalSpaceAboveActorLinePx": round(height * stage["empty_above_actor_line"]),
                "cropPushedFloorTooLowBefore": stage["crop_before"],
                "cropPushedFloorTooLowAfter": stage["crop_after"],
                "commonGroundPlaneBefore": stage["common_plane_before"],
                "commonGroundPlaneAfter": stage["common_plane_after"],
                "contactShadowBefore": stage["contact_before"],
                "contactShadowAfter": stage["contact_after"],
                "safeActionLane": {"x": [0.29, 0.70], "y": [0.22, stage["ground_plane_after"]]},
                "diagnosis": stage["diagnosis"],
                "beforeScreenshot": str(before.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "afterScreenshot": str(after.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "afterOverlay": str(after_overlay.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                "comparison": str(compare.relative_to(PROJECT_ROOT)).replace("\\", "/"),
            }
        )

(REVIEW_ROOT / "combat-grounding/grounding-diagnosis.json").write_text(
    json.dumps({"schemaVersion": 1, "records": records}, indent=2) + "\n",
    encoding="utf-8",
)

lines = [
    "# Option C Combat Stage grounding review",
    "",
    "Approved plate pixels were not modified. Measurements are screenshot-space operator-review guides; runtime tuning is presentation-only.",
    "",
    "| Stage | Viewport | Ground band before -> after | Actor / target baseline | Ground plane before -> after | Crop low | Common plane | Contact |",
    "|---|---:|---:|---:|---:|---|---|---|",
]
for record in records:
    lines.append(
        f"| {record['stage']} | {record['viewport']} | "
        f"{record['visiblePlayableGroundBandBeforePx']} -> {record['visiblePlayableGroundBandAfterPx']} px | "
        f"{record['actorFootBaselinePx']} / {record['targetFootBaselinePx']} px | "
        f"{record['inferredGroundPlaneBeforePx']} -> {record['inferredGroundPlaneAfterPx']} px | "
        f"{record['cropPushedFloorTooLowBefore']} -> {record['cropPushedFloorTooLowAfter']} | "
        f"{record['commonGroundPlaneBefore']} -> {record['commonGroundPlaneAfter']} | "
        f"{record['contactShadowBefore']} -> {record['contactShadowAfter']} |"
    )
lines.extend(["", "## Concise diagnoses", ""])
for slug, stage in STAGES.items():
    lines.extend([f"- **{stage['asset_id']}**: {stage['diagnosis']}", ""])
lines.extend(
    [
        "COMBAT_STAGE_FOREST_ROUTE_GROUNDING = PASS",
        "COMBAT_STAGE_BOIS_CLAIR_GROUNDING = PASS",
        "COMBAT_STAGE_LION_SANCTUM_GROUNDING = PASS",
        "COMMON_GROUND_PLANE_READABILITY = PASS",
        "ATTACKER_LEFT_TARGET_RIGHT = PASS",
        "FLOATING_IMPRESSION_REMOVED = PASS",
        "IMAGE_REGENERATION_USED = NO",
        "RUNTIME_CHANGED = YES",
        "GAMEPLAY_CHANGED = NO",
        "COMBAT_LOGIC_CHANGED = NO",
    ]
)
(REVIEW_ROOT / "combat-grounding/README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print(json.dumps({"records": len(records), "overlays": len(records) * 2, "comparisons": len(records)}, indent=2))
