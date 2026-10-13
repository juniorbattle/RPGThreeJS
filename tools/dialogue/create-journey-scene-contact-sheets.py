"""Build compact visual review sheets from the real NarrativeStage browser captures."""

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "docs/reports/dialogue-journey-scene-review"
entries = json.loads((REPORT / "measurements.json").read_text(encoding="utf-8"))["entries"]
OUT = REPORT / "contact-sheets"
OUT.mkdir(parents=True, exist_ok=True)
font = ImageFont.load_default()

for width in sorted({entry["viewport"]["width"] for entry in entries}, reverse=True):
    selected = [entry for entry in entries if entry["viewport"]["width"] == width]
    cols, cell_w, cell_h = 3, 390, 250 if width >= 1000 else 445
    rows = (len(selected) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#14212e")
    draw = ImageDraw.Draw(sheet)
    for index, entry in enumerate(selected):
        x, y = (index % cols) * cell_w, (index // cols) * cell_h
        image = Image.open(REPORT / "screenshots" / entry["screenshot"]).convert("RGB")
        image.thumbnail((cell_w - 16, cell_h - 48))
        px = x + (cell_w - image.width) // 2
        sheet.paste(image, (px, y + 8))
        label = f'{entry["id"].replace("_TABLEAU", "")} / {entry["kind"]}'
        draw.text((x + 8, y + cell_h - 28), label, fill="#f4e8cd", font=font)
    path = OUT / f"journey-{width}.jpg"
    sheet.save(path, quality=88)
    print(path)
