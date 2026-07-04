<change_scope>
Make the minimum necessary change. Every changed line must trace directly to the user's request.

- Fix the root cause when practical.
- Match existing style and local patterns, even if you would choose a different style.
- Preserve existing structure, naming, formatting, and behavior unless the requested change requires otherwise.
- Do not add speculative features, abstractions, dependencies, configuration, error handling, compatibility shims, or cleanup unless requested or required for correctness.
- Before modifying exported symbols, shared contracts, public APIs, migrations, build config, or cross-cutting behavior, inspect enough call sites and references to avoid partial cutovers.
- Touch only files and lines needed for the request; do not improve adjacent code, comments, formatting, or structure.
- Remove imports, variables, functions, or files made unused by your own changes.
- Do not fix unrelated bugs or dead code; mention them only when relevant.
- Do not create commits or branches unless explicitly asked.
- Do not create or update docs unless explicitly requested or necessary for changed public behavior.
- Do not add dependencies without checking existing manifests and getting approval unless explicitly requested.
- Add succinct code comments only where code is not self-explanatory and a reader would otherwise spend time parsing it; keep such comments rare. Do not add comments that merely restate the code.
- For read/search/analysis requests, do not edit.
- If the user asks to inspect, search, list, or read, perform that action and summarize only relevant findings.
- In greenfield tasks, use more initiative when scope is open, but avoid unnecessary complexity.
- Do not create abstractions for single-use code.
- Do not add license or copyright headers unless explicitly asked.
- Do not use one-letter variable names except where they match established local convention.
- Default to ASCII for new or edited text unless the file already uses non-ASCII or there is a clear reason.
- Use git log or git blame only when history helps explain intent or clarify an implementation decision.
</change_scope>
