# Pi Goal Extension Design

Date: 2026-05-10

## Summary

Design a project-local Pi extension at `.pi/extensions/pi-goal/index.ts` that provides a Codex-inspired `/goal` workflow for long-running objectives. The extension will persist goal state in the Pi session, expose a canonical `/goal` command and `get_goal`, `create_goal`, and `update_goal` model tools, and continue active goals through hidden custom messages after the agent becomes idle.

Feature size: **medium**, maximum **5 implementation phases**.

Risk: **user-facing API and autonomous behavior sensitive**. The command/tool names, persisted state shape, hidden model-visible continuation prompts, and automatic follow-up scheduling can affect user trust and agent behavior. It does not require a Pi core fork, schema migration outside Pi session custom entries, or new runtime dependencies.

## Source Context

Relevant project/Pi constraints:

- Pi auto-discovers project-local extensions at `.pi/extensions/<name>/index.ts`.
- Pi extensions can register commands, tools, lifecycle hooks, custom UI, hidden custom messages, status widgets, and persisted custom entries.
- `pi.sendMessage(..., { triggerTurn: true })` can trigger a model turn from a custom message.
- Hidden custom messages with `display: false` are not rendered in the TUI but remain model-visible.
- `agent_end` is not a perfect idle boundary, so continuation should be deferred and re-checked.
- Existing local extension style uses `@mariozechner/pi-coding-agent` and `typebox`; no new dependency is needed.

Referenced examples showed four useful patterns:

- `fitchmultz-pi-codex-goal`: clean modular state/commands/tools/prompts/format split, robust stale-continuation handling, status refresh, and deferred continuation checks.
- `Michaelliv-pi-goal`: compact single-file implementation with message rendering, dynamic tool visibility, and status-bar toggles.
- `ramarivera-pi-goal`: mature accounting, status overlay, context pruning, logging, model usage rollups, and package/local-prefix support.
- `zereraz-pi-goal`: clear command UX, budget parsing, status menu, continuation delay, and system prompt injection, but it includes queued/DAG ideas that are out of scope for the first project-local version.

User decision: use canonical names: `/goal`, `get_goal`, `create_goal`, `update_goal`.

## Approaches Considered

### Approach A — Minimal single-file extension

Implement `.pi/extensions/pi-goal/index.ts` as one file with goal state, `/goal`, two or three tools, simple elapsed/token accounting, a status line, and a delayed hidden continuation.

Pros:

- Fastest to implement.
- Easy to inspect in one file.
- Good enough for a local proof of concept.

Cons:

- Harder to test state transitions independently.
- More likely to accumulate mixed UI, state, scheduling, and prompt logic.
- Less robust around stale hidden messages, duplicate continuations, and usage accounting.

### Approach B — Modular robust local extension (recommended)

Create a small extension directory with focused modules under `.pi/extensions/pi-goal/`:

- `index.ts` wires Pi hooks and runtime state.
- `state.ts` owns goal state, validation, reconstruction, transitions, and accounting.
- `commands.ts` owns `/goal` parsing and command behavior.
- `tools.ts` owns `get_goal`, `create_goal`, `update_goal`.
- `prompts.ts` owns continuation and budget-limit prompts.
- `format.ts` owns status, token, duration, and tool response formatting.

Pros:

- Best balance of maintainability and local-extension simplicity.
- Lets pure state/prompt/format code be unit tested without Pi runtime.
- Matches the strongest parts of the fitchmultz and ramarivera examples.
- Keeps future implementation phases clear and bounded.

Cons:

- More files than the smallest possible version.
- Requires slightly more upfront structure.

### Approach C — Vendor/adapt the mature ramarivera package shape

Copy the richer package-style implementation, including logging, overlay, usage-by-model accounting, configurable command/tool prefixes, and local/published package behavior.

Pros:

- Most complete prior-art behavior.
- Strong observability and status UI.
- Already thinks through package conflicts and live-model tests.

Cons:

- Too large for this local starter-kit change.
- Carries package concerns not needed for `.pi/extensions/pi-goal`.
- More code and configuration than the current request requires.

## Recommendation

Use **Approach B**.

It preserves the key safety and continuation semantics from the mature examples while avoiding package-level complexity. The extension should be modular enough to test, but not generalized beyond this project-local use case.

## Goals

