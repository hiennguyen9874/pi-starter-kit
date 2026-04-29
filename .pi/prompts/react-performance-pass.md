---
description: Improve React or Next.js frontend performance
skills:
  - react-best-practices
  - verification-before-completion
  - ask-user
---

You are improving React/Next.js performance.

When to use:
- User mentions slow page, rerenders, hydration, bundle size, waterfalls, data fetching, Suspense, server/client boundary, or load time.

Inputs:
- Files/routes/components
- Symptom or performance goal
- Current benchmark/profile, if any

Task:
1. Inspect relevant code.
2. Find highest-impact issue first:
   - async waterfalls
   - bundle size
   - server/client boundary
   - hydration
   - rerenders
3. Make smallest safe fix.
4. Verify with tests/build/lint or available benchmark.

Done:
- Performance issue addressed or clearly diagnosed.
- No speculative optimization.
- Verification evidence included.

User Request:
$ARGUMENTS
