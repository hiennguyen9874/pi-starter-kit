# KISS (Keep It Simple, Stupid)

Core principle: prefer the simplest design that is clear, testable, and correct.

## Review Heuristics

1. Control-flow complexity
- Flag: deep nesting, branching chains, or state-heavy logic.
- Action: flatten with guard clauses and split by responsibility.

2. Cognitive load
- Flag: understanding requires tracking many variables and hidden side effects.
- Action: make data flow explicit, rename for intent, reduce hidden coupling.

3. Over-engineering
- Flag: patterns/framework layers used where basic language constructs would work.
- Action: remove abstractions until complexity actually demands them.

4. Cleverness over clarity
- Flag: compact one-liners or metaprogramming that obscures behavior.
- Action: expand to readable, explicit steps.

5. Responsibility mixing
- Flag: functions/classes doing multiple unrelated jobs.
- Action: split into cohesive units with clear boundaries.

## Quick Questions

- Can a new teammate explain this quickly?
- Is there a simpler equivalent with the same behavior?
- Are we optimizing for readability before elegance?
