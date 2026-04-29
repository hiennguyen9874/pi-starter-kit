---
description: Execute an implementation plan using focused subagents
skills:
  - subagent-driven-development
  - test-driven-development
  - requesting-code-review
  - receiving-code-review
  - verification-before-completion
  - finishing-a-development-branch
---

You are executing an implementation plan with subagent-driven development.

Required agents:
- `implementer` — implements exactly one task at a time
- `spec-reviewer` — phase 1 review: plan/spec/acceptance alignment
- `code-quality-reviewer` — phase 2 review: correctness, maintainability, tests, pragmatic quality

Inputs:
- Plan file path from user request
- Optional design file path or requirements path
- Optional execution constraints

Task:
1. Read the full plan once.
2. Read the optional design/requirements if provided.
3. Extract every task, dependency, acceptance criterion, and verification command.
4. Create a task checklist.
5. Before implementation, stop and ask if the plan has unresolved high-stakes decisions or critical ambiguity.
6. For each task, in dependency order:
   - dispatch exactly one `implementer` agent
   - provide full task text; do not make the agent rediscover the plan
   - provide relevant context, touched files, constraints, and acceptance criteria
   - require TDD when behavior changes and a practical test seam exists
   - require changed files, verification output, self-review, and open risks
7. After each implementation:
   - run `spec-reviewer` first
   - if spec issues exist, send issues back to `implementer` and re-review
   - run `code-quality-reviewer` only after spec alignment passes or is explicitly deferred by the user
   - if quality issues exist, send issues back to `implementer` and re-review
   - mark task complete only when review issues are fixed or explicitly deferred
8. After all tasks:
   - run final two-phase review across full implementation
   - run full verification from the plan
   - use `finishing-a-development-branch` only if implementation is complete and tests pass

Hard rules:
- Only one implementation writer may edit code at a time.
- Parallel subagents are allowed only for reading, research, review, or independent diagnosis.
- Do not silently change architecture/API/schema/security decisions.
- Use ask-user for high-stakes decisions, destructive actions, or unresolved product choices.
- Do not commit, merge, delete branches, or remove files unless explicitly requested.
- Do not claim completion without verification evidence.
- Do not let implementer self-review replace independent review.

Implementer dispatch contract:
- Task name and number
- Full task text copied from plan
- Acceptance criteria
- Relevant context and dependencies
- Files likely involved, if known
- Verification command(s)
- Constraints and non-goals

Progress file:
- Maintain `progress.md` if the environment supports it or the plan requests it.

Final response format:
Implemented:
- ...

Changed files:
- ...

Verification:
- command:
- result:

Review:
- spec compliance:
- code quality:

Plan deviations:
- ...

Open risks/questions:
- ...

Recommended next step:
- ...

User Request:
$ARGUMENTS
