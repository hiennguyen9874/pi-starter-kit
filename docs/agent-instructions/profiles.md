# Profile Instructions

## Read When

Read this when changing Pi profiles, MCP availability, skill availability, profile sync behavior, or docs that explain profile behavior.

## Purpose

Keep profile changes consistent with this starter kit's focus model: each profile exposes only task-relevant skills and MCP servers.

## Rules

- Keep profiles small and task-shaped; avoid broad allow-lists unless broad context is the point of the profile.
- Profile policy semantics are:
  1. disable wins over enable
  2. empty enable list means allow unless disabled
  3. non-empty enable list means allow only listed resources unless disabled
  4. `"*"` means all resources
- Treat `.pi/settings.json`, `.pi/mcp.json`, `.pi/profile-state.json`, and `.pi/profile-extension-state.json` as potentially managed by the profile extension.
- Do not assume edits to `.pi/settings.json` or `.pi/mcp.json` are manual; check active profile and managed state first.
- When adding a profile-facing skill or MCP server, update `.pi/profiles.json` and user-facing docs that mention profile behavior.
- If a profile references a skill that is not installed locally, preserve the reference only when it is expected from an external Pi package or user-level skill directory; otherwise surface it as unknown.

## Commands

Run profile extension tests after profile or profile-extension changes:

```bash
node --test .pi/extensions/profile/*.test.ts
```

Check worktree before editing managed files:

```bash
git status --short
```

## Key Paths

- `.pi/profiles.json` — profile definitions and default profile
- `.pi/settings.json` — Pi packages, extensions, skills, and subagent overrides; may contain managed exclusions
- `.pi/mcp.json` — project MCP server definitions; may be filtered by active profile
- `.pi/profile-state.json` — persisted active profile
- `.pi/profile-extension-state.json` — managed skill entries and MCP baseline
- `.pi/extensions/profile/` — profile extension source and tests

## Gotchas

- README and context docs may describe intended profile behavior, but source of truth for enforcement is `.pi/extensions/profile/` plus `.pi/profiles.json`.
- Current active profile can hide skills or MCP servers that exist on disk.
- Some profile entries may refer to external skills not present under `.pi/skills/`.

## Related Instructions

- `docs/agent-instructions/repo-workflow.md`
- `CONTEXT.md`
