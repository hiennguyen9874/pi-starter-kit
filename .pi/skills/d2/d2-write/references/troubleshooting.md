# D2 troubleshooting

Source of truth: `d2-docs/docs/tour/{troubleshoot,faq,auto-formatter}.md`.

- Compile failure around a label/value: quote strings containing reserved characters.
- Domain key collides with a reserved keyword: quote the key, e.g. `"width"`.
- Accidental duplicate node: a connection used the display label instead of the shape key.
- Text is too wide: insert `\n`; for prose use a Markdown block.
- Busy edge routing: enlarge highly connected short-label shapes, simplify crossings, or try ELK/TALA.
- Non-ASCII diagram behaves oddly: ensure syntax punctuation (`:`, `;`, `.`, arrows) is ASCII.
- HTML inside Markdown breaks SVG: use XML-compatible semantic HTML such as `<br/>`.
- Markdown is absent in an SVG editor: Markdown uses XHTML `foreignObject`; use a browser/web context or choose another output/content strategy.
- Embedded SVG loses tooltips/links: avoid embedding it as a plain `<img>` when interactivity is required.
- PNG/PDF fails to launch Chromium: install Playwright Chromium dependencies; these formats use a headless browser.
- A generated file exists after an error: trust the `d2` process exit status, not file presence.

Run `d2 fmt` to normalize source and block-string indentation; use `d2 fmt --check` when formatting must be verified without rewriting.
