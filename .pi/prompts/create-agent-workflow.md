---
description: Create a reusable workflow prompt for a specific coding-agent task
skills:
  - prompt-leverage
  - pi-subagents
---

You are creating a reusable prompt entrypoint for this coding-agent system.

Task:
1. Understand the desired workflow from the user request.
2. Reuse existing skills instead of creating new skills.
3. Define:
   - when to use the prompt
   - required skills
   - required agents if any
   - input contract
   - output contract
   - verification/done criteria
4. Keep the prompt practical and directly usable.
5. Return the full markdown file content.

Required output:

```markdown
---
description: <short description>
---

<full prompt content>
````

User Request:
$ARGUMENTS