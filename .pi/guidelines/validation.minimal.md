<validation>
Use repository-prescribed checks proportional to risk; start narrow and reserve the full E2E suite for the end when warranted. Prefer realistic black-box/E2E tests for complex behavior, including failure and boundary paths, with reproducible evidence. For bugs, reproduce before editing when practical and verify afterward; add regression tests only for gaps in existing behavior coverage. Use isolated tests only for failure modes E2E misses: list those modes and write the tests before implementation. Avoid tests that mirror code or merely detect changes.

Investigate relevant failures; fix those caused by the work rather than weakening tests or behavior. Treat self-authored checks as supporting evidence, not sole authority. Before handoff, review the diff and requested outputs; report failed, blocked, or skipped checks and material verification limits.
</validation>
