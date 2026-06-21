# Respondr Agent Suite

[简体中文](#简体中文) | [English](#english)

Respondr Agent Suite is a full-stack AI incident response workspace. It demonstrates agent engineering beyond a chat box: typed tool contracts, runbook retrieval, risk scoring, approval gates, dry-run actions, trace persistence, and a polished React dashboard.

---

## 简体中文

### 项目定位

这是一个适合作品集展示的 AI Agent 全栈项目。它模拟真实 SRE/运维事故响应场景，让 agent 在读取事故、关联指标、检索 runbook、生成处置建议和输出交接文档时保持可审计、可回放、可测试。

默认模式不需要任何模型 Key：项目内置确定性 agent loop，因此克隆后即可运行、测试和演示。`.env.example` 预留 OpenAI-compatible、Gemini 和 DashScope 配置位，后续可以接入真实模型。

### 核心亮点

- **全栈结构完整**：React + Vite 前端，Express API 后端，Node test 自动化验证。
- **Agent Loop 明确**：observe -> decide -> act -> validate -> handoff，每一步写入 trace。
- **工具权限边界**：`read` 与 `write-dry-run` 工具分层，避免 demo 误导成真实外部写入。
- **Runbook 检索**：根据事故服务检索处置手册，并把审批要求带入 agent 决策。
- **风险与审批门**：P1 或危险指令会触发高风险/阻断路径，mitigation 只输出 dry-run。
- **可下载审计 Trace**：前端可下载 JSON trace，后端也会把 trace 存入 `traces/`。
- **无需 API Key 可展示**：确定性 planner 保证评审者在离线环境也能完整体验。

### 快速开始

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。API 默认运行在 `http://localhost:4330`。

### 常用命令

```bash
npm run dev      # 同时启动 API 和 Vite
npm run build    # 构建前端
npm run start    # 启动生产 API 并托管 dist
npm test         # 运行 agent 与数据测试
```

### API 一览

| Method | Endpoint | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 服务健康检查 |
| `GET` | `/api/incidents` | 获取内置事故列表与评分 |
| `GET` | `/api/tools` | 获取 agent 工具目录与权限 |
| `GET` | `/api/runbooks` | 获取 runbook 数据 |
| `POST` | `/api/agent/runs` | 执行一次事故响应 agent run |

### 适合展示的能力

- AI Agent 状态机和工具调用设计
- Guardrails、审批门和 dry-run 安全边界
- Runbook/RAG 风格的知识检索落地
- 事故响应产品化 UI
- 可审计 trace 与场景化测试

---

## English

### What It Is

Respondr Agent Suite is a portfolio-ready full-stack AI agent app for incident response. It shows how an agent can triage incidents, correlate signals, retrieve service runbooks, propose dry-run mitigations, and generate audit-friendly handoffs.

The default planner is deterministic and requires no API key, so reviewers can run the entire product immediately. `.env.example` includes placeholders for future OpenAI-compatible, Gemini, and DashScope integrations.

### Highlights

- **Complete full-stack shape**: React + Vite frontend, Express API backend, and Node tests.
- **Explicit agent loop**: observe -> decide -> act -> validate -> handoff.
- **Tool permission model**: `read` and `write-dry-run` tools make side effects explicit.
- **Runbook grounding**: response plans are anchored to service-specific runbooks.
- **Risk and approval gates**: P1 incidents and unsafe instructions trigger approval or blocked paths.
- **Audit traces**: every run can be downloaded from the UI and is persisted under `traces/`.
- **No key required**: deterministic mode keeps the demo reproducible and easy to evaluate.

### Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:4330`.

### Scripts

```bash
npm run dev
npm run build
npm run start
npm test
```

## Repository Topics

`ai-agent`, `incident-response`, `sre`, `runbook`, `guardrails`, `tool-calling`, `react`, `express`, `fullstack`
