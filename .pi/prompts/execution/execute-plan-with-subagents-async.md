---
description: Execute a full plan folder using phase-level subagents with background runs and same-phase resume loops
skills:
  - subagent-driven-development
  - pi-subagents
  - code-reviewer
---

You are executing a full written implementation plan folder using subagent-driven development.

Use this prompt when:
- User wants to execute a written implementation plan, plan folder, or phase-based plan.
- Plan can be implemented one phase at a time by one writer.
- Each phase needs independent review and fix loops before moving on.
- Background subagent execution and same-phase `resume` continuity are required.

Required skills:
- `subagent-driven-development` — phase-level implementation workflow and quality gates
- `pi-subagents` — `subagent(...)`, async/background runs, `status`, and `resume`
- `code-reviewer` — review standards for spec and quality review

Required agents:
- `implementer` — implements all tasks in exactly one phase
- `spec-reviewer` — reviews plan/spec/acceptance alignment for a full phase
- `code-quality-reviewer` — reviews correctness, maintainability, tests, and pragmatic quality for a full phase

Input contract:
- Plan folder, `plan.md`, or plan text from user request
- Optional starting phase number/name
- Optional execution constraints
- Optional verification or commit instructions

Output contract:
- Phases executed
- Tasks completed by phase
- Subagent run IDs used for each phase
- Changed files
- Verification commands and results
- Parallel review verdicts
- Fixed, deferred, or open review issues
- Risks or blockers
- Final line: `Plan complete. Ready for feedback.`

Task:
1. Resolve the plan folder.
2. Read `design.md`, `plan.md`, and phase file names/links in the plan folder. Read phase files as needed to understand dependencies and sequencing.
3. If a starting phase is specified, start there; otherwise start with the first incomplete phase and state that assumption.
4. Review the full plan critically before implementation.
5. If the plan has critical gaps, plan/code conflicts, unresolved high-stakes decisions, or critical ambiguity, stop and ask before coding.
6. Extract every phase path, phase dependency, and phase-level verification command from the plan.
7. Create a checklist for all remaining phases.
8. For each phase, in dependency order, maintain a phase subagent registry:
   - `implementerRunId`
   - `reviewRunId`
   - reviewer indexes for `spec-reviewer` and `code-quality-reviewer`
   - latest review issue summary
   - verification commands/results
9. For each phase implementation pass:
   - if this is the first implementation pass for the phase, launch exactly one `implementer` in background with `async: true`
   - capture the returned run ID as `implementerRunId`
   - provide the phase file path, not copied phase contents
   - instruct the implementer to read `design.md`, `plan.md`, and its assigned `phase-x.md` before implementing
   - provide relevant context from prior completed phases, constraints, dependencies, and orchestration notes
   - instruct the implementer to complete every task and every checkbox in the assigned phase
   - require TDD when behavior changes and a practical test seam exists
   - require phase verification output, changed files, self-review, and open risks
   - check completion with `subagent({ action: "status", id: implementerRunId })` when needed
10. For same-phase implementation fixes:
   - do not launch a new `implementer`
   - send review issues back with `subagent({ action: "resume", id: implementerRunId, message: "..." })`
   - include only concrete issues, expected fixes, verification to rerun, and any updated context
   - after resume completes, continue with review of the full phase again
11. After each implementation pass, run review in parallel:
   - if this is the first review pass for the phase, launch one background parallel review run with both reviewers:
     - `spec-reviewer` reviews the full phase for plan/spec/acceptance alignment
     - `code-quality-reviewer` reviews the full phase for correctness, maintainability, tests, and pragmatic quality
   - use `async: true` and `context: "fresh"` for the parallel review run
   - capture the returned run ID as `reviewRunId`
   - record each child index so later resumes target the same reviewer session
   - reviewers must inspect files/diffs directly, not trust implementer summaries
   - reviewers must not edit files
12. For same-phase re-review after fixes:
   - do not launch new reviewer subagents
   - resume the original parallel review children by index:
     - `subagent({ action: "resume", id: reviewRunId, index: <spec-reviewer-index>, message: "Re-review the full phase after fixes. Focus on prior spec findings plus regressions." })`
     - `subagent({ action: "resume", id: reviewRunId, index: <code-quality-reviewer-index>, message: "Re-review the full phase after fixes. Focus on prior quality findings plus regressions." })`
   - if both reviewers need re-review, resume both existing reviewer children; do not create fresh reviewers for the same phase
