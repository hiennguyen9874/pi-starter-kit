import type { GoalStatus } from "./state.ts";

export type StaleQueuedWorkEffect =
  | { type: "clearAccounting" }
  | { type: "refreshUi" }
  | { type: "abort" };

export interface QueuedWorkSnapshot {
  queuedGoalId: string | null;
  currentGoalId: string | null;
  currentStatus: GoalStatus | null;
}

export interface TurnStartPlan {
  stale: boolean;
  effects: StaleQueuedWorkEffect[];
}

export interface AgentEndPlan {
  skipContinuation: boolean;
  effects: StaleQueuedWorkEffect[];
}

function isRunnable(snapshot: QueuedWorkSnapshot): boolean {
  return snapshot.queuedGoalId !== null
    && snapshot.currentGoalId === snapshot.queuedGoalId
    && snapshot.currentStatus === "active";
}

export function createStaleQueuedWorkGuard() {
  const staleTurnGoalIds = new Set<string>();

  return {
    planTurnStart(snapshot: QueuedWorkSnapshot): TurnStartPlan {
      if (snapshot.queuedGoalId === null || isRunnable(snapshot)) return { stale: false, effects: [] };
      staleTurnGoalIds.add(snapshot.queuedGoalId);
      return { stale: true, effects: [{ type: "clearAccounting" }, { type: "refreshUi" }, { type: "abort" }] };
    },
    planAgentEnd(input: { queuedGoalId: string | null }): AgentEndPlan {
      if (input.queuedGoalId === null || !staleTurnGoalIds.delete(input.queuedGoalId)) {
        return { skipContinuation: false, effects: [] };
      }
      return { skipContinuation: true, effects: [{ type: "clearAccounting" }, { type: "refreshUi" }] };
    },
    clear(): void {
      staleTurnGoalIds.clear();
    },
  };
}
