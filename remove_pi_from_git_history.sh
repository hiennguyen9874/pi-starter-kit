#!/usr/bin/env bash
# Remove .pi from every local branch and tag, then replace origin's history.
# Default mode is read-only. Use --execute to perform the rewrite and push.

set -Eeuo pipefail

readonly REMOTE="origin"
mode="dry-run"
backup_dir=""

usage() {
    cat <<'EOF'
Usage: scripts/remove_pi_from_git_history.sh [--dry-run|--execute]

Remove .pi from the complete Git history of every branch and tag, preserve the
current local .pi directory as untracked content, and force-push the rewritten
heads and tags to origin.

Options:
  --dry-run  Validate prerequisites and print the operation plan (default).
  --execute  Synchronize refs, rewrite history, restore local .pi, and push.
  -h, --help Show this help.

Safety contract:
  * origin must be reachable and every local/remote branch or tag of the same
    name must agree or be fast-forwardable. Diverged branches and conflicting
    tags abort rather than choosing a side.
  * Before rewriting, the script creates an external Git bundle and a copy of
    .pi. It compares origin's refs immediately before force-pushing and aborts
    if another writer changed them.
  * All existing clones and worktrees must be freshly cloned or hard-reset to
    the rewritten refs afterwards. They must not push old history back.
EOF
}

log() { printf '%s\n' "$*"; }
die() {
    printf 'ERROR: %s\n' "$*" >&2
    if [[ -n "$backup_dir" ]]; then
        printf 'Recovery backup: %s\n' "$backup_dir" >&2
    fi
    exit 1
}

on_error() {
    local status=$?
    if [[ -n "$backup_dir" ]]; then
        printf 'FAILED. Recovery backup: %s\n' "$backup_dir" >&2
    fi
    exit "$status"
}
trap on_error ERR

while (($#)); do
    case "$1" in
        --dry-run) mode="dry-run" ;;
        --execute) mode="execute" ;;
        -h|--help) usage; exit 0 ;;
        *) die "Unknown option: $1" ;;
    esac
    shift
done

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) \
    || die "Run this script from inside a non-bare Git worktree."
cd "$repo_root"

git rev-parse --is-inside-work-tree | grep -qx true \
    || die "Run this script from inside a non-bare Git worktree."
git remote get-url "$REMOTE" >/dev/null 2>&1 \
    || die "Remote '$REMOTE' is not configured."

