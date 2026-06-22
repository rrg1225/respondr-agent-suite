# Portfolio Brief: Respondr Agent Suite

## Resume Bullets

- Built a full-stack AI incident response agent with runbook retrieval, typed tool contracts, risk scoring, approval gates, dry-run mitigations, and audit trace persistence.
- Modeled realistic SRE workflows across incident intake, telemetry correlation, runbook grounding, mitigation planning, and stakeholder handoff.
- Added deterministic incident logic for scored incidents, grounded triage, unsafe instruction blocking, and unknown incident handling.

## What This Proves

- Agent engineering for high-stakes operational workflows.
- RAG-style grounding through runbook retrieval without requiring a live vector database.
- Product-quality UI for incident triage, trace review, and handoff generation.

## Verification

```bash
npm ci
npm run build
```

## Interview Talking Points

- Why incident response agents need approval gates and dry-run defaults.
- How tool permissions reduce accidental side effects.
- How deterministic mode makes agent demos CI-friendly and reviewable.
