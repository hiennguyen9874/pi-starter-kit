---
name: subagent-driven-development
description: Use when executing a written plan folder in the current session with one implementer subagent per phase, followed by independent spec and code-quality review for each phase
---

# Subagent-Driven Development

Execute a plan folder by dispatching one fresh implementer subagent per phase, then reviewing the full phase implementation in two stages: spec compliance first, code quality second.

**Core principle:** one phase implementer + phase-level spec review + phase-level quality review = isolated execution with strong checkpoints.

## When to Use

Use this skill when:

- User wants to execute a written implementation plan with subagents.
- Plan is organized as a folder with `design.md`, `plan.md`, and `phase-x.md` files.
- One implementer can own an entire phase without another writer editing code at the same time.
- Current session should orchestrate the work instead of handing off to a separate session.

Do not use this skill when:

- There is no written plan or phase structure yet.
- Multiple implementation writers need to edit in parallel.
- User only wants a single manual phase executed without subagent orchestration; use `executing-plans` instead.

## Phase-Level Process

1. Resolve the plan folder.
2. Read `design.md`, `plan.md`, and phase file names/links.
3. Determine the starting phase: user-specified phase or first incomplete phase.
4. Review the full plan critically before coding.
5. Stop and ask if the plan has critical ambiguity, plan/code conflict, missing decision, or high-stakes product/API/schema/security choice.
6. Extract all remaining phase paths, dependencies, and phase verification commands.
7. Track remaining phases in a checklist.
8. For each phase in dependency order:
   - dispatch exactly one implementer subagent for the whole phase
   - provide plan folder path, `design.md`, `plan.md`, and assigned `phase-x.md` path
   - provide prior phase context, constraints, dependencies, verification commands, and non-goals
   - instruct implementer to read those files before implementing
   - require every task and checkbox in the phase to be completed
   - require TDD when behavior changes and a practical test seam exists
   - require changed files, verification evidence, self-review, and risks
9. After implementer reports back:
   - run spec reviewer over the full phase implementation
   - if spec issues exist, return issues to the same phase implementer and re-review the full phase
   - run code-quality reviewer only after spec alignment passes or user explicitly defers spec issues
   - if quality issues exist, return issues to the same phase implementer and re-review the full phase
   - run phase verification command(s)
   - mark phase complete only when issues are fixed or explicitly deferred
10. Continue until all phases complete or blocker requires user input.
11. After all phases, run final two-stage review across the full implementation and full verification if specified.
12. Report phases executed, changed files, verification evidence, review verdicts, risks, and deferred issues.

## Hard Rules

- Implement at phase granularity only: one implementer owns one whole phase.
- Do not review after each task inside a phase; review after the whole phase is implemented.
- Only one implementation writer may edit code at a time.
- Parallel subagents are allowed only for reading, research, review, or independent diagnosis.
- Follow each phase unless code proves the plan wrong.
- If phase conflicts with codebase, stop and explain the conflict.
- Do not silently change architecture, APIs, schemas, security posture, or public behavior.
- Do not add speculative features.
- Do not let implementer self-review replace independent review.
- Do not start code-quality review before spec review passes unless user explicitly defers spec issues.
- Do not move to next phase while required review fixes remain open.
- Do not use `finishing-a-development-branch` until all phases are complete, tests pass, and user explicitly asks to finish.

## Commit Policy

Commit behavior is controlled by the active prompt or explicit user instruction.

- Implementer subagents do not commit unless explicitly instructed.
- Orchestrator may commit after an approved phase when the active prompt requires it.
- Committing a phase is not branch finishing.

## Implementer Status Handling

**DONE:** Proceed to spec review.

**DONE_WITH_CONCERNS:** Read concerns before review. If concerns affect correctness, scope, or plan alignment, address them before review.

**NEEDS_CONTEXT:** Provide missing context and re-dispatch the same phase implementer.

**BLOCKED:** Assess the blocker:
1. Context missing → provide more context and re-dispatch.
2. Reasoning/model limit → re-dispatch with stronger model.
3. Phase too large → stop and ask before splitting.
4. Plan wrong → stop and ask user.

Never force identical retry after a blocker without changing context, model, or scope.

## Prompt Templates

- `./implementer-prompt.md` — phase implementer dispatch template
- `./spec-reviewer-prompt.md` — spec compliance review template
- `./code-quality-reviewer-prompt.md` — code quality review template

## Phase Implementer Dispatch Contract

Give implementer:

- Plan folder path
- Phase name and number
- `design.md` path
- `plan.md` path
- Assigned `phase-x.md` path
- Prior completed phase context
- Dependencies, constraints, orchestration notes, and non-goals
- Verification command(s), if known
- Explicit instruction to read plan files before implementing

## Quality Gates

- Self-review catches issues before handoff.
- Spec review prevents missing scope, extra scope, and plan drift.
- Code-quality review checks correctness, maintainability, tests, and pragmatic design.
- Review loops ensure fixes are re-checked.
- Verification evidence is required before completion claims.

## Integration

**Required workflow skills:**
- **writing-plans** — creates plan folders this skill executes
- **code-reviewer** — review standard for spec and quality reviewers
- **finishing-a-development-branch** — only after all phases are done, tests pass, and user explicitly asks

**Subagents should use:**
- **test-driven-development** — when behavior changes and a practical test seam exists
- **pragmatic-principles** — to avoid overbuilding during implementation and review
