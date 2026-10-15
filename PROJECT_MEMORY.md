# Universal PLM Platform — Project Memory

> **System Vision**: Build one universal Product Lifecycle Management (PLM) platform on Zoho Catalyst serving BOM users across 40+ industries, competing with Odoo PLM and established enterprise PLM platforms.
> **Core Principle**: Separate universal engineering data (Parts, BOMs, Revisions, Changes, Documents) from configurable business rules and specialized industry capability extensions. Avoid building 40 separate applications or one giant monolithic schema.

---

## 1. Executive Summary & Product Vision

### The Core Pillars
* **Universal Engineering Core**: Parts, BOMs, revisions, documents, and change control.
* **Configurable Workflows**: Approvals, release policies, effectivity, numbering, and validation rules.
* **Industry Capabilities**: Manufacturing, electronics, process/formulation, regulated/medical, and project structures.
* **Integration Ecosystem**: CAD, ERP, MRP, inventory, suppliers, and external APIs.

Customers configure part types, revision schemes, BOM structures, approval processes, custom fields, document requirements, and integrations declaratively without modifying underlying application code.

---

## 2. Platform Architecture & Layered Model

```
+-----------------------------------------------------------------------+
| 1. Experience Layer (React + TS, Workspaces, BOM Tree, Admin Console) |
+-----------------------------------------------------------------------+
| 2. Identity & API Gateway (Tenant Resolution, Auth, Versioned APIs)   |
+-----------------------------------------------------------------------+
| 3. Universal Engineering Core (Part Master, BOMs, Revisions, Changes) |
+-----------------------------------------------------------------------+
| 4. Configuration Engine (Custom Fields, Workflows, Numbering, Rules)  |
+-----------------------------------------------------------------------+
| 5. Industry Capability Extensions (Electronics, MBOM, Process, etc.)   |
+-----------------------------------------------------------------------+
| 6. Data & Execution Platform (ZCQL Datastore, Stratus, Jobs, Outbox)  |
+-----------------------------------------------------------------------+
| 7. Enterprise Operations (Security, Audit, Monitoring, Entitlements)  |
+-----------------------------------------------------------------------+
```

### The Seven Platform Layers
1. **Experience**: Web UI, engineering workspaces, interactive BOM tree/graph, dashboards, search, and admin consoles.
2. **Identity and API**: Multi-tenant resolution, server-side authorization, rate limiting, and versioned REST/GraphQL APIs.
3. **Engineering Core**: Part master, classifications, EBOM/MBOM, revisions, lifecycle states, and release invariants.
4. **Configuration Engine**: Metadata-driven field definitions, dynamic forms, workflow designer, approval rules, and numbering schemes.
5. **Industry Extensions**: Capability registry for discrete manufacturing, electronics/PCB, process formulations, regulated medical/aerospace compliance.
6. **Data and Execution**: Catalyst Data Store + ZCQL, Stratus object storage, background compute/workers (Functions/AppSail), transactional outbox.
7. **Enterprise Operations**: Audit trail, security boundaries, backup/recovery, usage metering, subscription entitlements, and tenant administration.

---

## 3. Complete Module Ecosystem

### A. Universal Engineering Core
* Product & Part Master
* Product Families & Variants
* EBOM (Engineering Bill of Materials) Management
* MBOM (Manufacturing Bill of Materials) Management
* Multilevel BOM Explosion & Traversal (Cycle-safe)
* Where-Used Analysis
* Revision & Version Control (SemVer, Alpha, Numeric)
* Engineering Change Requests (ECR)
* Engineering Change Orders (ECO)
* Approval Management & Voting Matrix
* Lifecycle State Engine (Draft, In Review, Approved, Released, Obsolete)
* Effectivity Management (Date, Unit/Serial, Lot)
* BOM Redlining & Comparison Engine (Diff viewer)
* Product Configuration & Options
* Alternate & Substitute Components
* Supersession & Obsolescence Workflows

### B. Documents and Engineering Collaboration
* Document Management & Controlled Vault
* File Revision History & Check-In / Check-Out
* CAD File References & Metadata Extraction
* Drawing & Specification Control
* Markup & Visual Redlining
* Document-to-Part / Document-to-BOM Relationships
* Controlled & Expiring File Sharing Links
* Engineering Comments & Mentions
* Task Assignment & Real-Time Notifications
* Discussion Threads per Revision/ECO
* Digital Signatures & Audit Attestation

