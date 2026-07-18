---
name: tikz
description: Choose the TikZ skill for authoring, flowcharts, syntax, or rendering.
disable-model-invocation: true
---

# TikZ

Load only the branch the request needs:

- General diagram, plot, geometry, or other `.tex` authoring: [`../tikz-write/SKILL.md`](../tikz-write/SKILL.md)
- Projected 3D solid, tensor, spatial geometry, or 3D data plot: [`../tikz-3d/SKILL.md`](../tikz-3d/SKILL.md)
- Flowchart, process flow, architecture flow, or themed technical diagram: [`../tikz-flowchart/SKILL.md`](../tikz-flowchart/SKILL.md)
- Compile TikZ or render PDF/PNG: [`../tikz-build/SKILL.md`](../tikz-build/SKILL.md)
- TikZ syntax or library lookup: [`REFERENCE.md`](REFERENCE.md)

For a request spanning source and rendered output, author first, then build. The run is complete when every requested source and artifact exists, or the exact blocking command and error are reported.
