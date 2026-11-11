# Nexus Desktop Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 100% local-first Nexus Desktop Command Center in `d:\nexus dahaboard` backed by Node.js v24 native `node:sqlite` (`data/nexus.db`) and a Vertix-inspired Bento Grid UI with `/taste-skill` polish.

**Architecture:** Single-process Vite + React 19 application where a custom Vite server plugin exposes `/api/*` REST endpoints backed directly by `node:sqlite` storing data in `data/nexus.db`. The frontend implements a collapsible left sidebar, Dark Obsidian / Clean Light theme toggle, Vertix 3-column + 2-column Bento Overview, Kanban Task/Project board, Maintenance Tracker, and Cashflow Ledger with automatic wallet balance synchronization.

**Tech Stack:** Node.js v24 (`node:sqlite`), React 19, TypeScript, Vite, Tailwind CSS v3, Framer Motion, Lucide React.

**Spec:** `docs/superpowers/specs/2026-11-10-nexus-command-center-design.md`

## Global Constraints

- Database path must be `d:\nexus dahaboard\data\nexus.db` using Node v24 native `node:sqlite` (zero native C++ compilation dependencies).
- Zero Unicode emojis anywhere in source code, UI labels, or seed data; use `lucide-react` icons exclusively.
- Left Sidebar navigation is mandatory (collapsible between full width and compact icon rail); no stacked horizontal navigation tabs at the top.
- No pulsing green dots (`animate-ping`); use clean solid/outline status badges.
- All currency values formatted in Indonesian Rupiah (`Rp`) with realistic Indonesian context (UNPAM Semester 5 courses, `daerobi-devs` client projects, BCA/Bank Jago/Kas wallets).

## Review Focus

1. Empty or invalid numeric amount on transaction creation (`amount <= 0` or `NaN`) -> API rejects with HTTP 400 and human-friendly Indonesian error message without corrupting wallet balance.
2. Creating an `income` or `expense` transaction -> Automatically increments or decrements the linked wallet's `balance` atomically in SQLite.
3. Deleting a transaction -> Reverts the balance impact on the linked wallet so `wallets.balance` stays consistent.
4. Updating `monthly_spending_limit` setting -> Persists in `settings` table and immediately updates the Monthly Spending Limit progress percentage.
5. Searching and filtering in Recent Activities / Kanban -> Filters client-side instantaneously across title, code, and subject/client name.

---

### Task 1: Project Scaffolding & SQLite Local Database Engine (`data/nexus.db`)

**Files:**
- Create: `package.json`
- Create: `server/db.mjs`
- Create: `server/db.test.mjs`

**Interfaces:**
- Produces:
  - `initDb(dbPath?: string): DatabaseSync`
  - `getDashboardState(db: DatabaseSync): DashboardPayload`
  - `createTransaction(db: DatabaseSync, input: NewTransactionInput): TransactionRow`
  - `deleteTransaction(db: DatabaseSync, id: string): void`
  - `createTask(db: DatabaseSync, input: NewTaskInput): TaskRow`
  - `updateTaskStatus(db: DatabaseSync, id: string, status: string): TaskRow`
  - `deleteTask(db: DatabaseSync, id: string): void`
  - `createMaintenance(db: DatabaseSync, input: NewMaintenanceInput): MaintenanceRow`
  - `updateMaintenanceStatus(db: DatabaseSync, id: string, status: string): MaintenanceRow`
  - `updateSetting(db: DatabaseSync, key: string, value: string): void`

- [x] **Step 1: Write the self-contained database verification test (`server/db.test.mjs`)**
- [x] **Step 2: Implement `server/db.mjs` using `node:sqlite` with Indonesian seed data and atomic wallet updates**
- [x] **Step 3: Run `node --test server/db.test.mjs` and verify PASS**

---

### Task 2: Vite Single-Process API Plugin & Frontend Tooling Setup

**Files:**
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/types.ts`

**Interfaces:**
- Consumes: `server/db.mjs` functions
- Produces: HTTP JSON endpoints at `/api/state`, `/api/transactions`, `/api/tasks`, `/api/maintenance`, `/api/settings` and `DashboardData` TypeScript interfaces in `src/types.ts`.

- [x] **Step 1: Configure Vite custom middleware plugin routing `/api/*` to `server/db.mjs`**
- [x] **Step 2: Configure Tailwind CSS with Plus Jakarta Sans & JetBrains Mono fonts**

---

### Task 3: Nexus Command Center UI (Vertix Bento Grid + Left Sidebar + Interactive Modals)

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `start-nexus-desktop.bat`

**Interfaces:**
- Consumes: `/api/*` endpoints and `src/types.ts`
- Produces: Complete multi-view Command Center (`Overview` Bento Grid, `Tugas & Proyek` Kanban & UNPAM Tracker, `Maintenance` Server Monitor, `Keuangan & Kas` Ledger & Wallets, `Laporan & Backup` JSON/CSV export + SQLite inspector) with `Ctrl+K` Command Palette and Dark/Light theme switcher.

- [x] **Step 1: Implement `src/App.tsx` with Framer Motion micro-interactions and zero emojis**
- [x] **Step 2: Verify zero Unicode emojis across `src/` and `server/`**
- [x] **Step 3: Start dev server and verify `/api/state` and UI render HTTP 200 OK**
