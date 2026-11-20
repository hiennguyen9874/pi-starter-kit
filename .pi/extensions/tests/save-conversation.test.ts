import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import saveConversation from "../save-conversation.ts";

const message = (role: string, content: unknown) => ({ type: "message", message: { role, content } });
const text = (text: string) => ({ type: "text", text });

test("exports the full session without tool payloads and preserves compact export commands", async (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "save-conversation-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const commands = new Map<string, (args: string, ctx: unknown) => Promise<void>>();
  const events = new Map<string, (event: unknown, ctx: unknown) => Promise<void>>();
  saveConversation({
    registerCommand: (name: string, command: { handler: (args: string, ctx: unknown) => Promise<void> }) =>
      commands.set(name, command.handler),
    on: (name: string, handler: (event: unknown, ctx: unknown) => Promise<void>) => events.set(name, handler),
  } as unknown as ExtensionAPI);

  const user = message("user", "User prompt");
  const intermediate = message("assistant", [text("Intermediate reply"), { type: "toolCall", arguments: { input: "secret-input" } }]);
  const final = message("assistant", [text("Final reply")]);
  const branch = [user, intermediate, final];
  const ctx = {
    cwd,
    ui: { notify: () => {} },
    sessionManager: {
      getBranch: () => branch,
      getEntries: () => [user, intermediate, message("toolResult", [text("secret-output")]),
        message("assistant", [text("Other branch reply")]), { type: "compaction", summary: "secret-summary" },
        final, message("user", [text("Follow-up")])],
      getSessionId: () => "test",
      getSessionName: () => "Test session",
    },
  };
  const run = (name: string, args = "") => commands.get(name)!(args, ctx);
  const compact = join(cwd, ".pi/conversations/test.md");
  const full = join(cwd, ".pi/conversations/test-full.md");

  await run("save-conversation-full");
  const transcript = readFileSync(full, "utf-8");
  assert.match(transcript, /User prompt[\s\S]*Intermediate reply[\s\S]*Other branch reply[\s\S]*Final reply[\s\S]*Follow-up/);
  assert.doesNotMatch(transcript, /secret-/);
  assert.equal(existsSync(compact), false);

  await run("save-conversation-full", "exports/full.md");
  assert.equal(readFileSync(join(cwd, "exports/full.md"), "utf-8"), transcript);
  await run("save-conversation");
  const summary = readFileSync(compact, "utf-8");
  assert.match(summary, /User prompt[\s\S]*Final reply/);
  assert.doesNotMatch(summary, /Intermediate reply|Other branch reply|Follow-up/);

  await run("save-last-message");
  assert.equal(readFileSync(join(cwd, ".pi-last-response.md"), "utf-8"), "Final reply");
  rmSync(compact);
  await run("save-conversation-auto");
  await events.get("agent_settled")!({}, ctx);
  assert.equal(readFileSync(compact, "utf-8"), summary);
  assert.equal(readFileSync(full, "utf-8"), transcript);
});
