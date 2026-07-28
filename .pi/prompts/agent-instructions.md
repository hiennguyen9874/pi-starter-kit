---
description: Explore a repository with subagents and create an evidence-based AGENTS.md
---

Create or substantially improve the root `AGENTS.md`: a concise, repository-specific guide for coding agents and contributors.

## Explore first

Before drafting, launch several read-only `Explore` subagents **in parallel**. Give each a distinct area and require absolute file-path references plus only verified findings:

1. **Project and tooling** — README files, manifests, lockfiles, CI, build/lint/format/typecheck configuration, environment templates, and package scripts. Identify the canonical development commands, including focused test commands when supported.
2. **Architecture** — entry points, primary source directories, module boundaries, application/data/control flow, shared abstractions, and important configuration. Read enough connected code to explain non-obvious relationships.
3. **Testing and quality** — test directories and naming, test framework/configuration, fixtures, mocks, coverage, linting, formatting, type checking, and how to run targeted tests.
4. **Repository conventions** — existing agent/contributor instructions, Cursor/Copilot rules, documentation, git history, and representative recent code. Identify observable naming, organization, commit, pull-request, and runtime/package-manager conventions.

Scale the number of agents to the repository: split large or multi-language areas further; combine empty or tiny areas. Do not ask agents to modify files. Do not use a single-agent summary as evidence—inspect the most important reported files yourself before writing.

## Write `AGENTS.md`

Synthesize the verified findings into `AGENTS.md` at the repository root. If it already exists, preserve accurate useful content and replace stale or generic guidance rather than blindly appending.

Start exactly with:

```md
# Repository Guidelines
```

Keep the document focused, practical, and normally 200–400 words. Adapt the following sections to the repository; omit sections without evidence and add brief project-specific guidance when it materially helps an agent work safely:

- **Project Overview** — purpose and the important architectural boundary or data flow.
- **Project Structure** — only the directories and entry points that matter to making changes.
- **Development Commands** — copy-pastable install, run, build, lint, typecheck, test, and single-test commands. State the required runtime and package manager when demonstrated by repository files.
- **Code Conventions** — conventions derived from config and representative code: formatting, naming, imports, async/error-handling, dependency injection, state, or other locally important patterns.
- **Testing and Quality** — test location and naming, focused test workflow, and coverage or QA requirements that are actually configured.
- **Changes and Reviews** — commit-message and pull-request expectations only when supported by history, templates, or documented rules.
- **Agent-Specific Notes** — non-obvious generated files, migrations, environment setup, commands to avoid, or boundaries found in existing instructions.

Use Markdown headings, short paragraphs, and bullets. Include concrete paths and commands where useful. Do not invent commands, workflows, architecture, policies, or requirements. Avoid generic advice and exhaustive file listings. Incorporate relevant existing repository instructions rather than duplicating them verbatim.

## Verify and report

After writing, reread `AGENTS.md` and verify that every command appears in project configuration or documentation and every architectural claim is supported by inspected code. Report the created or updated path, the subagent areas explored, and any meaningful gaps caused by missing repository evidence.
