---
description: Run phase 1 spec alignment review against requirements, plan, phase file, or design
skills:
  - code-reviewer
  - pragmatic-principles
---

## Objective

Determine whether implemented code matches requested behavior, plan, selected phase, requirements, acceptance criteria, or task intent. Identify deviations, missing scope, and unjustified changes. Produce a structured spec alignment report.

## Context

Inputs may include any of:
- Design path, plan folder, `plan.md`, or `phase-x.md`
- Requirements or acceptance criteria
- Task notes, issue text, or PR description
- Branch name, base/head SHAs, diff, or file list
- Output path for saving the report

Missing context limits what can be verified. State explicitly when a requirement cannot be checked.

## Work Style

- Requirements first. Style and quality later.
- Verify independently. Do not trust implementer summaries or claims about completeness.
- If a phase is provided, review only that phase scope unless user requests full-plan review.
- Compare implementation to requirements line by line when requirements are explicit.
- If implementation is better than plan, recommend updating the plan rather than forcing worse code.
- Read actual code; do not accept summaries as evidence.

## Tool Rules

- Read all provided requirements, plans, phase files, and design documents before inspecting code.
- For plan folders, read `design.md`, `plan.md`, and relevant `phase-x.md`.
- Inspect changed or requested files directly.
- Use grep/find when searching for specific behaviors across the codebase.

## Output Contract

Produce a structured report with these sections:

```
# Spec Review

## What Was Done Well
- ...

## Requirement Mismatches
- ...

## Plan Deviations
- ...

## Scope Creep / Missing Scope
- ...

## Tests vs Required Behavior
- ...

## Spec Alignment Verdict
- Pass / Pass with issues / Fail
- Reason: ...

## Required Fixes
1. ...
```

Classification rules:
- Every meaningful deviation must be classified as: beneficial improvement, acceptable tradeoff, problematic deviation, or evidence the original plan should be updated.
- Separate required fixes from observations.
- Do not invent requirements not present in input.

## Verification

- Confirm every requirement mismatch is grounded in a specific line of code or absence thereof.
- Confirm every plan/phase deviation is tied to an explicit statement.
- Re-check that no requirement was evaluated from memory alone.

## Done Criteria

- Report is complete with all required sections.
- All requirement mismatches, plan/phase deviations, and scope issues are identified and classified.
- Required fixes are listed as minimal, actionable items.
- If output path is provided, the report is saved there.

User Request:
$ARGUMENTS
