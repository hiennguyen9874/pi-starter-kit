import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

import { formatFooterStatus, goalToolText } from "./format.ts";
import { createGoal, parseTokenBudget, transitionGoal, type CreateGoalOptions, type GoalState } from "./state.ts";

export type GoalCommand =
  | { action: "status" | "pause" | "resume" | "clear" }
  | { action: "create"; objective: string; tokenBudget: number | null };

export type GoalCommandContext = Pick<ExtensionCommandContext, "hasUI" | "ui" | "isIdle" | "hasPendingMessages">;

export interface GoalCommandHost {
  getGoal(): GoalState | null;
  setGoal(goal: GoalState, source: "command", ctx: GoalCommandContext): void;
  clearGoal(source: "command", ctx: GoalCommandContext): void;
}

export function parseGoalCommand(args: string): GoalCommand {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "status") return { action: "status" };
  if (trimmed === "pause" || trimmed === "resume" || trimmed === "clear") return { action: trimmed };

  let objective = trimmed;
  let budgetText: string | undefined;
  const equals = objective.match(/\s--budget=([^\s]+)\s*$/);
  const spaced = objective.match(/\s--budget\s+([^\s]+)\s*$/);
  if (equals) {
    budgetText = equals[1];
    objective = objective.slice(0, equals.index).trim();
  } else if (spaced) {
    budgetText = spaced[1];
    objective = objective.slice(0, spaced.index).trim();
  }

  return { action: "create", objective, tokenBudget: parseTokenBudget(budgetText) };
}

export async function handleGoalCommand(
  host: GoalCommandHost,
  args: string,
  ctx: GoalCommandContext,
  createOptions: CreateGoalOptions = {},
): Promise<void> {
  try {
    const parsed = parseGoalCommand(args);
    const current = host.getGoal();

    if (parsed.action === "status") {
      ctx.ui.notify(current ? `${formatFooterStatus(current) ?? "Goal"}\n${goalToolText(current)}` : "No goal set. Usage: /goal <objective>", "info");
      return;
    }

    if (parsed.action === "clear") {
      if (!current) {
        ctx.ui.notify("No goal is set.", "info");
        return;
      }
      host.clearGoal("command", ctx);
      ctx.ui.notify("Goal cleared.", "info");
      return;
    }

    if (parsed.action === "pause" || parsed.action === "resume") {
      if (!current) {
        ctx.ui.notify("No goal is set.", "warning");
        return;
      }
      const next = transitionGoal(current, parsed.action === "pause" ? "paused" : "active");
      host.setGoal(next, "command", ctx);
      ctx.ui.notify(parsed.action === "pause" ? "Goal paused." : "Goal resumed.", "info");
      return;
    }

    if (current && current.status !== "complete" && current.status !== "cleared") {
      if (!ctx.hasUI) {
        ctx.ui.notify("Clear or complete the existing goal before creating another.", "warning");
        return;
      }
      const ok = await ctx.ui.confirm("Replace goal?", `Current goal:\n${current.objective}\n\nNew goal:\n${parsed.objective}`);
      if (!ok) {
        ctx.ui.notify("Goal unchanged.", "info");
        return;
      }
    }

    const next = createGoal(parsed.objective, parsed.tokenBudget, createOptions);
    host.setGoal(next, "command", ctx);
    ctx.ui.notify(`Goal created: ${next.objective}`, "info");
  } catch (error) {
    ctx.ui.notify(error instanceof Error ? error.message : "Goal command failed.", "warning");
  }
}

export function registerGoalCommand(pi: { registerCommand: Function }, host: GoalCommandHost): void {
  pi.registerCommand("goal", {
    description: "Set, inspect, pause, resume, or clear a long-running pi-goal objective.",
    getArgumentCompletions(prefix: string) {
      const values = ["status", "pause", "resume", "clear"];
      const matches = values.filter((value) => value.startsWith(prefix.trim()));
      return matches.length > 0 ? matches.map((value) => ({ value, label: value })) : null;
    },
    async handler(args: string, ctx: ExtensionCommandContext) {
      await handleGoalCommand(host, args, ctx);
    },
  });
}
