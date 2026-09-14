# 09 — DEV Labs

## Entry

```
http://localhost:5173/?devOptionC=phase4c-labs
```

Only available when `import.meta.env.DEV` is true. Production builds
never import the labs module (Vite tree-shakes the dynamic import).

## Lab router

`OptionCPhase4cLabRouter` provides a 4-tab navigation:

## 1. Character Lab

Inspect a single character's:
- Animation states (play/pause/speed)
- Surface representation (tableau/strategic/combat-stage)
- Facing and mirror
- Anchor overlays (foot/body/head/weapon)
- Scale values
- Validation status
- Codex handoff metadata

## 2. Tableau Lab

Multi-character staging (1-4 actors):
- Cast size selector
- Per-slot character selector
- Speaker designation
- Facing/mirror controls
- Visual: speaker highlighted, listeners dimmed

## 3. Strategic Lab

Real combat runtime at strategic scale:
- Surface toggle (strategic/combat-stage)
- Character selector
- Animation state selector
- Environment background
- Memory report display

## 4. Combat Stage Lab

Real combat runtime at combat-stage scale:
- Same controls as Strategic Lab
- Combat-stage environment plate
- Attacker/target display
- Memory report display

## DEV/prod isolation

- Labs are dynamically imported only when `devOptionC=phase4c-labs`
- The import is gated by `import.meta.env.DEV`
- Production builds exclude the labs module entirely
- Normal game startup (`new GameApp`) is unaffected
