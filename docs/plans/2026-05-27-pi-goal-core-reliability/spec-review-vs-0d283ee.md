# Spec Review

## What Was Done Well
- Phase-count cap is respected: the design marks this as a medium change with a maximum of 5 phases, and the plan uses 4 phases (`docs/plans/2026-05-27-pi-goal-core-reliability/design.md`, `plan.md`).
- Phase 1 is largely implemented as planned: compact continuation prompting and provider-context rewriting exist in `.pi/extensions/pi-goal/prompts.ts`, `.pi/extensions/pi-goal/queued-goal-messages.ts`, and `.pi/extensions/pi-goal/queued-goal-work.ts`, with focused tests in `.pi/extensions/pi-goal/prompts.test.ts` and `.pi/extensions/pi-goal/queued-goal-work.test.ts`.
- Phase 4 persistence coalescing is implemented and covered: `goalsEquivalent` exists in `.pi/extensions/pi-goal/state.ts`, runtime coalescing is wired in `.pi/extensions/pi-goal/index.ts`, and duplicate-write regression tests were added in `.pi/extensions/pi-goal/runtime.test.ts`.
- Local extension verification was run and passed: `cd pi-codex-goal && node --import tsx --test ../.pi/extensions/pi-goal/prompts.test.ts ../.pi/extensions/pi-goal/queued-goal-work.test.ts ../.pi/extensions/pi-goal/stale-queued-work-guard.test.ts ../.pi/extensions/pi-goal/state.test.ts ../.pi/extensions/pi-goal/runtime.test.ts`.

## Requirement Mismatches
- **[problematic deviation] Phase 2 terminal lifecycle is not enforced in commands/tools/runtime.**
  - Requirement: `docs/plans/2026-05-27-pi-goal-core-reliability/phase-2.md:116-216,228-316` requires pause/resume to reject completed goals, and `update_goal complete` to be idempotent via `completeGoalIdempotently`.
  - Evidence:
    - `.pi/extensions/pi-goal/commands.ts:74-81` still calls `transitionGoal(...)` directly for both `/goal pause` and `/goal resume`, so a completed goal can be moved to `paused` or back to `active`.
    - `.pi/extensions/pi-goal/index.ts:291-297` still throws on any non-`active` goal and never calls `completeGoalIdempotently`, so duplicate `update_goal complete` is not idempotent.
    - `.pi/extensions/pi-goal/state.ts:195-214` adds the phase-2 helper APIs, but production command/tool paths do not use them.
  - Why it matters: this leaves completion non-terminal in command flow and contradicts the planned idempotent tool behavior.

- **[problematic deviation] Phase 3 stale queued-work protection is only partial; stale turns are detected for accounting, but not aborted before work.**
  - Requirement: `docs/plans/2026-05-27-pi-goal-core-reliability/phase-3.md:3-4,247-269` requires stale queued continuation turns to not mutate state or perform work, to apply guard effects including `abort`, and to fall back to `event.message` parsing when `details.goalId` is absent.
  - Evidence:
    - `.pi/extensions/pi-goal/index.ts:377-378` only reads `event.details?.goalId`; it does not implement the planned fallback to parse the queued goal id from `event.message`.
    - `.pi/extensions/pi-goal/index.ts:389-398` does not call `applyStaleQueuedWorkEffects(plan.effects, ctx)` and never invokes `ctx.abort?.()` on stale turns, even though `.pi/extensions/pi-goal/index.ts:99-107` defines that helper.
  - Why it matters: the runtime avoids charging usage and requeueing, but it does not satisfy the stronger phase goal of preventing stale hidden turns from running and mutating workspace state.

## Plan Deviations
- **[problematic deviation] Phase 2 Task 2/3 test work was not implemented.**
  - Requirement: `docs/plans/2026-05-27-pi-goal-core-reliability/phase-2.md:124-224,234-316` calls for new command/tool/runtime tests covering completed-goal pause/resume rejection, duplicate complete idempotency, and no automatic continuation for completed goals.
  - Evidence:
    - `.pi/extensions/pi-goal/commands-tools.test.ts:84-167` still covers only happy-path pause/resume and one-shot completion; it has no completed-goal rejection or duplicate-complete test.
    - `.pi/extensions/pi-goal/runtime.test.ts:406-418` keeps a non-active rejection test instead of the planned duplicate-complete idempotency coverage.

