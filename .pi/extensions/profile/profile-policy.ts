export const PROFILE_WILDCARD = "*";

export interface ProfileDefinition {
  skillsEnable?: string[];
  skillsDisable?: string[];
  mcpServersEnable?: string[];
  mcpServersDisable?: string[];
}

export interface ProfilePolicy {
  hasSkillAllowList: boolean;
  hasMcpAllowList: boolean;
  isSkillAllowed(name: string): boolean;
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

  return {
    hasSkillAllowList: hasRestrictiveAllowList(skillEnabledSet),
    hasMcpAllowList: hasRestrictiveAllowList(mcpEnabledSet),
    isSkillAllowed(name: string) {
      return isAllowed(name, skillEnabledSet, skillDisabledSet);
    },
    isMcpServerAllowed(name: string) {
      return isAllowed(name, mcpEnabledSet, mcpDisabledSet);
    },
  };
}
