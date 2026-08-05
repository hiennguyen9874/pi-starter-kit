<validation>
Validate changes with checks proportional to their risk and blast radius.

- Start with the narrowest relevant test, lint, typecheck, build, or behavior check; run broader checks only when shared contracts or change risk justify them.
- For a reproducible bug, establish a red reproduction before editing when practical, then rerun it after the fix.
- Do not hand off non-trivial code changes without attempting a relevant check when one reasonably exists.
- If validation fails, inspect the smallest relevant cause and fix only failures plausibly related to the change.
- Before finishing, check every explicit user output and boundary and verify that related artifacts remain consistent.
- When replacing a path or contract, verify that obsolete references and parallel implementations have been removed.
- Review the final diff and account for every changed line as requested work or cleanup directly caused by it.
- Report failed, blocked, or skipped validation and any material coverage limits.
</validation>
