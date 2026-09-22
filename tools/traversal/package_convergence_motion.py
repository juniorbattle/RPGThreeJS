"""Package real Chromium frames at their recorded speed; omit the uneventful road gap."""
from pathlib import Path
import subprocess
import json
import os
from io import BytesIO
from PIL import Image

root = Path(__file__).resolve().parents[2]
qa = root / 'tools/traversal/qa/convergence'
ffmpeg = Path(os.environ['LOCALAPPDATA']) / 'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe'
source = qa / 'live/meet-fight/journey.webm'
report = json.loads((qa / 'live/meet-fight/report.json').read_text(encoding='utf-8'))
states = report['states']
event = next(s['seconds'] for s in states if s['phase'] == 'NODE_HANDOFF' and s['progress'] == .4)
returned = next(s['seconds'] for s in states if s['phase'] == 'RUNNING' and s['progress'] == .4)
fork = next(s['seconds'] for s in states if s['phase'] == 'FORK_OVERLAY')
resumed = next(s['seconds'] for s in states if s['phase'] == 'RUNNING' and .8 <= s['progress'] < .81)
segments = [[event - 7, returned + 4], [fork - 5, resumed + 4]]
frames_dir = qa / 'final-motion-frames'
frames_dir.mkdir(exist_ok=True)
frames = []
for label, (start, end) in zip(['event', 'fork'], segments):
    for previous in frames_dir.glob(f'{label}-*.png'):
        previous.unlink()  # Only this script's extracted temporary frames, never source art.
    subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', str(start), '-i', str(source), '-t', str(end - start), '-r', '12',
        '-vf', 'scale=960:-1', str(frames_dir / f'{label}-%04d.png')], check=True)
    frames.extend(sorted(frames_dir.glob(f'{label}-*.png')))
output = qa / 'transition-review.webm'
encoder = subprocess.Popen([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '12', '-i', 'pipe:0', '-c:v', 'libvpx', '-b:v', '1800k', str(output)], stdin=subprocess.PIPE)
for frame in frames:
    with Image.open(frame) as image:
        encoded = BytesIO()
        image.convert('RGB').save(encoded, format='JPEG', quality=95)
        encoder.stdin.write(encoded.getvalue())
encoder.stdin.close()
assert encoder.wait() == 0
(qa / 'transition-review.json').write_text(json.dumps({
    'source': 'live/meet-fight/journey.webm',
    'segments_seconds': segments, 'fps': 12,
    'frames': len(frames), 'duration_seconds': len(frames) / 12,
    'editing': 'One cut omits uneventful driving; event and fork transitions retain real-time speed.',
}, indent=2), encoding='utf-8')
print(output, output.stat().st_size)
