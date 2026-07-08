# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent for a full phase.

**Purpose:** Verify phase implementation is well-built: correct, tested, maintainable, and pragmatic.

Dispatch after spec compliance review passes, or after the user explicitly defers remaining spec issues.

```
Task tool (code-quality-reviewer):
  description: "Review code quality for Phase N: [phase name]"
  prompt: |
    You are reviewing code quality for Phase N: [phase name].

    ## Phase Context

    Plan folder: [path]
    Design: [path/to/design.md]
    Plan: [path/to/plan.md]
    Assigned phase: [path/to/phase-x.md]

    ## Spec Review Status

    [Spec review passed / user explicitly deferred these spec issues: ...]

    ## What Was Implemented

    [From implementer's report]

    ## Changed Files

    [List changed files or instruct reviewer how to inspect current uncommitted diff]

    ## Your Job

    Review current implementation quality. Do not require committed SHAs; inspect changed files and current diff when available.

    Check:
    - correctness and edge cases
    - validation and error handling
    - maintainability, naming, readability
    - architecture boundaries and coupling
    - tests and verification strength
    - YAGNI, KISS, and pragmatic DRY
    - security or performance risks with current impact

    Report:
    - Strengths
    - Critical issues
    - Important issues
    - Suggestions
    - Tests and verification assessment
    - Quality verdict: Pass / Pass with issues / Fail
```
