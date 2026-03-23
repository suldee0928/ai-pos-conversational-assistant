# AI-Powered POS Conversational Assistant

This project implements a prototype system that allows users to query Point-of-Sale (POS) data using natural language through a conversational interface.

The system combines structured data retrieval with intent interpretation and context-aware query handling.

---

## 🚀 Features

- Natural language query interface (chat-based)
- Structured intent extraction (rule-based with optional LLM integration)
- Context-aware follow-up queries (session memory)
- Revenue aggregation and comparison
- Current employee shift detection
- Layered backend architecture (clean separation of concerns)
- PostgreSQL database with Prisma ORM
- Simple React-based chat UI

---

## 🏗️ System Architecture

The system follows a client–server architecture:

- **Frontend**: React-based chat interface
- **Backend**: Node.js + TypeScript REST API
- **Database**: PostgreSQL (relational POS model)
- **AI Layer**:
  - Rule-based intent parsing (current)
  - Structured LLM integration (planned)

---

## 📁 Project Structure
ai-pos-conversational-assistant/
│
├── backend/ # API, business logic, database access
├── frontend/ # React chat interface
├── docs/ # diagrams and thesis materials (for later)


---

## 💬 Example Queries

- "How much revenue did we make on 2026-03-06?"
- "What about yesterday?"
- "Who is working right now?"
- "Compare revenue between 2026-03-05 and 2026-03-06"

---

## 🔄 Example API Request



## ⚙️ Tech Stack

### Backend
- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod (validation)

### Frontend
- React
- TypeScript
- Vite

### AI / Logic Layer
- Rule-based intent classification
- Structured intent schema
- Optional LLM integration (OpenAI)

---

## ▶️ Running the Project

### Backend
```bash
cd backend
npm install
npm run dev
cd frontend
npm install
npm run dev
```

📊 Current Status

Backend API implemented
Database schema and seed data implemented
Conversational flow with session context working

Core features:
Revenue queries
Follow-up queries
Current shifts
Revenue comparison
Frontend chat UI implemented


🔮 Future Work

LLM-based intent extraction (structured outputs)
Improved natural language understanding
Authentication and role-based access
Real-time POS integration (concurrency handling)
Advanced analytics queries

🎓 Thesis Context

This project is developed as part of a BSc thesis and demonstrates:
Object-Oriented Design
Layered architecture
Database modelling and querying
Conversational system design
Integration of AI components into software systems
