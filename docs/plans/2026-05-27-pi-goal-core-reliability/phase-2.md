# Phase 2: Terminal Lifecycle and Idempotent State Transitions

**Goal:** Make completion terminal and idempotent while preserving local command/tool behavior for active and paused goals.

**Tasks:** 3 related tasks.

### Task 1: Add pure lifecycle helpers

**Files:**
- Modify: `.pi/extensions/pi-goal/state.ts`
- Modify: `.pi/extensions/pi-goal/state.test.ts`

- [ ] **Step 1: Write failing lifecycle helper tests**

Append these tests to `.pi/extensions/pi-goal/state.test.ts`:

```ts
test("terminal lifecycle helpers prevent reopening completed goals", () => {
  const complete = activeGoal({ status: "complete", updatedAt: 1000 });

  assert.equal(isTerminalGoalStatus("complete"), true);
  assert.equal(isTerminalGoalStatus("cleared"), true);
  assert.equal(isTerminalGoalStatus("active"), false);
  assert.equal(canPauseGoal(complete).ok, false);
  assert.match(canPauseGoal(complete).message, /completed goals are terminal/i);
  assert.equal(canResumeGoal(complete).ok, false);
  assert.match(canResumeGoal(complete).message, /completed goals are terminal/i);
});

test("completeGoalIdempotently returns unchanged complete goals without persistence", () => {
  const complete = activeGoal({ status: "complete", updatedAt: 1000 });
  const result = completeGoalIdempotently(complete, 2000);

  assert.equal(result.goal, complete);
  assert.equal(result.changed, false);
  assert.equal(result.message, "Goal is already complete.");
});

test("completeGoalIdempotently completes active goals once", () => {
  const active = activeGoal({ status: "active", updatedAt: 1000 });
  const result = completeGoalIdempotently(active, 2000);

  assert.equal(result.changed, true);
  assert.equal(result.goal.status, "complete");
  assert.equal(result.goal.updatedAt, 2000);
  assert.equal(result.goal.continuationScheduled, false);
});
```

Update the import from `./state.ts` to include:

```ts
canPauseGoal,
canResumeGoal,
completeGoalIdempotently,
isTerminalGoalStatus,
```

- [ ] **Step 2: Run state tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/state.test.ts
```

Expected: FAIL with missing exports.

- [ ] **Step 3: Implement lifecycle helpers**

In `.pi/extensions/pi-goal/state.ts`, export:

```ts
export interface GoalLifecycleCheck {
  ok: boolean;
  message: string;
}

export function isTerminalGoalStatus(status: GoalStatus): boolean {
  return status === "complete" || status === "cleared";
}

export function canPauseGoal(goal: GoalState): GoalLifecycleCheck {
  if (goal.status === "complete") return { ok: false, message: "Completed goals are terminal and cannot be paused." };
  if (goal.status !== "active") return { ok: false, message: "Only active goals can be paused." };
  return { ok: true, message: "Goal paused." };
}

export function canResumeGoal(goal: GoalState): GoalLifecycleCheck {
  if (goal.status === "complete") return { ok: false, message: "Completed goals are terminal and cannot be resumed." };
  if (goal.status !== "paused") return { ok: false, message: "Only paused goals can be resumed." };
  return { ok: true, message: "Goal resumed." };
}

export function completeGoalIdempotently(goal: GoalState, now = nowMs()): { goal: GoalState; changed: boolean; message: string } {
  if (goal.status === "complete") return { goal, changed: false, message: "Goal is already complete." };
  if (goal.status !== "active") throw new Error("update_goal requires an active goal.");
  return { goal: transitionGoal(goal, "complete", now), changed: true, message: "Goal completed." };
}
```

Do not change `transitionGoal` yet; existing tests rely on it as a low-level transition primitive.

- [ ] **Step 4: Run state tests to verify pass**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/state.test.ts
```

Expected: PASS.

### Task 2: Enforce lifecycle helpers in commands and tools

**Files:**
- Modify: `.pi/extensions/pi-goal/commands.ts`
- Modify: `.pi/extensions/pi-goal/tools.ts`
- Modify: `.pi/extensions/pi-goal/commands-tools.test.ts`
- Modify: `.pi/extensions/pi-goal/index.ts`

- [ ] **Step 1: Write failing command/tool tests**

Append these tests to `.pi/extensions/pi-goal/commands-tools.test.ts`:

```ts
test("/goal pause and resume reject completed goals as terminal", async () => {
  const host = makeHost(createGoal("Done", null, { goalId: "g", now: 1 }));
  host.setGoal({ ...host.getGoal()!, status: "complete" });
  const ctx = makeCtx();

  await handleGoalCommand(host, "pause", ctx as never);
  assert.equal(host.getGoal()?.status, "complete");
  assert.match(ctx.notifications.at(-1)?.message ?? "", /completed goals are terminal/i);

  await handleGoalCommand(host, "resume", ctx as never);
  assert.equal(host.getGoal()?.status, "complete");
  assert.match(ctx.notifications.at(-1)?.message ?? "", /completed goals are terminal/i);
});

test("duplicate update_goal complete is idempotent", async () => {
  const { tools, getGoal } = captureTools(createGoal("Build", 100, { goalId: "g", now: 1 }));

  await tools.update_goal.execute("tool-1", { status: "complete" }, undefined, undefined, {});
  const first = getGoal();
  const second = await tools.update_goal.execute("tool-2", { status: "complete" }, undefined, undefined, {});

  assert.equal(getGoal(), first);
  assert.match(second.content[0].text, /already complete|Goal achieved/i);
});
```

