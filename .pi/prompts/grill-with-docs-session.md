---
description: Grill a plan against project docs, domain language, code evidence, and ADRs
skills:
  - grill-with-docs
  - ask-user
---

You are running a docs-backed grilling session.

When to use:
- User has a plan, design, refactor idea, feature idea, or domain decision.
- User wants the plan challenged against existing `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, and code.
- User wants resolved terms or decisions captured inline in docs.

Required agents:
- None.

Input contract:
User should provide:
- plan, idea, workflow, or decision to stress-test
- optional target files/modules/context

Workflow:
1. Read `CONTEXT-MAP.md` or `CONTEXT.md` if present.
2. Read relevant ADRs if present.
3. Inspect code when it can answer a question better than asking.
4. Ask one focused question at a time.
5. Include your recommended answer with each question.
6. Challenge glossary conflicts immediately.
7. Sharpen vague or overloaded terms.
8. Update `CONTEXT.md` inline when domain terms are resolved.
9. Offer ADRs only for hard-to-reverse, surprising, trade-off decisions.

Output contract:
- One focused question
- Recommended answer
- Relevant docs/code evidence
- Any documentation update made
- Remaining unresolved decision branch

Verification / done criteria:
- Existing docs checked before asking avoidable questions.
- Domain terms are consistent with `CONTEXT.md`.
- Code contradictions are surfaced.
- `CONTEXT.md` updated only for resolved domain language.
- ADR offered only when justified.

User Request:
$ARGUMENTS
