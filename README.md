# Pi Starter Kit

Starter repo for Pi with:
- profiles
- local skills
- reusable agents
- prompt templates
- custom extensions

Main idea: switch profiles to change Pi behavior for different work.

## Structure

Everything lives in `.pi/`:
- `.pi/settings.json` — base Pi config
- `.pi/profiles.json` — profile definitions
- `.pi/extensions/` — custom extensions
- `.pi/agents/` — reusable agents
- `.pi/skills/` — local skills
- `.pi/prompts/` — prompt templates

Root also includes `AGENTS.md` with agent working rules.

## Install

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

## Profiles

Default profile: `backend`.

Current profiles:
- `backend` — server and API work
- `frontend` — UI and browser work
- `devops` — infra and release work
- `agentic` — agent and skill authoring

Profiles can:
- allow specific skills
- enable MCP servers
- disable MCP servers

## Notes

- Profile logic lives in `.pi/extensions/profile/`.
- Use profiles to keep Pi focused on current task.
- Add or edit local skills, agents, and prompts inside `.pi/`.
