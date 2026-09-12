import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Skill } from "@earendil-works/pi-coding-agent";
import type { ProfileDefinition } from "./profile-policy.ts";

interface CommandLike {
  name?: string;
  source?: string;
}

interface LoadedSkillLike {
  name?: unknown;
}

export function getKnownSkillNames(commands: CommandLike[]): string[] {
  return commands
    .filter((command): command is Required<Pick<CommandLike, "name" | "source">> => {
      return typeof command.name === "string" && command.source === "skill";
    })
    .map((command) => command.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Extract known skill names from pi's fully-loaded skills list
 * (`event.systemPromptOptions.skills` in `before_agent_start`, or
 * `ctx.getSystemPromptOptions().skills` in command handlers).
 *
 * Unlike `loadProfileKnownSkillNames` (which only scans `.pi/skills`) and
 * `getKnownSkillNames(pi.getCommands())` (which may be incomplete at
 * `session_start`), this list includes extension/package-provided skills
 * such as `gpt-image` from `pi-codex-image-gen` (`.pi/git/...`).
 *
 * Same source used by `prompt-skills.ts` and
 * `skills-instructions-rewriter.ts`.
 */
export function getKnownSkillNamesFromLoadedSkills(skills: ReadonlyArray<LoadedSkillLike | Skill> | undefined): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [...new Set(
    skills
      .map((skill) => (typeof skill?.name === "string" ? skill.name.trim() : ""))
      .filter((name): name is string => name.length > 0),
  )].sort((a, b) => a.localeCompare(b));
}

export function mergeKnownSkillNames(...lists: string[][]): string[] {
  return [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b));
}

export function loadKnownMcpServerNames(cwd: string): string[] {
  const path = join(cwd, ".pi", "mcp.json");
  if (!existsSync(path)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    const mcpServers = (parsed as { mcpServers?: unknown }).mcpServers;
    if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) {
      return [];
    }

    return Object.keys(mcpServers).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function summarizeProfile(name: string, profile: ProfileDefinition): string {
  const parts = [name];

  if (profile.skillsEnable?.length) {
    parts.push(`skills +${profile.skillsEnable.join(", ")}`);
  }
  if (profile.skillsDisable?.length) {
    parts.push(`skills -${profile.skillsDisable.join(", ")}`);
  }
  if (profile.promptsEnable?.length) {
    parts.push(`prompts +${profile.promptsEnable.join(", ")}`);
  }
  if (profile.promptsDisable?.length) {
    parts.push(`prompts -${profile.promptsDisable.join(", ")}`);
  }
  if (profile.mcpServersEnable?.length) {
    parts.push(`mcp +${profile.mcpServersEnable.join(", ")}`);
  }
  if (profile.mcpServersDisable?.length) {
    parts.push(`mcp -${profile.mcpServersDisable.join(", ")}`);
  }
  if (profile.extensionState?.behavioralGuidelines?.enabled === false) {
    parts.push("guidelines off");
  } else if (profile.extensionState?.behavioralGuidelines?.sections) {
    const disabledSections = Object.entries(profile.extensionState.behavioralGuidelines.sections)
      .filter(([, enabled]) => enabled === false)
      .map(([section]) => section);
    if (disabledSections.length > 0) {
      parts.push(`guidelines -${disabledSections.join(", ")}`);
    }
  }

  if (parts.length === 1) {
    parts.push("no profile restrictions");
  }

  return parts.join(" · ");
}
