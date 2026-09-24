"""Make compact, labeled contact sheets from the exhaustive tableau gallery."""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
REVIEW = ROOT / "docs" / "reports" / "dialogue-static-tableau-v2-review"
ENTRIES = json.loads((REVIEW / "gallery-index.json").read_text(encoding="utf-8"))
OUT = REVIEW / "contact-sheets"
OUT.mkdir(exist_ok=True)
FONT = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
COLS, ROWS = 3, 4
CELL_W, IMAGE_H, LABEL_H = 440, 248, 57


def group_name(entry):
    return "desktop" if entry["viewport"]["width"] == 1440 else "responsive"


for group in ("desktop", "responsive"):
    selected = [entry for entry in ENTRIES if group_name(entry) == group]
    for start in range(0, len(selected), COLS * ROWS):
        chunk = selected[start : start + COLS * ROWS]
        sheet = Image.new("RGB", (COLS * CELL_W, ROWS * (IMAGE_H + LABEL_H)), "#08131f")
        draw = ImageDraw.Draw(sheet)
        for index, entry in enumerate(chunk):
            x = index % COLS * CELL_W
            y = index // COLS * (IMAGE_H + LABEL_H)
            with Image.open(REVIEW / "screenshots" / entry["screenshot"]) as source:
                source.thumbnail((CELL_W - 8, IMAGE_H - 8), Image.Resampling.LANCZOS)
                sheet.paste(source, (x + (CELL_W - source.width) // 2, y + (IMAGE_H - source.height) // 2))
            label = f'{entry["dialogueId"]} | {entry["kind"]} | {entry["viewport"]["width"]}x{entry["viewport"]["height"]}'
            actors = ", ".join(entry["actorIds"])
            draw.text((x + 5, y + IMAGE_H + 3), label[:65], font=FONT, fill="#f1d69d")
            draw.text((x + 5, y + IMAGE_H + 22), f'{entry["compositionProfile"]} | {entry["stepId"]}'[:65], font=FONT, fill="#c6d4dd")
            draw.text((x + 5, y + IMAGE_H + 41), actors[:65], font=FONT, fill="#aab9c4")
        page = start // (COLS * ROWS) + 1
        sheet.save(OUT / f"{group}-{page:02}.jpg", quality=85)
    print(f"{group}: {len(selected)} images, {(len(selected) + COLS * ROWS - 1) // (COLS * ROWS)} sheets")
