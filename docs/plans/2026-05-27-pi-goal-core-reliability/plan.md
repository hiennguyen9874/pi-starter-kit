# Pi Goal Core Reliability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the local `.pi/extensions/pi-goal` extension with bounded hidden-continuation context, stale queued-work protection, coalesced persistence, and terminal/idempotent lifecycle behavior while preserving the current local public API.

**Architecture:** Keep the existing modular local extension and add only focused reliability helpers. Pure message/context helpers are introduced first, then runtime hooks in `index.ts` call those helpers; state and command/tool changes stay small and compatibility-preserving.

**Tech Stack:** TypeScript, Pi extension APIs from `@earendil-works/pi-coding-agent`, Node built-in `node:test`/`node:assert/strict`, `tsx` from the checked-in `pi-codex-goal` package for local TypeScript test execution.

---

## Assumptions

- Before running tests, install reference-package dev dependencies once with `cd pi-codex-goal && npm install` if `pi-codex-goal/node_modules` is absent.
- Run local extension tests from `pi-codex-goal` so `tsx` and Pi packages resolve: `cd pi-codex-goal && node --import tsx --test ../.pi/extensions/pi-goal/<test-file>.ts`.
- Preserve persisted custom entry type `pi-goal`, continuation message type `pi-goal-continuation`, current `/goal --budget` and `/goal --tokens` support, and current tool names.
- Do not implement provider-error/context-overflow recovery in this plan.

## Phases

1. [Phase 1: Provider-context continuation rewriting](phase-1.md)
2. [Phase 2: Terminal lifecycle and idempotent state transitions](phase-2.md)
3. [Phase 3: Stale queued-work runtime protection](phase-3.md)
4. [Phase 4: Coalesced persistence and documentation](phase-4.md)
