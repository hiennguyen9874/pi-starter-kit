# Agent Instructions Topic Template

Use this template for files under `docs/agent-instructions/`.

Create only topic files that contain useful project-specific guidance. Omit sections that do not apply.

```markdown
# {Topic}

## Read When

- [Specific task trigger that tells an agent when to read this file.]
- [Another trigger, if useful.]

## Purpose

[What this file helps the agent do. Keep it short.]

## Rules

- [Project-specific actionable rule.]
- [Another rule.]

## Commands

- `[exact command]` — [what it does or verifies]
- `[exact command]` — [when to use it]

## Key Paths

- `{path}` — [purpose]
- `{path}` — [purpose]

## Gotchas

- [Non-obvious failure mode, constraint, or trap.]
- [Another gotcha, if useful.]

## Related Instructions

- [`other-topic.md`](other-topic.md) — [why it is related]
```

## Quality Rules

- Every retained instruction must change agent behavior.
- Prefer exact paths and commands over prose.
- Do not duplicate rules from other topic files; link instead.
- Do not write generic advice like "write clean code" or "add tests where appropriate".
- Mark unknowns with `[ASK: specific question]` instead of guessing.
