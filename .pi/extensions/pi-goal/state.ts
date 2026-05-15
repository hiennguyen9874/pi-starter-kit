import { randomUUID } from "node:crypto";

export const ENTRY_TYPE = "pi-goal";
export const CONTINUATION_MESSAGE_TYPE = "pi-goal-continuation";
export const MAX_OBJECTIVE_CHARS = 4000;

export type GoalStatus = "active" | "paused" | "budget_limited" | "complete" | "cleared";

export interface GoalState {
  version: 1;
  goalId: string;
  objective: string;
  status: GoalStatus;
  tokenBudget: number | null;
  tokensUsed: number;
  timeUsedSeconds: number;
  turnCount: number;
  continuationCount: number;
  lastContinuationHadToolCall: boolean;
  continuationSuppressed: boolean;
  continuationScheduled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GoalEntry {
  version: 1;
  action: "set" | "clear";
  goal: GoalState | null;
  clearedGoalId?: string | null;
  statusBarEnabled?: boolean;
  at: number;
}

export interface SessionEntryLike {
  type?: string;
  customType?: string;
  data?: unknown;
}

export interface CreateGoalOptions {
  goalId?: string;
  now?: number;
}

export interface UsageDelta {
  tokensDelta: number;
  secondsDelta: number;
  hadToolCall: boolean;
  wasContinuation: boolean;
  now?: number;
}

export function nowMs(): number {
  return Date.now();
}

export function normalizeObjective(objective: string): string {
  return objective.trim().replace(/\n{3,}/g, "\n\n");
}

export function validateObjective(objective: string): string | undefined {
  const normalized = normalizeObjective(objective);
  if (normalized.length === 0) return "Objective must not be empty.";
  if ([...normalized].length > MAX_OBJECTIVE_CHARS) return `Objective must be ${MAX_OBJECTIVE_CHARS} characters or fewer.`;
  return undefined;
}

export function parseTokenBudget(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)([kKmM])?$/);
  if (!match) throw new Error("Token budget must be a positive integer.");
  const base = Number.parseInt(match[1], 10);
  if (!Number.isSafeInteger(base) || base <= 0) throw new Error("Token budget must be a positive integer.");
  const suffix = match[2]?.toLowerCase();
  const multiplier = suffix === "m" ? 1_000_000 : suffix === "k" ? 1_000 : 1;
  return base * multiplier;
}

export function cloneGoal(goal: GoalState): GoalState {
  return { ...goal };
}

export function createGoal(objective: string, tokenBudget: number | null, options: CreateGoalOptions = {}): GoalState {
  const error = validateObjective(objective);
  if (error) throw new Error(error);
  const now = options.now ?? nowMs();
  return {
    version: 1,
    goalId: options.goalId ?? randomUUID(),
    objective: normalizeObjective(objective),
    status: "active",
    tokenBudget,
    tokensUsed: 0,
    timeUsedSeconds: 0,
    turnCount: 0,
    continuationCount: 0,
    lastContinuationHadToolCall: true,
    continuationSuppressed: false,
    continuationScheduled: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function transitionGoal(goal: GoalState, status: GoalStatus, now = nowMs()): GoalState {
  return {
    ...goal,
    status,
    continuationScheduled: false,
    continuationSuppressed: status === "active" ? false : goal.continuationSuppressed,
    lastContinuationHadToolCall: status === "active" ? true : goal.lastContinuationHadToolCall,
    updatedAt: now,
  };
}

export function applyGoalUsage(goal: GoalState, delta: UsageDelta): { goal: GoalState; crossedBudget: boolean } {
  const tokensDelta = Math.max(0, Math.trunc(delta.tokensDelta));
  const secondsDelta = Math.max(0, Math.trunc(delta.secondsDelta));
  const tokensUsed = goal.tokensUsed + tokensDelta;
  const wasUnderBudget = goal.tokenBudget === null || goal.tokensUsed < goal.tokenBudget;
  const crossedBudget = wasUnderBudget && goal.tokenBudget !== null && tokensUsed >= goal.tokenBudget;
  return {
    goal: {
      ...goal,
      tokensUsed,
      timeUsedSeconds: goal.timeUsedSeconds + secondsDelta,
      turnCount: goal.turnCount + 1,
      status: crossedBudget ? "budget_limited" : goal.status,
      lastContinuationHadToolCall: delta.hadToolCall,
      continuationSuppressed: delta.wasContinuation && !delta.hadToolCall,
      continuationScheduled: false,
      updatedAt: delta.now ?? nowMs(),
    },
    crossedBudget,
  };
}

export function goalEntry(goal: GoalState, at = nowMs(), statusBarEnabled?: boolean): GoalEntry {
  return { version: 1, action: "set", goal: cloneGoal(goal), statusBarEnabled, at };
}

export function clearGoalEntry(clearedGoalId: string | null, at = nowMs(), statusBarEnabled?: boolean): GoalEntry {
  return { version: 1, action: "clear", goal: null, clearedGoalId, statusBarEnabled, at };
}

export function isGoalState(value: unknown): value is GoalState {
  if (!value || typeof value !== "object") return false;
  const goal = value as Partial<GoalState>;
  return goal.version === 1 && typeof goal.goalId === "string" && typeof goal.objective === "string";
}

export function isGoalEntry(value: unknown): value is GoalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<GoalEntry>;
  if (entry.version !== 1 || typeof entry.at !== "number") return false;
  if (entry.action === "clear") return true;
  return entry.action === "set" && isGoalState(entry.goal);
}

export function reconstructGoal(entries: Iterable<SessionEntryLike>): GoalState | null {
  let current: GoalState | null = null;
  for (const entry of entries) {
    if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE || !isGoalEntry(entry.data)) continue;
    current = entry.data.action === "clear" ? null : cloneGoal(entry.data.goal);
  }
  return current;
}
