---
name: tikz-debug
description: Diagnose and repair visible TikZ layout failures. Use when an existing diagram has overlapping blocks, clipped content, crossed connectors, hidden nodes, or a `fit` container covering its contents.
---

# TikZ Debug

Use **red** as the leading word: reproduce the visible failure before changing the source.

## 1. Reproduce the failure

Locate the `.tex` source and requested artifact. Compile or render through [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md) when needed, then inspect the result. Record the exact affected nodes, labels, connectors, grouping nodes, and boundary where the failure appears.

Classify the failure as node overlap, connector crossing, `fit` occlusion, label overflow, or picture clipping. Preserve unrelated layout, semantics, and styling.

**Completion:** the failure is visible in a current artifact or the exact build blocker is known, and every affected object has been identified.

## 2. Expose the geometry

Read [`../tikz-layout/REFERENCE.md`](../tikz-layout/REFERENCE.md). Temporarily draw the affected node bounds and centers, inspect explicit anchors, and draw the picture bounding box when clipping is suspected:

```latex
\draw[red] (node.south west) rectangle (node.north east);
\fill[red] (node.center) circle (2pt);
\draw[blue] (current bounding box.south west)
  rectangle (current bounding box.north east);
```

Check whether long text is expanding a node, whether fixed coordinates use center-to-center spacing, whether a connector starts at a node center, or whether a `fit` node is on the foreground paint order.

**Completion:** the observed geometry explains the failure, and diagnostics distinguish node size, placement, routing, layering, and clipping.

## 3. Apply the smallest structural repair

Use the repair sequence from the layout reference: `positioning` → relative placement → local spacing → `text width` → explicit anchors → matrix layout → `fit`/connector/layer correction. Prefer `right=of`/`below=of`, `node distance`, and border anchors over arbitrary global shifts.

If the layout is regular, use `matrix of nodes`; if node sizes differ, use anchor-based placement from one border to the next. Route edges through `.east`, `.west`, `.north`, or `.south`, and place `fit` containers on `on background layer`.

**Completion:** the smallest source change removes the diagnosed cause without introducing a new overlap, crossing, or semantic change.

## 4. Rebuild and remove instrumentation

Rebuild the source and inspect the current artifact at its intended size. Check all neighboring nodes, labels, connectors, group boundaries, and the page bounding box—not only the originally reported spot. Remove temporary bounding boxes and anchor markers.

**Completion:** the repaired source builds into every requested artifact, the original failure and nearby regressions are absent, and any unavailable visual check is reported explicitly.