# Permit the untracked script itself and .pi, which is deliberately preserved.
script_abs=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/$(basename "${BASH_SOURCE[0]}")
script_rel=""
if [[ "$script_abs" == "$repo_root/"* ]]; then
    script_rel=${script_abs#"$repo_root/"}
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    die "Tracked changes are present. Commit, stash, or discard them before running."
fi
while IFS= read -r -d '' path; do
    if [[ "$path" != .pi && "$path" != .pi/* && "$path" != "$script_rel" ]]; then
        die "Unexpected untracked path '$path'. Move it aside or add it before running."
    fi
done < <(git ls-files --others --exclude-standard -z)

require_filter_repo() {
    git filter-repo --version >/dev/null 2>&1 \
        || die "git-filter-repo is required. Install it (for example: pip install git-filter-repo)."
}

remote_branches=()
declare -A remote_branch_set=()
load_remote_branches() {
    remote_branches=()
    remote_branch_set=()
    local branch
    while IFS= read -r branch; do
        [[ "$branch" == "HEAD" ]] && continue
        remote_branches+=("$branch")
        remote_branch_set["$branch"]=1
    done < <(git for-each-ref --format='%(refname:strip=3)' "refs/remotes/$REMOTE")
}

# Require a complete, identical local mirror of origin's heads and tags. This
# prevents --prune from deleting a ref created by someone else during the run.
verify_remote_matches_local() {
    local refs_file=$1
    declare -A remote_refs=()
    local oid ref local_oid

    while IFS=$'\t' read -r oid ref; do
        [[ "$ref" == *'^{}' ]] && continue # peeled annotated-tag line
        remote_refs["$ref"]=$oid
    done < "$refs_file"

    while IFS=' ' read -r oid ref; do
        [[ -n "${remote_refs[$ref]+present}" ]] \
            || die "Local ref '$ref' does not exist on $REMOTE."
        [[ "${remote_refs[$ref]}" == "$oid" ]] \
            || die "Local ref '$ref' differs from $REMOTE."
    done < <(git for-each-ref --format='%(objectname) %(refname)' refs/heads refs/tags)

    for ref in "${!remote_refs[@]}"; do
        case "$ref" in
            refs/heads/*|refs/tags/*)
                local_oid=$(git rev-parse -q --verify "$ref") \
                    || die "Remote ref '$ref' is missing locally."
                [[ "$local_oid" == "${remote_refs[$ref]}" ]] \
                    || die "Remote ref '$ref' differs locally."
                ;;
        esac
    done
}

fetch_remote_refs() {
    # Do not use --prune-tags: local-only tags are intentionally pushed later.
    git fetch --prune --no-tags "$REMOTE" '+refs/heads/*:refs/remotes/origin/*'
    git fetch "$REMOTE" 'refs/tags/*:refs/tags/*'
}

sync_branches() {
    local branch counts local_ahead remote_ahead
    load_remote_branches

    for branch in "${remote_branches[@]}"; do
        if git show-ref --verify --quiet "refs/heads/$branch"; then
            read -r local_ahead remote_ahead < <(
                git rev-list --left-right --count \
                    "refs/heads/$branch...refs/remotes/$REMOTE/$branch"
            )
            if ((local_ahead > 0 && remote_ahead > 0)); then
                die "Branch '$branch' has diverged from $REMOTE/$branch; resolve it manually."
            elif ((remote_ahead > 0)); then
                log "Fast-forwarding local branch: $branch"
                if [[ "$(git branch --show-current)" == "$branch" ]]; then
                    git merge --ff-only "$REMOTE/$branch"
                else
                    git branch -f "$branch" "$REMOTE/$branch"
                fi
            elif ((local_ahead > 0)); then
                log "Pushing local-only commits: $branch"
                git push "$REMOTE" "refs/heads/$branch:refs/heads/$branch"
            fi
        else
            log "Creating local tracking branch: $branch"
            git branch --track "$branch" "$REMOTE/$branch"
        fi
    done

    # Publish branches that existed only locally before synchronization.
    local local_branch
    while IFS= read -r local_branch; do
        if [[ -z "${remote_branch_set[$local_branch]+present}" ]]; then
            log "Publishing local-only branch: $local_branch"
            git push --set-upstream "$REMOTE" \
                "refs/heads/$local_branch:refs/heads/$local_branch"
        fi
    done < <(git for-each-ref --format='%(refname:strip=2)' refs/heads)

    fetch_remote_refs
}

sync_tags() {
    declare -A remote_tags=()
    local oid ref tag local_oid

    while IFS=$'\t' read -r oid ref; do
        [[ "$ref" == *'^{}' ]] && continue
        tag=${ref#refs/tags/}
        remote_tags["$tag"]=$oid
    done < <(git ls-remote --tags "$REMOTE")

    while IFS= read -r tag; do
        local_oid=$(git rev-parse "refs/tags/$tag")
        if [[ -n "${remote_tags[$tag]+present}" ]]; then
            [[ "$local_oid" == "${remote_tags[$tag]}" ]] \
                || die "Tag '$tag' conflicts with $REMOTE; resolve it manually."
        else
            log "Publishing local-only tag: $tag"
            git push "$REMOTE" "refs/tags/$tag:refs/tags/$tag"
        fi
    done < <(git for-each-ref --format='%(refname:strip=2)' refs/tags)

    # Fetch tags that exist only on origin after checking for name conflicts.
    git fetch "$REMOTE" 'refs/tags/*:refs/tags/*'
}

if [[ "$mode" == "dry-run" ]]; then
    require_filter_repo
    log "Dry run only; no refs, files, or remote state will be changed."
    log "Repository: $repo_root"
    log "Remote:     $REMOTE ($(git remote get-url "$REMOTE"))"
    log "Local heads: $(git for-each-ref refs/heads | wc -l)"
    log "Local tags:  $(git for-each-ref refs/tags | wc -l)"
    log ".pi is tracked in the current checkout: $(git ls-files -- .pi | wc -l) files"
    log "Run '$0 --execute' to synchronize, rewrite, and force-push."
    exit 0
fi

require_filter_repo
fetch_url=$(git remote get-url "$REMOTE")
push_url=$(git remote get-url --push "$REMOTE" 2>/dev/null || printf '%s' "$fetch_url")

log "Synchronizing branches and tags with $REMOTE..."
sync_branches
sync_tags
fetch_remote_refs

backup_parent=$(dirname "$repo_root")
backup_dir=$(mktemp -d "$backup_parent/$(basename "$repo_root").pi-history-backup.XXXXXX")
log "Creating recovery backup: $backup_dir"
git bundle create "$backup_dir/pre-rewrite.bundle" --all
git show-ref --head > "$backup_dir/refs-before-rewrite.txt"
if [[ -d .pi ]]; then
    cp -a .pi "$backup_dir/pi-local"
fi

git ls-remote --heads --tags "$REMOTE" | LC_ALL=C sort > "$backup_dir/remote-refs-before-rewrite.txt"
verify_remote_matches_local "$backup_dir/remote-refs-before-rewrite.txt"

log "Rewriting all local heads and tags to remove .pi..."
git filter-repo --path .pi --invert-paths --force

# filter-repo deliberately removes remotes to prevent accidental mixing of old
# and rewritten history. Restore the exact configured fetch/push endpoints.
if git remote get-url "$REMOTE" >/dev/null 2>&1; then
    git remote set-url "$REMOTE" "$fetch_url"
else
    git remote add "$REMOTE" "$fetch_url"
fi
git remote set-url --push "$REMOTE" "$push_url"

git fsck --no-reflogs
remaining_pi_commits=$(git log --format=%H --all -- .pi)
[[ -z "$remaining_pi_commits" ]] \
    || die ".pi is still reachable in rewritten history; refusing to push."

# Keep the user's current .pi directory locally without making it tracked.
if [[ -d "$backup_dir/pi-local" ]]; then
    rm -rf -- .pi
    cp -a "$backup_dir/pi-local" .pi
fi
mkdir -p .git/info
touch .git/info/exclude
grep -Fqx '.pi/' .git/info/exclude || printf '.pi/\n' >> .git/info/exclude

# Do not overwrite a branch/tag added or changed after the synchronization.
git ls-remote --heads --tags "$REMOTE" | LC_ALL=C sort > "$backup_dir/remote-refs-before-push.txt"
if ! cmp -s "$backup_dir/remote-refs-before-rewrite.txt" \
    "$backup_dir/remote-refs-before-push.txt"; then
    die "$REMOTE changed during the rewrite; history was not pushed. Review $backup_dir."
fi

log "Force-pushing rewritten heads and tags to $REMOTE..."
git push "$REMOTE" --force --prune \
    'refs/heads/*:refs/heads/*' \
    'refs/tags/*:refs/tags/*'

git ls-remote --heads --tags "$REMOTE" | LC_ALL=C sort > "$backup_dir/remote-refs-after-push.txt"
verify_remote_matches_local "$backup_dir/remote-refs-after-push.txt"

log "Done. .pi remains at $repo_root/.pi as untracked local content."
log "Recovery backup retained at: $backup_dir"
log "All other clones/worktrees must be freshly cloned or reset to the rewritten refs."
