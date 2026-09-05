# Troubleshooting and Production Reference

## ELK cannot find a port

Typical mismatch:

```text
Edge endpoint: node-a:output
Declared port: output
```

ELK ports should use graph-global IDs:

```ts
{ id: `${node.id}:output` }
```

Keep logical handle names local (`output`, `q`) and qualify them only in the ELK adapter.

Check all three representations together:

```text
React Flow Handle id   = q
Edge targetHandle      = q
ELK target endpoint    = attention:q
Declared ELK port ID   = attention:q
```

Build an adapter validation that enumerates declared ELK ports and rejects unresolved source/target IDs before calling `elk.layout`.

## Nodes overlap after layout

Likely causes:

- ELK received fallback dimensions smaller than rendered nodes.
- KaTeX or labels wrap after layout.
- Fonts loaded after measurement.
- CSS changed dimensions without updating the sizing policy.
- A node kind lacks a deterministic size mapping.

Choose a correction based on product needs:

1. Give every node kind fixed/deterministic dimensions.
2. Bound formulas and descriptions with fixed widths and overflow behavior.
3. Render, wait for fonts, read `node.measured`, then layout.
4. Re-run layout after a known content-size change.

```ts
await document.fonts.ready;
await runLayout();
```

Test with the longest realistic labels/formulas rather than only compact samples.

## Infinite layout loop

This effect loops because layout updates `nodes`, which retriggers the effect:

```ts
useEffect(() => {
  void runLayout();
}, [nodes]);
```

Use explicit structural triggers: initial load, import, add/remove, orientation, and a layout button. If graph revision drives layout, use a dedicated revision counter or model identity rather than the full positioned node array.

## Edges connect to the wrong attention input

Verify unique handle IDs and edge fields:

```ts
{
  source: "query-projection",
  sourceHandle: "output",
  target: "attention",
  targetHandle: "q",
}
```

Then verify ELK uses `query-projection:output` and `attention:q`. Use `FIXED_ORDER` plus port indexes for Q/K/V when visual order matters.

## Horizontal layout works; vertical layout breaks

The following must change together:

- ELK direction: `RIGHT` → `DOWN`.
- Input port sides: `WEST` → `NORTH`.
- Output port sides: `EAST` → `SOUTH`.
- React Flow target position: `Left` → `Top`.
- React Flow source position: `Right` → `Bottom`.
- Custom skip-edge route geometry.

Treat orientation as an input to node-port generation and edge routing, not only as an ELK option.

## Skip edges collide with nodes

A simple lifted edge does not know about intervening node bounds. Options, in increasing complexity:

1. Increase bounded lift for known residual blocks.
2. Reserve layout spacing above blocks.
3. Use a dedicated residual lane or port.
4. Let ELK route edge sections and render its bend points.

Use the simplest option that works for representative graphs. Publication layouts often justify ELK-owned routing; highly interactive editors often do not.

## Symbolic tensor shapes look misleading

A symbolic `T`, `D`, or `?` has no numeric scale. Keep the exact symbol in the label and use a stable fallback visual size. If runtime shape metadata becomes available, update both semantics and visualization from that source rather than parsing labels.

Interpret dimensions through layout metadata. For example:

- `CHW`: channels, height, width.
- `BCHW`: batch, channels, height, width; batch usually is not a visible depth.
- `BTD`: batch, tokens, embedding dimension; use a sequence/matrix visual.

## KaTeX changes node size or clips

- Import KaTeX CSS before measuring.
- Bound formula width and use `overflow-x: auto` where interactive scrolling is acceptable.
- Use `displayMode: false` for compact operation cards.
- Wait for `document.fonts.ready` before measured layout.
- Give publication nodes enough deterministic width to avoid scrollbars.

Use `throwOnError: false`, `strict: "warn"`, and `trust: false` for externally supplied formulas. Show malformed source or an error state when mathematical correctness matters.

## Nested groups layout incorrectly

React Flow’s `parentId` hierarchy must correspond to a compound ELK graph. Flattening children gives coordinates in the wrong coordinate system and ignores parent bounds.

For an MVP:

