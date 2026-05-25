import test from "node:test";
import assert from "node:assert/strict";

import { commandNameFrom, dedupeHistoryEntries, filterHistoryEntries, parseHistoryLine } from "./index.ts";

test("commandNameFrom extracts slash command name without arguments", () => {
	assert.equal(commandNameFrom("/commit-work"), "commit-work");
	assert.equal(commandNameFrom("/commit-work now"), "commit-work");
	assert.equal(commandNameFrom("plain text"), undefined);
});

test("parseHistoryLine preserves raw slash command text", () => {
	const line = JSON.stringify({
		cwd: "/repo",
		text: "/commit-work --fast",
		ts: 123,
	});
	const parsed = parseHistoryLine(line, "/repo");
	assert.ok(parsed);
	assert.equal(parsed?.text, "/commit-work --fast");
	assert.equal(parsed?.isSlash, true);
	assert.equal(parsed?.commandName, "commit-work");
});

test("filterHistoryEntries matches query case-insensitively", () => {
	const entries = [
		{ cwd: "/repo", text: "/commit-work", ts: 1, isSlash: true, commandName: "commit-work" },
		{ cwd: "/repo", text: "investigate auth bug", ts: 2, isSlash: false, commandName: undefined },
		{ cwd: "/repo", text: "/review-pr 42", ts: 3, isSlash: true, commandName: "review-pr" },
	];

	const filtered = filterHistoryEntries(entries, "COMMIT");
	assert.equal(filtered.length, 1);
	assert.equal(filtered[0].text, "/commit-work");
});

test("dedupeHistoryEntries keeps the latest duplicate", () => {
	const entries = [
		{ cwd: "/repo", text: "/commit-work", ts: 1, isSlash: true, commandName: "commit-work" },
		{ cwd: "/repo", text: "plain text", ts: 2, isSlash: false, commandName: undefined },
		{ cwd: "/repo", text: "/commit-work", ts: 3, isSlash: true, commandName: "commit-work" },
	];

	const deduped = dedupeHistoryEntries(entries);
	assert.equal(deduped.length, 2);
	assert.equal(deduped[0].text, "plain text");
	assert.equal(deduped[1].text, "/commit-work");
	assert.equal(deduped[1].ts, 3);
});