### C. Manufacturing and Supply Chain
* EBOM-to-MBOM Transformation Engine
* Manufacturing Routings & Operations
* Work Centers & Resource Allocation
* Supplier & Manufacturer Management
* Approved Manufacturer Lists (AML)
* Approved Vendor Lists (AVL)
* Procurement Impact & Inventory Exposure Analysis
* Multi-Level Cost Rollups
* Sourcing Lead Time Analysis
* Work Instructions & Shop Floor View
* ERP / MRP Bi-directional Synchronization

### D. Quality, Compliance and Traceability
* Requirements Management & Decomposition
* Requirements-to-Part Traceability Matrix
* Risk Assessments (FMEA / Risk Matrix)
* Incoming & In-Process Inspection Records
* Nonconformance Reports (NCR) Management
* Deviation & Waiver Control
* Corrective and Preventive Actions (CAPA) References
* Material & Lot Traceability
* Regulatory Compliance Evidence (RoHS, REACH, FDA, AS9100)
* Audit Trail Explorer & Reports
* Record Retention & Legal Hold Policies
* Electronic Approval Evidence (21 CFR Part 11 ready)

### E. Platform Configuration and Automation
* Dynamic Custom Fields & Form Designer
* Custom Objects & Relational Extension
* Visual Workflow Designer
* Conditional Approval Rule Builder
* Configurable Auto-Numbering Schemes
* Custom Lifecycle States & Transitions
* Conditional Validation Engine (JSON Schema + Logic Rules)
* Role-, Record-, and Field-Level Security (RLS / FLS)
* Notification Templates (Email, Webhook, In-App)
* Scheduled Cron Automation
* Webhook Subscriptions with Signing Secrets
* Multi-Tenant White-Labeling & Branding

### F. Enterprise Management & SaaS Operations
* Executive Engineering Dashboards
* Engineering Performance Metrics & KPI Tracking
* Change Cycle Time Analytics
* Revision History & Lineage Reports
* Supplier Risk & Concentration Reports
* High-Performance Bulk Import & Export (CSV, Excel, STEP, IPC-2581)
* Multi-Tenant Provisioning & Tenant Administration
* Subscription Tiering, Limits & Entitlements
* API Developer Portal & Interactive Documentation
* Integration Gateway Health & Job Monitoring
* Immutable Audit Explorer
* Backup & Disaster Recovery Controls

---

## 4. Industry Capability Architecture

To serve 40+ industries without codebase divergence, use a **Capability Registry**:
* **Capability ID & Version**: e.g., `electronics.components@1.0.0`, `process.formulation@1.0.0`.
* **Declarative Schemas**: Extends part/BOM schemas with validated custom attributes without arbitrary customer code execution.
* **Pre-packaged Industry Templates**:
  * *Discrete / Automotive*: Serial/lot effectivity, supplier part tracking, PPAP/quality gates, MBOM routings.
  * *Electronics / PCB*: Component manufacturer part numbers (MPN), footprint, alternate AVL/AML, reference designators.
  * *Process / Chemical*: Recipes, batch sizing, formulations, unit of measure conversions, yield calculations, allergen/hazard attributes.
  * *Regulated / Medical / Aero*: Strict 21 CFR Part 11 electronic records, DHF/DMR links, risk management, traceability.
  * *Configured / Industrial Machinery*: Options, rules, modular assemblies, variance control.

---

## 5. Universal Data Model & Non-Negotiable Invariants

### Primary Entity Hierarchy
* **TENANT** `1 -> N` **MEMBERSHIP**
* **TENANT** `1 -> N` **PART**
* **PART** `1 -> N` **PART_REVISION**
* **PART_REVISION** `1 -> N` **BOM_LINE** (Points to Child Part Revision or dynamic policy)
* **PART_REVISION** `M <-> N` **DOCUMENT_VERSION** (via DOCUMENT_LINK)
* **CHANGE_ORDER (ECO)** `1 -> N` **CHANGE_ITEM**
* **CHANGE_ORDER** `1 -> N` **APPROVAL**
* **CHANGE_ORDER** `1 -> N` **IMPACT_RESULT**
* **TENANT** `1 -> N` **CAPABILITY_CONFIG**
* **TENANT** `1 -> N` **AUDIT_EVENT**
* **TENANT** `1 -> N` **INTEGRATION_JOB**

