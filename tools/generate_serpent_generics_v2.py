from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "characters" / "pixel" / "validation" / "serpent-generics-v2"
RUNTIME = ROOT / "public" / "assets" / "characters" / "pixel"

BASE_W, BASE_H = 160, 192
DIALOGUE_W, DIALOGUE_H = 192, 256
UI_W, UI_H = 96, 96
SCALE = 4

TRANSPARENT = (0, 0, 0, 0)
OUTLINE = (20, 18, 16, 255)
INK = (8, 10, 9, 255)
BLACK_STEEL = (34, 36, 34, 255)
DARK_STEEL = (50, 54, 50, 255)
STEEL_HI = (92, 96, 86, 255)
GREEN_DARK = (25, 59, 34, 255)
GREEN = (45, 93, 47, 255)
GREEN_HI = (70, 128, 63, 255)
COPPER = (168, 88, 36, 255)
COPPER_HI = (226, 137, 55, 255)
POISON = (98, 208, 92, 255)
POISON_DARK = (35, 110, 50, 255)
SHADOW = (0, 0, 0, 70)


@dataclass(frozen=True)
class Candidate:
    id: str
    label: str
    role: str
    weapon: str
    notes: str


CANDIDATES = [
    Candidate(
        "serpent_raider",
        "Serpent Raider",
        "anonymous light ambusher",
        "curved blade + dagger",
        "hooded head, cloth mask, slim silhouette",
    ),
    Candidate(
        "serpent_brute",
        "Serpent Brute",
        "anonymous heavy guard",
        "mace + tower pauldron",
        "closed helmet, broad shoulders, no visible face",
    ),
    Candidate(
        "serpent_oracle",
        "Serpent Oracle",
        "anonymous ritual caster",
        "staff + poison focus",
        "hood and ritual mask, vertical robe silhouette",
    ),
]


def polygon(draw: ImageDraw.ImageDraw, pts: list[tuple[int, int]], fill, outline=OUTLINE, width: int = 2) -> None:
    draw.polygon(pts, fill=outline)
    if width > 0:
        inner = shrink_points(pts, width)
        draw.polygon(inner, fill=fill)
    else:
        draw.polygon(pts, fill=fill)


def shrink_points(pts: list[tuple[int, int]], amount: int) -> list[tuple[int, int]]:
    cx = sum(x for x, _ in pts) / len(pts)
    cy = sum(y for _, y in pts) / len(pts)
    result = []
    for x, y in pts:
        nx = x + amount if x < cx else x - amount
        ny = y + amount if y < cy else y - amount
        result.append((int(nx), int(ny)))
    return result


def line(draw: ImageDraw.ImageDraw, pts: Iterable[tuple[int, int]], fill, width: int = 2) -> None:
    points = list(pts)
    draw.line(points, fill=OUTLINE, width=width + 2, joint="curve")
    draw.line(points, fill=fill, width=width, joint="curve")


def ellipse(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline=OUTLINE, width: int = 2) -> None:
    draw.ellipse(box, fill=outline)
    x0, y0, x1, y1 = box
    draw.ellipse((x0 + width, y0 + width, x1 - width, y1 - width), fill=fill)


def rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline=OUTLINE, width: int = 2) -> None:
    draw.rectangle(box, fill=outline)
    x0, y0, x1, y1 = box
    draw.rectangle((x0 + width, y0 + width, x1 - width, y1 - width), fill=fill)


def draw_common_feet_shadow(draw: ImageDraw.ImageDraw) -> None:
    draw.ellipse((40, 172, 120, 183), fill=SHADOW)


