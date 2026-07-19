# Implementation Reference

Use this reference while implementing React Flow nodes and edges, SVG tensor graphics, KaTeX formulas, or the ELK adapter.

## Suggested project layout

```text
src/
├── App.tsx
├── architecture/
│   ├── model-types.ts
│   ├── adapters.ts
│   ├── sample-cnn.ts
│   └── sample-transformer.ts
├── flow/
│   ├── ArchitectureCanvas.tsx
│   ├── layout/elk-layout.ts
│   ├── nodes/
│   │   ├── TensorNode.tsx
│   │   ├── OperationNode.tsx
│   │   ├── AttentionNode.tsx
│   │   └── GroupNode.tsx
│   └── edges/
│       ├── DataEdge.tsx
│       └── SkipEdge.tsx
├── components/
│   ├── MathFormula.tsx
│   └── TensorBlock.tsx
└── styles/
    ├── flow.css
    ├── nodes.css
    └── tensor.css
```

## Model data types

Keep domain types independent of React Flow:

```ts
export type TensorShape = Array<number | string>;

export type TensorNodeData = {
  label: string;
  shape: TensorShape;
  layout?: "CHW" | "HWC" | "BCHW" | "BTD";
  description?: string;
};

export type OperationNodeData = {
  label: string;
  operation: string;
  formula?: string;
  inputShape?: TensorShape;
  outputShape?: TensorShape;
  parameters?: Record<string, string | number>;
};

export type AttentionNodeData = {
  label: string;
  heads: number;
  embeddingDim: number;
  sequenceLength?: number;
  formula?: string;
};
```

If the host React Flow version supports generic node types, prefer them over casts. Adapt to the installed API rather than assuming the examples match every version.

## SVG tensor block

A 2.5D stack communicates spatial size and channel depth without WebGL:

```tsx
type TensorBlockProps = {
  width?: number;
  height?: number;
  depth?: number;
  channels?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function TensorBlock({
  width = 80,
  height = 100,
  depth = 18,
  channels = 1,
}: TensorBlockProps) {
  const visibleLayers = clamp(
    Math.round(Math.log2(Math.max(channels, 1))) + 1,
    1,
    6,
  );
  const offset = Math.min(depth / visibleLayers, 6);
  const totalOffset = offset * (visibleLayers - 1);

  return (
    <svg
      width={width + totalOffset + 4}
      height={height + totalOffset + 4}
      viewBox={`0 0 ${width + totalOffset + 4} ${height + totalOffset + 4}`}
      role="img"
      aria-label={`Tensor with ${channels} channels`}
    >
      {Array.from({ length: visibleLayers }).map((_, index) => {
        const reverse = visibleLayers - index - 1;
        const x = reverse * offset;
        const y = reverse * offset;

        return (
          <g key={index} transform={`translate(${x}, ${y})`}>
            <rect
              x={1}
              y={1}
              width={width}
              height={height}
              rx={4}
              className="tensor-block__face"
            />
            <line
              x1={1}
              y1={1}
              x2={1 + offset}
              y2={1 + offset}
              className="tensor-block__depth-line"
            />
            <line
              x1={width + 1}
              y1={1}
              x2={width + offset + 1}
              y2={offset + 1}
              className="tensor-block__depth-line"
            />
          </g>
        );
      })}
    </svg>
  );
}
```

```css
.tensor-block__face {
  fill: rgb(91 141 239 / 22%);
  stroke: #4169a8;
  stroke-width: 1.5;
}

.tensor-block__depth-line {
  stroke: #4169a8;
  stroke-width: 1;
  opacity: 0.6;
}
```

Map shape to bounded visual dimensions:

```ts
function toNumber(value: number | string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function visualDimension(
  value: number | undefined,
  minPixels: number,
  maxPixels: number,
): number {
  if (value === undefined) return minPixels;
  const scaled = Math.log2(Math.max(value, 2)) * 12;
  return Math.max(minPixels, Math.min(maxPixels, scaled));
}
```

For `CHW`, dimensions can map as:

```ts
const [channels, height, width] = shape;
const visualWidth = visualDimension(toNumber(width), 42, 100);
const visualHeight = visualDimension(toNumber(height), 42, 120);
const visualDepth = visualDimension(toNumber(channels), 8, 36);
```

