# Pi Goal Extension Update Report

Date: 2026-05-15

## Summary

This update improves `pi-goal` UX while preserving the existing safety-first continuation and accounting model.

Implemented updates:

1. Command budget syntax compatibility
   - Added support for `--tokens` as an alias to `--budget` in `/goal` creation commands.
   - Existing `--budget` behavior remains supported.

2. Status bar controls
   - Added `/goal statusbar`, `/goal statusbar on`, and `/goal statusbar off`.
   - Status bar preference is now persisted in `pi-goal` session entries and restored on session restore.

3. Visible lifecycle events
   - Added visible custom event messages using `customType: "pi-goal-event"` for:
     - `created`
     - `paused`
     - `resumed`
     - `cleared`
     - `completed`
   - Hidden continuation and budget-limit prompts remain hidden (`display: false`) and unchanged in intent.

4. Reload safety behavior
   - On `session_start` with `reason: "reload"`, active goals are automatically paused.
   - A user notification is emitted with a resume hint.

## Files Changed

- `.pi/extensions/pi-goal/commands.ts`
- `.pi/extensions/pi-goal/index.ts`
- `.pi/extensions/pi-goal/state.ts`
- `.pi/extensions/pi-goal/commands-tools.test.ts`
- `.pi/extensions/pi-goal/runtime.test.ts`

## Test-Driven Development Notes

Changes were implemented using red-green cycles:

- New tests added/updated first for:
  - `statusbar` command parsing/behavior
  - `--tokens` parsing support
  - event renderer registration and lifecycle event emission checks
  - persisted statusbar restoration behavior
  - reload auto-pause behavior
- Production code added minimally to satisfy failing tests.

## Validation

Focused run:

- `node --test .pi/extensions/pi-goal/commands-tools.test.ts .pi/extensions/pi-goal/runtime.test.ts`
- Result: pass

Full extension suite:

- `node --test .pi/extensions/pi-goal/*.test.ts`
- Result: pass (`45/45`)

## Scope Check

This update intentionally avoids changing core goal semantics:

- continuation suppression logic unchanged
- completion accounting behavior unchanged
- tool visibility policy unchanged (`create_goal` + `get_goal` available; `update_goal` gated by active goal)

Only UX-oriented enhancements requested in the latest review cycle were added.