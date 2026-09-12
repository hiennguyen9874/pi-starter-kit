# Product Design (idea → image → code)

Turn early product ideas into visual directions, then into runnable prototypes.

Flow: `get-context` → `ideate` → `image-to-code` (+ `design-qa` as build gate).

## When to use this plugin

Use Product Design when you want to explore a new direction from a written brief and build a prototype people can interact with. Start from a written brief, screenshots, or a design image.

## Get started

Try asking:

`Build a clickable prototype for this product idea`

The plugin will clarify the target + user outcome (`get-context`), generate three visual directions (`ideate`), then build the one you pick (`image-to-code`).

## Example workflows

| Workflow | Try this | Skill | Result |
| --- | --- | --- | --- |
| Prototype a new idea | `Build a clickable prototype for this product idea` | `get-context` → `ideate` → `image-to-code` | Three visual directions to choose from, followed by a runnable prototype based on your selection |
| Explore visual directions | `Turn this product idea into three visual directions` | `ideate` | Distinct concepts you can compare before choosing what to build |
| Implement a selected design | `Turn this selected mockup into a responsive prototype` | `image-to-code` | A faithful, interactive implementation of the design you selected |

### Tip: Refine a prototype with screenshots

When editing a prototype, send a screenshot plus a short description of the exact element you want to change (target + desired change). Scoped revision requests keep the rest of the prototype intact and are faster than re-describing the whole screen.

> Pi note: Pi has no Codex in-app Annotations tool. A marked-up screenshot + text works the same way.

## Integrations

| Tool | What it unlocks |
| --- | --- |
| `agent_browser` (or Playwright via `bash`) | Verifying the local prototype and running prototype QA |
| `imagegen` | Exploring visual directions and producing assets for the selected direction |
