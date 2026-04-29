---
description: Convert old standalone design/plan files into the plan folder format
skills:
  - writing-plans
---

You are converting old-style planning files into the current plan folder format.

Use this prompt when:
- User has standalone design and plan files such as `docs/plans/YYYY-MM-DD-<topic>-design.md` and `docs/plans/YYYY-MM-DD-<topic>-plan.md`
- User has one old plan file containing many tasks
- User wants existing design/plan content reorganized into `design.md`, `plan.md`, and `phase-x.md` files

Inputs:
- Old design file path, old plan file path, plan text, or folder/path containing old planning files
- Optional target folder name

Task:
1. Read all provided old design and plan files.
2. Infer target folder: `docs/plans/YYYY-MM-DD-<topic>/`.
3. Create or update the target folder.
4. Move/copy design content into `design.md`.
5. Rewrite `plan.md` so it contains only:
   - Plan Document Header
   - linked phase list
   - any cross-phase notes or decision gates
6. Split executable task details into `phase-x.md` files.
7. Put 1-3 related tasks in each phase, grouped by cohesive area such as backend, frontend, database, docs, or verification.
8. Preserve original intent, task order, file paths, commands, and acceptance criteria where valid.
9. If old plan lacks enough detail to split safely, stop and ask one focused clarification question.
10. Do not implement code.
11. Do not delete old files unless explicitly requested.

Output contract:
- Create/update:
  - `docs/plans/YYYY-MM-DD-<topic>/design.md`
  - `docs/plans/YYYY-MM-DD-<topic>/plan.md`
  - `docs/plans/YYYY-MM-DD-<topic>/phase-1.md`, `phase-2.md`, ...
- Report:
  - source files read
  - target folder
  - phase list with 1-line scope per phase
  - any assumptions or unresolved gaps

Verification:
- Confirm `plan.md` links to every `phase-x.md` file.
- Confirm each phase has 1-3 related tasks.
- Confirm task details are not duplicated wholesale in `plan.md`.
- Confirm `design.md` exists.
- Confirm no code implementation was performed.

Done criteria:
- Old planning content is available in folder style.
- Phase files are coherent and executable one phase at a time.
- Original old files remain unless user explicitly requested deletion.

User Request:
$ARGUMENTS
