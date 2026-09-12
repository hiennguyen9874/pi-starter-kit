---
name: product-design-router
description: "Route Product Design idea-to-image-to-code requests. Use when the user wants to turn a product idea into visual directions with ideate, then into a runnable prototype with image-to-code. Do not use for audits, research, URL cloning, or sharing."
---

# Skill Purpose

Route Product Design requests for the single flow: idea -> image -> code. Use this plugin for a `Product Design` request or a request mainly about generating visual directions from an idea and building the selected direction into a prototype.

> Pi note: Pi has no `$skill` invocation syntax. Skill names below are plain references. To run the next step, read that skill's `SKILL.md` file and follow it.

# Plugin Purpose

Turn early product ideas into runnable prototypes: clarify the brief, generate three visual directions, build the selected direction.

Flow: `get-context` -> `ideate` -> `image-to-code` (+ `design-qa` as build gate).

## Communication Style

Speak to the user in a warm, fun, and collaborative way, prioritizing pithy explanations over long walls of text and numerous bullet points. Refer to the [communication-protocol](../../references/communication-protocol.md) for relaying Product Design plugin progress updates and handoff.

## Critical Overrides

- Follow [critical-overrides](../../references/critical-overrides.md).

## Router Only

This index chooses the next Product Design skill. It does not do that skill's work.

If the user names a focused skill, read that exact skill first. Do not replace it with a related skill.

When a request matches `get-context`, `ideate`, `image-to-code`, or `design-qa`, read that skill's `SKILL.md` and follow it.

For visual ideation, `ideate` is the focused workflow. Use `get-context` to resolve the minimum brief and play back any defaults before `ideate` starts.

## Browser Choice (Pi)

Verify the local prototype with the `agent_browser` tool before handoff.

1. Start the prototype locally (e.g. `npm run dev -- --host 127.0.0.1 --port 5173` from the project root).
2. `open` the local URL with `agent_browser`, then `snapshot -i` to get interactive `@refs`.
3. Exercise primary interactions via `agent_browser` actions, take a `screenshot`, and check console/network errors.
4. Re-snapshot after every code change. Never substitute build success or HTTP health for a rendered browser check.

Use the configured `agent_browser` profile only. Do not assume Codex surfaces (`agent.browsers.get("iab")`, in-app Browser, Chrome profiles) exist on Pi.

## No Visual Target, No Build

For new app, prototype, or UI build requests without a screenshot, mockup, source image, or selected ideate option:

- `ideate` is the focused workflow.
- Use `get-context` to resolve the minimum brief.
- Once the target and intended user outcome are clear, play back the assumptions and run `ideate` in the same turn.
- Show exactly three visual options and wait for the user to choose one.
- Do not scaffold, edit files, or start a server before a visual option is selected.

`Full working version`, `no refs`, `go for it`, `make an assumption`, or a complete brief do not waive this.

## Prototype Revision Requests

Treat a user revision request (screenshot plus a text description, marked-up image, or CSS suggestion) as a scoped edit to the current prototype.

Read the request, its target element, and the surrounding screen before changing code. Preserve the existing prototype by default: layout, style, content, routes, assets, interactions, and working behavior stay the same unless the request asks to change them.

Do not redesign nearby UI or rebuild the prototype just because a request touches that area. If the request is ambiguous and the choice would materially change the prototype, ask first.

> Pi note: Pi has no Codex-style in-app Annotations tool. Ask the user for a revision request in this 3-field format:
>
> ```text
> Screenshot: <attached or pasted image showing the area>
> Target: <element/region, e.g. "pricing card header on /pricing">
> Change: <desired change, e.g. "increase padding to 24px, left-align title">
> ```
>
> If any field is missing and the choice would materially change the prototype, ask before editing.

## Skills

Use this as the root routing guidance for Product Design plugin work. Keep this index as a router; do not perform focused workflow logic here. Sequence: `get-context` -> `ideate` -> `image-to-code` -> `design-qa`.

### get-context

Route here first for idea-to-prototype work. Require only a clear design target and intended user outcome. Ask one targeted question only when one of those is missing; otherwise play back the brief and defaults, then continue without waiting for approval.

### ideate

Generate image-based visual directions for a component, screen, feature, workflow, or product idea. Route here after `get-context` has played back the minimum brief. Prefer this over prose-only ideation unless the user asks for prose.

### image-to-code

Implement a selected visual target as a faithful, responsive, interactive frontend. Route here after the user has chosen an ImageGen mock, screenshot, mockup, or reference image. Do not start here when no visual target has been selected; use `get-context` and `ideate` first.

### design-qa

Compare a coded Product Design prototype against its source visual target before handoff. Route here only as an internal helper after an image-to-code build has both a source visual and rendered implementation.
