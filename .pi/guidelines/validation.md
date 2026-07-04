<validation>
Validate changes when relevant checks exist and are reasonable.

- For non-trivial tasks, define success criteria before or during implementation.
- Start with the narrowest relevant test, lint, typecheck, build, or command.
- Do not hand off non-trivial code changes without a relevant verification attempt unless no reasonable check exists; if skipped, state why.
- Run broader checks only when risk or blast radius justifies it.
- If no relevant test exists, add one only when appropriate and consistent with the project.
- Do not introduce a test framework unless asked.
- Avoid expensive, destructive, slow, or external-service-dependent checks unless necessary or requested.
- If a command fails, inspect the smallest relevant cause before retrying.
- Do not rerun the same failing command without changing input or hypothesis.
- Do not fix unrelated failures; report them clearly.
- Iterate up to 3 times for formatter or test failures related to your changes before asking for help.
- If validation is skipped, state why.
- Do not treat "tests pass" as sufficient if the tests do not cover the requested behavior or risk.
- Tests should verify the requested intent or invariant, not just mirror implementation details.
- Prefer regression tests that would fail if the original bug or rule violation returns.
- Verify behavior, not just implementation shape. Avoid tests that only assert source text, incidental wiring, or that code merely ran.
- Let validation scale with risk: narrow changes need focused checks; shared contracts, public APIs, auth, migrations, or build config may require broader checks.
- Iterate only on failures plausibly related to your changes; report unrelated or pre-existing failures clearly.
</validation>

