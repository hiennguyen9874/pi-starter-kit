# Worked Examples

They demonstrate model semantics and graph wiring; adapt their types to the host project’s Model IR and installed React Flow version.

## Example 1: CNN feature extraction

The visual story is:

```text
Input image [3,224,224]
  → Conv2D 7×7 stride 2
  → Feature map [64,112,112]
  → MaxPool 3×3 stride 2
  → Feature map [64,56,56]
```

```ts
import type { Edge, Node } from "@xyflow/react";
import type { OperationNodeData, TensorNodeData } from "./model-types";

export const cnnNodes: Node[] = [
  {
    id: "input",
    type: "tensor",
    position: { x: 0, y: 0 },
    data: {
      label: "Input image",
      shape: [3, 224, 224],
      layout: "CHW",
      description: "RGB image",
    } satisfies TensorNodeData,
  },
  {
    id: "conv1",
    type: "operation",
    position: { x: 0, y: 0 },
    data: {
      label: "Conv2D",
      operation: "7×7, stride 2",
      formula: "Y_{b,c_o,h,w}=\\sum_{c_i,i,j}W_{c_o,c_i,i,j}X_{b,c_i,h+i,w+j}",
      inputShape: [3, 224, 224],
      outputShape: [64, 112, 112],
      parameters: { kernel: "7×7", stride: 2, padding: 3 },
    } satisfies OperationNodeData,
  },
  {
    id: "feature1",
    type: "tensor",
    position: { x: 0, y: 0 },
    data: {
      label: "Feature map",
      shape: [64, 112, 112],
      layout: "CHW",
    } satisfies TensorNodeData,
  },
  {
    id: "pool",
    type: "operation",
    position: { x: 0, y: 0 },
    data: {
      label: "MaxPool",
      operation: "3×3, stride 2",
      inputShape: [64, 112, 112],
      outputShape: [64, 56, 56],
    } satisfies OperationNodeData,
  },
  {
    id: "feature2",
    type: "tensor",
    position: { x: 0, y: 0 },
    data: {
      label: "Feature map",
      shape: [64, 56, 56],
      layout: "CHW",
    } satisfies TensorNodeData,
  },
];

export const cnnEdges: Edge[] = [
  { id: "input-conv1", source: "input", target: "conv1", type: "data" },
  { id: "conv1-feature1", source: "conv1", target: "feature1", type: "data" },
  { id: "feature1-pool", source: "feature1", target: "pool", type: "data" },
  { id: "pool-feature2", source: "pool", target: "feature2", type: "data" },
];
```

### What the renderer should communicate

- Exact dimensions stay in labels.
- Input is spatially broad and visually thin.
- The first feature map is deeper and slightly less broad.
- The second feature map is similarly deep and spatially smaller.
- Operations are cards, not tensor blocks.
- The convolution formula is optional detail and should not dominate fit-to-view.

### Validation checks

- Each operation’s `inputShape` equals the previous tensor’s `shape`.
- Each operation’s `outputShape` equals the next tensor’s `shape`.
- ELK sees dimensions large enough for the Conv2D formula.
- All four edges resolve to default `output` and `input` ports.

## Example 2: Transformer attention with residual path

The visual story is:

```text
Token embeddings
  → RMSNorm
  ├→ Q projection ─→ Q ┐
  ├→ K projection ─→ K ├→ Attention → Residual Add
  └→ V projection ─→ V ┘                  ↑
Token embeddings ───────── skip ──────────┘
```

