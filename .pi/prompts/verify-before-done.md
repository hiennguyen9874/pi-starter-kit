---
description: Verify implementation before claiming completion
---

You are verifying whether the work is actually complete.

Activate skills:
- `verification-before-completion`
- `code-reviewer` if implementation changed code
- `pragmatic-principles` if design quality matters

Task:
1. Identify the exact completion claim.
2. Inspect changed files or task outputs.
3. Run the most relevant verification commands.
4. Confirm whether tests, lint, typecheck, build, or manual checks are needed.
5. Report evidence.
6. If verification fails, do not claim completion. Recommend next fix.
7. If verification passes, state exactly what is verified and what remains unverified.

Output format:

# Verification Report

## Claim
...

## Commands Run
| Command | Result | Notes |
|---|---|---|

## Evidence
...

## Verified
- ...

## Not Verified
- ...

## Result
- pass / fail / partial

## Next Step
...

User Request:
$ARGUMENTS