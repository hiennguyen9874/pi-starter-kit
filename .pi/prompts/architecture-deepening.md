---
description: Find architecture deepening opportunities and explore one through an interactive design grilling loop
skills:
  - bootstrap-project-context
  - improve-codebase-architecture
  - grill-with-docs
  - pragmatic-principles
  - ask-user
---

You are improving codebase architecture through deepening opportunities.

When to use:
- User wants refactoring opportunities.
- User wants better seams, interfaces, locality, leverage, or testability.
- User wants architecture analysis informed by domain language and ADRs.
- User wants to explore one candidate interactively before implementation.

Required agents:
- None required.
- If an Explore subagent exists, use it for codebase exploration.
- If no Explore subagent exists, inspect files directly.

Input contract:
User should provide:
- target repo, module, feature area, or pain point
- optional constraints: avoid large rewrites, preserve APIs, focus tests, etc.

Workflow:
1. Read project instructions.
2. Read `CONTEXT.md` or `CONTEXT-MAP.md` if present.
3. Read relevant ADRs if present.
4. Explore representative code.
5. Identify shallow modules, weak seams, hidden coupling, poor locality, and hard test surfaces.
6. Present numbered deepening candidates.
7. Do not propose detailed interfaces yet.
8. Ask which candidate to explore.
9. For selected candidate, grill design one question at a time.
10. Update `CONTEXT.md` or offer ADRs only when decisions crystallize.

Output contract:
For each candidate include:
- Files
- Problem
- Proposed deepening
- Locality gain
- Leverage gain
- Test improvement
- Risk
- Verification strategy

Verification / done criteria:
- Existing domain language and ADRs were checked.
- Suggestions use architecture vocabulary: module, interface, implementation, depth, seam, adapter, leverage, locality.
- Recommendations are incremental, not rewrite-first.
- ADR conflicts are marked only when worth reopening.
- User has clear next step: choose candidate, write plan, or stop.

User Request:
$ARGUMENTS
