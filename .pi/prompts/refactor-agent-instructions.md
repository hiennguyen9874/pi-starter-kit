---
description: Refactor AGENTS.md or other agent instruction files into concise shared Markdown guidance
skills:
  - bootstrap-project-context
  - agent-md-refactor
  - domain-model
  - code-reviewer
---

You are refactoring repository agent instruction files.

Objective:
Create or improve standard Markdown agent instructions (`AGENTS.md`, `CLAUDE.md`, `COPILOT.md`, etc.) using docs-only progressive disclosure.

Context sources:
1. Read `AGENTS.md` and `README.md` first when present.
2. Read current root agent files and any existing `docs/agent-instructions/` files fully before editing.
3. Inspect repo files needed to verify commands, architecture, workflows, and conventions.
4. Read `CONTEXT.md` or `CONTEXT-MAP.md` plus relevant `docs/adr/` files when instruction wording depends on domain language, architecture decisions, or responsibility boundaries.

Rules:
- Keep root agent files concise.
- Put detailed shared guidance under `docs/agent-instructions/`.
- Do not create detailed instruction docs under `.pi/`, `.claude/`, `.codex/`, `.cursor/`, or other tool-private directories.
- Do not create nested `AGENTS.md` files unless user explicitly asks and confirms after you explain docs-only default.
- Do not invent commands; infer from repo files or mark unknown.
- Preserve custom syntax unless user explicitly asks to convert it.
- Every retained instruction must change agent behavior.
- Prefer minimal edits over broad rewrite when existing structure is mostly sound.

Work plan:
1. Analyze current instruction system and repo evidence.
2. Identify contradictions, stale commands, duplicated rules, vague guidance, and tool-private details.
3. Ask user to resolve contradictions before editing.
4. Separate root essentials from detailed topic guidance.
5. Create or update only necessary `docs/agent-instructions/` topic files.
6. Update root instruction index with clear read triggers.
7. Review result against `agent-md-refactor` verification checklist.

Output when planning only:
# Agent Instruction Refactor Plan

## Current State
...

## Problems
...

## Proposed Files
- `AGENTS.md` — ...
- `docs/agent-instructions/...` — ...

## Contradictions / Questions
...

## Verification Plan
...

Output after editing:
# Agent Instruction Refactor Report

## Changed Files
- `path` — summary

## Key Decisions
- ...

## Commands Verified
- ...

## Checklist
- root concise: pass/fail
- detailed docs under `docs/agent-instructions/`: pass/fail
- links work: pass/fail
- commands exact or marked unknown: pass/fail
- contradictions resolved or surfaced: pass/fail

User Request:
$ARGUMENTS
