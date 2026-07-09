# Agent Instructions Topic Template

Use this template for files under `docs/agent-instructions/`.

Create only topic files that contain useful project-specific guidance. Omit sections that do not apply.

## Required sections

- `Read When` — task triggers for loading this file.
- `Purpose` — what this file helps the agent do (short).
- `Rules` — project-specific actionable rules.
- `Commands` — exact commands when relevant.
- `Key Paths` — exact paths when relevant.
- `Gotchas` — non-obvious failure modes.
- `Related Instructions` — links to adjacent topic files when useful.

## Template

```markdown
# {Topic}

## Read When

- [Task trigger that should load this file.]
- [Another trigger.]

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

## Quality rules

- Every retained instruction must be load-bearing.
- Prefer exact paths and commands over prose.
- Link to a rule's home in another topic file instead of restating it.
- Write no generic advice like "write clean code" or "add tests where appropriate".
- Mark unknowns with `[ASK: specific question]` instead of guessing.
