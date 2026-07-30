#!/usr/bin/env python3
"""Validate V11B-P1 cinematic source frames."""
from PIL import Image
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, "..", ".."))
SOURCE_DIR = os.path.join(PROJECT_ROOT, "public", "assets", "cinematics", "source")

for f in ["serpent_general_reveal_source.png", "lion_judgement_source.png"]:
    p = os.path.join(SOURCE_DIR, f)
    img = Image.open(p)
    size = os.path.getsize(p)
    ratio = img.size[0] / img.size[1]
    is_16_9 = abs(ratio - 16/9) < 0.001
    print(f"{f}:")
    print(f"  dimensions: {img.size[0]}x{img.size[1]}")
    print(f"  mode: {img.mode}")
    print(f"  file size: {size:,} bytes ({size/1024/1024:.2f} MB)")
    print(f"  aspect ratio: {ratio:.4f} (16:9={is_16_9})")
    print()
