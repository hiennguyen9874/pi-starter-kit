---
name: golang-pro
description: Use when building or reviewing Go services that need idiomatic design, robust concurrency, strong error handling, and production-ready performance/testing patterns.
---

# Golang Pro

Unified Go specialist skill merged from:
- `go-concurrency-patterns`
- `golang-patterns`

Use this as the main entrypoint for Go implementation, review, and architecture work.

## When to Use This Skill

- Building concurrent Go services with goroutines/channels
- Designing package boundaries, interfaces, and module layout
- Hardening error handling and cancellation behavior
- Improving performance, memory usage, and benchmark coverage
- Setting up idiomatic tests (table-driven, race detector, fuzzing)

## Core Principles

- Keep code simple and explicit over clever abstractions
- Make zero values useful whenever possible
- Accept interfaces where consumed, return concrete types
- Propagate `context.Context` through blocking operations
- Wrap errors with operation context using `%w`
- Treat concurrency as lifecycle management, not just parallel execution

## Workflow

1. Define boundaries: package API, interfaces, and data contracts
2. Choose concurrency model: worker pool, pipeline, errgroup, or semaphore limits
3. Implement with cancellation, error wrapping, and deterministic shutdown paths
4. Validate with table-driven tests, `-race`, and targeted benchmarks
5. Optimize only after measurement (pprof/benchmem), then re-verify

## Reference Guide

| Topic | Reference | Load When |
|---|---|---|
| Concurrency | `references/concurrency.md` | Worker pools, fan-out/fan-in, semaphore, errgroup, graceful shutdown |
| Idioms & Patterns | `references/idioms.md` | Error handling, struct/package design, performance, anti-patterns |
| Interfaces | `references/interfaces.md` | Interface contracts, composition, dependency injection |
| Generics | `references/generics.md` | Type params, constraints, reusable generic structures |
| Testing | `references/testing.md` | Table-driven tests, fuzzing, benchmarks, coverage |
| Project Structure | `references/project-structure.md` | Module layout, `internal`, multi-module repositories |

## Minimum Quality Bar

- Run formatting/linting: `gofmt`, `go vet`, `golangci-lint`
- Run tests: `go test ./...` and `go test -race ./...`
- Handle all returned errors explicitly
- Use context cancellation for long-running or external calls
- Avoid goroutine leaks by guaranteeing exit paths

## Anti-Patterns

- Goroutine without lifecycle/ownership
- Panic for normal control flow
- Ignoring errors (`_`) without explicit rationale
- Global mutable package state for runtime dependencies
- Sleeping for synchronization instead of proper primitives
