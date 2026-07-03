import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import { PROFILE_WILDCARD, type ProfileDefinition } from "./profile-policy.ts";

interface JsonObject {
  [key: string]: unknown;
}

interface ManagedProfileState {
  managedSkillEntries?: string[];
  managedPromptEntries?: string[];
  managedPackageEntries?: string[];
  managedExtensionEntries?: string[];
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

function getLocalStateDir(cwd: string): string {
  return join(getPiDir(cwd), ".local");
}

function getProfileStatePath(cwd: string): string {
  return join(getLocalStateDir(cwd), "profile-state.json");
}

function getManagedStatePath(cwd: string): string {
  return join(getLocalStateDir(cwd), "profile-extension-state.json");
}

function getSettingsBasePath(cwd: string): string {
  return join(getPiDir(cwd), "settings.base.json");
}

function getSettingsPath(cwd: string): string {
  return join(getPiDir(cwd), "settings.json");
}

function getMcpBasePath(cwd: string): string {
  return join(getPiDir(cwd), "mcp.base.json");
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
    managedPromptEntries: Array.isArray(parsed.managedPromptEntries)
      ? parsed.managedPromptEntries.filter((entry): entry is string => typeof entry === "string")
      : [],
    managedPackageEntries: Array.isArray(parsed.managedPackageEntries)
      ? parsed.managedPackageEntries.filter((entry): entry is string => typeof entry === "string")
      : [],
    managedExtensionEntries: Array.isArray(parsed.managedExtensionEntries)
      ? parsed.managedExtensionEntries.filter((entry): entry is string => typeof entry === "string")
      : [],
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

function resourceName(entry: string): string {
  return entry.startsWith("-") ? entry.slice(1) : entry;
}

function getSettingEntries(settings: JsonObject | undefined, key: "packages" | "extensions"): string[] {
  return Array.isArray(settings?.[key]) ? settings[key].filter((entry): entry is string => typeof entry === "string") : [];
}

function loadProjectPromptResources(cwd: string): ProjectSkillResource[] {
  const piDir = getPiDir(cwd);
  const promptsDir = join(piDir, "prompts");
  if (!existsSync(promptsDir)) {
    return [];
  }

  return readdirSync(promptsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith(".") && !entry.name.startsWith("_"))
    .map((entry) => {
      const fullPath = join(promptsDir, entry.name);
      return {
        name: entry.name.replace(/\.md$/i, ""),
        overrideEntry: relative(piDir, fullPath).replace(/\\/g, "/"),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildManagedSettingEntries(defaultEntries: string[], enabled: string[] = [], disabled: string[] = []): string[] {
  const enabledNames = new Set(enabled.map(resourceName));
  const disabledNames = new Set(disabled.map(resourceName));
  const seenNames = new Set<string>();
  const entries: string[] = [];

  function add(entry: string): void {
    const name = resourceName(entry);
    if (seenNames.has(name)) {
      return;
    }

    seenNames.add(name);
    entries.push(entry);
  }

  for (const entry of defaultEntries) {
    const name = resourceName(entry);
    if (disabledNames.has(name)) {
      add(`-${name}`);
    } else if (enabledNames.has(name)) {
      add(name);
    } else {
      add(entry);
    }
  }

  for (const entry of enabled) {
    const name = resourceName(entry);
    if (!disabledNames.has(name)) {
      add(name);
    }
  }

  for (const entry of disabled) {
    add(`-${resourceName(entry)}`);
  }

  return entries;
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
function buildManagedPromptEntries(cwd: string, profile: ProfileDefinition): string[] {
  const enabledSet = new Set(profile.promptsEnable ?? []);
  const disabledSet = new Set(profile.promptsDisable ?? []);
  const enableAll = enabledSet.has(PROFILE_WILDCARD);
  const disableAll = disabledSet.has(PROFILE_WILDCARD);

  return dedupeSorted(
    loadProjectPromptResources(cwd)
      .filter((prompt) => disableAll || disabledSet.has(prompt.name) || (!enableAll && enabledSet.size > 0 && !enabledSet.has(prompt.name)))
      .map((prompt) => `-${prompt.overrideEntry}`),
  );
}

function mergeManagedSettingEntries(
  settings: JsonObject,
  key: "skills" | "prompts" | "packages" | "extensions",
  previousManaged: string[],
  nextManaged: string[],
): JsonObject {
  const managedResourceNames = new Set([...previousManaged, ...nextManaged].map(resourceName));
  const preservedEntries = Array.isArray(settings[key])
    ? settings[key].filter(
        (entry): entry is string => typeof entry === "string" && !managedResourceNames.has(resourceName(entry)),
      )
    : [];

  const nextSettings: JsonObject = { ...settings };
  const mergedEntries = [...preservedEntries, ...nextManaged];

  if (mergedEntries.length > 0) {
    nextSettings[key] = mergedEntries;
  } else {
    delete nextSettings[key];
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

  mkdirSync(getLocalStateDir(cwd), { recursive: true });
  return writeJsonObject(getProfileStatePath(cwd), { name });
}

export function loadProfileKnownSkillNames(cwd: string): string[] {
  return dedupeSorted(loadProjectSkillResources(cwd).map((skill) => skill.name));
}

export function loadProfileKnownPromptNames(cwd: string): string[] {
  return dedupeSorted(loadProjectPromptResources(cwd).map((prompt) => prompt.name));
}
export function loadProfileKnownMcpServerNames(cwd: string): string[] {
  const source = readJsonObject(getMcpBasePath(cwd)) ?? readJsonObject(getMcpPath(cwd));
  const servers = isObject(source?.mcpServers) ? source.mcpServers : {};
  return Object.keys(servers).sort((a, b) => a.localeCompare(b));
}

/**
 * Syncs .pi/settings.base.json into .pi/settings.json.
 *
 * For each top-level key present in the base file, the base value replaces
 * the corresponding settings.json value (base is the source of truth).
 * Keys that exist only in settings.json (e.g. `skills` managed by profiles)
 * are preserved.
 *
 * Returns true if settings.json was modified.
 */
export function syncBaseSettings(cwd: string): boolean {
  const baseSettings = readJsonObject(getSettingsBasePath(cwd));
  if (!baseSettings) {
    return false;
  }

  const currentSettings = readJsonObject(getSettingsPath(cwd)) ?? {};

  // Start from current settings to preserve settings.json-only keys
  // (e.g. `skills` managed by profile extension),
  // then overwrite with every key from base (base is source of truth).
  const merged: JsonObject = { ...currentSettings };
  for (const key of Object.keys(baseSettings)) {
    merged[key] = baseSettings[key];
  }

  return writeJsonObject(getSettingsPath(cwd), merged);
}

export function syncBaseSystemResources(cwd: string): { settingsChanged: boolean; mcpChanged: boolean } {
  mkdirSync(getLocalStateDir(cwd), { recursive: true });

  const settingsChanged = syncBaseSettings(cwd);

  const baseMcp = readJsonObject(getMcpBasePath(cwd));
  let mcpChanged = false;

  if (baseMcp) {
    const currentMcp = readJsonObject(getMcpPath(cwd)) ?? {};
    const mergedMcp: JsonObject = { ...currentMcp };
    for (const key of Object.keys(baseMcp)) {
      mergedMcp[key] = baseMcp[key];
    }
    mcpChanged = writeJsonObject(getMcpPath(cwd), mergedMcp);
  }

  return { settingsChanged, mcpChanged };
}

export function syncProfileResources(cwd: string, profileName: string, profile: ProfileDefinition): SyncProfileResourcesResult {
  mkdirSync(getPiDir(cwd), { recursive: true });

  const managedState = readManagedState(cwd);
  const settingsPath = getSettingsPath(cwd);
  const baseSettings = readJsonObject(getSettingsBasePath(cwd));
  const nextManagedSkillEntries = buildManagedSkillEntries(cwd, profile);
  const nextManagedPromptEntries = buildManagedPromptEntries(cwd, profile);
  const nextManagedPackageEntries = buildManagedSettingEntries(
    getSettingEntries(baseSettings, "packages"),
    profile.packagesEnable,
    profile.packagesDisable,
  );
  const nextManagedExtensionEntries = buildManagedSettingEntries(
    getSettingEntries(baseSettings, "extensions"),
    profile.extensionsEnable,
    profile.extensionsDisable,
  );
  const currentSettings = baseSettings ?? readJsonObject(settingsPath) ?? {};
  const previousManagedSkillEntries = baseSettings ? [] : (managedState.managedSkillEntries ?? []);
  const previousManagedPromptEntries = baseSettings ? [] : (managedState.managedPromptEntries ?? []);
  const previousManagedPackageEntries = baseSettings ? [] : (managedState.managedPackageEntries ?? []);
  const previousManagedExtensionEntries = baseSettings ? [] : (managedState.managedExtensionEntries ?? []);
  const nextSettings = mergeManagedSettingEntries(
    mergeManagedSettingEntries(
      mergeManagedSettingEntries(
        mergeManagedSettingEntries(
          currentSettings,
          "skills",
          previousManagedSkillEntries,
          nextManagedSkillEntries,
        ),
        "prompts",
        previousManagedPromptEntries,
        nextManagedPromptEntries,
      ),
      "packages",
      previousManagedPackageEntries,
      nextManagedPackageEntries,
    ),
    "extensions",
    previousManagedExtensionEntries,
    nextManagedExtensionEntries,
  );
  const settingsChanged = writeJsonObject(settingsPath, nextSettings);

  const mcpBaseline = readJsonObject(getMcpBasePath(cwd)) ?? readJsonObject(getMcpPath(cwd));
  let mcpChanged = false;

  if (mcpBaseline) {
    mcpChanged = writeJsonObject(getMcpPath(cwd), filterMcpConfig(mcpBaseline, profile));
  }

  const persistedChanged = writePersistedProfileName(cwd, profileName);
  const managedStateChanged = writeJsonObject(getManagedStatePath(cwd), {
    managedSkillEntries: nextManagedSkillEntries,
    managedPromptEntries: nextManagedPromptEntries,
    managedPackageEntries: nextManagedPackageEntries,
    managedExtensionEntries: nextManagedExtensionEntries,
  });

  return {
    changed: persistedChanged || settingsChanged || mcpChanged || managedStateChanged,
    settingsChanged,
    mcpChanged,
  };
}
