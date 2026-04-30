---
description: Execute a full plan folder using phase-level subagents
skills:
  - executing-plans
  - subagent-driven-development
  - test-driven-development
---

You are executing a full written implementation plan folder using subagent-driven development.

Required agents:
- `implementer` — implements all tasks in exactly one phase
- `spec-reviewer` — phase 1 review: plan/spec/acceptance alignment after a phase is implemented
- `code-quality-reviewer` — phase 2 review: correctness, maintainability, tests, pragmatic quality after spec review passes

Inputs:
- Plan folder, `plan.md`, or plan text from user request
- Optional starting phase number/name
- Optional execution constraints

Task:
1. Resolve the plan folder.
2. Read `design.md`, `plan.md`, and every `phase-x.md` in the plan folder.
3. Check phase count against declared/obvious feature size: small ≤3, medium ≤5, large ≤7.
4. If a starting phase is specified, start there; otherwise start with the first incomplete phase and state that assumption.
5. Review the full plan critically before implementation.
6. If the plan has critical gaps, plan/code conflicts, unresolved high-stakes decisions, or critical ambiguity, stop and ask before coding.
7. Extract every phase, phase dependency, phase verification command, task, acceptance criterion, and file list.
8. Create a checklist for all remaining phases.
9. For each phase, in dependency order:
   - dispatch exactly one `implementer` agent for the entire phase
   - provide the full phase text; do not make the agent rediscover the plan
   - provide relevant context from `design.md`, `plan.md`, prior completed phases, constraints, dependencies, and acceptance criteria
   - instruct the implementer to complete every task and every checkbox in the phase
   - require TDD when behavior changes and a practical test seam exists
   - require phase verification output, changed files, self-review, and open risks
10. After the implementer completes a phase:
   - run `spec-reviewer` across the entire phase implementation
   - if spec issues exist, send issues back to the same phase implementer and re-review the full phase
   - run `code-quality-reviewer` only after spec alignment passes or is explicitly deferred by the user
   - if quality issues exist, send issues back to the same phase implementer and re-review the full phase
   - run phase verification from `phase-x.md`
   - mark the phase complete only when review issues are fixed or explicitly deferred
11. Continue to the next phase until all phases are complete or a blocker requires user input.
12. After all phases:
   - run final two-phase review across the full implementation
   - run full verification from the plan, if specified
   - report changed files, verification evidence, review verdicts, and open risks
   - stop and wait for feedback

Hard rules:
- Implement at phase granularity: one implementer subagent owns one whole phase.
- Do not review after every task. Review after the whole phase is implemented.
- Only one implementation writer may edit code at a time.
- Parallel subagents are allowed only for reading, research, review, or independent diagnosis.
- Follow each phase exactly unless the code proves the plan is wrong.
- If a phase conflicts with the codebase, stop and explain the conflict.
- If phase count exceeds the feature-size cap, stop and ask before implementation.
- Do not silently change architecture/API/schema/security decisions.
- Use ask-user for high-stakes decisions, destructive actions, or unresolved product choices.
- Do not add speculative features.
- Do not commit, merge, delete branches, or remove files unless explicitly requested.
- Do not claim completion without verification evidence.
- Do not let implementer self-review replace independent review.
- Do not use `finishing-a-development-branch` until all phases are complete, tests pass, and the user explicitly asks to finish.

Phase implementer dispatch contract:
- Plan folder path
- Phase name and number
- Full phase text copied from `phase-x.md`
- All tasks and checkboxes in the phase
- Acceptance criteria
- Relevant design context, dependencies, and prior phase outputs
- Files listed by the phase, if known
- Verification command(s)
- Constraints and non-goals

Progress tracking:
- Track checklist state for all remaining phases.
- Update plan checkboxes only if explicitly requested or if the environment/workflow requires it.

Completion response:
- Phases executed
- Tasks completed by phase
- Changed files
- Verification commands and results
- Review verdicts
- Risks or deferred issues
- "Plan complete. Ready for feedback."

User Request:
$ARGUMENTS
