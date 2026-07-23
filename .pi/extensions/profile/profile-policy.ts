import type { BehavioralGuidelinesConfig } from "./behavioral-guidelines.ts";

export const PROFILE_WILDCARD = "*";

export interface ProfileExtensionState {
  behavioralGuidelines?: BehavioralGuidelinesConfig;
}

export interface ProfileExtra {
  override?: Record<string, unknown>;
}

export interface ProfileDefinition {
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
  isSkillAllowed(name: string): boolean;
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

export function createProfilePolicy(profile: ProfileDefinition = {}): ProfilePolicy {
  const skillEnabledSet = new Set(profile.skillsEnable ?? []);
  const skillDisabledSet = new Set(profile.skillsDisable ?? []);
  const mcpEnabledSet = new Set(profile.mcpServersEnable ?? []);
  const mcpDisabledSet = new Set(profile.mcpServersDisable ?? []);
  const promptEnabledSet = new Set(profile.promptsEnable ?? []);
  const promptDisabledSet = new Set(profile.promptsDisable ?? []);

  return {
    hasSkillAllowList: hasRestrictiveAllowList(skillEnabledSet),
    hasPromptAllowList: hasRestrictiveAllowList(promptEnabledSet),
    hasMcpAllowList: hasRestrictiveAllowList(mcpEnabledSet),
    isSkillAllowed(name: string) {
      return isAllowed(name, skillEnabledSet, skillDisabledSet);
    },
    isPromptAllowed(name: string) {
      return isAllowed(name, promptEnabledSet, promptDisabledSet);
    },
    isMcpServerAllowed(name: string) {
      return isAllowed(name, mcpEnabledSet, mcpDisabledSet);
    },
  };
}
