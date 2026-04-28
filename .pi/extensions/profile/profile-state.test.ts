import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import profileExtension, { buildProfileExplanation, resolveSelectedProfile } from "./index.ts";

test("CLI flag profile wins over persisted, restored, and default profile", () => {
  const result = resolveSelectedProfile({
    flagProfile: "frontend",
    persistedProfile: "backend",
    restoredProfile: "backend",
    defaultProfile: "backend",
    availableProfiles: ["backend", "frontend"],
  });

  assert.deepEqual(result, { name: "frontend", source: "flag" });
});

test("persisted profile wins over restored and default profile", () => {
  const result = resolveSelectedProfile({
    persistedProfile: "frontend",
    restoredProfile: "backend",
    defaultProfile: "backend",
    availableProfiles: ["backend", "frontend"],
  });

  assert.deepEqual(result, { name: "frontend", source: "persisted" });
});

test("missing selected profile returns recoverable error", () => {
  const result = resolveSelectedProfile({
    flagProfile: "missing",
    restoredProfile: "frontend",
    defaultProfile: "backend",
    availableProfiles: ["backend", "frontend"],
  });

  assert.equal(result.name, undefined);
  assert.equal(result.source, "flag");
  assert.match(result.error ?? "", /missing/i);
});

test("session_start loads profiles using getCommands API and /profile can activate one", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-state-"));
  mkdirSync(join(root, ".pi"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({
      defaultProfile: "backend",
      profiles: {
        backend: {
          skillsEnable: ["backend-patterns"],
        },
      },
    }),
  );
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: {} }));

  const handlers: Record<string, Function> = {};
  const commands: Record<string, { handler: (args: string, ctx: any) => Promise<void> | void }> = {};
  const notifications: string[] = [];
  let reloadCalls = 0;

  profileExtension({
    registerFlag() {},
    registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> | void }) {
      commands[name] = options;
    },
    on(event: string, handler: Function) {
      handlers[event] = handler;
    },
    appendEntry() {},
    getFlag() {
      return undefined;
    },
    getCommands() {
      return [{ name: "backend-patterns", source: "skill" }];
    },
    getAllTools() {
      return [];
    },
  } as any);

  const ctx = {
    cwd: root,
    sessionManager: {
      getEntries() {
        return [];
      },
    },
    async reload() {
      reloadCalls += 1;
    },
    ui: {
      notify(message: string) {
        notifications.push(message);
      },
      setStatus() {},
      theme: {
        fg(_color: string, text: string) {
          return text;
        },
      },
      async select() {
        return undefined;
      },
    },
  } as any;

  await handlers.session_start?.({ reason: "startup" }, ctx);
  await commands.profile.handler("backend", ctx);

  assert.equal(notifications.includes("No profiles defined in .pi/profiles.json"), false);
  assert.equal(notifications.some((message) => message.includes("Unknown skill:")), false);
  assert.equal(
    notifications.includes('Profile "backend" activated. Reloading to apply startup resource filtering.'),
    true,
  );
  assert.equal(reloadCalls, 1);
  assert.equal(JSON.parse(readFileSync(join(root, ".pi", "profile-state.json"), "utf8")).name, "backend");
});

test("session_start does not warn when skill commands are not discovered yet", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-state-"));
  mkdirSync(join(root, ".pi"));
  mkdirSync(join(root, ".pi", "skills", "backend-patterns"), { recursive: true });
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({
      defaultProfile: "backend",
      profiles: {
        backend: {
          skillsEnable: ["backend-patterns"],
        },
      },
    }),
  );
  writeFileSync(
    join(root, ".pi", "skills", "backend-patterns", "SKILL.md"),
    [
      "---",
      "name: backend-patterns",
      "description: Backend patterns",
      "---",
      "",
      "# Backend Patterns",
    ].join("\n"),
  );
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: {} }));

  const handlers: Record<string, Function> = {};
  const notifications: string[] = [];

  profileExtension({
    registerFlag() {},
    registerCommand() {},
    on(event: string, handler: Function) {
      handlers[event] = handler;
    },
    appendEntry() {},
    getFlag() {
      return undefined;
    },
    getCommands() {
      return [];
    },
    getAllTools() {
      return [];
    },
  } as any);

  const ctx = {
    cwd: root,
    sessionManager: {
      getEntries() {
        return [];
      },
    },
    ui: {
      notify(message: string) {
        notifications.push(message);
      },
      setStatus() {},
      theme: {
        fg(_color: string, text: string) {
          return text;
        },
      },
    },
  } as any;

  await handlers.session_start?.({ reason: "startup" }, ctx);

  assert.equal(notifications.some((message) => message.includes("Unknown skill:")), false);
});

