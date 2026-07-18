# Specialized D2 shape catalog

Source of truth: `d2-docs/docs/tour/{sequence-diagrams,sql-tables,uml-classes,grid-diagrams}.md`.

## Sequence diagram

Set `shape: sequence_diagram` on the diagram/container. Declaration order controls actor left-to-right order and message top-to-bottom order. Children share sequence-wide actor scope.

```d2
shape: sequence_diagram
client; api; db
client -> api: GET /orders
api -> db: SELECT
api <- db: rows
client <- api: 200 OK
```

Predeclare actors used inside groups. A group is an unconnected container containing messages/objects. A nested object on an actor with no edge is a note. Self-edges are self-messages. Spans/activation bars are nested objects on actors and are connected through dotted IDs. Lifelines inherit the actor's `stroke` and `stroke-dash`.

## SQL entity-relationship diagram

Set `shape: sql_table`. Each child key is a column; its primary value is the type. `constraint` supports any text and abbreviates `primary_key`, `foreign_key`, and `unique`; arrays represent multiple constraints. Connect exact columns for foreign keys. ELK and TALA route to the exact row.

```d2
orders: {
  shape: sql_table
  id: int {constraint: primary_key}
  user_id: int {constraint: foreign_key}
}
orders.user_id -> users.id
```

Quote a column whose name is a D2 reserved keyword.

## UML class diagram

Set `shape: class`. Child keys without `(` are fields and values are types. Keys containing `(` are methods and values are return types; omitted method values mean void. Visibility prefixes are `+` public, `-` private, and `#` protected; escape `#` as `\#` so it is not parsed as a comment.

```d2
Order: {
  shape: class
  +id: UUID
  -items: "[]Item"
  +total(): Money
  cancel()
}
```

Quote member names that collide with reserved keywords.

## Grid diagram

Inside a container/root, set `grid-rows`, `grid-columns`, or both. If both are present, the keyword declared first is the dominant fill direction. `grid-gap` sets both gaps; `vertical-gap` and `horizontal-gap` override it. Explicit width/height controls construction.

Grid cells in a row share height and cells in a column share width. Connections between cells are straight center-to-center segments because the layout engine cannot route within imposed grid positions. Grids may nest grids. Invisible cells can pad alignment; equal explicit widths can correct label-driven unevenness.
