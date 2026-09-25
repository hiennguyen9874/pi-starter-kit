import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

const AVAILABLE_SKILLS_RE = /(<available_skills\b[^>]*>)([\s\S]*?)(<\/available_skills>)/;
const SKILL_BLOCK_RE = /[ \t]*<skill\b[^>]*>[\s\S]*?<\/skill>[ \t]*(?:\r?\n)?/g;

function readDisabledSkillFilters(): string[] {
  const piDir = process.env.PI_CONFIG_DIR || path.join(process.cwd(), ".pi");
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(piDir, "settings.json"), "utf8"));
    const filters = settings?.extensionState?.skillsInstructionsRewriterDisabledSkillFilters;
    return Array.isArray(filters)
      ? filters.filter((filter: unknown): filter is string => typeof filter === "string")
        .map((filter: string) => filter.trim())
        .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function matchesSkillName(name: string, filter: string): boolean {
  return filter.includes("*")
    ? wildcardToRegExp(filter).test(name)
    : name.toLowerCase().includes(filter.toLowerCase());
}

export function removeDisabledSkillsFromPrompt(systemPrompt: string, filters: string[]): string {
  if (filters.length === 0) return systemPrompt;

  return systemPrompt.replace(AVAILABLE_SKILLS_RE, (_section, open, skills, close) => {
    const filteredSkills = skills.replace(SKILL_BLOCK_RE, (skillBlock) => {
      const name = skillBlock.match(/<name\b[^>]*>([\s\S]*?)<\/name>/)?.[1]?.trim();
      return name && filters.some((filter) => matchesSkillName(name, filter)) ? "" : skillBlock;
    });
    return `${open}${filteredSkills}${close}`;
  });
}

export default function skillsInstructionsRewriterExtension(pi: ExtensionAPI) {
  pi.on("before_agent_start", (event) => {
    const systemPrompt = removeDisabledSkillsFromPrompt(
      event.systemPrompt,
      readDisabledSkillFilters(),
    );
    return systemPrompt === event.systemPrompt ? undefined : { systemPrompt };
  });
}
