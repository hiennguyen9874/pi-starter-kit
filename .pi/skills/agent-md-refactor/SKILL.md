---
name: agent-md-refactor
description: Use when creating or refactoring standard Markdown AGENTS.md, CLAUDE.md, COPILOT.md, or other agent instruction files; when root agent instructions are missing, bloated, contradictory, tool-private, generic, or need docs-only progressive disclosure under docs/agent-instructions/.
---

# Agent MD Refactor

Create or refactor standard Markdown agent instruction files using docs-only progressive disclosure.

## Non-Negotiable Output Model

Detailed project instructions must live under `docs/agent-instructions/`.

Root agent files (`AGENTS.md`, `CLAUDE.md`, `COPILOT.md`, etc.) may exist at repository root, but must stay concise and link to files under `docs/agent-instructions/`.

Do not create detailed instruction files under:

- `.claude/`
- `.pi/`
- `.codex/`
- `.cursor/`
- other tool-private directories

Do not create nested `AGENTS.md` files by default. If user explicitly asks for nested files, explain that this skill's default is docs-only and ask before deviating.

Use standard Markdown only. If an existing instruction file uses custom tag-only or plain-text syntax, preserve it unless the user explicitly asks to convert it.

## Supported Workflows

Use this skill to:

- Create a missing root `AGENTS.md`.
- Refactor bloated `AGENTS.md`, `CLAUDE.md`, `COPILOT.md`, or similar files.
- Merge tool-specific custom instructions into shared Markdown docs under `docs/agent-instructions/`.
- Review existing agent instructions for contradictions, stale claims, tool-private details, and low-value rules.

Do not use this skill for git-diff sync audits unless the user explicitly asks for a manual review of current instruction files.

## Core Principle

Every retained instruction must change agent behavior.

Keep instructions that prevent a specific mistake, reveal non-obvious project behavior, provide exact commands, or override a default assumption that would be wrong for this repository.

Remove or rewrite instructions that are vague, generic, redundant, obvious from the codebase, outdated, or not actionable.

## Process

### Phase 1: Analyze Repository

Inspect project files to identify:

- repository purpose and shape
- languages and frameworks
- package manager and dependency commands
- build, run, lint, format, typecheck, and test commands
- CI/CD workflows
- architecture docs
- current README and developer docs
- current agent instruction files
- major directories and module boundaries

Common files to check:

- `README.md`
- `AGENTS.md`, `CLAUDE.md`, `COPILOT.md`, `.cursorrules`, etc.
- `package.json`, `pnpm-workspace.yaml`, `yarn.lock`, `package-lock.json`
- `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`
- `Makefile`, `justfile`, build scripts
- `.github/workflows/`, `.gitlab-ci.yml`
- Dockerfiles and compose files
- existing docs under `docs/`

Never invent commands. Infer commands from repo files. If a command is unclear, write `Unknown; see <file>` or ask the user.

### Phase 2: Analyze Existing Instruction Files

Read existing agent instruction files fully before editing.

Identify:

- instructions that belong in root
- detailed instructions that should move to `docs/agent-instructions/`
- repeated or contradictory rules
- stale commands or paths
- tool-private detailed docs that should move into shared docs
- custom syntax that should be preserved or confirmed before conversion

### Phase 3: Find Contradictions

Identify conflicting instructions before editing.

Look for:

- contradictory style guidelines
- conflicting workflow instructions
- incompatible tool preferences
- commands contradicted by current scripts
- different locations for same detailed guidance

For each contradiction, ask the user to resolve before proceeding:

```markdown
## Contradiction Found

**Instruction A:** [quote]
**Instruction B:** [quote]

**Question:** Which should take precedence, or should both be conditional?
```

### Phase 4: Separate Root Essentials From Details

Root file keeps only information useful for nearly every agent task.

Keep in root:

| Category | Example |
|---|---|
| Project description | One sentence explaining repository purpose |
| Quick commands | Install, run, test, build, full checks |
| Mini repo map | Top-level paths and short purpose |
| Instruction index | Links into `docs/agent-instructions/` with read triggers |
| Critical rules | Universal high-priority rules |
| Non-obvious setup | Required runtime, container, service, or package-manager constraints |

Move out of root:

- language-specific conventions
- testing strategy details
- code style details
- architecture deep dives
- deployment process
- debugging notes
- git workflow details
- framework patterns
- long examples

Use `references/agents-template.md` for the root file shape.

### Phase 5: Group Detailed Instructions

Put detailed instructions under `docs/agent-instructions/`.

Create only files that are relevant. Do not create empty boilerplate files.

Common topic files:

| File | Use for |
|---|---|
| `overview.md` | Project purpose, domain, responsibilities |
| `build-system.md` | Install, build, run, package, generated outputs |
| `development-workflow.md` | Local loop, checks, PR expectations, common tasks |
| `testing.md` | Test commands, frameworks, patterns, fixtures, coverage |
| `code-style.md` | Project-specific formatting, naming, imports, structure |
| `architecture.md` | Components, boundaries, dependencies, data flow |
| `config-and-env.md` | Configuration files, env vars, local services |
| `security.md` | Secrets, auth, permissions, validation, network safety |
| `deployment.md` | CI/CD, packaging, release, environments |
| `troubleshooting.md` | Known failures and fixes |

