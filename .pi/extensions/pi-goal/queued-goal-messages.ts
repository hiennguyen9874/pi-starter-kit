import { CONTINUATION_MESSAGE_TYPE } from "./state.ts";
import { continuationGoalIdFromMessage } from "./prompts.ts";

export interface GoalTextPart {
  type: "text";
  text: string;
}

export interface GoalContextMessage {
  role?: string;
  customType?: string;
  content?: unknown;
  display?: boolean;
  details?: unknown;
}

export function isPiGoalContinuationDetails(details: unknown): details is { goalId: string } {
  return (
    details !== null &&
    typeof details === "object" &&
    typeof (details as { goalId?: unknown }).goalId === "string"
  );
}

export function textFromContextMessageContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  const textParts = content.filter(
    (part): part is GoalTextPart =>
      part !== null &&
      typeof part === "object" &&
      (part as { type?: unknown }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string"
  );

  return textParts.length === 0 ? null : textParts.map((part) => part.text).join("\n");
}

export function continuationGoalIdFromContextMessage(message: GoalContextMessage): string | null {
  if (
    message.role === "custom" &&
    message.customType === CONTINUATION_MESSAGE_TYPE &&
    isPiGoalContinuationDetails(message.details)
  ) {
    return message.details.goalId;
  }

  const text = textFromContextMessageContent(message.content);
  return text === null ? null : continuationGoalIdFromMessage(text);
}
