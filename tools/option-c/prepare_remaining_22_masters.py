from __future__ import annotations

import json
import shutil
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/dev/option-c/combat-poses-v2"
GENERATED = Path(
    r"C:/Users/miche/.codex/generated_images/01a0ab7a-f41d-72b1-b622-3dd0c827024a"
)

SOURCES = {
    "white_mage": "exec-81b6b9a0-97ab-4d49-a654-96f3a059079d.png",
    "dark_mage": "exec-9f2b575d-3c79-4c51-b4c2-6c9084191fa6.png",
    "archer": "exec-e47bb1b3-14f5-4469-92ff-0e99840dbd29.png",
    "rogue": "exec-79b96d52-b5b3-4fba-aca8-896fe7ecfc55.png",
    "lancer": "exec-b8c6db3f-c3b3-4644-9243-3bcff26dacc7.png",
    "forest_badger": "exec-d10a3b39-a9b7-4811-8dc5-37718dfe42da.png",
    "cave_bat": "exec-c717bff5-6808-4886-b547-5e17cb3e7542.png",
    "wild_boar": "exec-08a6dccd-e166-45bd-a813-7e1d9307e356.png",
    "cave_rat": "exec-bb48c941-5462-4ed7-b4cb-b58c3b2a507f.png",
    "forest_spider": "exec-c4866b8f-f237-4223-9044-79bead2cb0bc.png",
    "marsh_toad": "exec-c41c7381-81d8-4e38-94c4-a9980d01688b.png",
    "serpent_raider": "exec-98d67deb-3b04-447e-8ff4-976ddf87b1fe.png",
    "serpent_brute": "exec-95b782d4-e7e2-44bc-ab75-fb3cdf97c829.png",
    "serpent_oracle": "exec-0e6612e9-299f-43e7-bcb7-c6e612b04cd2.png",
    "skeleton": "exec-d1f6a15b-a311-4da7-83d6-94930cb7fb3e.png",
    "venom_serpent": "exec-e688c6e4-5502-4110-9b4d-9bf3ccb32379.png",
    "wolf": "exec-978c5978-2711-454d-8088-68d7734dd205.png",
    "young_dragon_elite": "exec-f7add89a-a646-49b1-b370-2176ebe6967d.png",
    "forest_troll_elite": "exec-791d6420-249f-4b6e-9940-9bacb21249da.png",
    "serpent_general_boss": "exec-4e78d412-4af5-40dc-8495-e68233421c39.png",
    "serpent_duelist_elite": "exec-26881407-c253-4ca4-9792-93bb72886209.png",
    "serpent_elite_brute": "exec-65a69e83-af39-43a5-a55f-b982d35fe45e.png",
}


def edge_key_magenta(image: Image.Image) -> Image.Image:
    """Remove only magenta connected to the canvas edge; preserve interior palette."""
    rgba = image.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    queued = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_background(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a == 0 or (r >= 190 and b >= 180 and g <= 105 and r + b - 2 * g >= 260)

    for x in range(width):
        for y in (0, height - 1):
            if is_background(x, y):
                idx = y * width + x
                if not queued[idx]:
                    queued[idx] = 1
                    queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if is_background(x, y):
                idx = y * width + x
                if not queued[idx]:
                    queued[idx] = 1
                    queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                idx = ny * width + nx
                if not queued[idx] and is_background(nx, ny):
                    queued[idx] = 1
                    queue.append((nx, ny))

    # Remove residual magenta fringe on semi-transparent edge pixels.
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a and r >= 200 and b >= 190 and g <= 125 and r + b - 2 * g >= 230:
                px[x, y] = (r, g, b, 0)
    return rgba


def normalize_master(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Master has no visible pixels")
    crop = image.crop(bbox)
    max_extent = 440
    scale = min(max_extent / crop.width, max_extent / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    x = (512 - crop.width) // 2
    y = 486 - crop.height
    canvas.alpha_composite(crop, (x, y))
    return canvas


def main() -> None:
    masters = OUT / "masters"
    masters.mkdir(parents=True, exist_ok=True)
    records = []
    for unit_id, filename in SOURCES.items():
        source = GENERATED / filename
        if not source.is_file():
            raise FileNotFoundError(source)
        raw_target = masters / f"{unit_id}-master-source.png"
        final_target = masters / f"{unit_id}-master.png"
        shutil.copy2(source, raw_target)
        cleaned = edge_key_magenta(Image.open(source))
        final = normalize_master(cleaned)
        final.save(final_target)
        records.append(
            {
                "unitId": unit_id,
                "source": str(source),
                "sourceCopy": raw_target.relative_to(ROOT).as_posix(),
                "master": final_target.relative_to(ROOT).as_posix(),
                "dimensions": list(final.size),
                "alphaBBox": list(final.getchannel("A").getbbox() or ()),
            }
        )
    (OUT / "manifests" / "remaining-22-master-processing.json").write_text(
        json.dumps({"schemaVersion": 1, "units": records}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"mastersPrepared": len(records)}, indent=2))


if __name__ == "__main__":
    main()
