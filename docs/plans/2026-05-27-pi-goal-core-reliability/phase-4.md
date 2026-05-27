# Phase 4: Coalesced Persistence and Documentation

**Goal:** Reduce redundant runtime session-entry writes while preserving durable state at lifecycle, budget, compaction, and shutdown boundaries; document the reliability behavior after implementation.

**Tasks:** 3 related tasks.

### Task 1: Add goal equivalence and persistence coalescing tests

**Files:**
- Modify: `.pi/extensions/pi-goal/state.ts`
- Modify: `.pi/extensions/pi-goal/state.test.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Write failing pure equivalence tests**

Append these tests to `.pi/extensions/pi-goal/state.test.ts` and import `goalsEquivalent`:

```ts
test("goalsEquivalent compares persisted goal fields", () => {
  const first = activeGoal({ updatedAt: 1000 });
  const same = { ...first };
  const changedUsage = { ...first, tokensUsed: first.tokensUsed + 1 };
  const changedScheduleOnly = { ...first, continuationScheduled: !first.continuationScheduled };

  assert.equal(goalsEquivalent(first, same), true);
  assert.equal(goalsEquivalent(first, changedUsage), false);
  assert.equal(goalsEquivalent(first, changedScheduleOnly), false);
  assert.equal(goalsEquivalent(first, null), false);
  assert.equal(goalsEquivalent(null, null), true);
});
```

- [ ] **Step 2: Write failing runtime coalescing tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("runtime restore and unchanged status refresh do not append duplicate goal entries", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ goalId: "goal-1" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.session_tree[0]({}, ctx);

  assert.equal(pi.entries.length, 0);
});

test("runtime does not append duplicate scheduled-continuation snapshots", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ goalId: "goal-1" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  const afterFirstSchedule = pi.entries.length;
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(pi.entries.length, afterFirstSchedule);
});

test("shutdown flushes changed active goal usage once", async () => {
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ clock: () => time }).register(pi as never);
  const goal = activeGoal({ goalId: "goal-1" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.turn_start[0]({}, ctx);
  time = 3000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 12 } } }, ctx);
  const entriesAfterTurn = pi.entries.length;
  await pi.handlers.session_shutdown[0]({}, ctx);

  assert.equal(pi.entries.length, entriesAfterTurn);
});
```

The shutdown test documents that if turn-end already persisted the changed state, shutdown must not append an identical duplicate.

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/state.test.ts ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: FAIL because `goalsEquivalent` and persistence coalescing are not implemented.

### Task 2: Implement coalesced persistence

**Files:**
- Modify: `.pi/extensions/pi-goal/state.ts`
- Modify: `.pi/extensions/pi-goal/index.ts`

- [ ] **Step 1: Implement `goalsEquivalent`**

In `.pi/extensions/pi-goal/state.ts`, export:

```ts
export function goalsEquivalent(a: GoalState | null, b: GoalState | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.version === b.version
    && a.goalId === b.goalId
    && a.objective === b.objective
    && a.status === b.status
    && a.tokenBudget === b.tokenBudget
    && a.tokensUsed === b.tokensUsed
    && a.timeUsedSeconds === b.timeUsedSeconds
    && a.turnCount === b.turnCount
    && a.continuationCount === b.continuationCount
    && a.lastContinuationHadToolCall === b.lastContinuationHadToolCall
    && a.continuationSuppressed === b.continuationSuppressed
    && a.continuationScheduled === b.continuationScheduled
    && a.createdAt === b.createdAt
    && a.updatedAt === b.updatedAt;
}
```

Do not omit `continuationScheduled` in this local extension because scheduled state is currently persisted and reconstruction clears it after reload. If implementation later makes scheduled state runtime-only, update this function and tests in the same commit.

- [ ] **Step 2: Track last persisted goal in runtime**

In `.pi/extensions/pi-goal/index.ts`:

- Import `goalsEquivalent` and `cloneGoal` from `state.ts`.
- Add runtime variables inside `createGoalExtension`:

```ts
let lastPersistedGoal: GoalState | null = null;
let lastRuntimePersistAt: number | null = null;
const runtimePersistIntervalMs = 60_000;
```

- In `restore`, after `currentGoal = reconstructGoal(branch)`, set `lastPersistedGoal = currentGoal ? cloneGoal(currentGoal) : null`.
- In `clear`, set `lastPersistedGoal = null` after appending the clear entry.

- [ ] **Step 3: Replace `persist` with coalesced helpers**

Keep the existing `persist(pi, goal)` function name but change it to skip unchanged snapshots:

