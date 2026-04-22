---
name: explore-codebase
description: Navigate and understand codebase structure using the knowledge graph. Use when onboarding, exploring unfamiliar code, or finding where things live.
---

## Explore Codebase

Use the code-review-graph MCP tools to explore and understand the codebase.

### Steps

1. Run `code_review_graph_list_graph_stats_tool` to see overall codebase metrics.
2. Run `code_review_graph_get_architecture_overview_tool` for high-level community structure.
3. Use `code_review_graph_list_communities_tool` to find major modules, then `code_review_graph_get_community_tool` for details.
4. Use `code_review_graph_semantic_search_nodes_tool` to find specific functions or classes.
5. Use `code_review_graph_query_graph_tool` with patterns like `callers_of`, `callees_of`, `imports_of` to trace relationships.
6. Use `code_review_graph_list_flows_tool` and `code_review_graph_get_flow_tool` to understand execution paths.

### Tips

- Start broad (stats, architecture) then narrow down to specific areas.
- Use `children_of` on a file to see all its functions and classes.
- Use `code_review_graph_find_large_functions_tool` to identify complex code.

## Token Efficiency Rules
- ALWAYS start with `code_review_graph_get_minimal_context_tool(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
