import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  getKnownSkillNames,
  loadKnownMcpServerNames,
  summarizeProfile,
} from "./profile-discovery.ts";

function createRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-discovery-"));
  mkdirSync(join(root, ".pi"));
  return root;
}

test('extracts skill names from Pi commands where source === "skill"', () => {
  const skills = getKnownSkillNames([
    { name: "backend-patterns", source: "skill" },
    { name: "frontend-design", source: "skill" },
    { name: "profile", source: "extension" },
    { name: "unknown" },
  ]);

  assert.deepEqual(skills, ["backend-patterns", "frontend-design"]);
});

test("extracts MCP server names from .pi/mcp.json", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "mcp.json"),
    JSON.stringify({
      mcpServers: {
        "chrome-devtools": { command: "npx" },
        memory: { command: "npx" },
      },
    }),
  );

  assert.deepEqual(loadKnownMcpServerNames(root), ["chrome-devtools", "memory"]);
});

test("ignores malformed MCP shapes safely", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "mcp.json"), JSON.stringify({ mcpServers: [] }));

  assert.deepEqual(loadKnownMcpServerNames(root), []);
});

test("builds a short human-readable profile summary string", () => {
  const summary = summarizeProfile("backend", {
    skillsEnable: ["backend-patterns", "huma-go-api"],
    skillsDisable: ["frontend-design"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.match(summary, /backend/);
  assert.match(summary, /skills \+backend-patterns, huma-go-api/);
  assert.match(summary, /skills -frontend-design/);
  assert.match(summary, /mcp -chrome-devtools/);
});
