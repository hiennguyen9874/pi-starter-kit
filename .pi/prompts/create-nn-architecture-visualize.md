---
description: Create/update visual nn architecture
skills:
  - nn-architecture-visualization
---
Use the loaded skill `nn-architecture-visualization` to create or update the code in the current `./web` directory for visualizing the deep learning model architecture described in the user request.

First, inspect the existing code in `./web` and preserve its current conventions, structure, framework, and reusable components where appropriate. Extend or refactor the existing implementation rather than creating an unrelated standalone project.

User request:

$ARGUMENTS

Design the visualization so that the architecture is presented from general to detailed:

1. Start with a high-level overview of the complete model and its main stages, such as input processing, backbone or encoder, intermediate feature transformations, fusion modules, decoder or head, and final outputs.
2. Allow the viewer to progressively understand deeper levels of the architecture, including stages, repeated blocks, internal submodules, data branches, skip connections, residual paths, and feature fusion.
3. Clearly show the data flow direction and relationships between components. Avoid ambiguous edge crossings and visually separate the main path from residual, skip, auxiliary, or multi-scale paths.
4. Display input and output shapes for important nodes and transformations. Use consistent tensor notation, for example:

   * `B × C × H × W`
   * `B × T × D`
   * `B × N × C`
5. Show important shape transformations directly on the diagram, including:

   * spatial downsampling or upsampling;
   * channel expansion or reduction;
   * tokenization or patch embedding;
   * concatenation, addition, reshape, transpose, flatten, split, and merge operations;
   * multi-scale feature transitions;
   * attention projection dimensions;
   * detection, segmentation, classification, or sequence output dimensions.
6. For important operations, show enough calculation details to explain how the output shape is obtained. Examples include convolution output size, patch count, attention head dimensions, concatenated channel count, feature pyramid resolutions, and final prediction tensor structure.
7. Include concise formulas or annotations where they improve understanding, but do not overload the primary diagram. Keep secondary implementation details inside expandable panels, tooltips, side panels, or lower-level views.
8. Use visually distinct node types for:

   * input data;
   * tensors or feature maps;
   * convolutional or linear operations;
   * normalization and activation;
   * attention blocks;
   * recurrent or temporal blocks;
   * reshape and tensor operations;
   * fusion operations;
   * output heads;
   * repeated modules or grouped stages.
9. Represent feature maps and tensors with intuitive SVG or CSS-based 2.5D visuals where useful. Their visual proportions should communicate changes in spatial resolution, sequence length, channel count, embedding dimension, or number of tokens without using raw dimensions as pixel sizes.
10. Repeated structures such as Transformer blocks, ResNet stages, CSP blocks, encoder layers, decoder layers, or recurrent cells should be shown as grouped or collapsible modules with repetition counts such as `×12`, while still allowing the internal structure of one representative block to be inspected.
11. Use automatic layout suitable for directed neural-network graphs. Maintain clear hierarchy, balanced spacing, readable labels, aligned ports, and stable placement for multi-input or multi-output nodes.
12. Make the visualization interactive where appropriate:

* zoom and pan;
* node selection;
* fit-to-view;
* expand or collapse grouped blocks;
* switch between overview and detailed views;
* inspect node metadata, parameters, formulas, and tensor shapes;
* highlight the upstream or downstream data path of a selected node.

13. Provide a useful information panel for the selected component. Depending on the model, it may show:

* operation name;
* purpose;
* input and output shapes;
* parameters;
* kernel, stride, padding, dilation, or groups;
* number of heads and head dimension;
* hidden and intermediate dimensions;
* parameter count or approximate computation;
* shape derivation;
* notes about residual or fusion behavior.

14. Ensure that the visualization remains understandable for large architectures. Use grouping, hierarchy, filtering, level-of-detail, and progressive disclosure rather than rendering every low-level operator in one crowded graph.
15. Include a small legend explaining node types, edge types, tensor notation, and any visual encoding used.
16. Use a clean technical visual style suitable for model design, engineering documentation, research discussions, and presentations. Prioritize readability and architectural meaning over decorative effects.
17. Ensure the result works responsively in the existing web application and supports both light and dark backgrounds if the current project has them.
18. Use realistic architecture information derived from the user request. Do not invent unexplained layers, dimensions, or formulas. When a detail is unspecified, make the assumption visible in the UI or represent it symbolically instead of pretending it is known.
19. Add representative sample data or a default architecture view so the visualization is immediately visible when the web application starts.
20. Keep model data separate from rendering and layout logic. Define a reusable architecture representation that can describe nodes, ports, edges, groups, tensor shapes, formulas, parameters, and hierarchy, so future model architectures can be added without rewriting the visualization system.

The final result in `./web` should function as an architecture exploration tool, not merely a static flowchart. A viewer should be able to understand:

* what the overall model does;
* how data moves through the model;
* how each major stage changes the tensor;
* why input and output shapes have their displayed values;
* how repeated blocks and branches are organized;
* how the final model output is produced.
