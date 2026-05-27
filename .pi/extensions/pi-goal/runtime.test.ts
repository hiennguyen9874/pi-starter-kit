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
  const renderers: Record<string, Function> = {};
  const entries: Array<{ customType: string; data: unknown }> = [];
  const messages: Array<{ message: any; options: any }> = [];
  const activeTools = new Set(["read", "bash", "edit", "write"]);
  return {
    commands,
    tools,
    handlers,
    renderers,
    entries,
    messages,
    registerCommand(name: string, command: any) { commands[name] = command; },
    registerTool(tool: any) { tools[tool.name] = tool; },
    registerMessageRenderer(name: string, renderer: Function) { renderers[name] = renderer; },
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
  assert.ok(pi.renderers["pi-goal-event"]);

  const rendered = pi.renderers["pi-goal-event"]({ details: { kind: "created", objective: "Build feature" } });
  assert.equal(typeof rendered?.render, "function");
  assert.equal(typeof rendered?.invalidate, "function");
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
  assert.match(pi.messages.at(-1)?.message.content, /<pi_goal_init /);
  assert.match(pi.messages.at(-1)?.message.content, /<untrusted_objective>\nBuild feature\n<\/untrusted_objective>/);
});

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

test("continuation turn with any completed tool execution schedules another continuation", async () => {
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
  await pi.handlers.tool_execution_end[0]({ toolName: "read" }, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: {} } }, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 1);
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

test("pending messages block continuation delivery until a later settled retry", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal();
  let pending = true;
  const ctx = { ...fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]), hasPendingMessages: () => pending };

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 1);
  scheduled[0]();
  assert.equal(pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation").length, 0);

  pending = false;
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(scheduled.length, 2);
  scheduled[1]();
  assert.equal(pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation").length, 1);
});

test("read-only active tool restrictions block continuation scheduling", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal();
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  pi.setActiveTools(["read"]);
  await pi.handlers.before_agent_start[0]({ prompt: "normal prompt" }, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal(scheduled.length, 0);
});

test("session_shutdown invalidates pending continuation", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal();
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(scheduled.length, 1);

  await pi.handlers.session_shutdown[0]({}, ctx);
  scheduled[0]();

  assert.equal(pi.messages.length, 0);
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

test("context hook rewrites stale and superseded continuation messages", async () => {
  const pi = fakePi();
  createGoalExtension().register(pi as never);
  const active = activeGoal({ goalId: "active-goal" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: active, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  const result = await pi.handlers.context[0]({
    messages: [
      { role: "custom", customType: "pi-goal-continuation", details: { goalId: "old-goal" }, content: "old" },
      { role: "custom", customType: "pi-goal-continuation", details: { goalId: "active-goal" }, content: "older active" },
      { role: "custom", customType: "pi-goal-continuation", details: { goalId: "active-goal" }, content: "current" },
      { role: "user", content: [{ type: "text", text: "hello" }] },
    ],
  }, ctx);

  assert.equal(result.messages.length, 4);
  
  // First message: stale marker for old-goal
  assert.match(String(result.messages[0].content), /stale.*cancelled/i);
  assert.match(String(result.messages[0].content), /old-goal/);
  
  // Second message: superseded marker for active-goal
  assert.match(String(result.messages[1].content), /superseded/i);
  assert.match(String(result.messages[1].content), /active-goal/);
  
  // Third message: latest active continuation with compact prompt
  assert.match(String(result.messages[2].content), /Continue working toward the active goal/);
  assert.match(String(result.messages[2].content), /active-goal/);
  
  // Fourth message: user message unchanged
  assert.equal(result.messages[3].role, "user");
});

test("get_goal remains available while update_goal is active only for active goals", async () => {
  const pi = fakePi();
  createGoalExtension().register(pi as never);
  const ctx = fakeCtx();

  await pi.commands.goal.handler("Build feature", ctx);
  assert.ok(pi.getActiveTools().includes("get_goal"));
  assert.ok(pi.getActiveTools().includes("update_goal"));

  await pi.commands.goal.handler("pause", ctx);
  assert.ok(pi.getActiveTools().includes("get_goal"));
  assert.equal(pi.getActiveTools().includes("update_goal"), false);

  await pi.commands.goal.handler("resume", ctx);
  assert.ok(pi.getActiveTools().includes("get_goal"));
  assert.ok(pi.getActiveTools().includes("update_goal"));

  await pi.commands.goal.handler("clear", ctx);
  assert.ok(pi.getActiveTools().includes("get_goal"));
  assert.equal(pi.getActiveTools().includes("update_goal"), false);
});

test("update_goal completion accounts final turn before completing", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  let time = 1000;
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => time }).register(pi as never);
  const ctx = fakeCtx();

  await pi.commands.goal.handler("Build feature", ctx);
  await pi.handlers.turn_start[0]({ timestamp: 1000 }, ctx);
  await pi.tools.update_goal.execute("tool-1", { status: "complete" }, undefined, undefined, ctx);
  time = 4000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { input: 12, output: 8 } } }, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  const latestGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(latestGoal.status, "complete");
  assert.equal(latestGoal.tokensUsed, 20);
  assert.equal(latestGoal.timeUsedSeconds, 3);
  assert.equal(latestGoal.turnCount, 1);
  assert.equal(scheduled.length, 0);
});

