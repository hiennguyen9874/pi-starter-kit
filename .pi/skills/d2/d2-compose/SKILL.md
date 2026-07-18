---
name: d2-compose
description: Compose and modularize large D2 diagrams. Use when splitting D2 across files, reusing models or classes, applying variables or globs, building model-view diagrams, or creating layers, scenarios, steps, and nested multi-board compositions.
---

# D2 Compose

Design a **module graph**: one authoritative model, explicit dependencies, and views that override or reveal it.

## Steps

1. Inventory the current boards/files and identify reusable models, shared presentation, independent domains, and inherited states. Read [`references/modules.md`](references/modules.md) for import, override, class, and variable semantics. This step is complete when each concept has one authoritative file or board.
2. Choose boundaries by responsibility: model files own entities and relationships, class files own reusable presentation, and view files import and specialize them. Keep import paths relative to the importing file. This step is complete when every dependency direction is explicit and no shared concept is copied between files.
3. Choose a board inheritance rule from [`references/composition.md`](references/composition.md): `layers` for independent boards, `scenarios` for alternatives inheriting the base, or `steps` for cumulative transitions. This step is complete when each board's expected predecessor and inherited content are unambiguous.
4. Apply overrides, `null`, `suspend`/`unsuspend`, or globs only after their scope and blast radius are known. Read [`references/globs.md`](references/globs.md) before using recursive, filtered, connection, or global globs. This step is complete when every bulk rule targets exactly the intended shapes/connections across imports and boards.
5. Format and validate every entry point, then render representative boards with `--target`; render `target.*` when all descendants must be checked. This step is complete when all entry points resolve imports, validate, and render the intended inherited state.

Read [`examples/model-view.md`](examples/model-view.md) for a minimal multi-file pattern.
