import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const GUIDELINES = `## Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
\`\`\`
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
\`\`\`

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

`;

const PRIMARY_MARKER = "\nPi documentation (read only";
const FALLBACK_MARKER = "\n# Project Context\n";

let enabled = true;
let initialized = false;
let warnedMissingMarker = false;

function getFlagPath(): string {
	const piDir = process.env.PI_CONFIG_DIR || path.join(os.homedir(), ".pi");
	return path.join(piDir, ".behavioral-guidelines-enabled");
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
		const tempPath = path.join(flagDir, `.behavioral-guidelines-enabled.${process.pid}.${Date.now()}`);
		fs.writeFileSync(tempPath, value ? "on" : "off", { mode: 0o600 });
		fs.renameSync(tempPath, flagPath);
	} catch {
		// best-effort
	}
}

function injectGuidelines(systemPrompt: string): string {
	if (systemPrompt.includes(GUIDELINES)) return systemPrompt;

	let markerIndex = systemPrompt.indexOf(PRIMARY_MARKER);
	if (markerIndex === -1) markerIndex = systemPrompt.indexOf(FALLBACK_MARKER);
	if (markerIndex === -1) {
		return `${systemPrompt}\n\n${GUIDELINES}`;
	}

	return `${systemPrompt.slice(0, markerIndex)}\n\n${GUIDELINES}${systemPrompt.slice(markerIndex)}`;
}

function updateStatus(ctx: any): void {
	if (!ctx.hasUI) return;
	if (!enabled) {
		ctx.ui.setStatus("behavioral-guidelines", undefined);
		return;
	}
	ctx.ui.setStatus("behavioral-guidelines", ctx.ui.theme.fg("accent", "[GUIDELINES]"));
}

export default function behavioralGuidelinesExtension(pi: ExtensionAPI) {
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

		if (!event.systemPrompt.includes(PRIMARY_MARKER) && !event.systemPrompt.includes(FALLBACK_MARKER) && !warnedMissingMarker) {
			warnedMissingMarker = true;
			if (ctx.hasUI) {
				ctx.ui.notify("Behavioral guidelines: insertion marker missing; appending at end", "warning");
			}
		}

		return { systemPrompt: injectGuidelines(event.systemPrompt) };
	});

	pi.registerCommand("behavioral-guidelines", {
		description: "Toggle behavioral guidelines system prompt injection (on/off/status)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg || arg === "toggle") {
				writeEnabled(!enabled);
			} else if (arg === "on" || arg === "enable" || arg === "enabled") {
				writeEnabled(true);
			} else if (arg === "off" || arg === "disable" || arg === "disabled") {
				writeEnabled(false);
			} else if (arg === "status") {
				ctx.ui.notify(`Behavioral guidelines: ${enabled ? "on" : "off"}`, "info");
				return;
			} else {
				ctx.ui.notify("Usage: /behavioral-guidelines [on|off|toggle|status]", "warning");
				return;
			}

			updateStatus(ctx);
			ctx.ui.notify(`Behavioral guidelines: ${enabled ? "on" : "off"}`, "info");
		},
	});
}