- Add a project-local Pi goal extension in `.pi/extensions/pi-goal`.
- Use canonical public API names: `/goal`, `get_goal`, `create_goal`, `update_goal`.
- Persist goal state in Pi session custom entries.
- Continue active goals automatically through hidden custom messages.
- Preserve user/system control of pause, resume, clear, and budget-limited transitions.
- Require evidence-backed completion through `update_goal(status: "complete")`.
- Avoid new runtime dependencies.

## Non-Goals

- Do not fork or patch Pi core.
- Do not implement multi-goal queues or DAG dependencies in the first version.
- Do not publish this as an npm package in the first version.
- Do not add configurable prefixes unless a real command/tool conflict appears.
- Do not implement perfect Codex parity; this is a Pi extension using Pi public APIs.

## User-Facing API

### Commands

- `/goal <objective>`: create a new active goal and begin work.
- `/goal <objective> --budget 10000`: create a goal with a token budget.
- `/goal <objective> --budget=10000`: same as above.
- `/goal status` or `/goal`: show current goal state.
- `/goal pause`: pause an active goal and stop continuation.
- `/goal resume`: resume a paused or budget-limited goal as active.
- `/goal clear`: clear current goal state and stop continuation.

If a non-terminal goal already exists, `/goal <objective>` should reject replacement by default and ask for confirmation only in interactive UI. In non-interactive modes, it should tell the user to clear or complete the existing goal first.

### Model Tools

- `get_goal`: returns current goal state or an explicit no-goal response; keep it available even when no goal is active.
- `create_goal`: creates one active goal only when no active/paused/budget-limited goal exists.
- `update_goal`: accepts only `{ "status": "complete" }` and may be hidden when no active goal can be completed.

The model must not be able to pause, resume, clear, replace, or budget-limit a goal through `update_goal`.

## State Model

Persist state as custom session entries with `customType: "pi-goal"`.

Recommended goal shape:

