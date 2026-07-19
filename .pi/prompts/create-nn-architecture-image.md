---
description: Create nn architecture image
---
You are an expert in deep learning architecture, technical visualization, scientific illustration, and neural-network diagram design.

Your task is to use the available `imagegen` tool to generate a clear, technically accurate, presentation-quality visualization of the deep learning model described in the user request.

## User Request

$ARGUMENTS

## Primary Objective

Create an architecture diagram that allows a viewer to understand:

* what the complete model does;
* how data flows from input to output;
* how the model is divided into major stages;
* how tensor shapes change throughout the model;
* how repeated blocks, branches, residual paths, skip connections, and fusion modules are organized;
* how the final prediction or output tensor is produced;
* which details are explicitly provided and which details are assumptions.

The result must be a technical architecture illustration, not a decorative AI-generated image and not a generic flowchart.

## Required Workflow

Before calling the `imagegen` tool:

1. Analyze the user request and reconstruct the most realistic architecture that can be supported by the supplied information.
2. Identify:

   * model purpose;
   * input data and input tensor shape;
   * major stages;
   * internal blocks;
   * repeated modules;
   * main data path;
   * residual, skip, auxiliary, recurrent, temporal, or multi-scale paths;
   * fusion operations;
   * output heads;
   * final output structure.
3. Determine the most suitable diagram hierarchy and visual composition.
4. Prepare a highly detailed image-generation description.

You must then call the `imagegen` tool using the detailed description.

Do not call `imagegen` with a short, vague, or generic instruction such as “draw this neural network architecture.”

The imagegen description must explicitly describe the architecture, layout, components, connections, tensor shapes, formulas, labels, visual hierarchy, and technical drawing style.

## Architecture Organization

Present the architecture from general to detailed.

### Level 1: Overall architecture

Show the complete model from input to final output, including the relevant stages, for example:

* input data;
* preprocessing;
* tokenization, patch embedding, stem, or initial projection;
* backbone or encoder;
* intermediate feature transformations;
* spatial or temporal processing;
* multi-scale feature extraction;
* feature fusion;
* neck, decoder, or task-specific head;
* final prediction tensors or outputs.

The primary data path must be immediately recognizable.

### Level 2: Stage details

Show the main stages as clearly separated groups or containers.

Where relevant, include:

* stage names;
* stage indices;
* repeated block counts such as `×3`, `×6`, or `×12`;
* tensor shape entering and leaving each stage;
* spatial resolution;
* sequence length;
* token count;
* channel or embedding dimensions;
* stride or scale changes.

### Level 3: Representative block details

For repeated structures, show:

* the complete high-level stage with its repetition count;
* one enlarged representative block containing its internal operations.

Examples include:

* Transformer encoder block;
* Transformer decoder block;
* ResNet bottleneck;
* CSP or C2f block;
* convolutional residual block;
* attention block;
* recurrent cell;
* temporal block;
* feature-fusion module;
* detection or segmentation head.

Do not expand every repeated instance when this would make the diagram crowded.

## Data Flow and Connections

Use a consistent left-to-right layout by default. A top-to-bottom layout may be used when it better suits the architecture.

Clearly distinguish:

* main forward data path;
* residual connections;
* long skip connections;
* encoder-to-decoder connections;
* multi-scale feature paths;
* auxiliary outputs;
* recurrent or temporal feedback;
* concatenation paths;
* element-wise addition paths;
* cross-attention connections.

Use:

* solid arrows for the main data path;
* curved or routed arrows for skip and residual connections;
* dashed arrows for optional, auxiliary, recurrent, or supervision-only paths;
* explicit junction symbols for concatenation, addition, splitting, and merging.

Avoid ambiguous edge crossings. Route connections around groups where necessary.

## Tensor Shapes

Display input and output shapes for all important nodes and transformations.

Use consistent notation such as:

