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

  assert.match(result, /## Operating Context/);
  assert.match(result, /## Communication and Tool Use/);
  assert.doesNotMatch(result, /## Validation/);
  assert.doesNotMatch(result, /## Change Scope/);
});

test("injectBehavioralGuidelines skips injection when disabled", () => {
  const result = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: false });

  assert.equal(result, SYSTEM_PROMPT);
});