- Keep the graph flat.
- Render repeated-block labels as ordinary nodes or overlays.
- Add compound layout as a deliberate later feature.

For compound layout:

- Build nested `children` arrays in ELK.
- Define parent padding and child dimensions.
- Convert absolute/relative coordinates correctly for React Flow.
- Validate edges crossing group boundaries.

## Layout is nondeterministic or rearranges unexpectedly

- Preserve model node and edge order in the adapter.
- Use stable IDs.
- Set `elk.layered.considerModelOrder.strategy` to `NODES_AND_EDGES` when appropriate.
- Avoid rebuilding semantically identical graphs in arbitrary map iteration order.
- Decide whether manual positions are discarded or pinned on relayout.

A relayout button should communicate that positions may change.

## Large models become unreadable

Use semantic levels of detail:

- Collapse repeated blocks.
- Group model stages.
- Show high-level operations at fit view and details on selection/zoom.
- Limit formula rendering to selected or expanded nodes.
- Use MiniMap and fit-view controls.
- Provide filters for tensors, parameters, or auxiliary edges.

Keep model semantics in the IR so collapsing is a display transformation, not destructive mutation.

## Performance

For large graphs:

- Register node/edge type maps at module scope.
- Avoid rebuilding all node data during pointer movement.
- Keep SVG layer counts bounded.
- Debounce structural auto-layout if batch edits occur.
- Run ELK only for structural changes.
- Consider a Web Worker when layout blocks interaction at realistic graph sizes.
- Render formulas selectively if KaTeX dominates node cost.

Measure before adding complexity. A flat deterministic layout is often sufficient for architecture diagrams that contain tens or low hundreds of nodes.

## Accessibility

- Give SVG tensor graphics a role and accessible label, or mark them decorative when adjacent text fully describes them.
- Ensure selected/focused states are visible.
- Keep edge semantics available through labels, a legend, or an inspector; color alone is insufficient.
- Ensure canvas controls and toolbar buttons have accessible names.
- Preserve keyboard interaction supplied by React Flow.
- Avoid tiny labels that only become readable at extreme zoom.

## Export SVG

Publication mode should:

- Hide controls, handles, selection outlines, and editor overlays.
- Include or inline required CSS.
- Preserve SVG tensor geometry and edge markers.
- Verify foreign HTML content, including KaTeX, in the selected export method.
- Use explicit background and theme colors.
- Fit the exported viewBox to graph bounds with padding.

React Flow nodes are commonly HTML inside a transformed viewport, while edges are SVG. A complete single-SVG export may require conversion or `foreignObject`; verify compatibility with the target (browser, slide software, vector editor, or paper pipeline).

## Export PNG

Use a high pixel ratio and explicit dimensions. Wait for fonts and layout completion. Verify transparent versus solid background behavior. PNG is simpler for slides but loses vector fidelity.

## Save/load JSON

Persist the Model IR first. Persist display state separately if needed:

```ts
type SavedDiagram = {
  schemaVersion: number;
  model: ModelDefinition;
  view?: {
    positions?: Record<string, { x: number; y: number }>;
    collapsedNodeIds?: string[];
    viewport?: { x: number; y: number; zoom: number };
  };
};
```

Validate schema version and endpoint references on load. Regenerate React Flow nodes/edges through the adapter.

## Suggested delivery stages

### Stage 1: visual MVP

- Tensor, operation, and attention nodes.
- Data and skip edges.
- Horizontal ELK layout.
- Pan, zoom, controls, MiniMap.

### Stage 2: editor

- Palette and drag/drop.
- Properties panel.
- Add/remove connections.
- Undo/redo.
- Save/load model JSON.
- Shape inference where available.

### Stage 3: model-aware tooling

- ONNX or framework import.
- Repeated-block collapsing.
- Tensor-shape validation.
- Parameter/FLOP summaries.

### Stage 4: publication mode

- Editor-free rendering.
- SVG/PNG export.
- Theme and paper/slide presets.
- Mathematical labels and deterministic routing.

Advance stages based on product requirements. Keep each stage valid through the same Model IR rather than replacing its data model.
