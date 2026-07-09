---
name: generate-web-diagram
description: Generate a standalone HTML diagram and open it in the browser
skills:
  - visual-explainer
---

Generate an HTML visual explainer for: $@

Use the skill’s reference routing and final checklist. Pick a representation that fits the topic: Mermaid for connected flows/topologies; CSS cards for text-heavy explanations; tables for matrices; timelines for linear history.

Write to `./diagrams/` with a descriptive filename and open the result in the browser. In Pi package installs, this is an explicit visual request: use `visual_explainer.prepare` when planning/context scouting helps, then `visual_explainer.render` with the complete HTML.
