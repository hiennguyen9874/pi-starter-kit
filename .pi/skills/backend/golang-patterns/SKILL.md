---
name: golang-patterns
description: Idiomatic Go patterns, best practices, and conventions for building robust, efficient, and maintainable Go applications, including concurrency, interfaces, generics, testing, performance, and project structure.
origin: ECC
---

# Go Development Patterns

Unified Go specialist skill for Go implementation, review, refactoring, and architecture work.

Merged from:
- `golang-patterns`
- `golang-pro`

Use this as the main entrypoint for Go work. Prefer explicit, idiomatic Go over clever abstractions. Load focused references only when task needs deeper detail.

## When to Activate

- Writing new Go code
- Reviewing Go code
- Refactoring existing Go code
- Designing Go packages/modules
- Building concurrent Go services with goroutines/channels
- Hardening error handling, cancellation, and shutdown behavior
- Improving performance, memory usage, or benchmark coverage
- Setting up idiomatic tests, fuzzing, race checks, or benchmarks

## Core Principles

- Keep code simple, explicit, and readable
- Make zero values useful whenever possible
- Accept interfaces where consumed, return concrete types
- Keep interfaces small and behavior-focused
- Propagate `context.Context` through blocking, external, or long-running operations
- Wrap errors with operation context using `%w`
- Handle all returned errors explicitly
- Treat concurrency as lifecycle management, not just parallel execution
- Avoid global mutable package state for runtime dependencies
- Optimize only after measurement

## Workflow

1. Define boundaries: package API, interfaces, data contracts, and ownership
2. Choose implementation shape: plain functions/types before patterns or abstractions
3. Choose concurrency model when needed: worker pool, pipeline, errgroup, or semaphore limits
4. Implement with cancellation, error wrapping, and deterministic shutdown paths
5. Validate with table-driven tests, `-race`, and targeted benchmarks when relevant
6. Optimize only after measurement with pprof/benchmem, then re-verify

## Reference Guide

| Topic | Reference | Load When |
|---|---|---|
| Concurrency | `references/concurrency.md` | Worker pools, fan-out/fan-in, semaphore, errgroup, graceful shutdown, leak prevention |
| Idioms & Patterns | `references/idioms.md` | Error handling, struct/package design, performance, anti-patterns |
| Interfaces | `references/interfaces.md` | Interface contracts, composition, dependency injection |
| Generics | `references/generics.md` | Type parameters, constraints, reusable generic structures |
| Testing | `references/testing.md` | Table-driven tests, fuzzing, benchmarks, coverage, race checks |
| Project Structure | `references/project-structure.md` | Module layout, `internal`, command/package boundaries, multi-module repositories |

## Minimum Quality Bar

- Format Go code with `gofmt`
- Run `go test ./...` for changed Go packages
- Run `go test -race ./...` when concurrency or shared state changed
- Run `go vet ./...` or existing project lint command when available
- Use `golangci-lint` when project already configures it
- Add or update tests for changed behavior
- Prove performance changes with benchmarks before/after when optimizing

## Anti-Patterns

- Goroutine without lifecycle/ownership
- Channel/goroutine complexity where synchronous code works
- Panic for normal control flow
- Ignoring errors (`_`) without explicit rationale
- Returning broad interfaces from constructors
- Large preemptive interfaces for mocking only
- Global mutable package state for runtime dependencies
- Sleeping for synchronization instead of proper primitives
- Premature generics where concrete code is clearer
- Optimizing without measurement
