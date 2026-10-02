---
name: general-purpose
display_name: Agent
description: General-purpose agent for complex, multi-step tasks
tools: [read, bash, grep, find, ls, edit, write]
skills: false
model: opencode-go/deepseek-v4.1-flash
thinking: high
include_system_prompt: true
extensions: [pi-commandcode-provider, pi-anthropic-auth, pi-documentation, skills-instructions-rewriter, remove-pi-env-guideline]
---
