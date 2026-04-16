import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

import { loadProfilesConfig } from "./profile-config.ts";
import { getKnownSkillNames, summarizeProfile } from "./profile-discovery.ts";
import { createProfilePolicy, PROFILE_WILDCARD, type ProfileDefinition, type ProfilePolicy } from "./profile-policy.ts";
import {
  loadProfileKnownMcpServerNames,
  loadProfileKnownSkillNames,
  readPersistedProfileName,
  syncProfileResources,
  writePersistedProfileName,
} from "./profile-sync.ts";

export interface ResolvedProfileSelection {
  name?: string;
  source?: "flag" | "persisted" | "session" | "default";
  error?: string;
}

export interface SkillCommandEvaluation {
  isSkillCommand: boolean;
  skillName?: string;
  allowed?: boolean;
}

export interface McpRequestEvaluation {
  blocked: boolean;
  server?: string;
}

export function resolveSelectedProfile(input: {
  flagProfile?: string;
  persistedProfile?: string;
  restoredProfile?: string;
  defaultProfile?: string;
  availableProfiles: string[];
}): ResolvedProfileSelection {
  const availableProfiles = new Set(input.availableProfiles);
  const candidates: Array<{ name?: string; source: "flag" | "persisted" | "session" | "default" }> = [
    { name: input.flagProfile, source: "flag" },
    { name: input.persistedProfile, source: "persisted" },
    { name: input.restoredProfile, source: "session" },
    { name: input.defaultProfile, source: "default" },
  ];

  for (const candidate of candidates) {
    if (!candidate.name) {
      continue;
    }

    if (!availableProfiles.has(candidate.name)) {
      return {
        source: candidate.source,
        error: `Profile "${candidate.name}" is not defined`,
      };
    }

    return candidate;
  }

  return {};
}

export function evaluateSkillCommand(text: string, policy?: ProfilePolicy): SkillCommandEvaluation {
  const match = text.match(/^\s*\/skill:([^\s]+)/);
  if (!match) {
    return { isSkillCommand: false };
  }

  const skillName = match[1];
  return {
    isSkillCommand: true,
    skillName,
    allowed: policy ? policy.isSkillAllowed(skillName) : true,
  };
}

export function isBlockedMcpRequest(input: { connect?: unknown; server?: unknown }, policy?: ProfilePolicy): McpRequestEvaluation {
  if (!policy) {
    return { blocked: false };
  }

  if (typeof input.connect === "string" && !policy.isMcpServerAllowed(input.connect)) {
    return { blocked: true, server: input.connect };
  }

  if (typeof input.server === "string" && !policy.isMcpServerAllowed(input.server)) {
    return { blocked: true, server: input.server };
  }

  return { blocked: false };
}

export function filterMcpResultText(text: string, disallowedServers: string[]): string {
  let filtered = text;
  for (const server of disallowedServers) {
    filtered = filtered.replaceAll(server, "[blocked-server]");
  }
  return filtered;
}

export function buildProfilePrompt(
  profileName: string,
  profile: ProfileDefinition,
  mode: "detailed" | "compact" = "detailed",
): string {
  if (mode === "compact") {
    return [
      `Active profile: ${profileName}.`,
      "Profile-based startup filtering is enabled for skills and MCP servers.",
      "Use only the resources that are currently loaded in this session.",
    ].join("\n");
  }

  const lines = [`Active profile: ${profileName}. Follow these restrictions.`];

  if (profile.skillsEnable?.length) {
    lines.push(`Allowed skills: ${profile.skillsEnable.join(", ")}.`);
  }
  if (profile.skillsDisable?.length) {
    lines.push(`Disallowed skills: ${profile.skillsDisable.join(", ")}.`);
  }
  if (profile.mcpServersEnable?.length) {
    lines.push(`Allowed MCP servers: ${profile.mcpServersEnable.join(", ")}.`);
  }
  if (profile.mcpServersDisable?.length) {
    lines.push(`Disallowed MCP servers: ${profile.mcpServersDisable.join(", ")}.`);
  }

  lines.push("If a skill or MCP server is disallowed, do not attempt to use it.");
  return lines.join("\n");
}

export function validateProfileReferences(
  profile: ProfileDefinition,
  knownSkills: string[],
  knownServers: string[],
): string[] {
  const warnings: string[] = [];
  const knownSkillSet = new Set(knownSkills);
  const knownServerSet = new Set(knownServers);
  const shouldValidateSkills = knownSkillSet.size > 0;

  if (shouldValidateSkills) {
    for (const skill of [...(profile.skillsEnable ?? []), ...(profile.skillsDisable ?? [])]) {
      if (skill !== PROFILE_WILDCARD && !knownSkillSet.has(skill)) {
        warnings.push(`Unknown skill: ${skill}`);
      }
    }
  }

  for (const server of [...(profile.mcpServersEnable ?? []), ...(profile.mcpServersDisable ?? [])]) {
    if (server !== PROFILE_WILDCARD && !knownServerSet.has(server)) {
      warnings.push(`Unknown MCP server: ${server}`);
    }
  }

  return [...new Set(warnings)];
}

