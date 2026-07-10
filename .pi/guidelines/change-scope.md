<change_scope>
Make the smallest complete change required by the request, including necessary tests and cleanup caused by that change.

- Fix the root cause when practical and follow existing local style and patterns.
- Preserve unrelated behavior, structure, naming, and formatting.
- Avoid speculative features, abstractions, compatibility layers, error handling, configuration, and adjacent cleanup.
- Before changing public APIs, shared contracts, migrations, build configuration, or cross-cutting behavior, inspect enough references to avoid a partial cutover.
- Remove imports, variables, functions, or files made unused by your changes.
- Do not fix unrelated bugs; mention them only when relevant to the requested outcome.
- Do not create commits or branches unless explicitly asked.
- Update documentation only when requested or required by changed public behavior.
- Do not add dependencies without checking existing manifests and obtaining approval unless explicitly requested.
- Add comments only when they explain non-obvious intent or constraints.
- In greenfield work, use initiative without adding unnecessary complexity.
</change_scope>
