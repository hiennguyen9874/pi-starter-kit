#!/usr/bin/env bash
# Run with bash tests/pi-profile.sh on Linux with bind-mount-capable Bubblewrap.
set -euo pipefail

launcher=$(cd -- "$(dirname -- "$0")/../bin" && pwd -P)/pi-profile
export REAL_BWRAP
REAL_BWRAP=$(command -v bwrap)
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
export TMPDIR="$work/tmp" PATH="$work/bin:$PATH"
export BWRAP_LOG="$work/bwrap.log" PROBE_STATUS=1
mkdir -p "$work/bin" "$TMPDIR" "$work/project"
cd "$work/project"
mkdir -p .pi/{extensions/profile,profiles/npm,npm,git}
printf original > .pi/settings.json
printf nested > .pi/profiles/npm/kept

cat > .pi/extensions/profile/profile-config.ts <<'JS'
export const loadProfilesConfig = () => ({ config: { profiles: { test: {} } } });
JS
cat > .pi/extensions/profile/profile-sync.ts <<'JS'
import { mkdirSync, writeFileSync } from 'node:fs';
export function syncProfileResources() {
  mkdirSync('.pi/.local', { recursive: true });
  writeFileSync('.pi/settings.json', 'private');
}
JS

cat > "$work/bin/pi" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == --extension && -f "$2" && "$3" == --offline ]]
[[ $(cat .pi/settings.json) == private && $(cat .pi/profiles/npm/kept) == nested ]]
printf 'run\n' >> .pi/npm/runs
printf 'run\n' >> .pi/git/runs
exit 42
SH
cat > "$work/bin/bwrap" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# Exercise selection deterministically, even on hosts with OverlayFS support.
case " $* " in
  *' --tmp-overlay '*' -- /bin/true ')
    echo probe >> "$BWRAP_LOG"
    exit "$PROBE_STATUS" ;;
  *' --tmp-overlay '*)
    echo overlay >> "$BWRAP_LOG"
    exit 43 ;;
  *)
    echo copy >> "$BWRAP_LOG"
    exec "$REAL_BWRAP" "$@" ;;
esac
SH
chmod +x "$work/bin/"{pi,bwrap}

check_mode() {
  local mode=$1 expected=$2 calls=$3 status=0
  : > "$BWRAP_LOG"
  PI_PROFILE_MODE="$mode" "$launcher" test --offline || status=$?
  [[ "$status" == "$expected" ]]
  [[ $(cat "$BWRAP_LOG") == "$calls" ]]
  [[ $(cat .pi/settings.json) == original && ! -e .pi/.local ]]
  [[ -z $(ls -A "$TMPDIR") ]]
}

check_mode copy 42 copy
check_mode auto 42 $'probe\ncopy'
check_mode overlay 43 overlay
PROBE_STATUS=0 check_mode auto 43 $'probe\noverlay'
check_mode invalid 2 ''
[[ $(cat .pi/npm/runs) == $'run\nrun' && $(cat .pi/git/runs) == $'run\nrun' ]]
printf '%s\n' 'pi-profile mode tests passed'
