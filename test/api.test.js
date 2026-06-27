import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("triages a known incident with dry-run controls", async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const incidents = await fetch(`${baseUrl}/api/incidents`);
  assert.equal(incidents.status, 200);
  assert.ok((await incidents.json()).length >= 3);

  const run = await fetch(`${baseUrl}/api/agent/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      incidentId: "INC-1042",
      operatorGoal: "triage checkout latency and prepare a safe handoff"
    })
  });
  assert.equal(run.status, 200);
  const body = await run.json();
  assert.equal(body.status, "needs-approval");
  assert.equal(body.risk.requiresApproval, true);
  assert.equal(body.triage.approvalRequired, true);
});
