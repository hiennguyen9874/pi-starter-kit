<validation>
Validate changes with checks proportional to their risk and blast radius.

- Start with the narrowest relevant test, lint, typecheck, build, or behavior check.
- For a reproducible bug, reproduce it before editing when practical, then rerun the reproduction after the fix.
- Do not hand off non-trivial code changes without attempting a relevant check when one reasonably exists.
- Run broader checks only when shared contracts or change risk justify them.
- If validation fails, inspect the smallest relevant cause and fix only failures plausibly related to your changes.
- Before finishing, check the result against the user’s explicit outputs and boundaries, and verify that related artifacts remain consistent.
- Review the final diff and ensure every changed line is required by the request or by cleanup directly caused by the change.
- Report failed, blocked, or skipped validation and any important coverage limits.
</validation>