Interpret shape according to its declared layout. A `BTD` sequence is not a `CHW` image; either use a token/matrix visual or map dimensions with explicit semantics.

## React Flow tensor node

```tsx
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { TensorBlock } from "../../components/TensorBlock";
import type { TensorNodeData } from "../../architecture/model-types";

export function TensorNode({ data, selected }: NodeProps) {
  const tensor = data as TensorNodeData;
  const [channels = 1, height = 1, width = 1] = tensor.shape;
  const c = Number(channels) || 1;
  const h = Number(height) || 1;
  const w = Number(width) || 1;

  return (
    <div className={`architecture-node tensor-node${selected ? " architecture-node--selected" : ""}`}>
      <Handle id="input" type="target" position={Position.Left} />
      <TensorBlock
        channels={c}
        width={visualDimension(w, 42, 90)}
        height={visualDimension(h, 42, 105)}
        depth={visualDimension(c, 8, 30)}
      />
      <div className="tensor-node__content">
        <strong>{tensor.label}</strong>
        <code>{tensor.shape.map(String).join(" × ")}</code>
        {tensor.layout ? <small>{tensor.layout}</small> : null}
        {tensor.description ? <p>{tensor.description}</p> : null}
      </div>
      <Handle id="output" type="source" position={Position.Right} />
    </div>
  );
}
```

## KaTeX formula component

```tsx
import katex from "katex";
import "katex/dist/katex.min.css";

type MathFormulaProps = {
  expression: string;
  displayMode?: boolean;
  className?: string;
};

export function MathFormula({
  expression,
  displayMode = false,
  className,
}: MathFormulaProps) {
  const html = katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    strict: "warn",
    trust: false,
    output: "html",
  });

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

KaTeX generates the inserted HTML. Model labels and descriptions should remain ordinary React text nodes. Keep formula containers scrollable or width-bounded so a long formula cannot silently change the node size beyond ELK’s input.

## Attention node and ordered handles

```tsx
export function AttentionNode({ data, selected }: NodeProps) {
  const attention = data as AttentionNodeData;

  return (
    <div className={`architecture-node attention-node${selected ? " architecture-node--selected" : ""}`}>
      <Handle id="q" type="target" position={Position.Left} style={{ top: "28%" }} />
      <Handle id="k" type="target" position={Position.Left} style={{ top: "50%" }} />
      <Handle id="v" type="target" position={Position.Left} style={{ top: "72%" }} />

      <div className="attention-node__inputs" aria-hidden="true">
        <span>Q</span><span>K</span><span>V</span>
      </div>
      <div className="attention-node__body">
        <strong>{attention.label}</strong>
        <MathFormula
          expression={attention.formula ?? "\\operatorname{Attention}(Q,K,V)=\\operatorname{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V"}
          displayMode
        />
        <div className="attention-node__metadata">
          <span>heads = {attention.heads}</span>
          <span>d<sub>model</sub> = {attention.embeddingDim}</span>
        </div>
      </div>
      <Handle id="output" type="source" position={Position.Right} />
    </div>
  );
}
```

ELK ports for that node:

```ts
function getElkPorts(node: Node) {
  if (node.type === "attention") {
    return [
      { id: `${node.id}:q`, width: 8, height: 8, layoutOptions: { "elk.port.side": "WEST", "elk.port.index": "0" } },
      { id: `${node.id}:k`, width: 8, height: 8, layoutOptions: { "elk.port.side": "WEST", "elk.port.index": "1" } },
      { id: `${node.id}:v`, width: 8, height: 8, layoutOptions: { "elk.port.side": "WEST", "elk.port.index": "2" } },
      { id: `${node.id}:output`, width: 8, height: 8, layoutOptions: { "elk.port.side": "EAST" } },
    ];
  }

  return [
    { id: `${node.id}:input`, width: 8, height: 8, layoutOptions: { "elk.port.side": "WEST" } },
    { id: `${node.id}:output`, width: 8, height: 8, layoutOptions: { "elk.port.side": "EAST" } },
  ];
}
```

Set `org.eclipse.elk.portConstraints` or `elk.portConstraints` to `FIXED_ORDER` for attention and other order-sensitive multi-port nodes.

## Data and skip edges

```tsx
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

