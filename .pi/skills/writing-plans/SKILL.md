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

## Bite-Sized Phase and Task Granularity

**Phase count maximum by feature size:**
- Small feature: maximum 3 phases
- Medium feature: maximum 5 phases
- Large feature: maximum 7 phases

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

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan one phase at a time. Execute only one phase per user request unless explicitly told otherwise.

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

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```

## Phase Verification

Run: `pytest tests/path -v`
Expected: PASS
````

## Remember
- Plan output is a folder, not one `plan.md` containing many tasks
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Phase count stays within size cap: small ≤3, medium ≤5, large ≤7
- Each phase has 1-3 related tasks
- `plan.md` links to `phase-x.md`; task detail lives in phase files
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

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
