<validation>
Validate changes with checks proportional to their risk and blast radius.

- Start with the narrowest relevant test, lint, typecheck, build, or behavior check; run broader checks only when shared contracts or change risk justify them.
- For a reproducible bug, establish a red reproduction before editing when practical, then rerun it after the fix.
- Do not hand off non-trivial code changes without attempting a relevant check when one reasonably exists.
- When validation fails, investigate the smallest relevant cause and change only failures plausibly caused by the work.
- Before finishing, check every explicit user output and boundary and verify that related artifacts remain consistent.
- For a cutover, verify that obsolete references and implementations are gone.
- Review the final diff and account for every changed line as requested work or cleanup directly caused by it.
- Record failed, blocked, or skipped checks and material coverage limits.
</validation>
