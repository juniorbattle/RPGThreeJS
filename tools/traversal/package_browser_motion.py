"""Package unaltered browser capture sequences into compact review animations."""
from pathlib import Path
from PIL import Image
import json
ROOT = Path(__file__).resolve().parents[2]
qa = ROOT / 'tools/traversal/qa/forest-v4/final'
for name in ['motion', 'exit']:
    folder = qa / (name + '-frames')
    if not folder.exists(): continue
    frames = []
    for path in sorted(folder.glob('*.png')):
        with Image.open(path) as source:
            source.thumbnail((1000, 1000))
            frames.append(source.convert('RGB').quantize(colors=128))
    if frames:
        frames[0].save(qa / (name + '.gif'), save_all=True, append_images=frames[1:], duration=175 if name == 'motion' else 160, loop=0, optimize=False)
        print(name, len(frames), (qa / (name + '.gif')).stat().st_size)
