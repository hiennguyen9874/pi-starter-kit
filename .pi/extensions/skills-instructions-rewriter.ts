import type { ExtensionAPI, Skill } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";

const LEGACY_START_MARKER = "The following skills provide specialized instructions for specific tasks.";
const DATE_MARKER = "\nCurrent date:";
const NEW_BLOCK_MARKER = "<skills_instructions>";

const HOW_TO_USE_SKILLS_LINES = [
  "### How to use skills",
  "The following skills provide specialized instructions for specific tasks.",
  "- Use the read tool to load a skill's file when the task matches its description.",
  "- When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md / dirname of the path) and use that absolute path in tool commands.",
  "- Use the minimal required set of skills. If multiple apply, use them together and state the order briefly.",
];

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

function isEnabled(): boolean {
  const settings = readSettings();
  const value = settings?.extensionState?.skillsInstructionsRewriterEnabled;
  return typeof value === "boolean" ? value : true;
}

function buildSkillsBlock(skills: Skill[]): string {
  const availableSkillsLines = skills.map((skill) => {
    const description = skill.description?.trim() || "No description provided.";
    return `- ${skill.name}: ${description} (file: ${skill.filePath})`;
  });

  return [
    "<skills_instructions>",
    "## Skills",
    "A skill is a set of local instructions in a `SKILL.md` file.",
    "### Available skills",
    ...availableSkillsLines,
    ...HOW_TO_USE_SKILLS_LINES,
    "</skills_instructions>",
  ].join("\n");
}

function rewriteSkillsSection(systemPrompt: string, skills: Skill[]): string {
  if (systemPrompt.includes(NEW_BLOCK_MARKER)) return systemPrompt;

  const startIndex = systemPrompt.indexOf(LEGACY_START_MARKER);
  if (startIndex === -1) return systemPrompt;

  const endIndex = systemPrompt.indexOf(DATE_MARKER, startIndex);
  if (endIndex === -1) return systemPrompt;

  const before = systemPrompt.slice(0, startIndex).trimEnd();
  const after = systemPrompt.slice(endIndex);
  const skillsBlock = buildSkillsBlock(skills);

  return `${before}\n\n${skillsBlock}\n${after}`;
}

export default function skillsInstructionsRewriterExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    if (!isEnabled()) return undefined;

    const updatedSystemPrompt = rewriteSkillsSection(
      event.systemPrompt,
      event.systemPromptOptions.skills ?? [],
    );

    if (updatedSystemPrompt === event.systemPrompt) return undefined;
    return { systemPrompt: updatedSystemPrompt };
  });
}
