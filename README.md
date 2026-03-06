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

AI Layer:
- Structured intent parsing
- Future integration with LLM APIs

## Example Query

POST /chat

{
  "intent": "GET_DAILY_REVENUE",
  "parameters": { "date": "2026-03-06" },
  "confidence": 0.95
}

## Status

Prototype backend implemented.
Next steps include natural language interpretation and conversational context management.