```ts
function persist(pi: Pick<ExtensionAPI, "appendEntry">, goal: GoalState, options: { force?: boolean } = {}): boolean {
  currentGoal = goal;
  if (!options.force && goalsEquivalent(goal, lastPersistedGoal)) return false;
  pi.appendEntry(ENTRY_TYPE, goalEntry(goal, clock(), statusBarEnabled));
  lastPersistedGoal = cloneGoal(goal);
  lastRuntimePersistAt = clock();
  return true;
}
```

Add:

```ts
function flushRuntimePersistence(pi: Pick<ExtensionAPI, "appendEntry">, force = false): boolean {
  if (!currentGoal) return false;
  if (!force && lastRuntimePersistAt !== null && clock() - lastRuntimePersistAt < runtimePersistIntervalMs && goalsEquivalent(currentGoal, lastPersistedGoal)) return false;
  return persist(pi, currentGoal, { force });
}
```

Use `persist(pi, goal, { force: true })` for lifecycle changes that must be durable even if the helper cannot prove equivalence:

- goal create/replace
- pause/resume
- clear uses existing `clear`
- completion changed from active to complete
- budget crossing

Use non-forced `persist` or `flushRuntimePersistence` for runtime accounting and session boundaries:

- normal `turn_end` usage accounting: non-forced persist is fine because usage changed
- `session_compact`: call `flushRuntimePersistence(pi)` before scheduling pending continuation
- `session_shutdown`: call `flushRuntimePersistence(pi)` before clearing runtime variables

- [ ] **Step 4: Avoid duplicate scheduled continuation entries**

In `scheduleContinuation`, persist the `continuationScheduled: true` snapshot only once. If `currentGoal.continuationScheduled` is already true, return false before creating a new pending message.

`shouldScheduleContinuation` already checks this; keep the check and ensure repeated `agent_end` does not append duplicate entries.

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/state.test.ts ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: PASS.

### Task 3: Update documentation and run full verification

**Files:**
- Modify: `docs/PI-GOAL.md`
- Modify: `docs/plans/2026-05-27-pi-goal-core-reliability/design.md` only if implementation materially diverged from the approved design

- [ ] **Step 1: Update `docs/PI-GOAL.md` implementation notes**

In `docs/PI-GOAL.md`, update the runtime/context sections to mention these implemented behaviors:

- Provider context keeps only the latest active hidden continuation runnable.
- Older active continuations are rewritten to superseded bookkeeping markers instead of being left as full runnable prompts.
- Stale continuations for old, cleared, completed, or replaced goals are rewritten/cancelled and must not perform work.
- Runtime persistence is coalesced so unchanged snapshots are not appended repeatedly, while lifecycle changes and budget crossings remain durable.
- Completed goals are terminal for pause/resume/automatic continuation, and duplicate `update_goal complete` is idempotent.

Do not document provider-error/context-overflow recovery as implemented.

- [ ] **Step 2: Run full local pi-goal test suite**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run reference package tests if dependencies are installed**

Run:

```bash
cd pi-codex-goal
npm test
```

Expected: PASS for `pi-codex-goal` reference tests. If this fails because dependencies were not installed, run `npm install` in `pi-codex-goal` and retry. If it fails for unrelated upstream reference-package reasons, record the failing test names and continue only if local `.pi/extensions/pi-goal/*.test.ts` passed.

- [ ] **Step 4: Search for forbidden scope creep**

Run:

```bash
grep -RInE 'context overflow|provider error|recovery-machine|multi-goal|DAG|prefix' .pi/extensions/pi-goal docs/PI-GOAL.md
```

Expected: No new implementation claims for provider-error/context-overflow recovery, multi-goal queues, DAGs, or configurable prefixes. Existing design/non-goal references are acceptable only under `docs/plans/2026-05-27-pi-goal-core-reliability/`.

- [ ] **Step 5: Commit**

```bash
git add .pi/extensions/pi-goal/state.ts .pi/extensions/pi-goal/state.test.ts .pi/extensions/pi-goal/index.ts .pi/extensions/pi-goal/runtime.test.ts docs/PI-GOAL.md docs/plans/2026-05-27-pi-goal-core-reliability/design.md
git commit -m "perf(pi-goal): coalesce goal persistence"
```

## Phase Verification

- [ ] All local pi-goal tests pass:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

- [ ] Reference tests pass or unrelated reference-package failures are recorded:

```bash
cd pi-codex-goal
npm test
```

- [ ] `docs/PI-GOAL.md` accurately describes implemented reliability behavior and does not claim deferred provider-error/context-overflow recovery.
- [ ] Public API remains compatible: `/goal`, `--budget`, `--tokens`, `get_goal`, `create_goal`, and `update_goal` still exist.
