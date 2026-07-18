# D2 CLI reference

Source of truth: `d2-docs/docs/tour/{man,auto-formatter,layouts,themes}.md`.

## Core commands

```sh
d2 input.d2 output.svg
d2 validate input.d2
d2 fmt input.d2
d2 fmt --check input.d2
d2 --watch input.d2
d2 layout
d2 layout elk
d2 themes
d2 play input.d2
```

With no output path, render defaults to `<input>.svg`. `-` means stdin or stdout. Use `--stdout-format png|svg|ascii` when output is `-`.

Trust exit status rather than output-file presence: rendering errors can leave a partial artifact for iteration.

## Frequent options

- `-l, --layout`: engine; default documented as Dagre.
- `-t, --theme` / `--dark-theme`: light and browser dark-mode theme IDs.
- `-w, --watch`, `--host`, `--port`, `--browser`: live reload server.
- `--target`: board to render; empty string selects root, suffix `*` includes descendant scenarios/steps/layers.
- `--animate-interval`: milliseconds between boards; SVG/GIF only.
- `--pad`, `--center`, `--scale`: output framing and size.
- `--sketch`: hand-drawn rendering.
- `--bundle`: package assets/layers into SVG.
- `--force-appendix`: append tooltip/link details to SVG as static references.
- `--font-regular`, `--font-italic`, `--font-bold`: `.ttf` paths.
- `--timeout`: increase for large diagrams.
- `--salt`: avoid duplicate generated SVG IDs when embedding identical diagrams together.
- `--no-xml-tag`: prepare SVG for direct HTML embedding.
- `--ascii-mode standard|extended`: ASCII character set.
- `--debug`: diagnostic logging.

Most flags have `D2_*` environment equivalents. Flags and environment variables override `vars.d2-config`; an explicit command is therefore the final rendering contract.

Use `d2 --help` and `d2 layout <engine>` as the installed-version authority when local behavior differs from the bundled documentation.
