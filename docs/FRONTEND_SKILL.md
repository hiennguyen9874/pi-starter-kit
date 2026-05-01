# Skill Analysis & Workflow Guide (v2 — Post-Merge)

## Your 12 Skills Analyzed

| # | Skill | Type | Purpose |
|---|-------|------|---------|
| 1 | `composition-patterns` | React Architecture | Component composition, compound components, avoiding boolean prop hell |
| 2 | `frontend-skill` | Art Direction | Landing pages, marketing sites, hero sections, visual hierarchy, motion |
| 3 | `react-best-practices` | Performance | React/Next.js perf: async waterfalls, bundle size, re-renders, caching |
| 4 | `banner-design` | Graphic Design | Social media banners, ads, website heroes, print banners |
| 5 | `design-system` | Token System | Design tokens (primitive→semantic→component), CSS vars, component specs |
| 6 | `react-view-transitions` | Animation | React View Transition API, page transitions, shared element animations |
| 7 | `ui-ux-pro-max` | Design Reference | 50+ styles, 161 palettes, 57 fonts, 99 UX guidelines, 25 chart types |
| 8 | `brand` | Brand Identity | Voice, visual identity, messaging, asset management, color palettes |
| 9 | `shadcn-best-practices` | UI Implementation | **Merged skill:** shadcn/ui deep rules + Tailwind customization + canvas visual design |
| 10 | `web-design-guidelines` | Code Audit | Fetch Vercel guidelines, review UI code for compliance |
| 11 | `interface-design` | Product Design | Dashboards, admin panels, SaaS apps, data interfaces (NOT marketing) |
| 12 | `slides` | Presentation | HTML presentations with Chart.js, design tokens, responsive layouts |

---

## Merge History

### Deleted Skills

| Skill | Reason |
|-------|--------|
| `design` | Pure parent router with no implementation logic. Delegated to `brand`, `design-system`, `ui-styling`, `slides`, `banner-design`. Use sub-skills directly. |
| `ui-styling` | ~70% overlap with `shadcn-best-practices`. Merged unique content (Tailwind customization, responsive design, canvas design, scripts) into `shadcn-best-practices`. |

### Merged Skill: `shadcn-best-practices`

Previously `shadcn-best-practices` covered only shadcn/ui deep rules. Now includes:

| Source | Content Merged |
|--------|---------------|
| `shadcn-best-practices` (original) | 20+ enforceable rules, `FieldGroup`/`Field` patterns, CLI rules, presets, registries |
| `ui-styling` → | Tailwind `@theme` customization, responsive design patterns, utility reference |
| `ui-styling` → | Canvas visual design system (museum-quality composition, 90% visual / 10% text) |
| `ui-styling` → | `shadcn_add.py`, `tailwind_config_gen.py` scripts |
| `ui-styling` → | `canvas-fonts/` (54 font files) |

---

## Remaining Overlap Report (Post-Merge)

### 1. `frontend-skill` vs `ui-ux-pro-max` — Partial Overlap
**Severity: MEDIUM — Both cover "how it should look"**

| Aspect | `frontend-skill` | `ui-ux-pro-max` |
|--------|-----------------|-----------------|
| Focus | Art direction, premium feel, composition | Comprehensive design encyclopedia |
| Content | Visual thesis, content plan, interaction thesis | 50 styles, 161 palettes, 57 fonts, 99 guidelines |
| Decision-making | Opinionated ("one big idea", "cardless layouts") | Reference-based (searchable database) |
| Best for | Landing pages, marketing sites | Any UI/UX task needing style decisions |
| Stack coverage | Web focus | 10 stacks (React, Vue, Svelte, SwiftUI, RN, Flutter, etc.) |

**Verdict:**
- Landing page / marketing site with strong art direction? Use `frontend-skill`
- Need to pick colors, fonts, or verify UX patterns? Use `ui-ux-pro-max`
- Can use together: `frontend-skill` for direction, `ui-ux-pro-max` for specific token choices

---

### 2. `frontend-skill` vs `interface-design` — Territory Split
**Severity: LOW — Complementary, not duplicate**

| Skill | Territory | Example |
|-------|-----------|---------|
| `frontend-skill` | Marketing surfaces | Landing page, hero section, portfolio |
| `interface-design` | Product surfaces | Dashboard, admin panel, SaaS app, settings |

**Verdict:** No overlap. They are mutually exclusive territories. Use `frontend-skill` for marketing, `interface-design` for product UI.

---

### 3. `web-design-guidelines` vs `ui-ux-pro-max` — Different Modes
**Severity: LOW — Audit vs Design**

| Skill | Mode | Action |
|-------|------|--------|
| `web-design-guidelines` | Audit / Review | "Check my UI code against Vercel guidelines" |
| `ui-ux-pro-max` | Design / Build | "Design a new dashboard" |

**Verdict:** No real overlap. Use `web-design-guidelines` AFTER building to audit. Use `ui-ux-pro-max` DURING building to decide.

---

### 4. `design-system` vs `brand` — Pipeline Relationship
**Severity: LOW — Complementary pipeline**

| Skill | Output | Feeds Into |
|-------|--------|-----------|
| `brand` | Voice, colors, typography, logo usage | `design-system` |
| `design-system` | Tokens, component specs, CSS vars | `shadcn-best-practices` |

**Verdict:** Use in sequence: `brand` → `design-system` → implementation skill.

---

### 5. `shadcn-best-practices` vs `design-system` — Handoff Relationship
**Severity: LOW — Producer vs Consumer**

| Skill | Role | Direction |
|-------|------|-----------|
| `design-system` | Produces tokens, specs, CSS vars | → Consumed by |
| `shadcn-best-practices` | Implements UI with tokens | ← Consumes from |

