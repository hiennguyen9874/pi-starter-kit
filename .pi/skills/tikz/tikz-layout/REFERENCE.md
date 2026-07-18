# TikZ Layout Reference

Use the smallest recipe that fixes the observed geometry. Load only the libraries used by the source.

## Relative placement

```latex
\usetikzlibrary{positioning}

\begin{tikzpicture}[
  node distance=1.5cm and 3cm,
  block/.style={
    draw,
    rounded corners,
    text width=3cm,
    minimum height=1cm,
    align=center,
    inner sep=6pt
  }
]
  \node[block] (input) {Input};
  \node[block,right=of input] (encoder) {Feature Encoder};
  \node[block,right=of encoder] (output) {Output};
\end{tikzpicture}
```

`node distance=vertical and horizontal` sets the default gap for `below=of`/`above=of` and `left=of`/`right=of`. Override one relationship when necessary:

```latex
\node[block,right=3cm of encoder] (decoder) {Decoder};
\node[block,below=2cm of encoder] (feature) {Feature Map};
```

Positioning uses the gap between node borders. A fixed coordinate, `xshift`, or arithmetic offset commonly uses center-to-center distances instead, so a longer label can make the nodes collide.

## Node dimensions

```latex
block/.style={
  draw,
  text width=3cm,
  minimum width=3cm,
  minimum height=1.2cm,
  align=center,
  inner sep=6pt
}
```

- `minimum width` and `minimum height` set lower bounds.
- `text width` constrains the text box and allows long labels to wrap.
- `align=center` makes multiline and wrapped labels readable.
- `inner sep` controls the padding between text and border.

Use a narrower `text width` for long labels before increasing the whole diagram's scale.

## Anchor-based placement

For nodes with very different dimensions, place the next node from the previous node's border:

```latex
\node[block] (a) {Large\\Block\\A};
\node[block,anchor=west] (b)
  at ([xshift=2cm]a.east) {Block B};
```

The same pattern works vertically:

```latex
\node[block,anchor=north] (b)
  at ([yshift=-1.5cm]a.south) {Block B};
```

## Matrix layouts

Use a matrix when rows and columns are part of the diagram's meaning:

```latex
\usetikzlibrary{matrix,arrows.meta}

\matrix[
  matrix of nodes,
  nodes={
    draw,
    rounded corners,
    text width=2.8cm,
    minimum height=1cm,
    align=center
  },
  column sep=2cm,
  row sep=1.5cm
] (architecture) {
  Input & Encoder & Classifier \\
        & Latent Feature &          \\
};

\draw[-{Latex}] (architecture-1-1) -- (architecture-1-2);
\draw[-{Latex}] (architecture-1-2) -- (architecture-1-3);
\draw[-{Latex}] (architecture-1-2) -- (architecture-2-2);
```

Use `matrix of nodes` for aligned grids, encoder-decoder layouts, pipelines with branches, and other regular architectures. Keep free relative positioning for irregular diagrams.

## Connector routing

Use anchors rather than node centers:

```latex
\draw[->] (a.east) -- (b.west);
\draw[->] (a.east) -| (b.north);
\draw[->] (a.south) |- (b.west);
```

For clearance before turning:

```latex
\draw[->]
  (a.east)
  -- ++(1cm,0)
  |- (b.north);
```

If a route needs several avoidable bends, revisit the node layout before adding more path arithmetic.

## `fit` and layers

A grouping node can cover the content it surrounds unless it is painted behind it:

```latex
\usetikzlibrary{fit,backgrounds}

\begin{scope}[on background layer]
  \node[
    draw,
    dashed,
    fit=(a) (b),
    inner sep=10pt
  ] {};
\end{scope}
```

Place grouping containers after the content nodes so their bounds are known, and use the background layer for their paint order.

## Debugging geometry

Temporarily expose the actual bounds and anchors:

```latex
\draw[red] (a.south west) rectangle (a.north east);
\fill[red] (a.center) circle (2pt);
\draw[blue]
  (current bounding box.south west)
  rectangle (current bounding box.north east);
```

For a named node, inspect `center`, `east`, `west`, `north`, and `south` first. Remove diagnostic paths before delivering the source.

## Repair sequence

1. Load `positioning`.
2. Replace fixed coordinates with `right=of`/`below=of`.
3. Increase `node distance` or one local relationship.
4. Add `text width` to long-label nodes.
5. Use explicit border anchors for exact placement and connectors.
6. Switch a regular grid to `matrix of nodes`.
7. Check `fit`, draw order, connector paths, and the picture bounding box.
