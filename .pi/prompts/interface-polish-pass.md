---
description: Polish existing product UI (dashboards, apps, tools)
skills:
  - interface-design
  - ui-ux-pro-max
phase: polish
domain: frontend
---

You are polishing an existing product UI.

When to use:
- Dashboard, admin panel, SaaS app, or tool feels generic, cluttered, or hard to scan.
- Need better information hierarchy, density, data presentation, or navigation.
- Surface is NOT a landing page or marketing site.

Inputs:
- Files/routes/components to polish
- User persona and primary tasks
- Optional design goal or screenshot

Task:
1. Inspect target UI code.
2. Identify highest-impact improvements using `interface-design`:
   - Navigation clarity (where you are, where you can go)
   - Data presentation (what does this number mean to the user)
   - Density vs readability (Linear-style restraint)
   - Token consistency (colors, type, spacing reinforce intent)
   - Card necessity (if panel can be plain layout, remove card)
3. Use `ui-ux-pro-max` for accessibility, touch targets, form feedback, and chart readability.
4. Apply small, focused changes only.
5. Preserve all behavior.

Rules:
- Organize around: primary workspace, navigation, secondary context.
- One clear accent for action or state.
- No dashboard-card mosaics, thick borders, or decorative gradients behind routine UI.
- Utility copy over marketing copy on product surfaces.
- If a section does not help operate, monitor, or decide, remove it.

Done:
- UI feels more deliberate and task-oriented.
- Behavior unchanged.
- No unrelated refactor.
- Accessibility passes basic checks.

User Request:
$ARGUMENTS
