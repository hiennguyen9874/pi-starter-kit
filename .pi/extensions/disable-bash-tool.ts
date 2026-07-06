/**
 * Disable Bash Tool Extension
 *
 * Removes Pi's `bash` tool from the active tool list when the extension is
 * loaded. Also blocks `bash` defensively if another extension or command
 * re-enables it later in the session.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DISABLED_TOOL = "bash";

export default function disableBashTool(pi: ExtensionAPI) {
	function applyToolSet(): void {
		const activeTools = pi.getActiveTools();
		const allowedTools = activeTools.filter((toolName) => toolName !== DISABLED_TOOL);

		if (allowedTools.length !== activeTools.length) {
			pi.setActiveTools(allowedTools);
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		applyToolSet();
		ctx.ui.setStatus("bash-tool", "bash disabled");
	});

	pi.on("tool_call", async (event) => {
		if (event.toolName !== DISABLED_TOOL) return undefined;

		applyToolSet();
		return { block: true, reason: "bash is disabled by disable-bash-tool extension" };
	});
}
