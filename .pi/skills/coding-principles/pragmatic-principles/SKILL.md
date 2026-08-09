---
name: pragmatic-principles
description: Apply pragmatic coding decisions. Use when a task has a material DRY, orthogonality, contract/assertion, tracer-bullet/prototype, reversibility, or broken-window tradeoff; use estimation only when the user explicitly requests a duration, cost, or schedule.
---

# Pragmatic Principles

Apply the relevant principle as a decision tool, not as a slogan.

## Process

1. Identify the material tradeoffs required to complete the requested task and open only the matching references below. The step is complete when each relevant tradeoff maps to a branch.
2. State the concrete repository evidence: the duplicated knowledge, coupling, uncertainty, assumption, defect, decision, or estimate at issue. The step is complete when the claim is specific enough to test.
3. Make the smallest in-scope change that addresses the root issue. Record an alternative only when the choice is consequential or non-obvious.
4. Run the branch's verification and relevant project checks. The step is complete when each in-scope issue is fixed and each unresolved risk is reported without expanding the task.

## Branches

| Branch | Reach when | Governing question | Reference |
|---|---|---|---|
| **DRY** | One fact or rule has multiple representations | Must these representations change together? | [DRY and orthogonality](references/dry-orthogonality.md) |
| **Orthogonality** | A local change affects unrelated components | Which effect crosses a responsibility boundary? | [DRY and orthogonality](references/dry-orthogonality.md) |
| **Tracer bullets** | The whole system's path or target is uncertain | What is the thinnest retained end-to-end path? | [Tracer bullets and prototypes](references/tracer-bullets.md) |
| **Contracts** | Correctness depends on implicit assumptions or impossible states | What must callers provide, routines guarantee, and state preserve? | [Contracts and assertions](references/contracts-assertions.md) |
| **Broken windows** | The requested change would preserve, create, or spread a concrete defect | What must be repaired on the task's change path? | [Broken windows](references/broken-windows.md) |
| **Reversibility** | A volatile choice may become expensive to change | Which detail should sit behind a stable boundary or in metadata? | [Reversibility](references/reversibility.md) |
| **Estimation** | The user explicitly asks for duration, cost, or schedule | What accuracy is useful, and what model supports it? | [Estimation](references/estimation-portfolio.md) |
