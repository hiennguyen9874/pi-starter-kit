---
name: agent-md-refactor
description: Refactor or create a repository's root AGENTS.md into a concise root file plus docs/agent-instructions/ detail, Pi-only.
disable-model-invocation: true
---

# Agent MD Refactor

Create or refactor a repository's root `AGENTS.md` using **docs-only** progressive disclosure: a concise root file that links to detailed project guidance under `docs/agent-instructions/`.

This skill is Pi-only. `AGENTS.md` is the root instruction file; there are no per-tool instruction files to merge.

## Leading words

- **load-bearing** — an instruction that changes agent behavior for this repo (prevents a specific mistake, reveals non-obvious behavior, gives an exact command, or overrides a wrong default). The test every retained instruction must pass.
- **no-op** — an instruction that fails the **load-bearing** test: vague, generic, obvious from the codebase, stale, or default behavior the agent already follows. The target of pruning.
- **docs-only** — detailed project instructions live under `docs/agent-instructions/`, never in tool-private directories or nested `AGENTS.md` files.

## Branches

Run the phases each branch needs:

| Branch | Phases | Notes |
|---|---|---|
| Create | 1, 4, 5, 6 | No existing file to analyze. |
| Refactor | 1–7 | Full sequence. |
| Merge | 1, 2, 5, 6 | Consolidating scattered instructions into docs. |
| Review | 2, 3, 7 | Report only — no edits unless the user asks. |

## Output Model

One root `AGENTS.md`, plus detailed Markdown files under `docs/agent-instructions/`.

```text
project-root/
├── AGENTS.md
└── docs/
    └── agent-instructions/
        ├── overview.md
        ├── build-system.md
        └── ...
```

Two hard guardrails:

1. **docs-only** — detailed instructions go under `docs/agent-instructions/`, not in `.pi/` (`.pi/skills/` holds skills, which teach workflow, not project docs) or any other tool-private location.
2. No nested `AGENTS.md` files by default. Represent module boundaries through the root mini repo map and `docs/agent-instructions/architecture.md`. If the user explicitly asks for nested files, state this default and ask before deviating.

Use standard Markdown only. Preserve an existing file's custom tag or plain-text syntax unless the user explicitly asks to convert.

## Core Principle

Every retained instruction must be **load-bearing**; prune **no-op** instructions.

## Process

### Phase 1: Analyze Repository

Inspect the repo to identify its purpose, languages/frameworks, package manager, dependency commands, build/run/lint/format/typecheck/test commands, CI/CD, architecture docs, current README and developer docs, existing `AGENTS.md`, and major module boundaries.

Common files to check: `README.md`, `AGENTS.md`, `package.json` / `pnpm-workspace.yaml` / lockfiles, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Makefile` / `justfile`, `.github/workflows/`, Dockerfiles, existing `docs/`.

Source every command from a repo file. If a command is unclear, write `Unknown; see <file>` or ask the user.

**Completion:** every install/build/run/lint/test command is sourced from a repo file or marked `Unknown; see <file>`; the repo map names every top-level path with a purpose.

### Phase 2: Analyze Existing Instruction Files

Read existing `AGENTS.md` fully before editing. Classify each instruction as: keep in root / move to `docs/agent-instructions/` / delete / resolve contradiction. Note custom syntax to preserve or confirm before converting.

**Completion:** every existing instruction line is classified into one of the four buckets.

### Phase 3: Find Contradictions

Identify conflicting instructions before editing: contradictory style guidelines, conflicting workflows, incompatible tool preferences, commands contradicted by current scripts, or the same detailed guidance placed in different locations.

For each contradiction, ask the user before proceeding:

```markdown
## Contradiction Found

**Instruction A:** [quote]
**Instruction B:** [quote]

