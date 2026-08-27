import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HISTORY_DIR = join(homedir(), ".pi", "folder-history");
const MAX_HISTORY = 500;
const HISTORY_PICKER_MAX_ROWS = 12;
const HISTORY_PICKER_CHROME_ROWS = 6;
// Avoid pi's fullscreen transcript navigation bindings (ctrl+shift+up/down).
const HISTORY_PREVIOUS_KEY = "alt+shift+up";
const HISTORY_NEXT_KEY = "alt+shift+down";

type HistoryEntry = {
	cwd: string;
	text: string;
	ts: number;
	isSlash: boolean;
	commandName?: string;
};

function historyFileFor(cwd: string): string {
	return join(HISTORY_DIR, `${cwd.replace(/\//g, "-")}.jsonl`);
}

export function commandNameFrom(text: string): string | undefined {
	if (!text.startsWith("/")) return undefined;
	const name = text.slice(1).trim().split(/\s+/)[0];
	return name || undefined;
}

export function parseHistoryLine(line: string, cwd: string): HistoryEntry | null {
	try {
		const entry = JSON.parse(line) as Partial<HistoryEntry>;
		if (!entry || entry.cwd !== cwd || typeof entry.text !== "string") return null;
		const text = entry.text.trim();
		if (!text) return null;
		return {
			cwd,
			text,
			ts: typeof entry.ts === "number" ? entry.ts : Date.now(),
			isSlash: text.startsWith("/"),
			commandName: commandNameFrom(text),
		};
	} catch {
		return null;
	}
}

export function dedupeHistoryEntries(entries: HistoryEntry[]): HistoryEntry[] {
	const lastIndexByText = new Map<string, number>();
	entries.forEach((entry, index) => lastIndexByText.set(entry.text, index));
	const deduped = entries.filter((entry, index) => lastIndexByText.get(entry.text) === index);
	return deduped.slice(-MAX_HISTORY);
}

export function loadHistory(cwd: string): HistoryEntry[] {
	const file = historyFileFor(cwd);
	if (!existsSync(file)) return [];

	try {
		const parsed = readFileSync(file, "utf-8")
			.split("\n")
			.filter((line) => line.trim().length > 0)
			.map((line) => parseHistoryLine(line, cwd))
			.filter((entry): entry is HistoryEntry => entry !== null);

		return dedupeHistoryEntries(parsed);
	} catch {
		return [];
	}
}

function appendHistory(cwd: string, text: string): HistoryEntry {
	const trimmed = text.trim();
	const entry: HistoryEntry = {
		cwd,
		text: trimmed,
		ts: Date.now(),
		isSlash: trimmed.startsWith("/"),
		commandName: commandNameFrom(trimmed),
	};

	mkdirSync(HISTORY_DIR, { recursive: true });
	appendFileSync(historyFileFor(cwd), `${JSON.stringify(entry)}\n`, "utf-8");
	return entry;
}

function upsertInMemory(history: HistoryEntry[], next: HistoryEntry) {
	const index = history.findIndex((entry) => entry.text === next.text);
	if (index !== -1) history.splice(index, 1);
	history.push(next);
	if (history.length > MAX_HISTORY) history.shift();
}

export function filterHistoryEntries(entries: HistoryEntry[], query: string): HistoryEntry[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return entries;
	return entries.filter((entry) => entry.text.toLowerCase().includes(needle));
}

type HistoryDirection = "previous" | "next";

type HistoryNavigation = {
	historyIndex: number;
	savedEditorText: string;
	text: string;
};

export function navigateHistory(
	entries: HistoryEntry[],
	historyIndex: number,
	savedEditorText: string,
	currentEditorText: string,
	direction: HistoryDirection,
): HistoryNavigation | null {
	if (entries.length === 0) return null;

	if (direction === "previous") {
		const nextIndex = historyIndex + 1;
		if (nextIndex >= entries.length) return null;
		return {
			historyIndex: nextIndex,
			savedEditorText: historyIndex === -1 ? currentEditorText : savedEditorText,
			text: entries[entries.length - 1 - nextIndex].text,
		};
	}

	if (historyIndex <= -1) return null;
	const nextIndex = historyIndex - 1;
	return {
		historyIndex: nextIndex,
		savedEditorText,
		text: nextIndex === -1 ? savedEditorText : entries[entries.length - 1 - nextIndex].text,
	};
}

