---
name: tikz-layout
description: Design stable TikZ diagram layouts. Use when authoring or restructuring a diagram with variable-size nodes, branches, grids, labels, or connectors that need collision-safe placement.
---

# TikZ Layout

Use **collision-first** as the leading word: make the real node geometry and routes safe before polishing the diagram.

## 1. Establish the layout contract

Extract the entities, labels, relationships, reading direction, branches, grouping, intended size, and requested source or rendered artifacts. Choose a grid or geometric coordinate system that matches the diagram's meaning. Preserve an existing document's engine and theme.

Read [`REFERENCE.md`](REFERENCE.md) for the matching placement or routing recipe.

**Completion:** every requested entity and relationship has a planned position and route, and the layout's spacing and sizing constraints are explicit.

## 2. Make node geometry predictable

Load `positioning` and replace hand-tuned center coordinates or `xshift` spacing with named nodes and relations such as `right=of`, `below=of`, and explicit distances. Set `node distance` for the diagram, then widen only the relationship that needs it.

Constrain long labels with `text width`, and combine it with `minimum width`, `minimum height`, `align=center`, and a deliberate `inner sep`. Remember that `minimum width` is only a lower bound; `text width` controls wrapping.

**Completion:** each node has an intentional text and outer size, and no neighboring node depends on the current length of an unwrapped label.

## 3. Place the layout

Use relative positioning for relational diagrams and `matrix of nodes` for regular rows and columns or multi-branch architectures. Use anchors when node sizes vary: place a node's `west` anchor from the previous node's `east` anchor with an explicit offset.

Increase local spacing before moving unrelated nodes. For complex layouts, reserve space for labels and return paths before routing connectors.

**Completion:** nodes occupy a readable grid or intentional geometric arrangement with clear gaps, and every named anchor used later exists.

## 4. Route and layer connectors

Connect through explicit border anchors (`.east`, `.west`, `.north`, `.south`) so edges meet nodes perpendicularly. Use `--` for aligned edges and `-|` or `|-` for deliberate orthogonal bends. Add an intermediate segment before a bend when the route needs clearance.

Draw `fit` grouping nodes inside `scope`s using `on background layer`; otherwise the container can cover nodes or connectors. Keep labels and primary connectors above auxiliary geometry.

**Completion:** every connector has a collision-free endpoint and route, and every background container is behind the content it groups.

## 5. Prove the repaired layout

Follow [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md) when a TeX engine is available or artifacts are requested. Inspect the rendered figure for overlap, clipping, edge crossings, label wrapping, and readability at the intended size. If the cause is unclear, temporarily draw node bounding boxes, centers, or the `current bounding box`; remove those diagnostics after the repair.

**Completion:** the requested source and artifacts exist, the rendered layout has no accidental overlap or clipping, and any unavailable compile or visual check is reported with its exact blocker.