**Question:** Which should take precedence, or should both be conditional?
```

**Completion:** zero unresolved contradictions; each is either user-resolved or marked conditional.

### Phase 4: Separate Root Essentials From Details

The root file keeps only information useful for nearly every task:

| Category | Example |
|---|---|
| Project description | One sentence explaining repository purpose |
| Quick commands | Install, run, test, build, full checks |
| Mini repo map | Top-level paths and short purpose |
| Instruction index | Links into `docs/agent-instructions/` with read triggers |
| Critical rules | Universal high-priority rules |
| Non-obvious setup | Required runtime, container, service, or package-manager constraints |

Everything else moves to `docs/agent-instructions/`: language conventions, testing strategy, code style, architecture deep dives, deployment, debugging notes, git workflow, framework patterns, long examples.

Use `references/agents-template.md` for the root file shape.

**Completion:** root file contains only the six universal categories; every moved item has a destination file.

### Phase 5: Group Detailed Instructions

Put detailed instructions under `docs/agent-instructions/`. Create only files that are relevant — no empty boilerplate.

Common topic files: `overview.md`, `build-system.md`, `development-workflow.md`, `testing.md`, `code-style.md`, `architecture.md`, `config-and-env.md`, `security.md`, `deployment.md`, `troubleshooting.md`. Use `references/agent-instructions-template.md` for the topic-file shape.

Grouping rules:

1. Each file has a clear task trigger in `Read When`.
2. Each file is self-contained for its topic.
3. Prefer 3–8 detailed files unless project complexity needs more.
4. Descriptive lowercase filenames.
5. Instructions are actionable and project-specific.
6. Link to a rule's home instead of restating it across files.
7. Reuse existing `docs/agent-instructions/` files when present.

**Completion:** every moved instruction lives in exactly one topic file; no rule duplicated across files.

### Phase 6: Build the Instruction Index

Root `AGENTS.md` includes an instruction index telling agents when to read each detailed file:

```markdown
## Instruction Index

Read these only when task matches scope:

| File | Read when | Contains |
|---|---|---|
| `docs/agent-instructions/testing.md` | You add/change tests or debug failures | Test commands, frameworks, patterns, fixtures |
| `docs/agent-instructions/architecture.md` | You change boundaries, data flow, APIs, storage, or module responsibilities | Components, dependencies, ownership |
```

The index points only to files under `docs/agent-instructions/`.

**Completion:** every `docs/agent-instructions/` file has one index row with a task-trigger `Read when`.

### Phase 7: Prune Low-Value Instructions

Apply the **load-bearing** test to each instruction. Delete or rewrite **no-op** instructions — see `references/prune-criteria.md` for the full criteria table and anti-patterns.

If pruning many instructions, report notable removals:

```markdown
## Flagged for Deletion

| Instruction | Reason |
|---|---|
| "Write clean, maintainable code" | no-op: too vague to change behavior |
```

**Completion:** every retained instruction passes the load-bearing test; flagged deletions reported.

## Root `AGENTS.md` Requirements

Root `AGENTS.md` includes: one-sentence project description, quick reference commands, mini repo map, instruction index table (`File`, `Read when`, `Contains`), and critical rules that apply to nearly every task.

It keeps out long coding standards, full architecture explanations, full testing strategy, deployment runbooks, framework tutorials, and detailed tool-specific instructions — all of those go under `docs/agent-instructions/`.

Use `references/agents-template.md` for the shape.

## Monorepo Handling

Use **docs-only** progressive disclosure for monorepos. No nested `AGENTS.md` files by default. Represent module/package information in the root `Mini Repo Map`, root `Instruction Index`, `docs/agent-instructions/architecture.md`, and other relevant topic files. Keep root module entries short; move detail to `architecture.md` or a dedicated `docs/agent-instructions/modules.md`.

## Skill References

Mention local skills only when they materially change agent behavior for this repo. Reference skills by name only — copy no skill instructions into `AGENTS.md` or `docs/agent-instructions/`. Reference a skill by local path only when that path is confirmed to exist.

## Verification

After creating or refactoring:

- [ ] Root `AGENTS.md` is concise and points to detailed docs.
- [ ] Root file includes quick commands, mini repo map, instruction index, and critical rules.
- [ ] Instruction index has `File`, `Read when`, and `Contains` columns, all pointing into `docs/agent-instructions/`.
- [ ] Detailed instructions live only under `docs/agent-instructions/` (nothing in `.pi/` or other tool-private locations).
- [ ] No nested `AGENTS.md` files unless the user explicitly approved.
- [ ] Commands are exact and current, or marked unknown.
- [ ] Root-to-docs links work.
- [ ] Contradictions are resolved or surfaced to the user.
- [ ] Every retained instruction is load-bearing; no-op instructions are pruned or rewritten.
