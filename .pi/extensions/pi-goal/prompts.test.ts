import test from "node:test";
import assert from "node:assert/strict";

import { budgetLimitPrompt, continuationGoalIdFromMessage, continuationPrompt, escapeXmlText } from "./prompts.ts";
import type { GoalState } from "./state.ts";

const goal: GoalState = {
  version: 1,
  goalId: "goal-abc",
  objective: "Implement <feature> & verify",
  status: "active",
  tokenBudget: 1000,
  tokensUsed: 250,
  timeUsedSeconds: 65,
  turnCount: 2,
  continuationCount: 1,
  lastContinuationHadToolCall: true,
  continuationSuppressed: false,
  continuationScheduled: false,
  createdAt: 1,
  updatedAt: 2,
};

test("escapes XML-sensitive objective text", () => {
  assert.equal(escapeXmlText("a < b && c > d"), "a &lt; b &amp;&amp; c &gt; d");
});

test("renders continuation prompt with audit and untrusted-objective guardrails", () => {
  const prompt = continuationPrompt(goal);

  assert.match(prompt, /internal hidden pi-goal continuation message/);
  assert.match(prompt, /<pi_goal_continuation goal_id="goal-abc">/);
  assert.match(prompt, /<untrusted_objective>\nImplement &lt;feature&gt; &amp; verify\n<\/untrusted_objective>/);
  assert.match(prompt, /completion audit/i);
  assert.match(prompt, /prompt-to-artifact checklist/);
  assert.match(prompt, /proxy signals as completion/);
  assert.match(prompt, /verifier, test suite, or green status/);
  assert.match(prompt, /Report the final elapsed time/);
  assert.match(prompt, /Do not call update_goal unless the goal is complete/);
  assert.equal(continuationGoalIdFromMessage(prompt), "goal-abc");
});

test("renders budget limit prompt as wrap-up only", () => {
  const prompt = budgetLimitPrompt(goal);

  assert.match(prompt, /has reached its token budget/);
  assert.match(prompt, /system has marked the goal as budget_limited/i);
  assert.match(prompt, /do not start new substantive work/i);
  assert.match(prompt, /summarize useful progress/i);
  assert.match(prompt, /Do not call update_goal unless the goal is actually complete/);
});
