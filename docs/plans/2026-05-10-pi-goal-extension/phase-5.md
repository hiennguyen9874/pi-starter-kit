# Phase 5: Integration Verification and Polish

**Goal:** Verify the completed extension as a cohesive Pi project-local extension, keep UX simple, and avoid scope creep.

**Tasks:** 3 related tasks.

## Acceptance Criteria

- All pi-goal tests pass with `node --test .pi/extensions/pi-goal/*.test.ts`.
- Existing profile extension tests still pass.
- The extension is auto-discoverable as `.pi/extensions/pi-goal/index.ts` without editing `.pi/settings.json`.
- `/goal` and tool names are canonical and documented in code descriptions.
- No optional overlay UI, package publication, prefix configurability, multi-goal queues, or new dependencies are added.

## Decision Gates Before Implementation

- If `node --test` cannot run TypeScript extension tests in this workspace, stop and inspect the current Node/Pi test pattern before adding a test runner.
- If a global pi-goal extension is detected during manual verification, stop and ask whether to disable it or rename this local extension.
- If usage payload shape is absent for a provider, keep token delta at zero rather than adding invented estimates.

### Task 1: Final extension behavior tests

**Files:**
- Modify: `.pi/extensions/pi-goal/runtime.test.ts`
- Modify only if needed by failing tests: `.pi/extensions/pi-goal/index.ts`, `.pi/extensions/pi-goal/commands.ts`, `.pi/extensions/pi-goal/tools.ts`

- [ ] **Step 1: Add final regression tests**

Append these tests to `.pi/extensions/pi-goal/runtime.test.ts`:

```ts
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

test("update_goal completion stops future continuation", async () => {
  const scheduled: Function[] = [];
  const pi = fakePi();
  createGoalExtension({ scheduler: (fn) => scheduled.push(fn) }).register(pi as never);
  const ctx = fakeCtx();

  await pi.commands.goal.handler("Build feature", ctx);
  await pi.tools.update_goal.execute("tool-1", { status: "complete" }, undefined, undefined, ctx);
  await pi.handlers.agent_end[0]({ messages: [] }, ctx);

  assert.equal((pi.entries.at(-1)?.data as any).goal.status, "complete");
  assert.equal(scheduled.length, 0);
});
```

- [ ] **Step 2: Run final behavior tests**

Run: `node --test .pi/extensions/pi-goal/runtime.test.ts`

Expected: PASS. If tool visibility is not implemented yet, update `index.ts` with a `syncGoalTools(pi)` helper that keeps `get_goal` available and gates only completion updates:

```ts
const COMPLETION_TOOL_NAMES = ["update_goal"];

function syncGoalTools(pi: Pick<ExtensionAPI, "getActiveTools" | "setActiveTools">): void {
  const active = new Set(pi.getActiveTools());
  active.add("get_goal");
  active.add("create_goal");
  const showCompletion = currentGoal?.status === "active";
  for (const name of COMPLETION_TOOL_NAMES) {
    if (showCompletion) active.add(name);
    else active.delete(name);
  }
  pi.setActiveTools(Array.from(active));
}
```

Call `syncGoalTools(pi)` after every state change and after session restore.

- [ ] **Step 3: Run all pi-goal tests**

Run: `node --test .pi/extensions/pi-goal/*.test.ts`

Expected: PASS.

### Task 2: Existing repo verification

**Files:**
- No source files expected unless verification exposes a pi-goal integration issue.

- [ ] **Step 1: Run existing profile extension tests**

Run: `node --test .pi/extensions/profile/*.test.ts`

Expected: PASS. This proves the new extension did not break existing local extension tests.

- [ ] **Step 2: Check TypeScript import/runtime compatibility through tests**

Run: `node --test .pi/extensions/pi-goal/*.test.ts .pi/extensions/profile/*.test.ts`

Expected: PASS.

- [ ] **Step 3: Inspect extension auto-discovery shape**

Run: `/usr/bin/find .pi/extensions/pi-goal -maxdepth 1 -type f -print | sort`

Expected output includes:

```text
.pi/extensions/pi-goal/commands.ts
.pi/extensions/pi-goal/format.ts
.pi/extensions/pi-goal/index.ts
.pi/extensions/pi-goal/prompts.ts
.pi/extensions/pi-goal/state.ts
.pi/extensions/pi-goal/tools.ts
```

No `.pi/settings.json` edit is needed because Pi auto-discovers `.pi/extensions/*/index.ts`.

### Task 3: Manual smoke checklist and cleanup

**Files:**
- No docs or README changes unless the user explicitly asks for user documentation.

- [ ] **Step 1: Run a manual Pi smoke session**

Run Pi normally from the repository root, then exercise:

```text
/goal status
/goal Verify pi-goal smoke behavior --budget 1000
/goal pause
/goal resume
/goal clear
```

Expected:

- `/goal status` with no goal reports usage.
- Creating a goal sets footer/status text.
- Pause stops automatic continuation.
- Resume allows automatic continuation.
- Clear removes footer/status text.
- Hidden continuation messages do not appear as visible user chat entries.

- [ ] **Step 2: Check changed files are scoped to pi-goal**

Run: `git status --short`

Expected new or modified implementation files are limited to:

```text
.pi/extensions/pi-goal/commands.ts
.pi/extensions/pi-goal/commands-tools.test.ts
.pi/extensions/pi-goal/format.ts
.pi/extensions/pi-goal/index.ts
.pi/extensions/pi-goal/prompts.ts
.pi/extensions/pi-goal/prompts.test.ts
.pi/extensions/pi-goal/runtime.test.ts
.pi/extensions/pi-goal/state.ts
.pi/extensions/pi-goal/state.test.ts
.pi/extensions/pi-goal/tools.ts
```

Pre-existing dirty files outside this list should not be modified by the pi-goal implementation.

- [ ] **Step 3: Commit final verification polish**

```bash
git add .pi/extensions/pi-goal
git commit -m "test(pi-goal): verify extension behavior"
```

## Phase Verification

Run:

```bash
node --test .pi/extensions/pi-goal/*.test.ts
node --test .pi/extensions/profile/*.test.ts
```

Expected: both commands PASS.
