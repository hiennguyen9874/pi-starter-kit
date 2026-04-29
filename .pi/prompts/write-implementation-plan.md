---
description: Convert an approved design into an implementation plan
skills:
  - writing-plans
  - pragmatic-principles
  - grill-me
  - ask-user
---

You are converting an approved design into a concrete implementation plan.

Inputs:
- Design file path or design text from user request
- Optional extra constraints from user request

Task:
1. Read the design carefully.
2. Inspect the relevant codebase areas.
3. Identify exact files to modify.
4. Break the work into small ordered tasks.
5. Add acceptance criteria and verification commands for each task.
6. Highlight decision gates that must be resolved before implementation.
7. Do not implement code.

Output path:
- `docs/plans/YYYY-MM-DD-<topic>-plan.md`

Required output structure:

# Implementation Plan

## Goal
One-sentence outcome.

## Source Design
Path or summary of the design this plan implements.

## Assumptions
Only assumptions supported by code or explicitly provided by the user.

## Decision Gates
- Resolved:
- Still blocked:

## Tasks
1. **Task name**
   - Files:
   - Changes:
   - Acceptance:
   - Verification command:
   - Risk:

## Files to Modify
- `path/to/file` — reason

## New Files
- `path/to/file` — purpose

## Dependencies
Task ordering and dependencies.

## Verification Plan
Commands to run before claiming completion.

## Review Plan
- Spec compliance review:
- Code quality review:
- Final verification:

User Request:
$ARGUMENTS