# Pi Starter Kit

A starter configuration for the [Pi coding agent](https://github.com/badlogic/pi-mono). It collects project-local extensions, profiles, skills, prompts, and agent definitions for different coding workflows.

## Getting started

The starter kit sets up `.pi/` and installs `pi-profile`. It does not install Pi itself. See [Installation](install.md) for setup instructions and prerequisites.

## Run different profiles in the same project

From a project root that contains the starter kit's `.pi` configuration, open one terminal per profile:

```bash
pi-profile minimal/chat-only
pi-profile minimal/read-only
```

On first use, review `.pi/` and the selected profile before trusting the project in Pi. Configure a model provider with `/login` or your existing Pi credentials. Some profiles may require additional credentials or Pi packages.

If Pi and the profile loader's npm dependencies are already installed, you can also run `./bin/pi-profile` directly from this checkout.

The launcher runs the repository's profile code before Pi starts, so use it only in a checkout you trust. It applies the profile before launching Pi, using a temporary view of `.pi` unless you opt into direct mode. No initial `/new` or `/reload` is needed. Use `/profile` as usual to switch within that process; do not pass Pi's `--profile` flag to the launcher.

### Choose how `.pi` is isolated

Set `PI_PROFILE_MODE` when starting the launcher:

- `auto` (default) tries a Bubblewrap overlay mount and falls back to `copy` if the mount probe fails. It does not retry failed profile setup or Pi sessions.
- `overlay` requires Bubblewrap and kernel support for a copy-on-write overlay. Use this mode to see the mount error directly.
- `copy` copies `.pi` to a temporary directory, then bind-mounts the copy in place. This works with older Bubblewrap versions if the host allows bind mounts. It takes more startup time and temporary disk space. Set `TMPDIR` to a location outside `.pi` if needed. The launcher removes the copy on exit, but a hard kill can leave it behind.
- `proot` copies `.pi` per session and uses PRoot to map the copy into the same project directory, without Bubblewrap or user namespaces. It requires `proot` with `statx` support on `PATH` (5.3.0 or newer; the 5.1.0 in Ubuntu/Debian APT does not work, see [install.md](install.md#proot-without-container-changes)) and permission to trace child processes. It is not a security sandbox and can be slower for subprocess-heavy workflows.
- `direct` skips Bubblewrap and applies the profile to the real `.pi` directory. Changes persist after exit. This is opt-in, never an automatic fallback. The launcher holds the project lock until Pi exits; don’t mix direct sessions with other Pi sessions in the same checkout.

For example, to run inside a container that blocks Bubblewrap:

```bash
PI_PROFILE_MODE=proot pi-profile minimal/read-only --offline
```

In `overlay`, `copy`, and `proot` modes, settings, MCP config, and profile state under `.pi` are private to the launched process and changes there are discarded on exit. Installed packages under `.pi/npm/` and `.pi/git/` are mapped from the original project, not copied; they are shared by profiles and persist after exit. Pi may still install packages that are new to the project. Launcher-managed startups and reloads take a project lock while resolving packages; sessions can run concurrently once loaded. Use one of these isolated modes for concurrent sessions, and avoid running bare `pi install`, `pi remove`, or `pi update` against those shared packages while a wrapped session is using them.

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

### Skills enabled in every profile

Set `alwaysSkills` in `.pi/profiles.json` to skill names or paths, such as `.pi/skills/pstack/.../teach/SKILL.md`. These entries override each profile's name-based and wildcard skill restrictions. To exclude a specific copy even if it is always enabled, put its exact path in `skillsDisable`. To select between project skills with the same name, put the wanted path in `skillsEnable`. See [Pi profiles](.pi/profiles/README.md#select-between-skills-with-the-same-name) for precedence and examples.