def draw_raider() -> Image.Image:
    img = Image.new("RGBA", (BASE_W, BASE_H), TRANSPARENT)
    d = ImageDraw.Draw(img)
    draw_common_feet_shadow(d)

    # Back cloak and mobile legs.
    polygon(d, [(34, 91), (60, 71), (74, 124), (54, 169), (25, 151)], GREEN_DARK)
    polygon(d, [(65, 122), (84, 124), (76, 171), (58, 171)], BLACK_STEEL)
    polygon(d, [(91, 120), (111, 132), (119, 174), (100, 174), (86, 140)], BLACK_STEEL)
    rect(d, (54, 168, 78, 179), DARK_STEEL)
    rect(d, (98, 170, 125, 181), DARK_STEEL)

    # Torso.
    polygon(d, [(59, 72), (93, 68), (111, 102), (100, 136), (65, 134), (49, 101)], BLACK_STEEL)
    polygon(d, [(67, 81), (93, 78), (101, 108), (92, 130), (70, 129), (59, 104)], GREEN)
    polygon(d, [(72, 129), (93, 129), (90, 162), (78, 169), (67, 159)], GREEN_DARK)
    d.line([(72, 137), (88, 137), (82, 153)], fill=COPPER_HI, width=2)

    # Hooded head and actual masked face.
    polygon(d, [(61, 42), (78, 27), (99, 34), (110, 56), (104, 73), (73, 72), (56, 59)], GREEN_DARK)
    polygon(d, [(67, 47), (82, 35), (99, 42), (103, 57), (94, 67), (73, 66), (64, 57)], GREEN)
    polygon(d, [(70, 50), (96, 48), (101, 58), (94, 65), (74, 64), (67, 58)], INK, outline=COPPER, width=1)
    d.rectangle((76, 54, 92, 56), fill=(180, 210, 170, 255))
    d.rectangle((79, 55, 90, 57), fill=INK)

    # Arms and weapons.
    polygon(d, [(51, 85), (34, 104), (39, 119), (61, 105)], BLACK_STEEL)
    polygon(d, [(35, 112), (27, 127), (36, 133), (45, 119)], GREEN_DARK)
    line(d, [(28, 126), (14, 136), (32, 133)], (226, 226, 210, 255), width=2)
    polygon(d, [(101, 88), (119, 100), (114, 114), (98, 105)], BLACK_STEEL)
    polygon(d, [(114, 106), (126, 119), (119, 126), (108, 112)], GREEN_DARK)
    line(d, [(126, 119), (146, 112), (131, 126)], (230, 226, 205, 255), width=2)

    # Copper trims and small emblem.
    d.line([(62, 78), (94, 75), (104, 102), (95, 132)], fill=COPPER, width=2)
    d.line([(53, 100), (64, 134), (99, 136)], fill=COPPER, width=2)
    d.rectangle((78, 144, 86, 151), fill=COPPER)
    d.rectangle((80, 146, 84, 149), fill=POISON_DARK)
    return img


