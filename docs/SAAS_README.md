SaaS Migration Plan for IMS Project
=================================

Overview
--------
This document outlines the steps and initial scaffold to convert IMS into a SaaS-ready application. It focuses on repo layout, local developer experience (Docker), CI, and minimal runtime hooks to support multi-tenant behavior.

Goals
-----
- Support multi-tenancy (tenant-aware requests)
- Provide local Docker-based environment for dev and testing
- Add CI pipeline to build frontend and backend
- Prepare deployment guidance for cloud (containers + K8s)

Key design choices (initial)
----------------------------
- Tenant identification: header or subdomain. Initially we add a request filter that reads `X-Tenant-ID` (or subdomain) and exposes it via a ThreadLocal `TenantContext`.
- Authentication: centralized in backend using JWT (already implemented). Keep tokens in HttpOnly cookies; frontend uses `credentials: 'include'`.
- Data segmentation: start with a shared-schema multi-tenant approach (entities have tenant reference). Future option: schema-per-tenant or database-per-tenant.
- Billing & subscriptions: out of scope for initial commit; integrate third-party billing (Stripe) later.

What was added in this commit
-----------------------------
- Dockerfile for backend and frontend
- docker-compose.yml to run MySQL + backend + frontend locally
- GitHub Actions CI workflow to build frontend and backend images
- Minimal backend tenant context filter + helper classes (reads `X-Tenant-ID` header)
- This `docs/SAAS_README.md` with next steps and migration notes

Next steps
----------
1. Add tenant-aware data model (link entities to `Tenant` where appropriate).
2. Implement tenant provisioning API and onboarding flow.
3. Integrate billing (Stripe or other) and subscription enforcement.
4. Harden security (HTTPS, cookie settings, secrets storage).
5. Add Kubernetes manifests and a production CI/CD pipeline for deployments.

Local development
-----------------
1. Start services:

   ```bash
   docker-compose up --build
   ```

2. Backend available at `http://localhost:8200` and frontend at Vite dev server or `http://localhost:3000` via docker-compose mapping.

Notes
-----
- This is an initial scaffold. TenantContext does not change persistence behavior yet; it simply makes the tenant identifier available in request processing so you can progressively make repositories/services tenant-aware.

Contact
-------
If you want, I can proceed to implement tenant provisioning endpoints, tenant-scoped data access, and automated migrations for existing DB data.
