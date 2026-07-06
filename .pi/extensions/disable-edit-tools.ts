/**
 * Disable Edit Tools Extension
 *
 * Removes file-mutating edit tools from Pi's active tool list when the
 * extension is loaded. Also blocks those tools defensively if another
 * extension or command re-enables them later in the session.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DISABLED_TOOLS = new Set(["edit", "write"]);

export default function disableEditTools(pi: ExtensionAPI) {
	function applyReadOnlyToolSet(): void {
		const activeTools = pi.getActiveTools();
		const allowedTools = activeTools.filter((toolName) => !DISABLED_TOOLS.has(toolName));

		if (allowedTools.length !== activeTools.length) {
			pi.setActiveTools(allowedTools);
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		applyReadOnlyToolSet();
		ctx.ui.setStatus("edit-tools", "edit/write disabled");
	});

	pi.on("tool_call", async (event) => {
		if (!DISABLED_TOOLS.has(event.toolName)) return undefined;

		applyReadOnlyToolSet();
		return { block: true, reason: `${event.toolName} is disabled by disable-edit-tools extension` };
	});
}
