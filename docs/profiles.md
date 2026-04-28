# Profile UX Guide

Profiles keep Pi focused for current work by limiting which skills and MCP servers are available.

Use profiles when a task has a clear mode, such as backend, frontend, devops, docs, or agent/skill authoring.

## Mental model

A profile is a named policy in `.pi/profiles.json`.

It can control two resource types:

- **skills** — slash commands and skill instructions available to the agent
- **MCP servers** — external tool servers available through `mcp`

Each resource type has enable and disable lists:

```json
{
  "profiles": {
    "backend": {
      "skillsEnable": ["bootstrap-project-context", "systematic-debugging"],
      "skillsDisable": ["frontend-design"],
      "mcpServersEnable": ["context-mode"],
      "mcpServersDisable": ["chrome-devtools"]
    }
  }
}
```

Rules:

1. Disable wins over enable.
2. Empty enable list means "allow unless disabled".
3. Non-empty enable list means "only allow listed resources unless disabled".
4. `"*"` means all resources.

Examples:

```json
{
  "skillsEnable": ["*"]
}
```

Allows all skills.

```json
{
  "skillsDisable": ["*"]
}
```

Blocks all skills.

```json
{
  "mcpServersEnable": ["context-mode"],
  "mcpServersDisable": ["chrome-devtools"]
}
```

Allows only `context-mode`; blocks `chrome-devtools` even if it appears elsewhere.

## Current profiles

Profiles live in `.pi/profiles.json`.

Current default profile: `base`.

Current project profiles:

- `base` — small general-purpose baseline
- `superpowers` — broader planning/review/development workflow skills
- `backend` — server/API/database-oriented skills
- `frontend` — UI/browser-oriented skills and `chrome-devtools`
- `devops` — infra/release-oriented skills
- `agentic` — skill, prompt, and agent authoring
- `documenter` — docs and prompt/product writing

## Switching profiles

Use Pi profile command when available:

```text
/profile
```

Pick profile from list.

If profile is set by startup flag, persisted state, restored session, or default, precedence is:

1. startup flag
2. persisted profile state
3. restored session profile
4. `.pi/profiles.json` `defaultProfile`

Profile state persists in `.pi/profile-state.json`.

## What changes when profile switches

Profile extension applies policy in two ways:

1. Runtime enforcement blocks disallowed skill/MCP requests.
2. Resource sync updates Pi config so unavailable local resources are hidden/disabled.

Managed files:

- `.pi/settings.json`
- `.pi/mcp.json`
- `.pi/profile-state.json`
- `.pi/profile-extension-state.json`

`profile-extension-state.json` stores managed entries and MCP baseline so profile switches can restore resources later.

## Adding a profile

Add entry to `.pi/profiles.json`:

```json
{
  "profiles": {
    "minimal-review": {
      "skillsEnable": ["bootstrap-project-context", "code-reviewer", "systematic-debugging"],
      "mcpServersDisable": ["*"]
    }
  }
}
```

Then switch to it with `/profile`.

## Choosing profile shape

Use allow-lists for focused modes:

```json
{
  "skillsEnable": ["bootstrap-project-context", "systematic-debugging"],
  "mcpServersEnable": ["context-mode"]
}
```

Use disable-lists for broad modes with one unsafe or irrelevant tool blocked:

```json
{
  "skillsDisable": ["frontend-design"],
  "mcpServersDisable": ["chrome-devtools"]
}
```

Prefer small allow-lists for AI-agent focus. Fewer available skills/tools usually means less confusion and better task selection.

## Troubleshooting

### Skill command is blocked

Check active profile in Pi status/footer or run `/profile`.

Then inspect `.pi/profiles.json`:

- Is skill missing from `skillsEnable`?
- Is skill listed in `skillsDisable`?
- Does `skillsDisable` contain `"*"`?

### MCP server is blocked

Check profile MCP lists:

- Is server missing from `mcpServersEnable`?
- Is server listed in `mcpServersDisable`?
- Does `mcpServersDisable` contain `"*"`?

Also check `.pi/mcp.json` for configured server names.

### Resource disappeared from config

Expected when profile sync is active.

Profile extension can rewrite managed entries in `.pi/settings.json` and `.pi/mcp.json` based on active profile. Baseline data lives in `.pi/profile-extension-state.json`.

Switch to a profile that enables resource, or update `.pi/profiles.json`.

### Profile references unknown skill or MCP server

Profile validation warns when configured names are not discovered.

Common causes:

- typo in `.pi/profiles.json`
- skill installed globally/user-wide, not project-local
- MCP server absent from `.pi/mcp.json`
- package/extension disabled in `.pi/settings.json`

## Verification

Run profile extension tests:

```bash
node --test .pi/extensions/profile/*.test.ts
```

Expected result: all tests pass.
