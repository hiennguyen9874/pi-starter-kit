---
description: Convert an approved design into an implementation plan
skills:
  - writing-plans
  - pragmatic-principles
---

You are converting an approved design into a concrete implementation plan.

Inputs:
- Design file path or design text from user request
- Optional extra constraints from user request

Task:
1. Read the design carefully.
2. Inspect the relevant codebase areas.
3. Identify exact files to modify.
4. Break the work into small ordered tasks.
5. Add acceptance criteria and verification commands for each task.
6. Highlight decision gates that must be resolved before implementation.
7. Do not implement code.

Output path:
- `docs/plans/YYYY-MM-DD-<topic>-plan.md`

User Request:
$ARGUMENTS