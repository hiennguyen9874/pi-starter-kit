import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import piDocumentation, { removePiDocumentation } from "../pi-documentation.ts";

const DOCS = "<docs>\nPi documentation (read only when needed):\n<reference>SDK docs</reference>\n</docs>";
const SYSTEM = `<rules>Keep these</rules>\n${DOCS}\n<other>Keep this too</other>`;
const user = (text = "Explain extensions") => ({ role: "user", content: [{ type: "text", text }], timestamp: 1 });

async function fixture(t: any, enabled = false) {
	const dir = mkdtempSync(join(tmpdir(), "pi-documentation-"));
	const previous = process.env.PI_CONFIG_DIR;
	process.env.PI_CONFIG_DIR = dir;
	const settingsPath = join(dir, "settings.json");
	const settings = JSON.stringify({ extensionState: { piDocumentationEnabled: enabled } });
	writeFileSync(settingsPath, settings);
	t.after(() => {
		if (previous === undefined) delete process.env.PI_CONFIG_DIR;
		else process.env.PI_CONFIG_DIR = previous;
		rmSync(dir, { recursive: true, force: true });
	});

	const handlers = new Map<string, Function>();
	const commands = new Map<string, any>();
	const sent: string[] = [];
	const notifications: string[] = [];
	const ctx = {
		hasUI: true,
		waitForIdle: async () => {},
		ui: {
			notify: (message: string) => notifications.push(message),
			setStatus: () => {},
			theme: { fg: (_color: string, text: string) => text },
		},
	};
	piDocumentation({
		on: (event: string, handler: Function) => handlers.set(event, handler),
		registerCommand: (name: string, command: any) => commands.set(name, command),
		sendUserMessage: (text: string) => sent.push(text),
	} as unknown as ExtensionAPI);
	const emit = (event: string, data: any = {}) => handlers.get(event)?.(data, ctx);
	const command = (name: string, args = "") => commands.get(name).handler(args, ctx);
	const start = async (text = "Explain extensions", systemPrompt = SYSTEM, source = "extension") => {
		await emit("input", { text, source });
		return emit("before_agent_start", { messageType: "user", prompt: text, systemPrompt });
	};
	await emit("session_start");
	return { emit, command, start, sent, notifications, ctx, settingsPath, settings };
}

test("removes only the Pi docs section, preserving surrounding sections", () => {
	assert.equal(removePiDocumentation(SYSTEM), "<rules>Keep these</rules>\n<other>Keep this too</other>");
	assert.equal(removePiDocumentation("<docs>Unrelated docs</docs>"), "<docs>Unrelated docs</docs>");
});

test("normal requests still omit docs by default", async (t) => {
	const f = await fixture(t);
	assert.equal((await f.start()).systemPrompt, removePiDocumentation(SYSTEM));
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
});

test("/pi-docs inserts a separate message immediately before the user without persisting settings", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "  Explain extensions  ");
	assert.deepEqual(f.sent, ["Explain extensions"]);
	assert.equal((await f.start()).systemPrompt, removePiDocumentation(SYSTEM));
	const history = [user("Earlier question"), { role: "assistant", content: [] }, user()];
	const result = await f.emit("context", { messages: history });
	assert.deepEqual(result.messages.map((m: any) => m.role), ["user", "assistant", "custom", "user"]);
	assert.equal(result.messages[2].content, DOCS);
	assert.equal(result.messages[2].display, false);
	assert.equal(result.messages[3], history[2]);
	assert.equal(history.length, 3);
	assert.equal(readFileSync(f.settingsPath, "utf8"), f.settings);
});

test("activation notice is UI-only and appears once per docs request", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	await f.start();
	assert.deepEqual(f.notifications, ["📚 Pi documentation enabled for this message"]);

	const first = await f.emit("context", { messages: [user()] });
	const next = await f.emit("context", { messages: first.messages });
	assert.equal(next.messages.length, 2);
	assert.equal(next.messages[0].content, DOCS);
	assert.equal(JSON.stringify(next.messages).includes("enabled for this message"), false);
	assert.equal(f.notifications.length, 1);

	await f.emit("agent_settled");
	await f.start("Normal request", SYSTEM, "interactive");
	assert.equal(f.notifications.length, 1);
});

test("activation notice is skipped without a UI", async (t) => {
	const f = await fixture(t);
	f.ctx.hasUI = false;
	await f.command("pi-docs", "Explain extensions");
	await f.start();
	assert.deepEqual(f.notifications, []);
	assert.equal((await f.emit("context", { messages: [user()] })).messages[0].content, DOCS);
});

test("docs remain available for tool continuations without duplication", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	await f.start();
	const first = await f.emit("context", { messages: [user()] });
	const messages = [...first.messages, { role: "assistant", content: [] }, { role: "toolResult", content: [] }];
	const next = await f.emit("context", { messages });
	assert.deepEqual(next.messages.map((m: any) => m.role), ["custom", "user", "assistant", "toolResult"]);
});

test("docs are cleared after settling and do not leak to the next request", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	await f.start();
	await f.emit("agent_settled");
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
	await f.start("Unrelated question", SYSTEM, "interactive");
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
});

test("empty arguments show usage without sending a message", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "   ");
	assert.deepEqual(f.sent, []);
	assert.deepEqual(f.notifications, ["Usage: /pi-docs <message>"]);
});

test("missing docs leave the prompt unchanged and inject nothing", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	assert.equal((await f.start("Explain extensions", "No docs here")).systemPrompt, "No docs here");
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
});

test("global on/off remains unchanged by a one-request command", async (t) => {
	const f = await fixture(t, true);
	assert.equal(await f.start(), undefined);
	await f.command("pi-docs", "Explain extensions");
	assert.equal((await f.start()).systemPrompt, removePiDocumentation(SYSTEM));
	assert.equal((await f.emit("context", { messages: [user()] })).messages[0].content, DOCS);
	await f.emit("agent_settled");
	assert.equal(await f.start(), undefined);
	await f.command("pi-documentation", "off");
	assert.equal((await f.start()).systemPrompt, removePiDocumentation(SYSTEM));
});

test("a failed submission does not opt a later identical interactive prompt into docs", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	await f.emit("input", { text: "Explain extensions", source: "extension" });
	// Simulate authentication failure before before_agent_start.
	await f.start("Explain extensions", SYSTEM, "interactive");
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
});

test("waits for the current run before sending the docs request", async (t) => {
	const f = await fixture(t);
	let release!: () => void;
	f.ctx.waitForIdle = () => new Promise<void>((resolve) => { release = resolve; });
	const pending = f.command("pi-docs", "Explain extensions");
	assert.deepEqual(f.sent, []);
	release();
	await pending;
	assert.deepEqual(f.sent, ["Explain extensions"]);
});

test("switching sessions clears pending and active documentation", async (t) => {
	const f = await fixture(t);
	await f.command("pi-docs", "Explain extensions");
	await f.emit("session_switch");
	await f.start();
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
	await f.command("pi-docs", "Explain extensions");
	await f.start();
	await f.emit("session_switch");
	assert.equal(await f.emit("context", { messages: [user()] }), undefined);
});