The second test may initially fail because the test helper `captureTools().completeGoal` throws for non-active goals. Update the helper in the next step to mirror production behavior after implementing production.

- [ ] **Step 2: Run command/tool tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/commands-tools.test.ts
```

Expected: FAIL because commands currently allow completed goals to transition through low-level `transitionGoal`, and duplicate complete is not idempotent.

- [ ] **Step 3: Update command pause/resume behavior**

In `.pi/extensions/pi-goal/commands.ts`:

- Import `canPauseGoal` and `canResumeGoal`.
- In the pause/resume branch, call the correct helper before `transitionGoal`.
- If the helper returns `ok: false`, notify with `warning` and return without mutating.
- If `ok: true`, transition to `paused` or `active`, set the goal, and notify with the helper message.

The branch shape should be:

```ts
const check = parsed.action === "pause" ? canPauseGoal(current) : canResumeGoal(current);
if (!check.ok) {
  ctx.ui.notify(check.message, "warning");
  return;
}
const next = transitionGoal(current, parsed.action === "pause" ? "paused" : "active");
host.setGoal(next, "command", ctx);
ctx.ui.notify(check.message, "info");
return;
```

Keep replacement behavior unchanged: non-terminal existing goals still require confirmation/UI, and completed goals may be replaced by `/goal <objective>` as they can today.

- [ ] **Step 4: Update tool completion behavior**

In `.pi/extensions/pi-goal/index.ts`, update the `completeGoal` host implementation passed to `registerGoalTools`:

- If no goal exists, throw `No goal is set.`.
- Call `completeGoalIdempotently(currentGoal, clock())`.
- If `changed` is false, do not set `pendingCompletionGoalId`.
- If `changed` is true, set `pendingCompletionGoalId = currentGoal.goalId` and return the completed goal for tool response.
- Keep the existing deferred turn-end persistence path for changed completions.

Expected shape:

```ts
const result = completeGoalIdempotently(currentGoal, clock());
if (!result.changed) return result.goal;
pendingCompletionGoalId = currentGoal.goalId;
refreshStatus(ctx as ExtensionContext);
return result.goal;
```

In `.pi/extensions/pi-goal/tools.ts`, no schema change is needed. Keep `update_goal` accepting only `complete`.

Update the `captureTools` test helper in `.pi/extensions/pi-goal/commands-tools.test.ts` so its `completeGoal` returns the same object without throwing when `goal.status === "complete"`.

- [ ] **Step 5: Run command/tool and runtime tests**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/commands-tools.test.ts ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: PASS. If a runtime test asserts completed goals can be resumed, update it to expect terminal rejection.

### Task 3: Prevent scheduling for terminal goals and duplicate completion entries

**Files:**
- Modify: `.pi/extensions/pi-goal/index.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Write failing runtime tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("completed goals do not resume automatic continuation", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ status: "complete" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 0);
});

test("duplicate complete tool call does not append duplicate terminal entries", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ status: "complete" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  const before = pi.entries.length;
  const result = await pi.tools.update_goal.execute("tool", { status: "complete" }, undefined, undefined, ctx);

  assert.equal(pi.entries.length, before);
  assert.match(result.content[0].text, /Goal achieved|complete/i);
});
```

- [ ] **Step 2: Run runtime tests to verify failure**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/runtime.test.ts
```

Expected: FAIL until duplicate completion behavior is idempotent in production runtime.

- [ ] **Step 3: Make duplicate completion non-persistent**

In `.pi/extensions/pi-goal/index.ts`:

- Ensure idempotent `completeGoal` does not call `persist` directly.
- Ensure `turn_end` only emits completion events and notifications when `pendingCompletionGoalId === result.goal.goalId`.
- Ensure `pendingCompletionGoalId` is cleared after a changed completion is persisted.

`shouldScheduleContinuation` already rejects non-`active` goals; do not add duplicate checks unless a failing test proves it necessary.

- [ ] **Step 4: Run all local pi-goal tests**

Run:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .pi/extensions/pi-goal/state.ts .pi/extensions/pi-goal/state.test.ts .pi/extensions/pi-goal/commands.ts .pi/extensions/pi-goal/tools.ts .pi/extensions/pi-goal/commands-tools.test.ts .pi/extensions/pi-goal/index.ts .pi/extensions/pi-goal/runtime.test.ts
git commit -m "fix(pi-goal): make goal completion terminal and idempotent"
```

## Phase Verification

- [ ] All local pi-goal tests pass:

```bash
cd pi-codex-goal
node --import tsx --test ../.pi/extensions/pi-goal/*.test.ts
```

- [ ] Existing command parsing for `--budget` and `--tokens` still passes.
- [ ] Completed goals cannot be paused, resumed, or continued automatically.
