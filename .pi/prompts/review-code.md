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
- User request may include design path, plan path, review scope, branch, base/head SHAs, diff, file list, or output path.

Task:
1. Determine review scope.
2. Read provided design, plan, requirements, acceptance criteria, or task notes.
3. Inspect changed code or requested files.
4. Dispatch two review subagents with same scope and source material:
   - `spec-reviewer`: Phase 1. Check whether code matches plan/spec and whether deviations are justified.
   - `code-quality-reviewer`: Phase 2. Check correctness, maintainability, architecture, tests, and pragmatic quality.
5. Merge both reports into one review.
6. De-duplicate findings. If both subagents report same issue, keep strongest severity and cite both angles if useful.
7. Separate blocker fixes from optional improvements.
8. Recommend minimal fixes only.
9. Save review report if path is provided.

Output path default:
- If plan path is `docs/plans/YYYY-MM-DD-<topic>-plan.md`, save to `docs/plans/YYYY-MM-DD-<topic>-review.md`.

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
