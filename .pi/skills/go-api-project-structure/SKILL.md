---
name: go-api-project-structure
description: Use when starting a new Go backend API project or restructuring an existing service into a clean, framework-agnostic layered architecture with clear folder responsibilities and dependency boundaries.
---

# Go API Project Structure

## Overview

Use this skill to generate a standardized, framework-agnostic Go API layout that scales from small services to larger systems. Keep boundaries explicit: transport handles I/O, use cases hold business rules, repositories handle persistence.

## When to Use

- New Go API service needs a clean initial structure
- Existing Go API is growing messy and needs folder/layer boundaries
- Team needs one consistent layout for multiple services
- Requirements ask for architecture guidance without locking to Gin, Echo, Fiber, or specific DB libs

Do not use this skill when the user only asks for a single file/function fix.

## Standard Project Tree

```text
my-service/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── bootstrap/
│   │   ├── app.go
│   │   ├── config.go
│   │   └── logger.go
│   ├── domain/
│   │   └── user/
│   │       ├── entity.go
│   │       ├── errors.go
│   │       └── repository.go
│   ├── usecase/
│   │   └── user/
│   │       ├── service.go
│   │       └── dto.go
│   ├── repository/
│   │   └── user/
│   │       └── store.go
│   ├── transport/
│   │   └── http/
│   │       ├── handler/
│   │       │   └── user_handler.go
│   │       ├── middleware/
│   │       │   └── auth.go
│   │       └── router.go
│   └── platform/
│       ├── db/
│       │   └── sql.go
│       ├── cache/
│       │   └── redis.go
│       └── messaging/
│           └── publisher.go
├── pkg/
│   ├── response/
│   │   └── response.go
│   └── errors/
│       └── code.go
├── api/
│   └── openapi.yaml
├── configs/
│   ├── local.yaml
│   └── production.yaml
├── migrations/
│   └── 000001_init.sql
├── scripts/
│   ├── test.sh
│   └── lint.sh
├── test/
│   ├── integration/
│   └── e2e/
├── go.mod
└── README.md
```

## Responsibility Rules

- `cmd/`: entrypoints only. Parse flags/env and start app.
- `internal/bootstrap`: wire dependencies, configuration, logger, and app startup lifecycle.
- `internal/domain`: pure business concepts. No HTTP, SQL, or framework imports.
- `internal/usecase`: business workflows. Calls domain contracts and repositories.
- `internal/repository`: concrete persistence adapters that implement domain repository interfaces.
- `internal/transport`: HTTP/gRPC handlers, middleware, request parsing, response mapping.
- `internal/platform`: external systems and client setup (DB/cache/message broker).
- `pkg/`: reusable cross-service utilities safe to import from outside `internal`.
- `configs/`: environment config files.
- `migrations/`: schema evolution scripts.
- `test/`: integration and end-to-end tests.

## Dependency Direction (Mandatory)

```text
transport -> usecase -> domain
repository -> domain
platform -> repository/bootstrap
```

Never import inward in reverse direction (for example, domain importing transport).

## Request Lifecycle Pattern

1. Router dispatches request to transport handler.
2. Handler validates/parses request DTO and calls use case.
3. Use case executes business flow and calls repository interfaces.
4. Repository uses platform clients to access DB/cache/message systems.
5. Use case returns domain/application result.
6. Handler maps result/error to API response contract.

## Feature Addition Checklist

When adding a new feature, always create/update in this order:

1. Domain entity/value objects and domain errors (`internal/domain/<feature>/`).
2. Domain repository interfaces (same domain package).
3. Use case service and input/output DTO (`internal/usecase/<feature>/`).
4. Repository implementation (`internal/repository/<feature>/`).
5. Transport handler, route bindings, middleware usage (`internal/transport/...`).
6. Dependency wiring in bootstrap (`internal/bootstrap/app.go`).
7. Integration tests for happy path and failure path (`test/integration`).

## Minimal Conventions

- Use singular package names: `user`, `order`, `payment`.
- Keep transport DTOs separated from domain entities.
- Return typed errors from use case/domain; map to HTTP status in transport.
- Keep framework-specific details only inside `transport` and `bootstrap`.
- Keep third-party client initialization only inside `platform`.
- For PostgreSQL 18+, prefer `UUID` primary keys with `DEFAULT uuidv7()` for new tables.
- If using `uuidv7()`, do not add `pgcrypto` only for UUID generation.

## Output Contract

When asked to generate a project structure, ALWAYS provide:

1. The folder tree.
2. One-line purpose for each top-level and important internal folder.
3. Dependency direction section.
4. A short “add new endpoint” walkthrough for the requested feature.
