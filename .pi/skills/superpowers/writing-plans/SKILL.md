---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write decision-complete implementation plan folders assuming the engineer has zero context for our codebase and questionable taste. Document what they need to know: which files to touch for each task, interfaces/contracts, important code or test snippets, docs they might need to check, and how to test it. Give them the whole plan as bite-sized phases and tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to folder:** `docs/plans/YYYY-MM-DD-<feature-name>/`

**Required files:**
- `design.md` — approved design or copied design context
- `plan.md` — Plan Document Header plus phase list with links to `phase-x.md`
- `phase-x.md` — executable phase files

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## Planning Inputs

Before defining phases, operate in **read-only planning mode**:

- Read the spec, design context, and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks, unknowns, and human decisions needed before implementation

Resolve discoverable facts locally before asking the user. Do not ask where code lives, how current APIs behave, or what conventions exist if those answers can be found through non-mutating repo inspection.

Treat unknowns differently:
- **Discoverable facts:** inspect files, configs, tests, docs, schemas, and existing patterns first.
- **Preferences/trade-offs:** ask the user with concrete options and a recommended default.
- **Unanswered but low-risk defaults:** proceed only when safe, and record the default in the plan's assumptions.

**Do not write implementation code while planning.** The output is the plan folder.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Dependency and Slice Strategy

Order phases by the dependency graph: foundations first, then features that depend on them. Define shared contracts before parallel work that relies on those contracts.

Prefer **vertical slices** over horizontal layers. A good phase delivers working, testable functionality across the needed files instead of building all schema, then all APIs, then all UI. Horizontal foundation work is allowed only when later slices truly depend on it.

## Bite-Sized Phase and Task Granularity

**Phase count maximum by feature size:**
- Small feature: 2-3 phases
- Medium feature: 3-5 phases
- Large feature: 5-7 phases
- Breaking feature: 7-10 phases

If the work appears to need more phases than the size allows, simplify scope or ask before writing the plan.

**Each phase contains 1-3 related tasks.** Group tasks that belong together, such as backend API + backend tests, or frontend UI + frontend tests. Do not mix unrelated backend, frontend, infra, and docs work in one phase.

**Target task size:** each task should be small enough for one focused session, usually touching about 1-5 files. If a task touches multiple independent subsystems, has more than three acceptance conditions, or needs "and" in the title, split it.

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**`plan.md` MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

After the header, list phases only. Add a short `Assumptions` section before `Phases` only when the plan relies on explicit defaults or unresolved low-risk choices.

```markdown
## Assumptions

- [Only include when needed: explicit default or decision the implementer must preserve]

## Phases

1. [Phase 1: Backend API and tests](phase-1.md)
2. [Phase 2: Frontend UI and tests](phase-2.md)
```

## Phase File Structure

Each `phase-x.md` uses this structure:

````markdown
# Phase X: [Related Work Group]

**Goal:** [What this phase completes]

**Tasks:** 1-3 related tasks only.

### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

Follow the existing implementation pattern in `src/path/nearby_file.py`. The new function must accept `input`, return `expected`, and raise `ValueError("specific message")` for invalid input.

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```

## No Placeholders

Every step must contain the actual content an engineer needs. Be concrete without bloating the plan: include exact interfaces, schemas, test cases, acceptance checks, and representative snippets where they prevent ambiguity. Full implementation code is required only when the specific code shape matters; otherwise, describe the required behavior precisely and point to the existing pattern to follow.

These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases" without naming the exact cases and expected behavior
- "Write tests for the above" (without actual test names, scenarios, or assertions)
- "Similar to Task N" (repeat the necessary details — the engineer may be reading tasks out of order)
- Steps that describe what to do without enough detail to verify completion
- References to types, functions, or methods not defined in any task or existing code path

## Phase Verification

Run: `pytest tests/path -v`
Expected: PASS
````

## Checkpoints

Add explicit verification checkpoints inside each phase when it has multiple tasks or meaningful integration risk:

```markdown
## Phase Verification
- [ ] Focused tests pass: `pytest tests/path -v`
- [ ] Build/typecheck passes: `npm run build`
- [ ] Core acceptance criteria for this phase are satisfied
- [ ] Stop for human review before the next phase if risk or scope changed
```

Use project-appropriate commands. Keep checkpoints concrete; never write generic "verify everything" instructions.

## Remember
- Plan output is a folder, not one `plan.md` containing many tasks
- Exact file paths always
- Plans must be decision-complete: interfaces, behavior, edge cases, tests, and assumptions are explicit
- Include code snippets where they remove ambiguity; do not paste large implementations when a precise behavior spec and existing pattern are safer
- Exact commands with expected output
- Phase count stays within size cap: small ≤3, medium ≤5, large ≤7
- Each phase has 1-3 related tasks
- Tasks are dependency-ordered, vertically sliced when possible, and small enough for one focused session
- `plan.md` links to `phase-x.md`; task detail lives in phase files
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Dependency and slice check:** Are foundations before dependents? Are phases vertically sliced where possible? Are tasks too large or mixing unrelated subsystems? Fix ordering and splits before handoff.

**3. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**4. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan folder, stop planning and offer execution choice. Do not begin implementation unless the user explicitly chooses an execution path.

**"Plan complete and saved to `docs/plans/<folder>/`. Two execution options:**

**1. Current Session** - I execute one selected phase now, then stop for review

**2. Parallel Session (separate)** - Open new session with executing-plans; execute one phase at a time

**Which approach and which phase?"**

**If Current Session chosen:**
- Read `design.md`, `plan.md`, and selected `phase-x.md`
- Implement only that phase
- Stop before starting another phase

**If Parallel Session chosen:**
- Guide them to open a new session
- **REQUIRED SUB-SKILL:** New session uses executing-plans one phase at a time