test("buildProfileExplanation describes active profile restrictions", () => {
  const explanation = buildProfileExplanation({
    activeProfileName: "frontend",
    activeProfile: {
      skillsEnable: ["frontend-design"],
      mcpServersEnable: ["chrome-devtools"],
      mcpServersDisable: ["memory"],
    },
    knownSkills: ["frontend-design"],
    knownMcpServers: ["chrome-devtools", "memory"],
    resourcesRequireReload: true,
  });

  assert.match(explanation, /Active profile: frontend/);
  assert.match(explanation, /Skills enabled: frontend-design/);
  assert.match(explanation, /MCP servers enabled: chrome-devtools/);
  assert.match(explanation, /MCP servers disabled: memory/);
  assert.match(explanation, /Reload needed/);
});

test("/profile explain reports current active profile without switching", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-explain-"));
  mkdirSync(join(root, ".pi"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({
      defaultProfile: "backend",
      profiles: {
        backend: { skillsEnable: ["backend-patterns"] },
      },
    }),
  );
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: {} }));

  const handlers: Record<string, Function> = {};
  const commands: Record<string, { handler: (args: string, ctx: any) => Promise<void> | void }> = {};
  const notifications: string[] = [];
  let reloadCalls = 0;

  profileExtension({
    registerFlag() {},
    registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> | void }) {
      commands[name] = options;
    },
    on(event: string, handler: Function) {
      handlers[event] = handler;
    },
    appendEntry() {},
    getFlag() {
      return undefined;
    },
    getCommands() {
      return [{ name: "backend-patterns", source: "skill" }];
    },
    getAllTools() {
      return [];
    },
  } as any);

  const ctx = {
    cwd: root,
    sessionManager: {
      getEntries() {
        return [];
      },
    },
    async reload() {
      reloadCalls += 1;
    },
    ui: {
      notify(message: string) {
        notifications.push(message);
      },
      setStatus() {},
      theme: {
        fg(_color: string, text: string) {
          return text;
        },
      },
    },
  } as any;

  await handlers.session_start?.({ reason: "startup" }, ctx);
  await commands.profile.handler("explain", ctx);

  assert.equal(reloadCalls, 0);
  assert.equal(notifications.some((message) => message.includes("Active profile: backend")), true);
  assert.equal(notifications.some((message) => message.includes("Skills enabled: backend-patterns")), true);
});

test("session_start prefers persisted profile state from disk", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-state-"));
  mkdirSync(join(root, ".pi"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({
      defaultProfile: "frontend",
      profiles: {
        backend: { skillsEnable: ["backend-patterns"] },
        frontend: { skillsEnable: ["frontend-design"] },
      },
    }),
  );
  writeFileSync(join(root, ".pi", "profile-state.json"), JSON.stringify({ name: "backend" }));
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: {} }));

  const handlers: Record<string, Function> = {};
  const statuses: Array<string | undefined> = [];

  profileExtension({
    registerFlag() {},
    registerCommand() {},
    on(event: string, handler: Function) {
      handlers[event] = handler;
    },
    appendEntry() {},
    getFlag() {
      return undefined;
    },
    getCommands() {
      return [{ name: "backend-patterns", source: "skill" }];
    },
    getAllTools() {
      return [];
    },
  } as any);

  const ctx = {
    cwd: root,
    sessionManager: {
      getEntries() {
        return [];
      },
    },
    ui: {
      notify() {},
      setStatus(_key: string, value?: string) {
        statuses.push(value);
      },
      theme: {
        fg(_color: string, text: string) {
          return text;
        },
      },
    },
  } as any;

  await handlers.session_start?.({ reason: "startup" }, ctx);

  assert.equal(statuses.at(-1), "profile:backend");
});
