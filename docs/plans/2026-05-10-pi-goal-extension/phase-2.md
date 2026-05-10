# Phase 2: Commands and Model Tools

**Goal:** Add canonical `/goal` command parsing/handling and `get_goal`, `create_goal`, `update_goal` model tools on top of the Phase 1 pure modules.

**Tasks:** 2 related tasks.

## Acceptance Criteria

- `/goal`, `/goal status`, `/goal pause`, `/goal resume`, `/goal clear`, and `/goal <objective> --budget[=]N` behavior is implemented through `commands.ts`.
- `get_goal`, `create_goal`, and `update_goal` are registered with canonical names.
- `update_goal` only accepts `status: "complete"`.
- Duplicate model goal creation is rejected while a non-terminal goal exists.
- Commands/tools are testable with fake host objects and do not require a live Pi session.

### Task 1: Command parser and command handler

**Files:**
- Create: `.pi/extensions/pi-goal/commands.ts`
- Create: `.pi/extensions/pi-goal/commands-tools.test.ts`

- [ ] **Step 1: Write failing command tests**

Create `.pi/extensions/pi-goal/commands-tools.test.ts` with command tests first:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { handleGoalCommand, parseGoalCommand } from "./commands.ts";
import { createGoal, type GoalState } from "./state.ts";

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
```

- [ ] **Step 2: Run command tests to verify they fail**

Run: `node --test .pi/extensions/pi-goal/commands-tools.test.ts`

Expected: FAIL because `.pi/extensions/pi-goal/commands.ts` does not exist yet.

- [ ] **Step 3: Implement `commands.ts`**

Implement `.pi/extensions/pi-goal/commands.ts` with these exported APIs:

```ts
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

import { formatFooterStatus, goalToolText } from "./format.ts";
import { createGoal, parseTokenBudget, transitionGoal, type CreateGoalOptions, type GoalState } from "./state.ts";

export type GoalCommand =
  | { action: "status" | "pause" | "resume" | "clear" }
  | { action: "create"; objective: string; tokenBudget: number | null };

export type GoalCommandContext = Pick<ExtensionCommandContext, "hasUI" | "ui" | "isIdle" | "hasPendingMessages">;

export interface GoalCommandHost {
  getGoal(): GoalState | null;
  setGoal(goal: GoalState, source: "command", ctx: GoalCommandContext): void;
  clearGoal(source: "command", ctx: GoalCommandContext): void;
}

export function parseGoalCommand(args: string): GoalCommand {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "status") return { action: "status" };
  if (trimmed === "pause" || trimmed === "resume" || trimmed === "clear") return { action: trimmed };

  let objective = trimmed;
  let budgetText: string | undefined;
  const equals = objective.match(/\s--budget=([^\s]+)\s*$/);
  const spaced = objective.match(/\s--budget\s+([^\s]+)\s*$/);
  if (equals) {
    budgetText = equals[1];
    objective = objective.slice(0, equals.index).trim();
  } else if (spaced) {
    budgetText = spaced[1];
    objective = objective.slice(0, spaced.index).trim();
  }

  return { action: "create", objective, tokenBudget: parseTokenBudget(budgetText) };
}

export async function handleGoalCommand(
  host: GoalCommandHost,
  args: string,
  ctx: GoalCommandContext,
  createOptions: CreateGoalOptions = {},
): Promise<void> {
  const parsed = parseGoalCommand(args);
  const current = host.getGoal();

  if (parsed.action === "status") {
    ctx.ui.notify(current ? `${formatFooterStatus(current) ?? "Goal"}\n${goalToolText(current)}` : "No goal set. Usage: /goal <objective>", "info");
    return;
  }

  if (parsed.action === "clear") {
    if (!current) {
      ctx.ui.notify("No goal is set.", "info");
      return;
    }
    host.clearGoal("command", ctx);
    ctx.ui.notify("Goal cleared.", "info");
    return;
  }

  if (parsed.action === "pause" || parsed.action === "resume") {
    if (!current) {
      ctx.ui.notify("No goal is set.", "warning");
      return;
    }
    const next = transitionGoal(current, parsed.action === "pause" ? "paused" : "active");
    host.setGoal(next, "command", ctx);
    ctx.ui.notify(parsed.action === "pause" ? "Goal paused." : "Goal resumed.", "info");
    return;
  }

  if (current && current.status !== "complete" && current.status !== "cleared") {
    if (!ctx.hasUI) {
      ctx.ui.notify("Clear or complete the existing goal before creating another.", "warning");
      return;
    }
    const ok = await ctx.ui.confirm("Replace goal?", `Current goal:\n${current.objective}\n\nNew goal:\n${parsed.objective}`);
    if (!ok) {
      ctx.ui.notify("Goal unchanged.", "info");
      return;
    }
  }

  const next = createGoal(parsed.objective, parsed.tokenBudget, createOptions);
  host.setGoal(next, "command", ctx);
  ctx.ui.notify(`Goal created: ${next.objective}`, "info");
}

