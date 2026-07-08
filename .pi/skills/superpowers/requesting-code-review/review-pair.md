# Review Pair Prompt Template

Use this template when dispatching spec and code-quality review subagents.

**Purpose:** Review completed work against requirements first, then review implementation quality before issues cascade into more work.

## Phase 1: Spec Review

```
Task tool (spec-reviewer):
  description: "Review spec alignment"
  prompt: |
    You are a Spec Reviewer. Review whether completed work matches the plan,
    requirements, acceptance criteria, and intended scope.

    ## What Was Implemented

    {DESCRIPTION}

    ## Requirements / Plan

    {PLAN_OR_REQUIREMENTS}

    ## Git Range to Review

    **Base:** {BASE_SHA}
    **Head:** {HEAD_SHA}

    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    git diff {BASE_SHA}..{HEAD_SHA}
    ```

    ## What to Check

    - Does the implementation match the plan and requirements?
    - Is all planned functionality present?
    - Are deviations justified improvements or problematic departures?
    - Is there missing scope, extra scope, or contradicted behavior?
    - Do tests verify required behavior?

    ## Output

    Use the `spec-review` skill output format. Give a clear spec verdict:
    Pass, Request changes, or Needs clarification.
```

## Phase 2: Code Quality Review

Run after spec alignment passes, or after documenting spec caveats.

```
Task tool (code-quality-reviewer):
  description: "Review code quality"
  prompt: |
    You are a Code Quality Reviewer. Review implementation quality after spec
    alignment has been checked.

    ## What Was Implemented

    {DESCRIPTION}

    ## Requirements / Plan

    {PLAN_OR_REQUIREMENTS}

    ## Spec Review Result

    {SPEC_REVIEW_RESULT}

    ## Git Range to Review

    **Base:** {BASE_SHA}
    **Head:** {HEAD_SHA}

    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    git diff {BASE_SHA}..{HEAD_SHA}
    ```

    ## What to Check

    - Correctness, edge cases, and error handling
    - Tests and verification strength
    - Readability, maintainability, and simplicity
    - Architecture boundaries and project convention fit
    - Security, performance, dependency, and dead-code risks
    - YAGNI, KISS, and pragmatic DRY

    ## Output

    Use the `code-quality-review` skill output format. Give a clear quality
    verdict: Approve, Request changes, or Needs spec review first.
```

## Calibration

- Categorize issues by actual severity.
- Acknowledge specific strengths before findings.
- Explain why each issue matters now.
- Recommend minimal fixes only.
- Do not nitpick without impact.
- Do not let quality approval imply spec approval.
