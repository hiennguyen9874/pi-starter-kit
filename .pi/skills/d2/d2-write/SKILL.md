---
name: d2-write
description: Write and edit D2 source for architecture, flow, network, dependency, and explanatory diagrams. Use when creating `.d2` files, translating a diagram request into D2 syntax, or improving a D2 diagram's structure, labels, styling, or layout.
---

# D2 Write

Treat the diagram as a **model**, not a canvas: encode entities and relationships first, then let layout and theme render the view.

## Steps

1. Inspect the request and nearby `.d2` files. Identify the audience, entities, relationships, grouping, reading direction, output constraints, and local conventions. This step is complete when every requested concept has a planned D2 key or connection and unknowns that materially change meaning are resolved.
2. Write the smallest semantic model. Use stable machine-like keys with human labels, containers for real boundaries, and connection labels for relationship meaning. Read [`references/language.md`](references/language.md) whenever the diagram needs syntax beyond basic shapes and arrows. This step is complete when every requested entity and relationship appears exactly once in the source model.
3. Add presentation deliberately. Choose direction/layout based on topology, then use a theme, classes, or narrow styles; add dimensions or positioning only to solve an observed layout issue. Read [`references/presentation.md`](references/presentation.md) when styling, positioning, text, icons, tooltips, or links are needed. This step is complete when presentation preserves the model and the source remains legible.
4. Format, validate, and render with the installed D2 CLI when available: `d2 fmt <file>`, `d2 validate <file>`, then `d2 <file> <preview.svg>`. Diagnose failures from the command output; consult [`references/troubleshooting.md`](references/troubleshooting.md) for common syntax and rendering traps. This step is complete when validation exits successfully and the requested output renders, or the unavailable tool/blocker is reported explicitly.
5. Check the rendered artifact when image inspection is available. Confirm labels, grouping, edge direction, readability, and requested semantics; revise source rather than patching generated output. The diagram is complete when every requested concept is visible and unambiguous, with no accidental duplicate shapes from label/key confusion.

For a compact starting point, read [`examples/basic-architecture.d2`](examples/basic-architecture.d2).
