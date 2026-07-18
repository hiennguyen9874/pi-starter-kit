# D2 glob reference

Source of truth: `d2-docs/docs/tour/globs.md`.

Globs bulk-create or bulk-modify shapes/connections. They are case-insensitive and apply both to declarations already seen and declarations added later.

- `*`: shapes in current scope.
- `**`: recursive targets; recursive connection globs select leaf shapes.
- `***`: global across nested boards and imports.
- `(* -> *)[*]`: matching indexed connections.
- `&property: value`: include filter.
- `!&property: value`: inverse filter.
- Multiple filters are ANDed.
- Special filters: `connected: true|false`, `leaf: true|false`.
- Connection filters may use `src`/`dst` properties or absolute endpoint IDs.

```d2
# Default all local shapes, then specialize services
*.style.fill: lightgray
*: {
  &shape: rectangle
  class: service
}

# Recursive leaf defaults
**: {
  &leaf: true
  style.border-radius: 6
}

# Existing edges only
(* -> *)[*].style.stroke-dash: 3
```

Connection-creating globs omit self-connections. Scoped globs stay in their declaration scope. Imported normal/double globs do not carry out of the imported file; triple globs do.

Audit triple globs and broad recursive rules against every import and child board because their blast radius is intentionally global. Use explicit overrides after broad defaults when a single target differs.
