---
name: image-to-code
description: "Implement a selected image, screenshot, mockup, or imagegen reference as a faithful, responsive frontend."
---

# Image to Code

You're tasked with translating the visual target image into a high-quality, interactive website or web app.

## Critical Overrides

- Read the Plugin router [index](../product-design-router/SKILL.md) before proceeding.
- Follow [critical-overrides](../../references/critical-overrides.md).

### [IMPORTANT] Previewing prototypes on Pi

Starting a dev server is not verification. Verification requires opening the local URL with the `agent_browser` tool, inspecting the rendered page, testing primary interactions, checking browser console errors, and passing design QA.

Do not substitute HTTP health, build success, or deployment success for browser verification. If `agent_browser` cannot be used, report verification as blocked.

For local prototype verification and design QA on Pi:

1. Install dependencies if needed. The project must have an npm `dev` script.
2. Run `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` from the site root (pick a free port; keep it consistent for QA).
3. For Product Design Vite starters, use `"dev": "vite"`. Do not hardcode preview hosts in app code; use relative URLs and same-origin requests.
4. Open the local URL (e.g. `http://localhost:5173/`) with `agent_browser`: `open` → `snapshot -i` → exercise interactions → `screenshot`.
5. Verify the rendered site and its primary interactions before reporting completion.
6. Keep the local preview running for the user. Do not deploy or share unless the user explicitly asks to share, publish, or deploy.

## Workflow

CRITICAL: THIS IS NOT GUIDANCE. THIS IS A CHECKLIST TO COMPLETE.

1. Do not start unless you have a selected image, screenshot, mockup, or `imagegen` result to recreate. A written brief is not enough.

2. Resolve the exact selected visual target before building.

    - If the user selected a numbered `ideate` option, use the Nth presented option file from the most recent ideation set (Option 1 = first presented file, etc.). Do not use the original concept planning order or `imagegen` prompt submission order.
    - Use the concept-name list from `ideate` only when it was explicitly written in the same presented-file order.
    - A saved option file path, selected image attachment, screenshot, mockup, or exported frame is stronger than a bare ordinal. Prefer that exact reference when available.
    - If the selected result cannot be resolved unambiguously, stop before implementation and ask the user to name the concept or reattach/select the image. Never guess and build a nearby option.

    Mobile runtime exception: 1:1 fidelity applies only to app-owned content inside the device screen. `PhoneFrame`, `StatusBar`, `HomeIndicator`, `KeyboardDock`, and the device assets are template-owned infrastructure. Preserve them even if the reference omits them, depicts different device chrome, or includes chrome in the image. Never recreate device chrome as an image asset.

3. Treat the resolved image as the design to recreate.

4. If the provided design is a mobile viewport, build a mobile app. When creating a fresh local app for that case, use [local-prototype-preflight](../../references/local-prototype-preflight.md) with `--template mobile-app`. If it's unclear, default to desktop.

   Before planning or implementing with the `mobile-app` template, read its `AGENTS.md` and follow its runtime and component guidance.

5. Review the reference design, catalog every image asset in the design, and use the `imagegen` tool to create individual images for each one. Zoom in so you can catch every asset that needs to be generated.

    Examples include:

    - Hero images including full bleed image backgrounds
    - Featured article imagery
    - Thumbnails
    - Decorative illustrations
    - Textures and background motifs
    - Logos
    - Product images
    - Avatars

    Rules:

    - CRITICAL RULE: Do not create custom div art, CSS art, inline SVGs, handcrafted SVGs, HTML element drawings, div/span shapes, CSS drawings, gradients, emoji, or text glyphs instead of real icons and image assets ever. Use the imagegen tool for images and the closest matching icon library for icons.
    - If text is part of an image asset, keep it in the image asset. Examples include full bleed hero images, signs, posters, packaging, storefronts, article art, and illustrations where the type belongs to the visual itself. Do not crop the background image and recreate that text with transparent text boxes, HTML, CSS, or separate overlay layers unless the source clearly shows editable UI text sitting on top of the image.
    - Do not use generic placeholders where the reference implies custom visual content.
    - Generated assets must share the same art direction, palette, rendering style, and design language as the reference mockup.
    - The imagegen tool does not support transparent images; post-process generated assets when transparency is required.
    - For mobile prototypes, do not catalog or generate device bezels, notches, status bars, clocks, signal or battery indicators, or home indicators. The mobile runtime owns those elements.

### Sequential asset production (Pi)

Pi has no subagent spawn. After cataloging and measuring the reference assets, generate them sequentially with the `imagegen` tool while building the app structure.

Generate one raster asset per `imagegen` call with its reference crop, exact dimensions, focal point, style, output path, and consuming component. Save each asset to its output path and inspect it before placing it.

Prioritize critical above-the-fold assets first, then supporting assets. Do not delegate standard UI icons or supplied brand logos to `imagegen`; use the icon library instead.

6. Define all sections of the page. For each section, meticulously measure the layout, spacing between elements, and the size and space of the elements themselves.

7. Find freely available fonts that match the target design.

8. Find a freely available icon library that matches the target design. Do not default to Lucide icons. Search for the best match.

    Rules:

    - CRITICAL RULE: Do not create custom inline SVGs, handcrafted SVGs, HTML element drawings, div/span shapes, CSS drawings, gradients, emoji, or text glyphs. Use the imagegen tool to generate assets and use the closest matching icon library for icons.

9. Build the app starting with [local-prototype-preflight](../../references/local-prototype-preflight.md). Unless the user asks for a static mock, full production behavior, or a different scope, bring the app or website to life with:

    - Working navigation, links, tabs, menus, and primary CTAs.
    - Functional inputs, filters, toggles, selections, and forms shown in the main experience.
    - Visible UI states: hover, focus, selected, open/closed, loading, empty, and success where relevant.
    - The main task, conversion path, or user journey working from start to finish when the product has one.

    Controls outside the core experience may be visual-only. Do not build auth, persistence, backend/API calls, integrations, or exhaustive edge cases unless requested.

    Rules:

    - Place every image asset you generated into its position before proceeding. I repeat, replace all placeholders, including CSS/SVG placeholders, before proceeding.
    - Do not leave controls in the core experience as static chrome. Do not create new pages or routes unless the user asks for them.

10. Run the local app.

11. Capture the local app using the Browser Choice rule in [index](../product-design-router/SKILL.md#browser-choice-pi).

12. Run [design-qa](../design-qa/SKILL.md) as the blocking build gate.

    Steps:

    - Open the reference image and the latest prototype screenshot before writing the QA report.
    - Compare the same viewport and the same interaction state. If they do not match, capture the missing view first.
    - Save the QA report as `design-qa.md` in the project root.
    - Fix P0/P1/P2 issues, capture the app again, and repeat until the QA report says `final result: passed`.
    - Do not keep looping on P3 polish. Include any remaining P3s as follow-up iteration notes.
    - If source capture, prototype capture, or visual comparison is blocked, stop. `design-qa.md` must say `final result: blocked`.
    - Do not hand off unless `design-qa.md` exists and says `final result: passed`.

13. Handoff the app or website.

    - Only hand off after [design-qa](../design-qa/SKILL.md) passes.
    - Keep the prototype running locally.
    - Keep the local preview running for the user and hand off the clickable local URL (e.g. `http://localhost:5173/`). Do not deploy or share unless the user explicitly asks to share, publish, or deploy.
    - After the preview handoff, use the shared build handoff from `critical-overrides.md`. Do not add a different completion message.
