import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  loadProfileKnownMcpServerNames,
  loadProfileKnownPromptNames,
  loadProfileKnownSkillNames,
  readPersistedProfileName,
  syncBaseSystemResources,
  syncProfileResources,
} from "./profile-sync.ts";

function createRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-sync-"));
  mkdirSync(join(root, ".pi"));
  mkdirSync(join(root, ".pi", "skills"));
  return root;
}

function writeSkill(root: string, name: string): void {
  const skillDir = join(root, ".pi", "skills", name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    join(skillDir, "SKILL.md"),
    [
      "---",
      `name: ${name}`,
      `description: ${name}`,
      "---",
      "",
      `# ${name}`,
    ].join("\n"),
  );
}

function writePrompt(root: string, name: string): void {
  const promptsDir = join(root, ".pi", "prompts");
  mkdirSync(promptsDir, { recursive: true });
  writeFileSync(join(promptsDir, `${name}.md`), `---\ndescription: ${name}\n---\n\n# ${name}\n`);
}

test("syncProfileResources writes skill exclusions for project skills outside the allow-list", () => {
  const root = createRoot();
  writeSkill(root, "backend-patterns");
  writeSkill(root, "frontend-design");
  writeSkill(root, "ui-styling");
  writeFileSync(join(root, ".pi", "settings.base.json"), JSON.stringify({ theme: "dark", skills: ["+skills/custom"] }, null, 2));

  const result = syncProfileResources(root, "backend", {
    skillsEnable: ["backend-patterns"],
    skillsDisable: ["frontend-design"],
  });

  const settings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));

  assert.equal(result.settingsChanged, true);
  assert.equal(readPersistedProfileName(root), "backend");
  assert.deepEqual(settings.skills, ["+skills/custom", "-skills/frontend-design", "-skills/ui-styling"]);
  assert.equal(settings.theme, "dark");
  assert.deepEqual(loadProfileKnownSkillNames(root), ["backend-patterns", "frontend-design", "ui-styling"]);
});

test("syncProfileResources writes prompt exclusions for project prompts outside the allow-list", () => {
  const root = createRoot();
  writePrompt(root, "api-review");
  writePrompt(root, "debug-issue");
  writePrompt(root, "frontend-ui-audit");
  writeFileSync(join(root, ".pi", "settings.base.json"), JSON.stringify({ theme: "dark", prompts: ["+prompts/custom.md"] }, null, 2));

  syncProfileResources(root, "review", {
    promptsEnable: ["api-review"],
    promptsDisable: ["debug-issue"],
  });

  const settings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));

  assert.deepEqual(settings.prompts, ["+prompts/custom.md", "-prompts/debug-issue.md", "-prompts/frontend-ui-audit.md"]);
  assert.deepEqual(loadProfileKnownPromptNames(root), ["api-review", "debug-issue", "frontend-ui-audit"]);
});

test("syncProfileResources overlays package and extension entries from the active profile", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "settings.base.json"),
    JSON.stringify(
      {
        packages: [
          "npm:pi-powerline-footer",
          "npm:pi-cache-graph",
          "git:github.com/hiennguyen9874/pi-ask-user",
          "git:github.com/MasuRii/pi-rtk-optimizer",
          "-npm:pi-web-access",
        ],
        extensions: [
          "./extensions/command-history/index.ts",
          "./extensions/profile/index.ts",
          "./extensions/dirty-repo-guard.ts",
        ],
      },
      null,
      2,
    ),
  );

  syncProfileResources(root, "research", {
    packagesEnable: ["npm:pi-web-access"],
    packagesDisable: ["npm:pi-cache-graph", "npm:pi-powerline-footer"],
    extensionsEnable: ["git:github.com/hiennguyen9874/pi-goal"],
    extensionsDisable: ["./extensions/dirty-repo-guard.ts", "./extensions/profile/index.ts"],
  });

  const firstSettings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));
  assert.deepEqual(firstSettings.packages, [
    "-npm:pi-powerline-footer",
    "-npm:pi-cache-graph",
    "git:github.com/hiennguyen9874/pi-ask-user",
    "git:github.com/MasuRii/pi-rtk-optimizer",
    "npm:pi-web-access",
  ]);
  assert.deepEqual(firstSettings.extensions, [
    "./extensions/command-history/index.ts",
    "-./extensions/profile/index.ts",
    "-./extensions/dirty-repo-guard.ts",
    "git:github.com/hiennguyen9874/pi-goal",
  ]);

  syncProfileResources(root, "base", {
    packagesDisable: ["npm:pi-web-access"],
  });

  const secondSettings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));
  assert.deepEqual(secondSettings.packages, [
    "npm:pi-powerline-footer",
    "npm:pi-cache-graph",
    "git:github.com/hiennguyen9874/pi-ask-user",
    "git:github.com/MasuRii/pi-rtk-optimizer",
    "-npm:pi-web-access",
  ]);
  assert.deepEqual(secondSettings.extensions, [
    "./extensions/command-history/index.ts",
    "./extensions/profile/index.ts",
    "./extensions/dirty-repo-guard.ts",
  ]);
});

