# Bootstrap Project Context Prompt Template

## Full Prompt

Use this when you want an agent to begin a new repo conversation with a serious orientation pass.

```text
First, read `AGENTS.md` and `README.md` completely and carefully if they exist. Treat both files as mandatory context, and do not start code investigation until you fully understand the operating instructions, project framing, and documented workflows in them.

Then investigate the codebase to understand the real implementation. Use the repository itself as the source of truth: inspect the top-level structure, package manifests, build and task configuration, primary entrypoints, key modules, important configuration files, and representative tests or architecture docs. Build a grounded understanding of the project's purpose, runtime model, major components, subsystem boundaries, important data or control flows, external integrations, and the commands or workflows that matter for development.

Do not stop at a superficial directory tour. Reconstruct how the system actually works well enough to orient a new agent productively. At the same time, stay efficient: read representative files from each important area rather than exhaustively reading every file in the repo.

Return a concise but complete onboarding summary that includes:
- what the project is for
- the technical architecture and runtime model
- the major components and their responsibilities
- the most important commands, workflows, and repo conventions
- any especially important instructions or constraints from `AGENTS.md`
- open questions or areas that still need deeper inspection
- the next files or directories that would be most useful to read for follow-up work

Make sure your final understanding is grounded in files you actually inspected, not assumptions from naming or stale docs.
```

## Compact Prompt

Use this when you want the same behavior with less scaffolding.

```text
Read `AGENTS.md` and `README.md` completely before doing anything else, then investigate the codebase to build a source-grounded understanding of the project's purpose, architecture, major components, runtime model, workflows, and important commands. Inspect the most informative files first, not just the docs, and return a practical onboarding summary with key conventions, open questions, and the best next files to read.
```

## Adaptation Notes

- Add repo-specific files if there are known architecture docs, handoff files, or onboarding commands worth prioritizing.
- Tighten the output contract when you want a fixed summary shape such as `Purpose`, `Architecture`, `Key Components`, and `Next Reads`.
- Add a request for citations or file references when precise source grounding matters.