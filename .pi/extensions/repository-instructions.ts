import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const REPOSITORY_INSTRUCTIONS = `## Repository Instructions

- Repositories may contain \`AGENTS.md\` files with project-specific instructions.
- An \`AGENTS.md\` applies to all files under the directory that contains it.
- For every file you edit, obey all applicable \`AGENTS.md\` files.
- More deeply nested \`AGENTS.md\` files override parent \`AGENTS.md\` files.
- Direct system, developer, and user instructions override \`AGENTS.md\`.
- When working outside the current directory or inside a new subdirectory, check for applicable \`AGENTS.md\` before editing.
- If instructions conflict, state conflict briefly and follow highest-priority instruction.
`;

const PRIMARY_MARKER = "\n## Behavioral guidelines";
const FALLBACK_MARKERS = ["\nPi documentation (read only", "\n# Project Context\n"];

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
	const value = readSettings().extensionState?.repositoryInstructionsEnabled;
	return typeof value === "boolean" ? value : true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), repositoryInstructionsEnabled: value };
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

function injectRepositoryInstructions(systemPrompt: string): string {
	if (systemPrompt.includes(REPOSITORY_INSTRUCTIONS)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n${REPOSITORY_INSTRUCTIONS}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${REPOSITORY_INSTRUCTIONS}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("repository-instructions", undefined);
		return;
	}
	ctx.ui.setStatus("repository-instructions", ctx.ui.theme.fg("accent", "[REPO]"));
}

export default function repositoryInstructionsExtension(pi: ExtensionAPI) {
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
				ctx.ui.notify("Repository instructions: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectRepositoryInstructions(event.systemPrompt) };
	});

	pi.registerCommand("repository-instructions", {
		description: "Toggle repository instructions system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Repository instructions: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /repository-instructions [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Repository instructions: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
