/**
 * Expose direct_write while keeping the original write callable from codemode.
 */
import { createWriteToolDefinition, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function codemodeDirectWrite(pi: ExtensionAPI): void {
	const write = createWriteToolDefinition(process.cwd());
	pi.registerTool({
		...write,
		name: "direct_write",
		label: "direct_write",
		promptSnippet: "Create or overwrite files with direct_write",
		promptGuidelines: ["Use direct_write only for new files or complete rewrites."],
		exposure: "model-only",
		reachesTools: () => ["write"],
		async execute(_id, params, signal, onUpdate, ctx) {
			const outcome = await ctx.executeTool("write", params, { signal, onUpdate });
			if (outcome.isError) {
				const message = outcome.result.content
					.filter((item) => item.type === "text")
					.map((item) => item.text)
					.join("\n");
				throw new Error(message || "write failed");
			}
			return outcome.result;
		},
	});
}
