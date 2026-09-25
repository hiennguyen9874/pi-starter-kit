import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROJECT_CONTEXT_SECTION = /<project_context>[\s\S]*?<\/project_context>/g;

function removeProjectContextSections(systemPrompt: string): string {
  const sections = systemPrompt.split(PROJECT_CONTEXT_SECTION);
  if (sections.length === 1) return systemPrompt;

  return sections.reduce((result, section, index) => {
    if (index === 0) return section;

    const before = result.trimEnd();
    const after = section.trimStart();
    return `${before}${before && after ? "\n\n" : ""}${after}`;
  }, "");
}

export default function disableProjectContext(pi: ExtensionAPI) {
  pi.on("before_agent_start", (event) => {
    const systemPrompt = removeProjectContextSections(event.systemPrompt);
    if (systemPrompt === event.systemPrompt) return undefined;

    return { systemPrompt };
  });
}
