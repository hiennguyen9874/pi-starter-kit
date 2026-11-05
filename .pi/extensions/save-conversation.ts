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
 *   /save-conversation-auto     Bật/tắt tự động lưu mỗi khi agent chạy xong
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

type Block = { type?: string; text?: string };
type Msg = { role: string; content: unknown; stopReason?: string; timestamp?: number };
type Turn = { user: Msg; assistant?: Msg };

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as Block[])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text!)
    .join("\n")
    .trim();
}

/** Gom nhánh thành các lượt: mỗi user message + assistant message cuối cùng của lượt đó. */
function collectTurns(branch: any[]): Turn[] {
  const turns: Turn[] = [];
  for (const entry of branch) {
    if (entry?.type !== "message") continue;
    const msg = entry.message as Msg;
    if (msg?.role === "user") {
      turns.push({ user: msg });
    } else if (msg?.role === "assistant" && turns.length > 0) {
      // Ghi đè liên tục -> cuối cùng còn lại assistant message cuối của lượt.
      // Bỏ qua message rỗng text (vd. bị abort giữa chừng chỉ có tool call) nếu đã có bản có text.
      const cur = turns[turns.length - 1];
      if (textOf(msg.content) || !cur.assistant) cur.assistant = msg;
    }
  }
  return turns;
}

function toMarkdown(turns: Turn[], title: string): string {
  const out: string[] = [`# ${title}`, ""];
  turns.forEach((t, i) => {
    out.push(`## User ${i + 1}`, "", textOf(t.user.content) || "_(không có nội dung text)_", "");
    if (t.assistant) {
      out.push(`## Assistant ${i + 1}`, "", textOf(t.assistant.content) || "_(không có nội dung text)_", "");
    }
    out.push("---", "");
  });
  return out.join("\n");
}

export default function (pi: ExtensionAPI) {
  let autoSave = false;

  function save(ctx: any, target?: string): string | undefined {
    const turns = collectTurns(ctx.sessionManager.getBranch());
    if (turns.length === 0) return undefined;

    const sessionId = ctx.sessionManager.getSessionId?.() ?? "session";
    const rel = target?.trim() || join(".pi", "conversations", `${sessionId}.md`);
    const file = isAbsolute(rel) ? rel : join(ctx.cwd, rel);
    const title = ctx.sessionManager.getSessionName?.() || `Conversation ${sessionId}`;

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, toMarkdown(turns, title), "utf-8");
    return file;
  }

  pi.registerCommand("save-conversation", {
    description: "Lưu user messages + assistant message cuối mỗi lượt ra markdown",
    handler: async (args, ctx) => {
      try {
        const file = save(ctx, args);
        if (file) ctx.ui.notify(`Đã lưu: ${file}`, "info");
        else ctx.ui.notify("Chưa có message nào để lưu", "warning");
      } catch (err) {
        ctx.ui.notify(`Lưu thất bại: ${err}`, "error");
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
