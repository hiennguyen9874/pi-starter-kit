---
name: release-drafter
description: Configure, customize, and troubleshoot Release Drafter v6 for GitHub repositories. Use when setting up `.github/workflows/release-drafter.yml`, authoring `.github/release-drafter.yml`, enabling autolabeling, defining categories/versioning rules, handling prerelease flows, or debugging why draft release notes are missing or incorrect.
---

# Release Drafter

Set up Release Drafter end-to-end and keep release notes predictable across repositories.

## Workflow

1. Inspect repository state first.
- Check whether `.github/workflows/release-drafter.yml` exists.
- Check whether `.github/release-drafter.yml` exists on the default branch.
- Detect whether the user wants action mode (most common) or GitHub App mode.

2. Set up or fix the GitHub Actions workflow.
- Use `release-drafter/release-drafter@v6`.
- Add `on.push.branches` for release target branches (usually `main` or `master`).
- Add `pull_request` or `pull_request_target` trigger when autolabeler is enabled.
- Set permissions:
  - `contents: write` for draft release creation/update.
  - `pull-requests: write` when autolabeler is enabled, else at least `read`.
- Set `env.GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.

3. Author or update `.github/release-drafter.yml`.
- Start from a minimal template and expand only what the repo needs.
- Define `template` and optional `name-template` and `tag-template`.
- Add `categories`, `exclude-labels`, `include-labels`, and `version-resolver` when requested.
- Add `autolabeler` rules for file globs, branch regex, title regex, or body regex.
- Keep configuration in `.github/release-drafter.yml` on the default branch.

4. Add advanced behavior only when asked.
- Configure prerelease flow with `prerelease` and `prerelease-identifier`.
- Configure branch targeting with `commitish` and `filter-by-commitish`.
- Configure monorepo selection with `include-paths` and `excluded-paths`.
- Configure output polish with `replacers`, `header`, `footer`, and custom templates.

5. Validate before finishing.
- Check workflow YAML and config YAML parse cleanly.
- Confirm trigger/permission alignment (especially autolabeler requirements).
- Confirm any labels referenced in categories/version-resolver/autolabeler exist or are documented to be created.
- Explain what changed and why.

## Defaults

- Prefer a minimal, safe baseline first:
  - Basic workflow trigger on `push` to `main`.
  - Basic `template` with `$CHANGES`.
  - Optional categories only if label taxonomy exists.
- Prefer explicit notes when assumptions are made about branch names or labels.
- Avoid over-parameterizing `release-drafter.yml` unless the user asks for complex behavior.

## Troubleshooting Checklist

- Verify `.github/release-drafter.yml` is in the default branch.
- Verify workflow job has `contents: write`.
- Verify `pull_request` or `pull_request_target` trigger is present for autolabeler.
- Verify `pull-requests: write` is present for autolabeler updates.
- Verify `config-name` points to a file under `.github/`.
- Verify `commitish` and `filter-by-commitish` do not unintentionally hide previous releases.

## Reference

Use [references/release-drafter-v6.md](references/release-drafter-v6.md) for:
- v6 workflow templates
- configuration keys and variables
- action inputs/outputs
- prerelease and monorepo patterns
