import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

export const FALLBACK_BEHAVIORAL_GUIDELINE_SECTION_NAMES = [
  "communicationAndToolUse",
  "repositoryInstructions",
  "executionPolicy",
  "evidenceDiscipline",
  "planningDiscipline",
  "changeScope",
  "validation",
  "efficiency",
  "finalResponse",
] as const;

export const BEHAVIORAL_GUIDELINE_SECTION_NAMES = FALLBACK_BEHAVIORAL_GUIDELINE_SECTION_NAMES;

export type BehavioralGuidelineSectionName = string;

export interface BehavioralGuidelinesConfig {
  enabled?: boolean;
  sections?: Partial<Record<BehavioralGuidelineSectionName, boolean>>;
  include?: BehavioralGuidelineSectionName[];
  useDefaults?: boolean;
}

export interface BehavioralGuidelineDefinition {
  name: BehavioralGuidelineSectionName;
  path: string;
  content: string;
  defaultEnabled: boolean;
}

export interface BehavioralGuidelineRegistry {
  path: string;
  guidelines: BehavioralGuidelineDefinition[];
  defaultEnabled: boolean;
}

export interface LoadBehavioralGuidelineRegistryResult {
  registry?: BehavioralGuidelineRegistry;
  error?: string;
}

const PRIMARY_MARKER = "\nPi documentation (read only";
const FALLBACK_MARKER = "\n<project_context>\n";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeRelativePath(path: string): boolean {
  return !isAbsolute(path) && !path.split(/[\\/]+/).includes("..");
}

function loadRegistryFromConfig(configPath: string): BehavioralGuidelineRegistry {
  const guidelinesDir = dirname(configPath);
  const parsed = parseYaml(readFileSync(configPath, "utf8")) as unknown;
  if (!isObject(parsed)) {
    throw new Error("guidelines.yaml must be an object");
  }

  const defaults = parsed.defaults;
  if (defaults !== undefined && !isObject(defaults)) {
    throw new Error('field "defaults" must be an object when present');
  }

  const defaultEnabled = defaults && defaults.enabled !== undefined ? defaults.enabled : true;
  if (typeof defaultEnabled !== "boolean") {
    throw new Error('field "defaults.enabled" must be a boolean when present');
  }

  if (!Array.isArray(parsed.guidelines)) {
    throw new Error('field "guidelines" must be an array');
  }

  const names = new Set<string>();
  const baseRealPath = realpathSync(guidelinesDir);
  const guidelines = parsed.guidelines.map((item, index): BehavioralGuidelineDefinition => {
    if (!isObject(item)) {
      throw new Error(`guidelines[${index}] must be an object`);
    }

    if (typeof item.name !== "string" || item.name.trim() === "") {
      throw new Error(`guidelines[${index}].name must be a non-empty string`);
    }
    if (names.has(item.name)) {
      throw new Error(`duplicate behavioral guideline name "${item.name}"`);
    }
    names.add(item.name);

    if (typeof item.path !== "string" || item.path.trim() === "") {
      throw new Error(`guidelines[${index}].path must be a non-empty string`);
    }
    if (!isSafeRelativePath(item.path)) {
      throw new Error(`guideline "${item.name}" path must be relative and stay inside .pi/guidelines`);
    }

    const defaultEnabledValue = item.defaultEnabled ?? defaultEnabled;
    if (typeof defaultEnabledValue !== "boolean") {
      throw new Error(`guideline "${item.name}" defaultEnabled must be a boolean when present`);
    }

    const filePath = resolve(guidelinesDir, normalize(item.path));
    if (!existsSync(filePath)) {
      throw new Error(`guideline "${item.name}" file does not exist: ${item.path}`);
    }

    const fileRealPath = realpathSync(filePath);
    if (fileRealPath !== baseRealPath && !fileRealPath.startsWith(`${baseRealPath}/`)) {
      throw new Error(`guideline "${item.name}" path must stay inside .pi/guidelines`);
    }

    return {
      name: item.name,
      path: item.path,
      content: readFileSync(filePath, "utf8"),
      defaultEnabled: defaultEnabledValue,
    };
  });

  return { path: configPath, guidelines, defaultEnabled };
}

export function getBehavioralGuidelinesConfigPath(cwd: string): string {
  return join(cwd, ".pi", "guidelines", "guidelines.yaml");
}

export function loadBehavioralGuidelineRegistry(cwd: string): LoadBehavioralGuidelineRegistryResult {
  const configPath = getBehavioralGuidelinesConfigPath(cwd);
  if (!existsSync(configPath)) {
    return { registry: { path: configPath, guidelines: [], defaultEnabled: true } };
  }

  try {
    return { registry: loadRegistryFromConfig(configPath) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function loadBehavioralGuidelineSectionNames(cwd: string): string[] {
  const loaded = loadBehavioralGuidelineRegistry(cwd);
  if (loaded.registry && loaded.registry.guidelines.length > 0) {
    return loaded.registry.guidelines.map((guideline) => guideline.name);
  }

  return [...FALLBACK_BEHAVIORAL_GUIDELINE_SECTION_NAMES];
}

function getEnabledGuidelines(
  registry: BehavioralGuidelineRegistry,
  config: BehavioralGuidelinesConfig | undefined,
  systemPrompt: string,
): string {
  const sections = config?.sections ?? {};
  const includeSet = config?.include ? new Set(config.include) : undefined;
  const useDefaults = config?.useDefaults ?? true;

  return registry.guidelines
    .filter(({ name, content, defaultEnabled }) => {
      if (includeSet) {
        return includeSet.has(name) && sections[name] !== false && !systemPrompt.includes(content);
      }

      const value = sections[name];
      const enabled = typeof value === "boolean" ? value : useDefaults ? defaultEnabled : false;
      return enabled && !systemPrompt.includes(content);
    })
    .map(({ content }) => content)
    .join("");
}

function injectGuidelines(
  systemPrompt: string,
  registry: BehavioralGuidelineRegistry,
  config?: BehavioralGuidelinesConfig,
): string {
  const guidelines = getEnabledGuidelines(registry, config, systemPrompt);
  if (!guidelines) return systemPrompt;

  let markerIndex = systemPrompt.indexOf(PRIMARY_MARKER);
  if (markerIndex === -1) markerIndex = systemPrompt.indexOf(FALLBACK_MARKER);
  if (markerIndex === -1) {
    return `${systemPrompt}\n${guidelines}`;
  }

  return `${systemPrompt.slice(0, markerIndex)}\n\n${guidelines}${systemPrompt.slice(markerIndex)}`;
}

export function hasBehavioralGuidelinesInsertionMarker(systemPrompt: string): boolean {
  return systemPrompt.includes(PRIMARY_MARKER) || systemPrompt.includes(FALLBACK_MARKER);
}

export function injectBehavioralGuidelines(
  systemPrompt: string,
  config?: BehavioralGuidelinesConfig,
  registry?: BehavioralGuidelineRegistry,
): string {
  if (config?.enabled === false) {
    return systemPrompt;
  }

  if (!registry || registry.guidelines.length === 0) {
    return systemPrompt;
  }

  return injectGuidelines(systemPrompt, registry, config);
}
