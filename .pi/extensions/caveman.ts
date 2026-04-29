/**
 * Caveman Extension for Pi
 *
 * Ports caveman hooks from Claude Code / Codex to Pi:
 * - Session-start activation with configurable default mode
 * - Per-turn system prompt injection for persistent caveman behavior
 * - /caveman commands to switch modes
 * - Status line badge showing active mode
 *
 * Based on: https://github.com/JuliusBrussee/caveman
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── Configuration ───────────────────────────────────────────────────────────

const VALID_MODES = [
	"off",
	"lite",
	"full",
	"ultra",
	"wenyan-lite",
	"wenyan",
	"wenyan-full",
	"wenyan-ultra",
	"commit",
	"review",
	"compress",
] as const;

type CavemanMode = (typeof VALID_MODES)[number];

const INDEPENDENT_MODES: Set<CavemanMode> = new Set(["commit", "review", "compress"]);

const MODE_LABELS: Record<string, string> = {
	lite: "LITE",
	full: "FULL",
	ultra: "ULTRA",
	"wenyan-lite": "WENYAN-LITE",
	wenyan: "WENYAN",
	"wenyan-full": "WENYAN",
	"wenyan-ultra": "WENYAN-ULTRA",
	commit: "COMMIT",
	review: "REVIEW",
	compress: "COMPRESS",
};

// Default rules injected into system prompt for each mode
const RULES: Record<string, string> = {
	lite: `CAVEMAN MODE: lite. Drop filler/hedging/pleasantries. Keep articles + full sentences. Professional but tight. Pattern: [thing] [action] [reason]. Code/commits/security: write normal.`,
	full: `CAVEMAN MODE: full. Respond terse like smart caveman. All technical substance stay. Only fluff die.
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging.
Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged. Errors quoted exact.
Pattern: [thing] [action] [reason]. [next step].
Not: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..."
Yes: "Bug in auth middleware. Token expiry check use \`<\` not \`<=\`. Fix:"
Auto-Clarity: drop caveman for security warnings, irreversible actions, multi-step sequences where fragment order risks misread, user asks to clarify. Resume after.
Boundaries: code/commits/PRs write normal. "stop caveman" or "normal mode" to revert.`,
	ultra: `CAVEMAN MODE: ultra. Maximum compression. Abbreviate (DB/auth/config/req/res/fn/impl). Strip conjunctions. Arrows for causality (X → Y). One word when one word enough. Fragments only. All technical substance stay.`,
	"wenyan-lite": `CAVEMAN MODE: wenyan-lite. Semi-classical Chinese style. Drop filler/hedging but keep grammar structure, classical register.`,
	"wenyan-full": `CAVEMAN MODE: wenyan-full. Maximum classical terseness. Fully 文言文. 80-90% character reduction. Classical sentence patterns, verbs precede objects, subjects often omitted, classical particles (之/乃/為/其).`,
	"wenyan-ultra": `CAVEMAN MODE: wenyan-ultra. Extreme abbreviation while keeping classical Chinese feel. Maximum compression, ultra terse.`,
	commit: `CAVEMAN MODE: commit. Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what. Subject ≤50 chars. Body only when "why" isn't obvious.`,
	review: `CAVEMAN MODE: review. Write code review comments terse and actionable. One line per finding. Location, problem, fix. No throat-clearing.`,
	compress: `CAVEMAN MODE: compress. Compress natural language files into caveman format. Preserve code blocks, URLs, paths, commands exactly.`,
};

// ─── Config Resolution ───────────────────────────────────────────────────────

function getConfigDir(): string {
	if (process.env.XDG_CONFIG_HOME) {
		return path.join(process.env.XDG_CONFIG_HOME, "caveman");
	}
	if (process.platform === "win32") {
		return path.join(
			process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
			"caveman"
		);
	}
	return path.join(os.homedir(), ".config", "caveman");
}

function getConfigPath(): string {
	return path.join(getConfigDir(), "config.json");
}

function getDefaultMode(): CavemanMode {
	const envMode = process.env.CAVEMAN_DEFAULT_MODE;
	if (envMode && VALID_MODES.includes(envMode.toLowerCase() as CavemanMode)) {
		return envMode.toLowerCase() as CavemanMode;
	}
	try {
		const config = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
		if (config.defaultMode && VALID_MODES.includes(config.defaultMode.toLowerCase() as CavemanMode)) {
			return config.defaultMode.toLowerCase() as CavemanMode;
		}
	} catch {
		// config missing or invalid
	}
	return "full";
}

// ─── Flag File ───────────────────────────────────────────────────────────────

function getFlagPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(os.homedir(), ".pi");
	return path.join(piDir, ".caveman-active");
}

function safeWriteFlag(mode: CavemanMode): void {
	try {
		const flagPath = getFlagPath();
		const flagDir = path.dirname(flagPath);
		fs.mkdirSync(flagDir, { recursive: true });
		const tempPath = path.join(flagDir, `.caveman-active.${process.pid}.${Date.now()}`);
		fs.writeFileSync(tempPath, mode, { mode: 0o600 });
		fs.renameSync(tempPath, flagPath);
	} catch {
		// best-effort
	}
}

function readFlag(): CavemanMode | null {
	try {
		const flagPath = getFlagPath();
		const st = fs.lstatSync(flagPath);
		if (st.isSymbolicLink() || !st.isFile() || st.size > 64) return null;
		const raw = fs.readFileSync(flagPath, "utf8").trim().toLowerCase();
		if (!VALID_MODES.includes(raw as CavemanMode)) return null;
		return raw as CavemanMode;
	} catch {
		return null;
	}
}

function clearFlag(): void {
	try {
		fs.unlinkSync(getFlagPath());
	} catch {
		// best-effort
	}
}

// ─── State ───────────────────────────────────────────────────────────────────

let activeMode: CavemanMode | null = null;
let initialized = false;

function setMode(mode: CavemanMode | null): void {
	activeMode = mode;
	if (mode && mode !== "off") {
		safeWriteFlag(mode);
	} else {
		clearFlag();
	}
}

function getEffectiveMode(): CavemanMode | null {
	if (activeMode && activeMode !== "off") return activeMode;
	return readFlag();
}

function getRules(mode: CavemanMode): string {
	return RULES[mode] || RULES["full"];
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	const mode = getEffectiveMode();
	if (!mode || mode === "off") {
		ctx.ui.setStatus("caveman", undefined);
		return;
	}
	const label = MODE_LABELS[mode] || mode.toUpperCase();
	const theme = ctx.ui.theme;
	const badge = theme.fg("accent", `[CAVEMAN:${label}]`);
	ctx.ui.setStatus("caveman", badge);
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function cavemanExtension(pi: ExtensionAPI) {
	// ── Session Start ──
	pi.on("session_start", async (_event, ctx) => {
		const defaultMode = getDefaultMode();
		if (defaultMode !== "off") {
			setMode(defaultMode);
			if (ctx.hasUI) {
				ctx.ui.notify(`🪨 Caveman mode active: ${defaultMode}`, "info");
			}
		}
		initialized = true;
		updateStatus(ctx);
	});

	// ── System Prompt Injection ──
	// Runs before every agent turn = equivalent to SessionStart + UserPromptSubmit hooks
	pi.on("before_agent_start", async (event) => {
		if (!initialized) {
			// session_start hasn't fired yet (e.g. first turn in some setups)
			const defaultMode = getDefaultMode();
			if (defaultMode !== "off") setMode(defaultMode);
			initialized = true;
		}

		const mode = getEffectiveMode();
		if (!mode || mode === "off") return undefined;

		const rules = getRules(mode);
		return {
			systemPrompt: event.systemPrompt + "\n\n" + rules,
		};
	});

	// ── Input Hook ──
	// Detect /caveman commands and natural language toggles
	pi.on("input", async (event, ctx) => {
		if (event.source !== "user") return { action: "continue" };

		const text = event.text.trim().toLowerCase();

		// Natural language activation
		if (
			(/\b(activate|enable|turn on|start|talk like)\b.*\bcaveman\b/i.test(text) ||
				/\bcaveman\b.*\b(mode|activate|enable|turn on|start)\b/i.test(text)) &&
			!/\b(stop|disable|turn off|deactivate)\b/i.test(text)
		) {
			const mode = getDefaultMode();
			if (mode !== "off") {
				setMode(mode);
				ctx.ui.notify(`🪨 Caveman mode: ${mode}`, "info");
				updateStatus(ctx);
			}
			return { action: "continue" };
		}

		// Natural language deactivation
		if (
			/\b(stop|disable|deactivate|turn off)\b.*\bcaveman\b/i.test(text) ||
			/\bcaveman\b.*\b(stop|disable|deactivate|turn off)\b/i.test(text) ||
			/\bnormal mode\b/i.test(text)
		) {
			setMode(null);
			ctx.ui.notify("Caveman mode deactivated", "info");
			updateStatus(ctx);
			return { action: "continue" };
		}

		// Slash commands
		if (text.startsWith("/caveman")) {
			const parts = text.split(/\s+/);
			const cmd = parts[0];
			const arg = parts[1] || "";

			if (cmd === "/caveman" || cmd === "/caveman:caveman") {
				let newMode: CavemanMode = "full";
				if (arg === "lite") newMode = "lite";
				else if (arg === "ultra") newMode = "ultra";
				else if (arg === "wenyan-lite") newMode = "wenyan-lite";
				else if (arg === "wenyan" || arg === "wenyan-full") newMode = "wenyan-full";
				else if (arg === "wenyan-ultra") newMode = "wenyan-ultra";
				else if (arg === "off") newMode = "off";
				else if (arg) {
					ctx.ui.notify(`Unknown caveman mode: ${arg}. Try: lite, full, ultra, wenyan, off`, "warning");
					return { action: "handled" };
				}

				if (newMode === "off") {
					setMode(null);
					ctx.ui.notify("Caveman mode deactivated", "info");
				} else {
					setMode(newMode);
					ctx.ui.notify(`🪨 Caveman mode: ${newMode}`, "info");
				}
				updateStatus(ctx);
				return { action: "handled" };
			}
		}

		return { action: "continue" };
	});

	// ── Commands ──
	pi.registerCommand("caveman", {
		description: "Toggle or set caveman mode (lite/full/ultra/wenyan/off)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				const current = getEffectiveMode();
				if (current && current !== "off") {
					setMode(null);
					ctx.ui.notify("Caveman mode deactivated", "info");
				} else {
					setMode("full");
					ctx.ui.notify("🪨 Caveman mode: full", "info");
				}
			} else if (VALID_MODES.includes(arg as CavemanMode)) {
				if (arg === "off") {
					setMode(null);
					ctx.ui.notify("Caveman mode deactivated", "info");
				} else {
					setMode(arg as CavemanMode);
					ctx.ui.notify(`🪨 Caveman mode: ${arg}`, "info");
				}
			} else {
				ctx.ui.notify(`Unknown mode: ${arg}. Valid: ${VALID_MODES.join(", ")}`, "warning");
			}
			updateStatus(ctx);
		},
	});
}
