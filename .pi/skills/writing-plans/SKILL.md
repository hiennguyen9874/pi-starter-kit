---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plan folders assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized phases and tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to folder:** `docs/plans/YYYY-MM-DD-<feature-name>/`

**Required files:**
- `design.md` — approved design or copied design context
- `plan.md` — Plan Document Header plus phase list with links to `phase-x.md`
- `phase-x.md` — executable phase files

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Phase and Task Granularity

**Phase count maximum by feature size:**
- Small feature: 2-3 phases
- Medium feature: 3-5 phases
- Large feature: 5-7 phases
- Breaking feature: 7-10 phases

If the work appears to need more phases than the size allows, simplify scope or ask before writing the plan.

**Each phase contains 1-3 related tasks.** Group tasks that belong together, such as backend API + backend tests, or frontend UI + frontend tests. Do not mix unrelated backend, frontend, infra, and docs work in one phase.

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

After the header, list phases only:

```markdown
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

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Phase Verification

Run: `pytest tests/path -v`
Expected: PASS
````

## Remember
- Plan output is a folder, not one `plan.md` containing many tasks
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- Phase count stays within size cap: small ≤3, medium ≤5, large ≤7
- Each phase has 1-3 related tasks
- `plan.md` links to `phase-x.md`; task detail lives in phase files
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan folder, offer execution choice:

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
