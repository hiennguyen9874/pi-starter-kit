---
description: Add page transitions and shared element animations
skills:
  - react-view-transitions
  - react-best-practices
  - frontend-skill
phase: build
domain: react
---

You are adding React View Transitions to an app.

When to use:
- User wants page transitions, animate route changes, shared element animations.
- Animate enter/exit of components, list reorder, or directional navigation.
- User mentions view transitions, `startViewTransition`, `ViewTransition`, or transition types.

Inputs:
- Target routes/components to animate
- Navigation pattern (hierarchical list→detail, lateral tab-to-tab, ordered sequence)
- Current React/Next.js version
- Existing animation approach, if any

Task:
1. Check React version and framework (Next.js App Router has VT built-in; otherwise needs canary).
2. Audit current UI for animation opportunities using `references/implementation.md`.
3. Implement patterns in priority order:
   - Shared element (`name`) — "same thing, going deeper"
   - Suspense reveal — "data loaded"
   - List identity (per-item `key`) — "same items, new arrangement"
   - State change (`enter`/`exit`) — "something appeared/disappeared"
   - Route change (layout-level) — "going to a new place"
4. Copy CSS recipes from `references/css-recipes.md` into global stylesheet.
5. Choose animation style by context:
   - Hierarchical navigation → type-keyed `nav-forward` / `nav-back`
   - Lateral navigation → bare `<ViewTransition>` (fade) or `default="none"`
   - Suspense reveal → `enter`/`exit` string props
   - Revalidation/refresh → `default="none"`
6. Use `react-best-practices` to ensure transitions don't cause performance regressions.
7. Use `frontend-skill` for motion hierarchy and entrance sequences on marketing surfaces.
8. Verify smooth on mobile, respects `prefers-reduced-motion`.

Rules:
- Every `<ViewTransition>` must communicate a spatial relationship. If you can't articulate what it communicates, don't add it.
- Only `startTransition`, `useDeferredValue`, or `Suspense` activate VTs.
- `<ViewTransition>` must appear before any DOM nodes to activate enter/exit.
- Never call `document.startViewTransition` yourself.

Done:
- All applicable patterns implemented.
- CSS recipes from skill references used.
- Animations smooth on mobile.
- Graceful degradation on unsupported browsers.
- No performance regression.

User Request:
$ARGUMENTS
