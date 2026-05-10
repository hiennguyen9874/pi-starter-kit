import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

import { registerGoalCommand } from "./commands.ts";
import { formatFooterStatus } from "./format.ts";
import { budgetLimitPrompt, continuationPrompt } from "./prompts.ts";
import {
  CONTINUATION_MESSAGE_TYPE,
  ENTRY_TYPE,
  clearGoalEntry,
  goalEntry,
  reconstructGoal,
  transitionGoal,
  applyGoalUsage,
  type GoalState,
} from "./state.ts";
import { registerGoalTools } from "./tools.ts";

export interface GoalExtensionOptions {
  clock?: () => number;
  scheduler?: (fn: () => void) => unknown;
}

interface UsageCarrier {
  usage?: Record<string, unknown>;
  metadata?: { usage?: Record<string, unknown> };
  tokens?: Record<string, unknown>;
}

function numberFrom(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

export function extractTokenUsage(message: UsageCarrier | undefined): number {
  const usage = message?.usage ?? message?.metadata?.usage ?? message?.tokens;
  if (!usage) return 0;
  const explicitTotal = numberFrom(usage.totalTokens ?? usage.total);
  if (explicitTotal > 0) return explicitTotal;
  return numberFrom(usage.input ?? usage.inputTokens ?? usage.promptTokens)
    + numberFrom(usage.output ?? usage.outputTokens ?? usage.completionTokens)
    + numberFrom(usage.reasoning ?? usage.reasoningTokens)
    + numberFrom(usage.cacheRead ?? usage.cacheReadTokens)
    + numberFrom(usage.cacheWrite ?? usage.cacheWriteTokens);
}

export function shouldScheduleContinuation(
  goal: GoalState | null,
  options: { planModeActive: boolean; toolsRestricted?: boolean },
): boolean {
  if (!goal) return false;
  if (goal.status !== "active") return false;
  if (goal.continuationScheduled) return false;
  if (goal.continuationSuppressed) return false;
  if (options.planModeActive) return false;
  if (options.toolsRestricted) return false;
  return true;
}

export function createGoalExtension(options: GoalExtensionOptions = {}) {
  const clock = options.clock ?? (() => Date.now());
  const scheduler = options.scheduler ?? ((fn: () => void) => setTimeout(fn, 0));
  let currentGoal: GoalState | null = null;
  let awaitingContinuationGoalId: string | null = null;
  let continuationGeneration = 0;
  let activeTurnStartedAt: number | null = null;
  let currentTurnHadToolCall = false;
  let currentTurnIsContinuation = false;
  let pendingCompletionGoalId: string | null = null;
  let planModeActive = false;
  let toolsRestricted = false;

  function refreshStatus(ctx: Pick<ExtensionContext, "ui">): void {
    ctx.ui.setStatus("pi-goal", formatFooterStatus(currentGoal));
  }

  function syncGoalTools(pi: Pick<ExtensionAPI, "getActiveTools" | "setActiveTools">): void {
    const active = new Set(pi.getActiveTools());
    active.add("get_goal");
    active.add("create_goal");

    const showUpdateGoal = currentGoal?.status === "active";
    if (showUpdateGoal) active.add("update_goal");
    else active.delete("update_goal");

    pi.setActiveTools(Array.from(active));
  }

  function persist(pi: Pick<ExtensionAPI, "appendEntry">, goal: GoalState): void {
    currentGoal = goal;
    pi.appendEntry(ENTRY_TYPE, goalEntry(goal, clock()));
  }

  function clear(pi: Pick<ExtensionAPI, "appendEntry">): void {
    const clearedGoalId = currentGoal?.goalId ?? null;
    currentGoal = null;
    pendingCompletionGoalId = null;
    pi.appendEntry(ENTRY_TYPE, clearGoalEntry(clearedGoalId, clock()));
  }

  function restore(pi: Pick<ExtensionAPI, "getActiveTools" | "setActiveTools">, ctx: ExtensionContext): void {
    currentGoal = reconstructGoal(ctx.sessionManager.getBranch());
    awaitingContinuationGoalId = null;
    pendingCompletionGoalId = null;
    continuationGeneration++;
    syncGoalTools(pi);
    refreshStatus(ctx);
  }

  function invalidateContinuation(): void {
    continuationGeneration++;
    if (currentGoal?.continuationScheduled) {
      currentGoal = { ...currentGoal, continuationScheduled: false, updatedAt: clock() };
    }
  }

  function scheduleContinuation(
    pi: Pick<ExtensionAPI, "sendMessage" | "appendEntry">,
    ctx?: Pick<ExtensionContext, "isIdle" | "hasPendingMessages">,
  ): boolean {
    if (!shouldScheduleContinuation(currentGoal, { planModeActive, toolsRestricted })) return false;
    if (ctx && (!ctx.isIdle() || ctx.hasPendingMessages())) return false;

    currentGoal = { ...currentGoal, continuationScheduled: true, updatedAt: clock() };
    persist(pi, currentGoal);

    const goalId = currentGoal.goalId;
    const generation = ++continuationGeneration;

    scheduler(() => {
      if (!currentGoal || currentGoal.goalId !== goalId || currentGoal.status !== "active") return;
      if (planModeActive || toolsRestricted || currentGoal.continuationSuppressed) return;
      if (!currentGoal.continuationScheduled || generation !== continuationGeneration) return;
      if (ctx && (!ctx.isIdle() || ctx.hasPendingMessages())) {
        currentGoal = { ...currentGoal, continuationScheduled: false, updatedAt: clock() };
        persist(pi, currentGoal);
        return;
      }

      currentGoal = {
        ...currentGoal,
        continuationScheduled: false,
        continuationCount: currentGoal.continuationCount + 1,
        updatedAt: clock(),
      };
      persist(pi, currentGoal);
      awaitingContinuationGoalId = goalId;

      pi.sendMessage(
        {
          customType: CONTINUATION_MESSAGE_TYPE,
          content: continuationPrompt(currentGoal),
          display: false,
          details: { goalId },
        },
        { triggerTurn: true },
      );
    });

    return true;
  }

  function register(pi: ExtensionAPI): void {
    registerGoalTools(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        persist(pi, goal);
        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
      },
      completeGoal(_source, ctx) {
        if (!currentGoal) throw new Error("No goal is set.");
        if (currentGoal.status !== "active") throw new Error("update_goal requires an active goal.");
        pendingCompletionGoalId = currentGoal.goalId;
        const complete = transitionGoal(currentGoal, "complete", clock());
        refreshStatus(ctx as ExtensionContext);
        return complete;
      },
    });

    registerGoalCommand(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        const previousStatus = currentGoal?.status ?? null;
        const isNewGoal = currentGoal?.goalId !== goal.goalId;
        invalidateContinuation();
        persist(pi, goal);

        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
        if (isNewGoal && goal.status === "active" && ctx.isIdle() && !ctx.hasPendingMessages()) {
          pi.sendUserMessage(goal.objective);
        } else if (!isNewGoal && previousStatus !== "active" && goal.status === "active") {
          scheduleContinuation(pi, ctx);
        }
      },
      clearGoal(_source, ctx) {
        invalidateContinuation();
        clear(pi);
        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
      },
    });

    pi.on("session_start", (_event, ctx) => restore(pi, ctx));
    pi.on("session_tree", (_event, ctx) => restore(pi, ctx));
    pi.on("session_compact", (_event, ctx) => restore(pi, ctx));
    pi.on("before_agent_start", (event) => {
      const prompt = String(event.prompt ?? "").toLowerCase();
      planModeActive = prompt.includes("plan mode") || prompt.includes("read-only") || prompt.includes("do not implement code");
      const activeTools = new Set(pi.getActiveTools());
      const hasMutatingTool = activeTools.has("edit") || activeTools.has("write") || activeTools.has("bash");
      toolsRestricted = !hasMutatingTool;
    });
    pi.on("input", (event) => {
      if (event.source === "extension" || !currentGoal) return { action: "continue" };
      invalidateContinuation();
      if (currentGoal.status === "active") {
        currentGoal = {
          ...currentGoal,
          continuationSuppressed: false,
          lastContinuationHadToolCall: true,
          continuationScheduled: false,
          updatedAt: clock(),
        };
        persist(pi, currentGoal);
        syncGoalTools(pi);
      }
      return { action: "continue" };
    });
    pi.on("turn_start", (event) => {
      activeTurnStartedAt = event.timestamp ?? clock();
      currentTurnHadToolCall = false;
      currentTurnIsContinuation = currentGoal?.goalId === awaitingContinuationGoalId;
      if (currentGoal?.goalId === awaitingContinuationGoalId) awaitingContinuationGoalId = null;
    });
    pi.on("turn_end", (event, ctx) => {
      if (currentGoal?.status !== "active") {
        syncGoalTools(pi);
        refreshStatus(ctx);
        return;
      }

      const elapsedSeconds = activeTurnStartedAt === null ? 0 : Math.max(0, Math.floor((clock() - activeTurnStartedAt) / 1000));
      const tokensDelta = extractTokenUsage(event.message as UsageCarrier | undefined);
      const result = applyGoalUsage(currentGoal, {
        tokensDelta,
        secondsDelta: elapsedSeconds,
        hadToolCall: currentTurnHadToolCall,
        wasContinuation: currentTurnIsContinuation,
        now: clock(),
      });
      const nextGoal = pendingCompletionGoalId === result.goal.goalId
        ? transitionGoal(result.goal, "complete", clock())
        : result.goal;
      if (pendingCompletionGoalId === result.goal.goalId) pendingCompletionGoalId = null;
      persist(pi, nextGoal);
      syncGoalTools(pi);
      if (result.crossedBudget && nextGoal.status !== "complete") {
        pi.sendMessage(
          {
            customType: CONTINUATION_MESSAGE_TYPE,
            content: budgetLimitPrompt(result.goal),
            display: false,
            details: { goalId: result.goal.goalId, kind: "budget_limit" },
          },
          { triggerTurn: true, deliverAs: "steer" },
        );
      }
      refreshStatus(ctx);
    });
    pi.on("agent_end", (_event, ctx) => {
      scheduleContinuation(pi, ctx);
      syncGoalTools(pi);
      refreshStatus(ctx);
    });
    pi.on("tool_execution_end", () => {
      currentTurnHadToolCall = true;
    });
    pi.on("session_shutdown", () => {
      invalidateContinuation();
      awaitingContinuationGoalId = null;
      activeTurnStartedAt = null;
      currentTurnHadToolCall = false;
      currentTurnIsContinuation = false;
      pendingCompletionGoalId = null;
    });
    pi.on("context", (event) => {
      const latestActiveContinuationIndex = currentGoal?.status === "active"
        ? event.messages.findLastIndex((message: { customType?: string; details?: { goalId?: unknown } }) => (
          message.customType === CONTINUATION_MESSAGE_TYPE && message.details?.goalId === currentGoal.goalId
        ))
        : -1;
      const messages = event.messages.filter((message: { customType?: string; details?: { goalId?: unknown } }, index: number) => {
        if (message.customType !== CONTINUATION_MESSAGE_TYPE) return true;
        return index === latestActiveContinuationIndex;
      });
      return messages.length === event.messages.length ? undefined : { messages };
    });
  }

  return { register, scheduleContinuation, get currentGoal() { return currentGoal; } };
}

export default function piGoalExtension(pi: ExtensionAPI): void {
  createGoalExtension().register(pi);
}
