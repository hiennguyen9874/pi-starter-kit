import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ProfileDefinition } from "./profile-policy.ts";

export interface ProfilesConfig {
  defaultProfile?: string;
  profiles: Record<string, ProfileDefinition>;
}

export interface LoadProfilesConfigResult {
  path: string;
  config?: ProfilesConfig;
  error?: string;
}

const LIST_FIELDS = ["skillsEnable", "skillsDisable", "mcpServersEnable", "mcpServersDisable"] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateProfileDefinition(name: string, value: unknown): ProfileDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Profile "${name}" must be an object`);
  }

  const profile = value as Record<string, unknown>;
  const result: ProfileDefinition = {};

  for (const field of LIST_FIELDS) {
    const fieldValue = profile[field];
    if (fieldValue === undefined) {
      continue;
    }

    if (!isStringArray(fieldValue)) {
      throw new Error(`Profile "${name}" field "${field}" must be a string[]`);
    }

    result[field] = fieldValue;
  }

  return result;
}

function validateProfilesConfig(value: unknown): ProfilesConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("profiles config must be an object");
  }

  const raw = value as Record<string, unknown>;

  if (raw.defaultProfile !== undefined && typeof raw.defaultProfile !== "string") {
    throw new Error('"defaultProfile" must be a string when present');
  }

  if (!raw.profiles || typeof raw.profiles !== "object" || Array.isArray(raw.profiles)) {
    throw new Error('"profiles" must be an object');
  }

  const profiles: Record<string, ProfileDefinition> = {};
  for (const [name, profile] of Object.entries(raw.profiles)) {
    profiles[name] = validateProfileDefinition(name, profile);
  }

  return {
    defaultProfile: raw.defaultProfile as string | undefined,
    profiles,
  };
}

export function loadProfilesConfig(cwd: string): LoadProfilesConfigResult {
  const path = join(cwd, ".pi", "profiles.json");

  if (!existsSync(path)) {
    return { path, config: undefined };
  }

  try {
    const content = readFileSync(path, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return {
      path,
      config: validateProfilesConfig(parsed),
    };
  } catch (error) {
    return {
      path,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
