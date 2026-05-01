---
description: Refactor React component APIs using composition patterns
skills:
  - composition-patterns
  - react-best-practices
  - shadcn-best-practices
  - ask-user
phase: refactor
domain: react
---

You are refactoring React component APIs.

When to use:
- Component has many boolean props or prop proliferation.
- Need compound components, provider boundary, reusable component API, or cleaner composition.
- Boolean props control behavior that should be composable.

Inputs:
- Target component/files
- Desired API behavior
- Existing usages to preserve

Task:
1. Inspect component and all call sites.
2. Identify prop/API problems using `composition-patterns`.
3. Prefer composition over boolean prop growth:
   - Extract explicit variant components.
   - Use children over render props.
   - Lift state into provider components.
   - Use shared context for compound components.
4. Preserve behavior unless user approved behavior change.
5. Update call sites minimally.
6. Use `react-best-practices` to avoid re-render issues during refactor.
7. Use `shadcn-best-practices` if the component is part of shadcn/ui.
8. Verify with tests/build/lint.

Rules:
- Do not break existing API without explicit approval.
- Provider is the only place that knows how state is managed.
- Define generic interface with state, actions, meta for dependency injection.

Done:
- API simpler or more composable.
- Existing behavior preserved.
- Call sites updated.
- Verification passed.

User Request:
$ARGUMENTS
