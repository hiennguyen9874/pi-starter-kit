---
description: Generate a traceable neural-network architecture diagram from a model description.
skills:
    - gpt-image
---

Create a presentation-quality neural-network architecture image with the available `imagegen` tool.

## Request

$ARGUMENTS

## Process

1. Extract only the architecture facts supported by the request: task, input/output, ordered stages, repetitions, tensor changes, branches, merges, and special paths.
2. Resolve the diagram hierarchy before writing the image prompt:
   - **Overview:** the complete input-to-output path.
   - **Stages:** named, grouped transformations and their scale or shape changes.
   - **Inset:** one representative repeated or otherwise important block, only when it adds information.
3. Make the diagram **traceable**: follow every displayed arrow from its source to a compatible destination. Mark `Add`, `Concat`, split, reshape, upsample, and downsample operations explicitly.
4. Use given dimensions verbatim. For unspecified values, use symbolic notation (`B`, `T`, `C₁`, `H/4`, `N`, `D`) rather than inventing numbers. If a necessary design choice cannot be avoided, put it in a small, explicit **Assumptions** box.
5. Write one self-contained, architecture-specific imagegen request, then call `imagegen` with it. Do not give the user a prose substitute for the image.

## Imagegen request

The request must specify all applicable items below in concrete terms:

- a concise title and the model's task;
- wide landscape composition (normally 16:9), with a left-to-right primary path unless another direction is clearly better;
- every major stage in order, including meaningful input/output tensor shapes, resolution or sequence-length changes, and repetition counts;
- containers for stages and a readable representative-block inset instead of expanding every repeated block;
- solid arrows for the forward path; routed curved arrows for residual or long skip paths; dashed arrows only for auxiliary or optional paths; clearly labelled junctions for `Add`, `Concat`, `Split`, and `Fuse`;
- the internal operations and compatible shapes of the representative block when relevant (for example attention Q/K/V, a residual bottleneck, temporal block, or fusion module);
- only shape equations that clarify a non-obvious transformation; place them as small callouts, not over the main path;
- a compact legend for arrow styles, tensor notation, repetition notation, and junction symbols;
- the explicit assumptions, if any;
- a clean vector technical-illustration style: white or light-neutral background, precise geometry, high contrast, restrained palette, aligned labels, readable large typography, and subtle depth only for tensor stacks.

Describe tensors as flat or stacked feature-map planes, token strips, or other forms appropriate to the input—not as decorative artwork. Make relative resolution, channel depth, sequence length, or token count visually apparent without treating values as literal physical scale.

Use short labels. The image should be intelligible at presentation size: prefer stage-level information and one useful inset over a crowded inventory of primitive layers.

## Accuracy guardrails

- Do not add unsupported layers, dimensions, strides, heads, kernels, feature levels, parameter counts, or output semantics.
- Do not imply a residual addition unless both operands have compatible shape; label a projection when one is supplied.
- Do not add formulas merely because they are common to an architecture family.
- Keep all text legible; avoid microtext, overlapping arrows, ambiguous crossings, unlabeled merges, and clipped content.
- Exclude photorealism, sci-fi circuitry, decorative gradients, cartoon styling, handwritten text, and generic flowchart treatment.

Call `imagegen` now. The generated image—not an explanation—is the required result.
