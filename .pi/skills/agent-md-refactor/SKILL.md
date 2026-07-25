---
name: agent-md-refactor
description: Audit, create, or refactor AGENTS.md and task-scoped docs/agent-instructions.
disable-model-invocation: true
---

# Agent MD Refactor

Create or refactor a repository's root `AGENTS.md` using **docs-only** progressive disclosure: keep always-loaded guidance small and put retained task-specific guidance under `docs/agent-instructions/`.

This skill is Pi-only. Apply guidance written for `CLAUDE.md` to `AGENTS.md`, but create and edit only `AGENTS.md`. Do not maintain duplicate `AGENTS.md` and `CLAUDE.md` content. If both exist, report material overlap or conflict; edit another instruction system only when the user includes it in scope.

## Leading Words

- **load-bearing** — guidance that changes behavior because it is non-derivable, prevents a specific mistake, records rationale or a failure contract, supplies a non-standard command, or overrides a wrong default.
- **derivable** — information a fresh session can reconstruct reliably with a few repository tool calls. Derivable content does not belong in agent instructions.
- **resident** — guidance loaded for nearly every task. Resident content must justify its recurring context cost.
- **disclose** — move retained task-specific guidance behind a task-triggered link under `docs/agent-instructions/`.

Use `references/classification-rubric.md` to classify content and `references/output-contract.md` to construct the result.

## Modes

| Mode | Result |
|---|---|
| Create | Write a new root `AGENTS.md` and only the detailed files justified by repository-specific guidance. |
| Refactor | Classify all existing content, rewrite the root, migrate retained details, and report notable removals. |
| Audit | Report classifications, contradictions, proposed destinations, and estimated resident savings; make no edits. |

Use Audit mode for review or planning requests. Otherwise, create or refactor when the user asks for implementation. Pause only when a material contradiction or uncertain canonical source requires user judgment.

## Output Model

```text
project-root/
├── AGENTS.md
└── docs/
    └── agent-instructions/
        └── <task-specific files only>
```

`references/output-contract.md` defines the allowed content and file boundaries.

## Process

### 1. Inventory

Inspect the repository and existing instruction sources before deciding what to write. Include the root `AGENTS.md`, `docs/agent-instructions/`, repository documentation, manifests, scripts, CI configuration, formatter/linter configuration, and relevant source needed to verify claims.

Read every in-scope instruction file fully. Note each source's loading scope and any custom syntax worth preserving.

**Completion:** every in-scope instruction source is listed with its loading scope, and every factual instruction has an authoritative repository source or is marked uncertain.

### 2. Classify

Classify every existing instruction or coherent block into exactly one disposition:

1. **Keep resident** — universal, load-bearing guidance for nearly every task.
2. **Disclose** — load-bearing guidance needed only for identifiable tasks.
3. **Delete** — derivable, generic, mechanically enforced, stale, or duplicate content.
4. **Resolve** — materially contradictory or unsafe to interpret without user judgment.

Apply the rubric sentence by sentence. Preserve user-authored safety prohibitions when uncertain. Compare meanings, not just exact wording, and give each retained meaning one authoritative home.

**Completion:** every original instruction is accounted for once; every retained item has a loading scope and destination; every deletion has a reason.

### 3. Rewrite

Resolve material contradictions before incorporating either side. Quote both instructions, explain the behavioral difference, recommend a winner based on shared and current repository evidence, and ask the user which wins.

Write the smallest root file that satisfies `references/output-contract.md`. Disclose task-specific guidance only when enough load-bearing content exists to justify a separate file. Reuse suitable files already under `docs/agent-instructions/`; create no empty or speculative files.

Preserve custom syntax unless conversion is requested. Mark unsupported factual claims as uncertain rather than incorporating them.

For substantial pruning, report notable removed blocks and reasons after editing. Do not copy deleted content into detailed files.

**Completion:** every retained instruction has one authoritative home; the root contains only resident guidance and task-triggered pointers; every detailed file is justified by a real task branch.

### 4. Verify

Check the finished instruction set against the inventory and every quality gate in `references/output-contract.md`. Confirm that every original instruction has a final disposition, root-to-detail links resolve, and unresolved uncertainty or out-of-scope conflicts are reported.

**Completion:** every check passes or the final report identifies the exact unresolved item and its impact.

## Reporting

For Audit mode, report per source:

- content to keep resident;
- content to disclose and its proposed destination;
- content to delete, quoted when practical, with reasons;
- material contradictions requiring a decision;
- approximate resident size before and after when the change is substantial.

For Create or Refactor mode, summarize files changed, notable removals or migrations, validation performed, and material uncertainty. Avoid narrating routine classifications that did not affect the result.
