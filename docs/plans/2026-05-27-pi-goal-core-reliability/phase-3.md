# Phase 3: Stale Queued-Work Runtime Protection

**Goal:** Prevent late or stale hidden continuation turns from charging usage, mutating state, or requeueing continuation for the wrong goal.

**Tasks:** 3 related tasks.

### Task 1: Add a small stale queued-work guard

**Files:**
- Create: `.pi/extensions/pi-goal/stale-queued-work-guard.ts`
- Create: `.pi/extensions/pi-goal/stale-queued-work-guard.test.ts`

- [ ] **Step 1: Write failing guard tests**

Create `.pi/extensions/pi-goal/stale-queued-work-guard.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import {
  createStaleQueuedWorkGuard,
  type StaleQueuedWorkEffect,
} from "./stale-queued-work-guard.ts";

function effectTypes(effects: readonly StaleQueuedWorkEffect[]): string[] {
  return effects.map((effect) => effect.type);
}

test("guard recognizes current active continuation as runnable", () => {
  const guard = createStaleQueuedWorkGuard();
  const result = guard.planTurnStart({ queuedGoalId: "goal-1", currentGoalId: "goal-1", currentStatus: "active" });

  assert.equal(result.stale, false);
  assert.deepEqual(result.effects, []);
});

test("guard cancels continuation for replaced goal", () => {
  const guard = createStaleQueuedWorkGuard();
  const result = guard.planTurnStart({ queuedGoalId: "old-goal", currentGoalId: "new-goal", currentStatus: "active" });

  assert.equal(result.stale, true);
  assert.deepEqual(effectTypes(result.effects), ["clearAccounting", "refreshUi", "abort"]);
});

test("guard cancels continuation when there is no current goal", () => {
  const guard = createStaleQueuedWorkGuard();
  const result = guard.planTurnStart({ queuedGoalId: "old-goal", currentGoalId: null, currentStatus: null });

  assert.equal(result.stale, true);
  assert.deepEqual(effectTypes(result.effects), ["clearAccounting", "refreshUi", "abort"]);
});

test("guard cancels continuation for terminal current goal", () => {
  const guard = createStaleQueuedWorkGuard();
  const result = guard.planTurnStart({ queuedGoalId: "goal-1", currentGoalId: "goal-1", currentStatus: "complete" });

  assert.equal(result.stale, true);
  assert.deepEqual(effectTypes(result.effects), ["clearAccounting", "refreshUi", "abort"]);
});

test("guard skips post-turn continuation after stale abort", () => {
  const guard = createStaleQueuedWorkGuard();
  guard.planTurnStart({ queuedGoalId: "old-goal", currentGoalId: "new-goal", currentStatus: "active" });

  const result = guard.planAgentEnd({ queuedGoalId: "old-goal" });

  assert.equal(result.skipContinuation, true);
  assert.deepEqual(effectTypes(result.effects), ["clearAccounting", "refreshUi"]);
});
```

- [ ] **Step 2: Run guard tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/stale-queued-work-guard.test.ts
```

Expected: FAIL because the guard module does not exist.

- [ ] **Step 3: Implement `stale-queued-work-guard.ts`**

Create `.pi/extensions/pi-goal/stale-queued-work-guard.ts` with these exports:

```ts
import type { GoalStatus } from "./state.ts";

export type StaleQueuedWorkEffect =
  | { type: "clearAccounting" }
  | { type: "refreshUi" }
  | { type: "abort" };

export interface QueuedWorkSnapshot {
  queuedGoalId: string | null;
  currentGoalId: string | null;
  currentStatus: GoalStatus | null;
}

export interface TurnStartPlan {
  stale: boolean;
  effects: StaleQueuedWorkEffect[];
}

export interface AgentEndPlan {
  skipContinuation: boolean;
  effects: StaleQueuedWorkEffect[];
}

function isRunnable(snapshot: QueuedWorkSnapshot): boolean {
  return snapshot.queuedGoalId !== null
    && snapshot.currentGoalId === snapshot.queuedGoalId
    && snapshot.currentStatus === "active";
}

