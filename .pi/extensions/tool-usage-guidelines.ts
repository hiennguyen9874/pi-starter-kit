import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const TOOL_USAGE_GUIDELINES = [
	"- Use `read` for inspecting file contents; avoid `cat`, `sed`, or large shell output for routine file reads.",
	"- Use `bash` for discovery, search, test, build, and filesystem operations.",
];

const GUIDELINES_MARKER = "\nGuidelines:\n";

function injectToolUsageGuidelines(systemPrompt: string): string {
	if (TOOL_USAGE_GUIDELINES.every((guideline) => systemPrompt.includes(guideline))) {
		return systemPrompt;
	}

	const markerIndex = systemPrompt.indexOf(GUIDELINES_MARKER);
	if (markerIndex === -1) {
		return `${systemPrompt}\n\nGuidelines:\n${TOOL_USAGE_GUIDELINES.join("\n")}`;
	}

	const sectionStart = markerIndex + GUIDELINES_MARKER.length;
	const nextSectionIndex = systemPrompt.indexOf("\n\n", sectionStart);
	const insertIndex = nextSectionIndex === -1 ? systemPrompt.length : nextSectionIndex;

	return `${systemPrompt.slice(0, insertIndex)}\n${TOOL_USAGE_GUIDELINES.join("\n")}${systemPrompt.slice(insertIndex)}`;
}

export default function toolUsageGuidelinesExtension(pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => {
		return { systemPrompt: injectToolUsageGuidelines(event.systemPrompt) };
	});
}
