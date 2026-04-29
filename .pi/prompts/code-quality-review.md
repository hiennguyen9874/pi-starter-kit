---
description: Run phase 2 code quality review for correctness, maintainability, and pragmatics
skills:
  - code-reviewer
  - pragmatic-principles
  - receiving-code-review
---

## Objective

Evaluate whether implementation is correct, maintainable, testable, and appropriately simple. Identify critical bugs, architectural risks, and unnecessary complexity. Produce a structured code quality report.

## Context

Inputs may include any of:
- Changed files, diff, or file list
- Branch name or base/head SHAs
- Spec alignment context, plan folder, or selected `phase-x.md` if available
- Output path for saving the report

If spec alignment is unknown or was not reviewed, state that quality approval does not imply requirements are satisfied.

## Work Style

- Focus on touched code and selected phase scope when provided. Avoid reviewing unrelated systems or future phases.
- Prefer local fixes over redesign.
- Treat DRY as duplicated knowledge, not similar syntax.
- Use first-principles reasoning: does this code actually work and can it be understood?
- Do not demand speculative abstractions or future-proofing.

## Tool Rules

- Inspect changed or requested files directly.
- Run relevant tests when available to verify correctness claims.
- Use grep/find when tracing dependencies or boundary crossings.

## Output Contract

Produce a structured report with these sections:

```
# Code Quality Review

## What Was Done Well
- ...

## Critical
### [Finding title]
- Files: ...
- Problem: ...
- Why it matters: ...
- Minimal fix: ...

## Important
### [Finding title]
- Files: ...
- Problem: ...
- Why it matters: ...
- Minimal fix: ...

## Suggestions
### [Finding title]
- Files: ...
- Observation: ...
- Benefit: ...
- Suggested refinement: ...

## Tests and Verification
- ...

## Quality Verdict
- Pass / Pass with issues / Fail
- Reason: ...
```

Severity definitions:
- Critical: must fix before complete/safe
- Important: should fix soon due to material correctness or maintainability cost
- Suggestions: optional refinements with clear benefit

Rules:
- Do not nitpick without impact.
- Do not treat quality approval as spec approval.
- Recommend the smallest reasonable fix for each issue.
- Avoid re-litigating plan/spec alignment unless a quality issue creates behavioral risk.

## Verification

- Every critical and important finding must reference specific code lines.
- Confirm edge cases are considered for changed logic.
- Confirm error handling and validation exist at relevant boundaries.
- Re-check that severity levels are honest and not inflated.

## Done Criteria

- Report is complete with all required sections.
- All critical and important issues are documented with minimal fix recommendations.
- Quality verdict is stated with clear reasoning.
- If output path is provided, the report is saved there.

User Request:
$ARGUMENTS