export function createStaleQueuedWorkGuard() {
  const staleTurnGoalIds = new Set<string>();

  return {
    planTurnStart(snapshot: QueuedWorkSnapshot): TurnStartPlan {
      if (snapshot.queuedGoalId === null || isRunnable(snapshot)) return { stale: false, effects: [] };
      staleTurnGoalIds.add(snapshot.queuedGoalId);
      return { stale: true, effects: [{ type: "clearAccounting" }, { type: "refreshUi" }, { type: "abort" }] };
    },
    planAgentEnd(input: { queuedGoalId: string | null }): AgentEndPlan {
      if (input.queuedGoalId === null || !staleTurnGoalIds.delete(input.queuedGoalId)) {
        return { skipContinuation: false, effects: [] };
      }
      return { skipContinuation: true, effects: [{ type: "clearAccounting" }, { type: "refreshUi" }] };
    },
    clear(): void {
      staleTurnGoalIds.clear();
    },
  };
}
```

This intentionally starts smaller than upstream. It protects the local runtime without copying upstream's broader recovery and terminal-cleanup state machine.

- [ ] **Step 4: Run guard tests to verify pass**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/stale-queued-work-guard.test.ts
```

Expected: PASS.

### Task 2: Wire stale guard into runtime turn boundaries

**Files:**
- Modify: `.pi/extensions/pi-goal/index.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Write failing stale runtime tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("stale continuation after goal replacement does not charge replacement goal or requeue", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => time }).register(pi as never);
  const replacement = activeGoal({ goalId: "new-goal", tokensUsed: 0, turnCount: 0 });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: replacement, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  // Simulate a late hidden turn that was queued for an old goal before replacement.
  await pi.handlers.turn_start[0]({ details: { goalId: "old-goal" } }, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 99 } } }, ctx);
  await pi.handlers.agent_end[0]({ details: { goalId: "old-goal" }, messages: [] }, ctx);

  const persistedGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(persistedGoal.goalId, "new-goal");
  assert.equal(persistedGoal.tokensUsed, 0);
  assert.equal(persistedGoal.turnCount, 0);
  assert.equal(scheduled.length, 0);
});

test("stale continuation after clear does not revive a goal", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "clear", goal: null, clearedGoalId: "old-goal", at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.turn_start[0]({ details: { goalId: "old-goal" } }, ctx);
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 99 } } }, ctx);
  await pi.handlers.agent_end[0]({ details: { goalId: "old-goal" }, messages: [] }, ctx);

  assert.equal(pi.entries.length, 0);
  assert.equal(ctx.statuses["pi-goal"], undefined);
});
```

If the runtime cannot rely on `event.details.goalId`, extract the queued id from event message content by using `continuationGoalIdFromContextMessage` from Phase 1. The tests may use whichever event shape the runtime supports after implementation, but they must prove stale old-goal work cannot mutate new/no goal state.

- [ ] **Step 2: Run runtime tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: FAIL because current runtime does not classify stale queued continuation turns.

- [ ] **Step 3: Add runtime stale-state variables**

In `.pi/extensions/pi-goal/index.ts`:

- Import `createStaleQueuedWorkGuard` and `StaleQueuedWorkEffect`.
- Create one guard instance inside `createGoalExtension`:

```ts
const staleQueuedWorkGuard = createStaleQueuedWorkGuard();
let currentTurnQueuedGoalId: string | null = null;
let currentTurnIsStaleQueuedWork = false;
```

Add helper functions inside `createGoalExtension`:

```ts
function clearActiveTurnAccounting(): void {
  activeTurnStartedAt = null;
  currentTurnHadToolCall = false;
  currentTurnIsContinuation = false;
}

function applyStaleQueuedWorkEffects(effects: readonly StaleQueuedWorkEffect[], ctx: ExtensionContext): void {
  for (const effect of effects) {
    if (effect.type === "clearAccounting") clearActiveTurnAccounting();
    else if (effect.type === "refreshUi") refreshStatus(ctx);
    else if (effect.type === "abort") ctx.abort?.();
  }
}
```

