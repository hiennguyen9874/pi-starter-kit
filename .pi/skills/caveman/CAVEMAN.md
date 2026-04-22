# 🪨 Caveman for Pi

Caveman ported from [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) to Pi.

## What Got Installed

| Component | Location | Purpose |
|-----------|----------|---------|
| **Skills** | `.pi/skills/caveman/` | Core caveman behavior (lite/full/ultra/wenyan) |
| | `.pi/skills/caveman-commit/` | Terse commit messages |
| | `.pi/skills/caveman-review/` | One-line PR review comments |
| | `.pi/skills/caveman-help/` | Reference card |
| | `.pi/skills/compress/` | File compression to caveman prose |
| **Extension** | `.pi/extensions/caveman.ts` | Hooks: session start, system prompt injection, input tracking, status line, commands |
| **Config** | `~/.config/caveman/config.json` | Default mode persistence |

## Hook Mapping (Claude Code → Pi)

| Claude Code Hook | Pi Equivalent | Implementation |
|------------------|---------------|----------------|
| `SessionStart` → `caveman-activate.js` | `session_start` event + `before_agent_start` | Extension loads default mode, injects rules into system prompt |
| `UserPromptSubmit` → `caveman-mode-tracker.js` | `input` event + `before_agent_start` | Detects `/caveman` commands, updates mode, per-turn reinforcement via system prompt |
| Statusline scripts | `ctx.ui.setStatus()` | Colored `[CAVEMAN:MODE]` badge in footer |

## Usage

### Commands

```
/caveman              # Toggle full mode on/off
/caveman lite         # Lite compression
/caveman ultra        # Ultra compression
/caveman wenyan       # Classical Chinese mode
/caveman off          # Deactivate

/caveman-commit       # Commit message mode
/caveman-review       # Code review mode
/caveman-help         # Show reference card

/skill:compress <file>  # Compress a .md file
```

### Natural Language

```
"talk like caveman"   # Activate default mode
"stop caveman"        # Deactivate
"normal mode"         # Deactivate
```

### Pi Commands

```
/caveman [lite|full|ultra|wenyan|off]   # Toggle or set mode
/caveman-commit                         # Commit mode
/caveman-review                         # Review mode
```

## Configuration

Set default mode (applied on every Pi session start):

```bash
# Environment variable (highest priority)
export CAVEMAN_DEFAULT_MODE=ultra

# Config file
mkdir -p ~/.config/caveman
echo '{"defaultMode":"lite"}' > ~/.config/caveman/config.json
```

Set `"off"` to disable auto-activation.

## Reload

After installation, reload Pi extensions:

```
/reload
```

Or restart Pi.
