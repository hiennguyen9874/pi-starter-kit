import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import skillsInstructionsRewriter, {
  hideDisabledSkills,
  removeDisabledSkillsFromPrompt,
} from "../skills-instructions-rewriter.ts";

const skill = (name: string, disableModelInvocation = false) => ({
  name,
  description: `${name} skill`,
  filePath: `/skills/${name}/SKILL.md`,
  disableModelInvocation,
});

const renderSkills = (skills: ReturnType<typeof skill>[]) =>
  [
    "<available_skills>",
    ...skills
      .filter((s) => !s.disableModelInvocation)
      .map((s) => `  <skill>\n    <name>${s.name}</name>\n  </skill>`),
    "</available_skills>",
  ].join("\n");

function setup(t: any, filters: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "skills-rewriter-"));
  const previous = process.env.PI_CONFIG_DIR;
  process.env.PI_CONFIG_DIR = dir;
  writeFileSync(
    join(dir, "settings.json"),
    JSON.stringify({ extensionState: { skillsInstructionsRewriterDisabledSkillFilters: filters } }),
  );
  t.after(() => {
    if (previous === undefined) delete process.env.PI_CONFIG_DIR;
    else process.env.PI_CONFIG_DIR = previous;
    rmSync(dir, { recursive: true, force: true });
  });

  const handlers = new Map<string, Function>();
  skillsInstructionsRewriter({ on: (name: string, fn: Function) => handlers.set(name, fn) } as unknown as ExtensionAPI);
  return handlers.get("before_agent_start")!;
}

test("hideDisabledSkills marks matches without removing or mutating them", () => {
  const original = [skill("context-mode"), skill("ctx-stats"), skill("tdd")];
  const result = hideDisabledSkills(original, ["context-mode", "ctx-*"]);

  assert.deepEqual(result.map((s) => [s.name, s.disableModelInvocation]), [
    ["context-mode", true],
    ["ctx-stats", true],
    ["tdd", false],
  ]);
  assert.equal(original[0].disableModelInvocation, false);
  assert.equal(result[2], original[2]);
});

test("filters survive a later handler that rebuilds the prompt from systemPromptOptions", async (t) => {
  const handler = setup(t, ["find-skills"]);
  const options = { skills: [skill("find-skills"), skill("tdd")] };
  const event = {
    systemPromptOptions: options,
    get systemPrompt() {
      return renderSkills(options.skills);
    },
  };

  await handler(event);

  // Simulates pi-ipython: ignores event.systemPrompt and renders from options.
  const rebuilt = renderSkills(event.systemPromptOptions.skills);
  assert.doesNotMatch(rebuilt, /find-skills/);
  assert.match(rebuilt, /tdd/);
  // The skill stays loaded, so /skill:find-skills and prompt-skills.ts still resolve it.
  assert.ok(event.systemPromptOptions.skills.some((s) => s.name === "find-skills"));
});

test("still filters a forced prompt string and does nothing without filters", async (t) => {
  const forced = renderSkills([skill("find-skills"), skill("tdd")]);
  assert.doesNotMatch(removeDisabledSkillsFromPrompt(forced, ["find-skills"]), /find-skills/);

  const handler = setup(t, []);
  const options = { skills: [skill("find-skills")] };
  assert.equal(await handler({ systemPromptOptions: options, systemPrompt: forced }), undefined);
  assert.equal(options.skills[0].disableModelInvocation, false);
});
