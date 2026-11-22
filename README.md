# Semester Wall (Study Planner)

A semester planner for a university student: courses, weekly classes, deadlines, and a month calendar that shows what is due and when. Real API, real Postgres database, and accounts: every person has their own private planner.

```
study-planner/
├── api/   Node + Express 5 + TypeScript + pg (plain SQL, no ORM)
├── web/   Vite + React + TypeScript + Tailwind v4 + React Router + TanStack Query v5
└── DEPLOYMENT.md   Neon + Render + Vercel, step by step
```

## Run it on your computer

You need Node 20 or newer, Git, and a free Neon account (see `DEPLOYMENT.md`, Part 2, for the database).

**1. Database.** In the Neon SQL Editor run `api/sql/schema.sql`. (Sample data comes in step 2, with `npm run seed`.)

**2. API** (terminal 1)

```
cd api
npm install
```

Create `api/.env` from `api/.env.example` (Windows PowerShell: `Copy-Item .env.example .env`, Mac/Linux/Git Bash: `cp .env.example .env`). Fill in two things: your Neon **pooled** connection string in `DATABASE_URL`, and a long random text in `JWT_SECRET` (make one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Then:

```
npm run seed
npm run dev
```

`npm run seed` creates the demo account (`demo@example.com` / `demo-password-123`) with sample data. You can also skip it and create your own account on the sign-up page.

Open http://localhost:4000/health. It should say `{"status":"ok","readOnly":false}`.

**3. Web** (terminal 2)

```
cd web
npm install
```

Create `web/.env` from `web/.env.example` (same copy command as above), then:

```
npm run dev
```

Open http://localhost:5173. You land on the login page: use the demo account, or choose **Create an account**.

> If `npm install` stops with an `ERESOLVE` error mentioning TypeScript, run it inside the folder that contains `package.json` and make sure the TypeScript line is `"typescript": "~6.0.0"`. TypeScript 7 is not supported by typescript-eslint yet.

## Scripts (in both folders)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start in development mode |
| `npm run build` | Type-check and build |
| `npm test` | Run the Vitest tests (pure logic only) |
| `npm run lint` | Type-check with `tsc --noEmit` (there is no ESLint in this project) |

## What the seed data gives you

Whatever day you run `npm run seed`, the dates are relative to today: 5 courses, 8 weekly classes, 16 deadlines (14 open, 2 done, **2 overdue, 1 due today, 4 due in the next 7 days, 7 later**). Run it again any time to reset the demo account, and before a demo so "today" is not stale. It only touches the demo account; other accounts are never changed.

## How the code is organised

- **Web:** page -> component -> hook -> service. Only `services/` talks to the API. Date and calendar rules are pure functions in `lib/` with tests. Five kinds of state: server (TanStack Query), form, UI, URL (selected month and day), derived (the calendar grid, class dates, week load, overdue lists).
- **API:** route -> validator -> SQL. Every value goes into a parameter (`$1`, `$2`). Column names in SQL come from a fixed list in our own code.
- **Weekly classes are stored as rules** (a weekday and times). The calendar expands them into dates while rendering.
- **Dates** are plain text `YYYY-MM-DD`, times are `HH:MM`. Weekdays are 1 (Monday) to 7 (Sunday); `getDay()` is translated in one helper, `isoWeekday` in `web/src/lib/dates.ts`.

## API at a glance

`GET /health` · `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `GET|POST /courses` · `GET|PATCH|DELETE /courses/:id` · `GET|POST /deadlines` (filters `from`, `to`, `courseId`, `done`) · `GET|PATCH|DELETE /deadlines/:id` · `GET|POST /sessions` · `PATCH|DELETE /sessions/:id` · `GET|PUT /semester`

Every route except `/health` and `/auth/register|login` needs the header `Authorization: Bearer <token>`.

Errors: `400 { message }` invalid input, `401` not logged in or wrong password, `404` missing item (also what you get for another person's item), `409` duplicate email, duplicate course code **or** a class that overlaps another, `429` too many login attempts, `403` in `READ_ONLY` mode.

## Accounts and privacy

- Each user has their own courses, classes, deadlines and semester dates. Every query filters by the logged-in user, so nobody can read or change another person's data.
- Passwords are never stored: only a salted `scrypt` hash. Login gives a signed token that lasts 7 days; the website keeps it in `localStorage`.
- There is no password reset, email check or account deletion in this version.
- For a public demo link, set `READ_ONLY=true` on the API and share the demo account: people can log in and look, but cannot change anything (sign-up is blocked too).

## Ideas to extend it

Password reset by email, account deletion, recurring deadlines, email reminders, an iCal export, automated component tests.
