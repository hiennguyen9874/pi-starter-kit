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

This mode needs a PRoot that supports the `statx` system call, which Node uses. PRoot 5.1.0, the version in Ubuntu 24.04 and Debian APT repositories, does not support it: Pi cannot see files created in the `.pi` copy and fails with errors such as `ENOENT: no such file or directory, mkdir '.../.pi/.local'`. `pi-profile` checks this before launching and stops with an error. PRoot 5.3.0, 5.4.1, and 5.5.0 work; 5.2.0 and older do not.

Each option below installs PRoot to `~/.local/bin/proot` and does not need root access. First check which architecture you have with `uname -m`.

#### Option 1: x86-64 static binary (5.5.0)

```bash
(
  set -e
  downloads=$(mktemp -d)
  trap 'rm -rf -- "$downloads"' EXIT
  cd "$downloads"
  url=https://github.com/proot-me/proot/releases/download/v5.5.0
  curl -fsSLO "$url/proot" -O "$url/SHA256SUMS"
  grep ' proot$' SHA256SUMS | sha256sum -c -
  install -D -m 0755 proot "$HOME/.local/bin/proot"
)
```

#### Option 2: ARM static binary (5.3.0)

The newest upstream release with ARM binaries is 5.3.0. It does not publish checksums; the SHA-256 values below were taken from the release assets when this guide was written.

```bash
(
  set -e
  case "$(uname -m)" in
    aarch64|arm64) arch=aarch64 sum=fa10b1a7818c2f5b1dcb5834450570c368c9ecf66d31521509621b95c4538a45 ;;
    armv7*|armv6*) arch=arm sum=bf186a37c7a19621e5bf3cfdf6bce54bfa2e220f91eb7196318e699ac174cc69 ;;
    *) echo "No static PRoot 5.3.0 binary for $(uname -m); build from source." >&2; exit 1 ;;
  esac
  downloads=$(mktemp -d)
  trap 'rm -rf -- "$downloads"' EXIT
  cd "$downloads"
  curl -fsSL -o proot "https://github.com/proot-me/proot/releases/download/v5.3.0/proot-v5.3.0-$arch-static"
  echo "$sum  proot" | sha256sum -c -
  install -D -m 0755 proot "$HOME/.local/bin/proot"
)
```

#### Option 3: Build 5.5.0 from source (Ubuntu/Debian)

Use this on any architecture. It needs `curl`, `gcc`, `make`, and `pkg-config`. It downloads the talloc development package with APT without installing it, then links talloc statically, so the resulting binary does not depend on `libtalloc2`.

```bash
(
  set -e
  build=$(mktemp -d)
  trap 'rm -rf -- "$build"' EXIT
  cd "$build"
  apt-get download libtalloc-dev
  dpkg-deb -x libtalloc-dev_*.deb talloc
  pc=$(find "$PWD/talloc" -name talloc.pc)
  libdir=${pc%/pkgconfig/talloc.pc}
  rm -f -- "$libdir/libtalloc.so"  # make the linker use libtalloc.a
  curl -fsSL https://github.com/proot-me/proot/archive/refs/tags/v5.5.0.tar.gz | tar -xz
  PKG_CONFIG_PATH="$libdir/pkgconfig" PKG_CONFIG_SYSROOT_DIR="$PWD/talloc" \
    make -C proot-5.5.0/src proot
  install -D -m 0755 proot-5.5.0/src/proot "$HOME/.local/bin/proot"
)
```

If you have root access, you can instead install `libtalloc-dev` (or `libtalloc-devel` on Fedora/RHEL) and run `make -C proot-5.5.0/src proot` directly.

#### Check the installation

```bash
hash -r
command -v proot  # should be ~/.local/bin/proot
proot --version   # should report 5.3.0 or newer, not 5.1.0
PI_PROFILE_MODE=proot pi-profile minimal/read-only
```

Make sure `~/.local/bin` comes before `/usr/bin` on `PATH`, so this binary takes precedence over a system `proot`. This mode does not require user namespaces, but the environment must allow PRoot to trace its child processes with `ptrace`.

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