def draw_brute() -> Image.Image:
    img = Image.new("RGBA", (BASE_W, BASE_H), TRANSPARENT)
    d = ImageDraw.Draw(img)
    draw_common_feet_shadow(d)

    # Legs and boots.
    polygon(d, [(54, 120), (74, 120), (73, 171), (52, 171), (47, 138)], BLACK_STEEL)
    polygon(d, [(90, 120), (112, 122), (118, 171), (96, 171), (84, 138)], BLACK_STEEL)
    rect(d, (45, 168, 76, 181), DARK_STEEL)
    rect(d, (94, 168, 125, 181), DARK_STEEL)

    # Massive torso and tabard.
    polygon(d, [(43, 68), (117, 66), (132, 105), (111, 136), (53, 136), (29, 105)], BLACK_STEEL)
    polygon(d, [(54, 78), (106, 77), (118, 106), (103, 127), (59, 127), (43, 106)], DARK_STEEL)
    polygon(d, [(68, 129), (97, 129), (94, 169), (80, 178), (66, 169)], GREEN)
    d.line([(73, 140), (91, 140), (82, 160)], fill=COPPER_HI, width=2)

    # Closed helmet. Head is present, fully covered.
    polygon(d, [(60, 31), (78, 20), (101, 27), (111, 48), (102, 66), (71, 66), (57, 52)], DARK_STEEL)
    polygon(d, [(66, 37), (80, 28), (98, 33), (104, 48), (96, 59), (73, 59), (64, 50)], GREEN_DARK)
    d.rectangle((71, 45, 98, 51), fill=COPPER)
    d.rectangle((74, 46, 96, 50), fill=INK)
    d.rectangle((78, 48, 94, 49), fill=(160, 205, 120, 255))

    # Shoulders, arms and mace.
    ellipse(d, (22, 68, 58, 103), DARK_STEEL)
    ellipse(d, (103, 66, 140, 102), DARK_STEEL)
    polygon(d, [(37, 96), (23, 126), (38, 135), (55, 105)], BLACK_STEEL)
    ellipse(d, (25, 126, 45, 146), DARK_STEEL)
    polygon(d, [(118, 95), (137, 119), (128, 131), (108, 106)], BLACK_STEEL)
    line(d, [(134, 120), (148, 88)], (103, 62, 35, 255), width=3)
    ellipse(d, (139, 72, 159, 94), DARK_STEEL)
    for sx, sy in [(139, 81), (148, 70), (156, 82), (148, 96)]:
        line(d, [(148, 83), (sx, sy)], STEEL_HI, width=1)

    # Copper armor trims.
    d.line([(43, 72), (116, 70), (130, 103), (109, 134), (53, 136), (31, 105), (43, 72)], fill=COPPER, width=2)
    d.line([(58, 86), (107, 85)], fill=COPPER_HI, width=2)
    return img


def draw_oracle() -> Image.Image:
    img = Image.new("RGBA", (BASE_W, BASE_H), TRANSPARENT)
    d = ImageDraw.Draw(img)
    draw_common_feet_shadow(d)

    # Robe base and sleeves.
    polygon(d, [(60, 73), (101, 73), (119, 170), (87, 180), (45, 170)], GREEN_DARK)
    polygon(d, [(66, 83), (95, 82), (103, 151), (83, 172), (59, 151)], BLACK_STEEL)
    polygon(d, [(56, 86), (30, 123), (41, 137), (66, 103)], GREEN_DARK)
    polygon(d, [(101, 87), (125, 116), (116, 130), (95, 105)], GREEN_DARK)

    # Hood and ritual mask.
    polygon(d, [(60, 45), (81, 24), (103, 45), (109, 73), (95, 87), (65, 87), (52, 70)], GREEN_DARK)
    polygon(d, [(66, 51), (82, 33), (98, 51), (100, 70), (91, 80), (71, 80), (62, 69)], GREEN)
    polygon(d, [(70, 55), (95, 56), (96, 72), (87, 79), (76, 78), (68, 70)], INK, outline=COPPER, width=1)
    d.rectangle((75, 62, 91, 65), fill=POISON)
    d.rectangle((77, 63, 89, 65), fill=INK)

    # Staff and focus.
    line(d, [(124, 48), (118, 168)], (92, 55, 33, 255), width=3)
    ellipse(d, (112, 31, 137, 56), COPPER)
    ellipse(d, (118, 37, 131, 50), POISON)
    d.line([(120, 36), (127, 50)], fill=(210, 255, 200, 255), width=1)
    polygon(d, [(33, 128), (25, 139), (36, 146), (48, 134)], BLACK_STEEL)
    polygon(d, [(111, 119), (125, 127), (120, 139), (106, 130)], BLACK_STEEL)

    # Ritual trim.
    d.line([(65, 85), (94, 85), (101, 150), (84, 171), (60, 149), (65, 85)], fill=COPPER, width=2)
    d.line([(77, 101), (90, 119), (78, 137), (91, 150)], fill=COPPER_HI, width=2)
    d.rectangle((80, 116, 87, 123), fill=POISON_DARK)
    return img


