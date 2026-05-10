# Phase 3: Runtime Wiring and First Continuation Loop

**Goal:** Wire the pure modules into `.pi/extensions/pi-goal/index.ts`, register commands/tools, persist state entries, restore state on session start/tree navigation, update the status line, and send the first deferred hidden continuation.

**Tasks:** 2 related tasks.

## Acceptance Criteria

- `.pi/extensions/pi-goal/index.ts` default export registers the command, tools, and lifecycle hooks.
- Runtime state persists through `pi.appendEntry("pi-goal", ...)` using Phase 1 entries.
- `session_start`, `session_tree`, and `session_compact` reconstruct goal state from the current branch.
- `/goal <objective>` starts the first visible model turn when idle by sending the objective as a normal user message.
- `agent_end` schedules a hidden `pi-goal-continuation` message only after an async deferral and only for an active goal.
- Deferred continuation callbacks re-check goal id, active status, pending messages, and a scheduling generation before sending.
- Tests prove registration, persistence, restoration, first-turn start, status updates, and continuation message shape.

### Task 1: Runtime factory and registration tests

**Files:**
- Create: `.pi/extensions/pi-goal/index.ts`
- Create: `.pi/extensions/pi-goal/runtime.test.ts`

- [ ] **Step 1: Write failing runtime registration tests**

Create `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import piGoalExtension, { createGoalExtension } from "./index.ts";
import { ENTRY_TYPE, type GoalState } from "./state.ts";

function activeGoal(overrides: Partial<GoalState> = {}): GoalState {
  return {
    version: 1,
    goalId: "goal-1",
    objective: "Build feature",
    status: "active",
    tokenBudget: null,
    tokensUsed: 0,
    timeUsedSeconds: 0,
    turnCount: 0,
    continuationCount: 0,
    lastContinuationHadToolCall: true,
    continuationSuppressed: false,
    continuationScheduled: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function fakeCtx(entries: unknown[] = []) {
  const statuses: Record<string, string | undefined> = {};
  const notifications: string[] = [];
  return {
    hasUI: true,
    cwd: process.cwd(),
    sessionManager: {
      getBranch: () => entries,
      getEntries: () => entries,
    },
    ui: {
      setStatus(key: string, value: string | undefined) { statuses[key] = value; },
      notify(message: string) { notifications.push(message); },
      async confirm() { return true; },
    },
    isIdle: () => true,
    hasPendingMessages: () => false,
    statuses,
    notifications,
  };
}

function fakePi() {
  const commands: Record<string, any> = {};
  const tools: Record<string, any> = {};
  const handlers: Record<string, Function[]> = {};
  const entries: Array<{ customType: string; data: unknown }> = [];
  const messages: Array<{ message: any; options: any }> = [];
  const activeTools = new Set(["read", "bash", "edit", "write"]);
  return {
    commands,
    tools,
    handlers,
    entries,
    messages,
    registerCommand(name: string, command: any) { commands[name] = command; },
    registerTool(tool: any) { tools[tool.name] = tool; },
    on(name: string, handler: Function) { (handlers[name] ??= []).push(handler); },
    appendEntry(customType: string, data: unknown) { entries.push({ customType, data }); },
    sendMessage(message: any, options: any) { messages.push({ message, options }); },
    sendUserMessage(content: any, options?: any) { messages.push({ message: { role: "user", content }, options: { triggerTurn: true, ...options } }); },
    getActiveTools() { return Array.from(activeTools); },
    setActiveTools(names: string[]) { activeTools.clear(); for (const name of names) activeTools.add(name); },
  };
}

test("default export registers command, tools, and lifecycle handlers", () => {
  const pi = fakePi();

  piGoalExtension(pi as never);

  assert.ok(pi.commands.goal);
  assert.ok(pi.tools.get_goal);
  assert.ok(pi.tools.create_goal);
  assert.ok(pi.tools.update_goal);
  assert.ok(pi.handlers.session_start?.length);
  assert.ok(pi.handlers.session_tree?.length);
  assert.ok(pi.handlers.session_compact?.length);
  assert.ok(pi.handlers.agent_end?.length);
});

test("/goal command persists state, updates status, and starts first visible turn", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const ctx = fakeCtx();

  await pi.commands.goal.handler("Build feature", ctx);

  const persistedGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(pi.entries.at(-1)?.customType, ENTRY_TYPE);
  assert.equal(persistedGoal.objective, "Build feature");
  assert.equal(persistedGoal.status, "active");
  assert.equal(typeof persistedGoal.goalId, "string");
  assert.match(ctx.statuses["pi-goal"] ?? "", /Pursuing goal/);
  assert.equal(pi.messages.at(-1)?.message.role, "user");
  assert.equal(pi.messages.at(-1)?.message.content, "Build feature");
});
```

