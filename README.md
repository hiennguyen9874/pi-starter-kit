# Pi Starter Kit

A starter configuration for the [Pi coding agent](https://github.com/badlogic/pi-mono). It collects project-local extensions, profiles, skills, prompts, and agent definitions for different coding workflows.

## Getting started

1. Install Pi and configure a model provider and authentication for your environment.
2. Clone this repository and start `pi` from its root directory.
3. Use `/profile` to explore and select a workflow profile. The configured default is `base`.

Review `.pi/settings.json` and the selected profile before use: packages, tools, skills, and MCP servers can vary by profile and may require additional dependencies or credentials.

## Repository layout

- `.pi/settings.json` — project settings, packages, and extensions.
- `.pi/profiles/` and `.pi/profiles.json` — workflow profiles and the default profile.
- `.pi/extensions/` — local TypeScript extensions, including the profile manager.
- `.pi/skills/` and `.pi/prompts/` — reusable instructions and prompt templates.
- `.pi/agents/` — subagent definitions; see its [README](.pi/agents/README.md) for configuration details.
- `.pi/guidelines/` — behavioral guidelines used by profiles.
- `.pi/mcp.base.json` — base MCP server definitions.

Customize these files to fit your own workflow. Some integrations are disabled by default or enabled only by specific profiles.
