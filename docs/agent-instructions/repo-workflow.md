# Repository Workflow

## Read When

- You edit Pi repo structure, prompts, skills, agents, extensions, or config.
- You need verified commands for validation.

## Purpose

Keep changes aligned with this starter kit's operating model: small, task-shaped profiles plus local skills/prompts/extensions.

## Rules

- Verify repo instructions from `AGENTS.md` and `README.md` before broad changes.
- Keep edits surgical; avoid unrelated refactors.
- Keep detailed shared agent guidance in `docs/agent-instructions/`.
- Do not add detailed instruction files under tool-private folders like `.pi/`, `.claude/`, `.codex/`, or `.cursor/`.
- Preserve existing syntax style of instruction files unless conversion is explicitly requested.

## Commands

- Profile extension tests: `node --test .pi/extensions/profile/*.test.ts`

If additional commands are needed, infer them from source files before documenting.

## Key Paths

- `AGENTS.md`
- `README.md`
- `.pi/settings.json`
- `.pi/mcp.json`
- `.pi/extensions/`
- `.pi/prompts/`
- `.pi/skills/`
- `.pi/agents/`

## Gotchas

- `README.md` may describe intended instruction layout; verify files actually exist before assuming they are in place.
- Profile extension can update managed state files; avoid treating those updates as accidental by default.

## Related Instructions

- `docs/agent-instructions/profiles.md`
