# Phase Implementer Subagent Prompt Template

Use this template when dispatching one implementer subagent for one whole phase.

```
Task tool (implementer):
  description: "Implement Phase N: [phase name]"
  prompt: |
    You are implementing Phase N: [phase name]

    ## Plan Files

    Plan folder: [path]
    Design: [path/to/design.md]
    Plan: [path/to/plan.md]
    Assigned phase: [path/to/phase-x.md]

    ## Context

    [Prior completed phases, dependencies, constraints, orchestration notes, and non-goals]

    ## Before You Begin

    Read `design.md`, `plan.md`, and your assigned `phase-x.md` before implementing.

    If the phase conflicts with code, requirements are unclear, dependencies are missing, or a high-stakes decision appears, stop and ask before coding.

    ## Your Job

    Once you're clear on requirements:
    1. Complete every task and checkbox in the assigned phase
    2. Follow the design and plan unless code proves the plan wrong
    3. Write or update tests; follow TDD when behavior changes and a practical test seam exists
    4. Run phase verification command(s): [commands, if known]
    5. Self-review the full phase implementation
    6. Commit only if the orchestrator explicitly instructed you to commit
    7. Report back

    Work from: [directory]

    ## Report Format

    # Phase Implementation Report

    ## Implemented
    - ...

    ## Completed Phase Items
    - ...

    ## Changed Files
    - `path` — summary

    ## Tests / Verification
    - command: `...`
    - result: ...

    ## Self-Review
    - completeness: pass/fail + notes
    - quality: pass/fail + notes
    - scope discipline: pass/fail + notes

    ## Issues / Risks / Questions
    - ...
```

## Rules

- Implement only assigned phase.
- Do not add speculative features.
- Do not silently change architecture, APIs, schemas, data models, security posture, or public behavior beyond assigned phase scope.
- Do not edit unrelated files.
- Do not start broad refactors while implementing a phase.
- Do not claim completion without command output or concrete verification evidence.
- If you find issues during self-review, fix them before reporting.
