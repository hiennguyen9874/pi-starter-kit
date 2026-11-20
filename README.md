# Pi Starter Kit

A starter configuration for the [Pi coding agent](https://github.com/badlogic/pi-mono). It collects project-local extensions, profiles, skills, prompts, and agent definitions for different coding workflows.

## Getting started

On Linux, you need Node.js 22.19+ with npm, `curl`, `flock` (from util-linux), and Bubblewrap with `--tmp-overlay` support (tested with Bubblewrap 0.11.1). You don't need to install Pi first.

### Set up a project with `curl`

Run this **from the directory where you want `.pi/` to be created**:

```bash
curl --proto '=https' -fsSL https://raw.githubusercontent.com/hiennguyen9874/pi-starter-kit/main/install.sh | bash
```

Only run the command if you trust this repository. Alternatively, download and inspect `install.sh` before running it with Bash.

### Set up from a checkout

From this checkout, run `./install.sh`. To initialize a different project, `cd` there and run `/path/to/pi-starter-kit/install.sh`.

The installer:

- Copies `.pi/` from the starter kit's GitHub archive into the current directory if `.pi/` is missing. It leaves an existing starter-kit configuration in place and refuses to replace an unrelated `.pi/` directory.
- Installs the profile loader's npm dependencies and copies the launcher to `~/.local/bin/pi-profile`.
- Uses Pi already on `PATH`, or installs Pi 1.6.0 privately under `$XDG_DATA_HOME/pi-starter-kit` (default: `~/.local/share/pi-starter-kit`). The launcher finds it automatically; no global npm install or `sudo` is needed.

If `~/.local/bin` isn't on `PATH`, run `export PATH="$HOME/.local/bin:$PATH"` or add it to `~/.zshrc` or `~/.bashrc`. The installer does not edit those files. Re-run the install command to update the launcher; it won't overwrite your project's `.pi/` or replace an existing Pi installation.

## Run different profiles in the same project

From a project root that contains the starter kit's `.pi` configuration, open one terminal per profile:

```bash
pi-profile minimal/chat-only
pi-profile minimal/read-only
```

On first use, review `.pi/` and the selected profile before trusting the project in Pi. Configure a model provider with `/login` or your existing Pi credentials. Some profiles may require additional credentials or Pi packages.

If Pi and the profile loader's npm dependencies are already installed, you can also run `./bin/pi-profile` directly from this checkout.

The launcher runs the repository's profile code before Pi starts, so use it only in a checkout you trust. It applies the profile to a temporary copy-on-write view of `.pi` before launching Pi. No initial `/new` or `/reload` is needed. Use `/profile` as usual to switch within that process; do not pass Pi's `--profile` flag to the launcher.

Settings, MCP config, and profile state under `.pi` are private to the launched process and changes there are discarded on exit. Installed packages under `.pi/npm/` and `.pi/git/` are shared by profiles and persist after exit. Pi may still install packages that are new to the project. Launcher-managed startups and reloads take a project lock while resolving packages; sessions can run concurrently once loaded. Use `pi-profile` for concurrent sessions, and avoid running bare `pi install`, `pi remove`, or `pi update` against those shared packages while a wrapped session is using them.

Source files and user-level Pi configuration are still shared. To keep `-c` and `--resume` separate too, pass a different `--session-dir` per profile.

## Repository layout

- `.pi/settings.base.json` — baseline settings, packages, and extensions used to generate `.pi/settings.json`.
- `.pi/profiles/` and `.pi/profiles.json` — workflow profiles and the default profile.
- `.pi/extensions/` — local TypeScript extensions, including the profile manager.
- `.pi/skills/` and `.pi/prompts/` — reusable instructions and prompt templates.
- `.pi/agents/` — subagent definitions; see its [README](.pi/agents/README.md) for configuration details.
- `.pi/guidelines/` — behavioral guidelines used by profiles.
- `.pi/mcp.base.json` — base MCP server definitions.

Customize these files to fit your own workflow. Some integrations are disabled by default or enabled only by specific profiles.
