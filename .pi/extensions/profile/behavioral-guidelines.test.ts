import test from "node:test";
import assert from "node:assert/strict";

import {
  hasBehavioralGuidelinesInsertionMarker,
  injectBehavioralGuidelines,
  loadBehavioralGuidelineRegistry,
} from "./behavioral-guidelines.ts";

const SYSTEM_PROMPT = [
  "<tools>",
  "- read",
  "</tools>",
  "<rules>",
  "Be helpful.",
  "</rules>",
  "<docs>",
  "Pi documentation (read only when needed)",
  "</docs>",
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
      "executionPolicy",
      "evidenceDiscipline",
      "planningDiscipline",
      "changeScope",
      "validation",
      "finalResponse",
      "communicationAndToolUseMinimal",
      "communicationAndToolUseIpython",
      "communicationAndToolUseIpythonMinimal",
      "repositoryInstructionsMinimal",
      "executionPolicyMinimal",
      "evidenceDisciplineMinimal",
      "planningDisciplineMinimal",
      "changeScopeMinimal",
      "validationMinimal",
      "finalResponseMinimal",
    ],
  );
  assert.equal(REGISTRY.guidelines.find(({ name }) => name === "repositoryInstructions")?.defaultEnabled, false);
  assert.equal(REGISTRY.guidelines.find(({ name }) => name === "planningDiscipline")?.defaultEnabled, true);
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

test("injectBehavioralGuidelines injects planning discipline by default and supports explicit disablement", () => {
  const defaultResult = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: true }, REGISTRY);
  const disabledResult = injectBehavioralGuidelines(
    SYSTEM_PROMPT,
    {
      enabled: true,
      sections: {
        planningDiscipline: false,
      },
    },
    REGISTRY,
  );

  assert.match(defaultResult, /<planning_discipline>/);
  assert.ok(defaultResult.indexOf("<planning_discipline>") < defaultResult.indexOf("<docs>"));
  assert.doesNotMatch(disabledResult, /<planning_discipline>/);
});

test("XML insertion markers support docs and project_context sections", () => {
  const fallbackPrompt = "<rules>Be helpful.</rules>\n<project_context>Project details</project_context>";

  assert.equal(hasBehavioralGuidelinesInsertionMarker(SYSTEM_PROMPT), true);
  assert.equal(hasBehavioralGuidelinesInsertionMarker(fallbackPrompt), true);

  const result = injectBehavioralGuidelines(fallbackPrompt, { enabled: true }, REGISTRY);
  assert.ok(result.indexOf("<communication_and_tool_use>") < result.indexOf("<project_context>"));
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

// Simulates pi-ipython with "systemPrompt.ipythonAfter": ["rules"]: <ipython> right after </rules>.
function simulateIpythonAfterRules(prompt: string): string {
  const end = prompt.indexOf("</rules>") + "</rules>".length;
  const rest = prompt.slice(end).replace(/^\n+/, "");
  return `${prompt.slice(0, end)}\n\n<ipython>\nREPL\n</ipython>${rest ? `\n\n${rest}` : ""}`;
}

const IPYTHON_CONFIG = {
  enabled: true,
  sections: { communicationAndToolUse: false, communicationAndToolUseIpython: true },
};

test("guidelines go right after an existing <ipython> section", () => {
  const prompt = simulateIpythonAfterRules(SYSTEM_PROMPT);
  const result = injectBehavioralGuidelines(prompt, IPYTHON_CONFIG, REGISTRY);
  assert.match(result, /<\/ipython>\n\n<execution_policy>/);
  assert.ok(result.indexOf("<final_response>") < result.indexOf("<docs>"));
});

test("when pi-ipython runs later and <docs> is removed in between, ipython still precedes the guidelines", () => {
  const prompt = `${SYSTEM_PROMPT}\n\n<cwd>\n/tmp\n</cwd>`;
  const injected = injectBehavioralGuidelines(prompt, IPYTHON_CONFIG, REGISTRY);
  // pi-documentation removes <docs>, then pi-ipython adds <ipython> after </rules>.
  const result = simulateIpythonAfterRules(injected.replace(/<docs>[\s\S]*?<\/docs>\n*/, ""));
  const ipythonEnd = result.indexOf("</ipython>");
  assert.ok(result.indexOf("</rules>") < result.indexOf("<ipython>"));
  assert.ok(ipythonEnd < result.indexOf("<execution_policy>"));
  assert.ok(ipythonEnd < result.indexOf("<communication_and_tool_use>"));
  assert.ok(result.indexOf("</communication_and_tool_use>") < result.indexOf("<cwd>"));
});

test("without ipython the docs insertion point is unchanged", () => {
  const result = injectBehavioralGuidelines(SYSTEM_PROMPT, { enabled: true }, REGISTRY);
  assert.ok(result.indexOf("<execution_policy>") < result.indexOf("<docs>"));
});