Use `references/agent-instructions-template.md` for detailed docs.

Grouping rules:

1. Each file has a clear task trigger in `Read When`.
2. Each file is self-contained for its topic.
3. Prefer 3-8 detailed files unless project complexity needs more.
4. Use descriptive lowercase filenames.
5. Keep instructions actionable and project-specific.
6. Avoid duplicating the same rule across files; link instead.
7. Reuse existing `docs/agent-instructions/` files when present instead of creating duplicates.

### Phase 6: Build the Instruction Index

Root `AGENTS.md` must include an instruction index that tells agents when to read each detailed file.

Use this shape:

```markdown
## Instruction Index

Read these only when task matches scope:

| File | Read when | Contains |
|---|---|---|
| `docs/agent-instructions/testing.md` | You add/change tests or debug failures | Test commands, frameworks, patterns, fixtures |
| `docs/agent-instructions/architecture.md` | You change boundaries, data flow, APIs, storage, or module responsibilities | Components, dependencies, ownership |
```

The index must point only to files under `docs/agent-instructions/`.

### Phase 7: Prune Low-Value Instructions

Delete or rewrite instructions when:

| Criterion | Example | Action |
|---|---|---|
| Vague | "Write clean code" | Delete or replace with concrete rule |
| Default behavior | "Do not introduce bugs" | Delete |
| Redundant | "Use TypeScript" in TS-only repo | Delete unless non-obvious constraint exists |
| Outdated | Deprecated command or path | Correct or delete |
| Tool-private detail | Detailed docs in `.claude/` | Move to `docs/agent-instructions/` |
| Not actionable | "Be thoughtful" | Delete |

If pruning many instructions, report notable removals:

```markdown
## Flagged for Deletion

| Instruction | Reason |
|---|---|
| "Write clean, maintainable code" | Too vague to change behavior |
```

## Root `AGENTS.md` Requirements

Root `AGENTS.md` must include:

- one-sentence project description
- quick reference commands
- mini repo map
- instruction index table with `File`, `Read when`, and `Contains`
- critical rules that apply to nearly every task

Root `AGENTS.md` must not include:

- long coding standards
- full architecture explanations
- full testing strategy
- deployment runbooks
- framework tutorials
- detailed tool-specific instructions

## Detailed Instruction File Requirements

Each file under `docs/agent-instructions/` should include:

- `Read When` — task triggers for loading this file
- `Purpose` — what the file helps the agent do
- `Rules` — project-specific actionable rules
- `Commands` — exact commands when relevant
- `Key Paths` — exact paths when relevant
- `Gotchas` — non-obvious failure modes
- `Related Instructions` — links to adjacent topic files when useful

Omit sections that do not apply.

## Monorepo Handling

Use docs-only progressive disclosure for monorepos.

Do not create nested `AGENTS.md` files by default.

Represent module/package information in:

- root `Mini Repo Map`
- root `Instruction Index`
- `docs/agent-instructions/architecture.md`
- `docs/agent-instructions/build-system.md`
- other relevant topic files

For module maps, keep root entries short and move detail to `docs/agent-instructions/architecture.md` or a dedicated topic file such as `docs/agent-instructions/modules.md`.

## Skill References

If the project uses local skills, mention them only when they materially change agent behavior for this repo.

Do not copy full skill instructions into `AGENTS.md` or `docs/agent-instructions/`.

Do not assume a local skill directory exists. If referencing a skill and no local path is clear, reference it by name only.

## Verification Checklist

After creating or refactoring:

- [ ] Root agent file is concise and mostly points to detailed docs.
- [ ] Root file includes quick commands, mini repo map, instruction index, and critical rules.
- [ ] Instruction index has `File`, `Read when`, and `Contains` columns.
- [ ] Detailed instructions live under `docs/agent-instructions/`.
- [ ] No detailed instruction files were created under `.claude/`, `.pi/`, `.codex/`, `.cursor/`, or another tool-private folder.
- [ ] No nested `AGENTS.md` files were created by default.
- [ ] Commands are exact and current, or marked unknown.
- [ ] Links from root to detailed docs work.
- [ ] Contradictions are resolved or surfaced to the user.
- [ ] Every retained instruction is actionable, project-specific, and changes agent behavior.
- [ ] Low-value generic instructions are pruned or rewritten.

## Anti-Patterns

| Avoid | Why | Use instead |
|---|---|---|
| Long root `AGENTS.md` | Wastes always-loaded context | Root summary plus instruction index |
| Detailed docs in `.claude/` | Tool-private and not shared | `docs/agent-instructions/` |
| Detailed docs in `.pi/skills/` | Skills teach workflow, not project docs | `docs/agent-instructions/` |
| Nested `AGENTS.md` by default | Conflicts with docs-only model | Root mini map plus detailed docs |
| Many empty topic files | Creates maintenance noise | Only create relevant files |
| Vague rules | No operational value | Specific commands, paths, and rules |
| Duplicating defaults | Wastes context | Only project-specific overrides |
| Untested invented commands | Breaks agent workflows | Infer from repo files or mark unknown |