Use optional `ctx.abort?.()` because local fake contexts may not define `abort`.

- [ ] **Step 4: Classify queued goal id at turn start**

In the `turn_start` handler:

- Determine the queued goal id from `event.details?.goalId` if it is a string.
- If no details id is present and `event.message` exists, call `continuationGoalIdFromContextMessage(event.message)`.
- Store it in `currentTurnQueuedGoalId`.
- Call `staleQueuedWorkGuard.planTurnStart({ queuedGoalId, currentGoalId: currentGoal?.goalId ?? null, currentStatus: currentGoal?.status ?? null })`.
- Set `currentTurnIsStaleQueuedWork = plan.stale`.
- Apply effects.
- Only set `currentTurnIsContinuation = true` when the queued id is not stale and matches `awaitingContinuationGoalId`.

- [ ] **Step 5: Skip accounting and requeue for stale turns**

In the `turn_end` handler:

- If `currentTurnIsStaleQueuedWork` is true, call `clearActiveTurnAccounting()`, `syncGoalTools(pi)`, `refreshStatus(ctx)`, and return before `applyGoalUsage`.

In the `agent_end` handler:

- Call `staleQueuedWorkGuard.planAgentEnd({ queuedGoalId: currentTurnQueuedGoalId })` before `ensurePendingContinuation`.
- Apply effects.
- If `skipContinuation` is true, clear `currentTurnQueuedGoalId` and `currentTurnIsStaleQueuedWork`, sync tools/status, and return without `ensurePendingContinuation`.

In `invalidateContinuation`, `clear`, replacement, and `session_shutdown`, clear the guard and stale-turn variables.

- [ ] **Step 6: Run stale runtime tests**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/stale-queued-work-guard.test.ts ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: PASS.

### Task 3: Cover multi-goal stale overlap and context integration

**Files:**
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`
- Modify: `.pi/extensions/pi-goal/queued-goal-work.test.ts`

- [ ] **Step 1: Add multi-goal stale overlap regression**

Add a runtime test that simulates this sequence:

1. Restore active goal A.
2. Schedule A continuation.
3. Replace with goal B through command or direct persisted branch restore.
4. Start a late A continuation turn.
5. Verify B remains active with unchanged `tokensUsed`, `turnCount`, and `continuationCount`.
6. Verify no hidden message for A is sent after `agent_end`.

Use concrete goal ids `goal-a` and `goal-b`. Assert the latest persisted goal id is `goal-b`.

- [ ] **Step 2: Add provider-context stale overlap regression**

Add a queued-work test with messages for goal A and goal B while B is current active:

```ts
const goalA = goal({ goalId: "goal-a" });
const goalB = goal({ goalId: "goal-b" });
const result = applyQueuedGoalProviderContextRewrites([
  { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(goalA), display: false, details: { goalId: "goal-a" } },
  { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(goalB), display: false, details: { goalId: "goal-b" } },
], goalB);

assert.match(String(result.messages[0].content), /stale.*cancelled/i);
assert.match(String(result.messages[1].content), /Continue working toward the active goal/i);
```

- [ ] **Step 3: Run all local pi-goal tests**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .pi/extensions/pi-goal/stale-queued-work-guard.ts .pi/extensions/pi-goal/stale-queued-work-guard.test.ts .pi/extensions/pi-goal/index.ts .pi/extensions/pi-goal/runtime.test.ts .pi/extensions/pi-goal/queued-goal-work.test.ts
git commit -m "fix(pi-goal): ignore stale queued continuation work"
```

## Phase Verification

- [ ] Focused stale tests pass:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/stale-queued-work-guard.test.ts ../.pi/extensions/pi-goal/runtime.test.ts ../.pi/extensions/pi-goal/queued-goal-work.test.ts
```

- [ ] All local pi-goal tests pass:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

- [ ] Stale queued work cannot charge usage, mutate current goal status, revive cleared goals, or schedule follow-up continuation.
