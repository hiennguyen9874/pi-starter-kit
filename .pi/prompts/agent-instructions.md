---
description: Create or refactor concise repository instructions for coding agents
skills:
  - agent-md-refactor
---

Create or refactor this repository's agent instructions.

## Scope

- Treat root `AGENTS.md` and `docs/agent-instructions/` as the managed instruction set.
- If `AGENTS.md` or task-specific files already exist, inventory, classify, and refactor them rather than replacing them blindly.
- If they do not exist, create the smallest evidence-backed instruction set needed for this repository.
- Create `docs/agent-instructions/` only when retained task-specific, load-bearing guidance justifies it.
- Inspect repository documentation, configuration, scripts, CI, and relevant source before making factual claims.
- Include in-scope checked-in instruction sources in the inventory. Do not alter other instruction systems unless explicitly requested.

## Outcome

Make the edits, then report:

- files created, changed, moved, or removed;
- notable guidance removed or disclosed, with the reason;
- suggested follow-up updates or unresolved contradictions for the user to decide;
- validation performed and any uncertainty.

User Request:
$ARGUMENTS
