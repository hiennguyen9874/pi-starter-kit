import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ProfileDefinition } from "./profile-policy.ts";

interface CommandLike {
  name?: string;
  source?: string;
}

export function getKnownSkillNames(commands: CommandLike[]): string[] {
  return commands
    .filter((command): command is Required<Pick<CommandLike, "name" | "source">> => {
      return typeof command.name === "string" && command.source === "skill";
    })
    .map((command) => command.name)
    .sort((a, b) => a.localeCompare(b));
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
  if (profile.mcpServersEnable?.length) {
    parts.push(`mcp +${profile.mcpServersEnable.join(", ")}`);
  }
  if (profile.mcpServersDisable?.length) {
    parts.push(`mcp -${profile.mcpServersDisable.join(", ")}`);
  }

  if (parts.length === 1) {
    parts.push("no profile restrictions");
  }

  return parts.join(" · ");
}
