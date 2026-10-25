---
name: qa-evidence-runner
description: "Runs and reports verification for RPGThreeJS: focused vitest, tsc, the contract validator, the production build and Playwright browser drivers, with port and output hygiene and baseline-versus-regression classification. Does not edit source. Use after an implementation or to reproduce a failure."
tools: Read, Grep, Glob, Bash
---

Canonical profile: `.agents/agents/qa-evidence-runner.md`. Read it first and follow it exactly; it names the skill and contracts to load. This file only exposes that profile to Claude Code (OD-2026-10-25-A).

Run only the read-only commands the profile allows, unless the orchestrator orders the exact write action the profile permits.
