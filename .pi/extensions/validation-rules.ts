import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const VALIDATION_RULES = `## Validation Rules

- Validate changes when the repository provides relevant tests, build, lint, typecheck, or similar checks.
- Start with the narrowest relevant check closest to the changed code.
- Run broader tests or checks only when needed and reasonable.
- Do not fix unrelated failures.
- If a check fails because of pre-existing or unrelated issues, report that clearly.
- If no relevant test exists but nearby test patterns exist, add a focused test when appropriate.
- If the project has no tests or no existing test pattern, do not introduce a test framework unless asked.
- Do not add tests to projects with no existing test pattern unless the user asks.
- Avoid expensive, slow, destructive, broad, or external-service-dependent checks unless they are necessary or explicitly approved.
- Prefer focused checks close to the changed code.
`;

const PRIMARY_MARKER = "\n---\n\n**These guidelines are working if:**";
const FALLBACK_MARKERS = ["\n## Final Response", "\nPi documentation (read only", "\n# Project Context\n"];

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
	const value = readSettings().extensionState?.validationRulesEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), validationRulesEnabled: value };
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

function injectValidationRules(systemPrompt: string): string {
	if (systemPrompt.includes(VALIDATION_RULES)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n${VALIDATION_RULES}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${VALIDATION_RULES}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("validation-rules", undefined);
		return;
	}
	ctx.ui.setStatus("validation-rules", ctx.ui.theme.fg("accent", "[VALIDATE]"));
}

export default function validationRulesExtension(pi: ExtensionAPI) {
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
				ctx.ui.notify("Validation rules: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectValidationRules(event.systemPrompt) };
	});

	pi.registerCommand("validation-rules", {
		description: "Toggle validation rules system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Validation rules: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /validation-rules [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Validation rules: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
