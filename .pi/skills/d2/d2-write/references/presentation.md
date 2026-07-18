# D2 presentation reference

Source of truth: `d2-docs/docs/tour/{layouts,dagre,elk,tala,style,themes,positions,icons,interactive,fonts,sketch}.md`.

## Layout before coordinates

Set `direction` to `up`, `down`, `left`, or `right`. Dagre is the fast default for hierarchical graphs; ELK is mature and often routes complex graphs well; TALA targets software architecture and supports object-relative `near`, fixed `top`/`left`, and per-container direction.

Limitations:

- Object-relative `near` and `top`/`left`: TALA only.
- Container `width`/`height`: ELK only in these docs.
- Per-container `direction`: TALA only.
- Ancestor-to-descendant connections: unsupported in Dagre.

Use `d2 layout` and `d2 layout <engine>` to inspect installed engines/options.

## Themes, classes, and styles

Prefer a CLI theme (`d2 themes`, `--theme`, `--dark-theme`) for coherent defaults. Use classes for repeated presentation:

```d2
classes: {
  service: {
    shape: rectangle
    style: { border-radius: 8; shadow: true }
  }
}
api.class: service
```

Object attributes override class attributes. Multiple classes are applied left-to-right.

Valid style fields include `opacity`, `stroke`, `fill`, `fill-pattern`, `stroke-width`, `stroke-dash`, `border-radius`, `shadow`, `3d`, `multiple`, `double-border`, `font`, `font-size`, `font-color`, `animated`, `bold`, `italic`, `underline`, and `text-transform`. Applicability differs by shape. Root styles support `fill`, `fill-pattern`, `stroke`, `stroke-width`, `stroke-dash`, and `double-border`.

Useful bounds from the docs: opacity `0..1`, stroke width `1..15`, stroke dash `0..10`, border radius `0..20`, font size `8..100`.

## Positioning and dimensions

Use `near` constants for titles, legends, and explanations: `top-left`, `top-center`, `top-right`, `center-left`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`. Labels/icons additionally support `outside-*` and `border-*` positions.

Increase shape `width`/`height` when many edges need routing surface or labels force uneven sizing. Treat fixed dimensions as a remedy, not a default.

## Interaction

`tooltip` adds hover context; Markdown formatting is not supported in tooltip text. `link` adds navigation; quote URLs containing `#`. Static PNG exports convert tooltip/link metadata to a numbered appendix. SVG interactivity requires an embedding mode that permits it; an HTML `<img>` blocks interaction.

Use `icon` on a shape or `shape: image` for a standalone image. Remote assets may affect portability; bundled SVG is the portable web artifact.
