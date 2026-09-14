# Kestrel animation timing

Timing was tuned for readability at the real tactical and Combat Stage scales. All states use 1-based source ordering mapped deterministically to runtime indices 0–7.

| State | Frames | Frame duration | Nominal playback | Loop/transition |
| --- | ---: | ---: | ---: | --- |
| Idle | 8 | 190 ms | 1,520 ms | loops |
| Dash | 8 | 82 ms | 656 ms | one-shot, then idle frame 1 |
| Attack | 8 | 105 ms | 840 ms | one-shot, then idle frame 1 |
| Cast/skill | 8 | 125 ms | 1,000 ms | one-shot, then idle frame 1 |

The runtime sampler is elapsed-time based rather than render-frame based. Slow headless rendering can skip an observed visual sample without extending or corrupting state duration; deterministic unit tests exercise every frame boundary and all return-to-idle transitions.

Runtime QA confirmed:

- idle cycles through all eight frames and wraps without an anchor change;
- dash, attack, and skill reach their final frame and return to idle;
- the plane/image dimensions and foot origin are constant across transitions;
- mirroring does not change frame order or timing;
- no blank frame or legacy fallback appears during a state change.

