/**
 * Keep Pi's write tool directly available when codemode.mode is "only".
 *
 * model-only tools are declared to the model but are not callable from codemode.
 * The built-in write implementation still provides its normal schema, rendering,
 * prompt guidance, and file mutation behavior.
 */
import { createWriteToolDefinition, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function codemodeDirectWrite(pi: ExtensionAPI): void {
	pi.registerTool({
		...createWriteToolDefinition(process.cwd()),
		exposure: "model-only",
	});
}
