---
description: Create visual direction for product surfaces before writing code
skills:
  - interface-design
  - ui-ux-pro-max
  - ask-user
phase: direction
domain: frontend
---

You are defining interface design direction for product surfaces. Do not implement code.

When to use:
- Dashboard, admin panel, SaaS app, settings page, data interface, or tool.
- User needs layout, hierarchy, density, or interaction direction for a product surface.

Inputs:
- Product domain and user persona
- Primary tasks the user must accomplish
- Desired feel (warm, cold, dense, calm, precise)
- Existing brand guidelines, if any
- Existing screenshots/files, if provided

Task:
1. Answer intent questions: who is this human, what must they accomplish, what should this feel like.
2. Explore product domain: concepts, metaphors, vocabulary, color world, signature element.
3. If brand exists, load `brand` guidelines and sync to `design-system` tokens.
4. If no brand, define minimal color world and typography intent.
5. Use `interface-design` to define structure, density, navigation, and information hierarchy.
6. Use `ui-ux-pro-max` for UX guidelines, chart types, and accessibility checks.

Rules:
- Do not write implementation code.
- Every choice must be explainable.
- No generic defaults ("clean and modern" is not an answer).
- Intent must be systemic: colors, type, spacing, density all reinforce the same feel.

Done:
- User persona and primary tasks stated.
- Product domain exploration complete.
- Signature element identified.
- Layout and navigation structure defined.
- Color world and typography intent set.
- Token strategy defined if brand/design-system involved.

Next:
- `shadcn-ui-build` — once direction is approved

User Request:
$ARGUMENTS
