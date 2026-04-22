/**
 * Code Review Graph Extension for Pi
 *
 * Ports .claude/settings.json + .pi/code-review-graph.md behavior to Pi:
 * - Toggle on/off via config or commands
 * - When enabled, appends .pi/code-review-graph.md to system prompt every turn
 * - Provides /code-review-graph and /crg commands
 * - Status line badge when active
 * - Mirrors Claude Code hooks: SessionStart, PostToolUse, PreCommit
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";

// ─── Configuration ───────────────────────────────────────────────────────────

interface CrgConfig {
	enabled?: boolean;
	defaultEnabled?: boolean;
}

function getConfigPath(): string {
	const cwd = process.cwd();
	return path.join(cwd, ".claude", "settings.json");
}

function readCrgConfig(): CrgConfig {
	try {
		const raw = fs.readFileSync(getConfigPath(), "utf8");
		return JSON.parse(raw) as CrgConfig;
	} catch {
		return {};
	}
}

function getDefaultEnabled(): boolean {
	const config = readCrgConfig();
	if (typeof config.enabled === "boolean") return config.enabled;
	if (typeof config.defaultEnabled === "boolean") return config.defaultEnabled;
	return false;
}

// ─── AGENTS.md Resolution ────────────────────────────────────────────────────

function getAgentsMdPath(): string {
	const cwd = process.cwd();
	return path.join(cwd, ".pi", "code-review-graph.md");
}

function readAgentsMd(): string | null {
	try {
		return fs.readFileSync(getAgentsMdPath(), "utf8");
	} catch {
		return null;
	}
}

// ─── Hook Runner ─────────────────────────────────────────────────────────────

function runHook(command: string, timeoutMs: number): Promise<void> {
	return new Promise((resolve) => {
		const parts = command.split(/\s+/);
		if (parts.length === 0) {
			resolve();
			return;
		}
		const [cmd, ...args] = parts;
		const child = spawn(cmd, args, {
			stdio: "ignore",
			detached: true,
		});
		const timer = setTimeout(() => {
			try {
				process.kill(-child.pid!, "SIGKILL");
			} catch {
				// best-effort
			}
		}, timeoutMs);
		child.on("close", () => {
			clearTimeout(timer);
			resolve();
		});
		child.on("error", () => {
			clearTimeout(timer);
			resolve();
		});
	});
}

// ─── Flag File ───────────────────────────────────────────────────────────────

function getFlagPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(os.homedir(), ".pi");
	return path.join(piDir, ".code-review-graph-active");
}

function safeWriteFlag(enabled: boolean): void {
	try {
		const flagPath = getFlagPath();
		const flagDir = path.dirname(flagPath);
		fs.mkdirSync(flagDir, { recursive: true });
		const tempPath = path.join(flagDir, `.code-review-graph-active.${process.pid}.${Date.now()}`);
		fs.writeFileSync(tempPath, enabled ? "on" : "off", { mode: 0o600 });
		fs.renameSync(tempPath, flagPath);
	} catch {
		// best-effort
	}
}

function readFlag(): boolean | null {
	try {
		const flagPath = getFlagPath();
		const st = fs.lstatSync(flagPath);
		if (st.isSymbolicLink() || !st.isFile() || st.size > 64) return null;
		const raw = fs.readFileSync(flagPath, "utf8").trim().toLowerCase();
		if (raw === "on" || raw === "true" || raw === "1") return true;
		if (raw === "off" || raw === "false" || raw === "0") return false;
		return null;
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

let activeState: boolean | null = null;
let initialized = false;

function setState(enabled: boolean): void {
	activeState = enabled;
	safeWriteFlag(enabled);
}

function getEffectiveState(): boolean {
	if (activeState !== null) return activeState;
	const flag = readFlag();
	if (flag !== null) return flag;
	return getDefaultEnabled();
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	const enabled = getEffectiveState();
	if (!enabled) {
		ctx.ui.setStatus("code-review-graph", undefined);
		return;
	}
	const theme = ctx.ui.theme;
	const badge = theme.fg("accent", "[CRG]");
	ctx.ui.setStatus("code-review-graph", badge);
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function codeReviewGraphExtension(pi: ExtensionAPI) {
	// ── Session Start ──
	pi.on("session_start", async (_event, ctx) => {
		const defaultEnabled = getDefaultEnabled();
		if (defaultEnabled) {
			setState(true);
			if (ctx.hasUI) {
				ctx.ui.notify("📊 Code-review-graph active", "info");
			}
		}
		initialized = true;
		updateStatus(ctx);

		// SessionStart hook: code-review-graph status
		if (getEffectiveState()) {
			await runHook("code-review-graph status", 3000);
		}
	});

	// ── System Prompt Injection ──
	pi.on("before_agent_start", async (event) => {
		if (!initialized) {
			const defaultEnabled = getDefaultEnabled();
			setState(defaultEnabled);
			initialized = true;
		}

		if (!getEffectiveState()) return undefined;

		const agentsMd = readAgentsMd();
		if (!agentsMd) return undefined;

		return {
			systemPrompt: event.systemPrompt + "\n\n" + agentsMd,
		};
	});

	// ── PostToolUse Hook (Edit|Write|Bash) ──
	pi.on("tool_result", async (event) => {
		if (!getEffectiveState()) return;

		const toolName = event.toolName.toLowerCase();
		const isMatch = toolName === "edit" || toolName === "write" || toolName === "bash";
		if (!isMatch) return;

		await runHook("code-review-graph update --skip-flows", 5000);
	});

	// ── PreCommit Hook (intercept git commit bash) ──
	pi.on("tool_call", async (event) => {
		if (!getEffectiveState()) return undefined;

		if (event.toolName !== "bash") return undefined;

		const command = (event.input as any)?.command || "";
		if (/git\s+commit\b/.test(command)) {
			await runHook("code-review-graph detect-changes --brief", 10000);
		}

		return undefined;
	});

	// ── Input Hook ──
	pi.on("input", async (event, ctx) => {
		if (event.source !== "user") return { action: "continue" };

		const text = event.text.trim().toLowerCase();

		// Slash commands
		if (text === "/code-review-graph" || text === "/crg") {
			const current = getEffectiveState();
			setState(!current);
			const newState = getEffectiveState();
			ctx.ui.notify(newState ? "📊 Code-review-graph enabled" : "📊 Code-review-graph disabled", "info");
			updateStatus(ctx);
			return { action: "handled" };
		}

		if (text === "/code-review-graph on" || text === "/crg on") {
			setState(true);
			ctx.ui.notify("📊 Code-review-graph enabled", "info");
			updateStatus(ctx);
			return { action: "handled" };
		}

		if (text === "/code-review-graph off" || text === "/crg off") {
			setState(false);
			ctx.ui.notify("📊 Code-review-graph disabled", "info");
			updateStatus(ctx);
			return { action: "handled" };
		}

		// Natural language toggles
		if (/\b(enable|activate|turn on)\b.*\bcode[- ]?review[- ]?graph\b/i.test(text)) {
			setState(true);
			ctx.ui.notify("📊 Code-review-graph enabled", "info");
			updateStatus(ctx);
			return { action: "continue" };
		}

		if (/\b(disable|deactivate|turn off)\b.*\bcode[- ]?review[- ]?graph\b/i.test(text)) {
			setState(false);
			ctx.ui.notify("📊 Code-review-graph disabled", "info");
			updateStatus(ctx);
			return { action: "continue" };
		}

		return { action: "continue" };
	});

	// ── Commands ──
	pi.registerCommand("code-review-graph", {
		description: "Toggle code-review-graph system prompt injection (on/off)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				const current = getEffectiveState();
				setState(!current);
			} else if (arg === "on" || arg === "true" || arg === "1") {
				setState(true);
			} else if (arg === "off" || arg === "false" || arg === "0") {
				setState(false);
			} else {
				ctx.ui.notify(`Unknown arg: ${arg}. Use: on, off, or toggle`, "warning");
				return;
			}
			const newState = getEffectiveState();
			ctx.ui.notify(newState ? "📊 Code-review-graph enabled" : "📊 Code-review-graph disabled", "info");
			updateStatus(ctx);
		},
	});

	pi.registerCommand("crg", {
		description: "Shorthand for /code-review-graph toggle",
		handler: async (_args, ctx) => {
			const current = getEffectiveState();
			setState(!current);
			const newState = getEffectiveState();
			ctx.ui.notify(newState ? "📊 Code-review-graph enabled" : "📊 Code-review-graph disabled", "info");
			updateStatus(ctx);
		},
	});
}
