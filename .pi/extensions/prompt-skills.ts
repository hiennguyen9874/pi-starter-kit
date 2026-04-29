import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface PromptMetadata {
  skills: string[];
}

interface SkillSource {
  name: string;
  path: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export default function (pi: ExtensionAPI) {
  let pendingPromptSkills: string[] = [];

  pi.on("input", async (event, ctx) => {
    if (event.source === "extension") return { action: "continue" };

    const command = parsePromptCommand(event.text);
    if (!command) {
      pendingPromptSkills = [];
      return { action: "continue" };
    }

    const promptPath = findPromptPath(ctx.cwd, command);
    if (!promptPath) {
      pendingPromptSkills = [];
      return { action: "continue" };
    }

    pendingPromptSkills = readPromptMetadata(promptPath).skills;
    return { action: "continue" };
  });

  pi.on("before_agent_start", async (_event, ctx) => {
    const skillNames = pendingPromptSkills;
    pendingPromptSkills = [];

    if (skillNames.length === 0) return;

    const skillIndex = discoverSkills(ctx.cwd);
    const loaded: string[] = [];
    const missing: string[] = [];

    for (const skillName of skillNames) {
      const source = skillIndex.get(skillName);
      if (!source) {
        missing.push(skillName);
        continue;
      }

      const content = readFileSync(source.path, "utf8");
      loaded.push(formatSkill(source.name, source.path, content));
    }

    if (loaded.length === 0 && missing.length === 0) return;

    const missingText = missing.length > 0
      ? `\n\nMissing prompt-declared skills: ${missing.map((name) => `\`${name}\``).join(", ")}`
      : "";

    ctx.ui.notify(
      `Prompt skills: ${loaded.length} loaded${missing.length > 0 ? `, ${missing.length} missing` : ""}`,
      missing.length > 0 ? "warning" : "info",
    );

    return {
      message: {
        customType: "prompt-skills",
        display: true,
        content: `Prompt-declared skills loaded before executing prompt. Follow these skill instructions when relevant.\n\n${loaded.join("\n\n---\n\n")}${missingText}`,
        details: { loaded: skillNames.filter((name) => !missing.includes(name)), missing },
      },
    };
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

function readPromptMetadata(promptPath: string): PromptMetadata {
  const text = readFileSync(promptPath, "utf8");
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { skills: [] };

  return { skills: parseSkills(match[1]) };
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

function discoverSkills(cwd: string): Map<string, SkillSource> {
  const roots = [
    join(cwd, ".pi", "skills"),
    join(cwd, ".agents", "skills"),
    join(homedir(), ".pi", "agent", "skills"),
    join(homedir(), ".agents", "skills"),
  ];

  const skills = new Map<string, SkillSource>();
  for (const root of roots) {
    for (const source of discoverSkillsInRoot(root)) {
      if (!skills.has(source.name)) skills.set(source.name, source);
    }
  }
  return skills;
}

function discoverSkillsInRoot(root: string): SkillSource[] {
  if (!existsSync(root)) return [];

  const result: SkillSource[] = [];
  const entries = readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      const skillPath = join(path, "SKILL.md");
      if (existsSync(skillPath)) {
        result.push({ name: entry.name, path: skillPath });
      }
      result.push(...discoverSkillsInRoot(path));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md") && dirname(path) === root) {
      result.push({ name: entry.name.slice(0, -3), path });
    }
  }

  return result;
}

function formatSkill(name: string, path: string, content: string): string {
  return `<skill name="${escapeXml(name)}" path="${escapeXml(resolve(path))}">\n${content}\n</skill>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
