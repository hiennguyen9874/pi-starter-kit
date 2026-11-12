import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

// Use the project's SDK, or the globally installed Pi, without adding dependencies.
const require = createRequire(import.meta.url);
let sdkPath;
try {
  sdkPath = require.resolve("@earendil-works/pi-coding-agent");
} catch {
  const root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
  sdkPath = join(root, "@earendil-works/pi-coding-agent/dist/index.js");
}
const { DefaultResourceLoader, SettingsManager, createReadToolDefinition, createWriteToolDefinition } =
  await import(pathToFileURL(sdkPath).href);
const extensionPath = fileURLToPath(new URL("../codemode-direct-write.ts", import.meta.url));

async function fixture(t, mode = "only") {
  const cwd = await mkdtemp(join(tmpdir(), "pi-codemode-write-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const settings = { codemode: { mode, inlineBudget: 3000 } };
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir: join(cwd, "agent"),
    settingsManager: SettingsManager.inMemory(settings),
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    additionalExtensionPaths: [extensionPath],
  });
  await loader.reload();
  const loaded = loader.getExtensions();
  assert.deepEqual(loaded.errors, []);
  const registered = loaded.extensions.flatMap((extension) =>
    [...extension.tools.values()].map((entry) => entry.definition));
  assert.deepEqual(registered.map((tool) => tool.name), ["codemode"]);
  const codemode = registered[0];
  const write = createWriteToolDefinition(cwd);
  const read = createReadToolDefinition(cwd);
  const tools = [write, read, codemode];
  loaded.runtime.getSettings = () => settings;
  loaded.runtime.getAllTools = () => tools;
  const loadout = {
    declared: tools,
    callable: [write, read],
    registered: tools,
    getExposure: (name) => name === "codemode" ? "model-only" : "direct",
    getNamespace: () => undefined,
    getPromptGuidelines: (name) => tools.find((tool) => tool.name === name)?.promptGuidelines ?? [],
  };
  return { cwd, codemode, write, loadout };
}

test("only: write stays declared and callable, while other direct tools stay hidden", async (t) => {
  const { codemode, write, loadout } = await fixture(t);
  const changes = codemode.prepareLoadout(loadout);
  assert.deepEqual(changes.hiddenDeclarations, ["read"]);
  assert.match(changes.descriptions.codemode, /### `write`/);
  assert.match(changes.descriptions.codemode, /### `read`/);
  assert.match(changes.descriptions.codemode, /Use write only for new files or complete rewrites/);
  assert.equal(write.exposure ?? "direct", "direct");
  assert.equal(codemode.exposure, "model-only");
  assert.equal(codemode.defaultActive, false);
});

test("on: preserve Pi's normal descriptions and visibility", async (t) => {
  const { codemode, loadout } = await fixture(t, "on");
  const changes = codemode.prepareLoadout(loadout);
  assert.deepEqual(changes.hiddenDeclarations, []);
  assert.match(changes.descriptions.write, /tools\.write/);
  assert.match(changes.descriptions.read, /tools\.read/);
});

test("does not reactivate write when it is deliberately disabled", async (t) => {
  const { codemode, loadout } = await fixture(t);
  const changes = codemode.prepareLoadout({
    ...loadout,
    declared: loadout.declared.filter((tool) => tool.name !== "write"),
    callable: loadout.callable.filter((tool) => tool.name !== "write"),
  });
  assert.deepEqual(changes.hiddenDeclarations, ["read"]);
  assert.doesNotMatch(changes.descriptions.codemode, /### `write`/);
});

test("the original write works directly and from a real codemode script", async (t) => {
  const { cwd, codemode, write, loadout } = await fixture(t);
  await write.execute("direct", { path: "nested/direct.txt", content: "direct" }, undefined, undefined, { cwd });
  assert.equal(await readFile(join(cwd, "nested/direct.txt"), "utf8"), "direct");

  const calls = [];
  const ctx = {
    cwd,
    tools: loadout.callable,
    sessionManager: { getBranch: () => [] },
    async executeTool(name, args, options) {
      calls.push(name);
      assert.equal(name, "write");
      const result = await write.execute("nested", args, options.signal, undefined, { cwd });
      return { toolCall: { id: "script/1", name, arguments: args }, isError: false, result };
    },
  };
  const result = await codemode.execute("script", {
    code: 'text(await tools.write({path: "nested/script.txt", content: "script"}));',
  }, undefined, undefined, ctx);
  assert.match(result.content[0].text, /Script completed/, JSON.stringify(result));
  assert.equal(await readFile(join(cwd, "nested/script.txt"), "utf8"), "script");
  assert.deepEqual(calls, ["write"]);

  ctx.executeTool = async () => ({
    toolCall: { id: "blocked/1", name: "write", arguments: {} },
    isError: true,
    result: { content: [{ type: "text", text: "blocked by permission hook" }] },
  });
  const blocked = await codemode.execute("blocked", {
    code: 'text(await tools.write({path: "blocked.txt", content: "no"}));',
  }, undefined, undefined, ctx);
  assert.match(blocked.content[0].text, /Script failed/);
  assert.match(blocked.content.map((item) => item.text).join("\n"), /blocked by permission hook/);
  await assert.rejects(readFile(join(cwd, "blocked.txt")), { code: "ENOENT" });
});
