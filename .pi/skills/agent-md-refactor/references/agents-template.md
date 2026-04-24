# Root AGENTS.md Template

Use this template for repository-root `AGENTS.md` or equivalent root agent instruction files.

Keep this file concise. Move detailed instructions to `docs/agent-instructions/` and link them through the instruction index.

```markdown
# AGENTS.md

[One-sentence project description.]

## Quick Reference

- Install: `[exact command or "Unknown; see <file>"]`
- Run: `[exact command or "Unknown; see <file>"]`
- Test: `[exact command or "Unknown; see <file>"]`
- Build: `[exact command or "Unknown; see <file>"]`
- Full checks: `[exact command or "Unknown; see <file>"]`

## Mini Repo Map

- `src/` — [short purpose]
- `tests/` — [short purpose]
- `docs/` — [short purpose]
- `scripts/` — [short purpose]

## Instruction Index

Read these only when task matches scope:

| File | Read when | Contains |
|---|---|---|
| `docs/agent-instructions/overview.md` | You need project purpose, major components, or responsibility boundaries | Project overview, domain, ownership, high-level architecture |
| `docs/agent-instructions/build-system.md` | You need install/build/run/test details beyond quick reference | Tooling, prerequisites, command details, generated outputs |
| `docs/agent-instructions/development-workflow.md` | You need local workflow, PR expectations, or common task flow | Development loop, checks, branch/PR guidance |
| `docs/agent-instructions/testing.md` | You add/change tests or debug test failures | Test frameworks, commands, fixtures, patterns |
| `docs/agent-instructions/code-style.md` | You edit code and need project-specific style beyond formatter defaults | Naming, imports, formatting, structure rules |
| `docs/agent-instructions/architecture.md` | You change boundaries, data flow, APIs, storage, or module responsibilities | Components, dependencies, data flow, module map |
| `docs/agent-instructions/config-and-env.md` | You touch config, env vars, local services, or secrets handling | Config files, env vars, service setup, secret rules |
| `docs/agent-instructions/security.md` | You touch auth, permissions, secrets, validation, or network calls | Security rules, threat-sensitive paths, gotchas |
| `docs/agent-instructions/deployment.md` | You change packaging, release, infra, CI/CD, or environment behavior | Deployment, release, CI/CD, environment notes |
| `docs/agent-instructions/troubleshooting.md` | Commands fail or a known issue appears | Failure modes and fixes |

## Critical Rules

- [Only universal, high-priority rule that applies to nearly every task.]
- [Another universal rule, if needed.]
```

## Notes

- Keep only relevant instruction index rows. Do not create empty detailed files just to satisfy this template.
- Use exact commands from repository files. Do not invent commands.
- Keep mini repo map short; put detailed maps in `docs/agent-instructions/architecture.md` or another relevant topic file.
- Critical rules must be project-specific and change agent behavior.
