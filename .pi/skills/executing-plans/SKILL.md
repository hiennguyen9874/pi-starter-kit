---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute one phase, report for review before continuing.

**Core principle:** One phase at a time with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read `design.md`, `plan.md`, and the selected `phase-x.md` if this is a plan folder
2. If no phase is selected, choose the first incomplete phase and state the assumption
3. Review critically - identify any questions or concerns about the phase
4. If concerns: Raise them with your human partner before starting
5. If no concerns: Create TodoWrite for this phase only and proceed

### Step 2: Execute Phase
**Default: One phase only**

For each task in the selected phase:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

Do not start another phase without explicit user instruction.

### Step 3: Report
When phase complete:
- Show what was implemented
- Show verification output
- Say: "Phase complete. Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next phase only when explicitly requested
- Repeat until complete

### Step 5: Complete Development

After all phases complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-phase (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly
- Next work belongs to another phase and user has not requested it

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between phases: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **writing-plans** - Creates the plan this skill executes
- **finishing-a-development-branch** - Complete development after all phases
