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
