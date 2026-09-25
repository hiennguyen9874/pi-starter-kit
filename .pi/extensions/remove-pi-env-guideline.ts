import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GUIDELINES_HEADER = "Guidelines:";
const PI_ENV_GUIDELINE = "- You can inspect PI_* environment variables for current model and session details.";

/** Remove the PI environment inspection instruction from the legacy or native rules section. */
export function removePiEnvGuideline(systemPrompt: string): string {
  const lines = systemPrompt.split("\n");
  let section: "guidelines" | "nativeRules" | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (trimmedLine === "<rules>") {
      section = "nativeRules";
      continue;
    }
    if (trimmedLine === "</rules>") {
      if (section === "nativeRules") section = undefined;
      continue;
    }
    if (trimmedLine === GUIDELINES_HEADER) {
      section = "guidelines";
      continue;
    }

    // A non-list, non-indented colon-terminated line begins the next legacy section.
    if (
      section === "guidelines" &&
      line === trimmedLine &&
      !trimmedLine.startsWith("-") &&
      trimmedLine.endsWith(":")
    ) {
      section = undefined;
      continue;
    }

    if (section && trimmedLine === PI_ENV_GUIDELINE) {
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
