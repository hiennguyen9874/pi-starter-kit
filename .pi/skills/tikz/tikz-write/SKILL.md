---
name: tikz-write
description: Author TikZ source for charts and diagrams. Use when the user wants a non-flowchart TikZ diagram, plot, graph, geometry figure, network, automaton, or existing TikZ source changed.
---

# Write TikZ

Use **blueprint** as the leading word: settle content and geometry before encoding them.

## 1. Establish the contract

Extract the requested entities, labels, relationships, visual hierarchy, dimensions, output path, and source-vs-rendered deliverables. Inspect nearby `.tex` files when the chart must match an existing document. Resolve minor omissions with conventional defaults; ask only when an ambiguity changes the chart's meaning.

**Completion:** every requested entity and relationship is represented in a blueprint, and the required files and format are known.

## 2. Design the blueprint

Choose a dominant reading direction, place related elements on an aligned grid, reserve space for labels, and select the smallest useful library set. Use named nodes and relative positioning for relational diagrams; use coordinates for mathematical geometry. For syntax and library selection, read only the relevant section of [`../tikz/REFERENCE.md`](../tikz/REFERENCE.md).

For flowcharts or themed architecture/process diagrams, follow [`../tikz-flowchart/SKILL.md`](../tikz-flowchart/SKILL.md) instead.

**Completion:** every element has a position, every connector has a collision-free route, and repeated appearance has a named style.

## 3. Write the source

Create a complete, standalone `.tex` document unless the user asks for an embeddable `tikzpicture`. Use `\documentclass[tikz,border=8pt]{standalone}` for standalone output. Keep labels concise, define repeated styles once, load only used libraries, and preserve the target document's engine and conventions when editing existing source.

**Completion:** the requested `.tex` file contains the entire blueprint with no placeholders, undefined node references, or knowingly unused libraries.

## 4. Prove the chart

When rendered output is requested, or a local TeX engine is available, follow [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md). Inspect the rendered image when image-reading is available; otherwise verify compilation and artifact dimensions and state that visual inspection was unavailable. Repair source errors and obvious clipping, overlap, or unreadable routing before finishing.

**Completion:** the source builds into every requested artifact and visual requirements are checked, or the exact environmental blocker is reported with the source left intact.
