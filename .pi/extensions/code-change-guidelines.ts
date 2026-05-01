import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const CODE_CHANGE_GUIDELINES = `## Code Change Guidelines

Follow these rules when modifying code:

### Core Change Rules

- Fix the root cause, not just symptoms, when practical.
- Do not create commits or branches unless explicitly asked.
- Do not add license or copyright headers unless explicitly asked.
- Do not add inline comments unless they clarify non-obvious logic.
- Do not use one-letter variable names except where they match an established local convention.
- Update documentation only when behavior, setup, API, or usage changes.

### Scope and Precision

- In existing codebases, be surgical: do exactly what was requested.
- In greenfield tasks, be more creative when the scope is open.
- Do not rename files, move code, or refactor structure unless necessary for the requested change.
- Do not add optional features, speculative abstractions, or unnecessary flexibility.
- Prefer a minimal working solution over a more flexible architecture.
- Match the local style of the codebase, even if another style seems better.
- Use git log or git blame only when history helps explain intent or clarify an implementation decision.
`;

const PRIMARY_MARKER = "\n## Validation Rules";
const FALLBACK_MARKERS = ["\n---\n\n**These guidelines are working if:**", "\nPi documentation (read only", "\n# Project Context\n"];

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
	const value = readSettings().extensionState?.codeChangeGuidelinesEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), codeChangeGuidelinesEnabled: value };
		fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	} catch {
		// best-effort
	}
}

function findInsertIndex(systemPrompt: string): number {
	const primaryIndex = systemPrompt.indexOf(PRIMARY_MARKER);
	if (primaryIndex !== -1) return primaryIndex;

	for (const marker of FALLBACK_MARKERS) {
		const index = systemPrompt.indexOf(marker);
		if (index !== -1) return index;
	}

	return -1;
}

function injectCodeChangeGuidelines(systemPrompt: string): string {
	if (systemPrompt.includes(CODE_CHANGE_GUIDELINES)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n${CODE_CHANGE_GUIDELINES}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${CODE_CHANGE_GUIDELINES}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("code-change-guidelines", undefined);
		return;
	}
	ctx.ui.setStatus("code-change-guidelines", ctx.ui.theme.fg("accent", "[CODE]"));
}

export default function codeChangeGuidelinesExtension(pi: ExtensionAPI) {
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

		if (findInsertIndex(event.systemPrompt) === -1 && !warnedMissingMarker) {
			warnedMissingMarker = true;
			if (ctx.hasUI) {
				ctx.ui.notify("Code change guidelines: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectCodeChangeGuidelines(event.systemPrompt) };
	});

	pi.registerCommand("code-change-guidelines", {
		description: "Toggle code change guidelines system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Code change guidelines: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /code-change-guidelines [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Code change guidelines: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