```ts
import type { Edge, Node } from "@xyflow/react";

export const transformerNodes: Node[] = [
  {
    id: "tokens",
    type: "tensor",
    position: { x: 0, y: 0 },
    data: {
      label: "Token embeddings",
      shape: ["T", 768],
      layout: "BTD",
    },
  },
  {
    id: "ln1",
    type: "operation",
    position: { x: 0, y: 0 },
    data: {
      label: "RMSNorm",
      operation: "Normalize hidden states",
      formula: "\\operatorname{RMSNorm}(x)=\\frac{x}{\\sqrt{\\frac{1}{d}\\sum_i x_i^2+\\epsilon}}\\odot g",
    },
  },
  {
    id: "q-proj",
    type: "operation",
    position: { x: 0, y: 0 },
    data: { label: "Q projection", operation: "XW_Q" },
  },
  {
    id: "k-proj",
    type: "operation",
    position: { x: 0, y: 0 },
    data: { label: "K projection", operation: "XW_K" },
  },
  {
    id: "v-proj",
    type: "operation",
    position: { x: 0, y: 0 },
    data: { label: "V projection", operation: "XW_V" },
  },
  {
    id: "attention",
    type: "attention",
    position: { x: 0, y: 0 },
    data: {
      label: "Causal self-attention",
      heads: 12,
      embeddingDim: 768,
      sequenceLength: 2048,
    },
  },
  {
    id: "add1",
    type: "operation",
    position: { x: 0, y: 0 },
    data: {
      label: "Residual Add",
      operation: "x + Attention(x)",
      formula: "y=x+\\operatorname{Attention}(x)",
    },
  },
];

export const transformerEdges: Edge[] = [
  { id: "tokens-ln1", source: "tokens", target: "ln1", type: "data" },
  { id: "ln1-q", source: "ln1", target: "q-proj", type: "data" },
  { id: "ln1-k", source: "ln1", target: "k-proj", type: "data" },
  { id: "ln1-v", source: "ln1", target: "v-proj", type: "data" },
  {
    id: "q-attention",
    source: "q-proj",
    sourceHandle: "output",
    target: "attention",
    targetHandle: "q",
    type: "data",
  },
  {
    id: "k-attention",
    source: "k-proj",
    sourceHandle: "output",
    target: "attention",
    targetHandle: "k",
    type: "data",
  },
  {
    id: "v-attention",
    source: "v-proj",
    sourceHandle: "output",
    target: "attention",
    targetHandle: "v",
    type: "data",
  },
  { id: "attention-add", source: "attention", target: "add1", type: "data" },
  { id: "residual-add", source: "tokens", target: "add1", type: "skip" },
];
```

### Port mapping

For `q-attention`:

```text
React Flow source handle: q-proj/output
ELK source port:          q-proj:output
React Flow target handle: attention/q
ELK target port:          attention:q
```

Repeat the same mapping for K and V. Set attention’s ELK port constraint to `FIXED_ORDER` and assign indexes 0, 1, and 2.

### What the renderer should communicate

- The token object is a sequence/matrix, even if the first version reuses a generic tensor node.
- Q/K/V are separate branches with stable vertical order.
- Attention shows its formula and head/model dimensions without overwhelming the graph.
- The residual edge bypasses norm and attention and joins at `add1`.
- The residual edge has a distinct route and line style.

### Validation checks

- Q, K, and V edges target the corresponding handles.
- ELK port IDs are graph-global and exist before layout.
- The residual source is the pre-normalization token state.
- Formula strings remain valid escaped JavaScript strings.
- The skip path clears the tallest nodes in horizontal layout.

## Example 3: Grouped repeated block

A repeated model stage can be represented as a group:

```ts
const nodes: Node[] = [
  {
    id: "transformer-block",
    type: "group",
    position: { x: 100, y: 100 },
    style: { width: 900, height: 420 },
    data: { label: "Transformer Block × 32" },
  },
  {
    id: "attention",
    type: "attention",
    parentId: "transformer-block",
    extent: "parent",
    position: { x: 80, y: 100 },
    data: {
      label: "Self-Attention",
      heads: 32,
      embeddingDim: 4096,
    },
  },
];
```

For ELK compound layout, mirror the hierarchy:

```text
root
└── transformer-block
    ├── norm
    ├── attention
    ├── add
    ├── mlp
    └── add
```

Use a flat graph first when nested editing is not a requirement. If repeated stages are collapsed, represent the multiplicity (`× 32`) in the domain model or a display projection rather than silently dropping it.

## Example 4: ELK edge sections for publication routing

When ELK owns routing, convert its first edge section to SVG:

```ts
type ElkSection = {
  startPoint: { x: number; y: number };
  bendPoints?: Array<{ x: number; y: number }>;
  endPoint: { x: number; y: number };
};

function elkSectionToPath(section: ElkSection): string {
  const points = [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ];

  return points
    .map((point, index) =>
      index === 0
        ? `M ${point.x} ${point.y}`
        : `L ${point.x} ${point.y}`,
    )
    .join(" ");
}
```

Store the section or generated path in edge display data. Define behavior for multiple sections and junction points before using this for arbitrary graphs. For interactive dragging, either re-run ELK or temporarily fall back to a React Flow-computed path.
