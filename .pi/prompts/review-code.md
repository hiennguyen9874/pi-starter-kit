---
description: "Run two-phase code review: spec alignment first, code quality second"
skills:
  - code-reviewer
  - pragmatic-principles
  - receiving-code-review
  - dispatching-parallel-agents
---

You are orchestrating a two-phase code review.

Inputs:
- User request may include design path, plan folder, `plan.md`, `phase-x.md`, review scope, branch, base/head SHAs, diff, file list, or output path.

Task:
1. Determine review scope.
2. Read provided design, plan, selected phase, requirements, acceptance criteria, or task notes.
3. If a plan folder is provided, read `design.md`, `plan.md`, and relevant `phase-x.md`; do not assume every phase was implemented.
4. Inspect changed code or requested files.
5. Dispatch two review subagents with same scope and source material:
   - `spec-reviewer`: Phase 1. Check whether code matches plan/spec and whether deviations are justified.
   - `code-quality-reviewer`: Phase 2. Check correctness, maintainability, architecture, tests, and pragmatic quality.
6. Merge both reports into one review.
7. De-duplicate findings. If both subagents report same issue, keep strongest severity and cite both angles if useful.
8. Separate blocker fixes from optional improvements.
9. Recommend minimal fixes only.
10. Save review report if path is provided.

Output path default:
- If plan folder is `docs/plans/YYYY-MM-DD-<topic>/`, save to `docs/plans/YYYY-MM-DD-<topic>/review.md`.
- If reviewing a specific phase, save to `docs/plans/YYYY-MM-DD-<topic>/phase-x-review.md`.

Rules:
- Spec alignment findings come before quality findings.
- Do not let code-quality concerns obscure missing requirements.
- Do not invent issues.
- Do not nitpick without impact.
- Do not require speculative refactors.
- Distinguish blocker fixes from optional improvements.
- If implementation is better than plan, recommend updating plan rather than forcing worse code.

User Request:
$ARGUMENTS
