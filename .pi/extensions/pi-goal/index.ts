import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { registerGoalCommand } from "./commands.ts";
import { formatDuration, formatFooterStatus, formatTokenValue } from "./format.ts";
import { budgetLimitPrompt, continuationGoalIdFromMessage, continuationPrompt, initPrompt } from "./prompts.ts";
import {
  CONTINUATION_MESSAGE_TYPE,
  ENTRY_TYPE,
  clearGoalEntry,
  cloneGoal,
  goalEntry,
  goalsEquivalent,
  reconstructGoal,
  transitionGoal,
  applyGoalUsage,
  completeGoalIdempotently,
  type GoalEntry,
  type GoalState,
} from "./state.ts";
import { registerGoalTools } from "./tools.ts";
import { applyQueuedGoalProviderContextRewrites } from "./queued-goal-work.ts";
import { createStaleQueuedWorkGuard, type StaleQueuedWorkEffect } from "./stale-queued-work-guard.ts";

export interface GoalExtensionOptions {
  clock?: () => number;
  scheduler?: (fn: () => void) => unknown;
}

type GoalEventKind = "created" | "paused" | "resumed" | "cleared" | "completed";
const GOAL_EVENT_MESSAGE_TYPE = "pi-goal-event";

interface UsageCarrier {
  usage?: Record<string, unknown>;
  metadata?: { usage?: Record<string, unknown> };
  tokens?: Record<string, unknown>;
}

