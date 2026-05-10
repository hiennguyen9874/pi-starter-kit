# Review Summary

## What Was Done Well
- Modular shape matches the plan: `state.ts`, `commands.ts`, `tools.ts`, `prompts.ts`, `format.ts`, `index.ts`.
- Canonical names are present: `/goal`, `get_goal`, `create_goal`, `update_goal`.
- The earlier review fixes appear applied: active-tool restriction gating, `session_shutdown` invalidation, and `update_goal` status validation.
- Tests are strong for state, prompts, commands, runtime registration, budget exhaustion, stale scheduled continuations, and tool visibility.

## Decision Resolution

Follow-up grill decisions on 2026-05-10:

- Defer `update_goal(status: "complete")` persistence until `turn_end`, so the final turn is accounted while the goal is still active and then persisted as `complete`.
- Treat any completed `tool_execution_end` as productive tool use for continuation suppression.
- On `/goal resume`, schedule a normal hidden deferred continuation when idle instead of replaying the objective as a visible user message.
- Convert expected `/goal` parse/create validation errors into warning notifications and preserve existing goal state.
- Reject direct or stale `update_goal` execution unless the current goal is `active`.
- Keep only the latest hidden continuation message for the active goal in context.
- Fix all review findings in one pass, including the optional context-pruning refinement.

## Implementation Status

All findings below have been implemented with regression coverage in `.pi/extensions/pi-goal/*.test.ts`. Original finding text is retained for traceability.

## Phase 1: Spec Alignment

### Requirement Mismatches

- **Critical: continuation tool-use detection is still missing.**  
  `currentTurnHadToolCall` is reset at `.pi/extensions/pi-goal/index.ts:228` and consumed at `:244`, but I found no `tool_execution_end` handler setting it to `true`.  
  This means every hidden continuation turn looks like a no-tool turn and can suppress future continuation even when tools were used.  
  Reference: `ramarivera` sets this in `tool_execution_end` at `pi-goal/examples/ramarivera-pi-goal/src/index.ts:966`.

- **Critical: completion-turn usage can be skipped.**  
  `update_goal` completes immediately via `.pi/extensions/pi-goal/index.ts:167-173`; then `turn_end` returns early for non-active goals at `:233-237`.  
  Result: the final completion turn’s elapsed time/tokens may not be accounted before status becomes `complete`.  
  Reference: `fitchmultz` accounts progress before completion at `pi-goal/examples/fitchmultz-pi-codex-goal/src/index.ts:285-291`.

- **Important: `/goal resume` does not immediately restart continuation.**  
  Command-created new goals call `pi.sendUserMessage(...)` at `.pi/extensions/pi-goal/index.ts:186-188`, but resume of an existing goal does not schedule/send a hidden continuation.  
  Reference examples queue continuation on resume.

- **Important: command parse/create errors are not converted to notifications.**  
  Invalid `--budget` or empty objective can throw from `.pi/extensions/pi-goal/commands.ts:35` / `:85`, rather than notifying and preserving state.  
  Reference: `ramarivera` wraps command handling in `try/catch` and notifies at `pi-goal/examples/ramarivera-pi-goal/src/index.ts:809-858`.

### Plan Deviations
- Context pruning removes stale other-goal continuations, but keeps all matching active-goal continuation messages at `.pi/extensions/pi-goal/index.ts:275-280`. The design calls for preserving the latest active continuation context, not accumulating old prompts.

### Scope Creep / Missing Scope
- None obvious. No overlay, package publishing, prefixes, queues, or new dependencies were added.

## Phase 2: Code Quality

### Critical

#### Continuation suppression is triggered incorrectly
- Category: Correctness / autonomous loop
- Files: `.pi/extensions/pi-goal/index.ts:226-245`
- Problem: no event marks `currentTurnHadToolCall = true`.
- Why it matters: long-running goals can stop after the first continuation even after productive tool work.
- Recommended fix: add `pi.on("tool_execution_end", ...)` and a regression test proving continuation continues after a continuation turn with a tool call.
- Timing: Must fix now

#### Final completion accounting is lost
- Category: Accounting correctness
- Files: `.pi/extensions/pi-goal/index.ts:167-173`, `.pi/extensions/pi-goal/index.ts:232-237`
- Problem: completing during a turn changes status before `turn_end`, causing usage accounting to skip.
- Why it matters: final budget report can undercount the actual completion turn.
- Recommended fix: account active turn usage before/inside completion, or defer completion persistence until after accounting.
- Timing: Must fix now

### Important

#### Resume does not trigger follow-up work
- Category: UX / runtime flow
- Files: `.pi/extensions/pi-goal/index.ts:177-188`
- Problem: `/goal resume` sets active but does not send/schedule a continuation.
- Recommended fix: on paused/budget-limited → active resume, queue a hidden continuation when idle.
- Timing: Should fix soon

#### Command errors can escape instead of notifying
- Category: Error handling
- Files: `.pi/extensions/pi-goal/commands.ts:35`, `.pi/extensions/pi-goal/commands.ts:85`
- Problem: invalid budget/objective can throw through the command handler.
- Recommended fix: wrap parse/create in `try/catch`, notify warning, avoid state changes.
- Timing: Should fix soon

#### Tool executor should reject non-active completion
- Category: Defensive boundary
- Files: `.pi/extensions/pi-goal/index.ts:167-173`
- Problem: `update_goal` is hidden when inactive, but direct/stale execution can still complete paused/budget-limited goals.
- Recommended fix: require `currentGoal.status === "active"` in `completeGoal`.
- Timing: Should fix soon

### Suggestions

#### Keep only latest active continuation in context
- Category: Context hygiene
- Files: `.pi/extensions/pi-goal/index.ts:275-280`
- Observation: same-goal old continuations are retained.
- Suggested refinement: keep the latest matching `pi-goal-continuation`, prune older ones.
- Timing: Optional but aligned with plan.

## Tests and Verification
- PASS: `node --test .pi/extensions/pi-goal/*.test.ts` — 43/43 after remediation.
- PASS: `node --test .pi/extensions/profile/*.test.ts` — 42/42 after remediation.
- Auto-discovery file shape exists under `.pi/extensions/pi-goal/`.

## Consolidated Findings

### Critical
- Missing `tool_execution_end` tracking.
- Completion-turn accounting skipped.

### Important
- `/goal resume` does not immediately continue.
- Command errors can escape.
- `update_goal` should reject inactive/stale completion execution.

### Suggestions
- Prune latest active continuation only.

## Recommended Next Actions
- No further remediation action remains for this review after final verification.