test("syncProfileResources filters mcp.json from baseline when switching profiles", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "mcp.base.json"),
    JSON.stringify(
      {
        mcpServers: {
          "chrome-devtools": { command: "npx" },
          memory: { command: "npx" },
        },
      },
      null,
      2,
    ),
  );

  syncProfileResources(root, "frontend", {
    mcpServersDisable: ["chrome-devtools"],
  });
  let mcp = JSON.parse(readFileSync(join(root, ".pi", "mcp.json"), "utf8"));
  assert.deepEqual(Object.keys(mcp.mcpServers), ["memory"]);
  assert.deepEqual(loadProfileKnownMcpServerNames(root), ["chrome-devtools", "memory"]);

  syncProfileResources(root, "backend", {
    mcpServersEnable: ["chrome-devtools"],
  });
  mcp = JSON.parse(readFileSync(join(root, ".pi", "mcp.json"), "utf8"));
  assert.deepEqual(Object.keys(mcp.mcpServers), ["chrome-devtools"]);
});

test("syncBaseSystemResources syncs settings/mcp base files and creates .local", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "settings.base.json"), JSON.stringify({ theme: "dark" }, null, 2));
  writeFileSync(
    join(root, ".pi", "mcp.base.json"),
    JSON.stringify(
      {
        mcpServers: {
          memory: { command: "npx" },
        },
      },
      null,
      2,
    ),
  );

  const result = syncBaseSystemResources(root);

  assert.equal(result.settingsChanged, true);
  assert.equal(result.mcpChanged, true);
  assert.equal(JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8")).theme, "dark");
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, ".pi", "mcp.json"), "utf8")).mcpServers), ["memory"]);
});

test("wildcard profile entries apply to skill and MCP resource syncing", () => {
  const root = createRoot();
  writeSkill(root, "backend-patterns");
  writeSkill(root, "frontend-design");
  writeFileSync(
    join(root, ".pi", "mcp.base.json"),
    JSON.stringify(
      {
        mcpServers: {
          "chrome-devtools": { command: "npx" },
          memory: { command: "npx" },
        },
      },
      null,
      2,
    ),
  );

  syncProfileResources(root, "frontend", {
    skillsEnable: ["*"],
    skillsDisable: ["frontend-design"],
    mcpServersEnable: ["*"],
    mcpServersDisable: ["chrome-devtools"],
  });

  const settings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));
  let mcp = JSON.parse(readFileSync(join(root, ".pi", "mcp.json"), "utf8"));

  assert.deepEqual(settings.skills, ["-skills/frontend-design"]);
  assert.deepEqual(Object.keys(mcp.mcpServers), ["memory"]);

  syncProfileResources(root, "locked", {
    skillsDisable: ["*"],
    mcpServersDisable: ["*"],
  });

  mcp = JSON.parse(readFileSync(join(root, ".pi", "mcp.json"), "utf8"));
  const lockedSettings = JSON.parse(readFileSync(join(root, ".pi", "settings.json"), "utf8"));

  assert.deepEqual(lockedSettings.skills, ["-skills/backend-patterns", "-skills/frontend-design"]);
  assert.deepEqual(Object.keys(mcp.mcpServers), []);
});
