/**
 * Disable Write Tool Extension
 *
 * Removes Pi's `write` tool from the active tool list when the extension is
 * loaded. Also blocks `write` defensively if another extension or command
 * re-enables it later in the session.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DISABLED_TOOL = "write";

export default function disableWriteTool(pi: ExtensionAPI) {
	function applyToolSet(): void {
		const activeTools = pi.getActiveTools();
		const allowedTools = activeTools.filter((toolName) => toolName !== DISABLED_TOOL);

		if (allowedTools.length !== activeTools.length) {
			pi.setActiveTools(allowedTools);
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		applyToolSet();
		ctx.ui.setStatus("write-tool", "write disabled");
	});

	pi.on("tool_call", async (event) => {
		if (event.toolName !== DISABLED_TOOL) return undefined;

		applyToolSet();
		return { block: true, reason: "write is disabled by disable-write-tool extension" };
	});
}
