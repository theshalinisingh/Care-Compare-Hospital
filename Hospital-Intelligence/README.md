# CareCompare — Hospital Intelligence & Services Comparison Engine

A full-stack educational project for discovering and comparing hospital service information. The frontend includes sign-up/login forms, a directory filter for all Indian states and Union Territories, and sample doctor schedule cards. The directory currently contains only fictional demo hospitals, not a verified nationwide provider dataset. The repository includes a React frontend, Express REST API, PostgreSQL database schema (Prisma), sample seed data, JWT registration/login endpoints, India-wide state/region filters, doctor schedule display, and a transparent preference-based comparison score.

> **Important:** Seed records are fictional demonstration data. They are not real hospital listings, verified prices, clinical ratings, or current availability. The score is a preference-matching aid only—not medical advice, a clinical-quality measure, or a treatment recommendation. Verify all information directly with providers.

## Technology
- Frontend: React 18, Vite, plain CSS, Lucide icons
- Backend: Node.js, Express, JWT, bcrypt, Zod, Helmet, rate limiting
- Database: PostgreSQL 16 + Prisma ORM
- Local database: Docker Compose

## Requirements
- Node.js 20 LTS or newer
- npm
- Docker Desktop (recommended) or a local PostgreSQL 16 instance

## Run locally

### 1. Start PostgreSQL
From the repository root:

```bash
docker compose up -d db
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Set a long random `JWT_SECRET` in `backend/.env`. The default database URL matches the included Docker Compose configuration.

### 3. Install, create tables and seed sample data

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The API runs at `http://localhost:5000`.

### 4. Start frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend first attempts to load records from the API. If the API is unavailable, it displays its built-in demonstration records in Demo mode.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET | `/api/hospitals` | List/search hospitals (`q`, `city`, `state`, `region`, `speciality`, `emergency`) including listed doctor schedule records |
| GET | `/api/hospitals/:id` | Hospital profile, services, facilities and doctors |
| POST | `/api/hospitals/compare` | Compare 2–4 hospitals with optional preferences |
| POST | `/api/auth/register` | Create a user account |
| POST | `/api/auth/login` | Login and receive a JWT |

Example comparison body:

```json
{
  "ids": ["hospital-id-1", "hospital-id-2"],
  "speciality": "Orthopaedics",
  "budgetMax": 25000,
  "emergency": true
}
```

## Project structure

```text
Hospital-Intelligence/
├── frontend/
│   ├── src/App.jsx
│   ├── src/main.jsx
│   └── src/styles.css
├── backend/
│   ├── prisma/schema.prisma
│   ├── prisma/seed.js
│   └── src/
│       ├── routes/
│       ├── services/scoring.js
│       ├── middleware/auth.js
│       └── server.js
├── docs/
├── docker-compose.yml
└── README.md
```

## Comparison score
The score is intentionally transparent and configurable in `backend/src/services/scoring.js`:
- Speciality/service match: 30%
- Estimated cost fit: 25%
- User-entered rating field: 20%
- Listed facilities count: 15%
- Emergency flag match: 10%

This formula is a prototype. Ratings and records are sample data and may be stale or inaccurate. A real deployment must show provenance, verification date, data freshness and missing-data indicators; do not present this score as hospital quality or patient outcome prediction.

## Before production deployment
This repository is a working project foundation, not a certified healthcare product. Complete the following before public use:
1. Build role-protected admin CRUD endpoints and admin screens; protect every write route with `requireAuth` + `requireAdmin`.
2. Add password reset, email verification, stronger session management and audit logs.
3. Add automated unit, integration and end-to-end tests.
4. Add pagination, structured logging, monitoring, backups and migrations.
5. Use a verified data acquisition process with provider consent, source attribution and freshness timestamps.
6. Review applicable Indian privacy, consumer protection and healthcare regulations with qualified professionals.
7. Deploy over HTTPS, use managed secrets, restrict CORS, harden database access and perform a security review.

## Learning path
Read `docs/BUILD_PLAN.md` for the recommended beginner-friendly order to understand and extend the code.
