---
name: d2-render
description: Render and operate D2 through its CLI. Use for D2 export, watch mode, formatting, validation, layout or theme selection, stdin/stdout pipelines, multi-board targets, and diagnosing CLI render failures.
---

# D2 Render

Run a **tight loop**: validate, render, inspect the exit status, then inspect the artifact.

## Steps

1. Inspect the input file, imports, intended destination, required interactivity, and available `d2` version. Read [`references/cli.md`](references/cli.md) for command and precedence details. This step is complete when input, format, board target, and relevant render options are explicit.
2. Select the output contract from [`references/formats.md`](references/formats.md). Prefer SVG for web and interactivity, PNG for raster delivery, PDF/PPTX for documents or presentations, GIF/animated SVG for short compositions, and ASCII for terminal-safe simple diagrams. This step is complete when the selected format supports every requested behavior.
3. Run `d2 validate <input>` and `d2 fmt <input>` when source modification is allowed, then render with explicit input and output paths. Use the process exit status as the success signal because D2 may emit a partial artifact on failure. This step is complete when the command exits zero.
4. Inspect the output when tooling permits. For watch requests use `d2 --watch <input>`, and for automation use stdin/stdout and `--stdout-format` deliberately. This step is complete when the artifact exists in the requested format and its interactive/static behavior matches the contract.

Use [`examples/commands.md`](examples/commands.md) for copy-ready command patterns.
