import type { BehavioralGuidelinesConfig } from "./behavioral-guidelines.ts";

export const PROFILE_WILDCARD = "*";

export interface ProfileExtensionState {
  behavioralGuidelines?: BehavioralGuidelinesConfig;
}

export interface ProfileExtra {
  override?: Record<string, unknown>;
}

export interface ProfileDefinition {
  /** Global skills, populated from profiles.json, not from profile YAML. */
  alwaysSkills?: string[];
  skillsEnable?: string[];
  skillsDisable?: string[];
  promptsEnable?: string[];
  promptsDisable?: string[];
  mcpServersEnable?: string[];
  mcpServersDisable?: string[];
  packagesEnable?: string[];
  packagesDisable?: string[];
  extensionsEnable?: string[];
  extensionsDisable?: string[];
  extensionState?: ProfileExtensionState;
  extra?: ProfileExtra;
}

export interface ProfilePolicy {
  hasSkillAllowList: boolean;
  hasPromptAllowList: boolean;
  hasMcpAllowList: boolean;
  isSkillAllowed(name: string, path?: string): boolean;
  isPromptAllowed(name: string): boolean;
  isMcpServerAllowed(name: string): boolean;
}

function hasWildcard(values: Set<string>): boolean {
  return values.has(PROFILE_WILDCARD);
}

function hasRestrictiveAllowList(values: Set<string>): boolean {
  return values.size > 0 && !hasWildcard(values);
}

function isAllowed(name: string, enabledSet: Set<string>, disabledSet: Set<string>): boolean {
  if (hasWildcard(disabledSet) || disabledSet.has(name)) {
    return false;
  }

  if (enabledSet.size === 0 || hasWildcard(enabledSet)) {
    return true;
  }

  return enabledSet.has(name);
}

// Canonicalize names and both project- and .pi-relative skill selectors.
export function normalizeSkillSelector(entry: string): string {
  return entry.replace(/^-/, "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\.pi\//, "")
    .replace(/\/$/, "").replace(/\/SKILL\.md$/, "");
}

export function createSkillPolicy(profile: ProfileDefinition) {
  const enabled = new Set((profile.skillsEnable ?? []).map(normalizeSkillSelector));
  const disabled = new Set((profile.skillsDisable ?? []).map(normalizeSkillSelector));
  const always = new Set((profile.alwaysSkills ?? []).map(normalizeSkillSelector));
  const hasAllowList = hasRestrictiveAllowList(enabled);

  function isAlwaysEnabled(name: string, path?: string): boolean {
    return !(path && disabled.has(path)) && (always.has(name) || (path !== undefined && always.has(path)));
  }

  // Zero is disallowed. Higher priority breaks ties between allowed copies.
  function priority(name: string, path?: string): number {
    if (path && disabled.has(path)) return 0;
    if (!isAlwaysEnabled(name, path)) {
      if (disabled.has(PROFILE_WILDCARD) || disabled.has(name)) return 0;
      if (hasAllowList && !enabled.has(name) && !(path && enabled.has(path))) return 0;
    }
    if (path && enabled.has(path)) return 3;
    if (path && always.has(path)) return 2;
    return 1;
  }

  return { hasAllowList, isAlwaysEnabled, priority };
}

export function createProfilePolicy(profile: ProfileDefinition = {}): ProfilePolicy {
  const skillPolicy = createSkillPolicy(profile);
  const mcpEnabledSet = new Set(profile.mcpServersEnable ?? []);
  const mcpDisabledSet = new Set(profile.mcpServersDisable ?? []);
  const promptEnabledSet = new Set(profile.promptsEnable ?? []);
  const promptDisabledSet = new Set(profile.promptsDisable ?? []);

  return {
    hasSkillAllowList: skillPolicy.hasAllowList,
    hasPromptAllowList: hasRestrictiveAllowList(promptEnabledSet),
    hasMcpAllowList: hasRestrictiveAllowList(mcpEnabledSet),
    isSkillAllowed(name: string, path?: string) {
      return skillPolicy.priority(name, path === undefined ? undefined : normalizeSkillSelector(path)) > 0;
    },
    isPromptAllowed(name: string) {
      return isAllowed(name, promptEnabledSet, promptDisabledSet);
    },
    isMcpServerAllowed(name: string) {
      return isAllowed(name, mcpEnabledSet, mcpDisabledSet);
    },
  };
}
