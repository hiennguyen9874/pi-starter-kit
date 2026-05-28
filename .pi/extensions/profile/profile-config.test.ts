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
  mkdirSync(join(root, ".pi", "profiles"));
  return root;
}

test("missing config returns empty profiles map", () => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-config-"));
  mkdirSync(join(root, ".pi"));

  const result = loadProfilesConfig(root);

  assert.equal(result.error, undefined);
  assert.deepEqual(result.config?.profiles, {});
  assert.equal(result.config?.defaultProfile, undefined);
});

test("malformed profiles.json returns parse error", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "profiles.json"), "{not json}");

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /json/i);
});

test("loads defaultProfile from profiles.json and profiles from YAML files", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: "backend" }),
  );
  writeFileSync(
    join(root, ".pi", "profiles", "backend.yaml"),
    [
      "skillsEnable:",
      "  - backend-patterns",
      "mcpServersDisable:",
      "  - chrome-devtools",
      "extensionState:",
      "  behavioralGuidelines:",
      "    enabled: true",
      "    sections:",
      "      validation: false",
    ].join("\n"),
  );

  const result = loadProfilesConfig(root);

  assert.equal(result.error, undefined);
  assert.equal(result.config?.defaultProfile, "backend");
  assert.deepEqual(result.config?.profiles.backend, {
    skillsEnable: ["backend-patterns"],
    mcpServersDisable: ["chrome-devtools"],
    extensionState: {
      behavioralGuidelines: {
        enabled: true,
        sections: {
          validation: false,
        },
      },
    },
  });
});

test("rejects invalid behavioral guideline section in YAML file", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles", "planning.yaml"),
    [
      "extensionState:",
      "  behavioralGuidelines:",
      "    sections:",
      "      unknownSection: false",
    ].join("\n"),
  );

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /unknown behavioral guideline section/i);
});

test("repository base profile allows bundled extension skills used by prompts", () => {
  const result = loadProfilesConfig(process.cwd());
  const baseProfile = result.config?.profiles.base;
  assert.ok(baseProfile);

  const policy = createProfilePolicy(baseProfile);

  assert.equal(policy.isSkillAllowed("ask-user"), true);
});

test("invalid defaultProfile type is rejected", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles.json"),
    JSON.stringify({ defaultProfile: 42 }),
  );

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /defaultProfile/i);
});

test("skips non-yaml files and hidden files in profiles directory", () => {
  const root = createRoot();
  writeFileSync(
    join(root, ".pi", "profiles", "base.yaml"),
    "skillsEnable:\n  - ask-user\n",
  );
  writeFileSync(join(root, ".pi", "profiles", "readme.md"), "# not a profile");
  writeFileSync(join(root, ".pi", "profiles", ".hidden.yaml"), "skillsEnable:\n  - hidden\n");
  writeFileSync(join(root, ".pi", "profiles", "_template.yaml"), "skillsEnable:\n  - template\n");

  const result = loadProfilesConfig(root);

  assert.equal(result.error, undefined);
  assert.deepEqual(Object.keys(result.config?.profiles ?? {}), ["base"]);
});

test("malformed YAML reports file-specific error", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "profiles", "broken.yaml"), "{{not: valid: yaml: [}");

  const result = loadProfilesConfig(root);

  assert.equal(result.config, undefined);
  assert.match(result.error ?? "", /broken\.yaml/);
});

test("multiple profiles load from separate YAML files", () => {
  const root = createRoot();
  writeFileSync(join(root, ".pi", "profiles.json"), JSON.stringify({ defaultProfile: "a" }));
  writeFileSync(join(root, ".pi", "profiles", "a.yaml"), "skillsEnable:\n  - skill-a\n");
  writeFileSync(join(root, ".pi", "profiles", "b.yaml"), "skillsEnable:\n  - skill-b\n");

  const result = loadProfilesConfig(root);

  assert.equal(result.error, undefined);
  assert.deepEqual(Object.keys(result.config?.profiles ?? {}).sort(), ["a", "b"]);
  assert.deepEqual(result.config?.profiles.a.skillsEnable, ["skill-a"]);
  assert.deepEqual(result.config?.profiles.b.skillsEnable, ["skill-b"]);
});
