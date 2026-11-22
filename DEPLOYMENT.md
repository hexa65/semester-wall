# Deployment guide: Neon + Render + Vercel

You will put three things online, in this order:

| Order | Service | What it hosts | Why this order |
| --- | --- | --- | --- |
| 1 | **Neon** | The Postgres database | The API needs a database address to start |
| 2 | **Render** | The API (`study-planner/api`) | The website needs the API address to be built |
| 3 | **Vercel** | The website (`study-planner/web`) | Last, because it needs the API address; then we go back to Render once |

Think of it as a restaurant: Neon is the pantry, Render is the kitchen, Vercel is the dining room. The kitchen must know where the pantry is, and the dining room must know where the kitchen is.

Buttons and menu names on these sites change from time to time. If a label here does not match exactly, look for the closest one. The settings and values are what matter.

Everything below is free-tier. See "Free-tier facts" near the end before a demo.

---

## Part 0: Before you start

- Accounts: GitHub, Neon (neon.com), Render (render.com), Vercel (vercel.com). Signing in with GitHub on all three makes the connections easy.
- The project runs locally (see `README.md`). If it does not run locally, fix that first.
- Node 20 or newer and Git are installed.

### 0.1 Put the project on GitHub

You need **one repository** with the two folders inside it: `api` and `web`. The project folder you have is already shaped that way.

Create an empty repository on GitHub (no README, no .gitignore, it is empty on purpose). Then, from the project folder (the one that contains `api`, `web` and `README.md`), the commands are the same in PowerShell and in Mac/Linux/Git Bash:

```
git init
git add .
git commit -m "Semester Wall"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/study-planner.git
git push -u origin main
```

Before the first push, check that **no secret is included**. These must not appear on GitHub: `api/.env` and `web/.env`. Both folders have a `.gitignore` that excludes them. Check with:

```
git status
```

If you see `.env` (not `.env.example`) in the list, stop and do not commit.

---

## Part 1: Neon (the database)

### 1.1 Create the project

1. Sign in at neon.com and choose **Create project** (or **New project**).
2. Name it `study-planner`. Pick the region closest to where you will deploy the API. **Write down the region**: choose the same one for Render later (for example both in the US East or both in Europe). Being close makes every request faster.
3. Keep the default Postgres version and the default database name (`neondb`). Create it.

### 1.2 Create the tables

1. In the Neon dashboard open **SQL Editor**.
2. Open `api/sql/schema.sql` on your computer, copy **all** of it, paste it in the editor and run it. You should see a success message. This creates 5 tables: `users`, `courses`, `deadlines`, `class_sessions`, `semester`.

> **If you ran an older `schema.sql` (the version without accounts) before:** it has no `users` table. Start clean: run `DROP TABLE deadlines, class_sessions, semester, courses, users CASCADE;` in the SQL Editor, then run the new `schema.sql`. This deletes everything, which is fine because it was only sample data.
>
> **Do not run `schema.sql` twice.** The second run says the tables already exist. Nothing breaks.

### 1.3 Get the connection string

1. On the project dashboard choose **Connect** (a button near the top).
2. You will see a connection string. There is a switch or checkbox called **Connection pooling**.
   - **ON (pooled):** the host name contains `-pooler`. **Use this one for the API on Render.**
   - **OFF (direct):** use it only for one-off scripts. You do not need it in this project.
3. Copy the pooled string. It looks like this:

```
postgresql://USER:PASSWORD@ep-something-123456-pooler.REGION.aws.neon.tech/neondb?sslmode=require
```

Put it in `api/.env` as `DATABASE_URL` (the next step needs it) and keep it somewhere private for Render. **Never put it in the website folder, in GitHub, or in a chat.** Anyone who has it can read and change your data.

Neon free projects pause when idle and wake automatically on the next request. The first query after a pause takes a moment longer. That is normal.

### 1.4 Create the demo account (sample data)

The sample data now belongs to a **demo account**, created by a script, not by SQL, because the password has to be hashed.

1. On your computer, in the `api` folder, make sure `api/.env` has your Neon **pooled** string in `DATABASE_URL` (from 1.3 above) and a `JWT_SECRET`.
2. Run:

```
npm run seed
```

3. It prints `Demo data ready` and the counts: **courses 5, sessions 8, deadlines 16, open 14**, then the login: `demo@example.com` / `demo-password-123`.

Run it again any time to reset the demo account (other accounts are not touched). Because the dates are relative to the day you run it, run it again shortly before a demo.

> The demo password is written in the code, so treat the demo account as public: sample data only.

---

## Part 2: Render (the API)

### 2.1 Create the web service

1. In Render choose **New +**, then **Web Service**.
2. Connect your GitHub account and choose the `study-planner` repository.
3. Fill the form like this:

| Field | Value |
| --- | --- |
| Name | `study-planner-api` (this becomes part of the address) |
| Region | The same region you chose for Neon |
| Branch | `main` |
| **Root Directory** | `api` |
| Runtime / Language | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| Instance type | `Free` |