function getDisallowedServers(profile?: ProfileDefinition): string[] {
  return (profile?.mcpServersDisable ?? []).filter((server) => server !== PROFILE_WILDCARD);
}

function getDirectMcpToolNames(toolNames: string[], knownServers: string[]): string[] {
  const prefixes = knownServers.flatMap((serverName) => {
    const normalized = serverName.replace(/-/g, "_");
    const shortened = serverName.replace(/-?mcp$/i, "").replace(/-/g, "_") || "mcp";
    return [`${normalized}_`, `${shortened}_`];
  });

  return toolNames.filter((toolName) => prefixes.some((prefix) => toolName.startsWith(prefix)));
}

function findRestoredProfileName(ctx: ExtensionContext): string | undefined {
  const entries = ctx.sessionManager.getEntries();
  const profileEntry = entries
    .filter((entry: { type: string; customType?: string }) => entry.type === "custom" && entry.customType === "profile-state")
    .pop() as { data?: { name?: string } } | undefined;

  return profileEntry?.data?.name;
}

function updateStatus(ctx: ExtensionContext, profileName?: string): void {
  if (!profileName) {
    ctx.ui.setStatus("profile", undefined);
    return;
  }

  ctx.ui.setStatus("profile", ctx.ui.theme.fg("accent", `profile:${profileName}`));
}

function notifyValidationWarnings(
  ctx: ExtensionContext,
  profileName: string,
  profile: ProfileDefinition,
  knownSkills: string[],
  knownServers: string[],
): void {
  const warnings = validateProfileReferences(profile, knownSkills, knownServers);
  if (warnings.length > 0) {
    ctx.ui.notify(`Profile "${profileName}" warnings:\n${warnings.join("\n")}`, "warning");
  }
}

