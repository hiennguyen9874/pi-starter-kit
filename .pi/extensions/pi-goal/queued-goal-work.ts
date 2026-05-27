import type { GoalState } from "./state.ts";
import { compactContinuationPrompt } from "./prompts.ts";
import {
  continuationGoalIdFromContextMessage,
  type GoalContextMessage,
  type GoalTextPart,
} from "./queued-goal-messages.ts";

function supersededContinuationMessage(goalId: string): string {
  return [
    "A previous hidden pi-goal continuation was superseded by a newer continuation for the same active goal.",
    `Goal id: ${goalId}.`,
    "Ignore this superseded hidden bookkeeping message; do not perform work for it or mention it to the user.",
  ].join("\n");
}

function staleContinuationMessage(goalId: string, currentGoal: GoalState | null): string {
  const currentState = currentGoal
    ? `Current goal id: ${currentGoal.goalId}; current status: ${currentGoal.status}.`
    : "There is no current active goal.";
  return [
    "A queued hidden pi-goal continuation was stale and has been cancelled before running.",
    `Queued goal id: ${goalId}.`,
    currentState,
    "Ignore only this stale hidden bookkeeping message; do not perform work for the queued goal id above or mention this cancellation to the user.",
  ].join("\n");
}

export function applyQueuedGoalProviderContextRewrites(
  messages: GoalContextMessage[],
  currentGoal: GoalState | null
): { messages: GoalContextMessage[]; changed: boolean } {
  // Find all continuation messages and their goal IDs
  const continuationIndices = messages
    .map((msg, index) => ({ index, goalId: continuationGoalIdFromContextMessage(msg) }))
    .filter((entry): entry is { index: number; goalId: string } => entry.goalId !== null);

  if (continuationIndices.length === 0) {
    return { messages, changed: false };
  }

  // Group by goal ID
  const byGoalId = new Map<string, number[]>();
  for (const { index, goalId } of continuationIndices) {
    const indices = byGoalId.get(goalId) ?? [];
    indices.push(index);
    byGoalId.set(goalId, indices);
  }

  const result = messages.map((msg) => ({ ...msg }));
  let changed = false;

  for (const [goalId, indices] of byGoalId) {
    const isCurrentGoal = currentGoal?.goalId === goalId;

    if (isCurrentGoal) {
      // Keep only the latest message runnable, supersede older ones
      const latestIndex = indices[indices.length - 1];
      
      // Supersede all but the latest
      for (const index of indices.slice(0, -1)) {
        const marker = supersededContinuationMessage(goalId);
        result[index] = {
          ...result[index],
          content: marker,
          display: false,
          details: { kind: "superseded_continuation", goalId },
        };
        changed = true;
      }

      // Refresh the latest with compact prompt
      result[latestIndex] = {
        ...result[latestIndex],
        content: compactContinuationPrompt(currentGoal!),
        display: false,
      };
      changed = true;
    } else {
      // Stale continuation - rewrite all to cancellation marker
      const marker = staleContinuationMessage(goalId, currentGoal);
      for (const index of indices) {
        const msg = result[index];
        const newDetails = {
          kind: "stale_continuation",
          goalId,
          currentGoalId: currentGoal?.goalId ?? null,
          currentStatus: currentGoal?.status ?? null,
        };

        if (msg.role === "user" && Array.isArray(msg.content)) {
          // User message with text parts
          result[index] = {
            ...msg,
            content: [{ type: "text", text: marker } as GoalTextPart],
            details: newDetails,
          };
        } else {
          // Custom message with string content
          result[index] = {
            ...msg,
            content: marker,
            display: false,
            details: newDetails,
          };
        }
        changed = true;
      }
    }
  }

  return { messages: result, changed };
}
