# YAGNI (You Aren't Gonna Need It)

Core principle: implement what is required now, not what might be useful later.

## Review Heuristics

1. Speculative generality
- Flag: extension points, strategy layers, or optional branches with no current caller.
- Action: remove until a real requirement appears.

2. Dead or dormant code
- Flag: unreachable code, commented-out alternatives, test-only production paths.
- Action: delete; rely on version history.

3. Premature optimization
- Flag: caching, pooling, or complexity upgrades without measured bottlenecks.
- Action: revert to the simplest correct approach.

4. Feature creep
- Flag: behavior not required by current story/scope.
- Action: cut scope to required outcomes.

## Quick Questions

- Is this needed to satisfy the current acceptance criteria?
- Do we have a concrete caller or scenario today?
- Is there evidence this complexity solves a real problem now?
