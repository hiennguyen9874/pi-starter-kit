# Tracer Bullets and Prototypes

Both techniques reduce uncertainty. A **tracer bullet** finds the target by exercising the whole path; a **prototype** learns about one risky aspect.

## Choose the Experiment

| Question | Tracer bullet | Prototype |
|---|---|---|
| What is uncertain? | How the application hangs together or whether it meets the target | One architecture, algorithm, tool, data shape, performance risk, or interface |
| Scope | Thin path from a requirement through the major system layers | Only enough of one aspect to answer a question |
| Result | Lean, complete skeleton retained in the final system | Learning and a decision |
| Code fate | Keep and extend | Discard |

Make the choice explicit before coding. Completion means the uncertainty, experiment type, code fate, and success signal are written down.

## Tracer Bullet

Build something that moves from a requirement to a visible aspect of the final system quickly and repeatably:

1. Select one representative user-visible path.
2. Connect every required layer with the thinnest retained implementation.
3. Run it through the real integration path and show it to users or stakeholders.
4. Compare the observed result with the target.
5. Adjust and fire again until the path supplies useful feedback.

A tracer provides a structure for developers, an integration platform, an early demonstration, and evidence of progress. Keep the retained code at the project's quality bar for its narrow scope.

Completion means one real path works end to end, can be repeated, and has produced feedback about both the target and the integration structure.

## Prototype

Prototype to expose risk cheaply:

1. State one question the prototype must answer.
2. Isolate the risky aspect.
3. Ignore production details unrelated to that question—such as completeness, robustness, or style.
4. Run the experiment and record observations.
5. Make the resulting decision, then discard the prototype code.

Prototype candidates include architecture, unfamiliar functionality, external data, third-party tools, performance, and user-interface design.

Completion means the named question is answered with evidence, the decision is recorded, and no disposable code enters the retained implementation.

## Failure Modes

- A tracer that spans only one component supplies no end-to-end aim; extend it through the missing layers.
- A tracer that grows broad before feedback arrives loses its advantage; narrow it to one path.
- A prototype retained as a foundation converts deliberate shortcuts into hidden debt; rebuild from the learning.
- An experiment with no explicit question or success signal produces activity rather than evidence; define the decision it must unlock.
