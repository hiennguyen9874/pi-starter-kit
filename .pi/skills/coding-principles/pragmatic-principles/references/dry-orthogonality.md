# DRY and Orthogonality

Use **DRY** to give knowledge one authority. Use **orthogonality** to keep unrelated changes from affecting one another. They reinforce each other, but solve different problems.

## DRY: One Authority per Piece of Knowledge

DRY concerns knowledge, not matching text. Two similar blocks are separate when they encode rules that may evolve independently. Two different-looking artifacts are duplicates when one fact requires both to change.

### Diagnose

1. Name the knowledge: a business rule, schema, algorithm, configuration value, or interface constraint.
2. Find every representation of it.
3. Ask: **when this knowledge changes, must these sites change together?**
4. If yes, choose one authoritative representation and derive, generate, or call the others from it.
5. If no, preserve their independence even when extraction would reduce lines.

Completion means a future change to the named knowledge has one authoritative edit path.

### Duplication Sources

| Source | Signal | Response |
|---|---|---|
| **Imposed** | A language, tool, or output format requires copies | Generate the copies from one source where practical |
| **Inadvertent** | Derived data or assumptions are stored independently | Derive them or make the dependency explicit |
| **Impatient** | Copying appears faster than reuse | Make the authoritative path easy to reuse |
| **Interdeveloper** | People build the same knowledge independently | Find or establish a discoverable authority; report unresolved ownership |

Comments and documentation that restate code are additional representations. Keep purpose and rationale beside the authority; generate mechanical facts when possible.

## Orthogonality: Isolate Effects

Components are orthogonal when each has a cohesive responsibility and a change in one does not alter unrelated components.

### Change-Impact Test

1. Describe one plausible change.
2. List every production component, test, configuration, and document it forces you to edit.
3. Mark edits outside the responsibility being changed.
4. Move those effects behind a focused interface, explicit dependency, or authoritative representation.

Useful moves include decoupling modules, removing global data, injecting dependencies, keeping domain knowledge out of presentation and infrastructure details, and writing **shy** code that depends on collaborators' interfaces rather than their internals.

Wrappers and indirection have costs. Add a boundary where it isolates a real independent concern, not merely to increase the number of layers.

Completion means the proposed change affects only its own responsibility and unavoidable end-to-end surfaces, and the component can be tested through its public contract.

## Combined Check

- A fact changes in many places: repair **DRY**.
- One component change causes unrelated behavior changes: repair **orthogonality**.
- Both occur: establish one authority first, then isolate access to it behind the appropriate boundary.
