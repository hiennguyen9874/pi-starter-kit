import type { ExtensionAPI, Skill } from "@earendil-works/pi-coding-agent";
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

function normalizeFilter(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const filter = value.trim();
  return filter.length > 0 ? filter : undefined;
}

function readDisabledSkillFilters(settings: any): string[] {
  const raw = settings?.extensionState?.skillsInstructionsRewriterDisabledSkillFilters;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeFilter).filter((value): value is string => Boolean(value));
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function skillMatchesFilter(skill: Skill, filter: string): boolean {
  const normalizedName = skill.name.toLowerCase();
  const normalizedPath = skill.filePath.toLowerCase();
  const normalizedFilter = filter.toLowerCase();

  if (filter.includes("*")) {
    const matcher = wildcardToRegExp(filter);
    return matcher.test(skill.name) || matcher.test(skill.filePath);
  }

  return normalizedName.includes(normalizedFilter) || normalizedPath.includes(normalizedFilter);
}

function filterSkills(skills: Skill[], disabledFilters: string[]): Skill[] {
  if (disabledFilters.length === 0) return skills;
  return skills.filter((skill) => !disabledFilters.some((filter) => skillMatchesFilter(skill, filter)));
}

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
  const skillsBlock = buildSkillsBlock(skills);

  const blockStart = systemPrompt.indexOf(NEW_BLOCK_MARKER);
  if (blockStart !== -1) {
    const blockEndMarker = "</skills_instructions>";
    const blockEndIndex = systemPrompt.indexOf(blockEndMarker, blockStart);
    if (blockEndIndex === -1) return systemPrompt;

    const before = systemPrompt.slice(0, blockStart).trimEnd();
    const after = systemPrompt.slice(blockEndIndex + blockEndMarker.length);
    return `${before}\n\n${skillsBlock}${after}`;
  }

  const startIndex = systemPrompt.indexOf(LEGACY_START_MARKER);
  if (startIndex === -1) return systemPrompt;

  const endIndex = systemPrompt.indexOf(DATE_MARKER, startIndex);
  if (endIndex === -1) return systemPrompt;

  const before = systemPrompt.slice(0, startIndex).trimEnd();
  const after = systemPrompt.slice(endIndex);

  return `${before}\n\n${skillsBlock}\n${after}`;
}

function rewriteSkillsBlock(systemPrompt: string, skills: Skill[]): string {
  const settings = readSettings();
  const disabledFilters = readDisabledSkillFilters(settings);
  const filteredSkills = filterSkills(skills, disabledFilters);

  return rewriteSkillsSection(systemPrompt, filteredSkills);
}

export default function skillsInstructionsRewriterExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    if (!isEnabled()) return undefined;

    const updatedSystemPrompt = rewriteSkillsBlock(
      event.systemPrompt,
      event.systemPromptOptions.skills ?? [],
    );

    if (updatedSystemPrompt === event.systemPrompt) return undefined;
    return { systemPrompt: updatedSystemPrompt };
  });
}
