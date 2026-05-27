# Pi Goal Core Reliability Hardening Design

Date: 2026-05-27

## Summary

Update the local `.pi/extensions/pi-goal` extension by porting selected reliability improvements from `pi-codex-goal` while preserving this starter kit's current public API and user experience.

Feature size: **medium**, maximum **5 implementation phases**.

Risk: **medium**. The work affects autonomous continuation scheduling, hidden model-visible context, persisted session entries, and lifecycle transitions. It should improve safety and robustness without changing public commands, tool names, or goal prompt semantics.

## Source Context

Relevant local files inspected:

- `.pi/extensions/pi-goal/index.ts`
- `.pi/extensions/pi-goal/state.ts`
- `.pi/extensions/pi-goal/commands.ts`
- `.pi/extensions/pi-goal/tools.ts`
- `.pi/extensions/pi-goal/prompts.ts`
- `.pi/extensions/pi-goal/*.test.ts`
- `docs/PI-GOAL.md`
- `docs/plans/2026-05-10-pi-goal-extension/design.md`
- `pi-codex-goal/src/*`
- `pi-codex-goal/README.md`
- `pi-codex-goal/CHANGELOG.md`
- recent `pi-codex-goal` git history through `dbbd24e`

Current local `pi-goal` already implements the core feature:

- `/goal`, `/goal pause`, `/goal resume`, `/goal clear`, `/goal status`
- `--budget` and `--tokens` command budget parsing
- `get_goal`, `create_goal`, and `update_goal`
- session custom-entry persistence with custom type `pi-goal`
- hidden continuation messages with custom type `pi-goal-continuation`
- prompt hardening for untrusted objectives and evidence-based completion
- token/time accounting, status footer, visible goal events, and basic context pruning

Recent `pi-codex-goal` history adds stronger reliability patterns:

- bounded provider-context rewriting for repeated hidden continuation messages
- stale queued-work lifecycle handling across replace, clear, complete, compaction, shutdown, and late events
- coalesced runtime persistence to reduce session-log spam
- terminal/idempotent lifecycle transitions
- provider-error and context-overflow recovery
- stronger split runtime harness tests

This design adopts the core reliability patterns and defers provider-error/context-overflow recovery.

## Decisions

User-approved decisions:

1. Use a **targeted hardening port**, not a documentation-only review and not a full rewrite to the upstream package shape.
2. Scope the first implementation to **core reliability only**:
   - bounded continuation context rewriting/deduping
   - stale queued-work protection
   - coalesced persistence
   - lifecycle terminal/idempotency
3. Preserve the current local public API and UX unless a change is required for reliability.

## Approaches Considered

### Approach A — Minimal documentation-only recommendation

Document differences and recommend manual future updates without changing the extension design.

Pros:

- Lowest implementation risk.
- Useful as an audit artifact.

Cons:

- Does not improve the current extension.
- Leaves known reliability gaps around stale continuation work and session-log churn.

### Approach B — Targeted hardening port (selected)

Keep the local extension shape and public behavior, then port selected reliability helpers and tests from `pi-codex-goal` where they fit.

Pros:

- Best balance of robustness and scope.
- Preserves local choices such as `pi-goal` entry types, `/goal --budget`, statusbar commands, and local prompt hardening.
- Lets the implementation improve risky internals without forcing user-visible migration.

Cons:

- Requires careful adaptation because upstream uses different custom entry types, status names, and package assumptions.
- Does not include every upstream recovery feature in this plan.

### Approach C — Full convergence with `pi-codex-goal`

Reshape local `pi-goal` to closely match the upstream package architecture.

Pros:

- Most complete parity with upstream.
- Easier future cherry-picks from upstream.

Cons:

- Larger migration risk.
- May unintentionally change current local UX and state shape.
- Brings package-level concerns that are not needed for this project-local extension.

## Recommendation

Use **Approach B: Targeted hardening port**.

This gives the local extension the most important reliability improvements from `pi-codex-goal` while keeping this starter kit's current UX stable and testable.

## Goals

