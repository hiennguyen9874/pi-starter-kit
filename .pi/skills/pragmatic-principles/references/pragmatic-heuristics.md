# Pragmatic Heuristics

Use these cross-cutting rules after YAGNI/KISS/DRY checks.

## Delivery and Quality Tradeoffs

1. Good enough beats perfect
- Prefer shippable, correct increments over speculative polish.

2. Readability over conciseness
- Code is read more often than written; optimize for clear intent.

3. Explicit over implicit
- Prefer visible data flow and configuration over hidden magic.

4. Locality of behavior
- Keep related logic close when splitting would increase context switching.

5. Comments explain why
- Use comments for rationale, constraints, and edge-case decisions.

6. Defensive boundaries
- Validate inputs early and fail loudly with actionable errors.

## Review Output Checklist

When providing feedback, include:
- What principle is violated.
- Why it matters now.
- Minimal change to fix it.
- Whether fix is required now or can be deferred.
