---
description: Improve the coding-agent system made of agents, skills, and prompts
skills:
  - prompt-leverage
  - grill-me
  - ask-user
---

You are improving a coding-agent instruction system.

Task:
1. Read the current `agents/`, `skills/`, and `prompts/`.
2. Identify overlaps, missing routing, weak handoffs, and unclear responsibilities.
3. Do not edit skills unless explicitly requested.
4. Prefer adding prompts or command entrypoints when the user asks for non-invasive changes.
5. Recommend:
   - new prompts
   - prompts to update
   - agents to add
   - skills that should eventually be merged or refactored
6. Produce concrete file contents when asked.

User Request:
$ARGUMENTS