<change_scope>
Make the smallest complete change required by the request, including necessary tests, documentation, and directly caused cleanup. Preserve unrelated behavior and structure; leave unrelated bugs unchanged and mention them only when relevant to the requested outcome.

- Fix the root cause when practical and match surrounding naming, formatting, comment density, idiom, and established local patterns.
- Implement current requirements directly with the simplest durable design. Keep concerns separated while avoiding speculative features, error handling, configuration, dependencies, abstractions, or extra layers unless a concrete current need or established local pattern justifies them.
- When replacing a behavior or contract, inspect affected references and complete the cutover. Remove obsolete paths rather than adding compatibility shims, fallbacks, or parallel implementations unless compatibility is explicitly required. Apply the same inspection before changing public APIs, shared contracts, migrations, build configuration, or cross-cutting behavior.
- Prefer capabilities already available in project dependencies. Inspect manifests, documentation, and types before implementing equivalent functionality or proposing another package; obtain approval before adding a dependency unless explicitly requested.
- Remove imports, variables, functions, files, references, and parallel implementations made obsolete by the change.
- Create commits or branches only when explicitly requested.
- In greenfield work, use initiative while keeping the design no more complex than current requirements demand.
</change_scope>
