---
name: test-driven-development
description: Use when implementing any feature, bugfix, refactor, behavior change, or when user asks for TDD/red-green-refactor/test-first development.
---

# Test-Driven Development (TDD)

## Core Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write one test. Watch it fail for the expected reason. Write minimal production code. Watch it pass. Refactor only while green.

If production code was written before the test, delete it or throw it away as exploration, then restart from a failing test. Do not keep it as reference and adapt tests around it.

## When to Use

Use for:
- New features
- Bug fixes
- Refactoring
- Behavior changes
- Regression fixes
- Any request mentioning TDD, test-first, or red-green-refactor

Exceptions require explicit user approval:
- Throwaway prototypes
- Generated code
- Pure configuration changes
- Work with no practical test seam

## Testing Philosophy

Tests verify behavior through public interfaces, not implementation details.

Good tests:
- Exercise real code paths through public APIs
- Describe what the system does, not how internals do it
- Survive internal refactors
- Read like specifications
- Focus on one behavior at a time

Bad tests:
- Mock internal collaborators
- Test private methods
- Assert internal call counts/order
- Query storage directly when a public read interface exists
- Break on refactor when behavior is unchanged

Read references when needed:
- [tests.md](tests.md) for good/bad test examples
- [mocking.md](mocking.md) before adding mocks
- [interface-design.md](interface-design.md) when test seams are hard
- [deep-modules.md](deep-modules.md) when interface shape is unclear
- [refactoring.md](refactoring.md) after green
- [testing-anti-patterns.md](testing-anti-patterns.md) when changing tests, mocks, or test utilities

## Workflow

### 1. Plan Behavior Before Coding

Before writing code:
- Identify public interface being changed.
- List observable behaviors to verify.
- Prioritize critical paths and edge cases.
- Ask user if interface, behavior priority, or acceptance criteria are unclear.
- Prefer deep modules: small interface, hidden implementation complexity.

Ask:
- What should caller/user be able to do?
- Which behavior matters most?
- What regression must never return?

Do not write all tests up front. That is horizontal slicing and creates tests for imagined behavior.

Correct sequence is vertical slicing:

```
RED -> GREEN -> REFACTOR
RED -> GREEN -> REFACTOR
RED -> GREEN -> REFACTOR
```

One behavior, one test, one implementation step.

### 2. RED — Write One Failing Test

Write one minimal test for one observable behavior.

Requirements:
- Clear behavior name
- Uses public interface only
- Uses real code unless boundary mocking is unavoidable
- Tests one logical behavior
- Fails before implementation

Good:

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

Bad:

```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```

The bad test verifies mock behavior more than system behavior.

### 3. Verify RED

Run the smallest relevant test command.

```bash
npm test path/to/test.test.ts
```

Confirm:
- Test fails, not errors.
- Failure message matches expected missing behavior.
- Failure is not caused by typo, bad setup, wrong import, or broken fixture.

If test passes immediately, it does not prove new behavior. Fix the test or choose a behavior not already covered.

If test errors, fix test/setup until it fails for the expected reason.

### 4. GREEN — Minimal Code

Write the simplest production code that passes current test.

Good:

```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === 2) throw error;
    }
  }
  throw new Error('unreachable');
}
```

Bad:

```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // speculative API
}
```

Rules:
- Do not add untested features.
- Do not refactor unrelated code.
- Do not build extension points for future tests.
- Do not change the test to match faulty implementation.

### 5. Verify GREEN

Run targeted tests again.

Confirm:
- New test passes.
- Related tests still pass.
- Output has no unexpected errors or warnings.

If the test fails, fix production code unless the test itself is proven wrong.

### 6. REFACTOR — Clean Up While Green

Only after tests pass:
- Remove duplication.
- Improve names.
- Extract helpers.
- Simplify interfaces.
- Deepen modules.

Run tests after each refactor step. Never refactor while red.

### 7. Repeat

Pick next behavior and repeat one vertical slice at a time.

## Bug Fix Protocol

For every bug:
1. Reproduce symptom.
2. Write failing regression test that captures the bug.
3. Verify test fails for the bug.
4. Fix minimally.
5. Verify regression test and related tests pass.

Never fix bugs without a regression test when a practical seam exists.

## Mocking Rules

Mock only system boundaries:
- External APIs
- Email/payment providers
- Time/randomness
- File system when needed
- Databases only when test DB is impractical

Do not mock:
- Your own modules/classes
- Internal collaborators
- Private methods
- Code you control

Before asserting on mock calls, ask: does this verify user/caller-visible behavior? If not, test through public behavior instead.

## Interface Design Pressure

If a test is hard to write, treat it as design feedback.

Prefer interfaces that:
- Accept dependencies instead of constructing them internally
- Return results instead of hiding side effects
- Have small surface area
- Hide complex implementation behind simple public methods

Hard-to-test code often means hard-to-use code.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test is cheap. |
| "I'll test after" | Tests-after prove what you built, not what was required. |
| "Manual test is faster" | Manual checks are not repeatable regression tests. |
| "Need to explore first" | Fine. Throw exploration away, then start TDD. |
| "Keep old code as reference" | You will adapt tests around it. Delete/ignore it. |
| "Mocking internals is easier" | Easier now, brittle later. Test behavior. |
| "All tests first" | Horizontal slicing creates imagined tests. Use vertical slices. |

## Red Flags — Stop

Stop and restart the cycle if:
- Production code came before failing test.
- Test passes immediately.
- You cannot explain why RED failed.
- Test asserts internal calls instead of behavior.
- You are adding test-only production methods.
- You are refactoring while red.
- You are adding speculative API or options.
- You are fixing a bug without regression coverage.

## Per-Cycle Checklist

```
[ ] One behavior selected
[ ] Test uses public interface
[ ] Test describes observable behavior
[ ] Test fails for expected reason
[ ] Minimal production code written
[ ] Targeted test passes
[ ] Related tests pass
[ ] Refactor done only while green
```

## Completion Checklist

Before marking work complete:
- [ ] Every behavior change has test coverage.
- [ ] Each new/changed test was observed failing first where practical.
- [ ] Tests verify behavior, not implementation details.
- [ ] Mocks are limited to system boundaries.
- [ ] No test-only methods were added to production code.
- [ ] All targeted and relevant tests pass.
- [ ] Verification output is clean.

If these boxes cannot be checked, report the gap explicitly.
