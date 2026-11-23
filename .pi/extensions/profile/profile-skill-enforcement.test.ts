import test from "node:test";
import assert from "node:assert/strict";

import { createProfilePolicy } from "./profile-policy.ts";
import { evaluateSkillCommand } from "./index.ts";

test("disabled skill command is blocked", () => {
  const policy = createProfilePolicy({
    skillsDisable: ["frontend-design"],
  });

  assert.deepEqual(evaluateSkillCommand("/skill:frontend-design", policy), {
    isSkillCommand: true,
    skillName: "frontend-design",
    allowed: false,
  });
});

test("enabled skill command passes", () => {
  const policy = createProfilePolicy({
    skillsEnable: ["backend-patterns"],
  });

  assert.deepEqual(evaluateSkillCommand("/skill:backend-patterns extra args", policy), {
    isSkillCommand: true,
    skillName: "backend-patterns",
    allowed: true,
  });
});

test("non-empty enable list blocks unknown or unlisted skills", () => {
  const policy = createProfilePolicy({
    skillsEnable: ["backend-patterns"],
  });

  assert.deepEqual(evaluateSkillCommand("/skill:frontend-design", policy), {
    isSkillCommand: true,
    skillName: "frontend-design",
    allowed: false,
  });
});

test("non-skill input is ignored", () => {
  const policy = createProfilePolicy({
    skillsDisable: ["frontend-design"],
  });

  assert.deepEqual(evaluateSkillCommand("hello world", policy), {
    isSkillCommand: false,
  });
});

test("skill commands apply path selectors to the actual loaded variant", () => {
  const policy = createProfilePolicy({
    alwaysSkills: [".pi/skills/pstack/teach/SKILL.md"],
    skillsEnable: ["./.pi/skills/mattpocock/teach/SKILL.md"],
    skillsDisable: ["skills/pstack/teach/"],
  });
  assert.equal(evaluateSkillCommand("/skill:teach", policy, () => "skills/mattpocock/teach/SKILL.md").allowed, true);
  assert.equal(evaluateSkillCommand("/skill:teach", policy, () => "skills/pstack/teach/SKILL.md").allowed, false);
  assert.equal(evaluateSkillCommand("/skill:teach", policy).allowed, false);
});
