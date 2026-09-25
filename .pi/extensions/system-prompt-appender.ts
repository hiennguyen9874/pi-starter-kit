import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const FIRST_LINE_MARKER = "You are an expert coding assistant";
const TOOLS_MARKER = "\nAvailable tools";
const LEGACY_APPENDER_BLOCK = /<system-prompt-appender>([\s\S]*?)<\/system-prompt-appender>/;
const XML_SECTION_START = /<(?![!?/])([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?>/;
const DEFAULT_PROMPT_PATH = "system-prompt.md";

interface SystemPromptAppenderConfig {
  enabled: boolean;
  promptPath: string;
}

function getPiDir(): string {
  return process.env.PI_CONFIG_DIR || path.join(process.cwd(), ".pi");
}

function getSettingsPath(): string {
  return path.join(getPiDir(), "settings.json");
}

function readSettings(): any {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath(), "utf8"));
  } catch {
    return {};
  }
}

function readConfig(): SystemPromptAppenderConfig {
  const extensionState = readSettings().extensionState || {};
  const enabled = extensionState.systemPromptAppenderEnabled;
  const promptPath = extensionState.systemPromptAppenderPromptPath;

  return {
    enabled: typeof enabled === "boolean" ? enabled : true,
    promptPath: typeof promptPath === "string" && promptPath.trim() ? promptPath : DEFAULT_PROMPT_PATH,
  };
}

function resolvePromptPath(promptPath: string): string {
  return path.isAbsolute(promptPath) ? promptPath : path.join(getPiDir(), promptPath);
}

function readPromptFile(promptPath: string): string | undefined {
  try {
    const content = fs.readFileSync(resolvePromptPath(promptPath), "utf8").trim();
    return content.length > 0 ? content : undefined;
  } catch {
    return undefined;
  }
}

export function appendSystemPromptSection(systemPrompt: string, promptSection: string): string {
  const section = promptSection.trim();
  const existingBlock = LEGACY_APPENDER_BLOCK.exec(systemPrompt);

  if (!section) {
    return existingBlock
      ? systemPrompt.replace(LEGACY_APPENDER_BLOCK, "").replace(/\n{3,}/g, "\n\n")
      : systemPrompt;
  }
  if (existingBlock?.[1].trim() === section) {
    return systemPrompt.replace(LEGACY_APPENDER_BLOCK, section);
  }
  if (!existingBlock && systemPrompt.includes(section)) return systemPrompt;
  if (existingBlock) return systemPrompt.replace(LEGACY_APPENDER_BLOCK, section);

  // Native prompts have an untagged introduction followed by XML section elements.
  const xmlSection = XML_SECTION_START.exec(systemPrompt);
  if (xmlSection?.index !== undefined) {
    const beforeSection = systemPrompt.slice(0, xmlSection.index).trimEnd();
    const afterSection = systemPrompt.slice(xmlSection.index);
    return `${beforeSection}${beforeSection ? "\n\n" : ""}${section}\n\n${afterSection}`;
  }

  const lines = systemPrompt.split("\n");
  const firstLineIndex = lines.findIndex((line) => line.includes(FIRST_LINE_MARKER));
  if (firstLineIndex !== -1) {
    return [
      ...lines.slice(0, firstLineIndex + 1),
      "",
      section,
      "",
      ...lines.slice(firstLineIndex + 1),
    ].join("\n");
  }

  const toolsIndex = systemPrompt.indexOf(TOOLS_MARKER);
  if (toolsIndex !== -1) {
    return `${systemPrompt.slice(0, toolsIndex).trimEnd()}\n\n${section}\n${systemPrompt.slice(toolsIndex)}`;
  }

  return `${systemPrompt.trimEnd()}\n\n${section}`;
}

export default function systemPromptAppenderExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    const config = readConfig();
    if (!config.enabled) return undefined;

    const promptSection = readPromptFile(config.promptPath);
    if (!promptSection) {
      if (ctx.hasUI) {
        ctx.ui.notify(`System prompt appender file not found or empty: ${config.promptPath}`, "warning");
      }
      const systemPrompt = appendSystemPromptSection(event.systemPrompt, "");
      return systemPrompt === event.systemPrompt ? undefined : { systemPrompt };
    }

    const systemPrompt = appendSystemPromptSection(event.systemPrompt, promptSection);
    if (systemPrompt === event.systemPrompt) return undefined;

    return { systemPrompt };
  });
}
