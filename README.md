# FlexiLog

A flexible personal logging and habit tracking app built around a calendar-first experience. Capture anything you do — gym sessions, study, reading, mood, custom categories — and watch your activity light up on a beautiful monthly calendar. Multi-user, with per-account data isolation.

> Built with Next.js 14 (App Router), TypeScript, TailwindCSS, **Clerk** (auth), **Prisma + Postgres** (data), TanStack Query, Zustand (UI state), and Framer Motion.

## Features

- **Sign-in required** — every user gets their own private categories and logs
- **Calendar dashboard** — monthly view with category-colored dots per day, hover preview, smooth month transitions, color legend
- **Fast logging** — open a day, add a log in 2–3 clicks (title, category, optional time/notes/tags). Inline category creation from the log form.
- **Custom categories** — unlimited user-defined categories with colors. Default 6 are seeded automatically on first sign-in.
- **Day panel** — view, edit, duplicate, or delete logs for any day
- **Search & filter** — by text, category, tag, and date range
- **Stats & insights** — totals, streaks, weekday distribution, 26-week heatmap, JSON export
- **Dark mode** — system-aware, toggleable
- **Responsive** — works on desktop and mobile

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 14 (App Router) + TypeScript                |
| Auth           | Clerk (`@clerk/nextjs`)                             |
| Database       | Postgres via Prisma                                 |
| Server data    | TanStack Query (`@tanstack/react-query`)            |
| UI state       | Zustand (search/filter/selectedDate, no persistence)|
| Styling        | TailwindCSS, custom CSS variables for theming       |
| Animations     | Framer Motion                                       |
| Icons          | lucide-react                                        |
| Date utilities | date-fns                                            |

## Prerequisites

- Node 20+
- A Postgres database. **The simplest setup is a local Postgres install** — create a dedicated database for FlexiLog and point `DATABASE_URL` at it. Hosted options like [Neon](https://neon.tech) or Supabase work too if you'd rather not run Postgres locally.
- A [Clerk](https://clerk.com) application (free tier is fine).

### Local Postgres setup

In `psql` (or pgAdmin), create a role and database:

```sql
CREATE ROLE flexilog WITH LOGIN PASSWORD 'flexilog';
CREATE DATABASE flexilog OWNER flexilog;
```

Then in `.env.local`:

```
DATABASE_URL=postgresql://flexilog:flexilog@localhost:5432/flexilog
```

Note: **omit** `?sslmode=require` for local Postgres — that flag is only needed for hosted providers.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Then fill in:
#   DATABASE_URL              (Neon connection string, with ?sslmode=require)
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
#   CLERK_SECRET_KEY
# Leave the rest as-is unless you customize routes.

# 3. Apply the database schema
npm run db:migrate

# 4. Run the dev server
npm run dev

# 5. Visit
# http://localhost:3000  →  redirects to /sign-in
```

On first sign-in, FlexiLog automatically creates the user's row and seeds 6 default categories (Gym, Study, Work, Reading, Mood, Coding). Your data is scoped to your Clerk `userId` and is invisible to other accounts.

## Useful scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server                  |
| `npm run build`      | Production build                      |
| `npm run start`      | Run the production build              |
| `npm run db:migrate` | Apply Prisma migrations (`migrate dev`) |
| `npm run db:studio`  | Browse the database in Prisma Studio  |
| `npm run db:generate`| Regenerate the Prisma client          |
| `npm run lint`       | Run Next.js lint                      |

## Project structure

```
prisma/
└── schema.prisma            # User, Category, Log

src/
├── app/
│   ├── layout.tsx           # ClerkProvider + Providers (TanStack) + AppShell
│   ├── providers.tsx        # QueryClientProvider
│   ├── page.tsx             # Calendar dashboard
│   ├── search/page.tsx      # Search & filtering
│   ├── categories/page.tsx  # Manage categories
│   ├── stats/page.tsx       # Insights, heatmap, export
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── api/
│   │   ├── categories/route.ts
│   │   ├── categories/[id]/route.ts
│   │   ├── logs/route.ts
│   │   ├── logs/[id]/route.ts
│   │   └── logs/[id]/duplicate/route.ts
│   └── globals.css
├── components/
│   ├── app-shell.tsx        # Sidebar + UserButton
│   ├── calendar.tsx
│   ├── day-panel.tsx
│   ├── log-form.tsx
│   ├── theme-script.tsx, theme-toggle.tsx
└── lib/
    ├── db.ts                # Prisma singleton
    ├── auth.ts              # getOrCreateUser() — upsert on first request
    ├── api-client.ts        # Typed fetch wrappers
    ├── api-helpers.ts       # withUser(), HttpError
    ├── queries.ts           # TanStack Query hooks
    ├── schemas.ts           # zod validators for API bodies
    ├── selectors.ts         # Pure data helpers
    ├── store.ts             # Slim UI store (filters/selectedDate)
    ├── defaults.ts          # Seed categories + color palette
    ├── types.ts             # Domain types
    └── utils.ts             # cn(), date helpers, color utils

middleware.ts                # Clerk middleware — protects all non-auth routes
```

## Data model

```prisma
model User {
  id String @id     // Clerk userId
  email String?
  name String?
  categories Category[]
  logs Log[]
}

model Category {
  id String @id @default(cuid())
  userId String
  name String
  color String      // hex
  icon String?
}

model Log {
  id String @id @default(cuid())
  userId String
  categoryId String
  title String
  description String?
  date String       // YYYY-MM-DD
  startTime String? // HH:mm
  endTime String?
  tags String[]
  createdAt DateTime
  updatedAt DateTime
}
```

Per-user scoping is enforced in every API route handler — every query is filtered by `userId`, and PATCH/DELETE handlers return 404 if the row doesn't belong to the caller.

## How auth gating works

- `middleware.ts` uses Clerk's `clerkMiddleware`. Routes matching `/sign-in(.*)` and `/sign-up(.*)` are public; everything else (including `/api/*`) requires a session.
- API handlers call `getOrCreateUser()` from `src/lib/auth.ts` to upsert the user row on first request and return their `userId`.
- Without a session, API endpoints return 401.

## Deployment notes

- Set the same env vars in your hosting provider (Vercel: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_*`).
- Run `prisma migrate deploy` as part of the build/release step (or via the Prisma data platform integration on Vercel).
- Make sure your Clerk app's "Allowed Origins" / redirect URLs include the deployed URL.

## License

MIT
