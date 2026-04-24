# Agent MD Refactor

Skill for creating or refactoring standard Markdown agent instruction files using docs-only progressive disclosure.

## Purpose

Agent instruction files like `AGENTS.md`, `CLAUDE.md`, and `COPILOT.md` often grow into large, mixed documents. That creates:

- context waste from always-loaded details
- stale or contradictory instructions
- duplicated tool-specific guidance
- vague rules that do not change agent behavior
- hard-to-find commands and project conventions

This skill keeps root instruction files concise and moves detailed project guidance into shared Markdown files under `docs/agent-instructions/`.

## Output Model

The skill enforces this structure:

```text
project-root/
├── AGENTS.md
└── docs/
    └── agent-instructions/
        ├── overview.md
        ├── build-system.md
        ├── testing.md
        ├── architecture.md
        └── ...
```

Root files may include:

- one-sentence project description
- quick commands
- mini repo map
- instruction index
- critical universal rules

Detailed files under `docs/agent-instructions/` include topic-specific guidance.

## Location Rules

Detailed project instructions must live under `docs/agent-instructions/`.

Do not create detailed instruction files under:

- `.claude/`
- `.pi/`
- `.codex/`
- `.cursor/`
- other tool-private directories

Do not create nested `AGENTS.md` files by default. Represent module information through the root mini repo map and detailed docs under `docs/agent-instructions/`.

## When to Use

Use this skill when:

- `AGENTS.md` is missing
- root agent instructions are too long
- `CLAUDE.md`, `COPILOT.md`, or custom instructions need to become shared guidance
- instructions contain contradictions
- detailed docs are stored in tool-private folders
- rules are generic, stale, or not actionable

Common requests:

- "create AGENTS.md"
- "refactor my AGENTS.md"
- "split my CLAUDE.md"
- "organize agent instructions"
- "move custom instructions into docs"
- "clean up agent context"

## Templates

Reference templates live in:

- `references/agents-template.md` — root `AGENTS.md` shape
- `references/agent-instructions-template.md` — topic file shape for `docs/agent-instructions/`

## Key Standard

Every retained instruction must change agent behavior.

Good instructions are project-specific, actionable, and tied to exact commands, paths, conventions, or non-obvious constraints.

Bad instructions are vague, generic, obvious from the codebase, stale, or default behavior an agent already follows.
