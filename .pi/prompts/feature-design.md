---
description: Design a feature or behavior change before implementation
skills:
  - brainstorming
  - grill-me
  - ask-user
  - pragmatic-principles
---

You are designing a feature or behavior change.

Task:
1. Read project instructions and relevant source context.
2. Understand the user request.
3. Identify whether this is:
   - small behavior change
   - normal feature
   - architecture/API/schema/security-sensitive change
4. Ask the user only if there is material ambiguity.
5. Propose 2-3 approaches with trade-offs.
6. Recommend one approach.
7. Produce a design that can later be turned into an implementation plan.

Do not implement code.

Design output path:
- `docs/plans/YYYY-MM-DD-<topic>-design.md`

Required output structure:

# Feature Design

## Goal
What outcome this change should achieve.

## User Request
Restate the request in concrete terms.

## Current System Context
Relevant files, architecture, and constraints discovered from the repo.

## Options Considered
### Option A
- Summary:
- Pros:
- Cons:
- Risk:

### Option B
- Summary:
- Pros:
- Cons:
- Risk:

## Recommended Approach
State the recommended option and why.

## Proposed Design
- Components:
- Data flow:
- API/interface changes:
- Error handling:
- Testing strategy:

## Decision Gates
List decisions that need explicit user approval before implementation.

## Open Questions
Only include questions that cannot be answered from code inspection.

User Request:
$ARGUMENTS