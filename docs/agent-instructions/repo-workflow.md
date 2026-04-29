# Repository Workflow Instructions

## Read When

Read this when changing repository structure, Pi config, extensions, skills, agents, prompts, or verification workflows.

## Purpose

Help agents make source-grounded changes to this Pi starter kit without corrupting profile-managed state or user work.

## Rules

- Read `AGENTS.md`, `README.md`, and `CONTEXT.md` before broad repo changes.
- Prefer source files over docs when verifying behavior; docs can lag implementation.
- Preserve user work. Current worktree may contain many unrelated `.pi/` changes; do not clean, revert, or reformat them unless asked.
- Keep starter-kit defaults approachable; avoid broad context, broad profiles, or speculative tools.
- Do not create detailed agent instructions under `.pi/`, `.claude/`, `.codex/`, `.cursor/`, or other tool-private directories.
- Use `docs/agent-instructions/` for shared agent guidance.
- Do not create nested `AGENTS.md` files unless the user explicitly asks and confirms after docs-only default is explained.
- When editing existing code, match local style and change only lines needed for the task.

## Commands

Run profile extension tests:

```bash
node --test .pi/extensions/profile/*.test.ts
```

Check repo state:

```bash
git status --short
```

Install/build commands for the whole starter kit are unknown; no root package manifest was found.

## Key Paths

- `AGENTS.md` — root agent rules and instruction index
- `README.md` — human-facing starter-kit overview
- `CONTEXT.md` — project context manifest and profile architecture summary
- `docs/agent-instructions/` — shared detailed agent instructions
- `.pi/profiles.json` — task-shaped profile definitions
- `.pi/extensions/profile/` — profile filtering and sync implementation
- `.pi/skills/` — local skills
- `.pi/agents/` — reusable subagents
- `.pi/prompts/` — prompt templates

## Gotchas

- Profile sync intentionally mutates managed Pi files.
- Active profile controls which skills and MCP servers are visible in a session.
- `docs/profiles.md` was deleted in the current worktree; profile agent guidance now lives at `docs/agent-instructions/profiles.md`.

## Related Instructions

- `docs/agent-instructions/profiles.md`
- `CONTEXT.md`
