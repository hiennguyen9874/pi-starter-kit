---
description: Build or fix shadcn/ui components and pages
skills:
  - shadcn-best-practices
  - react-best-practices
  - ask-user
phase: build
domain: frontend
---

You are building or fixing shadcn/ui frontend code.

When to use:
- User asks for shadcn component, page, form, dialog, table, dashboard, theme, or block.
- shadcn/ui correctness matters.
- Building marketing surfaces (landing pages) or product surfaces (dashboards, apps).

Inputs:
- Component/page request
- Target files/routes
- Existing shadcn setup, if known
- Registry/preset, if requested
- Design direction, if previously established

Task:
1. Inspect project package manager and shadcn context (`npx shadcn@latest info --json`).
2. Check installed components before adding new ones.
3. Use `shadcn-best-practices` for composition rules, forms, dialogs, tables, styling.
4. Use `react-best-practices` for async data fetching, Suspense boundaries, and performance.
5. Use `composition-patterns` for complex component architecture (compound components, context providers).
6. Use `frontend-skill` for marketing page hierarchy, hero rules, and motion.
7. Use `interface-design` for product UI density, navigation, and data presentation.
8. Implement minimal requested UI.
9. Verify with build/test/lint.

Rules:
- Ask before unknown registry choice.
- No `--overwrite` without explicit approval.
- Use semantic tokens (`bg-primary`, `text-muted-foreground`).
- Forms use `FieldGroup` + `Field` patterns.
- Dialog/Sheet/Drawer need `Title` (use `sr-only` if visually hidden).
- Use existing components before custom markup.
- Prefer `flex` with `gap-*` over `space-x-*` / `space-y-*`.

Done:
- shadcn composition rules followed.
- UI works and verifies.
- No destructive CLI action.
- Semantic tokens used throughout.

Next:
- `frontend-polish-pass` or `interface-polish-pass` — for visual refinement
- `frontend-ui-audit` — for quality review

User Request:
$ARGUMENTS
