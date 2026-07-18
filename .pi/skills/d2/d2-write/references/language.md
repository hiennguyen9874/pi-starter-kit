# D2 language reference

Source of truth: `d2-docs/docs/tour/{shapes,connections,containers,strings,text,comments,dimensions}.md`.

## Shapes and keys

```d2
api: Public API
api.shape: hexagon
```

A key identifies a shape; its label is display text. Keys are case-insensitive. Connections must use keys, not labels, or D2 creates new shapes. A connection may implicitly create an undeclared endpoint, but explicit declarations are safer when labels or styles matter.

Default shape is `rectangle`. Common shapes include `rectangle`, `square`, `circle`, `oval`, `diamond`, `hexagon`, `cloud`, `person`, `document`, `cylinder`, `queue`, and `package`. `circle` and `square` keep a 1:1 ratio; explicit width/height use the larger value.

Semicolons may declare multiple objects on one line: `api; worker; db`.

## Connections

```d2
client -> api: HTTPS
api <- worker
primary <-> replica: replication
api -- metrics
```

Valid operators are `--`, `->`, `<-`, and `<->`. Repeating a connection creates another edge rather than overriding it. Chains are valid: `a -> b -> c`.

Reference a specific repeated connection by zero-based index:

```d2
a -> b
(a -> b)[0].style.stroke-dash: 3
```

Arrowheads live under `source-arrowhead` or `target-arrowhead`. Shapes: `triangle`, `arrow`, `diamond`, `circle`, `box`, `cf-one`, `cf-one-required`, `cf-many`, `cf-many-required`, `cross`. Arrowhead labels should be short.

## Containers and scope

```d2
cloud: Cloud {
  api
  db
  api -> db
  _.client -> api
}
client
```

Nested maps avoid repeated dotted paths. Use `_` to reference the parent scope from inside a container. Label a container with shorthand (`cloud: Cloud {}`) or `label: Cloud`.

## Strings, comments, and blocks

Unquoted strings are trimmed. Quote labels/keys containing reserved syntax; choose the quote type that minimizes escaping. A leading `#` starts a line comment. Block comments use `""" ... """`.

Use `\n` for explicit label line breaks. Quote reserved keywords when they are domain keys, e.g. `"label": string`.

Block strings support Markdown, code, and LaTeX:

```d2
note: |md
  # Decision
  Prefer queues for burst traffic.
|
code: |go
  func main() {}
|
formula: |latex
  E = mc^2
|
```

If content contains `|`, use a longer or custom delimiter such as `|| ... ||` or `|`ts ... `|`. Single-quoted strings bypass `${variable}` substitution.
