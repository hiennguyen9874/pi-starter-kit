# Sequencing examples

## Asynchronous work: start → do independent work → collect → verify

An asynchronous tool may return a job ID or handle as soon as it accepts work. Treat that acknowledgment as pending, not as a result. For example, when a tool starts a build, check the finished process's exit status before reporting success.

Write the wait branches together:

| Condition | Action and stopping point |
| --- | --- |
| Safe independent work remains | Keep the job reference and do that work. Collect the result when it becomes a prerequisite. |
| The result is needed and there is no usable way to resume on completion | Use the tool's supported wait operation and verify the result before ending the turn. |
| Completion can resume the task and nothing else can proceed | Say what is pending and pause. On resumption, collect and verify the result before claiming completion. Account for any notification delays the runtime allows. |

If the tool exposes separate status and wait operations, explain when to use each. Treat parallelism and completion notifications as separate capabilities. Disabling parallel-work guidance must not remove the way to collect a required result.

Check concurrency for both data dependencies and resource conflicts (files, shared state, locks, ports, or other side effects). Independent readers may safely share inputs; two commands writing the same build directory may not. Start safe independent operations, then collect each result. Run dependent steps in order, with failure preventing steps that require success.

## Tool selection and discovery: find → describe → call

When the advertised list is partial, say so and point to the full listing or search. Advertise search only when it is enabled. If the list lacks the call contract, fetch the schema, usage guidance, and return shape before first use. Batch independent read-only discovery when supported. Compare round trips, latency, and schema errors before relaxing the discovery prerequisite.

Place argument pitfalls next to the parameter. For example, the description of a `pattern` field should say whether it takes a literal string or a regular expression. If a tool can truncate results, describe how it signals truncation and how to retrieve more. When output is incomplete, narrow the query or fetch the missing output before drawing conclusions. After state loss or partial failure, check what already happened before replaying work.

## Composing optional fragments

Prefer the host's section hooks when they preserve the instruction in supported prompt modes. Otherwise insert a named section into the rendered host prompt: match real section boundaries, ignore fenced examples, preserve surrounding text, and define a fallback anchor. Keep dynamic tool data out of a system prompt fixed for the run. Assemble named fragments in order with explicit conditions and nesting; avoid inserting rules by matching an English sentence. Generate inventories from runtime/configuration data rather than maintaining parallel lists.
