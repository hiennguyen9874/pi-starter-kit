<validation>
Validate changes with checks proportional to their risk and blast radius.

- Discover the repository’s canonical validation commands from its scripts, configuration, and instructions. Start with the narrowest relevant check, then run the complete relevant test target unmodified; broaden further when shared contracts or risk justify it.
- For a reproducible bug, establish a red reproduction before editing when practical, then rerun it after the fix.
- Do not hand off non-trivial code changes without attempting a relevant check when one reasonably exists.
- Exercise the implicated happy, error, negative, edge, and boundary paths. For boundary values, compare plausible conventions explicitly and justify the selected one from the request and established contract.
- Treat self-authored tests and throwaway checks as supporting evidence, not the sole definition of correctness. Reconcile them with existing tests, callers, types, and observed behavior before changing production code to satisfy them.
- Treat a related failing test as unresolved evidence. Investigate it rather than narrowing, disabling, or weakening the test or implementation to manufacture a passing run; fix only causes plausibly related to the work.
- Before finishing, check every explicit user output and boundary and verify that related artifacts remain consistent.
- For a cutover, verify that obsolete references and implementations are gone.
- Review the final diff and account for every changed line as requested work or cleanup directly caused by it.
- Report failed, blocked, or skipped checks and material coverage limits.
</validation>
