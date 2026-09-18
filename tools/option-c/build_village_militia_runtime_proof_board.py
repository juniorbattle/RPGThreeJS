from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
PROOF = ROOT / "public/assets/dev/option-c/village-militia-poses-v1/runtime-proof"
NAMES = (
    "militia-pair-prepare__1366x768.png",
    "militia-pair-dash__1366x768.png",
    "militia-pair-attack__1366x768.png",
    "militia-pair-cast__1366x768.png",
)


def main() -> None:
    cell = (960, 540)
    board = Image.new("RGB", (cell[0] * 2, cell[1] * 2), (8, 10, 14))
    for index, name in enumerate(NAMES):
        source = Image.open(PROOF / "screenshots" / name).convert("RGB")
        source = source.resize(cell, Image.Resampling.LANCZOS)
        board.paste(source, ((index % 2) * cell[0], (index // 2) * cell[1]))
    output = PROOF / "militia-runtime-proof-board.png"
    board.save(output, optimize=True)
    print(output.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
