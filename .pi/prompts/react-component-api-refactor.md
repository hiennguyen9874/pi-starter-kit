---
description: Refactor React component APIs using composition patterns
skills:
  - vercel-composition-patterns
  - react-best-practices
  - pragmatic-principles
  - verification-before-completion
  - ask-user
---

You are refactoring React component APIs.

When to use:
- Component has many boolean props.
- Need compound components, provider boundary, reusable component API, or cleaner composition.

Agents:
- None required.

Inputs:
- Target component/files
- Desired API behavior
- Existing usages to preserve

Task:
1. Inspect component and call sites.
2. Identify prop/API problems.
3. Prefer composition over boolean prop growth.
4. Preserve behavior unless user approved behavior change.
5. Update call sites minimally.
6. Verify.

## Changed Files
- `path` — summary

## Verification
- command:
- result:

Done:
- API simpler or more composable.
- Existing behavior preserved.
- Call sites updated.
- Verification passed.

User Request:
$ARGUMENTS