- [ ] **Step 2: Run runtime tests to verify they fail**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: FAIL because `.pi/extensions/pi-goal/index.ts` does not exist yet.

- [ ] **Step 3: Implement runtime factory in `index.ts`**

Implement `.pi/extensions/pi-goal/index.ts` with a testable factory and default export:

```ts
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

import { registerGoalCommand } from "./commands.ts";
import { formatFooterStatus } from "./format.ts";
import { budgetLimitPrompt, continuationPrompt } from "./prompts.ts";
import {
  CONTINUATION_MESSAGE_TYPE,
  ENTRY_TYPE,
  applyGoalUsage,
  clearGoalEntry,
  goalEntry,
  reconstructGoal,
  transitionGoal,
  type GoalState,
} from "./state.ts";
import { registerGoalTools } from "./tools.ts";

export interface GoalExtensionOptions {
  clock?: () => number;
  scheduler?: (fn: () => void) => unknown;
}

export function createGoalExtension(options: GoalExtensionOptions = {}) {
  const clock = options.clock ?? (() => Date.now());
  const scheduler = options.scheduler ?? ((fn: () => void) => setTimeout(fn, 0));
  let currentGoal: GoalState | null = null;
  let activeTurnStartedAt: number | null = null;
  let currentTurnHadToolCall = false;
  let currentTurnIsContinuation = false;
  let awaitingContinuationGoalId: string | null = null;
  let continuationGeneration = 0;

  function refreshStatus(ctx: Pick<ExtensionContext, "ui">): void {
    ctx.ui.setStatus("pi-goal", formatFooterStatus(currentGoal));
  }

  function persist(pi: Pick<ExtensionAPI, "appendEntry">, goal: GoalState): void {
    currentGoal = goal;
    pi.appendEntry(ENTRY_TYPE, goalEntry(goal, clock()));
  }

  function clear(pi: Pick<ExtensionAPI, "appendEntry">): void {
    const clearedGoalId = currentGoal?.goalId ?? null;
    currentGoal = null;
    pi.appendEntry(ENTRY_TYPE, clearGoalEntry(clearedGoalId, clock()));
  }

  function restore(ctx: ExtensionContext): void {
    currentGoal = reconstructGoal(ctx.sessionManager.getBranch());
    activeTurnStartedAt = null;
    currentTurnHadToolCall = false;
    currentTurnIsContinuation = false;
    awaitingContinuationGoalId = null;
    continuationGeneration++;
    refreshStatus(ctx);
  }

  function invalidateContinuation(): void {
    continuationGeneration++;
    if (currentGoal?.continuationScheduled) {
      currentGoal = { ...currentGoal, continuationScheduled: false, updatedAt: clock() };
    }
  }

  function scheduleContinuation(pi: Pick<ExtensionAPI, "sendMessage" | "appendEntry">, ctx?: Pick<ExtensionContext, "isIdle" | "hasPendingMessages">): boolean {
    if (!currentGoal || currentGoal.status !== "active" || currentGoal.continuationScheduled) return false;
    if (ctx && (!ctx.isIdle() || ctx.hasPendingMessages())) return false;
    currentGoal = { ...currentGoal, continuationScheduled: true, updatedAt: clock() };
    persist(pi, currentGoal);
    const goalId = currentGoal.goalId;
    const generation = ++continuationGeneration;
    scheduler(() => {
      if (!currentGoal || currentGoal.goalId !== goalId || currentGoal.status !== "active") return;
      if (!currentGoal.continuationScheduled || generation !== continuationGeneration) return;
      if (ctx && (!ctx.isIdle() || ctx.hasPendingMessages())) {
        currentGoal = { ...currentGoal, continuationScheduled: false, updatedAt: clock() };
        persist(pi, currentGoal);
        return;
      }
      currentGoal = { ...currentGoal, continuationScheduled: false, continuationCount: currentGoal.continuationCount + 1, updatedAt: clock() };
      persist(pi, currentGoal);
      awaitingContinuationGoalId = goalId;
      pi.sendMessage(
        {
          customType: CONTINUATION_MESSAGE_TYPE,
          content: continuationPrompt(currentGoal),
          display: false,
          details: { goalId },
        },
        { triggerTurn: true },
      );
    });
    return true;
  }

  function register(pi: ExtensionAPI): void {
    registerGoalTools(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        persist(pi, goal);
        refreshStatus(ctx as ExtensionContext);
      },
      completeGoal(_source, ctx) {
        if (!currentGoal) throw new Error("No goal is set.");
        const complete = transitionGoal(currentGoal, "complete", clock());
        persist(pi, complete);
        refreshStatus(ctx as ExtensionContext);
        return complete;
      },
    });

    registerGoalCommand(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        const isNewGoal = currentGoal?.goalId !== goal.goalId;
        invalidateContinuation();
        persist(pi, goal);
        refreshStatus(ctx);
        if (isNewGoal && goal.status === "active" && ctx.isIdle() && !ctx.hasPendingMessages()) {
          pi.sendUserMessage(goal.objective);
        }
      },
      clearGoal(_source, ctx) {
        invalidateContinuation();
        clear(pi);
        refreshStatus(ctx);
      },
    });

    pi.on("session_start", (_event, ctx) => restore(ctx));
    pi.on("session_tree", (_event, ctx) => restore(ctx));
    pi.on("session_compact", (_event, ctx) => restore(ctx));
    pi.on("turn_start", (_event, _ctx) => {
      activeTurnStartedAt = clock();
      currentTurnHadToolCall = false;
      currentTurnIsContinuation = currentGoal?.goalId === awaitingContinuationGoalId;
      if (currentTurnIsContinuation) awaitingContinuationGoalId = null;
    });
    pi.on("tool_execution_end", () => {
      currentTurnHadToolCall = true;
    });
    pi.on("turn_end", (_event, ctx) => {
      refreshStatus(ctx);
    });
    pi.on("agent_end", (_event, ctx) => {
      scheduleContinuation(pi, ctx);
      refreshStatus(ctx);
    });
    pi.on("session_shutdown", () => {
      activeTurnStartedAt = null;
    });
  }

  return { register, scheduleContinuation, get currentGoal() { return currentGoal; } };
}

export default function piGoalExtension(pi: ExtensionAPI): void {
  createGoalExtension().register(pi);
}
```


