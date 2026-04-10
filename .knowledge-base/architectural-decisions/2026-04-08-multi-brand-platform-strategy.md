# Multi-Brand Platform Strategy (Central Admin)

**Date:** 2026-04-08  
**Status:** Accepted  
**Related task:** [.knowledge-base/tasks/malls-v1.md](../tasks/malls-v1.md)

---

## Context

The product line may grow beyond a single venue brand (e.g. Malts at `malts-ruse.com`). A future requirement is a **central administration** capability to manage multiple brands—categories, products, and feature toggles (ordering, waiter call)—possibly with a UI similar to the per-brand admin.

Two coarse architectural patterns exist:

- **Approach A — Siloed stacks:** Each brand runs its own deployment (and typically its own database). A separate “central admin” application integrates with each deployment via **HTTP APIs** and manages credentials/URLs per tenant.
- **Approach B — Unified platform:** One application and one logical database; every tenant-owned row is scoped by **`brand_id`**. Super-admin users can switch context; all queries and mutations enforce brand scoping on the server.

**Malts v1** must ship on schedule without building the full central-admin product, but should **not** paint the team into a corner.

---

## Decision

### 1) Malts v1 (immediate)

- Operate as a **single active brand** (Malts) on a dedicated domain and new database.
- Introduce a first-class **`Brand` model** (table `brands`) and a **`brandId` foreign key** on tenant-owned entities (e.g. categories, products, tables, orders, settings scoped to a venue) from the **initial** Prisma schema, with seed data containing **exactly one** row for Malts.
- Resolve “current brand” in v1 via configuration (env / single seed / host mapping); avoid hard-coding Luna or bar-specific assumptions in shared modules.

This satisfies “do it the right way” for evolution: adding a second brand later is primarily **data + auth + routing**, not a schema rewrite.

### 2) Central admin and multi-brand operations (after v1)

- **Default strategic direction:** **Approach B (unified platform)** — extend the existing Next.js app with **super-admin** roles and strict **`brandId` scoping** on every relevant query and mutation, plus automated tests for isolation bugs (“blind cross-brand” failures must be impossible).
- **Approach A (siloed stacks + central admin over API)** remains a **documented alternative** to adopt only when clear triggers apply (see below).

### 3) API shape (non-negotiable for maintainability)

- Implement admin and public behaviors behind **server-side route handlers / service layer** with explicit inputs; **do not** scatter brand logic only in React components.
- A future central-admin shell (whether inside the same app or a separate SPA) should **reuse the same server contracts**, not duplicate business rules.

---

## Alternatives Considered

### Approach A — Separate deployment + API per brand

**Pros**

- Strong blast-radius isolation (outage or bad deploy for one brand does not automatically take down others).
- Easier to offer **different release versions** per contract.
- Data residency / contractual isolation can be literal (separate DB, separate region).

**Cons**

- Operational cost scales with **N**: secrets, monitoring, CI, runbooks, Pusher keys, domains, backups.
- Central admin must orchestrate **N base URLs**, auth modes, and version skew; integration tests multiply.
- Product improvements must be **rolled out N times** unless additional tooling is built.

### Approach B — Unified platform with `brand_id`

**Pros**

- Single deploy pipeline; one place for fixes and features.
- Natural fit for “same UI, switch brand” super-admin.
- Easier **referential consistency** and reporting across brands if ever needed.

**Cons**

- A defect in middleware or a missing `where: { brandId }` can **leak data across tenants** — mitigated by conventions, code review, RLS (optional), and tests.
- All brands share the same **release cadence** unless feature flags or branching strategies are introduced.

---

## Consequences

### Positive

- v1 ships with a **clear tenant boundary** in the data model without building multi-brand UX yet.
- The team has a **written default** for Phase 2 (unified platform), reducing bikeshedding later.
- Central admin can start as **super-role routes** in the same repo, avoiding a second codebase until there is a compelling reason.

### Negative / mitigation

- **Slightly more complex schema v1:** every tenant table carries `brandId` — acceptable cost vs migration pain later.
- **Isolation under Approach B** is a security-sensitive invariant — require **checklist + tests** for new endpoints (see Security Notes).

### Risks

| Risk | Mitigation |
|------|------------|
| Cross-brand data leak | Mandatory `brandId` on queries; integration tests; consider PostgreSQL RLS later |
| Regret choosing B under strict isolation rules | ADR supersession: migrate specific brand to siloed stack when triggers fire |
| Regret choosing A too early | Higher ops cost; only choose A when triggers are explicit |

### When to supersede this ADR in favor of Approach A (or hybrid)

- Hard **legal/data-residency** separation between brands, or
- **Independent release contracts** (different SLAs, different versions in production), or
- Strong evidence that **blast-radius** of a single codebase is unacceptable for the business.

A **hybrid** (unified admin UI, separate DB per brand) is possible but highest complexity — only after explicit cost/benefit analysis.

---

## Security Notes

- **Super-admin** must use strong authentication; **audit logging** for feature toggles and brand-scoped destructive actions is recommended before scaling past one brand.
- Public ordering and waiter-call endpoints must apply **rate limiting** and **server-enforced feature flags** (not UI-only).

---

## Implementation Notes (for @virtual-doer)

1. Add `Brand` + `brandId` in the initial Malts migration; seed one brand.
2. Centralize “current brand resolution” in one module (env + future host map).
3. When adding super-admin: never trust client-supplied `brandId` alone — verify role + allowed brands server-side.
4. Link new endpoints in PRs back to this ADR or to `malls-v1` acceptance criteria.

---

## Review

| Role | Outcome |
|------|---------|
| PM | Accepted; aligns Phase 2 with documented default |
| Skeptic | v1 avoids premature N-deploy complexity |
| Security | Server-side `brandId` enforcement + audit path recorded |
| Performance | Single DB + indexed `brandId` is acceptable at expected scale |

---

**Supersedes:** N/A  
**Superseded by:** Update this file if Approach A is chosen for the whole fleet or for a subset of brands.