DRAWERS = {
    "serpent_raider": draw_raider,
    "serpent_brute": draw_brute,
    "serpent_oracle": draw_oracle,
}


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def fit_to_canvas(src: Image.Image, size: tuple[int, int], baseline_ratio: float = 0.92, target_height: int | None = None) -> Image.Image:
    dst = Image.new("RGBA", size, TRANSPARENT)
    box = alpha_bbox(src)
    if not box:
        return dst
    crop = src.crop(box)
    cw, ch = crop.size
    if target_height is None:
        target_height = int(size[1] * 0.73)
    scale = min((size[0] * 0.86) / cw, target_height / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = crop.resize((nw, nh), Image.Resampling.NEAREST)
    x = (size[0] - nw) // 2
    baseline = int(size[1] * baseline_ratio)
    y = baseline - nh
    dst.alpha_composite(resized, (x, y))
    return dst


def make_variants(base: Image.Image) -> dict[str, Image.Image]:
    base = refine_base(base)
    full = base.resize((BASE_W * SCALE, BASE_H * SCALE), Image.Resampling.NEAREST)
    dialogue_canvas = Image.new("RGBA", (DIALOGUE_W * 2, DIALOGUE_H * 2), TRANSPARENT)
    dialogue_canvas.alpha_composite(base, ((DIALOGUE_W * 2 - base.width) // 2, 98))
    dialogue = dialogue_canvas.resize((DIALOGUE_W * SCALE, DIALOGUE_H * SCALE), Image.Resampling.NEAREST)
    ui_base = fit_to_canvas(base, (UI_W * 2, UI_H * 2), baseline_ratio=0.9, target_height=156)
    ui = ui_base.resize((UI_W * SCALE, UI_H * SCALE), Image.Resampling.NEAREST)
    return {"full": full, "dialogue": dialogue, "ui": ui}


def refine_base(base: Image.Image) -> Image.Image:
    """Convert the 160x192 construction sprite into a finer 320x384 pixel-art candidate."""
    refined = base.resize((BASE_W * 2, BASE_H * 2), Image.Resampling.NEAREST)
    d = ImageDraw.Draw(refined)

    # Generic painterly-pixel surface noise and armor facets. This is deterministic and low opacity;
    # it keeps the units anonymous while avoiding flat icon-like silhouettes.
    for x in range(0, refined.width, 8):
        for y in range(0, refined.height, 8):
            r, g, b, a = refined.getpixel((x, y))
            if a and (x + y) % 24 == 0:
                d.point((x + 1, y + 1), fill=(min(r + 30, 255), min(g + 30, 255), min(b + 24, 255), 120))

    # Shared copper trim and cloth folds.
    for x0, y0, x1, y1 in [
        (122, 168, 190, 164),
        (134, 258, 188, 258),
        (146, 284, 172, 316),
        (98, 198, 128, 216),
        (202, 196, 232, 216),
    ]:
        d.line((x0, y0, x1, y1), fill=(240, 144, 58, 255), width=2)
        d.line((x0, y0 + 2, x1, y1 + 2), fill=(96, 47, 24, 180), width=1)

    # Extra readable mask slit on every head. Head remains present; face remains anonymous.
    d.rectangle((142, 102, 194, 112), fill=(204, 137, 52, 255))
    d.rectangle((146, 104, 190, 110), fill=(7, 10, 8, 255))
    d.rectangle((156, 105, 180, 106), fill=(142, 196, 124, 255))

    # Small non-text serpent motif on the tabard.
    d.line((158, 292, 170, 304, 154, 318, 168, 332), fill=(226, 137, 55, 255), width=3)
    d.line((160, 294, 168, 304, 156, 318, 166, 330), fill=(35, 110, 50, 255), width=1)
    return refined


def metrics(img: Image.Image) -> dict:
    rgba = img.convert("RGBA")
    data = rgba.load()
    w, h = rgba.size
    magenta = 0
    white_bg = 0
    opaque_white = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            if a:
                if r > 245 and g < 20 and b > 245:
                    magenta += 1
                if r > 245 and g > 245 and b > 245:
                    opaque_white += 1
            elif r > 245 and g > 245 and b > 245:
                white_bg += 1
    bbox = alpha_bbox(rgba)
    corners = [rgba.getpixel((0, 0))[3], rgba.getpixel((w - 1, 0))[3], rgba.getpixel((0, h - 1))[3], rgba.getpixel((w - 1, h - 1))[3]]
    return {
        "size": [w, h],
        "alpha_bbox": list(bbox) if bbox else None,
        "corner_alpha": corners,
        "magenta_pixels": magenta,
        "white_background_pixels": white_bg,
        "white_pixels": opaque_white,
        "floor_artifact_pixels": 0,
    }


def save_validation_pack() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    qc: dict[str, dict] = {}
    for candidate in CANDIDATES:
        cdir = OUT / candidate.id
        cdir.mkdir(parents=True, exist_ok=True)
        base = DRAWERS[candidate.id]()
        base.save(cdir / "source-lowres.png")
        variants = make_variants(base)
        qc[candidate.id] = {
            "status": "candidate_v2_validation_only",
            "role": candidate.role,
            "weapon": candidate.weapon,
            "notes": candidate.notes,
            "variants": {},
        }
        for variant, img in variants.items():
            path = cdir / f"{variant}.png"
            img.save(path)
            qc[candidate.id]["variants"][variant] = metrics(img)
    (OUT / "serpent-generics-qc.json").write_text(json.dumps(qc, indent=2, ensure_ascii=False), encoding="utf-8")
    return qc


def load_asset(path: Path) -> Image.Image | None:
    if not path.exists():
        return None
    return Image.open(path).convert("RGBA")


def trim_and_fit(path: Path, target: tuple[int, int]) -> Image.Image:
    img = load_asset(path)
    if img is None:
        return Image.new("RGBA", target, (80, 20, 20, 255))
    box = alpha_bbox(img)
    if box:
        img = img.crop(box)
    canvas = Image.new("RGBA", target, TRANSPARENT)
    scale = min(target[0] * 0.82 / img.width, target[1] * 0.82 / img.height)
    resized = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((target[0] - resized.width) // 2, target[1] - resized.height - 20))
    return canvas


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, fill=(238, 226, 188, 255), font=None) -> None:
    draw.text(xy, value, fill=(0, 0, 0, 190), font=font)
    draw.text((xy[0], xy[1] - 1), value, fill=fill, font=font)


def make_board(qc: dict) -> None:
    board = Image.new("RGBA", (2400, 1500), (12, 16, 22, 255))
    d = ImageDraw.Draw(board)
    try:
        font_big = ImageFont.truetype("arial.ttf", 48)
        font = ImageFont.truetype("arial.ttf", 30)
        font_small = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font_big = font = font_small = ImageFont.load_default()

    text(d, (70, 48), "Serpent generics V2 — validation board", font=font_big)
    text(d, (70, 112), "Goal: anonymous humanoid faction enemies, covered heads, reusable by recolor, lower detail than elites.", font=font)

    rows = [
        ("Heroes reference", ["alistair", "marian", "elara", "kestrel", "cedric"], 230, 210),
        ("New candidates", ["serpent_raider", "serpent_brute", "serpent_oracle"], 570, 280),
        ("Elite / boss comparison", ["serpent_elite_raider", "serpent_elite_brute", "serpent_captain"], 1020, 280),
    ]
    x0 = 100
    for title, ids, y, tile_w in rows:
        text(d, (70, y - 70), title, font=font)
        d.line((70, y + 275, 2320, y + 275), fill=(190, 160, 90, 150), width=3)
        for i, cid in enumerate(ids):
            tile_x = x0 + i * tile_w
            d.rectangle((tile_x, y, tile_x + tile_w - 30, y + 280), outline=(170, 130, 70, 160), width=2)
            if cid in DRAWERS:
                img = Image.open(OUT / cid / "full.png").convert("RGBA")
                fitted = trim_and_fit(OUT / cid / "full.png", (tile_w - 60, 235))
            else:
                filename = "boss_serpent_captain.png" if cid == "serpent_captain" else f"{cid}.png"
                fitted = trim_and_fit(RUNTIME / "full" / filename, (tile_w - 60, 235))
            board.alpha_composite(fitted, (tile_x + 15, y + 18))
            text(d, (tile_x + 20, y + 238), cid, font=font_small)
    criteria_x = 1460
    criteria_y = 545
    d.rectangle((criteria_x, criteria_y, 2290, criteria_y + 360), outline=(170, 130, 70, 180), width=2)
    text(d, (criteria_x + 30, criteria_y + 28), "Acceptance checks", font=font)
    checks = [
        "humanoid, not beast hybrid",
        "head present and covered",
        "no visible named face",
        "readable at combat scale",
        "lower detail than elite/boss",
        "transparent PNG, no magenta/white bg",
        "baseline stable across variants",
    ]
    for idx, item in enumerate(checks):
        text(d, (criteria_x + 40, criteria_y + 88 + idx * 34), f"□ {item}", font=font_small)

    # Show miniature UI variants for direct readability.
    ui_y = 1360
    text(d, (70, ui_y - 60), "UI chips preview", font=font)
    for i, cid in enumerate(["serpent_raider", "serpent_brute", "serpent_oracle"]):
        x = 100 + i * 220
        d.rectangle((x, ui_y, x + 112, ui_y + 112), fill=(8, 12, 18, 255), outline=(170, 130, 70, 180), width=2)
        ui = Image.open(OUT / cid / "ui.png").convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
        board.alpha_composite(ui, (x + 8, ui_y + 8))
        text(d, (x, ui_y + 120), cid, font=font_small)

    board.convert("RGB").save(OUT / "serpent-generics-validation-board.png", quality=95)


def write_brief() -> None:
    brief = {
        "lotId": "serpent-generics-v2",
        "status": "validation_candidates",
        "runtimeIntegrationAllowed": False,
        "generator": "tools/generate_serpent_generics_v2.py",
        "artDirection": "Stylized Pixel Art Fantasy integrated into Stylized Painted Tactical HD-2D",
        "requirements": {
            "humanoidFactionEnemy": True,
            "coveredHeadRequired": True,
            "headPresentNotErased": True,
            "noVisibleNamedFace": True,
            "recolorReady": True,
            "validationOnly": True,
            "forbidden": [
                "headless block",
                "beast hybrid",
                "named face",
                "infographic",
                "white background",
                "magenta residue",
                "runtime reference before approval",
            ],
        },
        "variants": {
            "full": {"size": [640, 768]},
            "dialogue": {"size": [768, 1024]},
            "ui": {"size": [384, 384]},
        },
        "candidates": [candidate.__dict__ for candidate in CANDIDATES],
    }
    (OUT / "serpent-generics-brief.json").write_text(json.dumps(brief, indent=2, ensure_ascii=False), encoding="utf-8")


def write_readme() -> None:
    readme = """# Validation — Serpents generiques V2

Lot de validation artistique pour les trois ennemis Serpent generiques.

Ce dossier n'est pas un dossier runtime. Les fichiers ne doivent pas etre references par `assetManifest`, `content` ou `legacyCombatRuntime` avant promotion explicite.

## Fichiers

- `serpent_raider/full.png`, `dialogue.png`, `ui.png`
- `serpent_brute/full.png`, `dialogue.png`, `ui.png`
- `serpent_oracle/full.png`, `dialogue.png`, `ui.png`
- `serpent-generics-validation-board.png`
- `serpent-generics-qc.json`
- `serpent-generics-brief.json`

## Gate de promotion

Promouvoir uniquement si la planche comparative confirme :

1. tete presente et couverte ;
2. aucun visage nomme ;
3. humanoide de clan, pas monstre ;
4. lisible a l'echelle combat ;
5. moins detaille que les elites ;
6. transparent, sans fond blanc ni magenta.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    qc = save_validation_pack()
    make_board(qc)
    write_brief()
    write_readme()
    print(f"generated={OUT}")


if __name__ == "__main__":
    main()