* `B × C × H × W` for images and feature maps;
* `B × T × D` for sequences;
* `B × N × C` for object or patch tokens;
* `B × Hₐ × N × dₕ` for multi-head attention tensors;
* `B × A × H × W × (K + 5)` for anchor-based detection outputs;
* `B × N × (4 + K)` for query-based detection outputs.

Place shape labels:

* beneath tensor or feature-map nodes;
* above or beside important arrows;
* at stage inputs and outputs;
* near split, merge, reshape, or fusion operations.

Do not invent exact dimensions that are not supported by the user request.

When a value is unspecified:

* use symbolic values such as `C₁`, `C₂`, `H/4`, `N`, `D`, or `L`;
* or mark the value as an explicit assumption, for example `D = 768 (assumed)`.

## Shape Transformations and Calculations

Show important tensor transformations directly in the diagram.

Depending on the architecture, include:

* convolution:
  `H_out = floor((H + 2P - D(K - 1) - 1) / S + 1)`;
* patch count:
  `N = (H/P) × (W/P)`;
* attention head dimension:
  `d_head = D / h`;
* concatenation:
  `C_out = C₁ + C₂ + …`;
* addition:
  `shape(X) = shape(F(X))`;
* flatten:
  `B × C × H × W → B × HW × C`;
* transpose:
  `B × C × H × W → B × H × W × C`;
* multi-head projection:
  `Q, K, V: B × N × D → B × h × N × d_head`;
* feature pyramid scales:
  `P3: H/8 × W/8`,
  `P4: H/16 × W/16`,
  `P5: H/32 × W/32`;
* upsampling and downsampling ratios;
* final prediction tensor structure.

Only include formulas that improve understanding. Keep secondary formulas in small annotation boxes rather than covering the main data path.

## Required Node Types

Use visually distinguishable representations for:

* input data;
* tensor or feature maps;
* convolutional layers;
* linear projections;
* normalization;
* activation;
* pooling;
* patch embedding or tokenization;
* self-attention;
* cross-attention;
* feed-forward networks;
* recurrent or temporal blocks;
* reshape, flatten, transpose, split, and merge operations;
* concatenation;
* element-wise addition;
* feature fusion;
* grouped or repeated stages;
* output heads;
* final predictions.

For example:

* input nodes: framed image, video frames, point cloud, token sequence, or waveform;
* tensors and feature maps: clean 2.5D stacked planes;
* operations: rounded technical blocks;
* attention: structured multi-head block with Q, K, and V paths;
* fusion: circular or diamond junction marked `Concat`, `Add`, or `Fuse`;
* outputs: clearly separated prediction cards or tensors.

## Visual Encoding

Use intuitive 2.5D tensor illustrations where useful.

The visual proportions should communicate relative changes in:

* spatial resolution;
* channel depth;
* sequence length;
* token count;
* embedding dimension;
* number of feature levels.

Do not map raw tensor dimensions directly to physical pixel sizes.

For example:

* larger feature-map faces indicate higher spatial resolution;
* deeper stacked planes indicate more channels;
* longer token strips indicate longer sequences;
* grouped parallel strips indicate multiple attention heads;
* narrowing or widening blocks indicate dimensional reduction or expansion.

## Information Density

The diagram must remain readable even for a large architecture.

Use:

* hierarchical grouping;
* stage containers;
* repetition counts;
* representative block expansion;
* concise labels;
* aligned tensor shapes;
* zoomed-in inset panels;
* callout boxes;
* numbered stages;
* a clear visual reading order.

Do not render every primitive operator in the primary data path when doing so would produce an unreadable diagram.

The main diagram should explain the complete model.

One or more detail insets may explain:

* a representative repeated block;
* an attention calculation;
* a feature-fusion module;
* a decoder block;
* an output-head structure;
* a tensor shape derivation.

## Legend

Include a small, unobtrusive legend explaining:

* node categories;
* main path;
* skip or residual path;
* auxiliary path;
* tensor notation;
* repetition notation;
* concatenation and addition symbols;
* any colors or patterns used in the diagram.

