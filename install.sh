#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' 'Usage: ./install.sh' \
    'Set up .pi in the current project and install pi-profile.' \
    'Pi itself is not installed; install it separately before running pi-profile.'
}

if [[ $# -ne 0 ]]; then
  if [[ $# -eq 1 && ( "$1" == -h || "$1" == --help ) ]]; then
    usage
    exit 0
  fi
  usage >&2
  exit 2
fi

marker='# Launcher from pi-starter-kit'
launcher=''
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
  launcher="$root/bin/pi-profile"
fi
project=$(pwd -P)
project_pi="$project/.pi"
bin_dir="${HOME:?HOME must be set}/.local/bin"
target="$bin_dir/pi-profile"

if [[ -e "$target" || -L "$target" ]]; then
  if [[ -L "$target" || ! -f "$target" ]] || ! grep -Fxq "$marker" "$target"; then
    printf 'Refusing to replace %s. Move it aside if you want to install this launcher.\n' "$target" >&2
    exit 1
  fi
fi

setup_pi=false
if [[ -e "$project_pi" || -L "$project_pi" ]]; then
  if [[ -L "$project_pi" || ! -d "$project_pi/profiles" || ! -f "$project_pi/extensions/profile/profile-sync.ts" ]]; then
    printf 'Refusing to replace existing %s: it is not a starter kit .pi directory.\n' "$project_pi" >&2
    exit 1
  fi
else
  setup_pi=true
fi

for dependency in node npm; do
  if ! command -v "$dependency" >/dev/null; then
    printf 'install.sh: missing required command: %s\n' "$dependency" >&2
    exit 1
  fi
done

config_source="$project_pi"
if [[ ! -f "$launcher" ]] || "$setup_pi"; then
  archive_entries=(pi-starter-kit-main/bin/pi-profile)
  if "$setup_pi"; then
    # Stage beside .pi so the completed directory can be moved into place at once.
    stage=$(mktemp -d -- "$project/.pi-setup.XXXXXX")
    archive_entries+=(pi-starter-kit-main/.pi)
    config_source="$stage/.pi"
  else
    stage=$(mktemp -d)
  fi
  trap 'rm -rf -- "$stage"' EXIT
  curl --proto '=https' -fsSL -o "$stage/starter-kit.tar.gz" \
    'https://codeload.github.com/hiennguyen9874/pi-starter-kit/tar.gz/refs/heads/main'
  tar -xzf "$stage/starter-kit.tar.gz" -C "$stage" --strip-components=1 \
    --no-same-owner --no-same-permissions -- "${archive_entries[@]}"
  if [[ ! -f "$launcher" ]]; then
    launcher="$stage/bin/pi-profile"
  fi
fi

if ! grep -Fxq "$marker" "$launcher"; then
  printf '%s\n' 'File is not a pi-starter-kit launcher.' >&2
  exit 1
fi

profile_dir="$config_source/extensions/profile"
if [[ ! -f "$profile_dir/node_modules/yaml/package.json" ]]; then
  npm ci --prefix "$profile_dir" --ignore-scripts --no-audit --no-fund
fi

if "$setup_pi"; then
  mv -nT -- "$config_source" "$project_pi"
  if [[ -d "$config_source" ]]; then
    printf 'Refusing to replace %s: it appeared during installation.\n' "$project_pi" >&2
    exit 1
  fi
  printf 'Initialized %s\n' "$project_pi"
else
  printf 'Kept existing %s\n' "$project_pi"
fi

install -d -- "$bin_dir"
if [[ ! "$launcher" -ef "$target" ]]; then
  install -m 0755 -T -- "$launcher" "$target"
fi
printf 'Installed %s\n' "$target"

case ":${PATH:-}:" in
  *":$bin_dir:"*) ;;
  *)
    printf '%s\n' 'Add this line to your shell startup file (e.g. ~/.zshrc or ~/.bashrc), or run it in the current terminal:' \
      '  export PATH="$HOME/.local/bin:$PATH"'
    ;;
esac
if ! command -v bwrap >/dev/null; then
  printf '%s\n' 'For isolated pi-profile modes, install Bubblewrap. Otherwise, PI_PROFILE_MODE=direct modifies .pi in place.'
fi
