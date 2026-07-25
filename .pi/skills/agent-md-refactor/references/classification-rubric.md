# Classification Rubric

Use this rubric to assign every instruction exactly one disposition. Classify meanings, not Markdown lines: keep a coherent block together when splitting it would lose context.

## Keep Resident

Keep guidance in root `AGENTS.md` when it is **load-bearing** and needed across nearly every task:

- safety-critical prohibitions and irreversible-action constraints;
- repository-wide gotchas or failure contracts;
- non-standard conventions where normal defaults or nearby code would mislead an agent;
- durable design rationale that affects changes throughout the repository;
- universal repository etiquette not enforced elsewhere;
- pointers that trigger loading task-specific instructions.

When uncertain whether a user-authored prohibition is safety-critical, keep it resident and surface the uncertainty.

## Disclose

Move load-bearing guidance to `docs/agent-instructions/` when it has a clear task trigger, such as work involving testing, releases, deployment, security-sensitive paths, generated code, a subsystem, or a non-standard workflow.

Disclose only retained guidance. A separate file is justified when it prevents unrelated tasks from paying for context they do not need; a single short rule may be clearer in root than behind an extra hop.

Each disclosed meaning has one authoritative file. Link to that home rather than paraphrasing the rule elsewhere.

## Delete

Delete content when a fresh session can recover it reliably with a few repository tool calls or when it does not change behavior:

- directory maps and file listings;
- technology, framework, or dependency inventories copied from manifests;
- standard commands or scripts plainly listed in manifests, task runners, CI, or `--help`;
- API signatures, schemas, and type definitions copied from source;
- architecture tours that only restate visible structure;
- generic practices such as writing clean code, handling errors, or adding appropriate tests;
- formatting, import, and lint rules already enforced mechanically;
- stale paths, obsolete commands, or superseded policy;
- semantic duplicates, including rephrasings in different files.

A command is not derivable when required flags, ordering, environment setup, or a surprising wrapper cannot be inferred reliably. Keep or disclose that non-standard information.

Do not move derivable content merely to make the root shorter. Delete it.

## Resolve

A contradiction requires user judgment only when the alternatives would materially change behavior, safety, output, or workflow. Quote both sides, identify their sources and loading scopes, explain the difference in one line, and recommend the shared, current, or more authoritative source when evidence supports one.

Ignore harmless differences in tone, specificity, or wording. Conditional rules are not contradictory when their scopes can be stated clearly.

Do not silently resolve uncertain canonical ownership between `AGENTS.md` and another checked-in instruction system.

## Evidence Rules

- Verify factual claims against current repository sources.
- Treat checked-in shared guidance as stronger evidence than personal or tool-local guidance, while respecting explicit user scope.
- Treat mechanically enforced configuration as the authority for the behavior it enforces.
- When evidence conflicts, report the conflict rather than inventing a synthesis.
- When unsure whether content is derivable or load-bearing, keep it provisionally and state what could not be verified.

## Final Accounting

Classification is complete only when:

- every original instruction has one disposition;
- every retained meaning has one authoritative home;
- every disclosed file has a task trigger;
- every deletion has a reproducible reason;
- every material contradiction is resolved or explicitly blocked.
