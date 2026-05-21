---
name: handoff
description: Use when compacting the current conversation into a handoff document so another agent or future session can continue the work.
argument-hint: "What will the next session be used for?"
---

# Handoff

Create a concise, structured CONTEXT CHECKPOINT COMPACTION handoff document so another LLM can seamlessly resume the task. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Include:
- Current progress and key decisions made
- Important context, constraints, or user preferences
- What remains to be done, with clear next steps
- Any critical data, examples, or references needed to continue

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
