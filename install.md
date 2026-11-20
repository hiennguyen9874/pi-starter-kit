# Install Pi Starter Kit

The installer sets up the project’s `.pi/` directory and installs the `pi-profile` launcher. It does **not** install or upgrade Pi itself.

## Requirements

- On Linux, use Bash and Node.js 22.19+ with npm. The installer uses `curl` and `tar` to fetch and extract the starter kit when needed.
- To run `pi-profile`, you need `flock` and Bubblewrap (`bwrap`) with `--tmp-overlay` support. These are system packages, not npm packages.

On Ubuntu or Debian, install them with `apt`:

```sh
sudo apt update
sudo apt install util-linux bubblewrap
```

`flock` comes with `util-linux` and is often already installed. To verify both tools and check for overlay support, run:

```sh
flock --version
bwrap --help | grep -F -- --tmp-overlay
```

If the second command shows no `--tmp-overlay` option, install a newer Bubblewrap release before running `pi-profile`. Bubblewrap 0.11.1 has been tested with this starter kit.

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
