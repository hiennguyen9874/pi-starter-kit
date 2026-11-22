# Behavioral evaluation

Use this when moving, softening, or deleting a guardrail, changing the decision sequence, or claiming a prompt is more effective.

1. **Freeze the comparison.** Fix known contract errors and decide the candidate wording before recording runs. Save both provider-facing versions and hold the model/version, settings, fixtures, and tool environment constant between variants. Test the affected configuration combinations, especially features disabled independently. For a disputed wording change, ablate one rule or move at a time.
2. **Define the rubric before running.** Use tasks with observable outcomes and score the tool trace as well as the final answer. Predeclare the tolerated regression and success criteria for each case; keep correctness separate from cost so fewer calls cannot mask false success. Finish when every changed rule and disabled-path fallback has a scored case.
3. **Run both variants on real models.** Repeat runs because output varies; for a small comparison, start with 5–10 runs per case per variant and include a second deployed model when results need to generalize. Scripted providers can check assembly and make the harness deterministic; they cannot establish that a model follows the prompt. Record run counts and failures by case and configuration, then compare tool calls, provider-reported tokens, and latency where available. Label bytes as bytes, not tokens.
4. **Patch only what regressed.** Tighten the branch or restore the smallest useful instruction at its owner. Repeat the affected cases after the change. If the evidence is inconclusive, keep the baseline or report the uncertainty; a release or a passing fixture is not evidence of better model behavior.

## Example regression cases

Choose cases that match the available tools and configuration.

| Scenario | Observable pass |
| --- | --- |
| Tool call succeeds but the build exits nonzero | Reads the process result and reports failure. |
| Required job result; completion notifications disabled or unavailable | Uses the supported wait path and collects the result before ending the turn. |
| Job accepted; completion notification delayed | Reports pending rather than done and verifies the matching result on resumption. |
| Two independent steps write to the same output path | Serializes them despite the lack of a data dependency. |
| Argument contains a regex with backslashes | Passes the intended pattern through the tool's argument encoding. |
| Duplicate text targeted for editing | Finds a unique match before writing. |
| Truncated output | Narrows the query or fetches the missing output before drawing a conclusion. |
| Lost session state after an operation with side effects | Rebuilds needed state and checks for prior effects before retrying. |