- Bound hidden continuation context so provider prompts do not accumulate repeated full goal prompts.
- Prevent stale queued goal work from affecting the wrong goal after replace, clear, complete, compaction, shutdown, or late lifecycle events.
- Reduce noisy repeated session custom-entry writes while preserving enough persistence for resume, compaction, branch navigation, and shutdown.
- Make lifecycle transitions terminal and idempotent where appropriate.
- Add focused regression tests for the imported reliability behavior.

## Non-Goals

- Do not rewrite the extension into the upstream npm package architecture.
- Do not rename `/goal`, tools, custom entry type `pi-goal`, or continuation message type `pi-goal-continuation`.
- Do not remove local `/goal --budget` or `/goal --tokens` support.
- Do not change local statusbar or visible goal-event behavior unless tests show it conflicts with reliability fixes.
- Do not implement provider-error or context-overflow recovery in this plan.
- Do not add multi-goal queues, DAG dependencies, package publishing, or configurable command/tool prefixes.

## Public API Compatibility

The implementation must preserve these public behaviors:

- `/goal <objective>` creates or replaces according to current local command behavior.
- `/goal <objective> --budget <tokens>` and `/goal <objective> --tokens <tokens>` remain supported.
- `/goal`, `/goal status`, `/goal pause`, `/goal resume`, `/goal clear`, and statusbar commands remain supported.
- `get_goal`, `create_goal`, and `update_goal` names remain unchanged.
- `update_goal` remains restricted to `status: "complete"`.
- Local prompt hardening remains intact: objectives are untrusted data, completion requires evidence, and budget exhaustion is not completion.

Internal data can gain helper metadata if necessary, but persisted version-1 goal entries must remain readable so existing sessions do not break.

## Architecture

Keep the current modular layout and add focused reliability modules only where they reduce complexity.

Recommended module responsibilities:

| File | Responsibility |
|---|---|
| `.pi/extensions/pi-goal/index.ts` | Runtime wiring, lifecycle hooks, scheduling, accounting integration, persistence flushing, status refresh. |
| `.pi/extensions/pi-goal/state.ts` | Goal state, validation, transitions, reconstruction, compatibility helpers, idempotent lifecycle helpers. |
| `.pi/extensions/pi-goal/queued-goal-messages.ts` | Typed adapters for hidden continuation/custom/user message shapes and goal-id extraction. |
| `.pi/extensions/pi-goal/queued-goal-work.ts` | Provider-context continuation rewriting, deduping, stale-marker generation, compact prompt selection. |
| `.pi/extensions/pi-goal/stale-queued-work-guard.ts` | State machine for late/stale queued work effects: clear accounting, refresh UI, abort stale work, skip continuation requeue. |
| `.pi/extensions/pi-goal/prompts.ts` | Existing full prompts plus optional compact continuation prompt for repeated provider context. |
| `.pi/extensions/pi-goal/*.test.ts` | Existing tests plus focused regression coverage for each reliability behavior. |

If a helper would be small and only used once, keep it in the existing module. Do not create abstractions solely to mirror upstream.

## Data Flow

### Normal goal continuation

1. A goal is active.
2. Runtime schedules a hidden continuation only if the goal is active, not suppressed, not already scheduled, mutating tools are available, Pi is idle, and there are no pending messages.
3. The continuation message carries the current `goalId` in both content marker and details.
4. Before provider context is sent, context rewriting keeps only the latest active continuation runnable.
5. Older active-goal continuations are rewritten to short superseded bookkeeping messages.
6. Continuation execution records usage only for the current active goal.

### Stale queued work

A queued continuation is stale when its goal id does not match the current active goal or when the current goal is no longer active.

When stale queued work is detected:

- do not perform goal work for the stale goal
- do not charge usage to the current or stale goal
- do not pause, complete, budget-limit, or requeue based on stale work
- clear any accounting tied to the stale goal
- refresh UI if needed
- abort the stale run when the runtime hook supports it
- rewrite stale provider-context messages to short cancellation markers

### Coalesced persistence

The runtime should avoid appending a full goal snapshot for every minor runtime event.

Persist immediately when:

- a goal is created, replaced, cleared, paused, resumed, completed, or budget-limited
- a token budget is crossed
- a compact/shutdown boundary needs durable latest usage
- a bounded runtime interval passes during long active work

Skip persistence when:

