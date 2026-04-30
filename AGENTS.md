# AGENTS.md

This repository is a Pi starter kit for task-shaped AI coding sessions using project-local profiles, skills, MCP config, agents, prompts, and extensions.

## Quick Reference

- Test profile extension: `node --test .pi/extensions/profile/*.test.ts`
- Check worktree: `git status --short`
- Whole-repo install/build command: unknown; no root package manifest is present.

## Mini Repo Map

- `.pi/profiles.json` — profile definitions and default profile
- `.pi/extensions/profile/` — profile filtering and sync source/tests
- `.pi/settings.json` and `.pi/mcp.json` — Pi config files, partly managed by profile sync
- `.pi/skills/`, `.pi/agents/`, `.pi/prompts/` — local agent capabilities and templates
- `docs/agent-instructions/` — shared detailed agent instructions
- `CONTEXT.md` — project context manifest and profile architecture summary

## Instruction Index

Read these only when task matches scope:

| File | Read when | Contains |
|---|---|---|
| `docs/agent-instructions/repo-workflow.md` | Changing repo structure, Pi config, extensions, skills, agents, prompts, or verification workflows | Repo workflow, exact commands, key paths, managed-state cautions |
| `docs/agent-instructions/profiles.md` | Changing profiles, skill/MCP availability, profile sync behavior, or profile docs | Profile semantics, commands, managed files, gotchas |

## Critical Rules

- Preserve existing user work; do not revert unrelated changes.
- Treat `.pi/settings.json`, `.pi/mcp.json`, `.pi/profile-state.json`, and `.pi/profile-extension-state.json` as profile-managed unless proven manual.
- Keep profile defaults small and task-shaped.
- Put shared detailed agent guidance under `docs/agent-instructions/`, not tool-private folders.
- Do not create nested `AGENTS.md` files unless explicitly requested and confirmed.