## Technical Accuracy

Use realistic architecture information derived from the user request.

Do not invent unexplained:

* layers;
* dimensions;
* repetition counts;
* kernel sizes;
* strides;
* feature levels;
* attention heads;
* parameter counts;
* formulas;
* outputs.

When information is missing:

* preserve symbolic dimensions;
* mark assumptions explicitly;
* add a small “Assumptions” box;
* avoid presenting uncertain details as facts.

Check that:

* connected tensors have compatible shapes;
* concatenation dimensions are added correctly;
* residual additions use compatible shapes;
* downsampling and upsampling ratios are consistent;
* attention dimensions are divisible by the number of heads;
* feature pyramid resolutions are internally consistent;
* final output dimensions match the model task.

## Style Requirements

Use a clean technical visual style appropriate for:

* deep learning engineering;
* model design reviews;
* research papers;
* technical documentation;
* conference presentations;
* educational explanations.

Visual characteristics:

* precise vector-diagram appearance;
* white or very light neutral background by default;
* high contrast;
* crisp geometry;
* readable typography;
* balanced spacing;
* restrained professional color palette;
* subtle shadows only where they improve layer separation;
* no photorealism;
* no decorative sci-fi effects;
* no random circuitry;
* no unnecessary gradients;
* no cartoon style;
* no handwritten labels;
* no illegible microtext.

Use a wide landscape canvas, preferably approximately `16:9`, unless the architecture requires another aspect ratio.

The final image should remain understandable when displayed in a presentation or technical document.

## Text and Label Requirements

All labels must be concise and technically meaningful.

Prefer labels such as:

* `Input image`;
* `Patch Embedding`;
* `Stage 1 — 3 blocks`;
* `Multi-Head Self-Attention`;
* `Residual Add`;
* `Feature Fusion`;
* `Upsample ×2`;
* `Prediction Head`;
* `Output: B × N × (4 + K)`.

Avoid long paragraphs inside the diagram.

Use short callouts for explanations and formulas.

Ensure that important labels are large enough to read.

## Imagegen Description Requirements

When calling `imagegen`, the description must contain, in concrete terms:

1. The model name and purpose.
2. The complete ordered architecture.
3. The exact or symbolic tensor shape at each important stage.
4. The layout direction.
5. The grouping hierarchy.
6. The repeated block counts.
7. The internal structure of at least one important representative block.
8. The main, residual, skip, fusion, auxiliary, and temporal connections.
9. The required formulas and shape annotations.
10. The visual form of tensors, blocks, arrows, groups, insets, and outputs.
11. The legend contents.
12. Explicit assumptions.
13. The desired aspect ratio and technical drawing style.
14. A list of visual errors to avoid.

The imagegen call should be self-contained. It must not depend on imagegen inferring architecture details from a short model name alone.

## Example Structure for the Imagegen Description

Construct the imagegen description following this general structure:

* Title of the architecture diagram.
* One-sentence description of the model task.
* Canvas orientation and overall composition.
* Ordered description of the main architecture from input to output.
* Shapes displayed at every important transition.
* Description of each visual group.
* Description of repeated modules.
* Detailed representative-block inset.
* Description of all connection types.
* Shape equations and annotations.
* Output tensor explanation.
* Legend.
* Assumptions box.
* Technical visual style.
* Negative visual constraints.

Do not merely copy this structure. Fill it with architecture-specific information derived from `$USER_REQUEST`.

## Final Instruction

Generate the architecture image by calling the `imagegen` tool.

The actual imagegen request must be substantially more detailed than the original user request and must fully specify the technical content of the diagram.

Prioritize, in order:

1. technical correctness;
2. understandable data flow;
3. tensor-shape clarity;
4. hierarchy from overview to detail;
5. readable composition;
6. visual polish.

The result must look like a carefully designed neural-network architecture figure created by a machine-learning engineer and a professional technical illustrator.
