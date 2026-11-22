---
name: prompt-design
description: Prompt design for writing, sequencing, optimizing, or reviewing system prompts, tool-use prompts, and tool descriptions.
---

# Prompt design

Optimize for correct behavior on the deployed model, not the shortest prompt. Cost matters after the agent reliably chooses the right action, handles failure, and knows when it is done.

## 1. Read what the model receives

Inspect the rendered system prompt, tool metadata (names, descriptions, schemas, and usage guidance), and relevant tool results or notices. For an extension, start from the host's rendered prompt and compose with it so user instructions and other extensions survive. Check a default and an affected nondefault configuration. A template or a fixture alone can miss an override, a stale tool list, or a missing fallback.

Name the behavior to change and the observable failure before editing. For a new prompt, name the decisions the model must get right. For an optimization, keep the existing rendered version as the baseline.

## 2. Give each rule one owner

Put each rule in the narrowest place the model reliably sees **before it needs to act**. Moving a rule to a notice or lookup only works if the model can reach it in time.

| Surface | Owns |
| --- | --- |
| **System prompt** | Stable operating model, priorities, cross-tool workflows, and success criteria that apply across tasks. |
| **Tool prompt** | Decision rules for using a tool: when to use it or choose another, prerequisites, call order, and how to act on results. Keep stable cross-tool rules in the system prompt; put tool-specific rules in the tool's guidelines or description, whichever the host actually delivers. |
| **Tool description and schema** | A short capability statement that distinguishes the tool from alternatives, the live contract (what is actually callable and returned), and argument rules at the fields they govern. Describe units, defaults, or side effects when they affect the call. |
| **Runtime result or notice** | What just happened, which operation or state it concerns, and the next safe action. |
| **On-demand lookup** | Full signatures, rare options, and inventory that can be retrieved cheaply. Give a short pointer where the model must decide to look. |

“Tool prompt” is a job, not necessarily a separate field. If the host has both a system-facing tool summary and a provider-facing description, use the summary for selection and the description/schema for the call contract rather than copying the contract into both. Refresh changing capabilities from live state; leave stable instructions stable. This step is done when each changed rule has one owner and its trigger can reach it.

## 3. Sequence decisions, then prune

- **Order by dependency.** Teach the minimum operating model first. Put prerequisites before calls, result interpretation before reporting, and examples beside the decision they demonstrate. Each example should show the required check, not just the happy-path invocation.
- **Co-locate branches.** Write a conditional workflow as a decision block: trigger → action → evidence of completion. Account for unavailable, delayed, or failed capabilities. Acknowledgment, pending work, and verified completion are different states. Parallelize only work with no dependency or conflicting side effects.
- **Write the desired action.** Use consistent, familiar terms for distinct states and types. Use hard language for real constraints; phrase heuristics as defaults with conditions. Keep a prohibition only when the boundary is essential or the positive rule alone fails, and pair it with what to do instead. Enforce machine-checkable constraints in the runtime where possible.
- **Prune after correctness.** Remove stale copies, cheap lookups, and wording that does not change behavior. Treat removal or relocation of a known failure fix as an ablation, not a copyedit.

The draft is ready to test when every affected branch has a next action and a checkable stopping point. For optional fragments, asynchronous work, or tool discovery, read [Sequencing examples](SEQUENCING.md).

## 4. Verify wiring, then behavior

Check the provider-facing request for placement, presence, absence, and fallback across affected configurations. A snapshot or scripted provider proves delivery, not compliance. For behavior-changing edits or a claim of optimization, use [Behavioral evaluation](EVALUATION.md) to compare against the baseline. Keep the smallest change that fixes the failure without regressing protected cases; if model runs are unavailable, report the behavior as unverified.
