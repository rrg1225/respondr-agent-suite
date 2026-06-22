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

test("validates incident agent requests with structured errors", async () => {
  const server = createApp().listen(0);
  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${baseUrl}/api/agent/runs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "missing-incident"
      },
      body: JSON.stringify({ operatorGoal: "triage safely" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error.code, "invalid_request");
    assert.equal(payload.error.requestId, "missing-incident");
    assert.equal(payload.service, "respondr-agent-suite");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
