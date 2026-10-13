#!/usr/bin/env python3
"""Quick bounding-box check for cinematic source sprites."""
from PIL import Image
import os

base = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "characters", "pixel", "full")
base = os.path.normpath(base)

for f in ["serpent_general_boss.png", "alaric.png", "lion_champion.png"]:
    p = os.path.join(base, f)
    img = Image.open(p)
    bbox = img.getbbox()
    print(f"{f}: size={img.size} mode={img.mode} bbox={bbox}")
