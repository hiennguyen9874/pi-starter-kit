# Reversibility

There are no final decisions. Treat technology and architecture choices as commitments made with current evidence, then keep the cost of plausible change proportional to the change.

## Decision Process

1. **Name the decision and assumptions.** Separate durable problem-domain knowledge from details likely to change.
2. **Describe a plausible reversal.** State what would replace the choice and list the components that would change today.
3. **Measure the consequence.** Look for volatile details spread through domain logic, configuration, tests, and deployment.
4. **Choose proportional optionality.** Use a stable interface, configuration, metadata, or delayed decision when it materially bounds that consequence.
5. **Commit at the supported level.** Record the current choice and the evidence that would justify revisiting it.

Completion means one plausible reversal has a bounded, explainable change path and the cost of preserving that path is justified.

## Stable Abstractions, Movable Details

Put abstractions in code and details in metadata. Technology choices, policy values, and deployment-specific facts belong outside core logic when they vary independently. Long-running systems may need to reload such configuration; short-lived programs may apply it at startup.

A useful boundary:

- speaks in the problem domain;
- contains dependency-specific behavior on one side;
- has tests against the boundary's contract;
- keeps the dependency's data shapes and vocabulary from leaking through.

Configuration and metadata are software surfaces: validate, version, test, and observe them.

## Proportionality

Optionality has design, maintenance, and debugging costs. Preserve it where a plausible change would have broad or expensive consequences. Accept a direct choice where replacement is local and cheap. The target is a deliberate tradeoff, not maximum abstraction.

When evidence is too weak to choose a costly path, use [a tracer bullet or prototype](tracer-bullets.md) to learn before committing.
