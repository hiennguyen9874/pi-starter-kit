---
description: Diagnose and fix a bug, failing test, broken behavior, or performance regression
skills:
  - diagnose
  - systematic-debugging
  - test-driven-development
---

You are diagnosing a bug.

Task:
1. Read the user report carefully.
2. Identify the exact symptom.
3. Build a fast feedback loop before attempting a fix.
4. Reproduce the issue.
5. Generate 3-5 ranked hypotheses.
6. Test hypotheses one at a time.
7. Instrument only where it distinguishes hypotheses.
8. Fix only after root cause is understood.
9. Add a regression test if a correct seam exists.
10. Re-run the original repro and relevant tests.
11. Remove temporary debug instrumentation.
12. Report the root cause and verification evidence.

Do not:
- Patch based on guesses.
- Increase timeouts blindly.
- Claim fixed without reproducing first.
- Leave debug logs or throwaway scripts unless explicitly documented.

User Request:
$ARGUMENTS