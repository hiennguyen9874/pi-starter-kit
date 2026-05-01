import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const GUIDELINES = `## Behavioral Guidelines

### Autonomous Completion

- Continue until user request is resolved to best available standard.
- Do not stop after partial discovery when next safe action is obvious.
- If blocked, explain exact blocker and best next user action.
- Prefer partial completion with clear limits over broad clarification.
- Ask user only when ambiguity changes implementation, safety, or irreversible outcome.

### Think Before Coding

- State important assumptions when they affect implementation.
- If ambiguity blocks safe progress, ask one focused question.
- If multiple valid choices affect outcome, present tradeoff and ask.
- If uncertainty is minor and reversible, state assumption and proceed.
- Push back when simpler or safer approach exists.

### Simplicity And Scope

- Minimum code that solves the problem. Nothing speculative.
- No features, abstractions, flexibility, or configurability unless requested.
- Touch only files needed for user request.
- Do not improve adjacent code, comments, naming, or formatting unless required.
- Match existing style, even when another style seems cleaner.
- In existing codebases, be surgical. In greenfield tasks, be more creative when scope is open.

### Execution Discipline

- Fix root cause when practical.
- Do not fix unrelated bugs; mention them only when relevant.
- Remove imports, variables, or functions made unused by your changes.
- Do not create commits, branches, license headers, or broad refactors unless asked.
- Every changed line should trace directly to user request.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
`;

const PRIMARY_MARKER = "\nPi documentation (read only";
const FALLBACK_MARKER = "\n# Project Context\n";

let enabled = true;
let initialized = false;
let warnedMissingMarker = false;

function getSettingsPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(process.cwd(), ".pi");
	return path.join(piDir, "settings.json");
}

function readSettings(): any {
	try {
		return JSON.parse(fs.readFileSync(getSettingsPath(), "utf8"));
	} catch {
		return {};
	}
}

function readEnabled(): boolean {
	const value = readSettings().extensionState?.behavioralGuidelinesEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), behavioralGuidelinesEnabled: value };
		fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	} catch {
		// best-effort
	}
}

function injectGuidelines(systemPrompt: string): string {
	if (systemPrompt.includes(GUIDELINES)) return systemPrompt;

	let markerIndex = systemPrompt.indexOf(PRIMARY_MARKER);
	if (markerIndex === -1) markerIndex = systemPrompt.indexOf(FALLBACK_MARKER);
	if (markerIndex === -1) {
		return `${systemPrompt}\n${GUIDELINES}`;
	}

	return `${systemPrompt.slice(0, markerIndex)}\n\n${GUIDELINES}${systemPrompt.slice(markerIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("behavioral-guidelines", undefined);
		return;
	}
	ctx.ui.setStatus("behavioral-guidelines", ctx.ui.theme.fg("accent", "[GUIDELINES]"));
}

export default function behavioralGuidelinesExtension(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		enabled = readEnabled();
		initialized = true;
		updateStatus(ctx);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!initialized) {
			enabled = readEnabled();
			initialized = true;
		}
		if (!enabled) return undefined;

		if (!event.systemPrompt.includes(PRIMARY_MARKER) && !event.systemPrompt.includes(FALLBACK_MARKER) && !warnedMissingMarker) {
			warnedMissingMarker = true;
			if (ctx.hasUI) {
				ctx.ui.notify("Behavioral guidelines: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectGuidelines(event.systemPrompt) };
	});

	pi.registerCommand("behavioral-guidelines", {
		description: "Toggle behavioral guidelines system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Behavioral guidelines: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /behavioral-guidelines [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Behavioral guidelines: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