**Verdict:** No overlap. `design-system` defines the system, `shadcn-best-practices` implements it.

---

### 6. `slides` vs `shadcn-best-practices` — Different Domains
**Severity: NONE — No overlap**

| Skill | Domain |
|-------|--------|
| `slides` | HTML presentations, Chart.js, copywriting formulas |
| `shadcn-best-practices` | shadcn/ui components, Tailwind, canvas design |

**Verdict:** Completely different purposes.

---

## Clean Skill Groupings

```
React Development (3 skills — all complementary)
├── composition-patterns     → Component architecture (compound components, context)
├── react-best-practices     → Performance optimization (async, bundle, re-render)
└── react-view-transitions   → Animations (View Transition API)

Visual Design (2 skills — choose based on surface type)
├── frontend-skill           → Marketing pages, landing pages, portfolios
└── interface-design         → Dashboards, admin panels, SaaS apps

Design Reference (1 skill — use during building)
└── ui-ux-pro-max            → Color palettes, fonts, styles, UX guidelines

Brand & System (2 skills — use in sequence)
├── brand                    → Voice, identity, colors, messaging
└── design-system            → Tokens, CSS vars, component specs

UI Implementation (1 skill)
└── shadcn-best-practices    → shadcn/ui + Tailwind + canvas visual design

Graphic & Presentation (2 skills)
├── banner-design            → Social/ads/web/print banners
└── slides                   → HTML presentations with Chart.js

Audit (1 skill — use after building)
└── web-design-guidelines    → Review code against Vercel guidelines
```

---

## Decision Workflow

### Step 1: What are you building?

```
┌─────────────────────────────────────────────────────────────┐
│  WHAT SURFACE ARE YOU BUILDING?                             │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼              ▼
Marketing  Product UI     Graphic       Presentation    Audit
(Landing)  (Dashboard)    (Banner)      (Slides)        (Review)
    │         │              │              │              │
    ▼         ▼              ▼              ▼              ▼
frontend-  interface-     banner-        slides       web-design-
skill      design         design                        guidelines
```

### Step 2: What technology decisions do you need?

```
┌─────────────────────────────────────────────────────────────┐
│  DO YOU NEED DESIGN DECISIONS (colors, fonts, styles)?      │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
   YES        NO
    │          │
    ▼          ▼
ui-ux-pro-max  Skip
(encyclopedia)
```

### Step 3: What React work are you doing?

```
┌─────────────────────────────────────────────────────────────┐
│  WHAT KIND OF REACT WORK?                                   │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
Component  Performance     Animations      Forms/UI
Architecture              (Transitions)
    │         │              │              │
    ▼         ▼              ▼              ▼
composition- react-best-   react-view-    shadcn-best-
patterns     practices     transitions    practices
```

### Step 4: Do you have brand guidelines?

```
┌─────────────────────────────────────────────────────────────┐
│  DO YOU HAVE BRAND GUIDELINES?                              │
└─────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
   YES        NO
    │          │
    ▼          ▼
Load from    Create with
brand skill  brand skill
    │          │
    └────┬─────┘
         ▼
   Sync to design-system
   (tokens, CSS vars)
```

---

## Recommended Skill Invocation Order

### Landing Page Project
```
1. brand (if new brand) OR load existing brand
2. frontend-skill (art direction, composition)
3. ui-ux-pro-max (color palette, font pairing decisions)
4. react-best-practices (if Next.js app)
5. react-view-transitions (if page transitions)
6. web-design-guidelines (final audit)
```

### Dashboard / SaaS App Project
```
1. brand (if needed)
2. interface-design (product domain exploration, intent)
3. design-system (tokens, component specs)
4. ui-ux-pro-max (UX guidelines, chart types)
5. shadcn-best-practices (implement UI)
6. composition-patterns (complex component architecture)
7. react-best-practices (performance)
8. web-design-guidelines (final audit)
```

### Banner / Social Media Project
```
1. brand (load guidelines)
2. banner-design (execute)
3. ui-ux-pro-max (if unsure about style direction)
```

### Presentation / Slides Project
```
1. brand (load guidelines)
2. design-system (tokens for consistent styling)
3. slides (create presentation)
```

---

## Quick Lookup Table

| User Says | Use This Skill |
|-----------|---------------|
| "Build a landing page" | `frontend-skill` |
| "Build a dashboard" | `interface-design` |
| "Design a banner" | `banner-design` |
| "Create a presentation" | `slides` |
| "Optimize React performance" | `react-best-practices` |
| "Refactor component props" | `composition-patterns` |
| "Add page transitions" | `react-view-transitions` |
| "Set up design tokens" | `design-system` |
| "Define brand voice" | `brand` |
| "Build UI with shadcn" | `shadcn-best-practices` |
| "What colors/fonts to use?" | `ui-ux-pro-max` |
| "Review my UI code" | `web-design-guidelines` |
| "Design a logo" | `brand` → extract colors → `design-system` |
| "Generate tailwind config" | `shadcn-best-practices` (merged script) |
| "Create canvas visual" | `shadcn-best-practices` (canvas design system) |

---

## Changelog

### v2 — Post-Merge (Current)
- **Deleted** `design` (pure router)
- **Deleted** `ui-styling` (merged into `shadcn-best-practices`)
- **Merged** `shadcn-best-practices` now includes: shadcn/ui rules + Tailwind customization + responsive design + canvas visual design + scripts + canvas-fonts
- **Cleaned** `design-system`: removed slide generation (now owned by `slides`)
- **Count**: 14 skills → 12 skills

### v1 — Pre-Merge (Original)
- 14 skills including `design` and `ui-styling` as separate entries
