import test from "node:test";
import assert from "node:assert/strict";

import { injectBehavioralGuidelines, loadBehavioralGuidelineRegistry } from "./behavioral-guidelines.ts";

const SYSTEM_PROMPT = [
  "You are an AI assistant.",
  "Available tools:",
  "- read",
  "Pi documentation (read only when needed)",
].join("\n");

const REGISTRY = loadBehavioralGuidelineRegistry(process.cwd()).registry;
if (!REGISTRY) {
  throw new Error("Expected repository behavioral guideline registry to load");
}

test("loadBehavioralGuidelineRegistry exposes current behavioral guideline sections", () => {
  assert.deepEqual(
    REGISTRY.guidelines.map(({ name }) => name),
    [
      "communicationAndToolUse",
      "repositoryInstructions",
      "executionAndDelivery",
      "evidenceDiscipline",
      "planningDiscipline",
      "changeScope",
      "validation",
      "finalResponse",
    ],
  );
  assert.equal(REGISTRY.guidelines.find(({ name }) => name === "repositoryInstructions")?.defaultEnabled, true);
  assert.equal(REGISTRY.guidelines.find(({ name }) => name === "planningDiscipline")?.defaultEnabled, false);
});

test("injectBehavioralGuidelines disables configured sections per profile", () => {
  const result = injectBehavioralGuidelines(
    SYSTEM_PROMPT,
    {
      enabled: true,
      sections: {
        validation: false,
        changeScope: false,
      },
    },
    REGISTRY,
  );

  assert.match(result, /<communication_and_tool_use>/);
  assert.doesNotMatch(result, /<validation>/);
  assert.doesNotMatch(result, /<change_scope>/);
});

test("injectBehavioralGuidelines skips injection when disabled", () => {
  const result = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: false }, REGISTRY);

  assert.equal(result, SYSTEM_PROMPT);
});

test("injectBehavioralGuidelines only injects planning discipline when enabled", () => {
  const defaultResult = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: true }, REGISTRY);
  const planningResult = injectBehavioralGuidelines(
    SYSTEM_PROMPT,
    {
      enabled: true,
      sections: {
        planningDiscipline: true,
      },
    },
    REGISTRY,
  );

  assert.doesNotMatch(defaultResult, /<planning_discipline>/);
  assert.match(planningResult, /<planning_discipline>/);
});

test("injectBehavioralGuidelines supports explicit include lists", () => {
  const result = injectBehavioralGuidelines(
    SYSTEM_PROMPT,
    {
      enabled: true,
      include: ["planningDiscipline"],
      useDefaults: false,
    },
    REGISTRY,
  );

  assert.match(result, /<planning_discipline>/);
  assert.doesNotMatch(result, /<communication_and_tool_use>/);
});
