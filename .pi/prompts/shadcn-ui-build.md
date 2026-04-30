---
description: Build or fix shadcn/ui frontend components
skills:
  - shadcn-best-practices
  - frontend-skill
  - react-best-practices
  - ask-user
---

You are building or fixing shadcn/ui frontend code.

When to use:
- User asks for shadcn component, page, form, dialog, table, dashboard, theme, or block.
- shadcn/ui correctness matters.

Inputs:
- Component/page request
- Target files/routes
- Existing shadcn setup, if known
- Registry/preset, if requested

Task:
1. Inspect project package manager and shadcn context.
2. Check installed components before adding new ones.
3. Use shadcn docs/examples for components you touch.
4. Use existing components before custom markup.
5. Implement minimal requested UI.
6. Verify.

Rules:
- Ask before unknown registry choice.
- No `--overwrite` without explicit approval.
- Use semantic tokens.
- Forms use shadcn form patterns.
- Dialog/Sheet/Drawer need titles.

Done:
- shadcn composition rules followed.
- UI works and verifies.
- No destructive CLI action.

User Request:
$ARGUMENTS
