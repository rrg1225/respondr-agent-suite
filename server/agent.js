import { findRunbook, getIncident, getSignals, scoreIncident } from "./data.js";

export const toolCatalog = [
  {
    name: "incident.fetch",
    permission: "read",
    description: "Load incident context by id, including severity, service, symptoms, and impact."
  },
  {
    name: "signals.correlate",
    permission: "read",
    description: "Correlate incident service with operational signals and likely contributing factors."
  },
  {
    name: "runbook.retrieve",
    permission: "read",
    description: "Retrieve the most relevant service runbook and approval constraints."
  },
  {
    name: "handoff.draft",
    permission: "write-dry-run",
    description: "Draft a human-readable incident handoff without paging or mutating external systems."
  },
  {
    name: "action.propose",
    permission: "write-dry-run",
    description: "Propose reversible mitigation actions and mark approval gates."
  }
];

export function runIncidentAgent(input = {}, options = {}) {
  const startedAt = new Date().toISOString();
  const runId = `run-${startedAt.replace(/[:.]/g, "-")}`;
  const maxSteps = clamp(Number(options.maxSteps || input.maxSteps || 6), 3, 10);
  const trace = [];
  const incident = getIncident(input.incidentId);

  trace.push(event(1, "observe", { input, maxSteps }));

  if (!incident) {
    return {
      runId,
      status: "failed",
      startedAt,
      trace,
      final: {
        summary: "Incident id was not found. The agent stopped before tool execution.",
        reason: "unknown_incident"
      }
    };
  }

  const risk = classifyRisk(input, incident);
  trace.push(event(2, "decide", { tool: "incident.fetch", reason: "Need source incident context before planning." }));
  trace.push(event(2, "act", { tool: "incident.fetch", output: incident }));

  if (risk.level === "blocked") {
    trace.push(event(3, "validate", { guardrail: "blocked", reason: risk.reason }));
    return {
      runId,
      status: "blocked",
      startedAt,
      incident,
      risk,
      trace,
      final: {
        summary: "Request was blocked because it attempted an unsafe incident response action.",
        reason: risk.reason
      }
    };
  }

  const serviceSignals = getSignals(incident.service);
  trace.push(event(3, "decide", { tool: "signals.correlate", reason: "Correlate service telemetry with user-visible symptoms." }));
  trace.push(event(3, "act", { tool: "signals.correlate", output: serviceSignals }));

  const runbook = findRunbook(incident.service);
  trace.push(event(4, "decide", { tool: "runbook.retrieve", reason: "Ground response steps in the service runbook." }));
  trace.push(event(4, "act", { tool: "runbook.retrieve", output: runbook }));

  const triage = buildTriage(incident, serviceSignals, runbook);
  trace.push(event(5, "validate", { score: triage.score, confidence: triage.confidence, approvalRequired: triage.approvalRequired }));

  const handoff = buildHandoff(incident, triage, runbook);
  trace.push(event(6, "act", { tool: "handoff.draft", output: handoff }));

  if (maxSteps > 6) {
    trace.push(event(7, "act", { tool: "action.propose", output: triage.actions }));
  }

  return {
    runId,
    status: triage.escalate ? "needs-approval" : "completed",
    startedAt,
    incident,
    risk,
    triage,
    handoff,
    trace,
    final: {
      summary: triage.escalate
        ? "Triage completed. Human approval is required before mitigation."
        : "Triage completed with dry-run recommendations.",
      reason: triage.escalate ? "approval_gate" : "dry_run_complete"
    }
  };
}

function severityPolicy(severity) {
  const policies = {
    P1: { responseSlaMinutes: 5, reviewCadenceMinutes: 15, escalation: "incident-commander" },
    P2: { responseSlaMinutes: 15, reviewCadenceMinutes: 30, escalation: "service-owner" },
    P3: { responseSlaMinutes: 60, reviewCadenceMinutes: 120, escalation: "team-backlog" }
  };
  return policies[severity] || policies.P3;
}

function classifyRisk(input, incident) {
  const text = `${input.operatorGoal || ""} ${input.notes || ""}`.toLowerCase();
  const blockedTerms = ["delete", "drop database", "disable audit", "ignore approval", "bypass approval", "page everyone"];
  const blocked = blockedTerms.find((term) => text.includes(term));

  if (blocked) {
    return {
      level: "blocked",
      reason: `Unsafe instruction detected: ${blocked}`,
      requiresApproval: true
    };
  }

  if (incident.severity === "P1") {
    return {
      level: "high",
      reason: "P1 incident with customer or revenue impact.",
      requiresApproval: true
    };
  }

  if (incident.severity === "P2") {
    return {
      level: "medium",
      reason: "Service degradation requires owner review before disruptive actions.",
      requiresApproval: false
    };
  }

  return {
    level: "low",
    reason: "Low severity incident; dry-run recommendations are sufficient.",
    requiresApproval: false
  };
}

function buildTriage(incident, serviceSignals, runbook) {
  const criticalSignals = serviceSignals.filter((signal) => signal.status === "critical");
  const warningSignals = serviceSignals.filter((signal) => signal.status === "warning");
  const score = scoreIncident(incident);
  const approvalRequired = incident.severity === "P1" || Boolean(runbook?.approvalRequiredFor?.length);
  const rootCauseHypothesis = criticalSignals.length
    ? `${criticalSignals.map((signal) => signal.name).join(" and ")} are outside baseline.`
    : `${warningSignals.map((signal) => signal.name).join(" and ")} need validation.`;

  return {
    score,
    responsePolicy: severityPolicy(incident.severity),
    confidence: criticalSignals.length ? "high" : "medium",
    escalate: incident.severity === "P1",
    approvalRequired,
    rootCauseHypothesis,
    blastRadius: `${incident.service} in ${incident.region}; owner ${incident.owner}.`,
    actions: [
      {
        title: "Freeze non-essential deploys",
        type: "safe",
        approval: false,
        command: "dry-run: change window freeze"
      },
      {
        title: "Validate latest deploy against alert timeline",
        type: "investigate",
        approval: false,
        command: "dry-run: compare deploy metadata"
      },
      {
        title: runbook?.approvalRequiredFor?.[0] ? `Prepare ${runbook.approvalRequiredFor[0]}` : "Prepare mitigation",
        type: "mitigate",
        approval: approvalRequired,
        command: "dry-run: approval packet only"
      }
    ]
  };
}

function buildHandoff(incident, triage, runbook) {
  return {
    title: `${incident.id} ${incident.title}`,
    audience: incident.owner,
    severity: incident.severity,
    summary: `${incident.customerImpact} Current hypothesis: ${triage.rootCauseHypothesis}`,
    responseSlaMinutes: triage.responsePolicy.responseSlaMinutes,
    escalation: triage.responsePolicy.escalation,
    runbook: runbook?.title || "No matching runbook",
    nextSteps: runbook?.steps || ["Assign service owner", "Collect logs", "Reassess severity"],
    approvalNote: triage.approvalRequired
      ? "Mitigation is prepared as dry-run only. Human approval is required before external changes."
      : "No disruptive action is proposed; recommendations remain dry-run."
  };
}

function event(step, phase, payload) {
  return {
    step,
    phase,
    at: new Date().toISOString(),
    ...payload
  };
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
