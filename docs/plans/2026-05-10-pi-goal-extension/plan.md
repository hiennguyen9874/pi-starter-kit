# Pi Goal Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a project-local Pi `/goal` extension that persists one active goal, exposes canonical goal commands/tools, and safely continues work through hidden custom messages.

**Architecture:** Implement a modular `.pi/extensions/pi-goal/` extension. Pure modules own state, formatting, prompts, commands, and tools; `index.ts` wires Pi lifecycle hooks, continuation scheduling, accounting, status updates, and context pruning.

**Tech Stack:** TypeScript Pi extension APIs from `@mariozechner/pi-coding-agent`, `typebox`, `StringEnum` from `@mariozechner/pi-ai`, Node built-in `node:test` and `node:assert/strict`.

---

## Decision Gates

- Canonical API names are approved: `/goal`, `get_goal`, `create_goal`, `update_goal`.
- Before implementation, check `.pi/settings.json` and loaded global packages for an already-installed pi-goal package. If a live conflict is found, stop and ask whether to disable the other extension or switch to prefixed local names.
- Keep the first version notification/status-line based. Do not add the optional status overlay unless the user explicitly expands scope.
- `/goal <objective>` must start the first model turn visibly with `pi.sendUserMessage(objective)` when idle; hidden messages are only for follow-up continuations.
- Keep `get_goal` available so the model can inspect no-goal, paused, budget-limited, and complete states; gate only completion-oriented tools when needed.
- Do not modify Pi core or add runtime dependencies.

## Phases

1. [Phase 1: Pure goal state, formatting, and prompts](phase-1.md)
2. [Phase 2: Commands and model tools](phase-2.md)
3. [Phase 3: Runtime wiring and first continuation loop](phase-3.md)
4. [Phase 4: Gating, accounting, and context hygiene](phase-4.md)
5. [Phase 5: Integration verification and polish](phase-5.md)
