# AI-Powered POS Conversational Assistant

This project implements a backend prototype for a conversational assistant that allows users to query POS data using natural language.

## Features

- Structured intent interface
- Layered backend architecture
- PostgreSQL database with Prisma ORM
- Revenue aggregation queries
- Intent validation and dispatching

## Tech Stack

Backend:
- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL

AI layer:
- Rule-based intents and optional OpenAI structured-output interpreter
- Guarded tooling (MCP-style) and analytic SQL helpers — see repo root README

## Example Query

POST /chat

{
  "intent": "GET_DAILY_REVENUE",
  "parameters": { "date": "2026-03-06" },
  "confidence": 0.95
}

## Setup

Copy `.env.example` to `.env` and set `DATABASE_URL` and `OPENAI_API_KEY`.

Optional: `USE_LLM_REPLY=true` (default in `.env.example`) runs a **second** OpenAI call that phrases the answer in natural language using **only** the structured query result (grounded reply). Set `USE_LLM_REPLY=false` to use deterministic templates only.

## Tests

```bash
npm test
```

## Status

Prototype backend implemented: LLM structured-output interpreter, session context, optional MCP dispatch, middleware (rate limiting / optional API key), Vitest suites.
