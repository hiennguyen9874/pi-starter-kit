---
description: Verify and commit current changes using conventional commits
---

You are preparing a git commit.

Activate skills:
- `verification-before-completion`
- `git-commit`

Task:
1. Inspect git status.
2. Inspect staged and unstaged diff.
3. Refuse to commit secrets or unrelated generated files.
4. Run relevant verification if not already done.
5. Stage a coherent logical change.
6. Create a conventional commit message based on the diff.
7. Commit only after verification is acceptable.
8. If hooks fail, fix the issue and create a new commit attempt.

Rules:
- Do not use --no-verify unless explicitly requested.
- Do not amend unless explicitly requested.
- Do not force push.
- Do not commit unrelated files.

Output:
- committed files
- commit message
- verification summary
- remaining uncommitted changes

User Request:
$ARGUMENTS