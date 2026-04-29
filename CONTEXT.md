# Project Context Manifest

This repository is a Pi starter kit for focused AI coding sessions. It packages project-local Pi configuration, profiles, skills, agents, prompt templates, MCP setup, and safety/behavior extensions.

Primary goal: make Pi easier to steer by switching named profiles that expose only task-relevant skills and MCP servers.

## Core idea

Use `.pi/profiles.json` to select a work mode:

- `base` — general-purpose baseline, current default
- `superpowers` — broader planning/review/development workflow
- `backend` — server, API, database work
- `frontend` — UI/browser work with `chrome-devtools`
- `devops` — infrastructure and release work
- `agentic` — agent, skill, and prompt authoring
- `documenter` — docs and product/prompt writing

Profiles reduce context noise for AI agents and make tool/skill availability more predictable for humans.

## Important files

- `AGENTS.md` — repo working rules for AI agents. Read first.
- `README.md` — human overview and install notes.
- `docs/agent-instructions/profiles.md` — profile mental model, switching, troubleshooting, verification for agents.
- `.pi/settings.json` — Pi packages, extensions, skills, and subagent model overrides.
- `.pi/profiles.json` — profile definitions and default profile.
- `.pi/mcp.json` — project MCP server config.
- `.pi/extensions/profile/` — profile extension source and tests.
- `.pi/extensions/*.ts` — behavior and safety extensions.
- `.pi/skills/` — local skills.
- `.pi/agents/` — reusable subagents.
- `.pi/prompts/` — prompt templates.

## Profile semantics

Profile fields:

- `skillsEnable`
- `skillsDisable`
- `mcpServersEnable`
- `mcpServersDisable`

Rules:

1. Disable wins over enable.
2. Empty enable list means allow unless disabled.
3. Non-empty enable list means allow only listed resources unless disabled.
4. `"*"` means all resources.

Prefer small allow-lists for focused agent work. Fewer available tools and skills usually improves task selection.

## Profile extension architecture

Main modules:

- `.pi/extensions/profile/profile-config.ts` loads and validates `.pi/profiles.json`.
- `.pi/extensions/profile/profile-policy.ts` implements allow/deny/wildcard semantics.
- `.pi/extensions/profile/profile-discovery.ts` discovers known skill and MCP names.
- `.pi/extensions/profile/profile-sync.ts` persists active profile and syncs resources.
- `.pi/extensions/profile/index.ts` wires extension hooks, profile selection, prompts, validation, and enforcement.

Profile selection precedence:

1. startup flag
2. persisted profile state
3. restored session profile
4. `.pi/profiles.json` `defaultProfile`

## Managed state and mutation behavior

The profile extension can rewrite managed Pi config so unavailable resources are hidden or disabled.

Managed files:

- `.pi/settings.json`
- `.pi/mcp.json`
- `.pi/profile-state.json`
- `.pi/profile-extension-state.json`

`.pi/profile-extension-state.json` stores managed skill entries and MCP baseline so profile switches can restore resources later.

Do not assume changes to `.pi/settings.json` or `.pi/mcp.json` are always manual edits. Check active profile and profile state first.

## Safety and behavior extensions

Notable extensions in `.pi/extensions/`:

- `permission-gate.ts` — asks before dangerous bash commands such as `rm -rf`, `sudo`, broad chmod/chown.
- `dirty-repo-guard.ts` — warns/blocks session switch or fork when git worktree has uncommitted changes.
- `protected-paths.ts` — protects configured paths from edits.
- `inline-bash.ts` — improves bash command handling.
- `caveman.ts` — terse response mode with slash-command controls.

## Verification commands

Run profile tests:

```bash
node --test .pi/extensions/profile/*.test.ts
```

Expected: all tests pass.

Check repo state:

```bash
git status --short
```

## Common agent workflows

### Bootstrap repo understanding

1. Read `AGENTS.md` and `README.md` completely.
2. Read this `CONTEXT.md`.
3. For profile behavior, read `docs/agent-instructions/profiles.md`.
4. Inspect `.pi/profiles.json`, `.pi/settings.json`, and relevant source under `.pi/extensions/profile/`.
5. Verify with profile tests before claiming profile changes work.

### Add or change profile

1. Edit `.pi/profiles.json`.
2. Keep allow-lists small unless broad mode is intentional.
3. Check for unknown skill or MCP names.
4. Run `node --test .pi/extensions/profile/*.test.ts`.
5. Update `docs/agent-instructions/profiles.md` if profile meaning changes.

### Add skill

1. Add skill under `.pi/skills/<skill-name>/SKILL.md`.
2. Include frontmatter `name` and `description`.
3. Add skill to relevant profiles in `.pi/profiles.json`.
4. Keep skill instructions task-specific and short.

### Add MCP server

1. Add server to `.pi/mcp.json`.
2. Add server to relevant profile `mcpServersEnable` lists.
3. Document expected use in `docs/agent-instructions/profiles.md` when user-facing.

## Design constraints

- Keep starter kit approachable. Avoid adding broad defaults without strong reason.
- Prefer explicit profile policies over implicit behavior.
- Keep profile extension behavior test-covered.
- Avoid unrelated cleanup during task edits.
- Document config mutation clearly when changing profile sync behavior.

## Current product assessment

Useful kernel: profile-based focus for Pi is valuable and profile extension is tested.

Main improvement need: make first-run experience obvious. Humans and agents should quickly understand active profile, available resources, why something is blocked, and which files are managed.
