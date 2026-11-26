# Install Pi Starter Kit

The installer sets up the project’s `.pi/` directory and installs the `pi-profile` launcher. It does **not** install or upgrade Pi itself.

## Requirements

- On Linux, use Bash and Node.js 22.19+ with npm. The installer uses `curl` and `tar` to fetch and extract the starter kit when needed.
- To run `pi-profile`, you need `flock`. The `auto`, `overlay`, and `copy` modes also need Bubblewrap (`bwrap`) that can create bind mounts on your host or inside your container. If Bubblewrap is unavailable, use `PI_PROFILE_MODE=proot` with PRoot, or `PI_PROFILE_MODE=direct` to use the real `.pi` directory without isolation. These are system packages, not npm packages. Overlay support is optional: the default launcher falls back to a temporary copy of `.pi` when an overlay mount is unavailable.

On Ubuntu or Debian, install them with `apt`:

```sh
sudo apt update
sudo apt install util-linux bubblewrap
```

`flock` comes with `util-linux` and is often already installed. To verify both tools and check whether Bubblewrap recognizes the overlay flags, run:

```sh
flock --version
bwrap --version
bwrap --help | grep -E -- '--(overlay-src|tmp-overlay)'
```

Overlay mode needs both flags and a kernel/container configuration that permits unprivileged OverlayFS mounts. Bubblewrap 0.11.1 has been tested with overlay mode; 0.4.0 has been tested with copy mode. To skip the mount probe, run `PI_PROFILE_MODE=copy pi-profile minimal/read-only`. See [launcher modes](README.md#choose-how-pi-is-isolated).

### PRoot without container changes

Install `proot` (for example, `sudo apt install proot` on Ubuntu or Debian) and make it available on `PATH`. This mode does not require user namespaces, but the environment must allow PRoot to trace its child processes with `ptrace`.

On Ubuntu or Debian, if you cannot install system packages but APT package downloads are available, you can extract PRoot and its library into your home directory instead:

```bash
(
  set -e
  dest="$HOME/.local/opt/pi-profile-proot"
  downloads=$(mktemp -d)
  trap 'rm -rf -- "$downloads"' EXIT
  cd "$downloads"
  apt-get download proot libtalloc2
  mkdir -p "$dest"
  for package in ./*.deb; do dpkg-deb -x "$package" "$dest"; done
)
```

Then, in the shell where you launch Pi:

```bash
proot_dir="$HOME/.local/opt/pi-profile-proot"
export PATH="$proot_dir/usr/bin:$PATH"
export LD_LIBRARY_PATH="$proot_dir/usr/lib/$(dpkg-architecture -qDEB_HOST_MULTIARCH)${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
PI_PROFILE_MODE=proot pi-profile minimal/read-only
```

## Install Pi separately

If you don't already have Pi, run:

```sh
curl -fsSL https://pi.dev/install.sh | sh
```

Make sure `pi` is on `PATH` before running `pi-profile`.

## Set up a project

Run this **from the directory where you want `.pi/` to be created**:

```bash
curl --proto '=https' -fsSL https://raw.githubusercontent.com/hiennguyen9874/pi-starter-kit/main/install.sh | bash
```

Only run this command if you trust the repository. Alternatively, download and inspect `install.sh` before running it. If you already have a checkout, run `./install.sh` in that checkout, or run `/path/to/pi-starter-kit/install.sh` from the project you want to initialize.

The installer fetches `.pi/` from the `pi-starter-kit` GitHub archive if `.pi/` is missing. It leaves an existing starter-kit configuration in place and refuses to replace an unrelated `.pi/` directory. It also installs the profile loader’s npm dependencies and copies `pi-profile` to `~/.local/bin/`. Re-running it updates the launcher without overwriting your project’s `.pi/`.

If `~/.local/bin` is not on `PATH`, run this or add it to `~/.bashrc` or `~/.zshrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Once Pi is installed, run a profile from your project root:

```bash
pi-profile minimal/read-only
```
