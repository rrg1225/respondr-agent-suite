# Respondr Agent Suite

[![CI](https://github.com/rrg1225/respondr-agent-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/rrg1225/respondr-agent-suite/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Express-Agent%20API-111827?logo=express)
![SRE](https://img.shields.io/badge/SRE-Incident%20Response-E11D48)
![License](https://img.shields.io/badge/License-MIT-green)

Respondr Agent Suite is a full-stack incident response agent workspace. It shows how an operational AI assistant can triage incidents, retrieve runbooks, classify risk, propose dry-run mitigations, and generate audit-friendly handoffs.

> Resume and interview brief: [PORTFOLIO.md](PORTFOLIO.md)
> Enterprise architecture: [docs/ENTERPRISE_ARCHITECTURE.md](docs/ENTERPRISE_ARCHITECTURE.md)

## Why This Project Matters

Incident response is a high-stakes workflow. This project keeps approval gates, risk policy, and tool permissions outside the model so they can be reviewed, audited, and evolved safely.

## Features

- Incident list with severity, service, owner, region, symptoms, and impact.
- Deterministic incident agent for repeatable demos.
- Runbook retrieval grounded by affected service.
- Risk classification for P1, P2, P3, and unsafe operator goals.
- Dry-run mitigation proposals with approval flags.
- Handoff generation for service owners and incident commanders.
- Trace timeline for every run.
- Runtime metrics and structured API errors.

## Architecture

```text
React incident workspace
  -> Express API
  -> Incident agent
  -> Risk classifier
  -> Runbook retrieval
  -> Handoff builder
```

Key modules:

| Path | Purpose |
| --- | --- |
| `server/agent.js` | Incident agent loop and handoff generation |
| `server/data.js` | Demo incidents, signals, runbooks, and scoring |
| `server/index.js` | API routes and trace persistence |
| `server/http.js` | Structured errors and API 404 handling |
| `src/App.jsx` | Incident response workspace UI |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API defaults to `http://localhost:4330`.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health |
| `GET` | `/api/incidents` | Scored incident list |
| `GET` | `/api/runbooks` | Service runbook data |
| `GET` | `/api/tools` | Agent tool catalog |
| `GET` | `/api/metrics/runtime` | Runtime request and status metrics |
| `POST` | `/api/agent/runs` | Run incident triage |

## Safety Model

- P1 incidents require approval before mitigation.
- Unsafe operator goals are blocked.
- All actions remain dry-run by default.
- API keys are not required for the deterministic demo.

## License

MIT
