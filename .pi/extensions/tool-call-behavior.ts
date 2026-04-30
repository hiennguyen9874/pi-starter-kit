import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const TOOL_CALL_BEHAVIOR = `## tool_call_behavior

- Before a meaningful tool call, send one concise sentence describing the immediate action.
- Always do this before edits and verification commands.
- Skip it for routine reads, obvious follow-up searches, and repetitive low-signal tool calls.
- When you preface a tool call, make that tool call in the same turn.

`;

const PRIMARY_MARKER = "\nPi documentation (read only";
const FALLBACK_MARKERS = ["\n## Behavioral guidelines", "\n# Project Context\n"];

let enabled = true;
let initialized = false;
let warnedMissingMarker = false;

function getFlagPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(os.homedir(), ".pi");
	return path.join(piDir, ".tool-call-behavior-enabled");
}

function readEnabled(): boolean {
	try {
		const flagPath = getFlagPath();
		const st = fs.lstatSync(flagPath);
		if (st.isSymbolicLink() || !st.isFile() || st.size > 16) return true;
		const raw = fs.readFileSync(flagPath, "utf8").trim().toLowerCase();
		if (raw === "off" || raw === "false" || raw === "0") return false;
		if (raw === "on" || raw === "true" || raw === "1") return true;
	} catch {
		// Default on when no flag exists.
	}
	return true;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const flagPath = getFlagPath();
		const flagDir = path.dirname(flagPath);
		fs.mkdirSync(flagDir, { recursive: true });
		const tempPath = path.join(flagDir, `.tool-call-behavior-enabled.${process.pid}.${Date.now()}`);
		fs.writeFileSync(tempPath, value ? "on" : "off", { mode: 0o600 });
		fs.renameSync(tempPath, flagPath);
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

function injectToolCallBehavior(systemPrompt: string): string {
	if (systemPrompt.includes(TOOL_CALL_BEHAVIOR)) return systemPrompt;

	const insertIndex = findInsertIndex(systemPrompt);
	if (insertIndex === -1) {
		return `${systemPrompt}\n\n${TOOL_CALL_BEHAVIOR}`;
	}

	return `${systemPrompt.slice(0, insertIndex)}\n\n${TOOL_CALL_BEHAVIOR}${systemPrompt.slice(insertIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("tool-call-behavior", undefined);
		return;
	}
	ctx.ui.setStatus("tool-call-behavior", ctx.ui.theme.fg("accent", "[TOOL-CALL]"));
}

export default function toolCallBehaviorExtension(pi: ExtensionAPI) {
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
				ctx.ui.notify("Tool call behavior: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectToolCallBehavior(event.systemPrompt) };
	});

	pi.registerCommand("tool-call-behavior", {
		description: "Toggle tool call behavior system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Tool call behavior: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /tool-call-behavior [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Tool call behavior: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
