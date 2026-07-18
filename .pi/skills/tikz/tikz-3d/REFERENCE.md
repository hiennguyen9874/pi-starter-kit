# TikZ 3D Examples and References

Choose one example as a starting point; retain only the packages and libraries it uses.

## Projected tensor box

Use fixed basis vectors for a schematic tensor, cuboid, or feature-map stage. This is a complete standalone document; `input-east` and `input-west` can anchor arrows to adjacent stages.

```latex
\documentclass[tikz,border=8pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta}

\begin{document}
\begin{tikzpicture}[
  x={(1cm,0cm)}, y={(0.42cm,0.24cm)}, z={(0cm,1cm)},
  line join=round,
  flow/.style={-{Latex[length=2.5mm]}, very thick, draw=black!70}
]
\newcommand{\TensorBox}[9]{%
  % name, x, y, z, width, depth, height, color, label
  \pgfmathsetmacro{\xa}{#2}
  \pgfmathsetmacro{\xb}{#2+#5}
  \pgfmathsetmacro{\ya}{#3}
  \pgfmathsetmacro{\yb}{#3+#6}
  \pgfmathsetmacro{\za}{#4}
  \pgfmathsetmacro{\zb}{#4+#7}
  \path[draw=#8!70!black,fill=#8!20]
    (\xa,\ya,\zb) -- (\xb,\ya,\zb) -- (\xb,\yb,\zb) -- (\xa,\yb,\zb) -- cycle;
  \path[draw=#8!70!black,fill=#8!50]
    (\xb,\ya,\za) -- (\xb,\yb,\za) -- (\xb,\yb,\zb) -- (\xb,\ya,\zb) -- cycle;
  \path[draw=#8!70!black,fill=#8!35]
    (\xa,\ya,\za) -- (\xb,\ya,\za) -- (\xb,\ya,\zb) -- (\xa,\ya,\zb) -- cycle;
  \coordinate (#1-west) at (\xa,\ya+#6/2,\za+#7/2);
  \coordinate (#1-east) at (\xb,\ya+#6/2,\za+#7/2);
  \coordinate (#1-center) at (\xa+#5/2,\ya+#6/2,\za+#7/2);
  \node[font=\scriptsize,align=center] at (\xa+#5/2,\ya-0.08,\za+#7/2) {#9};
}

\TensorBox{input}{0}{0}{0}{0.35}{1.6}{2.8}{blue}{Input\\$224^2\!\times\!3$}
\TensorBox{feature}{1.8}{0}{0.35}{0.7}{2.4}{2.0}{violet}{Conv\\$112^2\!\times\!64$}
\draw[flow] (input-east) -- (feature-west);
\end{tikzpicture}
\end{document}
```

Call farther objects before nearer ones. Draw auxiliary connectors after their boxes, or place them on a background layer when they would cross labels.

## `tikz-3dplot` geometry

Use `tikz-3dplot` when the view is a parameter rather than a manually chosen basis.

```latex
\documentclass[tikz,border=8pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta}
\usepackage{tikz-3dplot}
\begin{document}
\tdplotsetmaincoords{70}{115}
\begin{tikzpicture}[tdplot_main_coords,scale=1.2,>=Latex]
  \draw[-Latex] (0,0,0) -- (3,0,0) node[below] {$x$};
  \draw[-Latex] (0,0,0) -- (0,3,0) node[right] {$y$};
  \draw[-Latex] (0,0,0) -- (0,0,3) node[above] {$z$};
  \draw[fill=blue!15] (0,0,0) -- (2,0,0) -- (2,2,0) -- (0,2,0) -- cycle;
  \draw[fill=blue!25] (0,0,2) -- (2,0,2) -- (2,2,2) -- (0,2,2) -- cycle;
  \foreach \x/\y in {0/0,2/0,2/2,0/2}
    \draw (\x,\y,0) -- (\x,\y,2);
\end{tikzpicture}
\end{document}
```

The arguments to `\tdplotsetmaincoords` control elevation and azimuth. Change them before adjusting individual coordinates.

## PGFPlots surface

Use `pgfplots` for a function or measured 3D data, not an architecture tensor.

```latex
\documentclass[border=8pt]{standalone}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\begin{document}
\begin{tikzpicture}
\begin{axis}[
  view={45}{30}, xlabel={$x$}, ylabel={$y$}, zlabel={$z$},
  domain=-2:2, y domain=-2:2, samples=35, samples y=35,
  colormap/viridis
]
  \addplot3[surf,shader=interp] {exp(-x^2-y^2)};
\end{axis}
\end{tikzpicture}
\end{document}
```

Reduce `samples` and `samples y` before investigating a slow compile; increase them only when the rendered surface needs more detail.

## Package references

- [TikZ & PGF manual](https://ctan.org/pkg/pgf): coordinate systems, layers, and `calc`.
- [`tikz-3dplot` documentation](https://ctan.org/pkg/tikz-3dplot): rotated coordinate systems and spherical geometry.
- [PGFPlots manual](https://ctan.org/pkg/pgfplots): `\addplot3`, surfaces, scatter plots, and data tables.
