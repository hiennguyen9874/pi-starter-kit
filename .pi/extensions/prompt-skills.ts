import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import type { ExtensionAPI, Skill } from "@earendil-works/pi-coding-agent";

type SkillPosition = "before" | "after";

interface PromptMetadata {
  skills: string[];
  skillPosition: SkillPosition;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const MESSAGE_TYPE = "prompt-skills";

interface ActiveSkillMessage {
  content: string;
  position: SkillPosition;
}

export default function (pi: ExtensionAPI) {
  let pendingPromptMetadata: PromptMetadata = emptyPromptMetadata();
  let activeSkillMessage: ActiveSkillMessage | undefined;

  pi.on("input", async (event, ctx) => {
    if (event.source === "extension") return { action: "continue" };

    const command = parsePromptCommand(event.text);
    if (!command) {
      pendingPromptMetadata = emptyPromptMetadata();
      return { action: "continue" };
    }

    const promptPath = findPromptPath(ctx.cwd, command);
    if (!promptPath) {
      pendingPromptMetadata = emptyPromptMetadata();
      return { action: "continue" };
    }

    pendingPromptMetadata = readPromptMetadata(promptPath);
    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const { skills: skillNames, skillPosition } = pendingPromptMetadata;
    pendingPromptMetadata = emptyPromptMetadata();
    activeSkillMessage = undefined;

    if (skillNames.length === 0) return;

    const skillIndex = indexLoadedSkills(event.systemPromptOptions.skills ?? []);
    const loadedFull: string[] = [];
    const missing: string[] = [];

    for (const skillName of skillNames) {
      const skill = skillIndex.get(skillName);
      if (!skill) {
        missing.push(skillName);
        continue;
      }

      const content = stripFrontmatter(readFileSync(skill.filePath, "utf8"));
      loadedFull.push(formatSkill(skill.name, skill.filePath, content));
    }

    if (loadedFull.length === 0 && missing.length === 0) return;

    const missingText = missing.length > 0
      ? `\n\nMissing prompt-declared skills: ${missing.map((name) => `\`${name}\``).join(", ")}`
      : "";

    ctx.ui.notify(
      `Prompt skills: ${loadedFull.length} loaded${missing.length > 0 ? `, ${missing.length} missing` : ""}`,
      missing.length > 0 ? "warning" : "info",
    );

    const header = `Prompt-declared skills loaded ${skillPosition} the user prompt. Follow these skill instructions when relevant.`;
    activeSkillMessage = {
      content: `${header}\n\n${loadedFull.join("\n\n---\n\n")}${missingText}`,
      position: skillPosition,
    };
  });

  pi.on("context", async (event) => {
    if (!activeSkillMessage) return;

    // Context changes affect only provider input: they do not alter the system prompt
    // or persist the skill message in session history.
    const messages = event.messages.filter(
      (message) => !(message.role === "custom" && message.customType === MESSAGE_TYPE),
    );
    const userIndex = findLastUserMessageIndex(messages);
    if (userIndex === -1) return;

    const insertAt = activeSkillMessage.position === "before" ? userIndex : userIndex + 1;
    const skillMessage = {
      role: "custom" as const,
      customType: MESSAGE_TYPE,
      content: activeSkillMessage.content,
      display: false,
      details: { position: activeSkillMessage.position },
      timestamp: Date.now(),
    };

    return {
      messages: [
        ...messages.slice(0, insertAt),
        skillMessage,
        ...messages.slice(insertAt),
      ],
    };
  });

  pi.on("agent_settled", async () => {
    activeSkillMessage = undefined;
  });
}

function parsePromptCommand(text: string): string | undefined {
  const match = text.match(/^\s*\/([A-Za-z0-9._-]+)(?:\s|$)/);
  if (!match) return undefined;

  const command = match[1];
  if (command.startsWith("skill:")) return undefined;
  return command;
}

function findPromptPath(cwd: string, command: string): string | undefined {
  const candidates = [
    join(cwd, ".pi", "prompts", `${command}.md`),
    join(homedir(), ".pi", "agent", "prompts", `${command}.md`),
  ];

  return candidates.find((path) => existsSync(path));
}

function emptyPromptMetadata(): PromptMetadata {
  return { skills: [], skillPosition: "before" };
}

function readPromptMetadata(promptPath: string): PromptMetadata {
  const text = readFileSync(promptPath, "utf8");
  const match = text.match(FRONTMATTER_RE);
  if (!match) return emptyPromptMetadata();

  return {
    skills: parseSkills(match[1]),
    skillPosition: parseSkillPosition(match[1]),
  };
}

function parseSkillPosition(frontmatter: string): SkillPosition {
  const match = frontmatter.match(/^skills-position\s*:\s*(.+?)\s*$/m);
  if (!match) return "before";

  return cleanSkillName(match[1]).toLowerCase() === "after" ? "after" : "before";
}

function parseSkills(frontmatter: string): string[] {
  const lines = frontmatter.split(/\r?\n/);
  const result: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const inlineMatch = line.match(/^skills\s*:\s*(.*)$/);
    if (!inlineMatch) continue;

    const inlineValue = inlineMatch[1].trim();
    if (inlineValue.length > 0) {
      result.push(...parseInlineSkills(inlineValue));
      continue;
    }

    for (index += 1; index < lines.length; index += 1) {
      const itemMatch = lines[index].match(/^\s*-\s*(.+?)\s*$/);
      if (!itemMatch) {
        index -= 1;
        break;
      }
      result.push(cleanSkillName(itemMatch[1]));
    }
  }

  return [...new Set(result.filter(Boolean))];
}

function parseInlineSkills(value: string): string[] {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1).split(",").map(cleanSkillName);
  }

  return value.split(",").map(cleanSkillName);
}

function cleanSkillName(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function indexLoadedSkills(skills: Skill[]): Map<string, Skill> {
  const index = new Map<string, Skill>();
  for (const skill of skills) {
    if (!index.has(skill.name)) index.set(skill.name, skill);
  }
  return index;
}

function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_RE, "").trimStart();
}

function formatSkill(name: string, path: string, content: string): string {
  return `<skill name="${escapeXml(name)}" path="${escapeXml(resolve(path))}">\n${content}\n</skill>`;
}

function findLastUserMessageIndex(messages: ReadonlyArray<{ role: string }>): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") return index;
  }
  return -1;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
