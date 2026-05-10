# Phase 4: Gating, Accounting, and Context Hygiene

**Goal:** Make the continuation loop safe enough for normal use by adding token/time accounting, budget exhaustion, no-tool continuation suppression, pending-input reset behavior, stale continuation handling, and context pruning.

**Tasks:** 3 related tasks.

## Acceptance Criteria

- Active goal turns accumulate elapsed time and available usage tokens.
- Budget exhaustion transitions the goal to `budget_limited`, persists it, and sends one wrap-up prompt.
- No-tool continuation turns suppress further automatic continuation until user input or `/goal resume`.
- User input cancels suppression and pending scheduled continuation state.
- Stale or old hidden continuation messages are removed or neutralized from future context.
- Continuation is blocked when plan/read-only mode is detected.

### Task 1: Usage extraction and budget accounting

**Files:**
- Modify: `.pi/extensions/pi-goal/index.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Add failing accounting tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("turn_end accounts elapsed seconds and usage tokens", async () => {
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ clock: () => time }).register(pi as never);
  const goal = activeGoal({ tokenBudget: 1000 });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.turn_start[0]({ timestamp: 1000 }, ctx);
  time = 4000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { input: 10, output: 15 } } }, ctx);

  const latestGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(latestGoal.tokensUsed, 25);
  assert.equal(latestGoal.timeUsedSeconds, 3);
  assert.equal(latestGoal.turnCount, 1);
});

test("budget exhaustion marks goal budget_limited and sends wrap-up prompt once", async () => {
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ clock: () => time }).register(pi as never);
  const goal = activeGoal({ tokenBudget: 20 });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.turn_start[0]({}, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 30 } } }, ctx);

  const latestGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(latestGoal.status, "budget_limited");
  assert.equal(pi.messages.at(-1)?.message.customType, "pi-goal-continuation");
  assert.match(pi.messages.at(-1)?.message.content ?? "", /reached its token budget/);

  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(pi.messages.filter((entry) => /reached its token budget/.test(entry.message.content)).length, 1);
});
```

- [ ] **Step 2: Run accounting tests to verify they fail**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: FAIL until `index.ts` accounts usage and budget.

- [ ] **Step 3: Implement usage extraction and budget wrap-up**

Add these helpers to `.pi/extensions/pi-goal/index.ts` near the runtime factory:

```ts
interface UsageCarrier {
  usage?: Record<string, unknown>;
  metadata?: { usage?: Record<string, unknown> };
  tokens?: Record<string, unknown>;
}

function numberFrom(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

export function extractTokenUsage(message: UsageCarrier | undefined): number {
  const usage = message?.usage ?? message?.metadata?.usage ?? message?.tokens;
  if (!usage) return 0;
  const explicitTotal = numberFrom(usage.totalTokens ?? usage.total);
  if (explicitTotal > 0) return explicitTotal;
  return numberFrom(usage.input ?? usage.inputTokens ?? usage.promptTokens)
    + numberFrom(usage.output ?? usage.outputTokens ?? usage.completionTokens)
    + numberFrom(usage.reasoning ?? usage.reasoningTokens)
    + numberFrom(usage.cacheRead ?? usage.cacheReadTokens)
    + numberFrom(usage.cacheWrite ?? usage.cacheWriteTokens);
}
```

Modify the `turn_end` handler so it:

```ts
const elapsedSeconds = activeTurnStartedAt === null ? 0 : Math.max(0, Math.floor((clock() - activeTurnStartedAt) / 1000));
const tokensDelta = extractTokenUsage(event.message);
const result = applyGoalUsage(currentGoal, {
  tokensDelta,
  secondsDelta: elapsedSeconds,
  hadToolCall: currentTurnHadToolCall,
  wasContinuation: currentTurnIsContinuation,
  now: clock(),
});
persist(pi, result.goal);
if (result.crossedBudget) {
  pi.sendMessage(
    {
      customType: CONTINUATION_MESSAGE_TYPE,
      content: budgetLimitPrompt(result.goal),
      display: false,
      details: { goalId: result.goal.goalId, kind: "budget_limit" },
    },
    { triggerTurn: true, deliverAs: "steer" },
  );
}
refreshStatus(ctx);
```

- [ ] **Step 4: Run accounting tests**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: PASS.

### Task 2: Continuation gating and user input reset

