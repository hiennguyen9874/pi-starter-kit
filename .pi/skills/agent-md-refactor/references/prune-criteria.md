# Prune Criteria

Reference for Phase 7 of `agent-md-refactor`: the **load-bearing** test and the **no-op** patterns to delete or rewrite. Every retained instruction must be load-bearing — prevent a specific mistake, reveal non-obvious project behavior, give an exact command, or override a default that would be wrong for this repo.

## Prune table

| Criterion | Example | Action |
|---|---|---|
| Vague | "Write clean code" | Delete or replace with a concrete rule |
| Default behavior | "Do not introduce bugs" | Delete |
| Redundant | "Use TypeScript" in a TS-only repo | Delete unless a non-obvious constraint exists |
| Outdated | Deprecated command or path | Correct or delete |
| Tool-private detail | Detailed docs in `.pi/` | Move to `docs/agent-instructions/` |
| Not actionable | "Be thoughtful" | Delete |

## Anti-patterns

| Avoid | Why | Use instead |
|---|---|---|
| Long root `AGENTS.md` | Wastes always-loaded context | Root summary plus instruction index |
| Detailed docs in `.pi/` | Tool-private, not shared | `docs/agent-instructions/` |
| Nested `AGENTS.md` by default | Conflicts with docs-only model | Root mini map plus detailed docs |
| Many empty topic files | Creates maintenance noise | Only create relevant files |
| Vague rules | No operational value | Specific commands, paths, and rules |
| Duplicating defaults | Wastes context | Only project-specific overrides |
| Untested invented commands | Breaks agent workflows | Infer from repo files or mark unknown |

## Good vs. bad

Good instructions are project-specific, actionable, and tied to exact commands, paths, conventions, or non-obvious constraints. Bad instructions are vague, generic, obvious from the codebase, stale, or default behavior an agent already follows.
