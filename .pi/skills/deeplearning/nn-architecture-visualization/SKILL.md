---
name: nn-architecture-visualization
description: Visualize neural-network architectures with React Flow, ELK.js, SVG/CSS, and KaTeX. Use when building or reviewing interactive diagrams for CNNs, Transformers, LLMs, vision pipelines, tensor shapes, attention ports, residual paths, automatic graph layout, or publication-ready model figures.
---

# Neural-Network Architecture Visualization

Build readable, interactive, model-aware architecture diagrams with a strict three-layer pipeline:

```text
Model IR → ELK layout → React Flow renderer
```

Use React Flow for interaction, ELK Layered for directed-graph layout, SVG/CSS for vector model graphics, and KaTeX for mathematical notation. Treat the diagram as a projection of the model, not as the model itself.

## Outcome

A completed visualization has:

- A framework-independent model IR as the source of truth.
- Explicit node kinds, edge semantics, tensor shapes, and named ports.
- Deterministic node dimensions and ELK layout inputs.
- React Flow custom nodes and edges that preserve model meaning.
- SVG/CSS tensor graphics that remain legible across shape scales.
- Safe KaTeX rendering for formulas.
- Distinct styling for data flow, residual paths, and groups.
- Relevant interaction and export behavior.
- Tests or checks for structural invariants and the rendered result.

## Process

### 1. Inspect the host project and define the diagram contract

Read the package manifest, existing graph types, React conventions, styles, test setup, and export requirements. Determine:

- Viewer, editor, publication figure, or a combination.
- Supported architecture families: CNN, Transformer/LLM, detection, ViT, or arbitrary DAG.
- Required interactions: pan/zoom, selection, drag, connect, edit, collapse, import, export.
- Input source: hand-authored data, JSON, ONNX, a parser, or application state.
- Layout orientations and whether users may preserve manual positions.
- Whether formulas or imported labels are untrusted.
- Whether the graph needs nested/compound layout.

Prefer installed dependencies and local patterns. For a new Vite React TypeScript project, the relevant packages are `@xyflow/react`, `elkjs`, and `katex`.

**Complete when:** the supported model semantics, interaction mode, layout scope, and export target are explicit, and every required node/edge category has an intended representation.

### 2. Establish the Model IR

Create domain types independent of `@xyflow/react`. Use discriminated unions when node kinds carry different data. Keep stable IDs, shape metadata, formulas, parameters, and edge semantics in the IR.

```ts
type TensorShape = Array<number | string>;

type ArchitectureNode =
  | {
      id: string;
      kind: "tensor";
      label: string;
      shape: TensorShape;
      layout?: "CHW" | "HWC" | "BCHW" | "BTD";
      description?: string;
    }
  | {
      id: string;
      kind: "operation";
      label: string;
      operation: string;
      formula?: string;
      inputShape?: TensorShape;
      outputShape?: TensorShape;
      parameters?: Record<string, string | number>;
    }
  | {
      id: string;
      kind: "attention";
      label: string;
      heads: number;
      embeddingDim: number;
      sequenceLength?: number;
      formula?: string;
    };

type ArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  kind: "data" | "residual" | "skip";
  sourcePort?: string;
  targetPort?: string;
};
```

Convert the IR to React Flow `Node[]` and `Edge[]` in an adapter. Keep editor-only state—selection, measured dimensions, viewport, and temporary positions—outside the model definition unless it is intentionally persisted.

Use one naming convention for ports:

```text
IR port:             q
React Flow handle:   q
ELK port ID:         attention:q
```

**Complete when:** the model can be serialized without React Flow objects, every edge endpoint resolves to a node and valid logical port, and renderer state can be regenerated from the IR.

### 3. Define visual semantics before components

Map model meaning to a small visual grammar:

- Tensor or feature map → 2.5D SVG stack plus shape/layout label.
- Operation → compact card with operation, parameters, and optional formula.
- Attention → multi-port card with ordered Q/K/V inputs and one output.
- Add/merge → operation or compact junction node.
- Data edge → solid neutral directional path.
- Residual/skip edge → elevated or offset dashed path with distinct color.
- Repeated block → labeled group or collapsed summary.
- Matrix/token sequence/output distribution → purpose-built SVG where required.

