---
name: refactor-safely
description: Plan and execute safe refactoring using dependency analysis. Use when renaming, moving, deleting, or restructuring code.
---

## Refactor Safely

Use the knowledge graph to plan and execute refactoring with confidence.

### Steps

1. Use `code_review_graph_refactor_tool` with mode="suggest" for community-driven refactoring suggestions.
2. Use `code_review_graph_refactor_tool` with mode="dead_code" to find unreferenced code.
3. For renames, use `code_review_graph_refactor_tool` with mode="rename" to preview all affected locations.
4. Use `code_review_graph_apply_refactor_tool` with the refactor_id to apply renames.
5. After changes, run `code_review_graph_detect_changes_tool` to verify the refactoring impact.

### Safety Checks

- Always preview before applying (rename mode gives you an edit list).
- Check `code_review_graph_get_impact_radius_tool` before major refactors.
- Use `code_review_graph_get_affected_flows_tool` to ensure no critical paths are broken.
- Run `code_review_graph_find_large_functions_tool` to identify decomposition targets.

## Token Efficiency Rules
- ALWAYS start with `code_review_graph_get_minimal_context_tool(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
