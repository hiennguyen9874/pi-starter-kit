/**
 * save-conversation
 *
 * Lưu hội thoại thành markdown, chỉ gồm:
 *   - mọi user message
 *   - assistant message CUỐI CÙNG trước mỗi user message kế tiếp (hoặc cuối nhánh)
 *
 * Ví dụ: U1 → A1 → A2 → A3 → U2 → A4 → A5 → A6 → A7
 *   => lưu: U1, A3, U2, A7
 *
 * Lệnh:
 *   /save-conversation [path]   Lưu ngay (mặc định .pi/conversations/<sessionId>.md)
 *   /save-conversation-full [path]  Lưu toàn bộ user/assistant messages trong session
 *   /save-last-message             Lưu assistant message cuối của nhánh hiện tại
 *   /save-conversation-auto     Bật/tắt tự động lưu mỗi khi agent chạy xong
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

type Block = { type?: string; text?: string };
type Msg = { role: "user" | "assistant"; content: unknown };
type Entries = ReturnType<ExtensionContext["sessionManager"]["getEntries"]>;
type Turn = { user: Msg; assistant?: Msg };

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as Block[])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text!)
    .join("\n");
}

function collectMessages(entries: Entries): Msg[] {
  const messages: Msg[] = [];
  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const msg = entry.message;
    if (msg.role === "user" || msg.role === "assistant") messages.push(msg);
  }
  return messages;
}

/** Gom nhánh thành các lượt: mỗi user message + assistant message cuối cùng của lượt đó. */
function collectTurns(messages: Msg[]): Turn[] {
  const turns: Turn[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      turns.push({ user: msg });
    } else if (turns.length > 0) {
      // Ghi đè liên tục -> cuối cùng còn lại assistant message cuối của lượt.
      // Bỏ qua message rỗng text (vd. bị abort giữa chừng chỉ có tool call) nếu đã có bản có text.
      const cur = turns[turns.length - 1];
      if (textOf(msg.content).trim() || !cur.assistant) cur.assistant = msg;
    }
  }
  return turns;
}

function toMarkdown(turns: Turn[], title: string): string {
  const out: string[] = [`# ${title}`, ""];
  turns.forEach((t, i) => {
    out.push(`## User ${i + 1}`, "", textOf(t.user.content).trim() || "_(không có nội dung text)_", "");
    if (t.assistant) {
      out.push(`## Assistant ${i + 1}`, "", textOf(t.assistant.content).trim() || "_(không có nội dung text)_", "");
    }
    out.push("---", "");
  });
  return out.join("\n");
}

function fullMarkdown(messages: Msg[], title: string): string {
  const out = [`# ${title}`, ""];
  for (const [i, msg] of messages.entries()) {
    const role = msg.role === "user" ? "User" : "Assistant";
    const text = textOf(msg.content);
    out.push(`## ${role} ${i + 1}`, "", text.trim() ? text : "_(không có nội dung text)_", "", "---", "");
  }
  return out.join("\n");
}

export default function (pi: ExtensionAPI) {
  let autoSave = false;

  function save(ctx: ExtensionContext, target?: string, full = false): string | undefined {
    const session = ctx.sessionManager;
    const messages = collectMessages(full ? session.getEntries() : session.getBranch());
    const sessionId = session.getSessionId();
    const title = session.getSessionName() || `Conversation ${sessionId}`;
    let markdown: string;
    if (full) {
      if (messages.length === 0) return undefined;
      markdown = fullMarkdown(messages, title);
    } else {
      const turns = collectTurns(messages);
      if (turns.length === 0) return undefined;
      markdown = toMarkdown(turns, title);
    }

    const rel = target?.trim() || join(".pi", "conversations", `${sessionId}${full ? "-full" : ""}.md`);
    const file = isAbsolute(rel) ? rel : join(ctx.cwd, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, markdown, "utf-8");
    return file;
  }

  function registerSaveCommand(name: string, description: string, full = false) {
    pi.registerCommand(name, {
      description,
      handler: async (args, ctx) => {
        try {
          const file = save(ctx, args, full);
          if (file) ctx.ui.notify(`Đã lưu: ${file}`, "info");
          else ctx.ui.notify("Chưa có message nào để lưu", "warning");
        } catch (err) {
          ctx.ui.notify(`Lưu thất bại: ${err}`, "error");
        }
      },
    });
  }

  registerSaveCommand("save-conversation", "Lưu user messages + assistant message cuối mỗi lượt ra markdown");
  registerSaveCommand("save-conversation-full", "Lưu toàn bộ user/assistant messages trong session, không gồm tool input/output", true);

  pi.registerCommand("save-last-message", {
    description: "Save the last assistant message to a file",
    handler: async (_args, ctx) => {
      const last = collectMessages(ctx.sessionManager.getBranch()).findLast((msg) => msg.role === "assistant");
      const text = last ? textOf(last.content) : "";
      if (!text) {
        ctx.ui.notify("No assistant message found", "warning");
        return;
      }

      const file = join(ctx.cwd, ".pi-last-response.md");
      try {
        writeFileSync(file, text, "utf-8");
        ctx.ui.notify(`Saved to ${file}`, "info");
      } catch (err) {
        ctx.ui.notify(`Failed to save: ${err}`, "error");
      }
    },
  });

  pi.registerCommand("save-conversation-auto", {
    description: "Bật/tắt tự động lưu hội thoại sau mỗi lần agent chạy xong",
    handler: async (_args, ctx) => {
      autoSave = !autoSave;
      ctx.ui.notify(`Auto-save conversation: ${autoSave ? "BẬT" : "TẮT"}`, "info");
    },
  });

  // agent_settled: Pi chắc chắn không tiếp tục chạy -> assistant message cuối là message kết thúc.
  pi.on("agent_settled", async (_event, ctx) => {
    if (!autoSave) return;
    try {
      save(ctx);
    } catch (err) {
      ctx.ui.notify(`Auto-save thất bại: ${err}`, "error");
    }
  });
}