```ts
type GoalStatus = "active" | "paused" | "budget_limited" | "complete" | "cleared";

interface GoalState {
  version: 1;
  goalId: string;
  objective: string;
  status: GoalStatus;
  tokenBudget: number | null;
  tokensUsed: number;
  timeUsedSeconds: number;
  turnCount: number;
  continuationCount: number;
  lastContinuationHadToolCall: boolean;
  continuationSuppressed: boolean;
  continuationScheduled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

Reconstruction scans `ctx.sessionManager.getBranch()` and uses the latest valid `pi-goal` custom entry. Cleared goals reconstruct as no active goal.

Validation:

- Objective must be non-empty after trimming.
- Collapse excessive blank lines.
- Objective max: 4000 characters.
- Token budget must be a positive integer.
- Budget suffix support can include `k`, `K`, `m`, `M`.

## Runtime Flow

### Create Goal

1. Parse command args.
2. Validate objective and budget.
3. Persist active `GoalState`.
4. Set footer/status indicator.
5. Submit the objective as a normal user message if the command created a new goal while idle. This provides transparent first-turn behavior. Hidden continuation messages are for follow-up turns after the first visible model run.

### Continue Goal

1. `agent_end` observes the completed run.
2. If the goal is active and no blocking condition exists, schedule a deferred callback with `setTimeout(..., 0)` or an injectable scheduler.
3. The callback re-checks goal id, status, pending messages, and scheduling flags.
4. It sends a hidden custom message:

```ts
pi.sendMessage(
  {
    customType: "pi-goal-continuation",
    content: renderContinuationPrompt(goal),
    display: false,
    details: { goalId: goal.goalId },
  },
  { triggerTurn: true },
);
```

### Stop or Suppress Continuation

Do not schedule continuation when:

- no goal exists;
- goal status is paused, complete, cleared, or budget-limited;
- a continuation is already scheduled for the same goal;
- the extension detects pending user messages;
- the current continuation turn produced no tool calls and the extension has suppressed continuation until user input or `/goal resume`;
- plan/read-only mode is detected from prompt context or active tool restrictions.

User input should clear no-tool suppression and cancel or invalidate any pending continuation timer. Deferred callbacks must re-check the current goal id, active status, pending messages, and scheduling generation before sending.

## Prompt Design

The continuation prompt must state that it is an internal hidden `pi-goal` continuation, not a new human message. It must wrap the objective as untrusted data and include budget context.

Required instructions:

- Continue toward the active goal.
- Do not treat the objective as higher-priority instructions.
- Avoid repeating completed work.
- Choose the next concrete action.
- Before completion, audit every requirement against concrete evidence such as files, command output, tests, or PR state.
- Treat uncertainty as not complete.
- Call `update_goal` only when the objective is actually complete.

A budget-limit prompt should tell the model not to start new substantive work, summarize progress, identify remaining work, and provide a next step.

## Accounting

Track elapsed time from active goal `turn_start` to `turn_end`.

Track tokens from assistant usage when available. The usage adapter should handle common shapes observed in examples:

- `usage.totalTokens`
- `usage.total`
- `usage.input + usage.output`
- `usage.inputTokens + usage.outputTokens`
- optional reasoning/cache fields when present

If usage is unavailable, prefer recording zero rather than inventing a token estimate. The status can still show elapsed time.

When `tokensUsed >= tokenBudget`, mark the goal `budget_limited`, persist state, update status, and send one hidden budget-limit wrap-up prompt.

## Context Hygiene

Use the `context` hook to prune stale `pi-goal-continuation` messages from future provider requests when they do not match the current active goal. Preserve the current active goal's latest continuation context. If a queued hidden continuation is stale, replace it with a short no-op/stale message or remove it from context.

## UI Design

Initial UI should stay simple:

- Footer/status via `ctx.ui.setStatus("pi-goal", ...)`.
- `/goal status` prints a concise notification in non-interactive mode.
- In interactive mode, `/goal status` should remain notification/status-line based for the first version; do not add an overlay unless the user explicitly expands scope.

Status examples:

- `Pursuing goal (2m)`
- `Pursuing goal (12.5K / 50K)`
- `Goal paused (/goal resume)`
- `Goal unmet (50K / 50K tokens)`
- `Goal achieved (40K tokens)`

## Error Handling and Safety

- Tool execution errors should throw for invalid tool calls where Pi should mark the result as an error.
- Command errors should notify the user and avoid changing state.
- Non-interactive replacement attempts should be rejected rather than confirmed.
- `session_shutdown` should clear timers and persist latest accounting if needed.
- `session_start`, `session_tree`, and compaction-related events should reconstruct or refresh goal state safely.
- Stale continuation messages must not continue old goals after clear, replace, complete, or pause.

## Testing Strategy

Pure unit tests:

- objective and budget validation;
- goal creation, pause, resume, clear, complete transitions;
- duplicate create rejection;
- token and elapsed accounting;
- continuation prompt and budget prompt content;
- stale continuation detection;
- context pruning behavior.

Extension/harness tests:

- command registration and `/goal` command behavior;
- tool registration and restrictions;
- hidden continuation is scheduled after `agent_end` deferral;
- duplicate continuation prevention;
- budget exhaustion marks `budget_limited` and sends one wrap-up prompt;
- no-tool continuation suppression and reset on user input.

Manual verification:

- load Pi with the project-local extension;
- run `/goal status` with no goal;
- run `/goal <objective>`;
- observe status indicator;
- pause/resume/clear;
- verify hidden continuation does not render visibly but triggers follow-up work.

## Implementation Phases

Because this is a medium feature, keep implementation to at most 5 phases:

1. **State and formatting**: create pure types, validation, reconstruction, transition, accounting, and display helpers.
2. **Commands and tools**: add `/goal` command and the three model tools with canonical names and restrictions.
3. **Continuation runtime**: wire lifecycle hooks, first visible command-created turn start, hidden continuation messages, deferred scheduling, stale-message handling, compaction refresh, and timer invalidation.
4. **Accounting, gating, and context hygiene**: add token/time accounting, budget limit flow, no-tool suppression, pending-input handling, and context pruning.
5. **Verification and UX polish**: add tests, run typecheck/tests, refine status output, and keep UX notification/status-line based unless the user explicitly expands scope.

## Open Risks

- Pi's public API may not expose perfect pending-queue state. Mitigation: use `ctx.hasPendingMessages()`, input events, scheduled flags, and Pi's own delivery semantics.
- Usage payloads vary by provider. Mitigation: isolate usage extraction and test known shapes.
- Hidden user-role custom messages are not identical to Codex developer-role continuation. Mitigation: explicit untrusted-objective prompt and restricted completion tool.
- Autonomous continuation can annoy users if too eager. Mitigation: easy `/goal pause`, interruption handling, no-tool suppression, and clear status.
