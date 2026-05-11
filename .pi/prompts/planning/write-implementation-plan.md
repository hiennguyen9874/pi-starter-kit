---
description: Convert an approved design into an implementation plan folder
skills:
  - writing-plans
  - pragmatic-principles
---

You are converting an approved design into a concrete implementation plan folder.

Inputs:
- Design folder, `design.md` path, or design text from user request
- Optional extra constraints from user request

Task:
1. Read the design carefully.
2. Inspect the relevant codebase areas.
3. Identify exact files to modify.
4. Create or update `docs/plans/YYYY-MM-DD-<topic>/`.
5. Save/copy approved design as `design.md` if it is not already in the folder.
6. Write `plan.md` with Plan Document Header and links to phase files.
7. Write `phase-x.md` files with executable tasks.
8. Apply phase count maximum by feature size: small ≤3, medium ≤5, large ≤7.
9. Put 1-3 related tasks in each phase, grouped by cohesive area such as backend or frontend.
10. Add acceptance criteria and verification commands for each phase.
11. Highlight decision gates that must be resolved before implementation.
12. Do not implement code.

Output path:
- `docs/plans/YYYY-MM-DD-<topic>/`

User Request:
$ARGUMENTS