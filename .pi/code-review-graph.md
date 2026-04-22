<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
`code-review-graph` MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `code_review_graph_semantic_search_nodes_tool` or `code_review_graph_query_graph_tool` instead of Grep
- **Understanding impact**: `code_review_graph_get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `code_review_graph_detect_changes_tool` + `code_review_graph_get_review_context_tool` instead of reading entire files
- **Finding relationships**: `code_review_graph_query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `code_review_graph_get_architecture_overview_tool` + `code_review_graph_list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `code_review_graph_detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `code_review_graph_get_review_context_tool` | Need source snippets for review — token-efficient |
| `code_review_graph_get_impact_radius_tool` | Understanding blast radius of a change |
| `code_review_graph_get_affected_flows_tool` | Finding which execution paths are impacted |
| `code_review_graph_query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `code_review_graph_semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `code_review_graph_get_architecture_overview_tool` | Understanding high-level codebase structure |
| `code_review_graph_refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `code_review_graph_detect_changes_tool` for code review.
3. Use `code_review_graph_get_affected_flows_tool` to understand impact.
4. Use `code_review_graph_query_graph_tool` pattern="tests_for" to check coverage.