- the in-memory goal is equivalent to the last persisted goal
- duplicate completion would append an identical terminal entry
- stale queued work would otherwise append cleanup noise

The footer/status may use live in-memory usage even when persistence is coalesced.

## Lifecycle Rules

- `complete` is terminal for automatic continuation.
- Duplicate `update_goal({ status: "complete" })` should be idempotent and should not append duplicate persisted entries.
- A completed goal should not be paused or resumed.
- A cleared goal reconstructs as no current goal.
- Replacing a completed goal remains allowed through existing local command behavior.
- Replacing or clearing a goal invalidates all queued continuation state for the previous goal.
- Pausing a goal clears queued continuation state and active accounting.
- Resuming a paused goal creates fresh continuation state for the current goal only.

## Prompt and Context Strategy

Keep the existing local full continuation and init prompts because they are already stronger than the upstream baseline in several areas:

- they preserve the original objective scope
- they treat the objective as untrusted data
- they require requirement-by-requirement evidence before completion
- they warn against redefining success around budget or partial progress

Add a compact continuation prompt only if needed for bounded repeated provider context. The compact prompt must still include:

- goal id marker
- active-goal instruction
- untrusted objective context or a safe compact reference to the current goal
- budget summary
- evidence-based completion rule
- `update_goal` only when complete

Older continuation messages should be rewritten to short bookkeeping text that tells the model not to perform work for the superseded or stale continuation.

## Error Handling

- Validation errors continue to notify the user without mutating state.
- Stale queued work should fail closed: cancel, abort, or no-op rather than continue uncertain work.
- If provider-context message shapes are unknown, preserve the original message unless a goal id can be safely extracted.
- If persistence coalescing cannot prove equivalence, prefer persisting over losing durable state.
- Do not introduce provider-error/context-overflow recovery in this design; leave those failures to existing Pi behavior and a future plan.

## Testing Strategy

Add or update tests for:

1. Provider-context rewriting:
   - latest active continuation remains runnable
   - older active continuations become superseded markers
   - stale continuations become cancellation markers
   - unrelated custom/user messages are preserved
2. Stale queued-work lifecycle:
   - stale continuation after completion cannot requeue work
   - stale continuation after replacement cannot charge or mutate the replacement goal
   - stale continuation after clear cannot revive a goal
   - compaction/shutdown cleanup does not create extra entries
3. Persistence coalescing:
   - unchanged runtime snapshots are not appended repeatedly
   - lifecycle transitions still persist immediately
   - budget crossing persists and sends one steering message
4. Lifecycle idempotency:
   - duplicate complete calls do not append duplicate entries
   - completed goals cannot be paused/resumed/recontinued
   - `create_goal` and `/goal` behavior remains compatible with local rules
5. Regression compatibility:
   - existing command/tool parsing still passes, including `--budget` and `--tokens`
   - existing prompt hardening tests still pass
   - existing runtime scheduling tests still pass or are intentionally updated for stronger semantics

Recommended validation command after implementation:

```sh
npm test -- .pi/extensions/pi-goal
```

If this repository uses a different test runner command for local extensions, use the existing command from package scripts or prior tests instead.

## Success Criteria

The change is successful when:

- the local extension keeps its existing public API and documented behavior
- hidden continuation provider context remains bounded and stale-safe
- stale queued work cannot affect active replacement goals or terminal goals
- runtime persistence writes fewer redundant full goal entries without losing durable state at important boundaries
- terminal/idempotent lifecycle tests pass
- existing `pi-goal` command, tool, prompt, and runtime tests pass after intentional updates
- `docs/PI-GOAL.md` is updated if implementation details materially change

## Assumptions

- The current local extension should remain project-local under `.pi/extensions/pi-goal`.
- Existing session entries with `customType: "pi-goal"` and version `1` must remain reconstructable.
- `pi-codex-goal` is reference code, not a dependency to vendor wholesale.
- Provider-error/context-overflow recovery is valuable but should be designed separately because it changes autonomous retry behavior.

## Open Follow-Up

A future design can evaluate provider-error/context-overflow recovery from `pi-codex-goal`, including host overflow reset phases, bounded transient retry behavior, and user-attention states.
