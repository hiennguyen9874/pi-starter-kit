# Output Contract

## Root `AGENTS.md`

The root file is a small resident interface, not a repository handbook. Include only sections supported by retained content; do not add empty headings.

Eligible content:

- a brief repository purpose when it is not obvious from existing entry points;
- universal, non-derivable constraints;
- safety-critical prohibitions;
- repository-wide gotchas and failure contracts;
- non-standard conventions that apply broadly;
- an instruction index linking to task-specific files.

An instruction-index entry states:

1. the exact file under `docs/agent-instructions/`;
2. the task condition that should trigger reading it;
3. a short description only when the filename and trigger are insufficient.

Use a list or table to match local documentation style. Include no index when there are no detailed files.

Root content is ineligible merely because it is useful. Exclude information that is derivable, task-specific, duplicated, or already enforced mechanically.

## Detailed Instructions

Files under `docs/agent-instructions/` contain task-specific, load-bearing guidance. Organize files by a task an agent recognizes before acting, not by a generic documentation taxonomy.

Each file must have:

- a descriptive lowercase filename;
- a clear title;
- retained project-specific guidance for its task scope.

The root index supplies the loading trigger. Repeat it inside the file only when doing so clarifies scope. Add commands, paths, rationale, gotchas, or related links only when they carry useful information. Fixed section templates are not required.

Prefer an existing authoritative repository document or source file over copying its contents. Link to it and state only the non-obvious instruction needed to use it correctly.

## File Boundaries

- Detailed instructions live only under `docs/agent-instructions/`.
- Do not create nested `AGENTS.md` files.
- Do not create or modify tool-private instruction files unless the user explicitly expands scope.
- Do not mirror the same guidance into both `AGENTS.md` and `CLAUDE.md`.
- Reuse existing detailed files when their task boundary remains accurate.
- Remove detailed files made empty or obsolete by the refactor when they are in scope and have no non-instruction purpose.

## Quality Gates

The result is acceptable only when:

- every resident line earns its recurring context cost;
- task-specific context loads through an explicit trigger;
- each retained meaning has one source of truth;
- no content was invented to fill a template;
- commands and paths are exact and verified;
- links resolve;
- safety rules cannot be missed because they were lazily loaded;
- the structure reflects actual repository needs rather than a preferred file count.
