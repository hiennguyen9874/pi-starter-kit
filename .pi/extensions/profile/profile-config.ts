import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { BEHAVIORAL_GUIDELINE_SECTION_NAMES } from "./behavioral-guidelines.ts";
import type { BehavioralGuidelinesConfig, BehavioralGuidelineSectionName } from "./behavioral-guidelines.ts";
import type { ProfileDefinition, ProfileExtensionState } from "./profile-policy.ts";

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
const BEHAVIORAL_GUIDELINE_SECTION_NAME_SET = new Set<string>(BEHAVIORAL_GUIDELINE_SECTION_NAMES);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateBehavioralGuidelinesConfig(profileName: string, value: unknown): BehavioralGuidelinesConfig {
  if (!isObject(value)) {
    throw new Error(`Profile "${profileName}" field "extensionState.behavioralGuidelines" must be an object`);
  }

  const result: BehavioralGuidelinesConfig = {};

  if (value.enabled !== undefined) {
    if (typeof value.enabled !== "boolean") {
      throw new Error(`Profile "${profileName}" field "extensionState.behavioralGuidelines.enabled" must be a boolean`);
    }
    result.enabled = value.enabled;
  }

  if (value.sections !== undefined) {
    if (!isObject(value.sections)) {
      throw new Error(`Profile "${profileName}" field "extensionState.behavioralGuidelines.sections" must be an object`);
    }

    const sections: Partial<Record<BehavioralGuidelineSectionName, boolean>> = {};
    for (const [sectionName, sectionValue] of Object.entries(value.sections)) {
      if (!BEHAVIORAL_GUIDELINE_SECTION_NAME_SET.has(sectionName)) {
        throw new Error(`Profile "${profileName}" has unknown behavioral guideline section "${sectionName}"`);
      }
      if (typeof sectionValue !== "boolean") {
        throw new Error(`Profile "${profileName}" behavioral guideline section "${sectionName}" must be a boolean`);
      }

      sections[sectionName as BehavioralGuidelineSectionName] = sectionValue;
    }

    result.sections = sections;
  }

  return result;
}

function validateProfileExtensionState(name: string, value: unknown): ProfileExtensionState {
  if (!isObject(value)) {
    throw new Error(`Profile "${name}" field "extensionState" must be an object`);
  }

  const result: ProfileExtensionState = {};
  if (value.behavioralGuidelines !== undefined) {
    result.behavioralGuidelines = validateBehavioralGuidelinesConfig(name, value.behavioralGuidelines);
  }

  return result;
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

  if (profile.extensionState !== undefined) {
    result.extensionState = validateProfileExtensionState(name, profile.extensionState);
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
