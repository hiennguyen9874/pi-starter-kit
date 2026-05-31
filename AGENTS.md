# AGENTS.md

Pi starter kit for task-shaped AI coding sessions using project-local profiles, skills, MCP config, prompts, agents, and extensions.

## Quick Commands

- Run profile extension tests: `node --test .pi/extensions/profile/*.test.ts`
- Inspect active profile policy in Pi: `/profile explain`
- Switch profile in Pi: `/profile <name>`

## Mini Repo Map

- `.pi/profiles.json` — profile selection (`defaultProfile`)
- `.pi/extensions/profile/` — profile loading/filtering/sync logic and tests
- `.pi/settings.json` / `.pi/mcp.json` — Pi config, partly profile-managed
- `.pi/skills/`, `.pi/agents/`, `.pi/prompts/` — local capabilities and reusable workflows
- `docs/agent-instructions/` — detailed shared agent instructions

## Instruction Index

Read these only when task matches scope:

| File | Read when | Contains |
|---|---|---|
| `docs/agent-instructions/repo-workflow.md` | You change repo structure, Pi config, extensions, prompts, agents, skills, or verification flow | Workflow rules, verified commands, key paths, guardrails |
| `docs/agent-instructions/profiles.md` | You change profile definitions, skill/MCP visibility, or profile sync behavior | Profile semantics, precedence, managed files, verification paths |

## Critical Rules

- Keep root agent files concise; keep detailed guidance under `docs/agent-instructions/`.
- Do not place detailed instruction docs under `.pi/`, `.claude/`, `.codex/`, `.cursor/`, or other tool-private directories.
- Do not invent commands; use repo-verified commands only.
- Prefer minimal, surgical edits that directly map to the request.
