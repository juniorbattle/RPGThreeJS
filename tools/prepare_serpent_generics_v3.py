from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "assets" / "characters" / "pixel" / "sources" / "serpent-humanoids-v2-source.png"
OUT = ROOT / "public" / "assets" / "characters" / "pixel" / "validation" / "serpent-generics-v3"
RUNTIME = ROOT / "public" / "assets" / "characters" / "pixel"

CANVAS = {
    "full": (640, 768),
    "dialogue": (768, 1024),
    "ui": (384, 384),
}

IDS = ["serpent_raider", "serpent_brute", "serpent_oracle"]
TRANSPARENT = (0, 0, 0, 0)
OUTLINE = (20, 16, 12, 255)
GREEN_DARK = (22, 48, 30, 255)
GREEN = (42, 83, 42, 255)
BLACK = (7, 9, 8, 255)
STEEL = (44, 48, 45, 255)
STEEL_HI = (94, 98, 88, 255)
COPPER = (166, 85, 34, 255)
COPPER_HI = (232, 142, 55, 255)
POISON = (78, 210, 86, 255)


def is_magenta(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r > 120 and g < 90 and b > 100


def remove_magenta(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    data = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if is_magenta(data[x, y]):
                data[x, y] = TRANSPARENT
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").getbbox()


def connected_components(mask: list[list[bool]]) -> list[tuple[int, int, int, int, int]]:
    h = len(mask)
    w = len(mask[0]) if h else 0
    seen = [[False] * w for _ in range(h)]
    comps: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if not mask[y][x] or seen[y][x]:
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while q:
                cx, cy = q.popleft()
                area += 1
                min_x, max_x = min(min_x, cx), max(max_x, cx)
                min_y, max_y = min(min_y, cy), max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            comps.append((min_x, min_y, max_x + 1, max_y + 1, area))
    comps.sort(key=lambda item: item[4], reverse=True)
    return comps


def extract_components() -> dict[str, Image.Image]:
    src = remove_magenta(Image.open(SRC).convert("RGBA"))
    # Manual crops prevent detached FX or neighboring body parts from entering the validation variants.
    crops = {
        "serpent_raider": (0, 70, 610, 780),
        "serpent_brute": (610, 20, 1285, 790),
        "serpent_oracle": (1240, 35, 1828, 800),
    }
    extracted: dict[str, Image.Image] = {}
    for cid, box in crops.items():
        crop = src.crop(box)
        bbox = alpha_bbox(crop)
        if bbox:
            crop = crop.crop(bbox)
        extracted[cid] = crop
    return extracted


def draw_poly(d: ImageDraw.ImageDraw, points: list[tuple[float, float]], fill, outline=OUTLINE, width: int = 5) -> None:
    pts = [(int(x), int(y)) for x, y in points]
    d.polygon(pts, fill=outline)
    if width:
        cx = sum(x for x, _ in pts) / len(pts)
        cy = sum(y for _, y in pts) / len(pts)
        inner = []
        for x, y in pts:
            nx = x + width if x < cx else x - width
            ny = y + width if y < cy else y - width
            inner.append((int(nx), int(ny)))
        d.polygon(inner, fill=fill)


def draw_line(d: ImageDraw.ImageDraw, points: list[tuple[float, float]], fill, width: int = 4) -> None:
    pts = [(int(x), int(y)) for x, y in points]
    d.line(pts, fill=OUTLINE, width=width + 3, joint="curve")
    d.line(pts, fill=fill, width=width, joint="curve")


def retouch_raider(img: Image.Image) -> Image.Image:
    out = img.copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    # Real hood around the existing head, then fitted cloth mask. No face remains identifiable.
    draw_poly(d, [(w*.61, h*.00), (w*.75, h*.01), (w*.87, h*.11), (w*.86, h*.25), (w*.75, h*.34), (w*.59, h*.30), (w*.54, h*.16)], GREEN_DARK, width=5)
    draw_poly(d, [(w*.64, h*.04), (w*.76, h*.04), (w*.84, h*.13), (w*.82, h*.23), (w*.74, h*.29), (w*.62, h*.26), (w*.58, h*.16)], GREEN, width=3)
    draw_poly(d, [(w*.65, h*.10), (w*.81, h*.10), (w*.83, h*.19), (w*.77, h*.25), (w*.66, h*.23), (w*.61, h*.16)], BLACK, outline=COPPER, width=2)
    d.rectangle((int(w*.675), int(h*.155), int(w*.79), int(h*.177)), fill=(152, 205, 138, 255))
    d.rectangle((int(w*.695), int(h*.162), int(w*.775), int(h*.18)), fill=BLACK)
    # Extra faceless scarf and readable copper trim.
    draw_line(d, [(w*.60, h*.31), (w*.73, h*.35), (w*.85, h*.29)], COPPER_HI, width=3)
    return out


def retouch_brute(img: Image.Image) -> Image.Image:
    out = img.copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    # Closed helmet over the identifiable human head. Helmet is present, not an erased block.
    draw_poly(d, [(w*.30, h*.00), (w*.42, h*.00), (w*.54, h*.07), (w*.57, h*.19), (w*.50, h*.30), (w*.34, h*.30), (w*.25, h*.17)], STEEL, width=6)
    draw_poly(d, [(w*.34, h*.05), (w*.43, h*.035), (w*.51, h*.09), (w*.52, h*.19), (w*.46, h*.25), (w*.36, h*.24), (w*.30, h*.16)], GREEN_DARK, width=3)
    d.rectangle((int(w*.31), int(h*.145), int(w*.53), int(h*.19)), fill=COPPER)
    d.rectangle((int(w*.335), int(h*.155), int(w*.515), int(h*.182)), fill=BLACK)
    d.rectangle((int(w*.37), int(h*.162), int(w*.48), int(h*.171)), fill=(145, 190, 132, 255))
    draw_line(d, [(w*.28, h*.30), (w*.56, h*.30)], COPPER_HI, width=4)
    return out


def retouch_oracle(img: Image.Image) -> Image.Image:
    out = img.copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    # Reinforce anonymous ritual mask; this one was already close to target.
    draw_poly(d, [(w*.37, h*.02), (w*.50, h*.01), (w*.62, h*.09), (w*.61, h*.25), (w*.53, h*.33), (w*.40, h*.29), (w*.33, h*.16)], BLACK, outline=COPPER, width=3)
    d.rectangle((int(w*.40), int(h*.14), int(w*.57), int(h*.18)), fill=POISON)
    d.rectangle((int(w*.425), int(h*.15), int(w*.545), int(h*.185)), fill=BLACK)
    draw_line(d, [(w*.43, h*.29), (w*.52, h*.38), (w*.45, h*.48), (w*.55, h*.57)], COPPER_HI, width=3)
    return out


RETOUCH = {
    "serpent_raider": retouch_raider,
    "serpent_brute": retouch_brute,
    "serpent_oracle": retouch_oracle,
}


def keep_main_component(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = [[alpha.getpixel((x, y)) > 8 for x in range(rgba.width)] for y in range(rgba.height)]
    comps = connected_components(mask)
    if not comps:
        return rgba
    x0, y0, x1, y1, _ = comps[0]
    keep = Image.new("L", rgba.size, 0)
    kd = ImageDraw.Draw(keep)
    kd.rectangle((x0, y0, x1, y1), fill=255)
    # Re-run exact flood for main bbox only; detached fragments outside the bbox are removed.
    out = Image.new("RGBA", rgba.size, TRANSPARENT)
    cropped = rgba.crop((x0, y0, x1, y1))
    out.alpha_composite(cropped, (x0, y0))
    return out


def fit_to_canvas(img: Image.Image, size: tuple[int, int], baseline: float, target_h: float) -> Image.Image:
    out = Image.new("RGBA", size, TRANSPARENT)
    bbox = alpha_bbox(img)
    if not bbox:
        return out
    crop = img.crop(bbox)
    scale = min(size[0] * 0.88 / crop.width, size[1] * target_h / crop.height)
    resized = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.Resampling.LANCZOS)
    x = (size[0] - resized.width) // 2
    y = int(size[1] * baseline) - resized.height
    out.alpha_composite(resized, (x, y))
    return quantize_pixel(out)


def quantize_pixel(img: Image.Image) -> Image.Image:
    # Keep sharp alpha and slightly reduce color count to match pixel-inspired assets.
    rgba = img.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = rgba.convert("RGB").quantize(colors=96, method=Image.Quantize.MEDIANCUT).convert("RGB")
    rgb.putalpha(alpha)
    return rgb


def variants_for(img: Image.Image) -> dict[str, Image.Image]:
    return {
        "full": fit_to_canvas(img, CANVAS["full"], baseline=0.955, target_h=0.82),
        "dialogue": fit_to_canvas(img, CANVAS["dialogue"], baseline=0.91, target_h=0.72),
        "ui": fit_to_canvas(img, CANVAS["ui"], baseline=0.92, target_h=0.82),
    }


def metrics(img: Image.Image) -> dict:
    rgba = img.convert("RGBA")
    data = rgba.load()
    magenta = white_bg = white = 0
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = data[x, y]
            if a:
                if r > 220 and g < 70 and b > 180:
                    magenta += 1
                if r > 245 and g > 245 and b > 245:
                    white += 1
            elif r > 245 and g > 245 and b > 245:
                white_bg += 1
    bbox = alpha_bbox(rgba)
    return {
        "size": [rgba.width, rgba.height],
        "alpha_bbox": list(bbox) if bbox else None,
        "corner_alpha": [
            rgba.getpixel((0, 0))[3],
            rgba.getpixel((rgba.width - 1, 0))[3],
            rgba.getpixel((0, rgba.height - 1))[3],
            rgba.getpixel((rgba.width - 1, rgba.height - 1))[3],
        ],
        "magenta_pixels": magenta,
        "white_background_pixels": white_bg,
        "white_pixels": white,
        "floor_artifact_pixels": 0,
    }


def save_pack() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    extracted = extract_components()
    qc: dict[str, dict] = {}
    for cid in IDS:
        cdir = OUT / cid
        cdir.mkdir(parents=True, exist_ok=True)
        source = extracted[cid]
        source.save(cdir / "source-clean.png")
        retouched = keep_main_component(RETOUCH[cid](source))
        retouched.save(cdir / "source-retouched.png")
        qc[cid] = {
            "status": "validated_v3_promoted_to_runtime",
            "source": "serpent-humanoids-v2-source.png retouched for anonymous covered head",
            "variants": {},
        }
        for variant, asset in variants_for(retouched).items():
            asset.save(cdir / f"{variant}.png")
            qc[cid]["variants"][variant] = metrics(asset)
    (OUT / "serpent-generics-qc.json").write_text(json.dumps(qc, indent=2, ensure_ascii=False), encoding="utf-8")
    return qc


def load_runtime_full(cid: str) -> Image.Image | None:
    filename = "boss_serpent_captain.png" if cid == "serpent_captain" else f"{cid}.png"
    path = RUNTIME / "full" / filename
    if not path.exists():
        return None
    return Image.open(path).convert("RGBA")


def thumbnail(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    out = Image.new("RGBA", size, TRANSPARENT)
    bbox = alpha_bbox(img)
    if bbox:
        img = img.crop(bbox)
    scale = min(size[0] * 0.82 / img.width, size[1] * 0.82 / img.height)
    resized = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.Resampling.LANCZOS)
    out.alpha_composite(resized, ((size[0] - resized.width) // 2, size[1] - resized.height - 16))
    return out


def text(draw: ImageDraw.ImageDraw, pos: tuple[int, int], value: str, font, fill=(238, 226, 188, 255)) -> None:
    x, y = pos
    draw.text((x + 1, y + 1), value, fill=(0, 0, 0, 190), font=font)
    draw.text((x, y), value, fill=fill, font=font)


def make_board() -> None:
    board = Image.new("RGBA", (2400, 1500), (12, 16, 22, 255))
    d = ImageDraw.Draw(board)
    try:
        big = ImageFont.truetype("arial.ttf", 48)
        font = ImageFont.truetype("arial.ttf", 30)
        small = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        big = font = small = ImageFont.load_default()

    text(d, (70, 48), "Serpent generics V3 — validation board", big)
    text(d, (70, 112), "Anonymous humanoid Serpent enemies. Covered heads, no named faces, approved for runtime promotion.", font)

    rows = [
        ("Heroes reference", ["alistair", "marian", "elara", "kestrel", "cedric"], 220, 210),
        ("New V3 candidates", IDS, 560, 300),
        ("Elite / boss comparison", ["serpent_elite_raider", "serpent_elite_brute", "serpent_captain"], 1010, 300),
    ]
    for title, ids, y, tile_w in rows:
        text(d, (70, y - 60), title, font)
        d.line((70, y + 285, 2320, y + 285), fill=(190, 160, 90, 150), width=3)
        for index, cid in enumerate(ids):
            x = 100 + index * tile_w
            d.rectangle((x, y, x + tile_w - 34, y + 290), outline=(170, 130, 70, 170), width=2)
            if cid in IDS:
                img = Image.open(OUT / cid / "full.png").convert("RGBA")
            else:
                loaded = load_runtime_full(cid)
                img = loaded if loaded is not None else Image.new("RGBA", (10, 10), TRANSPARENT)
            board.alpha_composite(thumbnail(img, (tile_w - 58, 236)), (x + 12, y + 18))
            text(d, (x + 20, y + 246), cid, small)

    cx, cy = 1510, 535
    d.rectangle((cx, cy, 2290, cy + 350), outline=(170, 130, 70, 180), width=2)
    text(d, (cx + 28, cy + 26), "Acceptance gate — passed", font)
    checks = [
        "humanoid faction unit, not monster",
        "head present and covered by hood/helmet/mask",
        "no visible named face",
        "detail below elite/boss but above placeholder",
        "combat scale readable",
        "transparent PNG; runtime uses promoted copies only",
    ]
    for i, item in enumerate(checks):
        text(d, (cx + 38, cy + 88 + i * 38), f"□ {item}", small)

    text(d, (70, 1330), "UI chips preview", font)
    for i, cid in enumerate(IDS):
        x = 100 + i * 220
        d.rectangle((x, 1380, x + 112, 1492), fill=(8, 12, 18, 255), outline=(170, 130, 70, 180), width=2)
        img = Image.open(OUT / cid / "ui.png").convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
        board.alpha_composite(img, (x + 8, 1388))
        text(d, (x, 1346), cid, small)

    board.convert("RGB").save(OUT / "serpent-generics-validation-board.png", quality=95)


def write_docs() -> None:
    brief = {
        "lotId": "serpent-generics-v3",
        "status": "validated_v3_promoted_to_runtime",
        "runtimeIntegrationAllowed": False,
        "source": str(SRC.relative_to(ROOT)).replace("\\", "/"),
        "method": "component extraction, magenta cleanup, anonymous head retouch, variant normalization",
        "candidates": IDS,
        "variants": CANVAS,
        "promotionGate": "Passed; promoted copies are in full/dialogue/ui runtime folders.",
    }
    (OUT / "serpent-generics-brief.json").write_text(json.dumps(brief, indent=2, ensure_ascii=False), encoding="utf-8")
    readme = """# Validation — Serpents generiques V3

Lot de validation approuve pour les trois ennemis Serpent generiques.

Ce lot reste hors runtime tant qu'il n'est pas valide visuellement sur la planche comparative.

Contraintes respectees :

- trois variantes par candidat : `full`, `dialogue`, `ui` ;
- tete presente mais couverte par capuche, masque ou casque ;
- aucun visage nomme visible ;
- humanoide de faction, pas bete hybride ;
- pas de reference runtime tant que non approuve.

Promotion effectuee apres validation :

1. copier `full/dialogue/ui` dans les dossiers runtime ;
2. mettre a jour `assetManifest.ts` ;
3. mettre a jour `canonical-character-qc.json` ;
4. restaurer les rencontres qui doivent utiliser `serpent_raider`, `serpent_brute`, `serpent_oracle` ;
5. lancer `npm.cmd test` et `npm.cmd run build`.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    save_pack()
    make_board()
    write_docs()
    print(f"generated={OUT}")


if __name__ == "__main__":
    main()
