# Universal PLM Platform

> **One Platform · 40+ Industries · Configurable Engineering Workflows**

A universal, cloud-native Product Lifecycle Management (PLM) platform built on **Zoho Catalyst** (Frontend on **Catalyst Slate**, Backend on **Catalyst AppSail**). Designed to deliver enterprise-grade Bill of Materials (BOM), revision control, and engineering change management competing with Odoo PLM and established enterprise systems.

---

## 🎯 Architectural Philosophy

Rather than building 40 separate applications or cramming 40 industries' requirements into one bloated schema, the platform separates:
1. **Universal Engineering Core**: Immutable parts, revisions, EBOM/MBOM, where-used traversal, change orders (ECO/ECR), and lifecycle states.
2. **Metadata-Driven Configuration Engine**: Declarative custom fields, dynamic forms, visual workflows, and approval policies.
3. **Industry Capability Framework**: Modular capability packs (Electronics & PCB, Discrete & Automotive, Process & Formulation, Regulated & Medical, Configured Products).
4. **Integration Ecosystem**: Bi-directional adapters for CAD, ERP/MRP, inventory, and supplier networks.

---

## 🏗️ Platform Stack

* **Frontend**: React 18/19 + TypeScript (Vite, TanStack Table, React Flow, Zustand) deployed to **Catalyst Slate**.
* **Backend**: Node.js + TypeScript (Fastify / NestJS) deployed to **Catalyst AppSail**.
* **Database & Storage**: Catalyst Data Store (ZCQL) + Catalyst Stratus (Document Vault).
* **Execution & Compute**: Catalyst Functions + AppSail background workers + transactional outbox.

---

## 📂 Project Navigation & Governance

* 📖 **[PROJECT_MEMORY.md](file:///c:/Users/naren/OneDrive/Desktop/PLM/PROJECT_MEMORY.md)**: Master product plan, 7-layer architecture, invariants, domain boundaries, and roadmap.
* 📝 **[PLAN_CHANGES.md](file:///c:/Users/naren/OneDrive/Desktop/PLM/PLAN_CHANGES.md)**: Sequential change log recording every architectural update, pivot, or requirement change.
* ✅ **[FUNCTIONALITY_CHECKLIST.md](file:///c:/Users/naren/OneDrive/Desktop/PLM/FUNCTIONALITY_CHECKLIST.md)**: Interactive 106-item checklist tracking implementation progress across all 6 modules, testing suites, and launch gates.

---

## 📋 The 6 Functional Domains

1. **Module A — Universal Engineering Core**: Part Master, EBOM, MBOM, Multilevel Explosion, Revisions, ECO/ECR, Approvals, Effectivity.
2. **Module B — Documents & Collaboration**: CAD references, file vault, visual markups, check-in/out, digital signatures.
3. **Module C — Manufacturing & Supply Chain**: EBOM-to-MBOM transformation, routings, AML/AVL, cost rollups, ERP synchronization.
4. **Module D — Quality, Compliance & Traceability**: Requirements matrix, FMEA risk assessments, NCR, CAPA, 21 CFR Part 11 audit trails.
5. **Module E — Platform Configuration & Automation**: Dynamic fields, visual workflow designer, approval rules, auto-numbering, webhooks.
6. **Module F — Enterprise Management & SaaS Ops**: Executive dashboards, change cycle metrics, tenant provisioning, audit explorer.

---

## 🚀 Repository & Workflow

This repository strictly synchronizes every change to GitHub:
* **Remote Repository**: [https://github.com/Narendhiran17/PLM.git](https://github.com/Narendhiran17/PLM.git)
* **Branch**: `main`
* **Commit Standard**: Semantic commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
