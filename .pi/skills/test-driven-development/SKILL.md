---
name: test-driven-development
description: Test-driven development with red-green-refactor loop. Use when implementing features, bug fixes, behavior changes, or refactors test-first; when user mentions TDD, red-green-refactor, integration tests, regression tests, or test-first development.
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples, [mocking.md](mocking.md) for mocking guidelines, and [testing-anti-patterns.md](testing-anti-patterns.md) when adding mocks or test utilities.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Workflow

### 1. Planning

When exploring the codebase, use the project's domain glossary so that test names and interface vocabulary match the project's language, and respect ADRs in the area you're touching.

Before writing code for non-trivial or ambiguous work:

- [ ] Confirm what public interface or behavior should change
- [ ] Confirm which behaviors matter most
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] List behaviors to test, not implementation steps
- [ ] Get user approval when interface, behavior, or test scope is ambiguous

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Focus testing effort on critical paths, regressions, and complex logic. For a clear bug fix, write a failing regression test first instead of pausing for unnecessary planning.

### 2. Tracer Bullet

Write ONE test that confirms ONE behavior through the public interface:

```
RED:        Write test for first behavior
VERIFY RED: Run the focused test and confirm it fails for the expected reason
GREEN:      Write minimal code to pass
VERIFY GREEN: Run the focused test and confirm it passes
```

This is your tracer bullet - proves the path works end-to-end.

Verify RED before implementing:

- Test fails, not errors
- Failure message matches the missing behavior
- Failure is not caused by typo, import error, bad setup, or wrong assertion
- If the test passes immediately, rewrite it; it is testing existing behavior

### 3. Incremental Loop

For each remaining behavior:

```
RED:        Write next focused test
VERIFY RED: Confirm expected failure
GREEN:      Minimal code to pass current test
VERIFY GREEN: Confirm focused tests pass
```

Rules:

- One behavior at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior
- If you wrote new production code before a failing test in this task, revert your change and restart test-first unless the user approves otherwise

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Anti-Patterns to Avoid

Read [testing-anti-patterns.md](testing-anti-patterns.md) when adding mocks, test utilities, or test-only cleanup. In short:

- Never assert that a mock exists; assert real behavior
- Never add production methods that only tests use
- Never mock a dependency before understanding the side effects the test needs
- Mock complete, realistic boundary data rather than partial imagined shapes
- If mocks become more complex than the behavior under test, prefer an integration-style test

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test failed for the expected reason before implementation
[ ] Code is minimal for this test
[ ] Focused test passes after implementation
[ ] Test would survive internal refactor
[ ] No speculative features added
```