### Non-Negotiable Data Invariants
1. **Tenant Isolation**: Every query and write must be tenant-scoped and server-authorized.
2. **Revision Immutability**: Released revisions and approved evidence are read-only and immutable.
3. **BOM Determinism**: Every BOM line resolves to a valid component revision or explicit effectivity policy.
4. **Release Integrity**: Releases cannot be executed as disparate client-side calls. They execute via atomic backend commands.
5. **Concurrency Control**: Stale baseline detection (optimistic concurrency / revision locks) before release.
6. **Cycle Detection**: Recursive BOM explosions must prevent self-reference and cycle traps with bounded depth.
7. **Traceability**: All state transitions record actor, timestamp, rule version, and baseline snapshot.
8. **Decoupled File Security**: Metadata and physical binary blobs (Stratus) are secured and checked independently.

---

## 6. Implementation Codebase Structure

```
universal-plm/
├── apps/
│   ├── web/                      # React + TypeScript engineering workspace
│   ├── api/                      # Fastify / Express API Gateway & routing
│   └── admin/                    # Platform & Tenant management portal
├── packages/
│   ├── domain-core/              # Parts, Revisions, BOMs, Invariants
│   ├── change-management/        # ECR, ECO, Approvals, Concurrency
│   ├── document-control/         # Metadata, Versions, Relationships
│   ├── manufacturing/            # EBOM-to-MBOM, Routings, Work Centers
│   ├── configuration-engine/     # Dynamic fields, Forms, Rules, Schemas
│   ├── industry-capabilities/    # Capability registry & industry packs
│   ├── authorization/            # Multi-tenant context & RBAC/FLS policies
│   ├── integration-sdk/          # Webhooks, Connectors, ERP Sync, Outbox
│   ├── job-processing/           # Asynchronous task workers, Retries
│   └── ui-components/            # Design system, BOM Tree, Diff viewer
├── catalyst/
│   ├── functions/                # Short, bounded event/API functions
│   ├── app-sail/                 # Core domain API service & workers
│   ├── datastore/                # ZCQL schema definitions & seed data
│   ├── stratus/                  # Object storage configuration
│   └── schedules/                # Cron jobs (maintenance, reconciliation)
├── migrations/                   # Forward/backward compatible database migrations
├── tests/                        # Comprehensive test suites
│   ├── unit/
│   ├── integration/
│   └── fixtures/                 # Synthetic industry BOM test fixtures
├── infrastructure/               # Deployment scripts & CI/CD
└── docs/                         # Architecture, API specifications, User guides
```

---

## 7. Phased Roadmap Milestones

* **Phase 0 (Weeks 1–4)**: Architecture, technical foundation, tenant isolation, ZCQL schema, CI/CD.
* **Phase 1 (Weeks 5–10)**: Universal Engineering Core (Part Master, EBOM, Revisions, Where-Used, BOM Comparison).
* **Phase 2 (Weeks 11–16)**: Change & Document Control (ECR/ECO, Approvals, File Vault, Audit Trail, Release Engine).
* **Phase 3 (Weeks 17–24)**: Platform Configurability (Custom Fields, Workflow Engine, Layouts, Import/Export).
* **Phase 4 (Months 7–9)**: Cross-Domain Capabilities (MBOM, Sourcing, AML/AVL, Quality Links, Integrations).
* **Phase 5 (Months 9–12)**: Industry Capability Framework (Packaging discrete, electronics, process, regulated modules).
* **Phase 6 (Months 12–18+)**: Enterprise Maturity & Commercial Scale (CAD Connectors, Enterprise scale, Certifications).

---

## 8. Governance & Update Process

* **Primary Document**: `PROJECT_MEMORY.md` (this file) reflects the architecture and state of the platform.
* **Updates & Evolution Log**: Recorded sequentially in [PLAN_CHANGES.md](file:///c:/Users/naren/OneDrive/Desktop/PLM/PLAN_CHANGES.md).
* **Execution Tracking**: Managed granularly in [FUNCTIONALITY_CHECKLIST.md](file:///c:/Users/naren/OneDrive/Desktop/PLM/FUNCTIONALITY_CHECKLIST.md).
