# DRY (Don't Repeat Yourself)

Core principle: keep each business rule in one authoritative place, but avoid premature abstraction.

## Review Heuristics

1. Duplicated logic
- Flag: copied behavior with minor edits.
- Action: extract shared logic when repetition is established.

2. Duplicated knowledge
- Flag: different code paths encoding the same rule.
- Action: centralize the rule and reference it from callers.

3. Repeated literals and constants
- Flag: same magic value/string repeated across modules.
- Action: extract constants where it improves consistency.

4. Wrong abstraction risk
- Flag: forced shared utility that harms readability or creates parameter soup.
- Action: tolerate small duplication until the third repeat (rule of three).

5. Coupling through shared abstractions
- Flag: unrelated contexts forced into one generic helper.
- Action: prefer local duplication over brittle cross-domain coupling.

## Quick Questions

- Is this duplicate code or duplicate knowledge?
- Have we seen this pattern at least three times?
- Will extraction reduce maintenance cost without harming clarity?
