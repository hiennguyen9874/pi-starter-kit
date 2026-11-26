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

test("registers sync-profile-system CLI flag", () => {
  const flags: string[] = [];

  profileExtension({
    registerFlag(name: string) {
      flags.push(name);
    },
    registerCommand() {},
    on() {},
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

  assert.equal(flags.includes("sync-profile-system"), true);
});

test("/profile switches and survives reload even when Pi retains the startup flag", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-state-"));
  mkdirSync(join(root, ".pi"));
  mkdirSync(join(root, ".pi", "profiles"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: "other" }),
  );
  writeFileSync(
    join(root, ".pi", "profiles", "backend.yaml"),
    "skillsEnable:\n  - backend-patterns\n",
  );
  writeFileSync(join(root, ".pi", "profiles", "other.yaml"), "skillsDisable: [\"*\"]\n");
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
    getFlag(name: string) {
      return name === "profile" ? "backend" : undefined;
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
  const persistedProfile = () => JSON.parse(readFileSync(join(root, ".pi", ".local", "profile-state.json"), "utf8")).name;
  assert.equal(persistedProfile(), "backend");
  await commands.profile.handler("other", ctx);
  await handlers.session_start?.({ reason: "reload" }, ctx);

  assert.equal(notifications.includes("No profiles defined in .pi/profiles/"), false);
  assert.equal(notifications.some((message) => message.includes("Unknown skill:")), false);
  assert.equal(
    notifications.includes('Profile "other" activated. Reloading to apply startup resource filtering.'),
    true,
  );
  assert.equal(reloadCalls, 1);
  assert.equal(persistedProfile(), "other");
});

test("session_start does not warn when skill commands are not discovered yet", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-state-"));
  mkdirSync(join(root, ".pi"));
  mkdirSync(join(root, ".pi", "profiles"));
  mkdirSync(join(root, ".pi", "skills", "backend-patterns"), { recursive: true });
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: "backend" }),
  );
  writeFileSync(
    join(root, ".pi", "profiles", "backend.yaml"),
    "skillsEnable:\n  - backend-patterns\n",
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
    knownPrompts: [],
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
  mkdirSync(join(root, ".pi", "profiles"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: "backend" }),
  );
  writeFileSync(
    join(root, ".pi", "profiles", "backend.yaml"),
    "skillsEnable:\n  - backend-patterns\n",
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
  mkdirSync(join(root, ".pi", "profiles"));
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: "frontend" }),
  );
  writeFileSync(
    join(root, ".pi", "profiles", "backend.yaml"),
    "skillsEnable:\n  - backend-patterns\n",
  );
  writeFileSync(
    join(root, ".pi", "profiles", "frontend.yaml"),
    "skillsEnable:\n  - frontend-design\n",
  );
  mkdirSync(join(root, ".pi", ".local"), { recursive: true });
  writeFileSync(join(root, ".pi", ".local", "profile-state.json"), JSON.stringify({ name: "backend" }));
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

test("process profile wins over flag, ignores profiles that no longer exist", () => {
  assert.deepEqual(
    resolveSelectedProfile({
      processProfile: "backend",
      flagProfile: "frontend",
      persistedProfile: "frontend",
      availableProfiles: ["backend", "frontend"],
    }),
    { name: "backend", source: "process" },
  );
  assert.deepEqual(
    resolveSelectedProfile({ processProfile: "deleted", flagProfile: "frontend", availableProfiles: ["frontend"] }),
    { name: "frontend", source: "flag" },
  );
});

test("two Pi processes sharing .pi keep their own --profile across /new and /reload", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-two-terminals-"));
  mkdirSync(join(root, ".pi", "profiles"), { recursive: true });
  writeFileSync(join(root, ".pi", "profiles.json"), JSON.stringify({ defaultProfile: "a" }));
  writeFileSync(join(root, ".pi", "profiles", "a.yaml"), "skillsDisable: [\"*\"]\n");
  writeFileSync(join(root, ".pi", "profiles", "b.yaml"), "skillsDisable: [\"*\"]\n");
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: {} }));
  const persisted = () => JSON.parse(readFileSync(join(root, ".pi", ".local", "profile-state.json"), "utf8")).name;

  // Each Pi process has its own globalThis; emulate that by swapping the store.
  const key = Symbol.for("pi-starter-kit.profile.process-selection");
  const store = globalThis as any;
  const terminals = { a: new Map(), b: new Map() };

  function start(flag: "a" | "b") {
    const handlers: Record<string, Function> = {};
    const commands: Record<string, any> = {};
    let status: string | undefined;
    const pi = {
      registerFlag() {},
      registerCommand(name: string, options: any) {
        commands[name] = options;
      },
      on(event: string, handler: Function) {
        handlers[event] = handler;
      },
      appendEntry() {},
      getFlag: (name: string) => (name === "profile" ? flag : undefined),
      getCommands: () => [],
      getAllTools: () => [],
    } as any;
    const ctx = {
      cwd: root,
      sessionManager: { getEntries: () => [] },
      async reload() {},
      ui: {
        notify() {},
        setStatus(_key: string, text?: string) {
          status = text;
        },
        theme: { fg: (_color: string, text: string) => text },
      },
    } as any;
    // Pi re-imports the extension on every session_start except the first.
    const emit = async (event: string, payload: any) => {
      store[key] = terminals[flag];
      if (event === "session_start" && payload.reason !== "startup") {
        profileExtension(pi);
      }
      await handlers[event]?.(payload, ctx);
    };
    profileExtension(pi);
    return { emit, commands, ctx, status: () => status };
  }

  const a = start("a");
  const b = start("b");
  await a.emit("session_start", { reason: "startup" });
  await b.emit("session_start", { reason: "startup" });
  assert.equal(persisted(), "b");

  await a.emit("turn_start", {});
  assert.equal(persisted(), "a");

  for (const reason of ["new", "reload"]) {
    await b.emit("session_start", { reason });
    assert.equal(b.status(), "profile:b");
    await a.emit("session_start", { reason });
    assert.equal(a.status(), "profile:a");
  }

  // /profile still wins over the retained startup flag after reload.
  store[key] = terminals.b;
  await b.commands.profile.handler("a", b.ctx);
  await b.emit("session_start", { reason: "reload" });
  assert.equal(b.status(), "profile:a");
  delete store[key];
});
