# D2 composition reference

Source of truth: `d2-docs/docs/tour/{composition,layers,scenarios,steps,nested-composition,linking,composition-formats}.md`.

A D2 file begins with a root board. Three reserved maps declare child boards with distinct inheritance:

| Keyword | Inheritance | Use |
|---|---|---|
| `layers` | none; new base | independent detail level or unrelated board |
| `scenarios` | inherits base board | alternatives, failures, optional states |
| `steps` | inherits previous step | cumulative process or walkthrough |

```d2
client -> api

scenarios: {
  outage: {
    api.style.fill: red
    client -> fallback
  }
}

steps: {
  queued: { api -> queue }
  processed: { queue -> worker }
}

layers: {
  data: { app -> db }
}
```

Nested composition combines imports with boards so overview files stay flat while details live in their own files. Use `link` with board targets for navigation; `_` can refer to a parent board in board links, and backlinks return to the source board.

Render a single board with `--target='<path>'`; append `.*` to include all descendant layers/scenarios/steps. Use animated SVG/GIF for short timed transitions and PDF/PPTX for manually navigated multi-board presentations.

Inheritance is a semantic choice. Use overrides or `null` inside inherited boards to describe deltas instead of copying the base.