- **[problematic deviation] `docs/PI-GOAL.md` documents terminal/idempotent lifecycle behavior that the implementation does not yet provide.**
  - Requirement: `docs/plans/2026-05-27-pi-goal-core-reliability/phase-4.md:207-217` says to document implemented behavior after the implementation exists.
  - Evidence: `docs/PI-GOAL.md:92-94` claims completed goals are terminal for pause/resume/automatic continuation and duplicate `update_goal complete` is idempotent, but the code paths above do not implement that behavior.

## Scope Creep / Missing Scope
- **Missing scope:** the phase-2 command/tool enforcement and idempotent completion wiring are still missing from production behavior.
- **Missing scope:** the phase-3 `event.message` fallback and stale-turn abort behavior are still missing.
- **Scope creep:** none material observed in the diff.

## Tests vs Required Behavior
- Local `.pi/extensions/pi-goal/*.test.ts` coverage is broad and currently passes.
- Coverage still misses key planned acceptance checks:
  - no command/tool test proving completed goals cannot be paused or resumed;
  - no test proving duplicate `update_goal complete` is idempotent for an already completed goal;
  - no runtime test asserting stale queued work triggers `ctx.abort?.()` before the turn can run;
  - no runtime test covering queued-goal-id extraction from `event.message` when `details.goalId` is absent.
- Current stale runtime tests (`.pi/extensions/pi-goal/runtime.test.ts:490-563`) prove no usage/requeueing after the fact, but not that stale work is aborted before execution.
- Reference-package verification (`cd pi-codex-goal && npm test`) was not run as part of this review.

## Spec Alignment Verdict
- **Fail**
- **Reason:** Phase 1 and Phase 4 are mostly aligned, but two blocking plan requirements remain unmet: completed-goal lifecycle is not terminal/idempotent in the production command/tool paths, and stale queued work is not aborted before it can run. The documentation also overclaims the missing Phase 2 behavior.

## Required Fixes
1. Wire Phase 2 helpers into production behavior: use `canPauseGoal`/`canResumeGoal` in `.pi/extensions/pi-goal/commands.ts`, use `completeGoalIdempotently` in `.pi/extensions/pi-goal/index.ts` for `update_goal`, and add the missing command/tool/runtime regression tests from `phase-2.md`.
2. Finish Phase 3 runtime wiring: in `turn_start`, derive queued goal id from `event.details?.goalId` or `event.message`, and apply `applyStaleQueuedWorkEffects(plan.effects, ctx)` so stale queued turns call `ctx.abort?.()` before work proceeds.
3. Update `docs/PI-GOAL.md` only after the Phase 2 lifecycle behavior is actually implemented, or remove the current terminal/idempotent claims in the meantime.

## Finding Status Update

### Requirement Mismatches
- **Phase 2 terminal lifecycle not enforced in commands/tools/runtime** — **fixed**.
  - Verified and updated `.pi/extensions/pi-goal/commands.ts` to use `canPauseGoal`/`canResumeGoal`.
  - Verified and updated `.pi/extensions/pi-goal/index.ts` `completeGoal` path to use `completeGoalIdempotently`.
  - Added regression coverage in `.pi/extensions/pi-goal/commands-tools.test.ts` and `.pi/extensions/pi-goal/runtime.test.ts`.
- **Phase 3 stale queued-work protection only partial** — **fixed**.
  - Verified and updated `.pi/extensions/pi-goal/index.ts` `turn_start` to derive queued goal id from `event.details?.goalId` or `event.message` via `continuationGoalIdFromMessage`.
  - Verified and updated stale path to apply `applyStaleQueuedWorkEffects(plan.effects, ctx)` so `ctx.abort?.()` is executed.

### Plan Deviations
- **Phase 2 Task 2/3 test work not implemented** — **fixed**.
  - Added missing lifecycle/idempotency tests in `.pi/extensions/pi-goal/commands-tools.test.ts` and `.pi/extensions/pi-goal/runtime.test.ts`.
- **`docs/PI-GOAL.md` overclaims terminal/idempotent behavior** — **rejected with reason**.
  - After verification and code fixes above, the documented terminal/idempotent behavior is now implemented, so no doc rollback is required.
