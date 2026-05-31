# Profiles

## Read When

- You modify `.pi/profiles.json`.
- You change skill or MCP server availability behavior.
- You investigate profile sync side effects in config files.

## Purpose

Define how profile selection and filtering work so profile-related changes are safe, predictable, and testable.

## Rules

- Keep profiles task-shaped and minimal.
- Prefer editing profile policy in `.pi/profiles.json` over manual toggles in managed config.
- Respect precedence:
  - `skillsDisable` / `mcpServersDisable` override enables.
  - Empty enable list means allow unless disabled.
  - Non-empty enable list means deny unless enabled.
  - `*` means all.
- Verify behavior with focused profile extension tests when changing profile logic.

## Commands

- Run profile extension tests: `node --test .pi/extensions/profile/*.test.ts`

## Key Paths

- `.pi/profiles.json`
- `.pi/extensions/profile/index.ts`
- `.pi/extensions/profile/*.test.ts`
- `.pi/profile-state.json`
- `.pi/profile-extension-state.json`
- `.pi/settings.json`
- `.pi/mcp.json`

## Gotchas

- Active profile is selected by precedence: startup flag, persisted state, restored session, then `defaultProfile`.
- Profile sync intentionally rewrites managed entries in `.pi/settings.json` and `.pi/mcp.json`.
- If a skill is not loaded in a session, profile policy may block `/skill:<name>` even if files exist in `.pi/skills/`.

## Related Instructions

- `docs/agent-instructions/repo-workflow.md`
