# D2 output formats

Source of truth: `d2-docs/docs/tour/{exports,composition-formats,interactive}.md`.

## Selection

- **SVG**: default; best for web, links, tooltips, animation, and scalable output. Markdown uses XHTML `foreignObject`, so browser rendering is more reliable than pure SVG editors. Use `--bundle` for portable assets.
- **PNG**: raster delivery. Rendering launches headless Chromium; links/tooltips become an appendix.
- **PDF**: paged/static presentation with clickable links; built from PNG-like rendering and shares Chromium dependencies. Animation is absent.
- **PPTX**: presentation output, especially for multi-board compositions.
- **GIF**: short looping multi-board compositions with `--animate-interval`.
- **ASCII (`.txt`)**: simple terminal/docs diagrams. Beta; D2 uses ELK when Dagre is selected, and many visual styles/shapes do not translate. `extended` uses Unicode box drawing; `standard` uses basic ASCII.
- **stdout**: use output `-`; SVG is default, or set `--stdout-format`.

## Composition behavior

A multi-board export may generate a sequence or package depending on format/options. Use `--target='<board>'` for one board and `--target='<board>.*'` for it plus descendants. Animated SVG and GIF require `--animate-interval`; PPTX/PDF are suitable when viewers should advance through boards manually.

## Interactivity contract

Links survive in SVG and PDF. Tooltips/links are inherently interactive in browser SVG, while static formats use appendices. Embedding an SVG through `<img>` blocks its interactivity; direct/object embedding is required when interaction matters.
