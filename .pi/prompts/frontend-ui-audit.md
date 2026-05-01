---
description: Audit frontend UI, UX, accessibility, and code quality
skills:
  - web-design-guidelines
phase: audit
domain: frontend
---

You are auditing frontend UI. Do not implement fixes.

When to use:
- User asks review, audit, accessibility check, UX critique, visual polish list, shadcn review, or React frontend quality review.
- Pre-launch quality gate or post-implementation review.

Inputs:
- Files/routes/diff/screenshots
- Optional design brief or acceptance criteria
- Optional focus area (visual, a11y, performance, shadcn, React)

Task:
1. Determine scope and surface type (marketing → `frontend-skill`, product → `interface-design`).
2. If no files specified, ask for files/routes.
3. Fetch latest Web Interface Guidelines (`web-design-guidelines`).
4. Inspect files systematically:
   - Visual design: hierarchy, spacing, typography, color, motion (`frontend-skill` / `interface-design`)
   - Accessibility: contrast, focus, alt text, labels, keyboard nav (`ui-ux-pro-max`)
   - shadcn/ui: composition rules, semantic tokens, form patterns (`shadcn-best-practices`)
   - React: waterfalls, bundle, rerenders, hydration (`react-best-practices`)
   - Component architecture: prop proliferation, composition (`composition-patterns`)
5. Report only grounded findings with file:line evidence.
6. Prioritize by user impact:
   - Critical: breaks functionality, blocks users, violates accessibility law
   - High: significantly degrades experience
   - Medium: noticeable friction
   - Low: polish, nice-to-have

Rules:
- Do not implement fixes during audit.
- Cite evidence for every finding.
- Separate critical from optional polish.
- No speculative redesign.

Done:
- Findings cite evidence with file:line references.
- Critical issues separated from optional polish.
- Scope-appropriate checks performed (marketing vs product).
- No fixes applied.

Next:
- `frontend-polish-pass` or `interface-polish-pass` — to address visual findings
- `react-performance-pass` — to address performance findings
- `react-component-api-refactor` — to address architecture findings

User Request:
$ARGUMENTS
