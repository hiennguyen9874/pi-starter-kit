import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import { PROFILE_WILDCARD, type ProfileDefinition } from "./profile-policy.ts";

interface JsonObject {
  [key: string]: unknown;
}

interface ManagedProfileState {
  managedSkillEntries?: string[];
  mcpBaseline?: JsonObject;
}

export interface SyncProfileResourcesResult {
  changed: boolean;
  settingsChanged: boolean;
  mcpChanged: boolean;
}

interface ProjectSkillResource {
  name: string;
  overrideEntry: string;
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPiDir(cwd: string): string {
  return join(cwd, ".pi");
}

function getProfileStatePath(cwd: string): string {
  return join(getPiDir(cwd), "profile-state.json");
}

function getManagedStatePath(cwd: string): string {
  return join(getPiDir(cwd), "profile-extension-state.json");
}

function getSettingsPath(cwd: string): string {
  return join(getPiDir(cwd), "settings.json");
}

function getMcpPath(cwd: string): string {
  return join(getPiDir(cwd), "mcp.json");
}

function readJsonObject(path: string): JsonObject | undefined {
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return isObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeJsonObject(path: string, value: JsonObject): boolean {
  mkdirSync(dirname(path), { recursive: true });
  const nextContent = `${JSON.stringify(value, null, 2)}\n`;
  const currentContent = existsSync(path) ? readFileSync(path, "utf8") : undefined;

  if (currentContent === nextContent) {
    return false;
  }

  writeFileSync(path, nextContent);
  return true;
}

function readManagedState(cwd: string): ManagedProfileState {
  const parsed = readJsonObject(getManagedStatePath(cwd));
  if (!parsed) {
    return {};
  }

  return {
    managedSkillEntries: Array.isArray(parsed.managedSkillEntries)
      ? parsed.managedSkillEntries.filter((entry): entry is string => typeof entry === "string")
      : [],
    mcpBaseline: isObject(parsed.mcpBaseline) ? parsed.mcpBaseline : undefined,
  };
}

function extractSkillName(skillFilePath: string): string {
  try {
    const content = readFileSync(skillFilePath, "utf8");
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/m)?.[1]?.match(/(?:^|\r?\n)name:\s*([^\r\n]+)/);
    if (match?.[1]) {
      return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Ignore parse failures and fall back to directory name.
  }

  return basename(dirname(skillFilePath)) || "unknown-skill";
}

function collectProjectSkillResources(dir: string, piDir: string, results: ProjectSkillResource[]): void {
  if (!existsSync(dir)) {
    return;
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const skillFile = entries.find((entry) => entry.name === "SKILL.md");
  if (skillFile) {
    const skillPath = join(dir, skillFile.name);
    results.push({
      name: extractSkillName(skillPath),
      overrideEntry: relative(piDir, dir).replace(/\\/g, "/"),
    });
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectProjectSkillResources(fullPath, piDir, results);
      continue;
    }

    if (dir.endsWith("/skills") || dir.endsWith("\\skills")) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push({
          name: entry.name.replace(/\.md$/i, ""),
          overrideEntry: relative(piDir, fullPath).replace(/\\/g, "/"),
        });
      }
    }
  }
}

function loadProjectSkillResources(cwd: string): ProjectSkillResource[] {
  const piDir = getPiDir(cwd);
  const skillsDir = join(piDir, "skills");
  const resources: ProjectSkillResource[] = [];
  collectProjectSkillResources(skillsDir, piDir, resources);

  return resources.sort((a, b) => a.name.localeCompare(b.name));
}

function dedupeSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function buildManagedSkillEntries(cwd: string, profile: ProfileDefinition): string[] {
  const enabledSet = new Set(profile.skillsEnable ?? []);
  const disabledSet = new Set(profile.skillsDisable ?? []);
  const enableAll = enabledSet.has(PROFILE_WILDCARD);
  const disableAll = disabledSet.has(PROFILE_WILDCARD);

  return dedupeSorted(
    loadProjectSkillResources(cwd)
      .filter((skill) => disableAll || disabledSet.has(skill.name) || (!enableAll && enabledSet.size > 0 && !enabledSet.has(skill.name)))
      .map((skill) => `-${skill.overrideEntry}`),
  );
}

