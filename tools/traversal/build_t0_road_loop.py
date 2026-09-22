"""Build deterministic mirror-loop strips from the approved T0 scenic layers."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
LAYERS = (
    (
        ROOT / "public/assets/generated/lion-phase/traversal/t0/road/t0-wide-road.png",
        ROOT / "public/assets/generated/lion-phase/traversal/t0/road/t0-wide-road-loop.png",
        "RGBA",
    ),
    (
        ROOT / "public/assets/generated/lion-phase/traversal/t0/background/t0-far-panorama.png",
        ROOT / "public/assets/generated/lion-phase/traversal/t0/background/t0-far-panorama-loop.png",
        "RGB",
    ),
)


def build_loop(source_path: Path, output_path: Path, mode: str) -> None:
    source = Image.open(source_path).convert(mode)
    mirrored = source.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    fill = (0, 0, 0, 0) if mode == "RGBA" else (0, 0, 0)
    loop = Image.new(mode, (source.width * 2, source.height), fill)
    loop.paste(source, (0, 0), source if mode == "RGBA" else None)
    loop.paste(mirrored, (source.width, 0), mirrored if mode == "RGBA" else None)
    loop.save(output_path, optimize=True)
    print(f"{output_path.relative_to(ROOT)}|{loop.width}x{loop.height}|{mode}")


def main() -> None:
    for source, output, mode in LAYERS:
        build_loop(source, output, mode)


if __name__ == "__main__":
    main()