**Why `--include=dev`?** The build needs TypeScript, and TypeScript is a development dependency. Render sets `NODE_ENV=production`, and in that mode `npm install` skips development dependencies. Without the flag the build fails with `tsc: not found`.

**Why Root Directory `api`?** The repository has two projects. This tells Render to treat only the `api` folder as the project, so it finds the right `package.json`.

### 2.2 Environment variables

Open **Advanced** (or the **Environment** tab) and add these. Names are exact and case-sensitive.

| Key | Value |
| --- | --- |
| `DATABASE_URL` | The **pooled** Neon string from Part 1.3 |
| `JWT_SECRET` | A long random text (at least 32 characters). Make one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. **Different from your local one is fine. Never share it.** If it changes, everyone is logged out. |
| `CORS_ORIGIN` | `http://localhost:5173` for now (we change it in Part 4) |
| `READ_ONLY` | `false` for now (see "No login" below) |
| `NODE_VERSION` | `22` |

You do not need to set `PORT`. Render sets it, and the API reads it.

### 2.3 Health check

In **Advanced**, set **Health Check Path** to `/health`. Render calls it to know that the API started. The `/health` route also asks the database a question, so it fails if the database address is wrong. That is useful.

### 2.4 Deploy and test

1. Choose **Create Web Service**. Watch the **Logs**. A good run ends with `Study Planner API on port ...` and the status **Live**.
2. At the top of the page Render shows your address, like `https://study-planner-api.onrender.com`. **Copy it** (no slash at the end).
3. Open this in your browser:

```
https://study-planner-api.onrender.com/health
```

You should see `{"status":"ok","readOnly":false}`.

4. Open `https://study-planner-api.onrender.com/courses`. You should see a list of 5 courses as JSON.

The first request after the service has been idle can take 30 to 60 seconds. Wait for it.

If something fails, see "Troubleshooting" at the bottom.

---

## Part 3: Vercel (the website)

### 3.1 Import the project

1. In Vercel choose **Add New...**, then **Project**, and import the same GitHub repository.
2. In the configuration screen:

| Field | Value |
| --- | --- |
| **Root Directory** | `web` (choose **Edit** next to it and select the folder) |
| Framework Preset | `Vite` (Vercel normally detects it) |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

### 3.2 Environment variable (before the first build!)

Add this variable **before** you press Deploy:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | Your Render address, for example `https://study-planner-api.onrender.com` (no slash at the end) |

**Why before?** Vite copies `VITE_` values into the website files **while building**. If you add or change it afterwards, nothing changes until you **redeploy** (Deployments, then the three-dot menu, then Redeploy). Also remember that `VITE_` values are public: anyone can read them in the browser. Only the API address goes here, never the database string.

### 3.3 Deploy

Press **Deploy**. When it finishes Vercel shows your website address, like `https://study-planner-web.vercel.app`. **Copy it** exactly.

The file `web/vercel.json` already contains a rewrite so that opening `/calendar` or refreshing on `/deadlines` shows the app and not a 404 error. Do not delete it.

At this point the website opens, but the data will **not** load yet. The browser console shows a CORS error. That is expected, and the next part fixes it.

---

## Part 4: Close the circle (CORS)

CORS is the API's guest list: it only answers websites it knows. Right now it only knows `http://localhost:5173`.

1. Go back to Render, your API service, **Environment**.
2. Change `CORS_ORIGIN` to your Vercel address, **exactly**:
   - starts with `https://`
   - no slash at the end
   - for example `https://study-planner-web.vercel.app`
3. Save. Render redeploys by itself (wait for **Live**).

To allow your local computer as well, separate two addresses with a comma:

```
https://study-planner-web.vercel.app,http://localhost:5173
```

**Vercel preview addresses** (the long ones with random letters, created for each branch or pull request) are not on the list, so they cannot load data. Use the main address.

---

## Part 5: Test the live site

Open your Vercel address and go through this checklist. The expected numbers come from the seed data.

