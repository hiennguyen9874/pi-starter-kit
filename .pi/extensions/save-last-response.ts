import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

type ContentBlock = { type?: string; text?: string };

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  const parts: string[] = [];
  for (const block of content) {
    if (block && typeof block === "object" && (block as ContentBlock).type === "text" && typeof (block as ContentBlock).text === "string") {
      parts.push((block as ContentBlock).text!);
    }
  }
  return parts.join("\n");
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("save-last-message", {
    description: "Save the last assistant message to a file",
    handler: async (_args, ctx) => {
      const branch = ctx.sessionManager.getBranch();
      let lastAssistantText = "";

      for (let i = branch.length - 1; i >= 0; i--) {
        const entry = branch[i];
        if (entry.type === "message" && entry.message?.role === "assistant") {
          lastAssistantText = extractText(entry.message.content);
          break;
        }
      }

      if (!lastAssistantText) {
        ctx.ui.notify("No assistant message found", "warning");
        return;
      }

      const filePath = join(process.cwd(), ".pi-last-response.md");
      try {
        writeFileSync(filePath, lastAssistantText, "utf-8");
        ctx.ui.notify(`Saved to ${filePath}`, "info");
      } catch (err) {
        ctx.ui.notify(`Failed to save: ${err}`, "error");
      }
    },
  });
}
