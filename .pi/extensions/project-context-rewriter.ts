import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const PROJECT_CONTEXT_START = "<project_context>";
const PROJECT_CONTEXT_END = "</project_context>";

function getSettingsPath(): string {
  const piDir = process.env.PI_CONFIG_DIR || path.join(process.cwd(), ".pi");
  return path.join(piDir, "settings.json");
}

function readSettings(): any {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), "utf8"));
  } catch {
    return {};
  }
}

function isProjectContextDisabled(settings: any): boolean {
  const value = settings?.extensionState?.projectContextRewriterDisableProjectContext;
  return typeof value === "boolean" ? value : false;
}

function isRootAgentsEmpty(cwd?: string): boolean {
  const agentsPath = path.join(cwd || process.cwd(), "AGENTS.md");

  try {
    const content = fs.readFileSync(agentsPath, "utf8");
    return content.trim().length === 0;
  } catch {
    return false;
  }
}

function removeProjectContextSection(systemPrompt: string): string {
  const startIndex = systemPrompt.indexOf(PROJECT_CONTEXT_START);
  if (startIndex === -1) return systemPrompt;

  const endIndex = systemPrompt.indexOf(PROJECT_CONTEXT_END, startIndex);
  if (endIndex === -1) return systemPrompt;

  const before = systemPrompt.slice(0, startIndex).trimEnd();
  const after = systemPrompt.slice(endIndex + PROJECT_CONTEXT_END.length).trimStart();

  return `${before}${after.length > 0 ? `\n\n${after}` : ""}`;
}

export default function projectContextRewriterExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const settings = readSettings();
    const shouldRemove =
      isProjectContextDisabled(settings) || isRootAgentsEmpty((ctx as any)?.cwd);

    if (!shouldRemove) return undefined;

    const updatedSystemPrompt = removeProjectContextSection(event.systemPrompt);
    if (updatedSystemPrompt === event.systemPrompt) return undefined;

    return { systemPrompt: updatedSystemPrompt };
  });
}
