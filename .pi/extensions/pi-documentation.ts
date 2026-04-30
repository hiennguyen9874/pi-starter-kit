import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PI_DOCS_MARKER = "\nPi documentation (read only";
const SECTION_BOUNDARIES = ["\n\n# Project Context", "\n\nThe following skills", "\nCurrent date:", "\nCurrent working directory:"];

let enabled = false;
let initialized = false;
let warnedMissingSection = false;

function getFlagPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(os.homedir(), ".pi");
	return path.join(piDir, ".pi-documentation-enabled");
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
		// Default off when no flag exists.
	}
	return false;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const flagPath = getFlagPath();
		const flagDir = path.dirname(flagPath);
		fs.mkdirSync(flagDir, { recursive: true });
		const tempPath = path.join(flagDir, `.pi-documentation-enabled.${process.pid}.${Date.now()}`);
		fs.writeFileSync(tempPath, value ? "on" : "off", { mode: 0o600 });
		fs.renameSync(tempPath, flagPath);
	} catch {
		// best-effort
	}
}

function findSectionEnd(systemPrompt: string, startIndex: number): number {
	let sectionEnd = -1;
	for (const boundary of SECTION_BOUNDARIES) {
		const index = systemPrompt.indexOf(boundary, startIndex + 1);
		if (index !== -1 && (sectionEnd === -1 || index < sectionEnd)) sectionEnd = index;
	}
	return sectionEnd;
}

function removePiDocumentation(systemPrompt: string): string {
	const startIndex = systemPrompt.indexOf(PI_DOCS_MARKER);
	if (startIndex === -1) return systemPrompt;

	const sectionEnd = findSectionEnd(systemPrompt, startIndex);
	if (sectionEnd === -1) return systemPrompt.slice(0, startIndex).trimEnd();

	return `${systemPrompt.slice(0, startIndex).trimEnd()}${systemPrompt.slice(sectionEnd)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("pi-documentation", undefined);
		return;
	}
	ctx.ui.setStatus("pi-documentation", ctx.ui.theme.fg("accent", "[PI-DOCS]"));
}

export default function piDocumentationExtension(pi: ExtensionAPI) {
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
		if (enabled) return undefined;

		if (!event.systemPrompt.includes(PI_DOCS_MARKER) && !warnedMissingSection) {
			warnedMissingSection = true;
			if (ctx.hasUI) {
				ctx.ui.notify("Pi documentation section not found", "warning");
			}
		}

		return { systemPrompt: removePiDocumentation(event.systemPrompt) };
	});

	pi.registerCommand("pi-documentation", {
		description: "Toggle Pi documentation system prompt section (default off; on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Pi documentation: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /pi-documentation [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Pi documentation: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
