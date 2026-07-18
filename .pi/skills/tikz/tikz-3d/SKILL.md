---
name: tikz-3d
description: Create projected 3D TikZ figures, tensor boxes, spatial geometry, and PGFPlots 3D data plots.
---

# TikZ 3D

Use **projection** as the leading word: establish the 3D-to-2D view and visibility before drawing detail.

## 1. Fix the visual contract

List each object, its dimensions and labels, the intended view, which relationships need spatial depth, and the requested source and rendered artifacts. Keep computational flow, residual paths, and other logical relationships as 2D nodes unless their tensor shape is itself meaningful.

Choose one branch:

- Schematic solids, tensors, planes, or fixed-perspective technical figures: define TikZ `x`, `y`, and `z` basis vectors.
- Rotatable geometric figures, vectors, or spherical coordinates: use `tikz-3dplot` and set `\tdplotsetmaincoords`.
- Surfaces, meshes, point clouds, or measured 3D data: use a `pgfplots` `axis` with `view={azimuth}{elevation}`.
- Dense physical meshes or scenes needing automatic hidden-surface removal: produce or request a vector export from a 3D tool rather than simulating it in TikZ.

Read [`REFERENCE.md`](REFERENCE.md) when starting a projected tensor box, `tikz-3dplot` geometric figure, or PGFPlots surface, or when package syntax needs confirmation.

**Completion:** every object has an intentional representation, view, and visual role; the selected branch fits the figure's data rather than its appearance alone.

## 2. Establish the projection

For projected solids, declare the basis at `tikzpicture` scope, for example:

```latex
x={(1cm,0cm)},
y={(0.42cm,0.24cm)},
z={(0cm,1cm)}
```

Name every reusable vertex and connector anchor. Calculate parameterized box bounds with `\pgfmathsetmacro` before creating coordinates; expose at least `-west`, `-east`, and `-center` anchors for components that connect to other components. Map tensor dimensions comparatively: preserve trends such as decreasing spatial resolution or increasing channels, not literal physical scale.

For reusable components, define colors and styles once and draw the front, side, and top faces as separate paths. Load only the needed libraries; common choices are `arrows.meta`, `calc`, `positioning`, `backgrounds`, and `fit`.

**Completion:** each position is derived from the chosen projection or a named anchor, repeated components share one definition, and every connection endpoint exists.

## 3. Paint visibility deliberately

TikZ uses painter's order, not a depth buffer. Draw hidden edges first with a subdued dashed style, then back faces, visible faces, outlines, connectors, and labels. When a figure has independent crossing paths, declare `background`, `main`, and `foreground` PGF layers: keep auxiliary paths behind objects and labels above them.

Use distinct face shades for solid depth. When transparency is needed, set `fill opacity` and `draw opacity` separately so outlines remain legible. Prefer a few representative feature-map sheets plus a channel label over one sheet per channel.

**Completion:** every overlap has a deliberate draw order, hidden geometry reads as hidden, and labels and primary flow remain unobscured.

## 4. Prove the projection

For a standalone figure, use `\documentclass[tikz,border=8pt]{standalone}`. Follow [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md) when artifacts are requested or a TeX engine is available. Inspect the rendered figure for clipping, face ordering, label readability at intended size, and arrow endpoints; adjust the projection or layout before adding incidental detail.

**Completion:** the requested source and artifacts exist, and every object, visible face, label, and connector is readable at the intended size; otherwise report the exact build or inspection blocker.
