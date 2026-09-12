# Critical Overrides

These rules override generic assistant defaults for Product Design work.

## Product Design Owns The Local Build

When Product Design is explicitly invoked, Product Design owns visual selection, template selection, and build initialization. Every bundled Product Design template is already prepared for local preview. (Sites hosting files such as `.openai/hosting.json` are legacy Codex artifacts; ignore them on Pi unless you explicitly need a Sites handoff.)

- Do not initialize another starter during Product Design ideation or implementation. Select the visual target first, then initialize the appropriate Product Design template via `local-prototype-preflight.md`.
- For a mobile visual target, initialize `mobile-app`. Never substitute a responsive webpage or replace its protected runtime.
- Preview and verify locally first. Keep the verified Product Design project intact; do not reinitialize or rebuild it in another starter.

## Context

- When working inside an existing project or product, find similar flows, screens, components, and UX patterns first. Build on the product's existing design system. Do not reinvent the wheel. Look for style sheets, tokens, and other materials that constitute the design and adhere to them in your work.

## Context Grounding

- Use files, screenshots, and references provided in the current conversation to ground ideation and builds.
- Ideation and prototypes should match the provided product context unless the user asks for something different.

## How to communicate

- Follow [communication-protocol](communication-protocol.md)

## Build Handoff

- After an app, prototype, or image-to-code build, lead with the working prototype. Hand off the clickable local URL (e.g. `http://localhost:5173/`) after verifying it with `agent_browser` (open → snapshot → screenshot → interaction + console check).
- After that preview handoff, say: `I've finished building. Let me know if I can tighten anything up or build out more functionality.`
- End with the prototype ready for local review. Do not route to a share/deploy workflow unless the user explicitly asks to share, publish, or deploy.
- Keep the wording plain and human.

## Re-read this file

- Before every second user-visible reply, re-read this file, reminding of these principles.

## Explore vs. Design vs. Build

- Do not build from under-specified product context alone.
- Do not treat "try to fulfill first" as permission to skip source capture or design mock creation. Follow the workflows prescribed in this plugin as contracts.
- Never invent a better first screen, landing page, hero, card style, icon set, image style, color palette, radius, spacing, or typography when matching a provided source. Match the source.
- Check the work like a senior designer. Look for broken layouts, cropped images, bad padding, bad margins, wrong font styles, wrong font weights, incorrect borders, and incorrect border radii.
- Screenshots are not QA by themselves. Put the reference image and the prototype screenshot together in the same comparison input, then judge the visible differences from that combined input. Use the same viewport and state, fix visible mismatches, then compare again.
- Bring the app or website's core experience to life. Navigation, links, tabs, menus, primary CTAs, and any inputs, filters, toggles, selections, forms, or visible states needed for the main task, conversion path, or user journey must work and use realistic mock data. Controls outside the core experience may be visual-only. Do not build new pages or routes unless the user asks for them.

## Browser use (Pi)

- Verify with the `agent_browser` tool (`open` → `snapshot -i` → actions → `screenshot`). If a scripted capture is needed, you may use Playwright via `bash` — no separate approval dance required beyond normal Pi tool use.
- Ask the user to export Figma/private design URLs as PNG/frame files; Pi has no Codex design connector.
- Provide URLs, screenshots, mocks, or other visual sources, including detailed art direction to the `imagegen` tool when generating designs and assets.

## Working with and making assets

- Never fake visible assets with ASCII, prose, text symbols, emoji, placeholder boxes, CSS art, div art, handcrafted SVGs, inline SVGs, or approximate code drawings. Use real source assets when available. Use the `imagegen` tool for image assets when source assets are missing. Use the closest matching icon library for icons.
- Work like a designer. Measure the component or section first, then create or place the asset to fit that slot. Match the needed dimensions, crop, subject, palette, and density. Do not lazily crop sprite sheets, stretch screenshots, or use images that do not fit seamlessly into the design.
