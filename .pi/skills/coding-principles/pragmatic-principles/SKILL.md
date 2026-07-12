---
name: pragmatic-principles
description: Apply the Pragmatic Programmer's meta-principles — DRY, orthogonality, tracer bullets, design by contract, broken windows, reversibility, estimation. Use when the user mentions "pragmatic", "best practices", "software craftsmanship", "technical debt", "tracer bullet", "broken windows", "orthogonality", "DRY", or asks how to design or evaluate a system for changeability, decoupling, or reversibility.
---

# Pragmatic Principles

Meta-principles from Hunt & Thomas' *The Pragmatic Programmer* for systems that are easy to change, easy to understand, and easy to trust. This is reference: scan the seven entries, apply the one the situation names, and reach the linked file only when you need depth.

## The Seven Principles

**DRY** — every piece of *knowledge* has a single, unambiguous, authoritative representation. DRY is about knowledge and intent, not textual similarity: two identical blocks serving different business rules are not duplication. Comments that restate code violate DRY — explain *why*, not *what*. → [references/dry-orthogonality.md](references/dry-orthogonality.md) for the four duplication types and how to detect violations.

**Orthogonality** — a change in one component does not affect others. Ask "if I dramatically change the requirements behind this function, how many modules are affected?" — the answer should be one. Global state couples everyone to everyone; eliminate it. → [references/dry-orthogonality.md](references/dry-orthogonality.md) for the change-impact test, layered architecture, and the helicopter analogy.

**Tracer bullets** — a thin but complete end-to-end slice (UI → API → DB) that you *keep*, versus a prototype you *throw away*. Use a tracer when requirements are vague or the architecture is unproven; if it misses, adjust and fire again. Never let a prototype become production code. → [references/tracer-bullets.md](references/tracer-bullets.md).

**Design by contract** — preconditions (caller's responsibility), postconditions (the routine's guarantee), invariants (always true). When a contract is violated, crash early and loudly — dead programs tell no lies. Use assertions for what should never happen, error handling for what might. → [references/contracts-assertions.md](references/contracts-assertions.md).

**Broken windows** — one unrepaired bad design, wrong decision, or "fix it later" hack starts the rot; entropy accelerates once neglect shows. Fix a broken window immediately, or board it up (a tracked TODO, a disabled feature, a stub). The first hack is the most expensive — it gives permission for all the rest. → [references/broken-windows.md](references/broken-windows.md).

**Reversibility** — there are no final decisions. Build so changing the database, framework, or vendor is proportional to the scope of change, not a rewrite. Abstract third-party APIs behind your own interfaces; the forking-road test: could you switch Postgres → DynamoDB in a week? Add flexibility only with concrete evidence you'll need it — YAGNI applies to abstraction too. → [references/reversibility.md](references/reversibility.md).

**Estimation** — give ranges with confidence ("1–3 weeks"), not single points. PERT = (Optimistic + 4×Most Likely + Pessimistic) / 6; decompose into components and sum for accuracy; keep an estimation log and calibrate against actuals. Manage learning like a portfolio: invest regularly, diversify, rebalance. → [references/estimation-portfolio.md](references/estimation-portfolio.md).

## Quick Diagnostic

Seven questions — each "no" names the failing principle and its fix.

| Question | Failing principle | Fix |
|---|---|---|
| Can I change the database without touching business logic? | Orthogonality | Introduce a repository/adapter layer |
| Is every business rule defined in exactly one place? | DRY | Find the authoritative source; remove duplicates |
| Do I have an end-to-end slice working? | Tracer bullets | Build one vertical slice before expanding |
| Are preconditions and invariants enforced at boundaries? | Design by contract | Add guards/assertions; crash on violation |
| Would a new developer call this codebase "clean"? | Broken windows | Fix or board up the worst window now |
| Can I roll back this deployment in under 5 minutes? | Reversibility | Add feature flags or blue-green deploys |
| Do my estimates include ranges and confidence? | Estimation | Switch to PERT or range-based estimates |

Count "yes" answers out of 7. State the score, name the failing rows, and give the fix from the table.
