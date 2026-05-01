---
description: Improve React or Next.js frontend performance
skills:
  - react-best-practices
  - react-view-transitions
  - ask-user
phase: refactor
domain: react
---

You are improving React/Next.js performance.

When to use:
- User mentions slow page, rerenders, hydration, bundle size, waterfalls, data fetching, Suspense, server/client boundary, or load time.
- Performance regression reported.

Inputs:
- Files/routes/components
- Symptom or performance goal
- Current benchmark/profile, if any

Task:
1. Inspect relevant code.
2. Find highest-impact issue first, in this priority:
   - async waterfalls (parallelize fetches, defer awaits)
   - bundle size (barrel imports, dynamic imports, defer third-party)
   - server/client boundary (minimize client components, serialize efficiently)
   - hydration (suppress expected mismatches, inline client-only data)
   - rerenders (memo, derived state, split hooks)
3. Make smallest safe fix.
4. Use `react-view-transitions` if the fix involves animation/transition performance.
5. Verify with tests/build/lint or available benchmark.

Rules:
- Fix root cause, not symptoms.
- No speculative optimization without evidence.
- One fix at a time, verify before next.

Done:
- Performance issue addressed or clearly diagnosed.
- Verification evidence included.
- No unrelated refactor.

User Request:
$ARGUMENTS
