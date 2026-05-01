# Prompt Guide — Frontend, Design, UI, UX

This guide covers **9 workflow prompts** for frontend, design, UI, and UX work.

## How Prompts Work

Type what you want. The system matches your intent to a prompt, which then activates relevant **skills** and follows a structured workflow.

---

## Prompt Index

| # | Prompt | Phase | When to Use | Skills |
|---|--------|-------|-------------|--------|
| 1 | `frontend-design-direction` | direction | Landing page, portfolio, marketing site needs visual direction | `frontend-skill`, `ui-ux-pro-max` |
| 2 | `interface-design-direction` | direction | Dashboard, app, admin panel needs design direction | `interface-design`, `ui-ux-pro-max`, `brand`, `design-system` |
| 3 | `shadcn-ui-build` | build | Build or fix shadcn/ui components, pages, forms, dialogs | `shadcn-best-practices`, `react-best-practices`, `composition-patterns` |
| 4 | `react-view-transitions-build` | build | Add page transitions, shared element animations | `react-view-transitions`, `react-best-practices` |
| 5 | `frontend-polish-pass` | polish | Marketing UI feels generic, cluttered, or weak | `frontend-skill`, `ui-ux-pro-max` |
| 6 | `interface-polish-pass` | polish | Product UI needs density, navigation, data presentation fixes | `interface-design`, `ui-ux-pro-max` |
| 7 | `frontend-ui-audit` | audit | Review UI code for quality, accessibility, shadcn usage | `web-design-guidelines`, `shadcn-best-practices`, `react-best-practices`, `ui-ux-pro-max` |
| 8 | `react-component-api-refactor` | refactor | Component has too many boolean props, needs composition | `composition-patterns`, `react-best-practices` |
| 9 | `react-performance-pass` | refactor | Slow page, rerenders, bundle size, hydration issues | `react-best-practices`, `react-view-transitions` |

---

## Surface Type Decision

Before selecting a prompt, determine your surface type:

| Marketing Surface | Product Surface |
|-------------------|-----------------|
| Landing page | Dashboard |
| Portfolio | Admin panel |
| Hero section | SaaS app |
| Marketing site | Settings page |
| Brand page | Data interface |

Use `frontend-*` prompts for marketing. Use `interface-*` prompts for product.

---

## Workflow Chains

### Landing Page

```
frontend-design-direction
    → shadcn-ui-build
        → frontend-polish-pass
            → frontend-ui-audit
```

### Dashboard / SaaS App

```
interface-design-direction
    → shadcn-ui-build
        → interface-polish-pass
            → frontend-ui-audit
                → react-performance-pass (if needed)
```

### Component Refactor

```
react-component-api-refactor
    → frontend-ui-audit
        → react-performance-pass (if perf issues found)
```

### Animation Add-on

```
react-view-transitions-build
    → frontend-ui-audit
```

---

## Phase Definitions

| Phase | Purpose | Prompts |
|-------|---------|---------|
| **direction** | Decide before building | `frontend-design-direction`, `interface-design-direction` |
| **build** | Implement new code | `shadcn-ui-build`, `react-view-transitions-build` |
| **polish** | Improve existing UI | `frontend-polish-pass`, `interface-polish-pass` |
| **refactor** | Restructure code | `react-component-api-refactor`, `react-performance-pass` |
| **audit** | Review without editing | `frontend-ui-audit` |

---

## Quick Selection

| You Want To... | Use |
|----------------|-----|
| Design a landing page | `frontend-design-direction` |
| Design a dashboard | `interface-design-direction` |
| Build UI components | `shadcn-ui-build` |
| Add page animations | `react-view-transitions-build` |
| Polish marketing UI | `frontend-polish-pass` |
| Polish product UI | `interface-polish-pass` |
| Audit UI quality | `frontend-ui-audit` |
| Refactor component props | `react-component-api-refactor` |
| Fix slow React app | `react-performance-pass` |

---

## What Changed Recently

- **New**: `interface-design-direction`, `interface-polish-pass`, `react-view-transitions-build`
- **Merged**: `ui-styling` content into `shadcn-best-practices`
- **Deleted**: `design` skill (pure router, no unique logic)
- **All prompts** now distinguish marketing (`frontend-skill`) from product (`interface-design`) surfaces
