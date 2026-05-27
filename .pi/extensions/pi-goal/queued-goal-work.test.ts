import test from "node:test";
import assert from "node:assert/strict";

import { continuationPrompt } from "./prompts.ts";
import type { GoalState } from "./state.ts";
import {
  continuationGoalIdFromContextMessage,
  isPiGoalContinuationDetails,
  textFromContextMessageContent,
} from "./queued-goal-messages.ts";
import { applyQueuedGoalProviderContextRewrites } from "./queued-goal-work.ts";

function goal(overrides: Partial<GoalState> = {}): GoalState {
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

test("queued message adapters extract continuation goal ids from custom details and content", () => {
  const current = goal({ goalId: "goal-abc" });
  assert.equal(isPiGoalContinuationDetails({ goalId: "goal-abc" }), true);
  assert.equal(isPiGoalContinuationDetails({ goalId: 123 }), false);
  assert.equal(
    continuationGoalIdFromContextMessage({
      role: "custom",
      customType: "pi-goal-continuation",
      content: continuationPrompt(current),
      details: { goalId: "goal-abc" },
    }),
    "goal-abc",
  );
  assert.equal(
    continuationGoalIdFromContextMessage({ role: "user", content: [{ type: "text", text: continuationPrompt(current) }] }),
    "goal-abc",
  );
});

test("textFromContextMessageContent handles strings and text parts only", () => {
  assert.equal(textFromContextMessageContent("plain"), "plain");
  assert.equal(textFromContextMessageContent([{ type: "text", text: "a" }, { type: "text", text: "b" }]), "a\nb");
  assert.equal(textFromContextMessageContent([{ type: "image", image: "x" }]), null);
  assert.equal(textFromContextMessageContent(null), null);
});

test("provider context keeps latest active continuation runnable and supersedes older active continuations", () => {
  const current = goal({ goalId: "goal-abc", tokensUsed: 10 });
  const first = { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(current), display: false, details: { goalId: "goal-abc" } };
  const second = { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt({ ...current, tokensUsed: 20 }), display: false, details: { goalId: "goal-abc" } };

  const result = applyQueuedGoalProviderContextRewrites([first, { role: "assistant", content: "middle" }, second], current);

  assert.equal(result.changed, true);
  assert.match(String(result.messages[0].content), /superseded/i);
  assert.match(String(result.messages[0].content), /goal-abc/);
  assert.match(String(result.messages[2].content), /Continue working toward the active goal/);
  assert.match(String(result.messages[2].content), /Tokens used: 10/);
});

test("provider context rewrites stale continuations to cancellation markers", () => {
  const stale = goal({ goalId: "stale-goal" });
  const current = goal({ goalId: "current-goal" });
  const result = applyQueuedGoalProviderContextRewrites([
    { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(stale), display: false, details: { goalId: "stale-goal" } },
    { role: "custom", customType: "other", content: "keep me", display: false },
  ], current);

  assert.equal(result.changed, true);
  assert.match(String(result.messages[0].content), /stale.*cancelled/i);
  assert.match(String(result.messages[0].content), /stale-goal/);
  assert.equal(result.messages[1].content, "keep me");
});

test("provider context removes runnable continuations when there is no active goal", () => {
  const stale = goal({ goalId: "stale-goal" });
  const result = applyQueuedGoalProviderContextRewrites([
    { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(stale), display: false, details: { goalId: "stale-goal" } },
  ], null);

  assert.equal(result.changed, true);
  assert.match(String(result.messages[0].content), /There is no current active goal/);
});

test("provider context stale overlap: goal-a continuation rewritten as stale when goal-b is active", () => {
  const goalA = goal({ goalId: "goal-a" });
  const goalB = goal({ goalId: "goal-b" });
  const result = applyQueuedGoalProviderContextRewrites([
    { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(goalA), display: false, details: { goalId: "goal-a" } },
    { role: "custom", customType: "pi-goal-continuation", content: continuationPrompt(goalB), display: false, details: { goalId: "goal-b" } },
  ], goalB);

  assert.equal(result.changed, true);
  assert.match(String(result.messages[0].content), /stale.*cancelled/i);
  assert.match(String(result.messages[0].content), /goal-a/);
  assert.match(String(result.messages[1].content), /Continue working toward the active goal/);
  assert.match(String(result.messages[1].content), /goal-b/);
});
