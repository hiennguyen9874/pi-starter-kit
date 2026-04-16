---
name: pragmatic-principles
description: Use when reviewing or implementing code where there is risk of over-engineering, unclear abstractions, or duplication. Apply pragmatic YAGNI, KISS, and DRY checks to keep changes simple, maintainable, and aligned with current requirements.
---

# Pragmatic Principles

Use this skill to make practical implementation decisions during code review or feature work.

## When to Use

- Requirements are growing beyond the current task.
- A change introduces extra abstractions "for future use."
- Logic is hard to understand, hard to test, or duplicated.
- You need a fast quality pass focused on maintainability.

## Decision Flow

1. Run YAGNI checks first: remove speculative code and premature optimization.
2. Run KISS checks next: reduce cognitive load and unnecessary complexity.
3. Run DRY checks last: extract only proven duplication (prefer rule-of-three).
4. Apply pragmatic tradeoffs: readability over cleverness, explicit behavior over hidden magic.

## Reference Loading

Load only the files needed for the current review focus:

- `references/yagni.md` for speculative code and feature creep checks
- `references/kiss.md` for simplicity and readability checks
- `references/dry.md` for duplication and abstraction timing checks
- `references/pragmatic-heuristics.md` for cross-cutting pragmatic rules

## Expected Output

When reviewing, report findings in this order:

1. Requirement mismatches (YAGNI violations)
2. Unnecessary complexity (KISS violations)
3. Harmful duplication (DRY violations)
4. Recommended minimal refactors with reasoning

Keep recommendations incremental and grounded in current requirements.