export function registerGoalCommand(pi: { registerCommand: Function }, host: GoalCommandHost): void {
  pi.registerCommand("goal", {
    description: "Set, inspect, pause, resume, or clear a long-running pi-goal objective.",
    getArgumentCompletions(prefix: string) {
      const values = ["status", "pause", "resume", "clear"];
      const matches = values.filter((value) => value.startsWith(prefix.trim()));
      return matches.length > 0 ? matches.map((value) => ({ value, label: value })) : null;
    },
    async handler(args: string, ctx: ExtensionCommandContext) {
      await handleGoalCommand(host, args, ctx);
    },
  });
}
```

- [ ] **Step 4: Run command tests**

Run: `node --test .pi/extensions/pi-goal/commands-tools.test.ts`

Expected: PASS for command tests; tool tests are not present yet.

### Task 2: Model tools

**Files:**
- Create: `.pi/extensions/pi-goal/tools.ts`
- Modify: `.pi/extensions/pi-goal/commands-tools.test.ts`

- [ ] **Step 1: Add failing tool tests**

Append these tests to `.pi/extensions/pi-goal/commands-tools.test.ts`:

```ts
import { registerGoalTools } from "./tools.ts";

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test .pi/extensions/pi-goal/commands-tools.test.ts`

Expected: FAIL because `.pi/extensions/pi-goal/tools.ts` does not exist yet.

- [ ] **Step 3: Implement `tools.ts`**

Implement `.pi/extensions/pi-goal/tools.ts` with these exported APIs:

```ts
import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

import { goalToolText } from "./format.ts";
import { createGoal, type GoalState } from "./state.ts";

export interface GoalToolHost {
  getGoal(): GoalState | null;
  setGoal(goal: GoalState, source: "tool", ctx: unknown): void;
  completeGoal(source: "tool", ctx: unknown): GoalState;
}

const EmptyParams = Type.Object({});
const CreateGoalParams = Type.Object({
  objective: Type.String({ description: "Concrete objective to pursue until completion." }),
  token_budget: Type.Optional(Type.Integer({ minimum: 1, description: "Optional positive token budget." })),
});
const UpdateGoalParams = Type.Object({
  status: StringEnum(["complete"] as const, { description: "Only complete is accepted." }),
});

function textResult(text: string, details: unknown = undefined) {
  return { content: [{ type: "text" as const, text }], details };
}

export function registerGoalTools(pi: Pick<ExtensionAPI, "registerTool">, host: GoalToolHost): void {
  pi.registerTool({
    name: "get_goal",
    label: "Get Goal",
    description: "Return the current pi-goal state, if one exists.",
    promptSnippet: "Inspect the current pi-goal objective, status, elapsed time, and token budget.",
    promptGuidelines: ["Use get_goal only when the current pi-goal state is needed for goal-related work."],
    parameters: EmptyParams,
    async execute() {
      const goal = host.getGoal();
      return textResult(goalToolText(goal), { goal });
    },
  });

  pi.registerTool({
    name: "create_goal",
    label: "Create Goal",
    description: "Create one active pi-goal when no non-terminal goal exists.",
    promptSnippet: "Create one active pi-goal from an explicit user request.",
    promptGuidelines: ["Use create_goal only when the user explicitly asks to start a persistent goal."],
    parameters: CreateGoalParams,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const current = host.getGoal();
      if (current && current.status !== "complete" && current.status !== "cleared") {
        return textResult("Error: cannot create a new goal because this session already has a non-terminal goal.", { goal: current, error: "duplicate_goal" });
      }
      const goal = createGoal(params.objective, params.token_budget ?? null);
      host.setGoal(goal, "tool", ctx);
      return textResult(goalToolText(goal), { goal });
    },
  });

  pi.registerTool({
    name: "update_goal",
    label: "Update Goal",
    description: "Mark the current pi-goal complete only after evidence proves the objective is fully achieved.",
    promptSnippet: "Mark the current pi-goal complete after a strict completion audit.",
    promptGuidelines: [
      "Use update_goal with status complete only when concrete evidence proves every goal requirement is complete.",
      "Do not use update_goal to pause, resume, clear, abandon, or budget-limit a goal.",
    ],
    parameters: UpdateGoalParams,
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const goal = host.completeGoal("tool", ctx);
      return textResult(goalToolText(goal, true), { goal });
    },
  });
}
```

- [ ] **Step 4: Run all Phase 2 tests**

Run: `node --test .pi/extensions/pi-goal/commands-tools.test.ts`

Expected: PASS.

## Phase Verification

Run: `node --test .pi/extensions/pi-goal/state.test.ts .pi/extensions/pi-goal/prompts.test.ts .pi/extensions/pi-goal/commands-tools.test.ts`

Expected: PASS.

## Commit

```bash
git add .pi/extensions/pi-goal/commands.ts .pi/extensions/pi-goal/tools.ts .pi/extensions/pi-goal/commands-tools.test.ts
git commit -m "feat(pi-goal): add commands and tools"
```
