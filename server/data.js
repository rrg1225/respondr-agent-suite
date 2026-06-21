export const incidents = [
  {
    id: "INC-1042",
    title: "Checkout latency above SLO",
    severity: "P1",
    service: "checkout-api",
    region: "us-east-1",
    owner: "Payments Platform",
    startedAt: "2026-06-21T07:12:00.000Z",
    symptoms: [
      "p95 latency rose from 280ms to 2.9s",
      "payment authorization retries increased 6x",
      "cart conversion dropped 18%"
    ],
    customerImpact: "Enterprise checkout flows are timing out during payment authorization."
  },
  {
    id: "INC-1043",
    title: "Search index freshness lag",
    severity: "P2",
    service: "catalog-search",
    region: "eu-west-1",
    owner: "Discovery",
    startedAt: "2026-06-21T08:02:00.000Z",
    symptoms: [
      "indexing lag reached 19 minutes",
      "new product pages missing from search",
      "queue depth is growing slowly"
    ],
    customerImpact: "Recently published products are not discoverable for some EU customers."
  },
  {
    id: "INC-1044",
    title: "Internal analytics export failures",
    severity: "P3",
    service: "analytics-worker",
    region: "us-west-2",
    owner: "Data Platform",
    startedAt: "2026-06-21T08:25:00.000Z",
    symptoms: [
      "scheduled CSV exports failing",
      "retry queue is stable",
      "customer-facing APIs remain healthy"
    ],
    customerImpact: "Internal teams are waiting longer for operational reports."
  }
];

export const runbooks = [
  {
    id: "RB-001",
    service: "checkout-api",
    title: "Checkout latency triage",
    tags: ["payments", "latency", "database", "rollback"],
    steps: [
      "Confirm impact with SLO dashboard and payment authorization error rate.",
      "Compare latest deployment window against latency inflection point.",
      "Check database connection saturation and downstream provider timeout rate.",
      "Prepare rollback only after owner approval when revenue impact is confirmed."
    ],
    approvalRequiredFor: ["rollback", "traffic shift", "provider failover"]
  },
  {
    id: "RB-002",
    service: "catalog-search",
    title: "Search freshness recovery",
    tags: ["search", "queue", "indexing"],
    steps: [
      "Inspect indexer queue age and worker error logs.",
      "Restart failed workers if errors are isolated and queue age is rising.",
      "Throttle non-critical reindex jobs until freshness is below 5 minutes."
    ],
    approvalRequiredFor: ["full reindex"]
  },
  {
    id: "RB-003",
    service: "analytics-worker",
    title: "Batch export failure triage",
    tags: ["analytics", "exports", "storage"],
    steps: [
      "Check storage credentials and destination write permissions.",
      "Replay one failed export with dry-run enabled.",
      "Notify internal stakeholders with an estimated recovery window."
    ],
    approvalRequiredFor: ["bulk replay"]
  }
];

export const signals = [
  { service: "checkout-api", name: "p95 latency", value: "2.9s", baseline: "280ms", status: "critical" },
  { service: "checkout-api", name: "payment retries", value: "6x baseline", baseline: "1x", status: "critical" },
  { service: "checkout-api", name: "deploy delta", value: "started 9m before alert", baseline: "none", status: "warning" },
  { service: "catalog-search", name: "queue depth", value: "84k jobs", baseline: "30k jobs", status: "warning" },
  { service: "catalog-search", name: "worker errors", value: "3 pods crashlooping", baseline: "0", status: "warning" },
  { service: "analytics-worker", name: "export failures", value: "17 failed jobs", baseline: "0", status: "warning" },
  { service: "analytics-worker", name: "API health", value: "99.99%", baseline: "99.95%", status: "healthy" }
];

export function listIncidents() {
  return incidents.map((incident) => ({
    ...incident,
    score: scoreIncident(incident)
  }));
}

export function getIncident(id) {
  return incidents.find((incident) => incident.id === id);
}

export function findRunbook(service) {
  return runbooks.find((runbook) => runbook.service === service);
}

export function getSignals(service) {
  return signals.filter((signal) => signal.service === service);
}

export function scoreIncident(incident) {
  const severityWeight = { P1: 100, P2: 65, P3: 35 }[incident.severity] || 20;
  const symptomWeight = incident.symptoms.length * 4;
  const checkoutWeight = incident.customerImpact.toLowerCase().includes("customer") ? 8 : 0;
  return severityWeight + symptomWeight + checkoutWeight;
}
