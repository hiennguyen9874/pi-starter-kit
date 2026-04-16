import test from "node:test";
import assert from "node:assert/strict";

import { buildProfilePrompt, validateProfileReferences } from "./index.ts";

test("prompt text includes active profile name and restriction lists", () => {
  const prompt = buildProfilePrompt("backend", {
    skillsEnable: ["backend-patterns"],
    skillsDisable: ["frontend-design"],
    mcpServersEnable: ["memory"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.match(prompt, /backend/);
  assert.match(prompt, /Allowed skills: backend-patterns/);
  assert.match(prompt, /Disallowed skills: frontend-design/);
  assert.match(prompt, /Allowed MCP servers: memory/);
  assert.match(prompt, /Disallowed MCP servers: chrome-devtools/);
});

test("compact prompt omits individual skill and MCP names", () => {
  const prompt = buildProfilePrompt(
    "backend",
    {
      skillsEnable: ["backend-patterns"],
      skillsDisable: ["frontend-design"],
      mcpServersEnable: ["memory"],
      mcpServersDisable: ["chrome-devtools"],
    },
    "compact",
  );

  assert.match(prompt, /Active profile: backend/);
  assert.doesNotMatch(prompt, /frontend-design/);
  assert.doesNotMatch(prompt, /chrome-devtools/);
});

test("unknown skills produce warnings", () => {
  const warnings = validateProfileReferences(
    { skillsEnable: ["missing-skill"] },
    ["backend-patterns"],
    ["chrome-devtools"],
  );

  assert.deepEqual(warnings, ["Unknown skill: missing-skill"]);
});

test("skill warnings are skipped until skills have been discovered", () => {
  const warnings = validateProfileReferences(
    {
      skillsEnable: ["backend-patterns"],
      mcpServersDisable: ["missing-server"],
    },
    [],
    ["chrome-devtools"],
  );

  assert.deepEqual(warnings, ["Unknown MCP server: missing-server"]);
});

test("unknown MCP servers produce warnings", () => {
  const warnings = validateProfileReferences(
    { mcpServersDisable: ["missing-server"] },
    ["backend-patterns"],
    ["chrome-devtools"],
  );

  assert.deepEqual(warnings, ["Unknown MCP server: missing-server"]);
});

test("conflicts are not validation errors because disable-wins is intentional", () => {
  const warnings = validateProfileReferences(
    {
      skillsEnable: ["backend-patterns"],
      skillsDisable: ["backend-patterns"],
      mcpServersEnable: ["chrome-devtools"],
      mcpServersDisable: ["chrome-devtools"],
    },
    ["backend-patterns"],
    ["chrome-devtools"],
  );

  assert.deepEqual(warnings, []);
});

test("wildcard references are treated as built-in values", () => {
  const warnings = validateProfileReferences(
    {
      skillsEnable: ["*"],
      skillsDisable: ["missing-skill"],
      mcpServersEnable: ["*"],
      mcpServersDisable: ["missing-server"],
    },
    ["backend-patterns"],
    ["chrome-devtools"],
  );

  assert.deepEqual(warnings, ["Unknown skill: missing-skill", "Unknown MCP server: missing-server"]);
});
