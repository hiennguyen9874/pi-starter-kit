import test from "node:test";
import assert from "node:assert/strict";

import { injectBehavioralGuidelines } from "./behavioral-guidelines.ts";

const SYSTEM_PROMPT = [
  "You are an AI assistant.",
  "Available tools:",
  "- read",
  "Pi documentation (read only when needed)",
].join("\n");

test("injectBehavioralGuidelines disables configured sections per profile", () => {
  const result = injectBehavioralGuidelines(SYSTEM_PROMPT, {
    enabled: true,
    sections: {
      validation: false,
      changeScope: false,
    },
  });

  assert.match(result, /<operating_context>/);
  assert.match(result, /<communication_and_tool_use>/);
  assert.doesNotMatch(result, /<validation>/);
  assert.doesNotMatch(result, /<change_scope>/);
});

test("injectBehavioralGuidelines skips injection when disabled", () => {
  const result = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: false });

  assert.equal(result, SYSTEM_PROMPT);
});

test("injectBehavioralGuidelines only injects planning discipline when enabled", () => {
  const defaultResult = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: true });
  const planningResult = injectBehavioralGuidelines(SYSTEM_PROMPT, {
    enabled: true,
    sections: {
      planningDiscipline: true,
    },
  });

  assert.doesNotMatch(defaultResult, /<planning_discipline>/);
  assert.match(planningResult, /<planning_discipline>/);
});