- [ ] **Step 4: Run runtime registration tests**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: PASS for registration and persistence tests.

### Task 2: Deferred hidden continuation tests

**Files:**
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`
- Modify: `.pi/extensions/pi-goal/index.ts`

- [ ] **Step 1: Add failing continuation test**

Append this test to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
test("agent_end defers and sends one hidden continuation for active goal", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ goalId: "goal-active" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(pi.messages.length, 0);
  assert.equal(scheduled.length, 1);

  scheduled[0]();

  assert.equal(pi.messages.length, 1);
  assert.equal(pi.messages[0].message.customType, "pi-goal-continuation");
  assert.equal(pi.messages[0].message.display, false);
  assert.deepEqual(pi.messages[0].message.details, { goalId: "goal-active" });
  assert.deepEqual(pi.messages[0].options, { triggerTurn: true });
});

test("does not schedule continuation for paused goal", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal({ status: "paused" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 0);
});
```

- [ ] **Step 2: Run continuation tests**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: PASS after any minimal correction to `index.ts` scheduling state needed by the tests.

- [ ] **Step 3: Ensure first runtime does not overreach**

Confirm `index.ts` at this phase does not yet implement complex budget, no-tool suppression, context pruning, or plan-mode detection. Those belong to Phase 4.

- [ ] **Step 4: Run all tests so far**

Run: `node --test .pi/extensions/pi-goal/*.test.ts`

Expected: PASS.

## Phase Verification

Run: `node --test .pi/extensions/pi-goal/*.test.ts`

Expected: PASS.

## Commit

```bash
git add .pi/extensions/pi-goal/index.ts .pi/extensions/pi-goal/runtime.test.ts
git commit -m "feat(pi-goal): wire runtime continuation loop"
```
