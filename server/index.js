import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { incidents, listIncidents, runbooks } from "./data.js";
import { runIncidentAgent, toolCatalog } from "./agent.js";
import { createRuntimeState, installRuntimeControls, runtimeMetrics } from "./runtime.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

export function createApp() {
  const app = express();
  const runtime = createRuntimeState("respondr-agent-suite");
  installRuntimeControls(app, runtime);
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "respondr-agent-suite",
      mode: process.env.AGENT_MODE || "deterministic"
    });
  });

  app.get("/api/incidents", (_req, res) => {
    res.json(listIncidents());
  });

  app.get("/api/runbooks", (_req, res) => {
    res.json(runbooks);
  });

  app.get("/api/tools", (_req, res) => {
    res.json(toolCatalog);
  });

  app.get("/api/metrics/runtime", (_req, res) => {
    res.json(runtimeMetrics(runtime));
  });

  app.post("/api/agent/runs", async (req, res, next) => {
    try {
      const run = runIncidentAgent(req.body);
      await persistTrace(run);
      res.status(run.status === "failed" ? 404 : 200).json(run);
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(join(rootDir, "dist")));
  app.get(/.*/, (_req, res) => {
    res.sendFile(join(rootDir, "dist", "index.html"));
  });

  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: error.message || "unexpected server error" });
  });

  return app;
}

async function persistTrace(run) {
  const traceDir = join(rootDir, "traces");
  await mkdir(traceDir, { recursive: true });
  await writeFile(join(traceDir, `${run.runId}.json`), JSON.stringify(run, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4330);
  createApp().listen(port, () => {
    console.log(`Respondr Agent Suite running on http://localhost:${port}`);
    console.log(`Loaded ${incidents.length} demo incidents`);
  });
}
