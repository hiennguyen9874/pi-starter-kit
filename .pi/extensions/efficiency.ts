import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const EFFICIENCY = `## Efficiency

- Prefer targeted reads over large file dumps.
- Prefer one focused search over repeated broad searches.
- Stop investigating once enough evidence exists to make safe change.
- Do not re-read files after successful \`edit\` or \`write\` unless verification needs exact resulting content.
- Do not paste large files unless user asks.
`;

const VALIDATION_MARKER = "\n## Validation Rules\n";
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
	const value = readSettings().extensionState?.efficiencyEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), efficiencyEnabled: value };
		fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	} catch {
		// best-effort
	}
}

function findNextSectionIndex(systemPrompt: string, startIndex: number): number {
	const sectionRegex = /\n## [^\n]+/g;
	sectionRegex.lastIndex = startIndex;
	const match = sectionRegex.exec(systemPrompt);
	return match?.index ?? -1;
}

function findInsertIndex(systemPrompt: string): number {
	const validationIndex = systemPrompt.indexOf(VALIDATION_MARKER);
	if (validationIndex !== -1) {
		const afterValidationHeading = validationIndex + VALIDATION_MARKER.length;
		const nextSectionIndex = findNextSectionIndex(systemPrompt, afterValidationHeading);
		if (nextSectionIndex !== -1) return nextSectionIndex;
	}

	for (const marker of FALLBACK_MARKERS) {
		const index = systemPrompt.indexOf(marker);
		if (index !== -1) return index;
	}

	return -1;
}

function injectEfficiency(systemPrompt: string): string {
	if (systemPrompt.includes(EFFICIENCY)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n${EFFICIENCY}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${EFFICIENCY}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("efficiency", undefined);
		return;
	}
	ctx.ui.setStatus("efficiency", ctx.ui.theme.fg("accent", "[EFF]"));
}

export default function efficiencyExtension(pi: ExtensionAPI) {
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
				ctx.ui.notify("Efficiency: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectEfficiency(event.systemPrompt) };
	});

	pi.registerCommand("efficiency", {
		description: "Toggle efficiency system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Efficiency: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /efficiency [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Efficiency: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
