import type { GoalState } from "./state.ts";

export interface GoalToolRecord {
  goalId: string;
  objective: string;
  status: GoalState["status"];
  tokenBudget: number | null;
  tokensUsed: number;
  timeUsedSeconds: number;
  turnCount: number;
  continuationCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalToolResponse {
  goal: GoalToolRecord | null;
  remainingTokens: number | null;
  completionBudgetReport: string | null;
}

export function formatInteger(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString("en-US");
}

export function formatTokenValue(value: number): string {
  const normalized = Math.max(0, Math.trunc(value));
  if (normalized >= 1_000_000) return `${Number((normalized / 1_000_000).toFixed(1))}M`;
  if (normalized >= 1_000) return `${Number((normalized / 1_000).toFixed(1))}K`;
  return String(normalized);
}

export function formatDuration(seconds: number): string {
  const normalized = Math.max(0, Math.trunc(seconds));
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const remainingSeconds = normalized % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  return `${remainingSeconds}s`;
}

function budgetUsage(goal: GoalState): string {
  if (goal.tokenBudget === null) return `${formatTokenValue(goal.tokensUsed)} tokens`;
  return `${formatTokenValue(goal.tokensUsed)} / ${formatTokenValue(goal.tokenBudget)}`;
}

export function formatFooterStatus(goal: GoalState | null): string | undefined {
  if (!goal || goal.status === "cleared") return undefined;
  if (goal.status === "active") {
    return goal.tokenBudget === null
      ? `Pursuing goal (${formatDuration(goal.timeUsedSeconds)})`
      : `Pursuing goal (${budgetUsage(goal)})`;
  }
  if (goal.status === "paused") return "Goal paused (/goal resume)";
  if (goal.status === "budget_limited") return goal.tokenBudget === null ? "Goal unmet" : `Goal unmet (${budgetUsage(goal)} tokens)`;
  if (goal.tokenBudget !== null) return `Goal achieved (${formatTokenValue(goal.tokensUsed)} tokens)`;
  return `Goal achieved (${formatDuration(goal.timeUsedSeconds)})`;
}

export function toToolGoal(goal: GoalState): GoalToolRecord {
  return {
    goalId: goal.goalId,
    objective: goal.objective,
    status: goal.status,
    tokenBudget: goal.tokenBudget,
    tokensUsed: goal.tokensUsed,
    timeUsedSeconds: goal.timeUsedSeconds,
    turnCount: goal.turnCount,
    continuationCount: goal.continuationCount,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export function remainingTokens(goal: GoalState | null): number | null {
  if (!goal || goal.tokenBudget === null) return null;
  return Math.max(0, goal.tokenBudget - goal.tokensUsed);
}

export function completionBudgetReport(goal: GoalState | null): string | null {
  if (!goal || goal.status !== "complete") return null;
  const parts: string[] = [];
  if (goal.tokenBudget !== null) parts.push(`tokens used: ${formatInteger(goal.tokensUsed)} of ${formatInteger(goal.tokenBudget)}`);
  if (goal.timeUsedSeconds > 0) parts.push(`time used: ${formatDuration(goal.timeUsedSeconds)}`);
  return parts.length > 0 ? `Goal achieved. Report final budget usage to the user: ${parts.join("; ")}.` : null;
}

export function goalToolResponse(goal: GoalState | null, includeCompletionBudgetReport = false): GoalToolResponse {
  return {
    goal: goal ? toToolGoal(goal) : null,
    remainingTokens: remainingTokens(goal),
    completionBudgetReport: includeCompletionBudgetReport ? completionBudgetReport(goal) : null,
  };
}

export function goalToolText(goal: GoalState | null, includeCompletionBudgetReport = false): string {
  return JSON.stringify(goalToolResponse(goal, includeCompletionBudgetReport), null, 2);
}
