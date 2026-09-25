import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const PI_DOCS_MARKER = "Pi documentation (read only";
const PI_DOCS_TAG = "docs";

let enabled = false;
let initialized = false;
let warnedMissingSection = false;

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
	const value = readSettings().extensionState?.piDocumentationEnabled;
	return typeof value === "boolean" ? value : false;
}

function writeEnabled(value: boolean): void {
	enabled = value;
	try {
		const settingsPath = getSettingsPath();
		const settings = readSettings();
		settings.extensionState = { ...(settings.extensionState || {}), piDocumentationEnabled: value };
		fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	} catch {
		// best-effort
	}
}

function findXmlSection(systemPrompt: string, tagName: string, marker: string): { start: number; end: number } | undefined {
	const markerIndex = systemPrompt.indexOf(marker);
	if (markerIndex === -1) return undefined;

	const tagPattern = /<\/?([A-Za-z][\w:.-]*)(?:\s[^<>]*?)?\s*\/?>/g;
	const stack: Array<{ name: string; start: number }> = [];
	let match: RegExpExecArray | null;

	while ((match = tagPattern.exec(systemPrompt)) && match.index < markerIndex) {
		const rawTag = match[0];
		const name = match[1];
		if (rawTag.startsWith("</")) {
			if (stack[stack.length - 1]?.name === name) stack.pop();
		} else if (!/\/\s*>$/.test(rawTag)) {
			stack.push({ name, start: match.index });
		}
	}

	let section = -1;
	for (let index = stack.length - 1; index >= 0; index--) {
		if (stack[index].name === tagName) {
			section = stack[index].start;
			break;
		}
	}
	if (section === -1) return undefined;

	let depth = 0;
	tagPattern.lastIndex = section;
	while ((match = tagPattern.exec(systemPrompt))) {
		if (match[1] !== tagName) continue;
		if (match[0].startsWith("</")) {
			if (--depth === 0) return { start: section, end: tagPattern.lastIndex };
		} else if (!/\/\s*>$/.test(match[0])) {
			depth++;
		}
	}
	return undefined;
}

export function removePiDocumentation(systemPrompt: string): string {
	const section = findXmlSection(systemPrompt, PI_DOCS_TAG, PI_DOCS_MARKER);
	if (!section) return systemPrompt;

	const prefix = systemPrompt.slice(0, section.start).trimEnd();
	const suffix = systemPrompt.slice(section.end);
	return suffix.trim() ? `${prefix}${suffix}` : prefix;
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

		if (!findXmlSection(event.systemPrompt, PI_DOCS_TAG, PI_DOCS_MARKER) && !warnedMissingSection) {
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
