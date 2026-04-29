---
description: Improve, merge, or create skills for this coding-agent system
skills:
  - prompt-leverage
  - skill-creator
  - writing-skills
  - ask-user
---

You are improving one or more skills in this coding-agent system.

Use existing agents/subagents if available for pressure-testing skill behavior. Do not require subagents if this environment does not expose them.

## Objective

Improve the skill system with minimum necessary change.

Prefer this order:

1. Reuse existing skill as-is.
2. Improve existing skill.
3. Merge overlapping skills.
4. Split skill only if current skill has unrelated responsibilities.
5. Create new skill only if no existing skill can reasonably own the workflow.

## Required Context

Read relevant files before proposing or editing:

- requested skill directories
- `.pi/skills/*/SKILL.md` that may overlap
- `.pi/skills/prompt-leverage/SKILL.md`
- `.pi/skills/skill-creator/SKILL.md`
- `.pi/skills/writing-skills/SKILL.md`

If user names specific skills, start there.

If user asks for system-level discovery, scan `.pi/skills/` and identify candidates.

## Input Contract

User request should provide at least one of:

- skill name/path to improve
- workflow skill should support
- problem with current skill behavior
- desired merge/split/create outcome
- examples of prompts where current skill fails
- desired output format

If missing, infer what you can from repository context, then ask one focused clarification question only when needed.

## Skill Improvement Workflow

### 1. Understand Intent

Extract:

- target workflow
- intended trigger conditions
- expected agent behavior
- expected output
- current pain
- whether this is project-specific or reusable across projects

State assumptions briefly.

### 2. Inventory Existing Skills

Find skills that already cover:

- same trigger phrases
- same workflow
- same domain
- same tools
- same output type
- same verification loop

Classify each candidate:

- keep
- improve
- merge
- split
- deprecate
- unrelated

Do not create new skill while reasonable existing owner exists.

### 3. Decide Change Type

Use this decision tree:

- If existing skill covers workflow but trigger is weak: improve `description`.
- If existing skill triggers correctly but instructions are vague: improve body.
- If two skills teach same workflow: merge into clearer owner skill.
- If one skill mixes unrelated workflows: split only if both parts are reusable.
- If workflow is only project convention: put guidance in repo docs, not skill.
- If workflow is reusable and uncovered: create new skill.

For high-impact merge/split/create decisions, use `ask-user` before editing.

### 4. Apply Skill-Writing Rules

Follow `writing-skills` and `skill-creator` guidance:

- `SKILL.md` required.
- Frontmatter uses `name` and `description`.
- `name` uses lowercase letters, numbers, hyphens.
- `description` starts with “Use when...”.
- `description` focuses on trigger conditions, not workflow summary.
- Keep description concise and specific.
- Keep main skill body practical.
- Use progressive disclosure:
  - core workflow in `SKILL.md`
  - heavy references in `references/`
  - scripts only for deterministic repeated tasks
- Avoid one-off project notes unless skill is intentionally project-local.
- Do not add broad abstractions or speculative sections.

### 5. Test Skill Behavior

For each changed or created skill, define pressure scenarios:

- prompt where skill should trigger
- prompt where skill should not trigger
- ambiguous prompt requiring clarification
- failure mode current skill should prevent

If subagents/test harness are available:

1. Run baseline without change when practical.
2. Apply skill change.
3. Re-run scenarios.
4. Compare behavior.

If no test harness is available, provide manual verification prompts.

### 6. Review Changes

Check:

- trigger accuracy
- overlap reduction
- no duplicated workflow across skills
- no unnecessary new skill
- instructions are actionable
- output contract clear
- done criteria clear
- no unrelated edits

## Done Criteria

Work is done when:

- existing skills were checked before creating new skill
- chosen change type is justified
- target skill has clear trigger description
- skill body gives concrete workflow
- overlap with related skills is reduced or explicitly explained
- input/output expectations are clear
- verification prompts or tests exist
- user can copy result directly into repo

User Request:
$ARGUMENTS