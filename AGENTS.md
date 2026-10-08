# AGENTS.md - MStudio Channel

## Mission
Build MStudio Channel according to PLAN.md. Optimize for correctness, provenance, maintainability, accessibility and Cloudflare Free-tier efficiency.

## Required reading
Before coding: PLAN.md, current YAML task, relevant docs/ADR and existing contracts. Load all skills listed in `backlog.yaml -> task_skills[<TASK-ID>]` via the skill tool before starting work.

## Authority
PLAN.md defines product/architecture constraints. Task YAML defines current scope. Human reviewer has final authority.

## Never
- Never commit secrets.
- Never merge main.
- Never silently change architecture, domain semantics or editorial/risk policy.
- Never invent source evidence, source counts or verification status.
- Never bypass human-review gates for risky content.
- Never add paid infrastructure/service without explicit approval.
- Never perform unrelated large refactors inside a feature task.
- Never modify another agent's active path scope.

## Scope discipline
Only edit task.paths. If another path becomes necessary, stop and report required scope expansion.

## Branches
- feat/MST-xxx-opencode
- feat/MST-xxx-commandcode
- feat/MST-xxx-jules
- fix/MST-xxx-<owner>

One task = one primary owner = one branch/PR.

## Ownership
### OpenCode
Web/Studio UI, components, responsive, accessibility and SEO rendering.

### Command Code
Workers, queues, D1/repositories/migrations, auth, observability and AI backend contracts.

### Jules
Isolated tests, docs, fixes and refactors after contracts stabilize.

### Human Lead
Architecture gates, schema/migration approval, secrets, editorial/risk policy and final merge.

## Coordination
Before editing, check dependencies and path conflicts. Parallel work is allowed only for non-overlapping paths/contracts. Consumer integration starts after the shared contract is merged or explicitly frozen.

## Contracts first
Shared messages/API/domain payloads live in packages/contracts. Do not duplicate conflicting TypeScript types.

## Database
Use repository layer and migrations. Avoid hot-path full scans. Select required columns. Index demonstrated access patterns while considering write overhead.

## Cloudflare Free tier
Free-tier budget is a functional requirement. Prefer cache/static output, compact queue messages, batched background work, indexed D1 access, limited R2 variants and selective embeddings. Expensive/reprocessing features require a kill switch or QuotaGuard.

## Next.js
App Router-first. Prefer Server Components for content surfaces. Isolate Client Components. Never put crawler/model processing in reader request path.

## UI
Follow shared tokens and PLAN.md UX spec. Mobile article is reading-first, not compressed desktop. Cover keyboard, focus, contrast and reduced-motion behavior.

## AI / editorial
Generate from evidence bundles and preserve lineage. Agent output must be structured/versioned. Unsupported claims are flagged, never silently promoted to fact.

## Testing
Run relevant typecheck, lint and tests. Background jobs require idempotency/error-path tests. UI covers loading, empty and error states.

## Coordination rules
1. Single-writer rule: one path/module has one active owner.
2. Contract-freeze rule: consumer integration waits for contract merge/freeze.
3. Schema lock: one migration owner at a time.
4. Human review required for schemas, editorial policy and release.
5. Never force-push another agent's branch.
6. Never broaden task scope silently.

## PR requirements
Every PR includes:
- Task ID
- Objective
- Changed paths
- Acceptance evidence
- Tests executed
- Cloudflare quota impact
- Known risks
- Follow-ups

## Handoff
```yaml
status: done|blocked|partial
changed_paths: []
tests_run: []
contracts_changed: []
migrations: []
quota_impact: none|low|medium|high
risks: []
follow_ups: []
```

## Conflict priority
Security/editorial safety > PLAN architecture > shared contracts > current task acceptance > implementation preference.

## Done means
Acceptance passes; tests/lint/typecheck pass; docs/contracts updated; no secrets; error handling/observability included; no unrelated diff; handoff reports changes, tests, risks and follow-ups.
