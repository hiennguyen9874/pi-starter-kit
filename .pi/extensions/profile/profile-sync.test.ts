import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  loadProfileKnownMcpServerNames,
  loadProfileKnownSkillNames,
  readPersistedProfileName,
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

test("syncProfileResources writes skill exclusions for project skills outside the allow-list", () => {
  const root = createRoot();
  writeSkill(root, "backend-patterns");
  writeSkill(root, "frontend-design");
  writeSkill(root, "ui-styling");
  writeFileSync(join(root, ".pi", "settings.json"), JSON.stringify({ theme: "dark", skills: ["+skills/custom"] }, null, 2));

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

test("syncProfileResources filters mcp.json from stored baseline when switching profiles", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "mcp.json"),
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

test("wildcard profile entries apply to skill and MCP resource syncing", () => {
  const root = createRoot();
  writeSkill(root, "backend-patterns");
  writeSkill(root, "frontend-design");
  writeFileSync(
    join(root, ".pi", "mcp.json"),
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