test("goal resume schedules a hidden continuation when idle", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal({ status: "paused" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.commands.goal.handler("resume", ctx);

  assert.equal(scheduled.length, 1);
  assert.equal(pi.messages.at(-1)?.message.customType, "pi-goal-event");
  scheduled[0]();
  assert.equal(pi.messages.at(-1)?.message.customType, "pi-goal-continuation");
});

test("update_goal rejects non-active goals at execution boundary", async () => {
  const pi = fakePi();
  createGoalExtension().register(pi as never);
  const goal = activeGoal({ status: "paused" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);

  await assert.rejects(
    pi.tools.update_goal.execute("tool-1", { status: "complete" }, undefined, undefined, ctx),
    /active goal/i,
  );
  assert.equal((pi.entries.at(-1)?.data as any)?.goal?.status, undefined);
});

test("statusbar setting toggles and persists across restore", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const ctx = fakeCtx();

  await pi.commands.goal.handler("statusbar off", ctx);
  assert.equal(ctx.statuses["pi-goal"], undefined);

  const persisted = pi.entries.at(-1)?.data as any;
  const restoreCtx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: persisted }]);
  await pi.handlers.session_start[0]({}, restoreCtx);
  assert.equal(restoreCtx.statuses["pi-goal"], undefined);
});

test("session reload auto-pauses active goal and notifies", async () => {
  const pi = fakePi();
  createGoalExtension({ clock: () => 100 }).register(pi as never);
  const goal = activeGoal({ status: "active" });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({ reason: "reload" }, ctx);

  const latestGoal = (pi.entries.at(-1)?.data as any).goal;
  assert.equal(latestGoal.status, "paused");
  assert.match(ctx.notifications.at(-1) ?? "", /paused after reload/i);
});

test("agent_end schedules continuation retry when agent is not settled yet", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const ctx = fakeCtx();
  let idle = false;
  let pending = true;
  ctx.isIdle = () => idle;
  ctx.hasPendingMessages = () => pending;

  await pi.commands.goal.handler("Build feature", ctx);

  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(scheduled.length, 1);

  scheduled[0]();
  assert.equal(pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation").length, 0);

  idle = true;
  pending = false;
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);
  assert.equal(scheduled.length, 2);

  scheduled[1]();
  assert.equal(pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation").length, 1);
});

test("session_compact retries continuation delivery from restored active goal state", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const goal = activeGoal({ continuationScheduled: true });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  await pi.handlers.session_compact[0]({}, ctx);
  assert.equal(scheduled.length, 1);

  scheduled[0]();
  assert.equal(pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation").length, 1);
});

test("stale continuation after goal replacement does not charge replacement goal or requeue", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  let time = 1000;
  const extension = createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => time });
  extension.register(pi as never);
  const replacement = activeGoal({ goalId: "new-goal", tokensUsed: 0, turnCount: 0 });
  const ctx = fakeCtx([{ type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: replacement, at: 1 } }]);

  await pi.handlers.session_start[0]({}, ctx);
  // Simulate a late hidden turn that was queued for an old goal before replacement.
  await pi.handlers.turn_start[0]({ details: { goalId: "old-goal" } }, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 99 } } }, ctx);
  await pi.handlers.agent_end[0]({ details: { goalId: "old-goal" }, messages: [] }, ctx);

  // Stale turn should not append any new entries
  assert.equal(pi.entries.length, 0);
  
  // Check in-memory state: replacement goal should be unchanged
  assert.equal(extension.currentGoal?.goalId, "new-goal");
  assert.equal(extension.currentGoal?.tokensUsed, 0);
  assert.equal(extension.currentGoal?.turnCount, 0);
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

test("multi-goal stale overlap: late goal-a continuation does not affect active goal-b", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  let time = 1000;
  const extension = createGoalExtension({ scheduler: (fn) => scheduled.push(fn), clock: () => time });
  extension.register(pi as never);
  const goalA = activeGoal({ goalId: "goal-a", tokensUsed: 10, turnCount: 1, continuationCount: 1 });
  const goalB = activeGoal({ goalId: "goal-b", tokensUsed: 0, turnCount: 0, continuationCount: 0 });
  const ctx = fakeCtx([
    { type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: goalA, at: 1 } },
    { type: "custom", customType: ENTRY_TYPE, data: { version: 1, action: "set", goal: goalB, at: 2 } },
  ]);

  await pi.handlers.session_start[0]({}, ctx);
  
  // Simulate a late continuation turn for goal-a (which was replaced by goal-b)
  await pi.handlers.turn_start[0]({ details: { goalId: "goal-a" } }, ctx);
  time = 2000;
  await pi.handlers.turn_end[0]({ message: { role: "assistant", usage: { totalTokens: 50 } } }, ctx);
  await pi.handlers.agent_end[0]({ details: { goalId: "goal-a" }, messages: [] }, ctx);

  // Verify goal-b remains active with unchanged values
  assert.equal(extension.currentGoal?.goalId, "goal-b");
  assert.equal(extension.currentGoal?.tokensUsed, 0);
  assert.equal(extension.currentGoal?.turnCount, 0);
  assert.equal(extension.currentGoal?.continuationCount, 0);
  
  // Verify no hidden message for goal-a was sent
  const hiddenMessages = pi.messages.filter((m) => m.message?.customType === "pi-goal-continuation");
  assert.equal(hiddenMessages.length, 0);
  
  // Verify no new entries were appended (stale turn)
  assert.equal(pi.entries.length, 0);
});

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
