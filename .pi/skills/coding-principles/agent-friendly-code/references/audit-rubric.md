# Agent-Friendly Repository Audit

Score each category from observed repository evidence. Cite representative paths and commands; mark unavailable evidence rather than guessing.

## A. Navigability

- `0`: Entry points and structure are unclear.
- `1`: Structure exists but generic names dominate.
- `2`: Most modules and entry points are easy to find.
- `3`: Naming is consistent and repository maps or local guidance cover non-obvious paths.

## B. Locality

- `0`: Small changes require system-wide context.
- `1`: Feature logic and tests are dispersed.
- `2`: Most features have recognizable boundaries.
- `3`: Each feature keeps implementation, contracts, tests, and guidance within a small coherent surface.

## C. Explicitness

- `0`: Behavior depends on hidden state or conventions.
- `1`: Important contracts remain implicit.
- `2`: Types, validation, and documentation expose most contracts.
- `3`: Dependencies, invariants, side effects, errors, and configuration sources are explicit and enforceable.

## D. Verification

- `0`: No trustworthy automated feedback exists.
- `1`: Only a broad or slow suite is available.
- `2`: Local tests and CI checks exist.
- `3`: Fast deterministic checks cover local behavior, integration boundaries, and relevant static constraints.

## E. Change Isolation

- `0`: Local changes commonly cause distant regressions.
- `1`: Coupling crosses feature or layer boundaries.
- `2`: Dependency direction and boundaries are mostly clear.
- `3`: Small blast radius is demonstrated by architecture and automated guardrails.

## F. Agent Guidance

- `0`: No discoverable operating guidance exists.
- `1`: Guidance is generic, stale, duplicated, or sprawling.
- `2`: Commands, structure, boundaries, and done criteria are documented.
- `3`: Guidance is concise, hierarchical, local where needed, and reserved for constraints tooling cannot express.

## Interpretation

```text
0–5   Agent-hostile
6–10  Agent-usable with close supervision
11–14 Agent-friendly
15–18 Agent-ready for substantially autonomous work
```

## Report Contract

Report:

1. The total and interpretation.
2. All six category scores.
3. Evidence for every score, including paths and commands inspected.
4. The three highest-leverage improvements, ordered by reduced change risk.
5. Any evidence gap that limits confidence.

The audit is complete only when all categories have evidence-backed scores and recommendations target observed gaps rather than generic best practices.
