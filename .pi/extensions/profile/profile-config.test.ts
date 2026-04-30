import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadProfilesConfig } from "./profile-config.ts";
import { createProfilePolicy } from "./profile-policy.ts";

function createRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-config-"));
  mkdirSync(join(root, ".pi"));
  return root;
}

test("missing config file returns empty config state", () => {
  const root = createRoot();

  const result = loadProfilesConfig(root);

  assert.equal(result.path, join(root, ".pi", "profiles.json"));
  assert.equal(result.config, undefined);
  assert.equal(result.error, undefined);
});

test("malformed JSON returns parse error information", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "profiles.json"), "{not json}");

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /json/i);
});

test("loads valid profiles config", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({
      defaultProfile: "backend",
      profiles: {
        backend: {
          skillsEnable: ["backend-patterns"],
          mcpServersDisable: ["chrome-devtools"],
        },
      },
    }),
  );

  const result = loadProfilesConfig(root);

  assert.equal(result.error, undefined);
  assert.equal(result.config?.defaultProfile, "backend");
  assert.deepEqual(result.config?.profiles.backend, {
    skillsEnable: ["backend-patterns"],
    mcpServersDisable: ["chrome-devtools"],
  });
});

test("repository base profile allows bundled extension skills used by prompts", () => {
  const result = loadProfilesConfig(process.cwd());
  const baseProfile = result.config?.profiles.base;
  assert.ok(baseProfile);

  const policy = createProfilePolicy(baseProfile);

  assert.equal(policy.isSkillAllowed("ask-user"), true);
  assert.equal(policy.isSkillAllowed("ctx-doctor"), true);
});

test("unknown top-level shapes are rejected safely", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: 42, profiles: [] }),
  );

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /defaultProfile|profiles/i);
});