function numberFrom(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function textComponent(text: string) {
  return {
    render(width: number): string[] {
      const safeWidth = Math.max(1, Math.trunc(width));
      return [text.length > safeWidth ? text.slice(0, safeWidth) : text];
    },
    invalidate() {},
  };
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
  options: { toolsRestricted?: boolean },
): boolean {
  if (!goal) return false;
  if (goal.status !== "active") return false;
  if (goal.continuationScheduled) return false;
  if (goal.continuationSuppressed) return false;
  if (options.toolsRestricted) return false;
  return true;
}

export function createGoalExtension(options: GoalExtensionOptions = {}) {
  const clock = options.clock ?? (() => Date.now());
  const scheduler = options.scheduler ?? ((fn: () => void) => setTimeout(fn, 0));
  let currentGoal: GoalState | null = null;
  let lastPersistedGoal: GoalState | null = null;
  let lastRuntimePersistAt: number | null = null;
  const runtimePersistIntervalMs = 60_000;
  let statusBarEnabled = true;
  let awaitingContinuationGoalId: string | null = null;
  let continuationGeneration = 0;
  let pendingContinuationGoalId: string | null = null;
  let pendingContinuationMessage: string | null = null;
  let pendingContinuationGeneration = 0;
  let activeTurnStartedAt: number | null = null;
  let currentTurnHadToolCall = false;
  let currentTurnIsContinuation = false;
  let pendingCompletionGoalId: string | null = null;
  let toolsRestricted = false;
  const staleQueuedWorkGuard = createStaleQueuedWorkGuard();
  let currentTurnQueuedGoalId: string | null = null;
  let currentTurnIsStaleQueuedWork = false;

  function clearActiveTurnAccounting(): void {
    activeTurnStartedAt = null;
    currentTurnHadToolCall = false;
    currentTurnIsContinuation = false;
  }

  function applyStaleQueuedWorkEffects(effects: readonly StaleQueuedWorkEffect[], ctx: ExtensionContext): void {
    for (const effect of effects) {
      if (effect.type === "clearAccounting") clearActiveTurnAccounting();
      else if (effect.type === "refreshUi") refreshStatus(ctx);
      else if (effect.type === "abort") ctx.abort?.();
    }
  }

  function refreshStatus(ctx: Pick<ExtensionContext, "ui">): void {
    ctx.ui.setStatus("pi-goal", statusBarEnabled ? formatFooterStatus(currentGoal) : undefined);
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

  function persist(pi: Pick<ExtensionAPI, "appendEntry">, goal: GoalState, options?: { force?: boolean }): void {
    currentGoal = goal;
    if (!options?.force && goalsEquivalent(goal, lastPersistedGoal)) {
      return;
    }
    pi.appendEntry(ENTRY_TYPE, goalEntry(goal, clock(), statusBarEnabled));
    lastPersistedGoal = cloneGoal(goal);
    lastRuntimePersistAt = clock();
  }

  function clear(pi: Pick<ExtensionAPI, "appendEntry">): void {
    const clearedGoalId = currentGoal?.goalId ?? null;
    currentGoal = null;
    lastPersistedGoal = null;
    lastRuntimePersistAt = null;
    pendingCompletionGoalId = null;
    staleQueuedWorkGuard.clear();
    currentTurnQueuedGoalId = null;
    currentTurnIsStaleQueuedWork = false;
    pi.appendEntry(ENTRY_TYPE, clearGoalEntry(clearedGoalId, clock(), statusBarEnabled));
  }

  function restore(pi: Pick<ExtensionAPI, "getActiveTools" | "setActiveTools">, ctx: ExtensionContext): void {
    const branch = ctx.sessionManager.getBranch();
    currentGoal = reconstructGoal(branch);
    lastPersistedGoal = currentGoal ? cloneGoal(currentGoal) : null;
    lastRuntimePersistAt = null;
    for (const entry of branch) {
      if (entry?.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
      const data = entry.data as GoalEntry | undefined;
      if (typeof data?.statusBarEnabled === "boolean") statusBarEnabled = data.statusBarEnabled;
    }
    awaitingContinuationGoalId = null;
    pendingCompletionGoalId = null;
    if (currentGoal?.continuationScheduled) {
      currentGoal = { ...currentGoal, continuationScheduled: false };
    }
    continuationGeneration++;
    syncGoalTools(pi);
    refreshStatus(ctx);
  }

  function flushRuntimePersistence(pi: Pick<ExtensionAPI, "appendEntry">): void {
    if (!currentGoal) return;
    if (lastRuntimePersistAt !== null && clock() - lastRuntimePersistAt < runtimePersistIntervalMs) {
      return;
    }
    persist(pi, currentGoal);
  }

  function invalidateContinuation(): void {
    continuationGeneration++;
    pendingContinuationGeneration++;
    pendingContinuationGoalId = null;
    pendingContinuationMessage = null;
    staleQueuedWorkGuard.clear();
    currentTurnQueuedGoalId = null;
    currentTurnIsStaleQueuedWork = false;
    if (currentGoal?.continuationScheduled) {
      currentGoal = { ...currentGoal, continuationScheduled: false, updatedAt: clock() };
    }
  }

  function hasPendingContinuation(): boolean {
    return pendingContinuationGoalId !== null && pendingContinuationMessage !== null;
  }

  function schedulePendingContinuation(
    pi: Pick<ExtensionAPI, "sendMessage" | "appendEntry">,
    ctx?: Pick<ExtensionContext, "isIdle" | "hasPendingMessages">,
  ): boolean {
    if (!hasPendingContinuation()) return false;
    const generation = ++pendingContinuationGeneration;

    scheduler(() => {
      if (generation !== pendingContinuationGeneration) return;
      if (!currentGoal || currentGoal.goalId !== pendingContinuationGoalId || currentGoal.status !== "active") return;
      if (toolsRestricted || currentGoal.continuationSuppressed) return;
      if (!currentGoal.continuationScheduled) return;
      if (ctx && (!ctx.isIdle() || ctx.hasPendingMessages())) return;

      const goalId = currentGoal.goalId;
      const message = pendingContinuationMessage;
      pendingContinuationGoalId = null;
      pendingContinuationMessage = null;

      currentGoal = {
        ...currentGoal,
        continuationScheduled: false,
        continuationCount: currentGoal.continuationCount + 1,
        updatedAt: clock(),
      };
      persist(pi, currentGoal, { force: true });
      awaitingContinuationGoalId = goalId;

      pi.sendMessage(
        {
          customType: CONTINUATION_MESSAGE_TYPE,
          content: message,
          display: false,
          details: { goalId },
        },
        { triggerTurn: true },
      );
    });

    return true;
  }

  function scheduleContinuation(
    pi: Pick<ExtensionAPI, "sendMessage" | "appendEntry">,
    ctx?: Pick<ExtensionContext, "isIdle" | "hasPendingMessages">,
  ): boolean {
    if (!shouldScheduleContinuation(currentGoal, { toolsRestricted })) return false;

    currentGoal = { ...currentGoal, continuationScheduled: true, updatedAt: clock() };
    persist(pi, currentGoal, { force: true });

    pendingContinuationGoalId = currentGoal.goalId;
    pendingContinuationMessage = continuationPrompt(currentGoal);
    continuationGeneration++;

    return schedulePendingContinuation(pi, ctx);
  }

  function ensurePendingContinuation(
    pi: Pick<ExtensionAPI, "sendMessage" | "appendEntry">,
    ctx?: Pick<ExtensionContext, "isIdle" | "hasPendingMessages">,
  ): boolean {
    if (hasPendingContinuation()) {
      return schedulePendingContinuation(pi, ctx);
    }
    return scheduleContinuation(pi, ctx);
  }

  function emitGoalEvent(pi: Pick<ExtensionAPI, "sendMessage">, kind: GoalEventKind, goal: GoalState | null): void {
    pi.sendMessage({
      customType: GOAL_EVENT_MESSAGE_TYPE,
      content: kind,
      display: true,
      details: {
        kind,
        objective: goal?.objective ?? null,
        status: goal?.status ?? null,
      },
    }, undefined);
  }

  function register(pi: ExtensionAPI): void {
    (pi as unknown as { registerMessageRenderer?: Function }).registerMessageRenderer?.(
      GOAL_EVENT_MESSAGE_TYPE,
      (message: { details?: { kind?: string; objective?: string | null; status?: string | null } }) => textComponent(
        `Goal ${message.details?.kind ?? "updated"}${message.details?.objective ? `: ${message.details.objective}` : ""}`,
      ),
    );

    registerGoalTools(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        persist(pi, goal, { force: true });
        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
      },
      completeGoal(_source, ctx) {
        if (!currentGoal) throw new Error("No goal is set.");
        const result = completeGoalIdempotently(currentGoal, clock());
        if (result.changed) pendingCompletionGoalId = currentGoal.goalId;
        refreshStatus(ctx as ExtensionContext);
        return result.goal;
      },
    });

    registerGoalCommand(pi, {
      getGoal: () => currentGoal,
      setGoal(goal, _source, ctx) {
        const previousGoal = currentGoal;
        const previousStatus = previousGoal?.status ?? null;
        const isNewGoal = previousGoal?.goalId !== goal.goalId;
        invalidateContinuation();
        persist(pi, goal, { force: true });

        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
        if (isNewGoal) emitGoalEvent(pi, "created", goal);
        if (!isNewGoal && previousStatus === "active" && goal.status === "paused") emitGoalEvent(pi, "paused", goal);
        if (!isNewGoal && previousStatus !== "active" && goal.status === "active") emitGoalEvent(pi, "resumed", goal);
        if (isNewGoal && goal.status === "active" && ctx.isIdle() && !ctx.hasPendingMessages()) {
          pi.sendUserMessage(initPrompt(goal));
        } else if (!isNewGoal && previousStatus !== "active" && goal.status === "active") {
          scheduleContinuation(pi, ctx);
        }
      },
      clearGoal(_source, ctx) {
        const clearedGoal = currentGoal;
        invalidateContinuation();
        clear(pi);
        syncGoalTools(pi);
        refreshStatus(ctx as ExtensionContext);
        emitGoalEvent(pi, "cleared", clearedGoal);
      },
      setStatusBar(value, _source, ctx) {
        statusBarEnabled = value === "on" ? true : value === "off" ? false : !statusBarEnabled;
        if (currentGoal) persist(pi, currentGoal);
        refreshStatus(ctx as ExtensionContext);
        return statusBarEnabled;
      },
    });

    pi.on("session_start", (event, ctx) => {
      restore(pi, ctx);
      if (event.reason === "reload" && currentGoal?.status === "active") {
        currentGoal = transitionGoal(currentGoal, "paused", clock());
        persist(pi, currentGoal, { force: true });
        refreshStatus(ctx);
        ctx.ui.notify(`Goal paused after reload: ${currentGoal.objective}. Use /goal resume to continue.`);
      }
    });
    pi.on("session_tree", (_event, ctx) => restore(pi, ctx));
    pi.on("session_compact", (_event, ctx) => {
      restore(pi, ctx);
      flushRuntimePersistence(pi);
      ensurePendingContinuation(pi, ctx);
    });
    pi.on("before_agent_start", (event) => {
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
    pi.on("turn_start", (event, ctx) => {
      activeTurnStartedAt = event.timestamp ?? clock();
      currentTurnHadToolCall = false;
      
      const queuedGoalId = typeof event.details?.goalId === "string"
        ? event.details.goalId
        : typeof event.message === "string"
          ? continuationGoalIdFromMessage(event.message)
          : null;
      currentTurnQueuedGoalId = queuedGoalId;

      const plan = staleQueuedWorkGuard.planTurnStart({
        queuedGoalId,
        currentGoalId: currentGoal?.goalId ?? null,
        currentStatus: currentGoal?.status ?? null,
      });
      currentTurnIsStaleQueuedWork = plan.stale;

      if (plan.stale) {
        applyStaleQueuedWorkEffects(plan.effects, ctx);
        currentTurnIsContinuation = false;
        return;
      }
      
      // Normal case: not stale
      currentTurnIsContinuation = currentGoal?.goalId === awaitingContinuationGoalId;
      if (currentGoal?.goalId === awaitingContinuationGoalId) awaitingContinuationGoalId = null;
    });
    pi.on("turn_end", (event, ctx) => {
      if (currentTurnIsStaleQueuedWork) {
        clearActiveTurnAccounting();
        syncGoalTools(pi);
        refreshStatus(ctx);
        return;
      }

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
      const isCompleting = pendingCompletionGoalId === result.goal.goalId;
      const nextGoal = isCompleting
        ? transitionGoal(result.goal, "complete", clock())
        : result.goal;
      if (isCompleting) pendingCompletionGoalId = null;
      persist(pi, nextGoal, { force: isCompleting || result.crossedBudget });
      syncGoalTools(pi);
      if (isCompleting) {
        emitGoalEvent(pi, "completed", nextGoal);
        const parts: string[] = [`Goal achieved: ${nextGoal.objective}`];
        parts.push(`Time: ${formatDuration(nextGoal.timeUsedSeconds)}`);
        parts.push(`Tokens: ${formatTokenValue(nextGoal.tokensUsed)}${nextGoal.tokenBudget !== null ? ` / ${formatTokenValue(nextGoal.tokenBudget)}` : ""}`);
        parts.push(`Turns: ${nextGoal.turnCount} (${nextGoal.continuationCount} continuations)`);
        ctx.ui.notify(parts.join(" | "), "info");
      }
      if (result.crossedBudget && nextGoal.status !== "complete") {
        ctx.ui.notify(`Goal budget exhausted: ${formatTokenValue(result.goal.tokensUsed)} / ${formatTokenValue(result.goal.tokenBudget!)} tokens used. Wrapping up.`, "warning");
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
      if (result.goal.continuationSuppressed && !isCompleting && !result.crossedBudget) {
        ctx.ui.notify("Goal continuation paused: no progress detected. Send a message or /goal resume to continue.", "warning");
      }
      refreshStatus(ctx);
    });
    pi.on("agent_end", (event, ctx) => {
      const agentEndPlan = staleQueuedWorkGuard.planAgentEnd({ queuedGoalId: currentTurnQueuedGoalId });
      if (agentEndPlan.skipContinuation) {
        applyStaleQueuedWorkEffects(agentEndPlan.effects, ctx);
        currentTurnQueuedGoalId = null;
        currentTurnIsStaleQueuedWork = false;
        syncGoalTools(pi);
        refreshStatus(ctx);
        return;
      }
      ensurePendingContinuation(pi, ctx);
      syncGoalTools(pi);
      refreshStatus(ctx);
    });
    pi.on("tool_execution_end", () => {
      currentTurnHadToolCall = true;
    });
    pi.on("session_shutdown", () => {
      flushRuntimePersistence(pi);
      invalidateContinuation();
      awaitingContinuationGoalId = null;
      activeTurnStartedAt = null;
      currentTurnHadToolCall = false;
      currentTurnIsContinuation = false;
      pendingCompletionGoalId = null;
      pendingContinuationGoalId = null;
      pendingContinuationMessage = null;
    });
    pi.on("context", (event) => {
      const result = applyQueuedGoalProviderContextRewrites(event.messages, currentGoal);
      return result.changed ? { messages: result.messages } : undefined;
    });
  }

  return { register, scheduleContinuation, get currentGoal() { return currentGoal; } };
}

export default function piGoalExtension(pi: ExtensionAPI): void {
  createGoalExtension().register(pi);
}
