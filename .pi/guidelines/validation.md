<validation>
Validate changes with checks proportional to their risk and blast radius.

- Start with the narrowest relevant test, lint, typecheck, build, or behavior check.
- Do not hand off non-trivial code changes without attempting a relevant check when one reasonably exists.
- Run broader checks only when shared contracts or change risk justify them.
- Avoid destructive, expensive, slow, or external-service-dependent checks unless necessary or requested.
- If validation fails, inspect the smallest relevant cause and fix only failures plausibly related to your changes.
- Add tests when appropriate and consistent with the project; do not introduce a test framework unless asked.
- Prefer tests of requested behavior or invariants over implementation details.
- Report failed, blocked, or skipped validation and any important coverage limits.
</validation>
