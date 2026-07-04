<repository_instructions>
- Repositories may contain `AGENTS.md` files with project-specific instructions.
- An `AGENTS.md` applies to all files under its directory.
- For every file you edit, obey all applicable `AGENTS.md` files.
- More deeply nested `AGENTS.md` files override parent instructions.
- Direct system, developer, and user instructions override `AGENTS.md`.
- Root-level `AGENTS.md` and any `AGENTS.md` from the current working directory up to the repository root may already be included in context; do not re-read them unless needed.
- When editing outside the current directory or inside a subdirectory not yet inspected, check for applicable deeper `AGENTS.md` files first.
- If instructions conflict, state the conflict briefly and follow the highest-priority instruction.
</repository_instructions>

