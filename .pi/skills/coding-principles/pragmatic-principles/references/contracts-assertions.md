# Contracts and Assertions

A contract states exactly what code accepts and promises. Correct code does no more and no less than it claims.

## Contract Worksheet

For each affected routine or object, define only the necessary claims:

- **Preconditions** — facts the caller must establish before the routine starts.
- **Postconditions** — facts the routine guarantees on successful return.
- **Invariants** — facts preserved at observable boundaries; include loop or semantic invariants when they govern correctness.

Be strict about required inputs and conservative about promises. Include input domains, boundary conditions, side effects, and exclusions. Completion means a caller can distinguish its responsibility from the implementation's responsibility without reading the implementation.

## Enforcement

Place each check where its evidence is strongest:

- Validate preconditions before side effects.
- Check postconditions before returning when the language or risk justifies it.
- Check invariants after state transitions and around critical loops.
- Preserve semantic invariants in the safer direction; for example, avoid processing a transaction twice when uncertain.

A violated internal contract means the program's assumptions are no longer trustworthy. Fail at the discovery point before invalid state propagates. Completion means each material claim is either enforced by the type system, checked at runtime, or tested with a stated reason for that choice.

## Assertion or Error Handling

Use an **assertion** when the condition represents a programmer error or an event the design says is impossible. Keep useful assertions active unless measured, critical performance requires another enforcement strategy.

Use **error handling** when normal operation can encounter the condition, such as absent optional input or an unavailable external resource. Define how the caller can recover or report it.

Assertions supplement contracts; they do not replace complete contract design or real error handling. Completion means every new failure path is classified as an internal contract violation or an expected operational condition, with matching behavior.

## Verification

Test both the implementation and the contract:

- valid boundary inputs satisfy the postconditions;
- invalid calls fail at the boundary;
- every state transition preserves invariants;
- expected failures follow their recovery path;
- deliberately breaking a protected assumption makes the check fail.

The contract work is complete when all material claims have evidence and no impossible state is silently accepted.
