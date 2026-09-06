#!/usr/bin/env python3
"""Deterministic CIN-4 first-frame compositor driven only by the shot spec."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


CANONICAL_FACING = "SCREEN_RIGHT"
FRAME_SIZE = (1920, 1080)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def orient_character(image: Image.Image, facing: str) -> Image.Image:
    """Return a new oriented image; canonical source pixels are never mutated."""
    rgba = image.convert("RGBA")
    if facing == CANONICAL_FACING:
        return rgba.copy()
    if facing == "SCREEN_LEFT":
        return rgba.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    raise ValueError(f"Unsupported facing: {facing}")


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Character asset has no visible alpha pixels.")
    return image.crop(bbox)


def scale_to_height(image: Image.Image, height_px: int) -> Image.Image:
    if height_px <= 0:
        raise ValueError("heightPx must be positive.")
    width_px = max(1, round(image.width * height_px / image.height))
    return image.resize((width_px, height_px), Image.Resampling.LANCZOS)


def placement_box(character: dict[str, Any], image_size: tuple[int, int], frame_size: tuple[int, int]) -> tuple[int, int, int, int]:
    frame_width, frame_height = frame_size
    image_width, image_height = image_size
    center_x = round(float(character["position"]["x"]) * frame_width)
    ground_y = round(float(character["position"]["groundY"]) * frame_height)
    left = center_x - image_width // 2
    top = ground_y - image_height
    return left, top, left + image_width, top + image_height


def cover_background(image: Image.Image, frame_size: tuple[int, int] = FRAME_SIZE) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), frame_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def _shadow(character_image: Image.Image, box: tuple[int, int, int, int]) -> tuple[Image.Image, tuple[int, int]]:
    width = max(48, round(character_image.width * 0.58))
    height = max(14, round(character_image.height * 0.035))
    layer = Image.new("RGBA", (width + 48, height + 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((24, 24, 24 + width, 24 + height), fill=(14, 8, 4, 112))
    layer = layer.filter(ImageFilter.GaussianBlur(max(5, height // 3)))
    center_x = (box[0] + box[2]) // 2
    return layer, (center_x - layer.width // 2, box[3] - layer.height // 2)


def _atmosphere(frame: Image.Image) -> Image.Image:
    width, height = frame.size
    grade = ImageEnhance.Color(frame).enhance(1.06)
    warm = Image.new("RGBA", frame.size, (225, 142, 58, 0))
    warm_alpha = Image.new("L", frame.size, 0)
    warm_draw = ImageDraw.Draw(warm_alpha)
    warm_draw.ellipse((-width // 5, -height // 2, width * 3 // 5, height), fill=22)
    warm.putalpha(warm_alpha.filter(ImageFilter.GaussianBlur(90)))
    result = Image.alpha_composite(grade.convert("RGBA"), warm)

    vignette = Image.new("L", frame.size, 0)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse((-width // 8, -height // 5, width + width // 8, height + height // 3), fill=255)
    vignette = ImageOps.invert(vignette.filter(ImageFilter.GaussianBlur(150)))
    dark = Image.new("RGBA", frame.size, (8, 5, 10, 0))
    dark.putalpha(vignette.point(lambda value: round(value * 0.30)))
    return Image.alpha_composite(result, dark)


def _sealed_artefact(size_px: int) -> Image.Image:
    """Draw a deterministic neutral seal marker; it encodes existence, not interpretation."""
    width = size_px
    height = max(24, round(size_px * 0.58))
    layer = Image.new("RGBA", (width + 24, height + 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    box = (12, 12, 12 + width - 1, 12 + height - 1)
    draw.ellipse(box, fill=(24, 50, 43, 255), outline=(211, 153, 66, 255), width=max(3, size_px // 18))
    inset = max(8, size_px // 7)
    draw.ellipse((box[0] + inset, box[1] + inset // 2, box[2] - inset, box[3] - inset // 2), outline=(109, 178, 137, 255), width=max(2, size_px // 24))
    draw.line((width // 2 + 12, box[1] + inset, width // 2 + 12, box[3] - inset), fill=(211, 153, 66, 255), width=max(2, size_px // 24))
    return layer.filter(ImageFilter.GaussianBlur(0.35))


def compose_shot(spec: dict[str, Any], shot: dict[str, Any], project_root: Path) -> tuple[Image.Image, dict[str, Any]]:
    if shot["source"]["type"] not in {"ROOT_SOURCE", "CUT_SOURCE"}:
        raise ValueError("Only ROOT_SOURCE and CUT_SOURCE shots can be composited.")

    environment_path = (project_root / shot["environment"]).resolve()
    with Image.open(environment_path) as environment:
        frame = cover_background(environment, (spec["frame"]["width"], spec["frame"]["height"]))
    frame = _atmosphere(frame)

    prop_placements: list[dict[str, Any]] = []
    for prop in sorted(shot.get("props", []), key=lambda item: item["id"]):
        if prop["kind"] != "SEALED_ARTEFACT":
            raise ValueError(f"Unsupported deterministic prop kind: {prop['kind']}")
        rendered = _sealed_artefact(int(prop["sizePx"]))
        center_x = round(float(prop["position"]["x"]) * frame.width)
        ground_y = round(float(prop["position"]["groundY"]) * frame.height)
        left = center_x - rendered.width // 2
        top = ground_y - rendered.height
        frame.alpha_composite(rendered, (left, top))
        prop_placements.append({
            "id": prop["id"], "kind": prop["kind"], "position": prop["position"],
            "sizePx": prop["sizePx"], "box": [left, top, left + rendered.width, top + rendered.height],
        })

    placements: list[dict[str, Any]] = []
    prepared: list[tuple[dict[str, Any], Image.Image, tuple[int, int, int, int]]] = []
    for character in sorted(shot["characters"], key=lambda item: (int(item["depth"]), item["id"])):
        asset_path = (project_root / character["asset"]).resolve()
        before_hash = sha256(asset_path)
        with Image.open(asset_path) as asset:
            oriented = orient_character(asset, character["facing"])
        oriented = trim_alpha(oriented)
        scaled = scale_to_height(oriented, int(character["heightPx"]))
        box = placement_box(character, scaled.size, frame.size)
        prepared.append((character, scaled, box))
        placements.append({
            "id": character["id"],
            "asset": character["asset"],
            "assetSha256": before_hash,
            "facing": character["facing"],
            "mirroredBeforeScaling": character["facing"] != CANONICAL_FACING,
            "depth": character["depth"],
            "role": character["role"],
            "action": character["action"],
            "lookTarget": character["lookTarget"],
            "box": list(box),
        })

    for character, scaled, box in prepared:
        shadow, shadow_position = _shadow(scaled, box)
        frame.alpha_composite(shadow, shadow_position)
        if character["role"] == "PRIMARY":
            alpha = scaled.getchannel("A").filter(ImageFilter.GaussianBlur(14))
            halo = Image.new("RGBA", scaled.size, (242, 180, 84, 0))
            halo.putalpha(alpha.point(lambda value: round(value * 0.20)))
            frame.alpha_composite(halo, (box[0], box[1]))
        frame.alpha_composite(scaled, (box[0], box[1]))

    metadata = {
        "schemaVersion": 1,
        "sequenceId": spec["sequenceId"],
        "cinematicId": spec["cinematicId"],
        "tier": spec["tier"],
        "shotId": shot["shotId"],
        "sourceType": shot["source"]["type"],
        "frame": {"width": frame.width, "height": frame.height},
        "environment": shot["environment"],
        "environmentSha256": sha256(environment_path),
        "canonicalFacing": CANONICAL_FACING,
        "placementsBackToFront": placements,
        "deterministicProps": prop_placements,
    }
    return frame.convert("RGB"), metadata


def write_shot(spec: dict[str, Any], shot: dict[str, Any], project_root: Path, force: bool = False) -> tuple[Path, Path]:
    output = (project_root / shot["source"]["output"]).resolve()
    sequence_root = (project_root / "tmp" / "cinematics" / "cin4" / spec["sequenceId"]).resolve()
    if sequence_root != output and sequence_root not in output.parents:
        raise ValueError(f"Output escapes CIN-4 sequence root: {output}")
    metadata_path = output.with_suffix(".composition.json")
    if not force:
        for path in (output, metadata_path):
            if path.exists():
                raise FileExistsError(f"Refusing to overwrite existing source artifact: {path}")
    output.parent.mkdir(parents=True, exist_ok=True)
    frame, metadata = compose_shot(spec, shot, project_root)
    frame.save(output, format="PNG", optimize=True)
    metadata["outputPath"] = output.relative_to(project_root).as_posix()
    metadata["outputSha256"] = sha256(output)
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return output, metadata_path


def contact_sheet(paths: list[tuple[str, Path]], output: Path) -> None:
    thumbs: list[tuple[str, Image.Image]] = []
    for label, path in paths:
        with Image.open(path) as image:
            thumbs.append((label, ImageOps.fit(image.convert("RGB"), (800, 450), method=Image.Resampling.LANCZOS)))
    sheet = Image.new("RGB", (840, len(thumbs) * 500 + 30), (22, 18, 22))
    draw = ImageDraw.Draw(sheet)
    for index, (label, thumb) in enumerate(thumbs):
        top = 30 + index * 500
        sheet.paste(thumb, (20, top))
        draw.text((24, top + 456), label, fill=(244, 226, 189))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True)


def find_project_root(start: Path) -> Path:
    current = start.resolve()
    while current != current.parent:
        if (current / "package.json").is_file():
            return current
        current = current.parent
    raise FileNotFoundError("Could not locate repository root.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", required=True)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--shot")
    selection.add_argument("--all-root-cut", action="store_true")
    parser.add_argument("--contact-sheet", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    project_root = find_project_root(Path(__file__).parent)
    spec_path = (project_root / args.spec).resolve()
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    eligible = [shot for shot in spec["shots"] if shot["source"]["type"] in {"ROOT_SOURCE", "CUT_SOURCE"}]
    if args.shot:
        eligible = [shot for shot in eligible if shot["shotId"] == args.shot]
        if not eligible:
            raise ValueError(f"No compositable shot named {args.shot}.")

    outputs: list[tuple[str, Path]] = []
    for shot in eligible:
        output, metadata = write_shot(spec, shot, project_root, args.force)
        outputs.append((shot["shotId"], output))
        print(f"Composited {output.relative_to(project_root).as_posix()} and {metadata.relative_to(project_root).as_posix()}.")
    if args.contact_sheet:
        sheet = project_root / "tmp" / "cinematics" / "cin4" / spec["sequenceId"] / "source_contact_sheet.png"
        if sheet.exists() and not args.force:
            raise FileExistsError(f"Refusing to overwrite contact sheet: {sheet}")
        contact_sheet(outputs, sheet)
        print(f"Wrote {sheet.relative_to(project_root).as_posix()}.")


if __name__ == "__main__":
    main()
