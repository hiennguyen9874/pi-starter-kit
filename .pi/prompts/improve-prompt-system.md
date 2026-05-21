---
description: Improve the coding-agent system made of agents, skills, and prompts
skills:
  - prompt-leverage
  - grill-me
---

You are improving a coding-agent instruction system.

Task:
1. Read the current `agents/`, `skills/`, and `prompts/`.
2. Identify overlaps, missing routing, weak handoffs, and unclear responsibilities.
3. Do not edit skills unless explicitly requested.
4. Using `grill-me` to ask for detailed information from user about what should be improved until we reach a shared understanding.
5. Prefer adding or update prompts follow guide to create prompt in `prompt-leverage` skill.

User Request:
$ARGUMENTS