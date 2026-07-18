---
name: d2-specialized
description: Build specialized D2 diagrams. Use for sequence diagrams, SQL entity-relationship diagrams, UML class diagrams, and structured grid diagrams where D2 shape-specific ordering, rows, methods, constraints, or grid behavior matters.
---

# D2 Specialized Diagrams

Choose the **native shape** whose semantics match the requested diagram; preserve its invariants before styling it.

## Steps

1. Classify the requested diagram and read its exact section in [`references/catalog.md`](references/catalog.md): `sequence_diagram`, `sql_table`, `class`, or grid. This step is complete when one native representation and its required invariants are selected.
2. Translate domain concepts into that shape's native elements: actors/messages, tables/columns/constraints, classes/fields/methods, or ordered grid cells. Start from the matching snippet in [`examples/patterns.d2`](examples/patterns.d2), copying only that section. This step is complete when every domain concept maps to a valid native element.
3. Add cross-element relationships and only supported customization. Preserve sequence declaration order, row-level foreign keys, quoted reserved member names, and grid routing limitations. This step is complete when all relationship endpoints resolve to declared native elements.
4. Run `d2 fmt`, `d2 validate`, and a render. Inspect the artifact for ordering, cardinality/constraints, visibility/type notation, or grid fill order as applicable. This step is complete when validation succeeds and every shape-specific invariant is visible in the render.
