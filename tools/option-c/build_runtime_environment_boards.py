from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


PROJECT = Path(__file__).resolve().parents[2]
ROOT = PROJECT / "public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1/runtime-review"
SCREENSHOTS = ROOT / "screenshots"
GROUPS = {
    "travel": "runtime-travel-board.png",
    "tableau": "runtime-tableau-board.png",
    "strategic": "runtime-strategic-board.png",
    "combat-stage": "runtime-combat-stage-board.png",
}


def font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def label_for(path: Path) -> str:
    viewport = path.parent.name
    stem = path.stem.replace("_", " ").replace("-", " ")
    return f"{viewport} · {stem.upper()}"


def build_board(prefix: str, output_name: str) -> None:
    sources = sorted(SCREENSHOTS.glob(f"*/{prefix}_*.png"))
    if not sources:
        raise RuntimeError(f"No runtime screenshots found for {prefix}")
    thumb_width = 560
    thumb_height = 315
    label_height = 38
    columns = 2
    rows = (len(sources) + columns - 1) // columns
    gutter = 18
    header = 70
    board_width = columns * thumb_width + (columns + 1) * gutter
    board_height = header + rows * (thumb_height + label_height + gutter) + gutter
    board = Image.new("RGB", (board_width, board_height), "#07100d")
    draw = ImageDraw.Draw(board)
    draw.text((gutter, 18), f"OPTION C · {prefix.upper()} · RUNTIME REVIEW", fill="#f1dfae", font=font(28))
    for index, source in enumerate(sources):
        column = index % columns
        row = index // columns
        left = gutter + column * (thumb_width + gutter)
        top = header + row * (thumb_height + label_height + gutter)
        with Image.open(source) as image:
            preview = image.convert("RGB")
            preview.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (thumb_width, thumb_height), "#020605")
            canvas.paste(preview, ((thumb_width - preview.width) // 2, (thumb_height - preview.height) // 2))
            board.paste(canvas, (left, top))
        draw.rectangle((left, top, left + thumb_width - 1, top + thumb_height - 1), outline="#8d7747", width=2)
        draw.text((left + 8, top + thumb_height + 8), label_for(source), fill="#d9eee1", font=font(16))
    board.save(ROOT / output_name, optimize=True)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for prefix, output_name in GROUPS.items():
        build_board(prefix, output_name)
    print(f"runtime boards=4 root={ROOT}")


if __name__ == "__main__":
    main()
