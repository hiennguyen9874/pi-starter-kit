# D2 module reference

Source of truth: `d2-docs/docs/tour/{imports,imports-use-cases,classes,modular-classes,vars,overrides,models,model-view}.md`.

## Imports

Regular import assigns a file map as a value:

```d2
system: @system
```

Spread import merges file contents into the current map and only works inside maps:

```d2
classes: {
  ...@shared-classes
}
```

Omit `.d2`; the formatter removes it. Imports resolve relative to the importing file, not the shell working directory. Partial imports target a path: `admin: @people.admin`. Quote file names containing dots and absolute Windows paths.

Use model files for domain facts, class files for shared presentation, and view/entry files for composition and overrides.

## Overrides and deletion

Redeclaration merges with earlier declarations; the latest explicit label wins. Assign `null` to delete a shape, connection, or attribute. Deleting a shape also deletes incident connections and descendants.

```d2
system: @system
system.legacy: null
system.api.style.fill: orange
```

Repeated connection declarations create new edges. To override/delete an existing edge, reference its index: `(a -> b)[0]`.

## Classes

Define reusable attributes under `classes`, then assign `class`. Object attributes override class values. Arrays apply multiple classes left-to-right, so later classes win where they overlap. Classes can target connections and are emitted as SVG classes for post-processing.

## Variables

Define `vars`, substitute with `${name}`, and spread maps/arrays with `...${name}`. Variables obey lexical scope; the nearest definition wins. Single quotes bypass substitution.

`vars.d2-config` can set diagram options such as `layout-engine`, `theme-id`, `dark-theme-id`, `pad`, `center`, and `sketch`. CLI flags/environment variables take precedence.

## Model-view

For reusable views, define the full model once, suspend it, import it into each view, and selectively reveal elements:

```d2
**: suspend
(** -> **)[*]: suspend
```

Use matching globs with `unsuspend` in view files. This retains one authoritative model while each view controls visibility.
