import test from "node:test";
import assert from "node:assert/strict";

import { createProfilePolicy } from "./profile-policy.ts";
import { filterMcpResultText, isBlockedMcpRequest } from "./index.ts";

test("mcp connect request is blocked when server is disallowed", () => {
  const policy = createProfilePolicy({
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.deepEqual(isBlockedMcpRequest({ connect: "chrome-devtools" }, policy), {
    blocked: true,
    server: "chrome-devtools",
  });
});

test("mcp tool request with explicit server is blocked when disallowed", () => {
  const policy = createProfilePolicy({
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.deepEqual(isBlockedMcpRequest({ tool: "inspect_page", server: "chrome-devtools" }, policy), {
    blocked: true,
    server: "chrome-devtools",
  });
});

test("allow-list semantics deny unspecified servers", () => {
  const policy = createProfilePolicy({
    mcpServersEnable: ["memory"],
  });

  assert.deepEqual(isBlockedMcpRequest({ connect: "chrome-devtools" }, policy), {
    blocked: true,
    server: "chrome-devtools",
  });
});

test("requests without a server are not preflight blocked in v1", () => {
  const policy = createProfilePolicy({
    mcpServersDisable: ["chrome-devtools"],
  });

  assert.deepEqual(isBlockedMcpRequest({ tool: "search" }, policy), {
    blocked: false,
  });
});

test("mcp result text lightly filters disallowed server names", () => {
  const text = "Available servers: chrome-devtools, memory";

  assert.equal(filterMcpResultText(text, ["chrome-devtools"]), "Available servers: [blocked-server], memory");
});