export function DataEdge(props: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
    offset: 24,
  });

  return <BaseEdge path={path} markerEnd={props.markerEnd} className="data-edge" />;
}
```

```tsx
export function SkipEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps) {
  const distance = Math.abs(targetX - sourceX);
  const lift = Math.max(45, Math.min(130, distance * 0.22));
  const topY = Math.min(sourceY, targetY) - lift;

  const path = [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX + 18} ${sourceY}`,
    `Q ${sourceX + 28} ${sourceY} ${sourceX + 28} ${sourceY - 10}`,
    `L ${sourceX + 28} ${topY + 10}`,
    `Q ${sourceX + 28} ${topY} ${sourceX + 38} ${topY}`,
    `L ${targetX - 38} ${topY}`,
    `Q ${targetX - 28} ${topY} ${targetX - 28} ${topY + 10}`,
    `L ${targetX - 28} ${targetY - 10}`,
    `Q ${targetX - 28} ${targetY} ${targetX - 18} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ");

  return <BaseEdge path={path} markerEnd={markerEnd} className="skip-edge" />;
}
```

```css
.data-edge {
  stroke: #5d6b82;
  stroke-width: 1.7;
}

.skip-edge {
  stroke: #8a5cb8;
  stroke-width: 1.8;
  stroke-dasharray: 7 4;
}
```

The custom skip path assumes a mostly horizontal flow. Build a corresponding side route for vertical orientation or use `smoothstep` until both orientations are required.

## ELK layout adapter

```ts
import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import { Position, type Edge, type Node } from "@xyflow/react";

const elk = new ELK();

type LayoutDirection = "RIGHT" | "DOWN";

function getNodeSize(node: Node) {
  switch (node.type) {
    case "tensor": return { width: 220, height: 150 };
    case "attention": return { width: 340, height: 210 };
    case "operation": return { width: 260, height: 170 };
    default: return { width: 220, height: 120 };
  }
}

export async function layoutWithElk(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = "RIGHT",
) {
  const horizontal = direction === "RIGHT";

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.edgeNode": "25",
      "elk.spacing.edgeEdge": "15",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: nodes.map((node) => {
      const size = getNodeSize(node);
      return {
        id: node.id,
        width: node.measured?.width ?? node.width ?? size.width,
        height: node.measured?.height ?? node.height ?? size.height,
        layoutOptions: {
          "elk.portConstraints": node.type === "attention" ? "FIXED_ORDER" : "FIXED_SIDE",
        },
        ports: getElkPorts(node),
      };
    }),
    edges: edges.map((edge): ElkExtendedEdge => ({
      id: edge.id,
      sources: [`${edge.source}:${edge.sourceHandle ?? "output"}`],
      targets: [`${edge.target}:${edge.targetHandle ?? "input"}`],
    })),
  };

  const result = await elk.layout(graph);
  const positions = new Map(
    result.children?.map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]) ?? [],
  );

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
      sourcePosition: horizontal ? Position.Right : Position.Bottom,
      targetPosition: horizontal ? Position.Left : Position.Top,
    })),
    edges,
  };
}
```

`getElkPorts` must also switch sides for vertical orientation. Pass orientation into the function rather than leaving the hard-coded horizontal sides shown in the compact example.

## Canvas integration

Keep `nodeTypes` and `edgeTypes` at module scope:

```ts
const nodeTypes = {
  tensor: TensorNode,
  operation: OperationNode,
  attention: AttentionNode,
};

const edgeTypes = {
  data: DataEdge,
  skip: SkipEdge,
};
```

Use a callback for layout and trigger it only on intentional events. When measured dimensions are required:

```ts
await document.fonts.ready;
const result = await layoutWithElk(nodes, edges, direction);
setNodes(result.nodes);
requestAnimationFrame(() => void fitView({ padding: 0.15, duration: 450 }));
```

A simple canvas should include `Background`, `Controls`, and optionally `MiniMap`. Publication mode should hide editor controls and use export-aware styling.
