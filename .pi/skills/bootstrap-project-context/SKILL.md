---
name: bootstrap-project-context
description: Bootstrap a new AI-agent session by reading the repository operating docs and rebuilding project understanding from source. Use when Codex needs to start a new conversation, get up to speed on an unfamiliar repo, read AGENTS.md and README.md completely before acting, investigate the codebase to understand the project's purpose and architecture, or turn a rough onboarding prompt into an execution-ready repo-orientation prompt.
disable-model-invocation: true
metadata:
  dependencies: []
---

# Bootstrap Project Context

Start a session by absorbing the repo's explicit instructions first, then confirm the real system shape from source.

Load [references/prompt-template.md](references/prompt-template.md) when the user wants a reusable bootstrap prompt or when you need a strong starting template before beginning repo discovery.

## Modes

Choose the lightest mode that fits the request.

- `Prompt-only`: refine the user's rough bootstrap prompt and return the upgraded prompt.
- `Repo bootstrap`: read the operating docs, investigate the repo, and deliver an onboarding summary.
- `Prompt + bootstrap`: return the upgraded prompt and use the same standards while building context.

## Workflow

### 1. Read the explicit repo contract first

Read these files completely when they exist:

- `AGENTS.md`
- `README.md`

Treat them as mandatory orientation, not optional background.

If the repo exposes a read-only status or onboarding scout, you may use it as a supplement after the mandatory docs pass, never as a substitute for reading the docs.

### 2. Build a source-first map of the repository

Understand the codebase from the implementation, not from naming alone.

Inspect the most informative source artifacts first, such as:

- package manifests, build files, task runners, and lockfiles
- top-level app or service directories
- primary entrypoints and framework bootstraps
- configuration files, environment examples, and schemas
- tests that reveal supported behavior
- architecture docs and design notes when present

Aim to identify:

- what the project is for
- who or what uses it
- the major subsystems and how they relate
- the main execution paths, data flows, and external integrations
- the development and verification commands that matter

### 3. Trace the technical architecture with enough depth

Go broad before going deep.

At minimum, determine:

- the primary language, framework, and runtime model
- the main module boundaries
- where requests, jobs, or user actions enter the system
- where state lives
- how the project is configured, built, and tested

Read representative files from each important area. Do not pretend to understand the architecture from one or two files, but do not exhaustively read the whole repo when a targeted map is enough.

### 4. Return a practical onboarding synthesis

Summarize the repo in a way that helps the next turn start strong.

Include:

- project purpose
- architecture summary
- major components and responsibilities
- important commands and workflows
- notable conventions or operating constraints from `AGENTS.md`
- open questions or areas that still need deeper inspection
- the best next files or directories to read for the user's likely goal

### 5. Verify the orientation pass

Before finishing, check that your summary is grounded in files you actually inspected.

Make sure you did not:

- skip `AGENTS.md` or `README.md`
- confuse docs intent with real implementation behavior
- describe architecture that you did not verify from source
- miss an obvious top-level subsystem, runtime, or integration

## Prompt Upgrade Rules

When the user gives a rough bootstrap prompt, keep the intent but add the missing execution structure:

- require a complete read of `AGENTS.md` and `README.md` before code investigation
- require source-first codebase investigation after the docs pass
- require identifying project purpose, architecture, components, workflows, and commands
- require a concise onboarding synthesis instead of vague claims of understanding
- require explicit mention of remaining unknowns and recommended next reads when appropriate

Prefer the template in [references/prompt-template.md](references/prompt-template.md) over improvising from scratch.

## Red Flags

Stop and correct the approach if any of these appear:

- skimming `AGENTS.md` or `README.md`
- jumping into code without first reading the repo instructions
- inferring architecture from directory names alone
- giving a hand-wavy summary with no file-grounded evidence
- over-reading low-value files instead of building a representative system map

## Done Criteria

This skill is complete when the upgraded prompt or repo-orientation pass:

- begins with a full read of `AGENTS.md` and `README.md` when present
- explains the project's purpose and technical architecture from inspected source
- identifies the main components, workflows, and important commands
- captures repo-specific conventions and open questions clearly enough for the next turn to start productively