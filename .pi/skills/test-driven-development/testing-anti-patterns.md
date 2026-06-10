# Testing Anti-Patterns

Load this reference when writing or changing tests, adding mocks, or considering test-only production APIs.

## Core Principle

Tests must verify real behavior, not mock behavior. Mocks are tools for isolating boundaries; they are not the thing being tested.

## Iron Rules

```
1. Never test mock behavior
2. Never add test-only methods to production classes
3. Never mock without understanding dependency side effects
```

## Anti-Pattern 1: Testing Mock Behavior

**Bad:**

```typescript
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

This verifies the mock exists, not that the page behaves correctly.

**Good:**

```typescript
test('renders navigation', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

Gate check before asserting on any mock element:

```
Am I testing real behavior, or just mock existence?
If mock existence: stop, delete the assertion or unmock the component.
```

## Anti-Pattern 2: Test-Only Methods in Production

**Bad:**

```typescript
class Session {
  async destroy() { // Only used by tests
    await this._workspaceManager?.destroyWorkspace(this.id);
  }
}

afterEach(() => session.destroy());
```

Production APIs should not grow methods just to support test cleanup.

**Good:**

```typescript
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

afterEach(() => cleanupSession(session));
```

Gate check before adding a production method:

```
Is this only used by tests?
If yes: put it in test utilities instead.

Does this class own this resource's lifecycle?
If no: this method belongs elsewhere.
```

## Anti-Pattern 3: Mocking Without Understanding

**Bad:**

```typescript
test('detects duplicate server', async () => {
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined),
  }));

  await addServer(config);
  await addServer(config); // Should throw, but mock skipped required side effects
});
```

The mock removed behavior the test depended on.

**Good:**

```typescript
test('detects duplicate server', async () => {
  vi.mock('MCPServerManager'); // Mock only slow/external startup

  await addServer(config); // Config written
  await expect(addServer(config)).rejects.toThrow('already exists');
});
```

Gate check before mocking any method:

```
1. What side effects does the real method have?
2. Does this test depend on those side effects?
3. Can I mock a lower-level boundary instead?

If unsure, use the safest real/local implementation first, then add the smallest mock at the boundary.
Do not call destructive external services just to satisfy this check.
```

## Anti-Pattern 4: Incomplete Boundary Mocks

**Bad:**

```typescript
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  // Missing metadata that downstream code uses
};
```

Partial mocks hide assumptions and can pass while real integration fails.

**Good:**

```typescript
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 },
};
```

Use builders or fixtures with realistic defaults when full boundary structures are large.

## Anti-Pattern 5: Tests as Afterthought

Testing is part of implementation, not a follow-up phase.

```
1. Write failing test
2. Implement to pass
3. Refactor while green
4. Then claim complete
```

For bug fixes, first write a failing regression test that reproduces the bug. The test proves the fix and prevents the bug from returning.

## When Mocks Become Too Complex

Warning signs:

- Mock setup is longer than test logic
- Mocking everything to make the test pass
- Test breaks when the mock changes but behavior did not
- You cannot explain why the mock is needed

Prefer integration-style tests with real components when that is simpler and safe.

## Quick Reference

| Anti-pattern | Fix |
| --- | --- |
| Assert on mock elements | Test real behavior or unmock it |
| Test-only production method | Move cleanup/setup to test utilities |
| Mock without understanding | Understand side effects; mock the boundary |
| Incomplete boundary mock | Use realistic fixtures/builders |
| Tests after implementation | Restart with a failing test for the behavior |
| Over-complex mocks | Prefer integration-style tests |