Make spatial encoding truthful but bounded. Tensor width/height/depth should communicate relative shape without using raw dimensions as pixels. Use logarithmic or square-root scaling with minimum and maximum visual sizes.

```ts
function visualDimension(
  value: number,
  minPixels: number,
  maxPixels: number,
): number {
  const scaled = Math.log2(Math.max(value, 2)) * 12;
  return Math.max(minPixels, Math.min(maxPixels, scaled));
}
```

Symbolic dimensions such as `B`, `T`, and `D` remain visible labels and use a stable fallback size. Do not imply a numeric comparison for unknown values.

**Complete when:** each supported semantic category has one unambiguous visual encoding, shape scaling is bounded, and edge styles remain distinguishable without relying only on color.

### 4. Build SVG/CSS nodes and KaTeX formulas

Implement custom React Flow node components with typed data and stable handles. Register `nodeTypes` outside render. Keep SVG geometry deterministic and presentation in CSS so vector export and theming remain practical.

For 2.5D tensors, render a bounded number of offset faces; channel count controls perceived depth rather than DOM size:

```ts
const visibleLayers = Math.max(
  1,
  Math.min(6, Math.round(Math.log2(Math.max(channels, 1))) + 1),
);
```

Give SVG meaningful accessible labels. Keep labels, shapes, and descriptions readable at normal and fit-to-view zoom levels.

Render formulas through KaTeX-generated HTML:

```tsx
const html = katex.renderToString(expression, {
  displayMode,
  throwOnError: false,
  strict: "warn",
  trust: false,
  output: "html",
});
```

Use `dangerouslySetInnerHTML` only for the KaTeX output, not raw model strings. Keep `trust: false` for external formulas and review any configured macros.

When formula fonts affect dimensions, wait for `document.fonts.ready` before final layout or use conservative fixed sizes.

**Complete when:** every node kind renders its required metadata and ports, SVG remains vector-based and bounded, formulas fail visibly rather than crashing, and untrusted text never enters raw HTML.

### 5. Build semantic edges

Use React Flow `BaseEdge` and path utilities for ordinary interactive edges. `getSmoothStepPath` is a strong default for directed architecture graphs.

Use a dedicated skip edge when residual paths need to remain visually separate from the main computation. Route it above or around the main path with a bounded lift based on source-target distance. Preserve arrow markers and make the residual style recognizable in grayscale through dash or path shape.

Choose one routing strategy deliberately:

- **Interactive MVP:** ELK computes node positions; React Flow computes edge paths. This responds well to dragging and is the default.
- **Dense/publication graph:** ELK also computes edge sections and bend points; custom edges reproduce those sections. Re-run routing after structural movement.

**Complete when:** direction is visible, residual/data edges are semantically distinct, all edges follow the selected routing ownership model, and dragging or relayout does not leave stale paths.

### 6. Adapt the graph to ELK

Use ELK Layered for directed neural-network graphs. Supply explicit node dimensions and graph-global port IDs. A stable baseline is:

```ts
const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.spacing.nodeNode": "50",
  "elk.layered.spacing.nodeNodeBetweenLayers": "90",
  "elk.spacing.edgeNode": "25",
  "elk.spacing.edgeEdge": "15",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
};
```

Pick one node-sizing strategy:

1. Fixed dimensions for uniform nodes.
2. Render, measure, then layout for dynamic content.
3. Deterministic dimensions by node kind for predictable editors—the preferred default.

For horizontal layout, input ports sit west and output ports east. For vertical layout, use north and south. Attention ports use unique IDs such as `attention:q`, `attention:k`, and `attention:v`. Apply `FIXED_ORDER` when semantic order matters.

Map edge handles to ELK endpoints:

```ts
sources: [`${edge.source}:${edge.sourceHandle ?? "output"}`],
targets: [`${edge.target}:${edge.targetHandle ?? "input"}`],
```

Treat nested groups as compound ELK nodes. A flat MVP may omit compound layout, but it must not pretend flattened child coordinates are valid nested layout.

**Complete when:** every ELK edge endpoint names an existing graph-global port, node dimensions match rendered bounds closely enough to prevent overlap, Q/K/V order is stable, and both supported orientations produce valid positions.

