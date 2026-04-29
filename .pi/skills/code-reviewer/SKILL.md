---
name: code-reviewer
description: "Use when reviewing completed implementation work, validating a finished task or plan step, comparing code against requirements or intended architecture, or performing a PR-style review. Reviews must run in two phases: spec alignment first, code quality second."
---

# Code Reviewer

## Overview

Review completed implementation in two phases:

1. **Spec Review**: Does code match plan, requirements, acceptance criteria, and intended architecture?
2. **Code Quality Review**: Is code correct, maintainable, testable, simple, and well-bounded?

Spec alignment always comes first. Missing required behavior beats style and cleanup concerns.

## When to Use

Use this skill when user asks to:
- review completed implementation work
- review a finished step from a plan
- compare code against requirements, acceptance criteria, or intended architecture
- assess whether work is complete, appropriately scoped, and maintainable
- perform a PR-style review with actionable findings

Do not use this skill for:
- implementing fixes
- brainstorming new features
- responding to review feedback after findings are already known
- generic code explanation without evaluative judgment

## Two-Phase Review Sequence

### Phase 1: Spec Review

Goal: verify implementation matches requested behavior and plan.

Check for:
- missing required behavior
- partial implementation
- contradicted requirements
- unplanned additions or feature creep
- architectural departures from plan
- tests missing for required behavior

Classify each meaningful deviation as:
- beneficial improvement
- acceptable tradeoff
- problematic deviation
- evidence original plan should be updated

If implementation departs significantly from plan, explicitly ask coding agent to confirm rationale.
If original plan appears weaker than implementation, say so and recommend updating plan instead of forcing worse design.

### Phase 2: Code Quality Review

Goal: verify implementation quality after spec alignment is understood.

Check for:
- correctness and edge cases
- validation and defensive boundaries
- error handling
- maintainability, naming, readability
- architecture boundaries and coupling
- tests and verification strength
- security or performance risks with current impact
- YAGNI, KISS, and pragmatic DRY

Do not let optional quality improvements obscure spec blockers.

## Review Priorities

1. Requirement coverage and plan alignment
2. Scope discipline and missing scope
3. Correctness and defensive boundaries
4. Tests and verification
5. Maintainability and simplicity
6. Architecture/design integrity
7. Pragmatic long-term sustainability

## Review Principles

### Plan alignment first

Start by comparing what was supposed to be built with what was actually built.

For each mismatch, explain:
- what changed
- why it matters now
- whether it must be fixed now or can be deferred

### YAGNI

Flag:
- extension points with no current use
- premature abstraction
- dormant or dead code
- premature optimization without evidence
- optional layers not required by acceptance criteria

Ask:
- Is this needed now?
- Is there a real caller or requirement today?
- Does this complexity solve a current problem?

### KISS

Flag:
- deep nesting
- over-complicated control flow
- hidden side effects
- clever but hard-to-read code
- mixed responsibilities
- unnecessary framework or pattern usage

Prefer readability over cleverness and explicit logic over hidden magic.

### DRY, applied pragmatically

Treat DRY as duplicated knowledge, not merely similar syntax.

Flag:
- duplicated business rules
- duplicated validation that must stay aligned
- repeated literals or constants with drift risk
- copy-paste logic where one change must imply another

Small local duplication can be better than wrong shared abstraction.

### Architecture and orthogonality

Flag:
- business logic leaking into transport, UI, or infrastructure layers
- hidden coupling through global state
- vendor-specific details leaking into business logic
- architecture that makes current or near-term change unnecessarily expensive
- over-engineered flexibility with no present value

### Defensive correctness

Flag:
- missing validation at external boundaries
- invalid states allowed to propagate
- swallowed errors without good reason
- silent corruption
- impossible branches with no assertion or guard

Prefer explicit contracts, meaningful errors, and failures that surface problems early.

### Documentation and standards

Verify:
- comments explain why, not what
- public APIs and complex logic are documented when needed
- documentation matches implementation
- project conventions are followed

If input is packed repository artifact or merged analysis file, treat it as read-only and point recommendations to real source repository files.

## Severity Model

### Critical

Must fix before implementation is complete or safe.

Examples:
- missing required behavior
- broken plan alignment
- incorrect business logic
- security risk
- invalid state propagation
- unsafe boundary handling

### Important

Should fix soon because it materially affects maintainability, correctness, or future change.

Examples:
- unnecessary coupling
- fragile design
- moderate complexity with real cost
- weak tests around changed behavior
- repeated logic with meaningful drift risk

### Suggestions

Useful improvements that can be deferred.

Examples:
- small cleanup
- readability refinement
- low-risk refactor
- documentation polish

## Feedback Contract

For every meaningful finding, include:
- what is wrong
- why it matters now
- minimal fix
- whether it must be fixed now or can be deferred

Also:
- acknowledge strengths first
- distinguish blockers from improvements
- prefer minimal actionable fixes over redesign
- stay grounded in current requirements
- distinguish style preference from correctness or maintainability issues

Do not:
- nitpick without impact
- demand speculative refactors
- optimize for theoretical purity over delivery
- confuse similar-looking code with duplicated knowledge
- recommend large redesigns when local fix is enough

## Required Output Format

Always use this markdown structure:

```markdown
# Review Summary

## What Was Done Well
- ...

## Phase 1: Spec Alignment
### Requirement Mismatches
- ...

### Plan Deviations
- ...

### Scope Creep / Missing Scope
- ...

## Phase 2: Code Quality
### Critical
#### [Finding title]
- Category: ...
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Must fix now

### Important
#### [Finding title]
- Category: ...
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Should fix soon / Can defer with note

### Suggestions
#### [Finding title]
- Category: ...
- Files: ...
- Observation: ...
- Benefit of improvement: ...
- Suggested refinement: ...
- Timing: Optional

## Tests and Verification
- ...

## Consolidated Findings
### Critical
- ...

### Important
- ...

### Suggestions
- ...

## Recommended Next Actions
1. ...
2. ...
3. ...
```

If section has no findings, keep section and state `- None.`.

## Review Checklist

Before finishing, verify review:
- starts with strengths
- checks requirement mismatches before code-style concerns
- classifies deviations from plan
- separates Critical, Important, and Suggestions clearly
- explains why each issue matters now
- recommends smallest reasonable fix
- ends with concrete next actions
