---
name: code-quality-review
description: Use when reviewing implementation quality after spec alignment is known, especially before merge, after bug fixes or refactors, or when assessing correctness, maintainability, tests, security, performance, dependencies, and code health.
---

# Code Quality Review

## Purpose

Determine whether the implementation built the thing well.

Use this after spec review, or when the user explicitly says the implementation already matches the spec and wants quality review only.

## When to Use

Use this skill when asked to:
- review code quality before merge
- assess code written by an agent, human, or yourself
- review a refactor or bug fix for maintainability and correctness
- evaluate tests, verification, security, performance, or dependency choices
- perform a PR-style implementation-quality review

Do not use this skill for:
- deciding whether the implementation matches an unknown spec
- rewriting or fixing code unless explicitly asked after the review
- generic explanation without evaluative judgment
- speculative architecture redesign unrelated to the current change

## Approval Standard

Approve when the change improves overall code health and has no blocking correctness, safety, or maintainability issues. Do not block because the code differs from personal preference.

Do not rubber-stamp. Tests passing is necessary but not sufficient.

## Review Process

1. Confirm spec alignment is already known, or state that spec review is needed first.
2. Inspect tests before implementation when available.
3. Review implementation across the quality axes below.
4. Identify dead code, dependency risk, and verification gaps introduced by the change.
5. Classify findings by severity and required action.
6. Recommend the smallest reasonable fix.

## Quality Axes

### 1. Correctness and Defensive Boundaries

Check:
- edge cases: null, empty, boundary values, malformed input
- error paths, not only happy paths
- race conditions, off-by-one errors, state inconsistencies
- validation at external boundaries
- invalid states prevented from propagating
- errors surfaced instead of swallowed

### 2. Tests and Verification

Check:
- tests cover behavior, not only implementation details
- bug fixes include regression tests when practical
- tests would fail if the reviewed bug or invariant returns
- verification commands are documented
- manual checks are included for UI or integration behavior when needed

### 3. Readability and Simplicity

Flag:
- unclear names or names inconsistent with project conventions
- clever code that should be straightforward
- deep nesting or complicated control flow
- hidden side effects
- mixed responsibilities
- comments that explain obvious code instead of non-obvious intent

Apply KISS: prefer readable, explicit logic over hidden magic.

### 4. Architecture and Maintainability

Check:
- implementation follows existing local patterns
- module boundaries stay clean
- dependencies flow in the right direction
- business logic does not leak into transport, UI, or infrastructure layers
- abstractions earn their complexity
- code is not over-coupled to vendors or globals without need

Apply YAGNI: flag extension points, dormant code, premature abstraction, or optimization that has no current requirement.

Apply pragmatic DRY: duplicated knowledge is a problem; small local duplication can be better than the wrong shared abstraction.

### 5. Security

Check:
- user input is validated and sanitized
- secrets are not committed, logged, or exposed
- authentication and authorization checks are present where needed
- queries are parameterized
- outputs are encoded where injection or XSS is possible
- external data is treated as untrusted
- dependency changes do not introduce obvious known risk

### 6. Performance

Check current-impact risks:
- N+1 query patterns
- unbounded loops or unconstrained fetching
- synchronous work in hot paths
- unnecessary re-renders or large object creation
- missing pagination on list endpoints

Do not require speculative optimization without evidence.

## Change Sizing

Large changes are harder to review and riskier to merge.

Use these rough thresholds:

```text
~100 lines changed   → Good
~300 lines changed   → Acceptable if one logical change
~1000 lines changed  → Too large; ask to split unless mostly generated/deleted code
```

Separate refactoring from feature work unless the cleanup is necessary for the change.

## Dead Code Hygiene

After refactors or implementation changes:
1. Identify unreachable or unused code introduced or orphaned by the change.
2. List it explicitly.
3. Ask before deleting anything uncertain.

Do not silently remove unrelated pre-existing dead code unless asked.

## Dependency Discipline

For new or changed dependencies, check:
1. whether the existing stack already solves the problem
2. size or bundle impact when relevant
3. maintenance status when knowable
4. known vulnerabilities when tooling is available
5. license compatibility when relevant

Prefer standard library and existing utilities over new dependencies.

## Severity Model

### Critical

Blocks merge or completion.

Examples:
- incorrect business logic
- security vulnerability
- data loss or corruption risk
- invalid state propagation
- unsafe boundary handling
- tests missing for high-risk changed behavior

### Important

Should fix soon or explicitly defer with justification.

Examples:
- fragile design
- unnecessary coupling
- moderate complexity with real maintenance cost
- weak tests around changed behavior
- repeated business rules with drift risk
- large review size that hides risk

### Suggestions

Useful improvements that can be deferred.

Examples:
- small readability cleanup
- naming refinement
- low-risk local refactor
- documentation polish

## Feedback Contract

For every meaningful finding, include:
- what is wrong
- why it matters now
- minimal fix
- whether it must be fixed now or can be deferred

Do not:
- nitpick without impact
- demand speculative refactors
- optimize for theoretical purity over delivery
- confuse similar-looking code with duplicated knowledge
- recommend large redesigns when a local fix is enough
- soften real issues or hide blockers behind vague phrasing

## Required Output Format

Always use this structure:

```markdown
# Code Quality Review Summary

## What Was Done Well
- ...

## Critical
#### [Finding title]
- Category: Correctness / Tests / Readability / Architecture / Security / Performance / Dependencies
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Must fix now

## Important
#### [Finding title]
- Category: ...
- Files: ...
- Problem: ...
- Why it matters: ...
- Recommended fix: ...
- Timing: Should fix soon / Can defer with note

## Suggestions
#### [Finding title]
- Category: ...
- Files: ...
- Observation: ...
- Benefit of improvement: ...
- Suggested refinement: ...
- Timing: Optional

## Tests and Verification
- ...

## Dead Code and Dependencies
- ...

## Verdict
- Approve / Request changes / Needs spec review first

## Recommended Next Actions
1. ...
2. ...
3. ...
```

If a section has no findings, keep the section and write `- None.`.

## Review Checklist

Before finishing, verify the review:
- confirms spec alignment or requests spec review first
- starts with strengths
- covers correctness, tests, readability, architecture, security, performance, and dependencies as relevant
- separates blockers from improvements
- explains why each issue matters now
- recommends smallest reasonable fixes
- gives a clear verdict
