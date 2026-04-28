# Pi Starter Kit

Starter repo for configuring [Pi](https://github.com/mariozechner/pi-coding-agent) as a focused AI coding workspace.

Core idea: switch profiles to change which skills and MCP servers Pi exposes for a task. Smaller, task-shaped context makes Pi easier for humans to understand and easier for AI agents to use correctly.

## What You Get

- Profile-based skill and MCP filtering
- Local skills for repeatable agent workflows
- Reusable subagents
- Prompt templates
- Safety and behavior extensions
- Project-local Pi config under `.pi/`

## 5-Minute Tour

1. Start Pi in this repo.
2. Check active profile in startup context/status.
3. Switch profile with the profile command if available in your Pi session.
4. Ask for backend, frontend, devops, or agent-authoring work.
5. Observe that only profile-relevant skills and MCP servers are available.

Default profile: `base`.

## Repository Structure

Everything Pi-specific lives in `.pi/`:

- `.pi/settings.json` — base Pi config, packages, extensions, skills
- `.pi/profiles.json` — profile definitions
- `.pi/mcp.json` — MCP server definitions
- `.pi/extensions/` — custom extensions
- `.pi/extensions/profile/` — profile filtering/sync extension
- `.pi/agents/` — reusable agents
- `.pi/skills/` — local skills
- `.pi/prompts/` — prompt templates
- `AGENTS.md` — agent working rules for this repo

## Profiles

Profiles control which skills and MCP servers are visible or blocked.

Current profiles:

- `base` — small general-purpose default
- `superpowers` — broader workflow/tooling profile
- `backend` — server, API, database, Go, and backend work
- `frontend` — UI, React, design, browser work
- `devops` — infra and release work
- `agentic` — agent, skill, prompt, and compression work
- `documenter` — docs and product-writing work

Profile config lives in `.pi/profiles.json`.

Detailed guide: [docs/profiles.md](docs/profiles.md).

### Profile Semantics

Each profile can define:

- `skillsEnable` — allow only these skills when non-empty
- `skillsDisable` — block these skills
- `mcpServersEnable` — allow only these MCP servers when non-empty
- `mcpServersDisable` — block these MCP servers

Rules:

- Disable wins over enable.
- Empty enable list means “allow unless disabled.”
- Non-empty enable list means “deny unless enabled.”
- `*` means all.

Example:

```json
{
  "profiles": {
    "minimal": {
      "skillsEnable": ["bootstrap-project-context", "systematic-debugging"],
      "mcpServersDisable": ["*"]
    }
  }
}
```

## Important Behavior

Profile sync may update managed entries in:

- `.pi/settings.json`
- `.pi/mcp.json`
- `.pi/profile-state.json`
- `.pi/profile-extension-state.json`

This is intentional. The extension persists active profile state and filters managed skills/MCP servers so Pi starts with the correct task-shaped context.

## Install Optional Integrations

### Context Mode

```bash
cd .pi/extensions
git clone https://github.com/mksglu/context-mode.git
cd context-mode
npm install
npm run build
```

### RTK

- https://github.com/rtk-ai/rtk

### Web Access

- https://github.com/nicobailon/pi-web-access

## Test

Run profile extension tests:

```bash
node --test .pi/extensions/profile/*.test.ts
```

Expected result: all tests pass.

## Common Tasks

### Add a Skill to a Profile

1. Add or install the skill.
2. Add its skill name to `.pi/profiles.json` under `skillsEnable`.
3. Restart or refresh Pi so profile filtering reloads.

### Add an MCP Server to a Profile

1. Add server config to `.pi/mcp.json`.
2. Add server name to `.pi/profiles.json` under `mcpServersEnable`.
3. Restart or refresh Pi.

### Create a New Profile

Add a profile under `.pi/profiles.json`:

```json
{
  "profiles": {
    "review": {
      "skillsEnable": ["bootstrap-project-context", "code-reviewer", "systematic-debugging"],
      "mcpServersEnable": ["context-mode"]
    }
  }
}
```

## Troubleshooting

### Skill Not Available

Check:

1. Skill exists locally or is installed by a Pi package.
2. Active profile includes it in `skillsEnable` when that list is non-empty.
3. Active profile does not include it in `skillsDisable`.
4. `.pi/settings.json` does not contain a managed exclusion for it after profile sync.

### MCP Server Blocked

Check:

1. Server exists in `.pi/mcp.json` or is provided by an extension/package.
2. Active profile includes it in `mcpServersEnable` when that list is non-empty.
3. Active profile does not include it in `mcpServersDisable`.

### Profile References Missing Skills

Some profile entries may refer to skills provided by external Pi packages or user-level skill directories. If a skill is missing, either install it, remove it from the profile, or keep it only in profiles where that external dependency exists.

## Design Notes

This repo is meant to be edited. Treat it as a starter kit, not a framework:

- Keep default profiles small.
- Add only skills/tools you actively use.
- Prefer task-shaped profiles over one giant all-tools profile.
- Keep agent instructions explicit and test important extension behavior.
