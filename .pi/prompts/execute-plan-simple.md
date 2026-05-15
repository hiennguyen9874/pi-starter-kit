---
description: Execute one phase from a small implementation plan folder directly
skills:
  - executing-plans
  - test-driven-development
---

You are executing one phase from a written implementation plan folder.

Inputs:
- Plan folder, `plan.md`, `phase-x.md`, or plan text from user request
- Optional selected phase number/name

Task:
1. Resolve the plan folder and selected phase.
2. Read `design.md`, `plan.md`, and only the selected `phase-x.md` when using plan folder format.
3. Review the selected phase critically before coding.
4. If the phase has critical gaps, stop and ask.
5. If clear, execute only that phase.
6. Run verification specified in the phase.
7. Report progress and wait for feedback.
8. Stop after the phase. Do not merge, commit, or delete branches unless explicitly requested.

Rules:
- Follow the phase exactly unless the code proves the plan is wrong.
- If the phase conflicts with the codebase, stop and explain the conflict.
- If phase count exceeds size cap, stop and ask before implementation.
- Do not add speculative features.
- Do not claim success without command output.

User Request:
$ARGUMENTS