function mergeManagedSkillEntries(settings: JsonObject, previousManaged: string[], nextManaged: string[]): JsonObject {
  const preservedEntries = Array.isArray(settings.skills)
    ? settings.skills.filter((entry): entry is string => typeof entry === "string" && !previousManaged.includes(entry))
    : [];

  const nextSettings: JsonObject = { ...settings };
  const mergedEntries = [...preservedEntries, ...nextManaged];

  if (mergedEntries.length > 0) {
    nextSettings.skills = mergedEntries;
  } else {
    delete nextSettings.skills;
  }

  return nextSettings;
}

function filterMcpConfig(baseline: JsonObject, profile: ProfileDefinition): JsonObject {
  const existingServers = isObject(baseline.mcpServers) ? baseline.mcpServers : {};
  const enabledSet = new Set(profile.mcpServersEnable ?? []);
  const disabledSet = new Set(profile.mcpServersDisable ?? []);
  const enableAll = enabledSet.has(PROFILE_WILDCARD);
  const disableAll = disabledSet.has(PROFILE_WILDCARD);
  const filteredServers = Object.fromEntries(
    Object.entries(existingServers).filter(([name]) => {
      if (disableAll || disabledSet.has(name)) {
        return false;
      }

      if (enabledSet.size === 0 || enableAll) {
        return true;
      }

      return enabledSet.has(name);
    }),
  );

  return {
    ...baseline,
    mcpServers: filteredServers,
  };
}

export function readPersistedProfileName(cwd: string): string | undefined {
  const parsed = readJsonObject(getProfileStatePath(cwd));
  return typeof parsed?.name === "string" ? parsed.name : undefined;
}

export function writePersistedProfileName(cwd: string, name: string | undefined): boolean {
  if (!name) {
    return false;
  }

  mkdirSync(getPiDir(cwd), { recursive: true });
  return writeJsonObject(getProfileStatePath(cwd), { name });
}

export function loadProfileKnownSkillNames(cwd: string): string[] {
  return dedupeSorted(loadProjectSkillResources(cwd).map((skill) => skill.name));
}

export function loadProfileKnownMcpServerNames(cwd: string): string[] {
  const managedState = readManagedState(cwd);
  const source = managedState.mcpBaseline ?? readJsonObject(getMcpPath(cwd));
  const servers = isObject(source?.mcpServers) ? source.mcpServers : {};
  return Object.keys(servers).sort((a, b) => a.localeCompare(b));
}

export function syncProfileResources(cwd: string, profileName: string, profile: ProfileDefinition): SyncProfileResourcesResult {
  mkdirSync(getPiDir(cwd), { recursive: true });

  const managedState = readManagedState(cwd);
  const nextManagedSkillEntries = buildManagedSkillEntries(cwd, profile);
  const settingsPath = getSettingsPath(cwd);
  const currentSettings = readJsonObject(settingsPath) ?? {};
  const nextSettings = mergeManagedSkillEntries(
    currentSettings,
    managedState.managedSkillEntries ?? [],
    nextManagedSkillEntries,
  );
  const settingsChanged = writeJsonObject(settingsPath, nextSettings);

  const currentMcp = readJsonObject(getMcpPath(cwd));
  const mcpBaseline = managedState.mcpBaseline ?? currentMcp;
  let mcpChanged = false;

  if (mcpBaseline) {
    mcpChanged = writeJsonObject(getMcpPath(cwd), filterMcpConfig(mcpBaseline, profile));
  }

  const persistedChanged = writePersistedProfileName(cwd, profileName);
  const managedStateChanged = writeJsonObject(getManagedStatePath(cwd), {
    managedSkillEntries: nextManagedSkillEntries,
    ...(mcpBaseline ? { mcpBaseline } : {}),
  });

  return {
    changed: persistedChanged || settingsChanged || mcpChanged || managedStateChanged,
    settingsChanged,
    mcpChanged,
  };
}