**Files:**
- Modify: `.pi/extensions/pi-goal/index.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Add failing gating tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("no-tool continuation suppresses future automatic continuation", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => time }).register(pi as never);
  const goal = activeGoal();
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  scheduled.shift()?.();
  await pi.handlers.turn_start[0]({}, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: {} } }, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 0);
});

test("user input clears continuation suppression", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal({ continuationSuppressed: true, lastContinuationHadToolCall: false });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.input[0]({ text: "continue", source: "interactive" }, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 1);
});

test("pending messages block continuation scheduling", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal();
  const ctx = { ...fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]), hasPendingMessages: () => true };

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 0);
});

test("user input invalidates an already scheduled continuation before callback fires", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal();
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(scheduled.length, 1);

  await pi.handlers.input[0]({ text: "wait", source: "interactive" }, ctx);
  scheduled[0]();

  assert.equal(pi.messages.length, 0);
});
```

- [ ] **Step 2: Run gating tests to verify they fail**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: FAIL until gating and input handlers are complete.

- [ ] **Step 3: Implement gating helpers**

Add a `shouldScheduleContinuation` helper in `.pi/extensions/pi-goal/index.ts`:

```ts
export function shouldScheduleContinuation(goal: GoalState | null, options: { planModeActive: boolean }): boolean {
  if (!goal) return false;
  if (goal.status !== "active") return false;
  if (goal.continuationScheduled) return false;
  if (goal.continuationSuppressed) return false;
  if (options.planModeActive) return false;
  return true;
}
```

Track `planModeActive` in the runtime closure. Update `scheduleContinuation` to call this helper and also respect `ctx.isIdle()` and `ctx.hasPendingMessages()` both before scheduling and inside the deferred callback. The deferred callback must also re-check the scheduling generation introduced in Phase 3 so user input can invalidate pending callbacks.

Register an `input` handler:

```ts
pi.on("input", (event, _ctx) => {
  if (event.source === "extension" || !currentGoal) return { action: "continue" };
  invalidateContinuation();
  if (currentGoal.status === "active") {
    currentGoal = {
      ...currentGoal,
      continuationSuppressed: false,
      lastContinuationHadToolCall: true,
      continuationScheduled: false,
      updatedAt: clock(),
    };
    persist(pi, currentGoal);
  }
  return { action: "continue" };
});
```

Register `before_agent_start` plan/read-only detection:

```ts
pi.on("before_agent_start", (event) => {
  const prompt = String(event.prompt ?? "").toLowerCase();
  planModeActive = prompt.includes("plan mode") || prompt.includes("read-only") || prompt.includes("do not implement code");
});
```

- [ ] **Step 4: Run gating tests**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: PASS.

### Task 3: Context pruning for stale continuations

**Files:**
- Modify: `.pi/extensions/pi-goal/index.ts`
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Add failing context hygiene tests**

Append this test to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("context hook prunes stale pi-goal continuation messages", async () => {
  const pi = fakePi();
  createGoalExtension().register(pi as never);
  const active = activeGoal({ goalId: "active-goal" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: active, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  const result = await pi.handlers.context[0]({
    messages: [
      { role: "custom", customType: "pi-goal-continuation", details: { goalId: "old-goal" }, content: "old" },
      { role: "custom", customType: "pi-goal-continuation", details: { goalId: "active-goal" }, content: "current" },
      { role: "user", content: [{ type: "text", text: "hello" }] },
    ],
  }, ctx);

  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].details.goalId, "active-goal");
  assert.equal(result.messages[1].role, "user");
});
```

- [ ] **Step 2: Run context test to verify it fails**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: FAIL until the `context` hook is registered.

- [ ] **Step 3: Implement context pruning**

Add this handler to `.pi/extensions/pi-goal/index.ts`:

```ts
pi.on("context", (event) => {
  const messages = event.messages.filter((message: { customType?: string; details?: { goalId?: unknown } }) => {
    if (message.customType !== CONTINUATION_MESSAGE_TYPE) return true;
    return currentGoal?.status === "active" && message.details?.goalId === currentGoal.goalId;
  });
  return messages.length === event.messages.length ? undefined : { messages };
});
```

- [ ] **Step 4: Run full Phase 4 tests**

Run: `node --test .pi/extensions/pi-goal/*.test.ts`

Expected: PASS.

## Phase Verification

Run: `node --test .pi/extensions/pi-goal/*.test.ts`

Expected: PASS.

## Commit

```bash
git add .pi/extensions/pi-goal/index.ts .pi/extensions/pi-goal/runtime.test.ts
git commit -m "feat(pi-goal): add continuation gating and accounting"
```
