# Pi Starter Kit

A user-focused starter repository for running Pi with a curated set of packages, custom extensions, reusable agents, prompt templates, and profile-based skill loading.

This repo is organized around one idea: **switch profiles to change how Pi behaves for different kinds of work**.

## What this repository includes

The root of the setup lives in `.pi/`:

- `.pi/settings.json` — base Pi packages, extensions, and skill overrides
- `.pi/profiles.json` — profile definitions and the default profile
- `.pi/extensions/` — custom TypeScript extensions that add session and tool safety features
- `.pi/agents/` — reusable agent definitions
- `.pi/skills/` — local skills available to Pi
- `.pi/prompts/` — reusable prompt templates for common workflows

There is also an `AGENTS.md` file at the repo root that sets working rules for coding agents, especially around simplicity, surgical edits, and explicit planning.

## Install

### Context Mode

```bash
cd .pi/extensions
git clone https://github.com/mksglu/context-mode.git
cd context-mode
npm run build
npm install
```

### RTK

- [https://github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk)

### Web Access Token

- [pi-web-access](https://github.com/nicobailon/pi-web-access)

## How profile-based setup works

`pi/profiles.json` defines the available profiles and sets `backend` as the default.

Each profile can:

- enable a specific allowlist of skills
- disable specific MCP servers
- enable specific MCP servers when needed

The profile system is backed by code in `.pi/extensions/profile/`, which loads profile definitions, discovers known skills and MCP servers, and applies profile policy to the active Pi setup.

## Available profiles

### `backend` (default)

Best for server-side and API work.

Includes skills for:

- backend design and implementation
- database migrations and Postgres
- Go project structure, patterns, and testing
- debugging, planning, verification, and code review

Disables:

- `chrome-devtools`

### `frontend`

Best for UI and browser-facing work.

Includes skills for:

- frontend design and development
- React and shadcn guidance
- UI styling, UX, and web design
- coding standards, debugging, planning, verification, and code review

Enables:

- `chrome-devtools`

### `devops`

Best for release and infrastructure-oriented work.

Includes skills for:

- Docker patterns
- release drafting
- shared planning, debugging, verification, and review workflows

Disables:

- `chrome-devtools`

### `agentic`

Best for agent authoring and agent-heavy workflows.

Includes skills for:

- agent markdown refactoring
- skill creation
- shared planning, debugging, verification, and review workflows

Disables:

- `chrome-devtools`

### `documenter`

Best for writing docs, prompts, and specifications.

Includes skills for:

- PRD writing
- prompt improvement
- writing plans and skills
- code review and pragmatic simplification

Disables:

- `chrome-devtools`

## Packages configured in `.pi/settings.json`

This starter kit enables a set of Pi packages, including:

- `pi-powerline-footer`
- `pi-web-access`
- `pi-mcp-adapter`
- `@tintinweb/pi-subagents`
- `pi-ask-user`
- `pi-rtk-optimizer`
- `@tmustier/pi-usage-extension`
- `pi-command-history`
- `pi-tool-display`
- `pi-autoresearch`

In practice, this gives the workspace support for web access, MCP integration, subagents, interactive user questions, command history, tool display, and experiment-style optimization workflows.

## Custom extensions

The active custom extensions listed in `.pi/settings.json` are:

### `.pi/extensions/permission-gate.ts`

Prompts before dangerous `bash` commands such as:

- `rm -rf`
- `sudo`
- permissive `chmod/chown ... 777`

In non-interactive mode, dangerous commands are blocked.

### `.pi/extensions/protected-paths.ts`

Blocks `write` and `edit` operations on protected paths such as:

- `.env`
- `.git/`
- `node_modules/`

### `.pi/extensions/confirm-destructive.ts`

Adds confirmation prompts before destructive session actions, including:

- clearing the current session
- switching sessions with unsaved work
- forking from a prior entry

### `.pi/extensions/dirty-repo-guard.ts`

Checks `git status --porcelain` before session switching or forking and warns when the repo has uncommitted changes.

### `.pi/extensions/inline-bash.ts`

Expands inline shell snippets written as `!{command}` directly inside a prompt before the prompt reaches the agent.

Example:

```text
What branch am I on? !{git branch --show-current}
```

### `.pi/extensions/caveman.ts`

Adds `/caveman` commands to switch compression modes (lite, full, ultra, wenyan variants, commit, review, compress). It activates on session start with a configurable default, injects per-turn system prompt rules for persistent behavior, and shows the active mode in the status line.

### `.pi/extensions/profile/`

This folder contains profile support code such as config loading, policy evaluation, discovery helpers, and profile syncing. It supports the profile-based filtering defined in `.pi/profiles.json`.

## Custom agents

The repository defines three agents in `.pi/agents/`:

### `general-purpose`

A broad agent for complex, multi-step work.

- display name: `Agent`
- tools: `all`
- prompt mode: `append`

### `explore`

A fast, read-only exploration agent for understanding a codebase.

- display name: `Explore`
- tools: `read`, `bash`, `grep`, `find`, `ls`
- model: `anthropic/claude-haiku-4-5-20251001`
- prompt mode: `replace`

This agent is explicitly read-only and is instructed not to modify files or run state-changing commands.

### `code-reviewer`

A background-capable review agent for validating completed work against plans and coding standards.

- display name: `Code Reviewer`
- tools: `read`, `bash`, `grep`, `find`, `ls`
- prompt mode: `replace`
- runs in background by default
- activates review-oriented skills such as `code-reviewer`, `pragmatic-principles`, and `receiving-code-review`

## Local skills

The `.pi/skills/` directory contains a large local skill library. Instead of documenting every skill in detail here, it is easiest to think of them in groups:

### Core workflow skills

These shape how work gets done:

- `using-superpowers`
- `brainstorming`
- `grill-me`
- `writing-plans`
- `executing-plans`
- `verification-before-completion`
- `pragmatic-principles`
- `code-reviewer`
- `requesting-code-review`
- `receiving-code-review`
- `git-commit`
- `context7-cli`
- `prompt-leverage`

### Backend and API skills

Examples:

- `backend-patterns`
- `api-design`
- `database-migrations`
- `postgres-patterns`
- `go-api-project-structure`
- `golang-patterns`
- `golang-pro`
- `golang-testing`

### Frontend and UI skills

Examples:

- `frontend-design`
- `frontend-development`
- `frontend-skill`
- `react-best-practices`
- `shadcn-best-practices`
- `ui-styling`
- `ui-ux-pro-max`
- `vercel-composition-patterns`
- `web-design-guidelines`
- `coding-standards`

### DevOps and release skills

Examples:

- `docker-patterns`
- `release-drafter`

### Agent-building skills

Examples:

- `agent-md-refactor`
- `skill-creator`
- `subagent-driven-development`
- `writing-skills`

### Caveman and compression skills

These provide ultra-compressed communication modes and utilities:

- `caveman`
- `caveman-commit`
- `caveman-help`
- `caveman-review`
- `compress`

### Product and documentation skills

Examples:

- `prd`

Profile selection determines which of these are active for a given session.

## Prompt templates

The `.pi/prompts/` folder currently contains two reusable prompts:

### `.pi/prompts/review-implemented-plan.md`

A review workflow prompt that asks Pi to:

- read the relevant design and plan files
- activate review-related skills
- inspect code changes against the plan
- save the review output under `docs/plans/...-review.md`

### `.pi/prompts/fix-issues-review.md`

A follow-up workflow prompt that asks Pi to:

- read a review report and plan file
- activate execution-oriented guidance
- verify reported issues in code
- fix them and update the review report

## AGENTS.md working rules

`AGENTS.md` defines the behavioral guardrails for work done in this repo. The main themes are:

- think before coding
- keep solutions simple
- make surgical changes only
- define clear success criteria and verify them

If you use this starter kit as a base for agent-driven development, those rules are part of the expected operating style.

## Repository map

```text
.
├── AGENTS.md
└── .pi/
    ├── settings.json
    ├── profiles.json
    ├── extensions/
    ├── agents/
    ├── skills/
    └── prompts/
```

## When to edit what

- Edit `.pi/settings.json` to change base packages, extension entries, or base skill overrides.
- Edit `.pi/profiles.json` to define or refine working modes like backend, frontend, or documenter.
- Add files under `.pi/extensions/` when you want to change runtime behavior around tools or sessions.
- Add files under `.pi/agents/` when you want reusable specialized agents.
- Add folders under `.pi/skills/` when you want local skill instructions.
- Add files under `.pi/prompts/` when you want reusable workflow prompts.

## Best fit for this starter kit

This repo is a good base if you want:

- one Pi workspace with multiple working modes
- stronger safety rails around editing and shell usage
- reusable agent and prompt workflows
- a local skill library that can be narrowed by profile

If you mostly want a minimal Pi setup, this repository is likely more structured than necessary. If you want a configurable, opinionated workspace, it is a strong starting point.
