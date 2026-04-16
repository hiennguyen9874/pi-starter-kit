# Release Drafter v6 Reference

Source: https://raw.githubusercontent.com/release-drafter/release-drafter/refs/tags/v6/README.md

## Minimal GitHub Actions Workflow

```yaml
name: Release Drafter

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, reopened, synchronize]

permissions:
  contents: read

jobs:
  update_release_draft:
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - uses: release-drafter/release-drafter@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Notes:
- `pull_request` (or `pull_request_target`) is needed for autolabeler behavior.
- `pull-requests: write` is needed for autolabeler to apply labels.

## Minimal `.github/release-drafter.yml`

```yaml
template: |
  ## What Changed

  $CHANGES
```

## Common Configuration Patterns

Versioning and categories:

```yaml
name-template: "v$RESOLVED_VERSION"
tag-template: "v$RESOLVED_VERSION"

categories:
  - title: "Features"
    labels: ["feature", "enhancement"]
  - title: "Bug Fixes"
    labels: ["fix", "bug", "bugfix"]
  - title: "Maintenance"
    label: "chore"

change-template: "- $TITLE @$AUTHOR (#$NUMBER)"

version-resolver:
  major:
    labels: ["major"]
  minor:
    labels: ["minor"]
  patch:
    labels: ["patch"]
  default: patch

template: |
  ## Changes

  $CHANGES
```

Filtering:

```yaml
exclude-labels:
  - "skip-changelog"

include-labels:
  - "app-foo"

include-paths:
  - "frontend/**"

excluded-paths:
  - "docs/**"
```

Autolabeler:

```yaml
autolabeler:
  - label: "docs"
    files:
      - "*.md"
  - label: "bug"
    branch:
      - "/fix\\/.+/"
    title:
      - "/fix/i"
```

Prerelease:

```yaml
prerelease: true
prerelease-identifier: "rc"
```

## Frequently Used Keys

- `template`, `header`, `footer`
- `name-template`, `tag-template`, `tag-prefix`
- `version-template`, `version-resolver`
- `categories`, `category-template`
- `change-template`, `change-title-escapes`, `no-changes-template`
- `exclude-labels`, `include-labels`
- `exclude-contributors`, `no-contributors-template`
- `replacers`
- `sort-by`, `sort-direction`
- `prerelease`, `prerelease-identifier`, `include-pre-releases`
- `latest`
- `commitish`, `filter-by-commitish`
- `include-paths`, `excluded-paths`
- `pull-request-limit`, `history-limit`, `initial-commits-since`
- `references` (GitHub App mode; ignored by Action mode)

## Template Variables

Body-level:
- `$CHANGES`
- `$CONTRIBUTORS`
- `$PREVIOUS_TAG`
- `$REPOSITORY`
- `$OWNER`

Change-level:
- `$NUMBER`
- `$TITLE`
- `$AUTHOR`
- `$BODY`
- `$URL`
- `$BASE_REF_NAME`
- `$HEAD_REF_NAME`

Version-level:
- `$NEXT_PATCH_VERSION`
- `$NEXT_MINOR_VERSION`
- `$NEXT_MAJOR_VERSION`
- `$RESOLVED_VERSION`

Version template variables:
- `$PATCH`
- `$MINOR`
- `$MAJOR`
- `$COMPLETE`

## Action Inputs and Outputs (Common)

Inputs:
- `config-name`
- `name`, `tag`, `version`
- `publish`
- `prerelease`, `prerelease-identifier`, `include-pre-releases`
- `latest`, `commitish`
- `header`, `footer`
- `initial-commits-since`
- `disable-releaser`, `disable-autolabeler`

Outputs:
- `id`, `name`, `tag_name`, `body`
- `html_url`, `upload_url`
- `resolved_version`, `major_version`, `minor_version`, `patch_version`

## Gotchas

- Place `.github/release-drafter.yml` in the default branch.
- Do not expect `references` config to work in GitHub Action mode.
- Ensure workflow permissions match enabled features (especially autolabeler).
