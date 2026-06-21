import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../server/index.js";

test("exposes runtime metrics and request correlation headers", async () => {
  const server = createApp().listen(0);
  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${baseUrl}/api/health`, {
      headers: { "x-request-id": "respondr-test" }
    });

    assert.equal(health.headers.get("x-request-id"), "respondr-test");
    assert.equal(health.headers.get("referrer-policy"), "no-referrer");

    const metrics = await fetch(`${baseUrl}/api/metrics/runtime`).then((response) => response.json());
    assert.equal(metrics.service, "respondr-agent-suite");
    assert.ok(metrics.requests >= 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
