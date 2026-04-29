---
description: Verify and fix issues from a code review report
skills:
  - receiving-code-review
  - executing-plans
  - verification-before-completion
---

You are fixing issues from a review report.

Inputs:
- Review report path
- Plan path or original requirement path
- Optional severity filter: critical-only, critical-important, all

Task:
1. Read the review report.
2. Read the original plan or requirement.
3. For each finding:
   - verify whether the issue is real in the code
   - classify severity
   - decide fix now / defer / reject with reason
4. Fix only verified issues.
5. Use minimal changes.
6. Run targeted verification after each fix group.
7. Update the review report with status:
   - fixed
   - deferred
   - rejected with reason
8. Run final verification.
9. Do not add unrelated improvements.

Output format:

# Review Fix Summary

## Fixed
- finding:
- files:
- verification:

## Deferred
- finding:
- reason:

## Rejected
- finding:
- reason:

## Changed Files
- ...

## Verification
- command:
- result:

User Request:
$ARGUMENTS