import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GUIDELINES_HEADER = "Guidelines:";
const PI_ENV_GUIDELINE = "- Inspect PI_* environment variables for current model and session details.";

/** Remove the PI environment inspection instruction only from the Guidelines section. */
export function removePiEnvGuideline(systemPrompt: string): string {
  const lines = systemPrompt.split("\n");
  const guidelinesIndex = lines.findIndex((line) => line.trim() === GUIDELINES_HEADER);
  if (guidelinesIndex === -1) return systemPrompt;

  for (let index = guidelinesIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    // A non-list, non-indented colon-terminated line begins the next section.
    if (line === trimmedLine && !trimmedLine.startsWith("-") && trimmedLine.endsWith(":")) {
      return systemPrompt;
    }

    if (trimmedLine === PI_ENV_GUIDELINE) {
      lines.splice(index, 1);
      return lines.join("\n");
    }
  }

  return systemPrompt;
}

export default function removePiEnvGuidelineExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    const systemPrompt = removePiEnvGuideline(event.systemPrompt);
    return systemPrompt === event.systemPrompt ? undefined : { systemPrompt };
  });
}
