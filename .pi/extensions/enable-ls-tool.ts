/**
 * Enable LS Tool Extension
 *
 * Ensures Pi's `ls` tool is active when the extension is loaded.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ENABLED_TOOL = "ls";

export default function enableLsTool(pi: ExtensionAPI) {
	function applyToolSet(): void {
		const activeTools = pi.getActiveTools();
		if (activeTools.includes(ENABLED_TOOL)) return;

		pi.setActiveTools([...activeTools, ENABLED_TOOL]);
	}

	pi.on("session_start", async (_event, ctx) => {
		applyToolSet();
		ctx.ui.setStatus("ls-tool", "ls enabled");
	});
}
