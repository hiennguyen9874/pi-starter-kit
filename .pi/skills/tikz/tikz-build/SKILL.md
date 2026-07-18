---
name: tikz-build
description: Build and render TikZ artifacts. Use when the user wants a TikZ or standalone LaTeX file compiled, converted to PDF or PNG, rasterized at a chosen DPI, or diagnosed after a TeX build failure.
---

# Build TikZ

Use **pipeline** as the leading word: `.tex` → cropped PDF → optional PNG.

## 1. Preflight the pipeline

Confirm the input `.tex` path and requested artifacts. Default PNG rendering to 300 DPI. Detect the engine from the source: use LuaLaTeX or XeLaTeX for `fontspec`; otherwise use the project's configured engine or `pdflatex`. Check required commands with `command -v` and packages with `kpsewhich` when a dependency is uncertain.

When a dependency is missing, report the missing command or package and the relevant installation command. Install system packages only with explicit authorization.

**Completion:** the input exists, output names and DPI are fixed, and every required command is available or identified as the blocker.

## 2. Compile to PDF

Run from the source directory so auxiliary files stay beside the source:

```bash
pdflatex -interaction=nonstopmode -halt-on-error FILE.tex
```

Substitute the selected engine. Use `latexmk -pdf -interaction=nonstopmode -halt-on-error FILE.tex` when the document has references or the project already uses `latexmk`. Preserve the `.log` on failure and diagnose the first actionable TeX error rather than later cascade errors.

**Completion:** a non-empty, current `FILE.pdf` exists, or the first actionable error and its source location are known.

## 3. Render PNG when requested

```bash
pdftocairo -png -singlefile -r 300 FILE.pdf FILE
```

Replace `300` with the requested DPI. Add `-transp` only when transparent output is requested and `pdftocairo -h` lists support. Prefer `pdftocairo`; use `pdftoppm` with the same `-png -singlefile -r` options when Cairo is unavailable.

**Completion:** a non-empty `FILE.png` exists at the requested DPI, with a transparent background when requested.

## 4. Verify and clean

Check every requested artifact with `test -s`. Use `pdfinfo` and `file` when available to verify page size and format. Inspect the PNG when image-reading is available. Remove `.aux` and `.log` only after success and only when the user wants generated intermediates cleaned; retain the PDF when it is requested or useful for further rendering.

**Completion:** every requested artifact is verified and its path reported; any skipped visual check or retained diagnostic file is stated.

## Ubuntu baseline

The standard packages are:

```bash
sudo apt install texlive-latex-base texlive-latex-extra texlive-pictures poppler-utils
```

`texlive-full` is a high-cost fallback for documents with broad package requirements, not the baseline.
