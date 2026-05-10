---
name: pi-goal
description: Use when a user wants to run Pi /goal, create a long-running autonomous coding objective, avoid repeated “continue” prompts, set token budgets, pause/resume/clear goals, or learn how to prepare effective goal documents and acceptance criteria for pi-goal.
---

# Pi Goal

## Overview

`pi-goal` is for long-running coding work that has a clear destination. It keeps one active objective moving through visible first execution and hidden follow-up continuations until the goal is paused, cleared, budget-limited, or explicitly completed.

Do not treat `/goal` as “make the agent run for a long time.” Treat it as “give the agent a well-specified objective, progress system, and completion test so it can keep working without repeated `continue` prompts.”

## When to Use

Use `/goal` when the task:

- needs multiple turns of investigation, editing, testing, or documentation
- has a concrete outcome that can be verified
- can be broken into phases or checklist items
- benefits from persistent progress notes in files
- would otherwise require the user to keep prompting “continue”

Do not use `/goal` for:

- quick one-shot questions or tiny edits
- vague exploration with no acceptance criteria
- tasks that require frequent user decisions
- unsafe or irreversible changes without explicit approval
- “run longer” as the only objective

## Command Quick Reference

| Command | Purpose |
|---|---|
| `/goal <objective>` | Create or replace the current goal and start the first visible model turn. |
| `/goal <objective> --budget 12k` | Create a goal with a token budget. Supports integers plus `k`/`M` suffixes. |
| `/goal` or `/goal status` | Show current goal state. |
| `/goal pause` | Pause automatic continuation. |
| `/goal resume` | Resume and schedule hidden continuation when idle. |
| `/goal clear` | Clear the current goal. |

Only one goal exists at a time.

## Model Tools

`pi-goal` also exposes model tools:

- `get_goal` — read current goal state, including no-goal, paused, budget-limited, or complete states.
- `create_goal` — create a goal from an explicit user request.
- `update_goal` — mark an active goal `complete` only after evidence proves completion.

Completion should be evidence-backed. Do not mark complete because a proxy signal happened; tests passing is useful evidence, but the goal is complete only when the stated acceptance criteria are met.

## Completion Audit

Before allowing a goal to complete, audit the work:

1. Restate the objective as concrete deliverables.
2. Map every requirement to evidence: changed files, test output, smoke checks, review notes, or documented decisions.
3. Check coverage of the full objective; passing tests alone do not prove completion if the goal asked for more.
4. Identify missing, incomplete, or unverified items.
5. Only use `update_goal({ status: "complete" })` when the audit passes.

Tell users to include what evidence counts as done in the original goal objective.

## Goal Readiness Grill

Before starting a serious `/goal`, grill the user or the plan until these answers are clear. Ask one question at a time when needed.

1. **Objective:** What exact problem should be solved?
2. **Acceptance criteria:** How will we know it is done?
3. **Scope boundary:** What should the agent not change?
4. **Plan document:** Where is the phase/checklist file the agent should follow?
5. **Progress record:** Where should progress, blockers, and decisions be written?
6. **Verification:** Which tests, commands, smoke checks, or review steps prove success?
7. **Budget:** Should the run have a token budget?
8. **Stop conditions:** When should the agent pause and ask the user instead of continuing?

If these are missing, help the user create a short plan/checklist before starting `/goal`.

## Good Goal Shape

A strong goal names the work, the source of truth, progress tracking, and verification:

```text
/goal Follow docs/plans/refactor-auth/plan.md to refactor auth middleware phase by phase. 
Keep docs/plans/refactor-auth/progress.md updated after each phase. 
Stop and ask before changing public API behavior. 
Only mark complete after the acceptance criteria in the plan pass and validation commands are recorded. 
--budget 80k
```

A weak goal is vague:

```text
/goal work on auth for a while
```

Improve weak goals by adding:

- the desired final state
- the relevant files or plan document
- acceptance criteria
- verification commands
- progress-update location
- stop/ask boundaries

## Budget Guidance

Token budgets are the main cost-control lever. Use rough starting ranges, then adjust from observed burn rate:

- **Small goal**: single module or about 20 files — `50k` to `150k` tokens.
- **Medium goal**: cross-module or about 50 files — `150k` to `500k` tokens.
- **Large goal**: codebase-wide or 100+ files — `500k` to `2M+` tokens.

Set the first budget conservatively in a new codebase. If the goal becomes `budget_limited`, inspect `/goal status`, update the plan if needed, then `/goal resume` when continuing is still appropriate.

## Recommended Workflow

1. **Plan first.** Create or identify a plan file with phases and acceptance criteria.
2. **Prepare project guidance.** Update `AGENTS.md`, `CONTEXT.md`, or a task plan if the agent needs domain-specific expectations.
3. **Add progress tracking.** Use a checklist, `progress.md`, or phase files so each continuation can recover context from disk.
4. **Start with a clear `/goal`.** Point to the plan and progress file in the objective.
5. **Inspect early output.** If the first run misunderstands quality expectations, pause or clear the goal and improve the plan with a concrete example.
6. **Resume after correction.** Use `/goal resume` when the instructions are ready.
7. **Require evidence.** The model should call `update_goal({ status: "complete" })` only after it has verified the acceptance criteria.

## Lifecycle

```text
User creates goal -> Agent works -> Turn ends -> Hidden continuation -> ... -> Audit passes -> Goal complete
     ^                    |            |                    |
     |                    v            v                    v
  /goal pause      Budget limit   No-tool turn          User input
  /goal resume     -> wrap up     -> suppresses         -> resets suppression
  /goal clear      gracefully        continuation
```

## Runtime Behavior to Remember

- The first goal turn is visible as a normal user message.
- Follow-up continuations are hidden model-visible messages.
- Continuation is blocked when the goal is not active, tools are restricted, Pi is not idle, plan/read-only mode appears active, or the prior hidden continuation did not use tools.
- Crossing the token budget changes the goal to `budget_limited` and steers the model to wrap up instead of starting new work.
- Hidden continuation context is pruned so stale continuation prompts do not accumulate.

## Common Mistakes

| Mistake | Fix |
|---|---|
| “Make it run long” | Define the problem, final state, and acceptance criteria. |
| No plan document | Write a small phased checklist before `/goal`. |
| No progress file | Tell the agent where to record progress and blockers. |
| Acceptance criteria are subjective | Add concrete validation: tests, file checks, smoke steps, review checklist. |
| Agent finishes too early | Add examples of expected quality and update the plan before resuming. |
| Goal keeps going in the wrong direction | `/goal pause`, correct the docs, then `/goal resume` or `/goal clear` and recreate. |
| Agent gets stuck in a loop | `/goal pause`, inspect progress, tighten the plan or stop condition, then resume or clear. |
| Completion is based only on tests | Require evidence that all stated acceptance criteria are satisfied. |

## Starter Template

```text
/goal [objective]. Follow [plan-file]. Track progress in [progress-file].
Acceptance criteria: [criteria].
Do not change [scope boundaries] without asking.
Verify with [commands/checks].
If blocked by [decision/input], pause and ask.
--budget [optional-token-budget]
```
