---
name: tikz-flowchart
description: Design TikZ flowcharts and themed technical flows. Use when the user wants a flowchart, process map, architecture flow, swimlane, decision tree, or Material-like or Anthropic TikZ diagram.
---

# TikZ Flowchart

Use **layout-first** as the leading word: route the system on a grid before writing connectors.

## 1. Model the flow

Extract every node, decision, edge direction, edge label, group or lane, and required visual emphasis. Choose one dominant reading direction. Treat diamonds as semantic branches, not decoration.

**Completion:** every requested step and branch appears exactly once in a flow model, and each outgoing decision edge has a meaning.

## 2. Select one theme

- Read [`themes/anthropic.md`](themes/anthropic.md) for an explicitly Anthropic, warm ivory, pastel-card, quiet product-diagram style.
- Read [`themes/material-like.md`](themes/material-like.md) for all other requests, especially engineering diagrams needing semantic data, storage, and compute shapes.

Read only the selected theme. Preserve an existing document's theme when editing it unless the user requests a restyle.

**Completion:** one theme is selected and every node has a theme style based on its semantic role.

## 3. Make the layout-first blueprint

Assign nodes to aligned rows, columns, or lanes. Reserve label and return-path space. Route straight edges between aligned nodes and orthogonal bends elsewhere. Connect through `.east`, `.west`, `.north`, or `.south` so the final segment enters the border perpendicularly. Reposition nodes when a route would cross a node or require multiple avoidable bends.

**Completion:** every edge has a collision-free route with zero or one deliberate bend, except a clearly necessary return path.

## 4. Write complete TikZ source

Start from the selected theme template. Define nodes before connectors and grouping containers after nodes on the background layer. Keep node text short, define repeated appearance as styles, and use `fit` for groups. Produce a standalone `.tex` document unless the user requests an embeddable `tikzpicture`.

**Completion:** the source contains every modeled node, branch label, edge, and group with no placeholders or undefined references.

## 5. Prove the flowchart

Follow [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md) when output artifacts are requested or a TeX engine is available. Check the rendered chart against the flow model, reading order, edge direction, clipping, overlap, and label legibility. Use available image inspection; otherwise state that verification covered compilation and artifact metadata only.

**Completion:** every flow-model item is visible and readable in the rendered artifact, or the exact build or inspection blocker is reported.
