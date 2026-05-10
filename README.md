# Pi Starter Kit

Starter repo for configuring [Pi](https://github.com/mariozechner/pi-coding-agent) as a focused AI coding workspace.

Core idea: switch profiles to change which skills and MCP servers Pi exposes for a task. Smaller, task-shaped context makes Pi easier for humans to understand and easier for AI agents to use correctly.

## What You Get

- Profile-based skill and MCP filtering
- Local skills for repeatable agent workflows
- Reusable subagents
- Prompt templates
- Safety and behavior extensions (see [Extensions](#extensions))
- Project-local Pi config under `.pi/`

## 5-Minute Tour

1. Start Pi in this repo.
2. Check the footer/status for `profile:<name>`.
3. Run `/profile explain` to see active skill and MCP policy.
4. Switch profile with `/profile <name>` or select one with `/profile`.
5. Reload when prompted so startup skill and MCP filtering takes effect.

Default profile: `base`.

## Repository Structure

Everything Pi-specific lives in `.pi/`:

- `.pi/settings.json` — base Pi config, packages, extensions, skills
- `.pi/profiles.json` — profile definitions
- `.pi/mcp.json` — MCP server definitions
- `.pi/extensions/` — custom extensions (see [Extensions](#extensions))
- `.pi/extensions/profile/` — profile filtering/sync extension
- `.pi/agents/` — reusable agents
- `.pi/skills/` — local skills
- `.pi/prompts/` — prompt templates
- `AGENTS.md` — concise agent working rules and instruction index
- `docs/agent-instructions/` — shared detailed agent guidance for repo workflow and profiles

## Extensions

`.pi/extensions/` contains local Pi extensions that add safety guards, productivity features, and behavior shaping.

### Safety Guards

| Extension | What it does |
|---|---|
| `permission-gate.ts` | Blocks dangerous bash commands (`rm -rf`, `sudo`, `chmod 777`) unless confirmed in UI. Blocks by default in non-interactive mode. |
| `protected-paths.ts` | Blocks `write` and `edit` operations to `.env`, `.git/`, and `node_modules/`. |
| `confirm-destructive.ts` | Prompts for confirmation before clearing, switching, or forking a session. |
| `dirty-repo-guard.ts` | Warns and optionally blocks session switches/forks when uncommitted git changes exist. |

### Productivity

| Extension | What it does |
|---|---|
| `inline-bash.ts` | Expands `!{command}` patterns in user prompts with live command output before sending to the agent. |
| `prompt-skills.ts` | Auto-loads skills declared in prompt template frontmatter (`skills: [name1, name2]`) before execution. |
| `dump-system-prompt.ts` | Adds `--dump-system-prompt` flag to print the assembled system prompt and exit. |

### Behavior / Prompt Injection

These extensions inject guidelines into the system prompt. Each can be toggled with a `/command` and persists state in `.pi/settings.json` under `extensionState`.

| Extension | Command | Default | Injected guidelines |
|---|---|---|---|
| `tool-call-behavior.ts` | `/tool-call-behavior` | on | Preface meaningful tool calls; skip fluff for routine reads. |
| `repository-instructions.ts` | `/repository-instructions` | on | Respect `AGENTS.md` hierarchy and priority rules. |
| `behavioral-guidelines.ts` | `/behavioral-guidelines` | on | Think before coding, simplicity first, surgical changes, goal-driven execution. |
| `validation-rules.ts` | `/validation-rules` | on | Run narrow checks first, iterate up to 3 times on related failures. |
| `efficiency.ts` | `/efficiency` | on | Prefer targeted reads, avoid re-reading after successful edits. |
| `final-response.ts` | `/final-response` | on | Concise handoff format: Result, Files, Validation, Notes. |
| `pi-documentation.ts` | `/pi-documentation` | off | Removes the Pi documentation section from the system prompt when off. |
| `caveman.ts` | `/caveman` | full | Terse communication mode (lite/full/ultra/wenyan/commit/review/compress). |

### Profile Extension

`profile/` is a multi-module extension that loads `.pi/profiles.json`, enforces skill/MCP filtering, and syncs managed state into `.pi/settings.json` and `.pi/mcp.json`. It provides the `/profile` command family and shows `profile:<name>` in the Pi status area.

## Local Prompts and Skills

### Prompt Templates

Reusable prompt templates live in `.pi/prompts/`. Type `/name` in Pi to expand a template, where `name` is the filename without `.md`; pass task details after the command.

Example:

```text
/feature-design add profile import/export
/review-code docs/plans/2026-04-29-profile-plan.md
```

Profiles decide which skills and MCP servers are available while those prompts run.

Use these prompt groups when:

#### Design and Discovery

| Prompt | Use when |
|---|---|
| `/feature-design` | You want to design a feature or behavior change before implementation. |
| `/grill-with-docs-session` | You want to stress-test a plan against project docs, domain language, code evidence, and ADRs. |
| `/architecture-review` | You want architecture feedback and pragmatic refactoring opportunities, not code changes. |
| `/architecture-deepening` | You want architecture deepening candidates, then interactive exploration of one candidate. |
| `/project-next-step` | You want repo analysis and the top 3-5 most valuable next steps, not implementation. |

#### Plan

| Prompt | Use when |
|---|---|
| `/write-implementation-plan` | You have an approved design and need a concrete implementation plan. |

#### Implement

| Prompt | Use when |
|---|---|
| `/execute-plan-simple` | You have a small implementation plan ready to execute directly. |
| `/execute-plan-with-subagents` | You have a larger plan that should be implemented task-by-task with implementer and review subagents. |

#### Review and Verify

| Prompt | Use when |
|---|---|
| `/review-code` | You want a two-phase code review: spec alignment first, code quality second. |
| `/verify-before-done` | You want changed work verified before claiming completion. |

#### Fix Bugs and Review Issues

| Prompt | Use when |
|---|---|
| `/debug-issue` | You have a bug, failing test, broken behavior, or performance regression to diagnose and fix. |
| `/fix-review-issues` | You have a review report and want verified issues fixed with minimal changes. |

#### Frontend Design and Audit

| Prompt | Use when |
|---|---|
| `/frontend-design-direction` | Landing page, portfolio, or marketing site needs visual direction. |
| `/interface-design-direction` | Dashboard, app, admin panel, or product surface needs design direction. |
| `/frontend-ui-audit` | You want UI, UX, accessibility, shadcn, or React frontend quality review without fixes. |

#### Frontend Implement and Polish

| Prompt | Use when |
|---|---|
| `/shadcn-ui-build` | You need shadcn/ui components, pages, forms, dialogs, tables, themes, or blocks built/fixed. |
| `/frontend-polish-pass` | Marketing UI feels generic, cluttered, or weak — hierarchy, spacing, copy, motion. |
| `/interface-polish-pass` | Product UI needs density, navigation, data presentation, or information architecture fixes. |
| `/react-view-transitions-build` | Add page transitions, shared element animations, or View Transition API integration. |
| `/react-component-api-refactor` | React component APIs have boolean-prop growth or need cleaner composition. |
| `/react-performance-pass` | React/Next.js UI is slow or has rerenders, hydration, bundle, data-fetching, or load-time issues. |

#### Agent System

| Prompt | Use when |
|---|---|
| `/create-agent-workflow` | You want a new reusable workflow prompt for a repeatable coding-agent task. |
| `/improve-agent-system` | You want to improve the local agent, skill, and prompt system without invasive edits. |
| `/improve-skill-system` | You want to improve, merge, split, or create skills. |
| `/refactor-agent-instructions` | You want `AGENTS.md` or related agent instruction files made concise and shared via docs. |

#### Git

| Prompt | Use when |
|---|---|
| `/commit-work` | You want current verified changes staged and committed with a conventional commit. |

### Skill Catalog

Local skills live in `.pi/skills/`. Profiles expose only task-relevant subsets.

Core workflow skills:

- `bootstrap-project-context` — repo onboarding from docs and source
- `diagnose` / `systematic-debugging` — bug and failure diagnosis
- `code-reviewer`, `requesting-code-review`, `receiving-code-review` — review workflows
- `git-commit`, `verification-before-completion`, `finishing-a-development-branch` — completion and commit workflows
- `brainstorming`, `writing-plans`, `executing-plans`, `dispatching-parallel-agents`, `subagent-driven-development` — planning and execution workflows
- `grill-me`, `grill-with-docs`, `domain-model`, `improve-codebase-architecture`, `pragmatic-principles` — design pressure-testing and architecture improvement

Domain and stack skills:

- backend/API/data: `api-design`, `backend-patterns`, `database-migrations`, `postgres-patterns`
- Go: `golang-patterns`, `golang-testing`
- frontend/design: `frontend-skill`, `interface-design`, `coding-standards`, `react-best-practices`, `react-view-transitions`, `shadcn-best-practices`, `composition-patterns`, `ui-ux-pro-max`, `web-design-guidelines`
- brand/design-system: `brand`, `design-system`, `banner-design`, `slides`
- DevOps: `docker-patterns`

Agent-authoring and docs skills:

- `agent-md-refactor` — restructure agent instruction files with docs-only progressive disclosure
- `context7-cli` — fetch library docs and manage Context7/ctx7 skill workflows
- `prompt-leverage` — upgrade raw prompts into execution-ready prompts
- `prd` — create product requirements documents
- `skill-creator`, `writing-skills` — create, test, and improve skills
- `test-driven-development` — imported workflow skills used by broader profiles

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

### Runtime Behavior

The profile extension (`.pi/extensions/profile/`) loads `.pi/profiles.json` at session start and selects a profile in this order:

1. `--profile <name>` startup flag
2. `.pi/profile-state.json` persisted profile
3. restored session profile
4. `defaultProfile`

It then:

- shows `profile:<name>` in the Pi status area
- injects active profile restrictions into agent prompts
- blocks `/skill:<name>` commands for skills disabled by the profile
- blocks MCP gateway calls to disabled servers
- rewrites managed startup filters in `.pi/settings.json` and `.pi/mcp.json`
- asks for `/reload` when startup filters changed during an active session

Use `/profile explain` to inspect the active policy and reference warnings.

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

### Ripgrep
- https://github.com/burntsushi/ripgrep

## Agent Instructions

Agent-facing instructions use docs-only progressive disclosure:

- `AGENTS.md` — start here; contains quick commands, repo map, critical rules, and read triggers
- `docs/agent-instructions/repo-workflow.md` — read when changing repo structure, Pi config, extensions, skills, agents, prompts, or verification workflows
- `docs/agent-instructions/profiles.md` — read when changing profiles, skill/MCP availability, profile sync behavior, or profile docs

Keep detailed shared agent guidance under `docs/agent-instructions/`, not under `.pi/`, `.claude/`, `.codex/`, `.cursor/`, or other tool-private directories.

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

## Frontend Workflow

Frontend prompts distinguish **marketing surfaces** (landing pages, portfolios, hero sections) from **product surfaces** (dashboards, admin panels, SaaS apps). Use `frontend-*` prompts for marketing, `interface-*` prompts for product.

### Workflow Chains

**Landing Page:**
```
frontend-design-direction → shadcn-ui-build → frontend-polish-pass → frontend-ui-audit
```

**Dashboard / SaaS App:**
```
interface-design-direction → shadcn-ui-build → interface-polish-pass → frontend-ui-audit → react-performance-pass (if needed)
```

**Component Refactor:**
```
react-component-api-refactor → frontend-ui-audit → react-performance-pass (if perf issues found)
```

**Animation Add-on:**
```
react-view-transitions-build → frontend-ui-audit
```

### Skill Groupings

| Group | Skills | Purpose |
|-------|--------|---------|
| React Development | `composition-patterns`, `react-best-practices`, `react-view-transitions` | Architecture, performance, animations |
| Visual Design | `frontend-skill` (marketing), `interface-design` (product) | Surface-specific art direction |
| Design Reference | `ui-ux-pro-max` | Color palettes, fonts, styles, UX guidelines |
| Brand & System | `brand`, `design-system` | Identity → tokens → CSS vars pipeline |
| UI Implementation | `shadcn-best-practices` | shadcn/ui + Tailwind + canvas visual design |
| Graphic & Presentation | `banner-design`, `slides` | Banners, HTML presentations |
| Audit | `web-design-guidelines` | Review code against Vercel guidelines |

### Design Notes

This repo is meant to be edited. Treat it as a starter kit, not a framework:

- Keep default profiles small.
- Add only skills/tools you actively use.
- Prefer task-shaped profiles over one giant all-tools profile.
- Keep agent instructions explicit and test important extension behavior.
- See `docs/FRONTEND_PROMPT.md` for full prompt guide and `docs/FRONTEND_SKILL.md` for detailed skill analysis.
