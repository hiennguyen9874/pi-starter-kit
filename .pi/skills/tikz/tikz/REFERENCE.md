# TikZ Reference

Read the section matching the current syntax or library question.

## Standalone source

```latex
\documentclass[tikz,border=8pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning}

\begin{document}
\begin{tikzpicture}[
  box/.style={draw,rounded corners,minimum width=2.8cm,minimum height=1cm,align=center},
  edge/.style={-{Stealth[length=3mm]},thick}
]
  \node[box] (a) {Input};
  \node[box,right=of a] (b) {Output};
  \draw[edge] (a.east) -- (b.west);
\end{tikzpicture}
\end{document}
```

`standalone` crops the PDF to the drawing plus `border`.

## Common libraries

- `arrows.meta`: configurable arrowheads such as `Stealth` and `Latex`
- `positioning`: `right=of a`, `below=1cm of a`
- `calc`: coordinate arithmetic such as `($(a)!0.5!(b)$)`
- `fit`, `backgrounds`: containers behind groups of nodes
- `shapes.geometric`: diamonds, cylinders, polygons
- `automata`: state-machine nodes
- `decorations.pathreplacing`: braces and path decorations
- `patterns`: patterned fills
- `intersections`: named-path intersections
- `pgfplots`: data and function plots; load with `\usepackage{pgfplots}`

Load only libraries used by the source.

## Paths and coordinates

```latex
\draw (0,0) -- (2,0);                         % line
\draw (a.east) -| (b.north);                  % orthogonal bend
\draw (a) to[out=20,in=160] (b);              % curve
\draw (0,0) rectangle (2,1);
\draw (0,0) circle[radius=1cm];
\coordinate (mid) at ($(a)!0.5!(b)$);          % calc midpoint
```

Prefer named nodes and relative positioning for diagrams. Use explicit coordinates when the geometry itself is the subject.

## Nodes and styles

```latex
\tikzset{
  card/.style={draw,rounded corners,fill=blue!8,inner sep=6pt,align=center},
  flow/.style={-Stealth,thick,draw=black!70}
}
\node[card,text width=3cm] (step) {Primary\\secondary};
\draw[flow] (step.east) -- (next.west);
```

Define repeated appearance once with `\tikzset`. Connect to explicit anchors when edge entry matters.

## Plots

Use PGFPlots for axes, legends, data series, or nontrivial functions:

```latex
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}

\begin{tikzpicture}
\begin{axis}[xlabel={$x$},ylabel={$f(x)$},grid=major]
  \addplot[domain=-3:3,samples=150,thick] {x^2};
  \addplot[domain=-3:3,samples=150,thick] {sin(deg(x))};
\end{axis}
\end{tikzpicture}
```

PGF math trigonometric functions take degrees; use `deg(x)` when the domain is radians.

## Package lookup

```bash
kpsewhich tikz.sty
kpsewhich standalone.cls
kpsewhich pgfplots.sty
```

On Ubuntu, the baseline toolchain is `texlive-latex-base`, `texlive-latex-extra`, `texlive-pictures`, and `poppler-utils`.
