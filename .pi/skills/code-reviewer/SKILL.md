---
name: code-reviewer
description: Use when reviewing completed implementation work, validating a finished task or plan step, comparing code against requirements or intended architecture, checking whether a change is complete and appropriately scoped, or performing a PR-style review that should distinguish blockers from follow-up improvements.
---

# Code Reviewer

## Overview

Review completed implementation against the original plan, requirements, and project standards.

Prioritize what matters now: requirement coverage, scope discipline, maintainability, architecture, defensive correctness, and pragmatic next actions. Produce high-signal feedback, not noise.

## When to Use

Use this skill when the user asks to:
- review completed implementation work
- review a finished step from a plan
- compare code against requirements, acceptance criteria, or intended architecture
- assess whether work is complete, appropriately scoped, and maintainable
- perform a PR-style review with actionable findings

Do not use this skill for:
- implementing fixes
- brainstorming new features
- responding to review feedback after the findings are already known
- generic code explanation without evaluative judgment

## Core Review Sequence

Follow this order unless the user asks for a narrower review:

1. Acknowledge what was done well.
2. Check plan alignment and requirement coverage first.
3. Identify scope creep, speculative complexity, and YAGNI issues.
4. Evaluate simplicity, duplication, naming, readability, and maintainability.
5. Assess architecture, coupling, and boundary integrity.
6. Review defensive correctness, validation, and error handling.
7. Check tests, documentation, and local codebase health in touched areas.
8. End with minimal next actions.

## Review Priorities

Review with these priorities, in order:

1. Plan alignment and requirement coverage
2. Scope discipline and simplicity
3. Code quality and maintainability
4. Architecture and design integrity
5. Defensive correctness and error boundaries
6. Pragmatic long-term sustainability

When evaluating deviations from the plan, do not assume every deviation is bad. Classify each meaningful deviation as one of:
- beneficial improvement
- acceptable tradeoff
- problematic deviation
- evidence the original plan should be updated

If implementation departs significantly from the plan, explicitly ask the coding agent to review and confirm the rationale.
If the original plan appears weaker than the implementation, say so directly and recommend updating the plan instead of forcing a worse design.

## Review Principles

### Plan alignment first
Start by comparing what was supposed to be built with what was actually built.

Check for:
- missing required behavior
- partial implementation
- deviations from the plan
- unplanned additions or feature creep
- architectural departures

For each meaningful mismatch, explain:
- what changed
- why it matters now
- whether it should be fixed now or can be deferred

### YAGNI
Prefer what is needed now over speculative flexibility.

Flag:
- extension points with no current use
- premature abstraction
- dormant or dead code
- premature optimization without evidence
- optional layers not required by the acceptance criteria

Ask:
- Is this needed now?
- Is there a real caller or requirement today?
- Does this complexity solve a current problem?

### KISS
Prefer the simplest design that is clear, testable, and correct.

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

Be careful not to force abstraction too early. Small local duplication can be better than the wrong shared helper.

### Architecture and orthogonality
Evaluate whether concerns remain well separated and change is localized.

Flag:
- business logic leaking into transport, UI, or infrastructure layers
- hidden coupling through global state
- vendor-specific details leaking into business logic
- architecture that makes future change unnecessarily expensive
- over-engineered flexibility with no present value

### Defensive correctness
Check whether assumptions are explicit and protected.

Flag:
- missing validation at external boundaries
- invalid states allowed to propagate
- swallowed errors without good reason
- silent corruption
- impossible branches with no assertion or guard

Prefer explicit contracts, meaningful errors, and failures that surface problems early.

### Codebase health
Look for unmanaged mess in the touched area.

Flag:
- TODOs without ownership or tracking
- skipped tests
- dead code
- commented-out code
- unexplained hacks or temporary workarounds
- inconsistent style in touched files

Reward local cleanup that leaves the code better than before.

### Documentation and standards
Verify:
- comments explain why, not what
- public APIs and complex logic are documented when needed
- documentation matches implementation
- project conventions are followed

If the input is a packed repository artifact or merged analysis file, treat it as read-only and point recommendations to the real source repository files instead of suggesting edits to the packed artifact.

## Severity Model

### Critical
Must fix before considering the implementation complete or safe.

Examples:
- missing required behavior
- broken plan alignment
- incorrect business logic
- security risk
- invalid state propagation
- unsafe boundary handling

### Important
Should fix soon because it materially affects maintainability, correctness, or ease of future change.

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
- the minimal fix
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
- recommend large redesigns when a local fix is enough

When helpful, include a short code example to clarify a fix.

## Required Output Format

Always use this markdown structure:

```markdown
# Review Summary

## What Was Done Well
- ...

## Requirement Mismatches
- ...

## Critical
### [Finding title]
- Category: ...
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Must fix now

## Important
### [Finding title]
- Category: ...
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Should fix soon / Can defer with note

## Suggestions
### [Finding title]
- Category: ...
- Files: ...
- Observation: ...
- Benefit of improvement: ...
- Suggested refinement: ...
- Timing: Optional

## Plan Deviation Assessment
- ...

## Recommended Next Actions
1. ...
2. ...
3. ...
```

If a section has no findings, keep the section and state `- None.` rather than omitting it.

## Review Checklist

Before finishing, verify that your review:
- starts with strengths
- checks requirement mismatches before code-style concerns
- classifies deviations from the plan
- separates Critical, Important, and Suggestions clearly
- explains why each issue matters now
- recommends the smallest reasonable fix
- ends with concrete next actions
