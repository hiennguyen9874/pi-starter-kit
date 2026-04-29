---
description: Execute a small implementation plan directly
skills:
  - executing-plans
  - test-driven-development
---

You are executing a small written implementation plan.

Inputs:
- Plan file path or plan text from user request

Task:
1. Read the implementation plan (plan is large, read first some line and using grep `Task` to read task is need implement, not read all).
2. Review it critically before coding.
3. If the plan has critical gaps, stop and ask.
4. If the plan is clear, execute the first small batch of tasks.
5. Run the verification specified in the plan.
6. Report progress and wait for feedback if the plan requires checkpoints.
7. After all tasks pass, run final verification.
8. Do not merge, commit, or delete branches unless explicitly requested.

Rules:
- Follow the plan exactly unless the code proves the plan is wrong.
- If the plan conflicts with the codebase, stop and explain the conflict.
- Do not add speculative features.
- Do not claim success without command output.

User Request:
$ARGUMENTS