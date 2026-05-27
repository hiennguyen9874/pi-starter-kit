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

export function goalsEquivalent(a: GoalState | null, b: GoalState | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.version === b.version
    && a.goalId === b.goalId
    && a.objective === b.objective
    && a.status === b.status
    && a.tokenBudget === b.tokenBudget
    && a.tokensUsed === b.tokensUsed
    && a.timeUsedSeconds === b.timeUsedSeconds
    && a.turnCount === b.turnCount
    && a.continuationCount === b.continuationCount
    && a.lastContinuationHadToolCall === b.lastContinuationHadToolCall
    && a.continuationSuppressed === b.continuationSuppressed
    && a.continuationScheduled === b.continuationScheduled
    && a.createdAt === b.createdAt
    && a.updatedAt === b.updatedAt;
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

export interface GoalLifecycleCheck {
  ok: boolean;
  message: string;
}

export function isTerminalGoalStatus(status: GoalStatus): boolean {
  return status === "complete" || status === "cleared";
}

export function canPauseGoal(goal: GoalState): GoalLifecycleCheck {
  if (goal.status === "complete") return { ok: false, message: "Completed goals are terminal and cannot be paused." };
  if (goal.status !== "active") return { ok: false, message: "Only active goals can be paused." };
  return { ok: true, message: "Goal paused." };
}

export function canResumeGoal(goal: GoalState): GoalLifecycleCheck {
  if (goal.status === "complete") return { ok: false, message: "Completed goals are terminal and cannot be resumed." };
  if (goal.status !== "paused") return { ok: false, message: "Only paused goals can be resumed." };
  return { ok: true, message: "Goal resumed." };
}

export function completeGoalIdempotently(goal: GoalState, now = nowMs()): { goal: GoalState; changed: boolean; message: string } {
  if (goal.status === "complete") return { goal, changed: false, message: "Goal is already complete." };
  if (goal.status !== "active") throw new Error("update_goal requires an active goal.");
  return { goal: transitionGoal(goal, "complete", now), changed: true, message: "Goal completed." };
}
