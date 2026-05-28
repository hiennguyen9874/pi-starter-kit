import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse as parseYaml } from "yaml";

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

function loadDefaultProfile(piDir: string): { defaultProfile?: string; error?: string } {
  const profilesJsonPath = join(piDir, "profiles.json");
  if (!existsSync(profilesJsonPath)) {
    return {};
  }

  try {
    const content = readFileSync(profilesJsonPath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "profiles.json must be an object" };
    }

    const raw = parsed as Record<string, unknown>;
    if (raw.defaultProfile !== undefined && typeof raw.defaultProfile !== "string") {
      return { error: '"defaultProfile" must be a string when present' };
    }

    return { defaultProfile: raw.defaultProfile as string | undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function isProfileYamlFile(name: string): boolean {
  return name.endsWith(".yaml") && !name.startsWith(".") && !name.startsWith("_");
}

function loadProfilesFromDirectory(profilesDir: string): {
  profiles: Record<string, ProfileDefinition>;
  errors: string[];
} {
  if (!existsSync(profilesDir)) {
    return { profiles: {}, errors: [] };
  }

  const profiles: Record<string, ProfileDefinition> = {};
  const errors: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(profilesDir);
  } catch (error) {
    errors.push(`Failed to read profiles directory: ${error instanceof Error ? error.message : String(error)}`);
    return { profiles, errors };
  }

  const yamlFiles = entries.filter(isProfileYamlFile).sort();

  for (const fileName of yamlFiles) {
    const profileName = fileName.slice(0, -5); // Remove .yaml extension
    const filePath = join(profilesDir, fileName);

    try {
      const content = readFileSync(filePath, "utf8");
      const parsed = parseYaml(content);
      const profile = validateProfileDefinition(profileName, parsed);
      profiles[profileName] = profile;
    } catch (error) {
      errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { profiles, errors };
}

export function loadProfilesConfig(cwd: string): LoadProfilesConfigResult {
  const piDir = join(cwd, ".pi");
  const profilesDir = join(piDir, "profiles");
  const profilesJsonPath = join(piDir, "profiles.json");

  const { defaultProfile, error: defaultError } = loadDefaultProfile(piDir);
  if (defaultError) {
    return { path: profilesJsonPath, error: defaultError };
  }

  const { profiles, errors } = loadProfilesFromDirectory(profilesDir);
  if (errors.length > 0) {
    return { path: profilesDir, error: errors.join("\n") };
  }

  return {
    path: profilesDir,
    config: { defaultProfile, profiles },
  };
}
