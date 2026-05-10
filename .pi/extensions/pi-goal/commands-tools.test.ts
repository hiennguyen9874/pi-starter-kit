import test from "node:test";
import assert from "node:assert/strict";

import { handleGoalCommand, parseGoalCommand } from "./commands.ts";
import { createGoal, type GoalState } from "./state.ts";
import { registerGoalTools } from "./tools.ts";

function makeCtx(hasUI = true) {
  const notifications: Array<{ message: string; level?: string }> = [];
  return {
    hasUI,
    notifications,
    ui: {
      async confirm() { return true; },
      notify(message: string, level?: string) { notifications.push({ message, level }); },
      setStatus() {},
    },
    isIdle() { return true; },
    hasPendingMessages() { return false; },
  };
}

function makeHost(initial: GoalState | null = null) {
  let goal = initial;
  return {
    getGoal: () => goal,
    setGoal(next: GoalState) { goal = next; },
    clearGoal() { goal = null; },
  };
}

test("parses goal command actions and budget forms", () => {
  assert.deepEqual(parseGoalCommand(""), { action: "status" });
  assert.deepEqual(parseGoalCommand("status"), { action: "status" });
  assert.deepEqual(parseGoalCommand("pause"), { action: "pause" });
  assert.deepEqual(parseGoalCommand("resume"), { action: "resume" });
  assert.deepEqual(parseGoalCommand("clear"), { action: "clear" });
  assert.deepEqual(parseGoalCommand("Ship it --budget 12k"), { action: "create", objective: "Ship it", tokenBudget: 12000 });
  assert.deepEqual(parseGoalCommand("Ship it --budget=2M"), { action: "create", objective: "Ship it", tokenBudget: 2000000 });
});

test("/goal creates an active goal", async () => {
  const host = makeHost();
  const ctx = makeCtx();

  await handleGoalCommand(host, "Build feature", ctx as never, { goalId: "goal-cmd", now: 10 });

  assert.equal(host.getGoal()?.objective, "Build feature");
  assert.equal(host.getGoal()?.status, "active");
  assert.equal(ctx.notifications.at(-1)?.level, "info");
});

test("/goal validation errors notify and preserve existing state", async () => {
  const existing = createGoal("Existing", null, { goalId: "g", now: 1 });
  const host = makeHost(existing);
  const ctx = makeCtx();

  await handleGoalCommand(host, "New --budget nope", ctx as never, { goalId: "new", now: 2 });

  assert.equal(host.getGoal(), existing);
  assert.equal(ctx.notifications.at(-1)?.level, "warning");
  assert.match(ctx.notifications.at(-1)?.message ?? "", /Token budget/);
});

test("/goal status reports current goal", async () => {
  const host = makeHost(createGoal("Build feature", null, { goalId: "g", now: 1 }));
  const ctx = makeCtx();

  await handleGoalCommand(host, "status", ctx as never);

  assert.match(ctx.notifications.at(-1)?.message ?? "", /Build feature/);
});

test("/goal pause, resume, and clear transition state", async () => {
  const host = makeHost(createGoal("Build feature", null, { goalId: "g", now: 1 }));
  const ctx = makeCtx();

  await handleGoalCommand(host, "pause", ctx as never);
  assert.equal(host.getGoal()?.status, "paused");

  await handleGoalCommand(host, "resume", ctx as never);
  assert.equal(host.getGoal()?.status, "active");

  await handleGoalCommand(host, "clear", ctx as never);
  assert.equal(host.getGoal(), null);
});

test("non-interactive replacement is rejected", async () => {
  const host = makeHost(createGoal("Existing", null, { goalId: "g", now: 1 }));
  const ctx = makeCtx(false);

  await handleGoalCommand(host, "New objective", ctx as never);

  assert.equal(host.getGoal()?.objective, "Existing");
  assert.match(ctx.notifications.at(-1)?.message ?? "", /Clear or complete/);
});

function captureTools(initial: GoalState | null = null) {
  const tools: Record<string, any> = {};
  let goal = initial;
  const pi = { registerTool(tool: any) { tools[tool.name] = tool; } };
  registerGoalTools(pi as never, {
    getGoal: () => goal,
    setGoal(next) { goal = next; },
    completeGoal() {
      if (!goal) throw new Error("No goal is set.");
      goal = { ...goal, status: "complete", updatedAt: 999 };
      return goal;
    },
  });
  return { tools, getGoal: () => goal };
}

test("registers canonical goal tool names", () => {
  const { tools } = captureTools();

  assert.deepEqual(Object.keys(tools).sort(), ["create_goal", "get_goal", "update_goal"]);
});

test("get_goal returns explicit no-goal response", async () => {
  const { tools } = captureTools();

  const result = await tools.get_goal.execute("tool-1", {}, undefined, undefined, {});

  assert.match(result.content[0].text, /"goal": null/);
});

test("create_goal creates first goal and rejects duplicate active goal", async () => {
  const { tools, getGoal } = captureTools();

  const created = await tools.create_goal.execute("tool-1", { objective: "Build", token_budget: 100 }, undefined, undefined, {});
  assert.equal(getGoal()?.objective, "Build");
  assert.match(created.content[0].text, /"objective": "Build"/);

  const duplicate = await tools.create_goal.execute("tool-2", { objective: "Replace" }, undefined, undefined, {});
  assert.match(duplicate.content[0].text, /cannot create/i);
  assert.equal(getGoal()?.objective, "Build");
});

test("update_goal only completes the current goal", async () => {
  const { tools, getGoal } = captureTools(createGoal("Build", 100, { goalId: "g", now: 1 }));

  const result = await tools.update_goal.execute("tool-1", { status: "complete" }, undefined, undefined, {});

  assert.equal(getGoal()?.status, "complete");
  assert.match(result.content[0].text, /completionBudgetReport/);
});

test("update_goal rejects non-complete status at execute boundary", async () => {
  const { tools, getGoal } = captureTools(createGoal("Build", 100, { goalId: "g", now: 1 }));

  await assert.rejects(
    tools.update_goal.execute("tool-1", { status: "paused" }, undefined, undefined, {}),
    /only accepts status=complete/i,
  );
  assert.equal(getGoal()?.status, "active");
});
