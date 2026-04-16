import test from "node:test";
import assert from "node:assert/strict";

import { createProfilePolicy } from "./profile-policy.ts";

test("disable wins over enable for skills and MCP servers", () => {
  const policy = createProfilePolicy({
    skillsEnable: ["brainstorming"],
    skillsDisable: ["brainstorming"],
    mcpServersEnable: ["chrome-devtools"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.equal(policy.isSkillAllowed("brainstorming"), false);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});

test('empty enable list means "allow unless disabled"', () => {
  const policy = createProfilePolicy({
    skillsDisable: ["frontend-design"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.equal(policy.hasSkillAllowList, false);
  assert.equal(policy.hasMcpAllowList, false);
  assert.equal(policy.isSkillAllowed("backend-patterns"), true);
  assert.equal(policy.isSkillAllowed("frontend-design"), false);
  assert.equal(policy.isMcpServerAllowed("memory"), true);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});

test('non-empty enable list means "deny unless enabled"', () => {
  const policy = createProfilePolicy({
    skillsEnable: ["backend-patterns"],
    mcpServersEnable: ["memory"],
  });

  assert.equal(policy.hasSkillAllowList, true);
  assert.equal(policy.hasMcpAllowList, true);
  assert.equal(policy.isSkillAllowed("backend-patterns"), true);
  assert.equal(policy.isSkillAllowed("frontend-design"), false);
  assert.equal(policy.isMcpServerAllowed("memory"), true);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});

test("skill and MCP checks share the same conflict semantics", () => {
  const policy = createProfilePolicy({
    skillsEnable: ["backend-patterns"],
    skillsDisable: ["frontend-design"],
    mcpServersEnable: ["memory"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.equal(policy.isSkillAllowed("backend-patterns"), true);
  assert.equal(policy.isSkillAllowed("frontend-design"), false);
  assert.equal(policy.isMcpServerAllowed("memory"), true);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});

test('wildcard enable means "allow unless disabled"', () => {
  const policy = createProfilePolicy({
    skillsEnable: ["*"],
    skillsDisable: ["frontend-design"],
    mcpServersEnable: ["*"],
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.equal(policy.hasSkillAllowList, false);
  assert.equal(policy.hasMcpAllowList, false);
  assert.equal(policy.isSkillAllowed("backend-patterns"), true);
  assert.equal(policy.isSkillAllowed("frontend-design"), false);
  assert.equal(policy.isMcpServerAllowed("memory"), true);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});

test('wildcard disable means "deny everything"', () => {
  const policy = createProfilePolicy({
    skillsEnable: ["backend-patterns"],
    skillsDisable: ["*"],
    mcpServersEnable: ["memory"],
    mcpServersDisable: ["*"],
  });

  assert.equal(policy.isSkillAllowed("backend-patterns"), false);
  assert.equal(policy.isSkillAllowed("frontend-design"), false);
  assert.equal(policy.isMcpServerAllowed("memory"), false);
  assert.equal(policy.isMcpServerAllowed("chrome-devtools"), false);
});