export default async function (pi: ExtensionAPI) {
	const [
		{ CustomEditor, DynamicBorder },
		{ Container, SelectList, Text, matchesKey },
	] = await Promise.all([
		import("@earendil-works/pi-coding-agent"),
		import("@earendil-works/pi-tui"),
	]);
	let currentCwd = "";
	let history: HistoryEntry[] = [];
	let historyIndex = -1;
	let savedEditorText = "";

	function applyHistoryNavigation(
		direction: HistoryDirection,
		getEditorText: () => string,
		setEditorText: (text: string) => void,
	): boolean {
		const result = navigateHistory(
			history,
			historyIndex,
			savedEditorText,
			getEditorText(),
			direction,
		);
		if (!result) return false;
		historyIndex = result.historyIndex;
		savedEditorText = result.savedEditorText;
		setEditorText(result.text);
		return true;
	}

	class HistoryEditor extends CustomEditor {
		handleInput(data: string): void {
			if (
				matchesKey(data, HISTORY_PREVIOUS_KEY) ||
				(matchesKey(data, "up") && !this.getText().includes("\n"))
			) {
				if (applyHistoryNavigation("previous", () => this.getText(), (text) => this.setText(text))) {
					return;
				}
			}

			if (
				matchesKey(data, HISTORY_NEXT_KEY) ||
				(matchesKey(data, "down") && !this.getText().includes("\n"))
			) {
				if (applyHistoryNavigation("next", () => this.getText(), (text) => this.setText(text))) {
					return;
				}
			}

			super.handleInput(data);
		}
	}

	pi.on("session_start", (_event, ctx) => {
		currentCwd = ctx.cwd;
		history = loadHistory(currentCwd);
		historyIndex = -1;
		savedEditorText = "";
		ctx.ui.setEditorComponent((tui, theme, keybindings) =>
			new HistoryEditor(tui, theme, keybindings),
		);
	});

	pi.on("input", (event, ctx) => {
		const text = event.text?.trim();
		if (!text || !currentCwd) return { action: "continue" as const };

		const entry = appendHistory(currentCwd, text);
		upsertInMemory(history, entry);
		historyIndex = -1;
		savedEditorText = "";

		return { action: "continue" as const };
	});

	pi.registerShortcut(HISTORY_PREVIOUS_KEY, {
		description: "Previous command from folder history",
		handler: (ctx) => {
			applyHistoryNavigation(
				"previous",
				() => ctx.ui.getEditorText(),
				(text) => ctx.ui.setEditorText(text),
			);
		},
	});

	pi.registerShortcut(HISTORY_NEXT_KEY, {
		description: "Next command from folder history",
		handler: (ctx) => {
			applyHistoryNavigation(
				"next",
				() => ctx.ui.getEditorText(),
				(text) => ctx.ui.setEditorText(text),
			);
		},
	});

	async function pickAndRestore(entries: HistoryEntry[], ctx: ExtensionContext) {
		if (entries.length === 0) {
			ctx.ui.notify("No saved history for this folder", "info");
			return;
		}

		const reversed = [...entries].reverse();
		const labels = reversed.map((entry) => {
			const prefix = entry.isSlash ? "slash" : "text";
			// Keep every item on one visual row. The original text is restored on selection.
			return `[${prefix}] ${entry.text.replace(/\s+/g, " ")}`;
		});

		let selectedIndex: number | undefined;
		if (ctx.mode === "tui") {
			selectedIndex = await ctx.ui.custom<number | undefined>((tui, theme, _keybindings, done) => {
				const items = labels.map((label, index) => ({ value: String(index), label }));
				const availableRows = Math.max(1, tui.terminal.rows - HISTORY_PICKER_CHROME_ROWS);
				const visibleRows = Math.min(items.length, HISTORY_PICKER_MAX_ROWS, availableRows);
				const container = new Container();

				container.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));
				container.addChild(
					new Text(
						theme.fg("accent", theme.bold(`Command History (${entries.length})`)),
						1,
						0,
					),
				);

				const selectList = new SelectList(items, visibleRows, {
					selectedPrefix: (text: string) => theme.fg("accent", text),
					selectedText: (text: string) => theme.fg("accent", text),
					description: (text: string) => theme.fg("muted", text),
					scrollInfo: (text: string) => theme.fg("dim", text),
					noMatch: (text: string) => theme.fg("warning", text),
				});
				selectList.onSelect = (item) => done(Number(item.value));
				selectList.onCancel = () => done(undefined);
				container.addChild(selectList);
				container.addChild(
					new Text(theme.fg("dim", "↑↓ navigate • enter restore • esc cancel"), 1, 0),
				);
				container.addChild(new DynamicBorder((text: string) => theme.fg("accent", text)));

				return {
					render: (width: number) => container.render(width),
					invalidate: () => container.invalidate(),
					handleInput: (data: string) => {
						selectList.handleInput(data);
						tui.requestRender();
					},
				};
			});
		} else {
			const picked = await ctx.ui.select("Select history to restore", labels);
			if (picked) selectedIndex = labels.indexOf(picked);
		}

		if (selectedIndex === undefined || selectedIndex < 0) return;
		const selected = reversed[selectedIndex];
		if (!selected) return;
		ctx.ui.setEditorText(selected.text);

		if (selected.isSlash && selected.commandName) {
			const commands = pi.getCommands();
			const exists = commands.some((command) => command.name === selected.commandName);
			if (!exists) {
				ctx.ui.notify(
					`Command /${selected.commandName} is not available in this session`,
					"warning",
				);
			}
		}
	}

	pi.registerCommand("command-history", {
		description: "Pick a saved command/prompt and put it into the editor",
		handler: async (_args, ctx) => {
			await pickAndRestore(history, ctx);
		},
	});

	pi.registerCommand("command-history-search", {
		description: "Search saved history, then restore a matching command/prompt",
		handler: async (args, ctx) => {
			if (history.length === 0) {
				ctx.ui.notify("No saved history for this folder", "info");
				return;
			}

			let query = (args ?? "").trim();
			if (!query && ctx.hasUI) {
				const entered = await ctx.ui.input("Search history");
				if (entered === undefined) return;
				query = entered.trim();
			}

			const filtered = filterHistoryEntries(history, query);
			if (filtered.length === 0) {
				ctx.ui.notify(`No history matches: ${query}`, "info");
				return;
			}

			await pickAndRestore(filtered, ctx);
		},
	});
}