export default function profileExtension(pi: ExtensionAPI): void {
  const state: {
    profiles: Record<string, ProfileDefinition>;
    knownSkills: string[];
    knownMcpServers: string[];
    activeProfileName?: string;
    activeProfile?: ProfileDefinition;
    activePolicy?: ProfilePolicy;
    warnedAboutDirectMcpTools: boolean;
    resourcesRequireReload: boolean;
  } = {
    profiles: {},
    knownSkills: [],
    knownMcpServers: [],
    warnedAboutDirectMcpTools: false,
    resourcesRequireReload: false,
  };

  function setActiveProfile(name: string | undefined, ctx: ExtensionContext): void {
    if (!name) {
      state.activeProfileName = undefined;
      state.activeProfile = undefined;
      state.activePolicy = undefined;
      updateStatus(ctx, undefined);
      return;
    }

    const profile = state.profiles[name];
    if (!profile) {
      return;
    }

    state.activeProfileName = name;
    state.activeProfile = profile;
    state.activePolicy = createProfilePolicy(profile);
    state.knownSkills = [...new Set([...state.knownSkills, ...getKnownSkillNames(pi.getCommands())])].sort((a, b) =>
      a.localeCompare(b),
    );
    updateStatus(ctx, name);
    notifyValidationWarnings(ctx, name, profile, state.knownSkills, state.knownMcpServers);
  }

  function persistProfileState(cwd?: string): void {
    if (!state.activeProfileName) {
      return;
    }

    pi.appendEntry("profile-state", { name: state.activeProfileName });

    if (cwd) {
      writePersistedProfileName(cwd, state.activeProfileName);
    }
  }

  pi.registerFlag("profile", {
    description: "Profile configuration to use",
    type: "string",
  });

  pi.registerCommand("profile", {
    description: "Switch active profile",
    handler: async (args, ctx) => {
      const input = args?.trim();
      const profileNames = Object.keys(state.profiles).sort();

      if (profileNames.length === 0) {
        ctx.ui.notify("No profiles defined in .pi/profiles.json", "warning");
        return;
      }

      if (input) {
        if (!state.profiles[input]) {
          ctx.ui.notify(`Unknown profile "${input}". Available: ${profileNames.join(", ")}`, "error");
          return;
        }

        setActiveProfile(input, ctx);
        persistProfileState(ctx.cwd);
        if (state.activeProfile) {
          syncProfileResources(ctx.cwd, input, state.activeProfile);
        }
        ctx.ui.notify(`Profile "${input}" activated. Reloading to apply startup resource filtering.`, "info");
        await ctx.reload();
        return;
      }

      const selected = await ctx.ui.select("Select profile", profileNames);
      if (!selected || !state.profiles[selected]) {
        return;
      }

      setActiveProfile(selected, ctx);
      persistProfileState(ctx.cwd);
      if (state.activeProfile) {
        syncProfileResources(ctx.cwd, selected, state.activeProfile);
      }
      ctx.ui.notify(
        `Profile "${selected}" activated: ${summarizeProfile(selected, state.profiles[selected])}. Reloading to apply startup resource filtering.`,
        "info",
      );
      await ctx.reload();
    },
  });

  pi.on("session_start", async (event, ctx) => {
    const loaded = loadProfilesConfig(ctx.cwd);
    state.profiles = loaded.config?.profiles ?? {};
    state.knownSkills = [...new Set([...loadProfileKnownSkillNames(ctx.cwd), ...getKnownSkillNames(pi.getCommands())])].sort(
      (a, b) => a.localeCompare(b),
    );
    state.knownMcpServers = loadProfileKnownMcpServerNames(ctx.cwd);
    state.warnedAboutDirectMcpTools = false;
    state.resourcesRequireReload = false;

    if (loaded.error) {
      ctx.ui.notify(`Failed to load profiles: ${loaded.error}`, "warning");
      setActiveProfile(undefined, ctx);
      return;
    }

    const directMcpTools = getDirectMcpToolNames(
      pi.getAllTools().map((tool) => tool.name),
      state.knownMcpServers,
    );
    if (directMcpTools.length > 0 && !state.warnedAboutDirectMcpTools) {
      ctx.ui.notify(
        `Profile MCP enforcement is partial for direct MCP tools: ${directMcpTools.join(", ")}`,
        "warning",
      );
      state.warnedAboutDirectMcpTools = true;
    }

    const flagValue = pi.getFlag("profile");
    const selection = resolveSelectedProfile({
      flagProfile: typeof flagValue === "string" ? flagValue : undefined,
      persistedProfile: readPersistedProfileName(ctx.cwd),
      restoredProfile: findRestoredProfileName(ctx),
      defaultProfile: loaded.config?.defaultProfile,
      availableProfiles: Object.keys(state.profiles),
    });

    if (selection.error) {
      ctx.ui.notify(selection.error, "warning");
      setActiveProfile(undefined, ctx);
      return;
    }

    setActiveProfile(selection.name, ctx);

    if (selection.name && state.activeProfile) {
      const syncResult = syncProfileResources(ctx.cwd, selection.name, state.activeProfile);
      state.resourcesRequireReload = syncResult.settingsChanged || syncResult.mcpChanged;

      if (state.resourcesRequireReload) {
        ctx.ui.notify(
          `Profile "${selection.name}" updated startup resource filters. Run /reload to apply them in this session.`,
          event.reason === "startup" ? "warning" : "info",
        );
      }
    }
  });

  pi.on("turn_start", async (_event, ctx) => {
    persistProfileState(ctx.cwd);
  });

  pi.on("input", async (event, ctx) => {
    const evaluation = evaluateSkillCommand(event.text, state.activePolicy);
    if (!evaluation.isSkillCommand || evaluation.allowed) {
      return { action: "continue" };
    }

    ctx.ui.notify(
      `Skill "${evaluation.skillName}" is disabled by profile "${state.activeProfileName ?? "unknown"}"`,
      "warning",
    );
    return { action: "handled" };
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "mcp") {
      return;
    }

    const evaluation = isBlockedMcpRequest(event.input as { connect?: unknown; server?: unknown }, state.activePolicy);
    if (!evaluation.blocked) {
      return;
    }

    return {
      block: true,
      reason: `MCP server "${evaluation.server}" is disabled by profile "${state.activeProfileName ?? "unknown"}"`,
    };
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName !== "mcp" || getDisallowedServers(state.activeProfile).length === 0) {
      return;
    }

    return {
      content: event.content.map((item: { type: string; text?: string }) => {
        if (item.type !== "text" || typeof item.text !== "string") {
          return item;
        }

        return {
          ...item,
          text: filterMcpResultText(item.text, getDisallowedServers(state.activeProfile)),
        };
      }),
    };
  });

  pi.on("before_agent_start", async (event) => {
    if (!state.activeProfileName || !state.activeProfile) {
      return;
    }

    return {
      systemPrompt: `${event.systemPrompt}\n\n${buildProfilePrompt(
        state.activeProfileName,
        state.activeProfile,
        state.resourcesRequireReload ? "detailed" : "compact",
      )}`,
    };
  });
}
