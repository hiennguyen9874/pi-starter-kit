---
name: review-changes
description: Perform a structured code review using change detection and impact. Use when reviewing PRs, diffs, or commits.
---

## Review Changes

Perform a thorough, risk-aware code review using the knowledge graph.

### Steps

1. Run `code_review_graph_detect_changes_tool` to get risk-scored change analysis.
2. Run `code_review_graph_get_affected_flows_tool` to find impacted execution paths.
3. For each high-risk function, run `code_review_graph_query_graph_tool` with pattern="tests_for" to check test coverage.
4. Run `code_review_graph_get_impact_radius_tool` to understand the blast radius.
5. For any untested changes, suggest specific test cases.

### Output Format

Provide findings grouped by risk level (high/medium/low) with:
- What changed and why it matters
- Test coverage status
- Suggested improvements
- Overall merge recommendation

## Token Efficiency Rules
- ALWAYS start with `code_review_graph_get_minimal_context_tool(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