13. Review gate:
   - synthesize parallel review findings after both reviewers complete
   - treat spec issues as blocking unless user explicitly defers them
   - treat critical/high quality issues as blocking unless user explicitly defers them
   - send blocking issues to the same phase implementer via `resume`
   - re-review the full phase by resuming existing reviewers until blocking issues are fixed or explicitly deferred
14. Run phase verification from `phase-x.md` after review issues are fixed or deferred.
15. Mark the phase complete only when implementation, parallel review, fixes, and verification are complete.
16. Git add and commit all changed files only if the user or plan explicitly requires commits.
17. Continue to the next phase until all phases are complete or a blocker requires user input.
18. After all phases:
   - run final parallel review across the full implementation
   - run full verification from the plan, if specified
   - report changed files, verification evidence, review verdicts, run IDs, and open risks
   - stop and wait for feedback

Required subagent patterns:

First phase implementation run:

```typescript
subagent({
  agent: "implementer",
  task: "Implement phase <N>. Read <design.md>, <plan.md>, and <phase-x.md> before editing. Complete every task and checkbox for this phase. Return changed files, verification evidence, self-review, and risks.",
  async: true,
  context: "fresh"
})
```

Same-phase implementation fix run:

```typescript
subagent({
  action: "resume",
  id: implementerRunId,
  message: "Fix these blocking review issues for the same phase: <issues>. Rerun relevant verification and report changed files, results, and remaining risks."
})
```

First phase parallel review run:

```typescript
subagent({
  tasks: [
    {
      agent: "spec-reviewer",
      task: "Review phase <N> implementation against <design.md>, <plan.md>, and <phase-x.md>. Inspect files/diffs directly. Do not edit. Return blocking spec issues, nonblocking notes, and verdict."
    },
    {
      agent: "code-quality-reviewer",
      task: "Review phase <N> implementation for correctness, maintainability, tests, and pragmatic quality. Inspect files/diffs directly. Do not edit. Return blocking quality issues, nonblocking notes, and verdict."
    }
  ],
  async: true,
  context: "fresh"
})
```

Same-phase reviewer re-review:

```typescript
subagent({
  action: "resume",
  id: reviewRunId,
  index: specReviewerIndex,
  message: "Re-review the full phase after fixes. Verify prior spec findings and check for regressions. Do not edit."
})

subagent({
  action: "resume",
  id: reviewRunId,
  index: codeQualityReviewerIndex,
  message: "Re-review the full phase after fixes. Verify prior quality findings and check for regressions. Do not edit."
})
```

Hard rules:
- Implement at phase granularity: one implementer subagent owns one whole phase.
- Do not review after every task. Review after the whole phase is implemented.
- Only one implementation writer may edit code at a time.
- Use background subagent runs (`async: true`) for phase implementation and parallel review.
- Within a phase, never create a second implementer; use `resume` on `implementerRunId` for fixes.
- Within a phase, never create fresh reviewers for re-review; use `resume` on `reviewRunId` with the correct reviewer `index`.
- Parallel review is required for each phase: `spec-reviewer` and `code-quality-reviewer` run in the same parallel review fanout.
- Parallel subagents are allowed only for reading, research, review, or independent diagnosis.
- Follow each phase exactly unless the code proves the plan is wrong.
- If a phase conflicts with the codebase, stop and explain the conflict.
- Do not silently change architecture/API/schema/security decisions.
- Use ask-user for high-stakes decisions, destructive actions, or unresolved product choices.
- Do not add speculative features.
- Do not merge, delete branches, or remove files unless explicitly requested.
- Do not claim completion without verification evidence.
- Do not let implementer self-review replace independent review.
- Do not use `finishing-a-development-branch` until all phases are complete, tests pass, and the user explicitly asks to finish.

Phase implementer dispatch contract:
- Plan folder path
- Phase name and number
- `design.md` path
- `plan.md` path
- Assigned `phase-x.md` path
- Instruction to read those files before implementing
- Relevant dependencies, constraints, orchestration notes, and prior phase outputs
- Verification command(s), if known from orchestration
- Constraints and non-goals

Progress tracking:
- Track checklist state for all remaining phases.
- Track phase subagent registry with implementer/reviewer run IDs and reviewer indexes.
- Update plan checkboxes only if explicitly requested or if the environment/workflow requires it.

Verification/done criteria:
- Every required phase task and checkbox completed or explicitly deferred.
- Same-phase fix loops used `resume`, not new subagents.
- Each phase received parallel spec and code-quality review.
- Blocking review issues fixed or explicitly deferred.
- Phase verification commands run and results reported.
- Final full implementation review and full-plan verification completed when specified.

User Request:
$ARGUMENTS
