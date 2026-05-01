import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const FINAL_RESPONSE = `## Final Response

When handing off code work, provide a concise final response using this structure:

**Result**
- Summarize the outcome first: what changed and why.

**Files**
- Mention changed files with clear, clickable paths when possible.
- Wrap file paths, commands, environment variables, and code identifiers in backticks.
- Include line numbers for important file references when useful, for example: \`path/to/file.ext:42\`.
- Do not paste large files unless the user asks.

**Validation**
- Mention the validation command or check that was run.
- State the result clearly: pass, fail, or blocked, including the reason when relevant.

**Notes**
- Mention known limitations, assumptions, skipped checks, or unrelated failures.
- Suggest at most one next step.

Keep the response concise unless the user asks for more detail.
`;

const PRIMARY_MARKER = "\nPi documentation (read only";
const FALLBACK_MARKERS = ["\nCAVEMAN MODE:", "\n# Project Context\n"];

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
	const value = readSettings().extensionState?.finalResponseEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), finalResponseEnabled: value };
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

function injectFinalResponse(systemPrompt: string): string {
	if (systemPrompt.includes(FINAL_RESPONSE)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n${FINAL_RESPONSE}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${FINAL_RESPONSE}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("final-response", undefined);
		return;
	}
	ctx.ui.setStatus("final-response", ctx.ui.theme.fg("accent", "[FINAL]"));
}

export default function finalResponseExtension(pi: ExtensionAPI) {
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
				ctx.ui.notify("Final response: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectFinalResponse(event.systemPrompt) };
	});

	pi.registerCommand("final-response", {
		description: "Toggle final response system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Final response: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /final-response [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Final response: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