- [ ] You land on the **Log in** page. Log in with `demo@example.com` / `demo-password-123`.
- [ ] **Create an account** with a different email: you get an empty planner ("Your planner is empty"). Add a course. Log out, log in as the demo user: the demo data does **not** contain your new course. That proves accounts are separate.
- [ ] **Today** page loads. It shows the semester week ("Week 6 of 18"), the classes of today, **2 overdue**, **1 due today**, **4 due in the next 7 days**.
- [ ] **Calendar** shows the current month, coloured blocks, and a gauge beside each week. Click a day: the panel shows its classes and deadlines. The address changes to `?month=...&day=...`.
- [ ] Refresh the page on `/calendar?...`. It still works (this tests `vercel.json`).
- [ ] **Deadlines**: tick one as done. It changes at once and stays after a refresh.
- [ ] **Courses**: add a course, then try to add another with the same code. You should see "A course with this code already exists."
- [ ] **Timetable**: add a class that overlaps an existing one. You should see the overlap message.
- [ ] Open `/nothing-here`. You get the "Page not found" screen.
- [ ] On your phone (or the browser's 360px view): the calendar is usable and nothing scrolls sideways.

### Reset the demo data

Whenever the dates look old, run `npm run seed` again in the `api` folder (with `api/.env` pointing at Neon). All dates are relative to the day you run it, so "today" always has items. Only the demo account is reset.

---

## Free-tier facts (read before a demo)

- **Render free services sleep** after about 15 minutes without requests. The next request wakes the API and takes **30 to 60 seconds**. The website waits up to 60 seconds before showing an error. Before a demo, open `/health` on the API a minute ahead and wait for `ok`.
- **Neon free projects pause** when idle and wake on the next request (a short extra delay).
- **Free tiers change.** Limits and sleep rules are set by the companies and can change, so check each pricing page if something behaves differently.
- **Deploys:** every `git push` to `main` redeploys both Render and Vercel.

## Accounts, privacy and public demos

Each person who signs up gets a private planner. The API checks the login token on every request and only returns that person's own data.

What this version does **not** have: password reset by email, email verification, account deletion. If someone forgets their password, the only fix is to delete their row in the `users` table in the Neon SQL Editor. Do not store anything truly sensitive.

- Passwords are stored as salted hashes. Login tokens last 7 days and are kept in the browser's `localStorage`.
- Keep `JWT_SECRET` private. Anyone who has it can create a valid token for any user.
- For a **public link** (a portfolio, a presentation), set `READ_ONLY=true` on Render. Visitors can log in with the demo account and look, but every change, **including creating accounts**, is refused with a 403. Switch it back to `false` when you want to edit or let people sign up.

---

## Troubleshooting

| What you see | Cause | Fix |
| --- | --- | --- |
| Render build: `tsc: not found` | Dev dependencies were skipped | Build Command must be `npm install --include=dev && npm run build` |
| Render build: cannot find `package.json` | Root Directory not set | Set Root Directory to `api` |
| Render logs: `DATABASE_URL is missing` | Variable not set or misspelled | Add `DATABASE_URL` in Render, Environment |
| `/health` returns 500 | Wrong database string, or password changed | Copy the pooled string again from Neon, Connect |
| Browser console: `blocked by CORS policy` | `CORS_ORIGIN` does not match the website address | Make it identical: `https://`, no trailing slash. Check for a typo and for a preview address |
| Website opens but a blank screen, console says `VITE_API_URL is missing` | Variable missing at build time | Add it in Vercel, then **Redeploy** |
| Data still loads from the wrong place after changing `VITE_API_URL` | Old build | Redeploy; VITE values are fixed at build time |
| 404 when refreshing `/calendar` | `vercel.json` missing or Root Directory not `web` | Keep `web/vercel.json`; set Root Directory to `web` |
| "The server took too long to answer" | Render is waking up | Wait a minute and press **Try again** |
| `npm install` fails with `ERESOLVE` and TypeScript | A TypeScript 7 template with typescript-eslint | In that folder: `npm install -D "typescript@~6.0.0"` |
| Every change answers 403 | `READ_ONLY=true` | Set it to `false` on Render |
| Render logs: `JWT_SECRET is missing or too short` | Variable missing | Add `JWT_SECRET` (32+ characters) in Render, Environment |
| `npm run seed` says `relation "users" does not exist` | The old schema (no accounts) is in the database | Drop the tables and run the new `schema.sql` (see Part 1.2) |
| Logged out after every API restart or secret change | `JWT_SECRET` changed | Keep the same secret; log in again after changing it |
| "Email or password is incorrect" for the demo user | Seed was not run on this database | Run `npm run seed` with `api/.env` pointing at the right database |
| "Too many attempts" | More than 20 login tries in 15 minutes from one address | Wait a few minutes |
| Dates are in the past | Seed ran a while ago | Run `npm run seed` again in the `api` folder |

## Quick reference: all the values in one place

| Where | Setting | Value |
| --- | --- | --- |
| Neon | Connection string | The **pooled** one (host has `-pooler`) |
| Render | Root Directory | `api` |
| Render | Build Command | `npm install --include=dev && npm run build` |
| Render | Start Command | `npm start` |
| Render | Health Check Path | `/health` |
| Render | `DATABASE_URL` | Pooled Neon string |
| Render | `CORS_ORIGIN` | Exact Vercel address, `https://`, no trailing slash |
| Render | `JWT_SECRET` | Random text, 32+ characters, private |
| Render | `READ_ONLY` | `false` to edit and sign up, `true` for a public demo |
| Render | `NODE_VERSION` | `22` |
| Vercel | Root Directory | `web` |
| Vercel | `VITE_API_URL` | Exact Render address, no trailing slash (set before the build) |
