import test from "node:test";
import assert from "node:assert/strict";

import {
  ENTRY_TYPE,
  applyGoalUsage,
  clearGoalEntry,
  createGoal,
  goalEntry,
  parseTokenBudget,
  reconstructGoal,
  transitionGoal,
  validateObjective,
  type GoalState,
} from "./state.ts";
import {
  completionBudgetReport,
  formatDuration,
  formatFooterStatus,
  formatTokenValue,
  goalToolResponse,
} from "./format.ts";

function activeGoal(overrides: Partial<GoalState> = {}): GoalState {
  return {
    version: 1,
    goalId: "goal-1",
    objective: "Ship the feature",
    status: "active",
    tokenBudget: null,
    tokensUsed: 0,
    timeUsedSeconds: 0,
    turnCount: 0,
    continuationCount: 0,
    lastContinuationHadToolCall: true,
    continuationSuppressed: false,
    continuationScheduled: false,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

test("validates and normalizes objectives", () => {
  assert.equal(validateObjective(""), "Objective must not be empty.");
  assert.equal(validateObjective("   "), "Objective must not be empty.");
  assert.equal(validateObjective("x".repeat(4001)), "Objective must be 4000 characters or fewer.");
  assert.equal(validateObjective("  Build it\n\n\n\nVerify it  "), undefined);
  assert.equal(createGoal("  Build it\n\n\n\nVerify it  ", null, { goalId: "g", now: 1 }).objective, "Build it\n\nVerify it");
});

test("parses positive token budgets with optional suffixes", () => {
  assert.equal(parseTokenBudget(undefined), null);
  assert.equal(parseTokenBudget("100"), 100);
  assert.equal(parseTokenBudget("12k"), 12000);
  assert.equal(parseTokenBudget("2M"), 2000000);
  assert.throws(() => parseTokenBudget("0"), /positive integer/);
  assert.throws(() => parseTokenBudget("abc"), /positive integer/);
});

test("creates active goals with deterministic id and timestamps", () => {
  const goal = createGoal("Ship", 5000, { goalId: "goal-x", now: 123 });

  assert.equal(goal.goalId, "goal-x");
  assert.equal(goal.objective, "Ship");
  assert.equal(goal.status, "active");
  assert.equal(goal.tokenBudget, 5000);
  assert.equal(goal.tokensUsed, 0);
  assert.equal(goal.createdAt, 123);
  assert.equal(goal.updatedAt, 123);
});

test("transitions preserve user/system ownership semantics", () => {
  const goal = activeGoal({ tokensUsed: 10, tokenBudget: 20 });

  assert.equal(transitionGoal(goal, "paused", 2000).status, "paused");
  assert.equal(transitionGoal(goal, "complete", 2000).status, "complete");
  assert.equal(transitionGoal(goal, "budget_limited", 2000).status, "budget_limited");
  assert.equal(transitionGoal({ ...goal, status: "budget_limited" }, "active", 2000).status, "active");
});

test("usage accounting updates tokens, elapsed time, turns, and budget status", () => {
  const result = applyGoalUsage(activeGoal({ tokenBudget: 100 }), {
    tokensDelta: 120,
    secondsDelta: 7,
    hadToolCall: true,
    wasContinuation: true,
    now: 2000,
  });

  assert.equal(result.goal.tokensUsed, 120);
  assert.equal(result.goal.timeUsedSeconds, 7);
  assert.equal(result.goal.turnCount, 1);
  assert.equal(result.goal.lastContinuationHadToolCall, true);
  assert.equal(result.goal.continuationSuppressed, false);
  assert.equal(result.goal.status, "budget_limited");
  assert.equal(result.crossedBudget, true);
});

test("no-tool continuation suppresses the next automatic continuation", () => {
  const result = applyGoalUsage(activeGoal(), {
    tokensDelta: 0,
    secondsDelta: 1,
    hadToolCall: false,
    wasContinuation: true,
    now: 2000,
  });

  assert.equal(result.goal.continuationSuppressed, true);
  assert.equal(result.goal.lastContinuationHadToolCall, false);
});

test("reconstructs latest valid goal entry from branch entries", () => {
  const first = activeGoal({ goalId: "first" });
  const second = activeGoal({ goalId: "second", objective: "Latest" });

  const reconstructed = reconstructGoal([
    { type: "custom", customType: ENTRY_TYPE, data: goalEntry(first) },
    { type: "message" },
    { type: "custom", customType: ENTRY_TYPE, data: goalEntry(second) },
  ]);

  assert.equal(reconstructed?.goalId, "second");
  assert.equal(reconstructed?.objective, "Latest");
});

test("clear entries reconstruct as no goal", () => {
  const reconstructed = reconstructGoal([
    { type: "custom", customType: ENTRY_TYPE, data: goalEntry(activeGoal()) },
    { type: "custom", customType: ENTRY_TYPE, data: clearGoalEntry("goal-1", 2000) },
  ]);

  assert.equal(reconstructed, null);
});

test("formats duration and token values compactly", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(75), "1m 15s");
  assert.equal(formatDuration(3660), "1h 1m");
  assert.equal(formatTokenValue(999), "999");
  assert.equal(formatTokenValue(12000), "12K");
  assert.equal(formatTokenValue(2500000), "2.5M");
});

test("formats footer status for each visible state", () => {
  assert.equal(formatFooterStatus(null), undefined);
  assert.equal(formatFooterStatus(activeGoal({ timeUsedSeconds: 30 })), "Pursuing goal (30s)");
  assert.equal(formatFooterStatus(activeGoal({ tokenBudget: 50000, tokensUsed: 12500 })), "Pursuing goal (12.5K / 50K)");
  assert.equal(formatFooterStatus(activeGoal({ status: "paused" })), "Goal paused (/goal resume)");
  assert.equal(formatFooterStatus(activeGoal({ status: "budget_limited", tokenBudget: 100, tokensUsed: 120 })), "Goal unmet (120 / 100 tokens)");
  assert.equal(formatFooterStatus(activeGoal({ status: "complete", tokenBudget: 1000, tokensUsed: 800 })), "Goal achieved (800 tokens)");
});

test("formats tool response and completion budget report", () => {
  const complete = activeGoal({ status: "complete", tokenBudget: 1000, tokensUsed: 800, timeUsedSeconds: 90 });
  assert.match(completionBudgetReport(complete) ?? "", /tokens used: 800 of 1,000/);
  assert.deepEqual(goalToolResponse(null), { goal: null, remainingTokens: null, completionBudgetReport: null });
  assert.equal(goalToolResponse(complete, true).remainingTokens, 200);
  assert.match(goalToolResponse(complete, true).completionBudgetReport ?? "", /Goal achieved/);
});
