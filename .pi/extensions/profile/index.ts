import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@mariozechner/pi-tui";

import {
  hasBehavioralGuidelinesInsertionMarker,
  injectBehavioralGuidelines,
} from "./behavioral-guidelines.ts";
import { loadProfilesConfig } from "./profile-config.ts";
import { getKnownSkillNames, summarizeProfile } from "./profile-discovery.ts";
import { createProfilePolicy, PROFILE_WILDCARD, type ProfileDefinition, type ProfilePolicy } from "./profile-policy.ts";
import {
  loadProfileKnownMcpServerNames,
  loadProfileKnownSkillNames,
  readPersistedProfileName,
  syncBaseSettings,
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

function formatList(values: string[] | undefined, emptyText = "none"): string {
  return values?.length ? values.join(", ") : emptyText;
}

export function buildProfileExplanation(input: {
  activeProfileName?: string;
  activeProfile?: ProfileDefinition;
  knownSkills: string[];
  knownMcpServers: string[];
  resourcesRequireReload: boolean;
}): string {
  if (!input.activeProfileName || !input.activeProfile) {
    return "No active profile.";
  }

  const warnings = validateProfileReferences(input.activeProfile, input.knownSkills, input.knownMcpServers);
  const lines = [
    `Active profile: ${input.activeProfileName}`,
    `Skills enabled: ${formatList(input.activeProfile.skillsEnable, "all unless disabled")}`,
    `Skills disabled: ${formatList(input.activeProfile.skillsDisable)}`,
    `MCP servers enabled: ${formatList(input.activeProfile.mcpServersEnable, "all unless disabled")}`,
    `MCP servers disabled: ${formatList(input.activeProfile.mcpServersDisable)}`,
    `Behavioral guidelines: ${input.activeProfile.extensionState?.behavioralGuidelines?.enabled === false ? "off" : "on"}`,
    "Rule: disable wins; non-empty enable list allow-lists; * means all.",
  ];

  if (input.resourcesRequireReload) {
    lines.push("Reload needed: startup resource filters changed. Run /reload.");
  }

  if (warnings.length > 0) {
    lines.push(`Warnings: ${warnings.join("; ")}`);
  }

  return lines.join("\n");
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
    warnedAboutMissingGuidelinesMarker: boolean;
    resourcesRequireReload: boolean;
  } = {
    profiles: {},
    knownSkills: [],
    knownMcpServers: [],
    warnedAboutDirectMcpTools: false,
    warnedAboutMissingGuidelinesMarker: false,
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
        if (input === "explain") {
          ctx.ui.notify(
            buildProfileExplanation({
              activeProfileName: state.activeProfileName,
              activeProfile: state.activeProfile,
              knownSkills: state.knownSkills,
              knownMcpServers: state.knownMcpServers,
              resourcesRequireReload: state.resourcesRequireReload,
            }),
            "info",
          );
          return;
        }

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

      const activeName = state.activeProfileName;
      const items: SelectItem[] = profileNames.map((name) => {
        const isActive = name === activeName;
        const label = isActive ? `${name} (active)` : name;
        return {
          value: name,
          label,
          description: summarizeProfile(name, state.profiles[name]),
        };
      });

      const selected = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        container.addChild(new Text(theme.fg("accent", theme.bold("Select Profile")), 1, 0));

        const selectList = new SelectList(items, Math.min(items.length, 10), {
          selectedPrefix: (t) => theme.fg("accent", t),
          selectedText: (t) => theme.fg("accent", t),
          description: (t) => theme.fg("muted", t),
          scrollInfo: (t) => theme.fg("dim", t),
          noMatch: (t) => theme.fg("warning", t),
        });

        let filter = "";

        selectList.onSelect = (item) => done(item.value);
        selectList.onCancel = () => done(null);

        container.addChild(selectList);

        container.addChild(new Text(theme.fg("dim", "type to filter · ↑↓ navigate · enter select · esc cancel"), 1, 0));

        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        return {
          render: (w) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data) => {
            // Printable characters: accumulate filter
            if (data.length === 1 && data.match(/[a-zA-Z0-9_-]/)) {
              filter += data;
              selectList.setFilter(filter);
              tui.requestRender();
              return;
            }
            // Backspace: remove last char from filter
            if (data === "\x7f" || data === "\b") {
              filter = filter.slice(0, -1);
              selectList.setFilter(filter);
              tui.requestRender();
              return;
            }
            // Escape filter on Escape if filter is active
            if (data === "\u001b" && filter) {
              filter = "";
              selectList.setFilter("");
              tui.requestRender();
              return;
            }
            selectList.handleInput(data);
            tui.requestRender();
          },
        };
      });

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
    syncBaseSettings(ctx.cwd);

    const loaded = loadProfilesConfig(ctx.cwd);
    state.profiles = loaded.config?.profiles ?? {};
    state.knownSkills = [...new Set([...loadProfileKnownSkillNames(ctx.cwd), ...getKnownSkillNames(pi.getCommands())])].sort(
      (a, b) => a.localeCompare(b),
    );
    state.knownMcpServers = loadProfileKnownMcpServerNames(ctx.cwd);
    state.warnedAboutDirectMcpTools = false;
    state.warnedAboutMissingGuidelinesMarker = false;
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

  pi.on("before_agent_start", async (event, ctx) => {
    if (!state.activeProfile) {
      return;
    }

    const behavioralGuidelines = state.activeProfile.extensionState?.behavioralGuidelines;
    if (behavioralGuidelines?.enabled === false) {
      return;
    }

    if (!hasBehavioralGuidelinesInsertionMarker(event.systemPrompt) && !state.warnedAboutMissingGuidelinesMarker) {
      state.warnedAboutMissingGuidelinesMarker = true;
      if (ctx.hasUI) {
        ctx.ui.notify("Behavioral guidelines: insertion marker missing; appending at end", "warning");
      }
    }

    return {
      systemPrompt: injectBehavioralGuidelines(event.systemPrompt, behavioralGuidelines),
    };
  });
}
