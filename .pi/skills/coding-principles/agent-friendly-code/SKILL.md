---
name: agent-friendly-code
description: Guide agent-friendly code design and review. Use when writing, refactoring, or evaluating code for navigability, local reasoning, explicit contracts, small blast radius, or executable feedback.
---

# Agent-Friendly Code

Make an unfamiliar codebase support a reliable loop:

```text
Find → Understand → Change → Verify
```

Optimize for **local reasoning**: an agent should understand and modify one feature without loading unrelated systems into context.

## Process

### 1. Map the change surface

Locate the feature boundary, public entrypoint, call sites, data contracts, configuration, tests, and applicable repository instructions. Follow imports and dependency wiring until inputs, outputs, side effects, and ownership are known.

For a review, inspect the representative paths rather than inferring architecture from the directory tree alone. For an implementation, preserve the repository's established local pattern unless that pattern is the defect being fixed.

**Complete when:** every file and boundary plausibly affected by the requested behavior is accounted for, and unrelated subsystems are excluded with a reason.

### 2. Design for local reasoning

Keep behavior with its models, validation, tests, fixtures, and local documentation. Give files and symbols searchable domain names. Put the public interface early and implementation details beside the interface they support.

Choose cohesive feature or domain boundaries with a clear dependency direction. Pass dependencies explicitly; centralize configuration and object wiring in a discoverable composition root. Separate the functional core from filesystem, database, network, framework, and vendor effects.

Use a domain abstraction only when it represents shared knowledge or protects a concrete boundary. Prefer direct code when an abstraction merely removes similar-looking lines. Apply DRY, orthogonality, contracts, tracer bullets, broken windows, and reversibility through the `pragmatic-principles` skill when one of those tradeoffs is material.

**Complete when:** the proposed change has one obvious home, dependencies and side effects are traceable from call sites, and a requirement change would affect the smallest coherent set of modules.

### 3. Make contracts executable

Represent data with structured types and stable domain terminology. State preconditions, postconditions, invariants, return types, errors, units, shapes, axis semantics, and configuration precedence where relevant. Validate external input at boundaries and fail with expected versus actual values and operation context.

Turn enforceable conventions into formatter, linter, type-checker, dependency rule, test, or CI checks. Keep instruction files for commands and constraints that code and tooling cannot reliably reveal.

**Complete when:** valid behavior and invalid states are discoverable from types, boundary checks, tests, or tooling, with each rule having one authoritative representation.

### 4. Establish a tight feedback loop

Add or update deterministic behavior-focused tests near the changed feature. Provide the narrowest useful verification command, then broader checks only when the blast radius warrants them. Keep a working end-to-end tracer bullet when architecture or integration is uncertain.

Document only non-obvious navigation, decisions, constraints, and change procedures. Use a root map for the system and local guidance for exceptional subsystems; explain why in comments and ADRs.

**Complete when:** an unfamiliar agent can find the relevant test, run a bounded command, interpret failures, and prove the requested behavior without relying on test order, live services, uncontrolled time, or randomness.

### 5. Report the result

For implementation, identify the changed boundary and verification performed. For review, separate observed evidence from recommendations, prioritize the highest blast-radius problems, and give concrete target locations and executable remedies.

For a scored repository audit, load [`references/audit-rubric.md`](references/audit-rubric.md), inspect evidence for every category, and report all six category scores with the supporting paths.

**Complete when:** every recommendation maps to observed evidence and improves at least one part of `Find → Understand → Change → Verify` without weakening another.

## Design Reference

- **Navigability:** domain-shaped directories, meaningful depth, searchable names, clear entrypoints, repository maps.
- **Locality:** cohesive feature boundaries; implementation, contracts, tests, fixtures, and guidance kept near their use.
- **Explicitness:** visible dependencies, structured data, guarded invariants, declared side effects, centralized configuration.
- **Change isolation:** directional dependencies, stable external boundaries, no ambient mutable state, small blast radius.
- **Executable feedback:** narrow deterministic tests and automated architectural guardrails.
- **Consistent examples:** one production-quality golden path; repaired or explicitly tracked broken windows.

Treat `utils`, `common`, `manager`, `processor`, magic registries, runtime patching, import side effects, and generic dictionaries as investigation signals. Judge them by hidden knowledge and change impact, not by name or technique alone.
