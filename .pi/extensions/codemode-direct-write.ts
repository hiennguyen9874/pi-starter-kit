/**
 * Codemode with the original write tool available both directly and in scripts.
 *
 * Replaces builtin:codemode (do not enable both). Keep Pi's settings, execution,
 * discovery, rendering, and other loadout changes; only exempt write from hiding.
 * This extension does not register or override write, edit, or direct_write.
 */
import { createCodemodeExtension, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function codemodeDirectWrite(pi: ExtensionAPI) {
	return createCodemodeExtension()({
		...pi,
		registerTool(tool) {
			const prepareLoadout = tool.prepareLoadout;
			pi.registerTool({
				...tool,
				prepareLoadout(loadout) {
					const changes = prepareLoadout?.(loadout);
					if (!changes) return changes;
					return {
						...changes,
						hiddenDeclarations: changes.hiddenDeclarations?.filter((name) => name !== "write"),
					};
				},
			});
		},
	});
}
