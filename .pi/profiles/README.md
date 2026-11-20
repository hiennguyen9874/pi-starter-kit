# Pi profiles

A profile selects resources and settings for a workflow, such as implementation,
review, or read-only exploration. The profile extension applies its configuration
on top of [`.pi/settings.base.json`](../settings.base.json) and
[`.pi/mcp.base.json`](../mcp.base.json). Profiles can filter skills, prompt
templates, and MCP servers; enable or disable packages and extensions; and
configure behavioral guidelines and other settings. See the existing profiles in
this directory for examples.

Profiles are workflow configuration, not a security sandbox. In particular, the
extension warns that enforcement for direct MCP tools can be partial; review
the enabled tools and extensions before trusting a profile.

## Create a profile

1. Create a `.yaml` file here, optionally inside a single group directory. The
   filename becomes the profile name: `my-workflow.yaml` is `my-workflow`, and
   `review/my-review.yaml` is `review/my-review`. Only one directory level is
   scanned; names beginning with `.` or `_` and non-`.yaml` files are ignored.
2. Add the settings you need. For example, save this as
   `.pi/profiles/review/my-review.yaml` (replace resource names with ones that
   exist in your project):

   ```yaml
   skillsEnable:
     - tdd
   promptsDisable: ["*"]
   mcpServersDisable:
     - chrome-devtools
   packagesDisable:
     - npm:pi-observational-memory
   extensionsEnable:
     - ./extensions/disable-write-tool.ts
   extensionState:
     behavioralGuidelines:
       enabled: true
       sections:
         planningDiscipline: false
   ```

3. From the project root, run `pi-profile review/my-review`, or switch in Pi
   with `/profile review/my-review`. Use `/profile` for the picker and
   `/profile explain` to inspect the active restrictions and reference warnings.
   Switching triggers a reload. If startup reports that resource filters changed,
   run `/reload` as instructed.
4. Optionally set `"defaultProfile": "review/my-review"` in
   [`.pi/profiles.json`](../profiles.json). An explicit `--profile` flag when
   running Pi directly takes precedence, followed by persisted selection, restored
   session selection, and the default. The default therefore does not override a
   previously selected profile.

The recommended `pi-profile` launcher prepares an isolated copy-on-write `.pi`
view before Pi starts, allowing concurrent profiles; its settings and profile
state changes are discarded on exit. Do not pass Pi's `--profile` flag to this
launcher. See the [project README](../../README.md) for launcher details and
shared-resource caveats.

## Profile fields

All fields are optional; resource lists are arrays of strings.

| Fields | Purpose |
| --- | --- |
| `skillsEnable`, `skillsDisable` | Filter skills by name. |
| `promptsEnable`, `promptsDisable` | Filter prompt templates by name. |
| `mcpServersEnable`, `mcpServersDisable` | Filter MCP servers by name from the baseline configuration. |
| `packagesEnable`, `packagesDisable` | Overlay package entries from the baseline settings, using package source strings. |
| `extensionsEnable`, `extensionsDisable` | Overlay extension entries from the baseline settings, using paths or sources as in settings. |
| `extensionState.behavioralGuidelines` | Control guideline injection with `enabled`, `sections`, `include`, and `useDefaults`. Section names come from [`.pi/guidelines/guidelines.yaml`](../guidelines/guidelines.yaml). |
| `extra.override` | Deep-merge arbitrary settings into the generated settings, for example extension-specific settings. |

For skills, prompts, and MCP servers, an absent or empty enable list allows all
unless disabled; a nonempty enable list is an allow-list. `"*"` in an enable list
allows all, while `"*"` in a disable list disables all. Disable entries take
precedence. Quote `"*"` in YAML. Package and extension lists instead overlay the
baseline; they are not allow-lists. Paths for project extensions are relative to
`.pi`, as in the example.

Profile activation synchronizes generated `.pi/settings.json` and, when a
baseline exists, `.pi/mcp.json`, as well as local profile state. Edit the base
files rather than relying on generated output for persistent configuration. A
profile controls resources but does not inherit from another profile; copy an
existing YAML file if you want a starting point.
