# BUATIN x Nexus Command Center

[![Node.js](https://img.shields.io/badge/Node.js-24_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

A unified fullstack operations dashboard and personal executive command center engineered for software agencies, freelance builders, and academic schedule/billing synchronization.

---

## Core Modules

- **Financial Intelligence & Wallets**: Multi-wallet balance ledger, inter-wallet transfers, real-time cashflow analytics, automated invoice generation (with dynamic QRIS support), and standalone public invoice verification pages.
- **Client CRM & Pipeline**: Lead tracking, proposal/deal closing assistant, automatic deal-to-project conversion, and client order fulfillment tracking.
- **Academic Command Center**: Real-time ingestion from university LMS/academic portals (class schedules, attendance logs, pending discussion radar, tuition installment status, and AI-assisted forum drafting).
- **MinIO S3 Asset Hub & Auto-Compressor**: Direct object upload with automatic Sharp WebP optimization, deduplicated storage metrics, HTTP `206 Partial Content` streaming for smooth video seeking, and inline PDF/media previewing without forced downloads.
- **Infrastructure & Coolify Control**: HTTP latency health monitors, hosting/domain expiry alerts, credential vault, and remote container lifecycle control via Coolify v4 API.
- **Productivity & Automation**: Task Kanban with automated priority engine, focus timer sessions, personal habits/OKR tracking, DOCX document synthesis, Telegram bot deadline alerts, and Google Workspace sync.

---

## Architecture Overview

```text
+-------------------------------------------------------------------+
|                     React 19 + Tailwind SPA                       |
+---------------------------------+---------------------------------+
                                  | HTTP / REST (/api/*)
+---------------------------------v---------------------------------+
|                Node.js 24 Server (server.mjs)                     |
|  - Static Asset Serving (dist/)                                   |
|  - Unified API Router (server/api_router.mjs)                     |
|  - Embedded SQLite Cache (node:sqlite WAL mode)                   |
|  - Media Proxy & Byte-Range Streaming (/api/assets/raw)           |
+-----------------+---------------------------------+---------------+
                  |                                 |
      +-----------v-----------+         +-----------v-----------+
      |    PostgreSQL 16      |         |      MinIO S3 Hub     |
      |  (26-Table Sync Hub)  |         |  (Sharp WebP + Media) |
      +-----------------------+         +-----------------------+
```

### Dual-Engine Persistence Behavior
- Local SQLite (`data/nexus.db` via Node 24 native `node:sqlite`) serves fast low-latency reads and offline-first resilience.
- When `DATABASE_URL` is configured, fresh container boots automatically **hydrate from PostgreSQL** first if existing production tables are detected, preventing fresh deployments from overwriting remote data. Subsequent writes replicate cleanly across all 26 tables.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v3, Framer Motion, Lucide Icons |
| Bundler | Vite 6 |
| Backend Runtime | Node.js 24 LTS (Native ESM + `node:sqlite`) |
| Primary Database | PostgreSQL 16 (`pg` connection pool) |
| Object Storage | MinIO / S3-Compatible (`@aws-sdk/client-s3`) + `sharp` |
| Containerization | Docker multi-stage build (`node:24-bookworm-slim`) |

---

## Local Quickstart

### 1. Prerequisites
- Node.js `>= 22.13` (recommended `24 LTS`)
- npm `>= 10`

### 2. Installation & Configuration

```bash
git clone https://github.com/daerobi-devs/nexus-dashboard.git
cd nexus-dashboard
npm install
cp .env.example .env
```

Edit `.env` with your PostgreSQL and MinIO S3 credentials before starting.

### 3. Run Locally

```bash
# Development mode with Vite HMR
npm run dev

# Production build & native Node server
npm run build
npm start

# Run database integrity test suite
npm test
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP listen port (`3000` in Docker, `5173` recommended for local dev) |
| `DATABASE_URL` | Recommended | - | PostgreSQL connection URI for multi-table cloud persistence |
| `PG_ADMIN_URL` | No | - | Optional Postgres maintenance DB URI to auto-create target DB |
| `S3_ENDPOINT` | Recommended | `http://127.0.0.1:9000` | MinIO / S3 endpoint reachable from the server container |
| `S3_PUBLIC_URL` | No | Same as `S3_ENDPOINT` | Base object URL stored in metadata |
| `S3_CONSOLE_URL` | No | - | Optional web link to your MinIO Console |
| `S3_REGION` | No | `us-east-1` | S3 signing region |
| `S3_ACCESS_KEY` | For Uploads | - | S3 access key ID |
| `S3_SECRET_KEY` | For Uploads | - | S3 secret access key |
| `S3_BUCKET` | No | `nexus-assets` | Target bucket name (auto-created with public-read policy if missing) |
| `BUATIN_BUSINESS_EMAIL` | No | `hello@example.com` | Contact email displayed on generated invoices |
| `CLOUDBEAVER_URL` | No | - | Optional quick link to CloudBeaver database UI |
| `COOLIFY_BASE_URL` | No | - | Optional Coolify v4 API URL for container control |
| `COOLIFY_TOKEN` | No | - | Optional Coolify Bearer API token |

---

## Docker & Coolify Deployment

### Docker Compose

```bash
docker compose up -d --build
```

By default `docker-compose.yml` exposes container port `3000` to host port `5173` (overridable via `HOST_PORT`) and mounts `./data:/app/data`.

### Deploying on Coolify v4

1. **Build Pack**: Select **Dockerfile** (uses root `Dockerfile`, multi-stage `node:24-bookworm-slim`).
2. **Ports Exposes**: Set `3000` (matches `EXPOSE 3000` and `ENV PORT=3000`).
3. **Domain Routing**:
   - If using Cloudflare Tunnel / Zero Trust proxy termination, configure the Coolify domain with `http://` prefix (e.g., `http://your-subdomain.example.com`) to match HTTP origin routing cleanly without SSL redirect loops.
4. **Environment Variables**: Add `PORT=3000`, `DATABASE_URL`, and `S3_*` credentials in Coolify's Environment Variables tab.
5. **Persistent Storage** (Optional): Mount a persistent volume to `/app/data` alongside your PostgreSQL `DATABASE_URL`.
6. **Healthcheck**: Coolify automatically monitors `GET /api/health` configured inside `Dockerfile`.

---

## License

Proprietary software by **daerobi-devs**. All rights reserved.
