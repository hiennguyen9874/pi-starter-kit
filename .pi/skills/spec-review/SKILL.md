---
name: spec-review
description: Use when validating whether completed implementation matches a user request, plan, spec, acceptance criteria, intended architecture, or task scope before judging general code quality.
---

# Spec Review

## Purpose

Determine whether the implementation built the right thing.

Spec review comes before code quality review. Missing required behavior, contradicted requirements, or unapproved scope changes are more important than style or cleanup concerns.

## When to Use

Use this skill when asked to:
- compare implementation against a plan, spec, PRD, issue, or acceptance criteria
- validate whether a completed task is actually done
- check for missing required behavior or unplanned additions
- review whether tests cover the intended behavior
- decide whether an implementation deviation is acceptable or the plan should change

Do not use this skill for:
- general code quality review after spec alignment is already known
- implementation work
- generic code explanation without evaluative judgment
- responding to review feedback after findings are already known

## Review Inputs

Establish the review basis before judging the diff:
- original user request or issue
- plan, spec, acceptance criteria, or intended architecture
- claimed implementation summary
- changed files or diff
- tests and verification evidence

If the spec or expected behavior is missing and cannot be inferred from repository context, ask one focused clarification question before issuing final findings.

## Review Process

1. Identify what the change was supposed to accomplish.
2. Inspect tests first when available; tests reveal intent and coverage gaps.
3. Compare implemented behavior against each requirement or plan step.
4. Identify missing scope, added scope, contradicted requirements, and architecture deviations.
5. Classify each meaningful deviation.
6. Decide whether the implementation should change or the plan/spec should be updated.

## What to Check

### Requirement Coverage

Flag:
- missing required behavior
- partial implementation
- behavior that contradicts requirements
- acceptance criteria not exercised by tests
- tests that assert implementation details instead of required behavior

### Plan and Architecture Alignment

Flag:
- implementation that skips planned steps without rationale
- architecture that departs from the intended design
- business logic placed in the wrong layer relative to the plan
- incompatible changes to public behavior or contracts

If implementation departs significantly from the plan, explicitly ask for or note the rationale.
If the implementation is clearly better than the original plan, say so and recommend updating the plan instead of forcing worse design.

### Scope Discipline

Flag:
- feature creep not requested by the spec
- cleanup mixed into feature work without need
- refactors that make the change harder to verify
- dead or placeholder work that claims completion without behavior

### Verification Alignment

Check:
- tests cover required behavior and edge cases
- bug fixes include regression coverage when practical
- manual verification matches the user-visible requirement
- build/lint/typecheck results are documented when relevant

## Deviation Classification

Classify each meaningful deviation as one of:
- beneficial improvement
- acceptable tradeoff
- problematic deviation
- evidence the original plan should be updated

For every finding, explain:
- what changed or is missing
- why it matters now
- minimal fix or plan update
- whether it blocks completion

## Severity Model

### Critical

Must fix before implementation is complete.

Examples:
- missing required behavior
- contradicted acceptance criteria
- broken plan alignment with user-visible impact
- untested critical behavior
- incompatible contract change

### Important

Should fix soon or explicitly defer with rationale.

Examples:
- partial coverage of a requirement
- undocumented plan deviation with moderate risk
- weak tests around changed behavior
- scope creep that increases review or maintenance cost

### Suggestions

Useful but optional refinements.

Examples:
- clearer requirement mapping in tests
- minor description or documentation improvement
- low-risk scope cleanup

## Required Output Format

Always use this structure:

```markdown
# Spec Review Summary

## What Was Done Well
- ...

## Requirement Mismatches
### Critical
#### [Finding title]
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Must fix now

### Important
- ...

### Suggestions
- ...

## Plan Deviations
- ...

## Scope Creep / Missing Scope
- ...

## Tests and Verification
- ...

## Verdict
- Pass / Request changes / Needs clarification

## Recommended Next Actions
1. ...
2. ...
3. ...
```

If a section has no findings, keep the section and write `- None.`.

## Review Checklist

Before finishing, verify the review:
- starts with strengths
- compares against requirements before implementation style
- separates missing scope from added scope
- classifies deviations clearly
- explains why each issue matters now
- recommends the smallest reasonable fix or plan update
- gives a clear verdict