### 7. Integrate the React Flow canvas

Place the flow inside `ReactFlowProvider` when hooks such as `useReactFlow` are used. Configure registered node/edge types, state handlers, markers, controls, background, and MiniMap according to the contract.

Run layout on meaningful structural events:

- Initial graph load.
- Model import.
- Node or edge addition/removal.
- Orientation change.
- Explicit user request.

A node drag is a manual positioning interaction unless the product explicitly chooses continuous relayout. Avoid an effect that depends on `nodes` and also calls `setNodes`; it creates a layout loop.

After applying positions, schedule `fitView` after React has committed the update:

```ts
requestAnimationFrame(() => {
  void fitView({ padding: 0.15, duration: 450 });
});
```

For editors, preserve user intent: distinguish auto-layout positions from deliberate manual positions, and make relayout an explicit or predictable action.

**Complete when:** the canvas initializes without a layout loop, interaction updates state correctly, relayout occurs only on defined triggers, and fit-to-view reveals the complete graph.

### 8. Validate model meaning and presentation

Validate at three levels:

**IR and adapter**

- IDs are unique.
- Edge endpoints and handles resolve.
- Node kinds map to registered renderers.
- Serialization round-trips if save/load is supported.

**Layout**

- ELK receives valid dimensions and ports.
- Positions are finite and nodes do not materially overlap.
- Ordered ports preserve Q/K/V or pyramid-level order.
- Horizontal and vertical directions update handle sides consistently.

**Rendering and interaction**

- Tensor labels match source shapes.
- KaTeX formulas render or degrade visibly.
- Residual paths are distinguishable.
- Pan, zoom, select, drag, connect, and relayout behave as required.
- Dense models remain navigable with fit view and MiniMap.
- SVG/publication output includes required graphics and styles.

Use the narrowest existing automated tests first, then run the relevant typecheck/build. Inspect representative CNN and Transformer diagrams in the browser when available.

**Complete when:** every required architecture family has a representative checked graph, structural invariants pass, the project’s relevant checks pass, and any unverified browser/export behavior is reported explicitly.

## Branch References

Load only the reference needed for the active branch:

- For component, edge, port, and ELK implementation details, read [`references/IMPLEMENTATION.md`](references/IMPLEMENTATION.md).
- For examples, including CNN and Transformer graphs, read [`references/EXAMPLES.md`](references/EXAMPLES.md).
- For debugging overlap, missing ports, layout loops, nested graphs, and export decisions, read [`references/TROUBLESHOOTING.md`](references/TROUBLESHOOTING.md).
- For the official documentation underlying this stack, read [`references/SOURCES.md`](references/SOURCES.md).

## Architecture-family mapping

### CNN

```text
Input tensor → Conv → BatchNorm → Activation → Feature map → Pooling
```

Use tensor nodes before and after shape-changing operations. Encode `C × H × W` with bounded width/height/depth and show exact shape as text.

### Transformer / LLM

```text
Tokens → Embedding → Norm → Q/K/V projections → Attention → Residual → MLP
```

Use named handles for Q/K/V, formulas for attention/norm where useful, and a distinct residual path. Repeated layers may be grouped or collapsed.

### Object detection

```text
Image → Backbone → FPN/PAN → Multi-scale tensors → Heads → Boxes/classes
```

Use explicit scale ports or level labels (`C3`, `C4`, `C5`, `P3`, `P4`, `P5`). Preserve level order in ELK ports.

### Vision Transformer

```text
Image → Patchify → Projection → Position embedding → Encoder → Head
```

Show the transition from image tensor to token sequence explicitly; do not reuse a CNN feature-map graphic if it obscures token semantics.

## Guardrails

- The Model IR is the source of truth; React Flow objects are a rendering adapter.
- Node size is an input to ELK, not an incidental result to ignore.
- Port IDs are graph-global in ELK and logically consistent across all three layers.
- Semantic dimensions remain exact in text while visual dimensions are bounded.
- KaTeX output is configured as untrusted when formulas may be external.
- Layout runs from structural triggers, not from every node-state update.
- Start flat and interactive; add compound graphs or ELK bend-point routing only when the product requires them.
