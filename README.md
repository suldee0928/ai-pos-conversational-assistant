# AI-powered POS conversational assistant

Bachelor thesis prototype: a web chat frontend talks to an Express API that resolves natural-language questions against a PostgreSQL POS-style schema using **rule-based intents**, optionally **OpenAI structured outputs**, and an optional **Model Context Protocol (MCP)** tool path (`direct` vs `mcp`). Session context enables short follow-ups (e.g. “what about yesterday?”).

## Features

- Chat UI (`frontend`) backed by REST (`backend`)
- Intent validation, dispatch to repositories / analytics SQL, humane reply formatting
- Optional MCP stdio client for tooling experiments; HTTP JSON-RPC surface for MCP-style calls where implemented
- Prisma-managed schema, migrations, and seed (`backend/prisma`, `backend/src/lib/seed.ts`)
- Automated tests via Vitest (backend + frontend)

## Repository layout

| Path | Contents |
|------|----------|
| `backend/` | API, interpreters, MCP wiring, middleware, repositories, tests |
| `frontend/` | Vite + React chat client |
| `docs/` | **Not tracked in Git** — thesis, figures, PDFs only on your disk (ZIP them for Neptun yourself) |
| `submission/` | **Not tracked in Git** — local mirrors / ZIPs you build for thesis hand-ins (recreate anytime) |

## Prerequisites

- Node.js LTS (18+ recommended)
- PostgreSQL reachable from `DATABASE_URL`
- OpenAI API key if you enable LLM intent interpretation / grounded replies (`backend/.env.example`)

## Environment

**Backend.** Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and set at least:

- `DATABASE_URL`
- `OPENAI_API_KEY` (when using the OpenAI interpreter or NL-SQL helpers)

Never commit `.env`.

**Frontend.** Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env` or `.env.local` if you override the API base URL, chat API key, or UI MCP badge (`VITE_*` variables).

## Run locally

From the repo root (after installs):

```bash
npm install --prefix backend && npm install --prefix frontend
```

Terminal 1 — API (default http://localhost:3000):

```bash
npm run dev:backend
```

Terminal 2 — UI:

```bash
npm run dev:frontend
```

Apply schema and seed (from `backend/`):

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Tests & builds

```bash
npm run test
npm run build:backend
npm run build:frontend
```

CI runs these via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Execution modes (`CHAT_EXECUTION_MODE`)

- **`direct`** (default in `.env.example`): handlers run in-process.
- **`mcp`**: requests can be delegated to an MCP subprocess; configure `MCP_CLIENT_*` in `backend/.env.example` when you use this mode.

## Example `/chat` body (validated intent)

The production path expects user text plus session id from the UI; internally the server may classify to something like:

```json
POST /chat
Content-Type: application/json

{
  "message": "How much revenue on 2026-03-06?",
  "sessionId": "demo-session-1"
}
```

(Response shape follows the formatter in `backend`; direct JSON intents are exercised in tests.)

## Example natural-language prompts

- “How much revenue did we make on 2026-03-06?”
- “What about yesterday?”
- “Who is working right now?”
- “Compare revenue between 2026-03-05 and 2026-03-06.”
- Revenue by payment type, top products, employee sales, low-stock queries (subject to implemented tools / allow-list).

## Tech stack

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Vitest  
- **Frontend:** React, TypeScript, Vite, Vitest + Testing Library  
- **Optional AI:** OpenAI (structured intents, grounded replies, guarded NL-SQL pathway where enabled)

## Thesis context

Implements layered design, conversational state, database modelling, and integration of constrained LLM behaviour suitable for analytical POS scenarios.
