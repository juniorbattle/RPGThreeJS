#!/usr/bin/env python3
"""Validate the deterministic CIN-3 cinematic source frames."""
import hashlib
from PIL import Image
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, "..", ".."))
SOURCE_DIR = os.path.join(PROJECT_ROOT, "public", "assets", "cinematics", "source")

failures = []

for f in [
    "serpent_general_reveal_source.png",
    "lion_judgement_source.png",
    "lion_champion_reveal_source.png",
]:
    p = os.path.join(SOURCE_DIR, f)
    try:
        with Image.open(p) as verify_img:
            verify_img.verify()
        img = Image.open(p)
        img.load()
    except Exception as error:
        failures.append(f"{f}: corrupt or unreadable ({error})")
        continue
    size = os.path.getsize(p)
    ratio = img.size[0] / img.size[1]
    is_16_9 = abs(ratio - 16/9) < 0.001
    with open(p, "rb") as source_file:
        sha256 = hashlib.sha256(source_file.read()).hexdigest()
    checks = {
        "format=PNG": img.format == "PNG",
        "dimensions=1920x1080": img.size == (1920, 1080),
        "mode=RGB": img.mode == "RGB",
        "aspect=16:9": is_16_9,
    }
    for check, passed in checks.items():
        if not passed:
            failures.append(f"{f}: {check} failed")
    print(f"{f}:")
    print(f"  dimensions: {img.size[0]}x{img.size[1]}")
    print(f"  mode: {img.mode}")
    print(f"  file size: {size:,} bytes ({size/1024/1024:.2f} MB)")
    print(f"  aspect ratio: {ratio:.4f} (16:9={is_16_9})")
    print(f"  SHA-256: {sha256}")
    print(f"  validation: {'PASS' if all(checks.values()) else 'FAIL'}")
    print()

if failures:
    for failure in failures:
        print(f"ERROR: {failure}", file=sys.stderr)
    sys.exit(1)
