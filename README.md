# Example Roblox Game — Community Website

<p align="center">
  A customizable community website starter for <b>Example Roblox Game</b>.
</p>

<p align="center">
  <a href="https://tanstack.com/start">TanStack Start</a> •
  <a href="https://supabase.com">Supabase</a> •
  <a href="https://tailwindcss.com">Tailwind CSS</a>
  <a href="https://roshan.is-a.dev/">Developer</a>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- 🛠️ [Tech Stack](#-tech-stack)
- 🚀 [Getting Started](#-getting-started)
- 📁 [Project Structure](#-project-structure)
- 🔐 [Access Control & Roles](#-access-control--roles)
- 🧩 [Available Scripts](#-available-scripts)
- 🧭 [Routing & Data Flow](#-routing--data-flow)
- 🎨 [Brand Guidelines](#-brand-guidelines)
- 🧪 [Testing](#-testing)
- 📦 [Deployment](#-deployment)
- 🤝 [Contributing](#-contributing)
- 📄 [License](#-license)

---

## 🎯 Overview

**Example Roblox Game** is a configurable community website template for games. Update the game and site details from the dashboard settings. It provides:

- **Public pages** – game info, announcements, open positions (applications), and social links
- 📝 **Application system** – users can apply for staff/team roles via dynamic forms
- 🔐 **Role-based access control** – granular permissions managed through the database, mirrored in the UI
- 👥 **Staff dashboard** – manage users, roles, announcements, notices, tasks, and applications
- 🌐 **Server-side rendering (SSR)** – public pages render on the server for SEO and fast first loads


---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19 + SSR) |
| **Router** | [TanStack Router](https://tanstack.com/router) (file-based, type-safe) |
| **Backend** | [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/server/functions) + [Nitro](https://nitro.unjs.io) |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL + RLS + Auth) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Radix primitives) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **State** | [TanStack Query](https://tanstack.com/query) |
| **Testing** | [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) |
| **Linting / Format** | [ESLint](https://eslint.org) + [Prettier](https://prettier.io) |
| **Package Manager** | [Bun](https://bun.sh) (lockfile: `bun.lock`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20+) or **Bun**
- A [Supabase](https://supabase.com) project
- Environment variables (see `.env.example` if present, or ask the project owner)

### Local Development

```bash
# Clone the repository
git clone <this-repository-url>
cd <repository-name>

# Install dependencies
npm install
# or: bun install

# Set up environment variables
cp .env.example .env  # if .env.example exists
# Edit .env with your Supabase credentials

# Start the dev server
npm run dev
# or: bun dev
```

Open `http://localhost:5173` (or the port shown in your terminal).

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL; included in the browser build |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; included in the browser build and used by public SSR pages |
| `SUPABASE_SECRET_KEY` | Service role key (server-side only, never expose to browser) |

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the build environment so Vite can provide them to the browser. Keep `SUPABASE_SECRET_KEY` server-side only.

For Drizzle migrations, set `DATABASE_URL` to your PostgreSQL connection string. Scheduled-task endpoints use `CRON_SECRET`; optionally set `CRON_SECRET_PREVIOUS` while rotating that secret.

> ⚠️ Never commit `.env` to version control. It is gitignored.

---

## 📁 Project Structure

```
game-community/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, mascots, logos
│   ├── components/
│   │   ├── dashboard/     # Staff dashboard components
│   │   ├── site/          # Public-facing site components (brand, header, footer, auth)
│   │   └── ui/            # shadcn/ui reusable components
│   ├── hooks/              # Custom React hooks (use-auth, use-mobile)
│   ├── integrations/
│   │   └── supabase/       # Supabase client, auth middleware, types
│   ├── lib/                # Access control, queries, redirects, utils
│   ├── routes/             # TanStack Start file-based routes
│   │   ├── index.tsx      # Home page
│   │   ├── about.tsx      # About page
│   │   ├── apply.tsx      # Application form page
│   │   ├── auth.*         # Auth pages (login, register, reset, forgot)
│   │   ├── announcements.tsx
│   │   ├── staff.tsx      # Staff dashboard
│   │   ├── owner.tsx      # Owner dashboard
│   │   ├── co-owner.tsx   # Co-owner dashboard
│   │   └── _authenticated/ # Protected dashboard routes
│   ├── router.tsx         # Router configuration (query cache hydration)
│   ├── server.ts          # Server entry point
│   └── start.ts           # App entry
├── supabase/              # Supabase config
├── drizzle/               # Drizzle schema/migrations
├── tests/                 # Vitest tests
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies & scripts
├── README.md              # This file
├── AGENTS.md              # AI agent instructions
└── roadmap.md             # Project roadmap
```

---

## 🔐 Access Control & Roles

Access control lives in the **database** (RLS, `has_permission`, `can_manage_role`, hierarchy-checked RPCs). The file `src/lib/access.ts` only mirrors those rules for UI decisions — the database is the source of truth.

### Roles

| Role | Level | Description |
|------|-------|-------------|
| `system` | 100 | Full system access (can manage everything) |
| `owner` | 80 | Owner of the community |
| `co_owner` | 70 | Co-owner with broad management rights |
| `custom_role` | 50 | User-defined custom role |
| `application_reader` | 40 | Can view and manage applications |
| `public` | 10 | Unauthenticated / public users |

### Key Permissions

- `CAN_POST_ANNOUNCEMENTS`
- `CAN_POST_NOTICES`
- `CAN_ASSIGN_TASKS`
- `CAN_MANAGE_USERS`
- `CAN_MANAGE_ROLES`
- `CAN_VIEW_APPLICATIONS`
- `CAN_MANAGE_APPLICATIONS`
- `CAN_MANAGE_SOCIALS`
- `CAN_CREATE_FORMS`
- `ADMINISTRATOR` (implies all)

### SSR vs Authenticated Pages

- **Public SSR pages** (`/` routes) read through `src/lib/public.functions.ts` using the publishable key + anon RLS policies. SSR has no user session.
- **Signed-in dashboard** (`_authenticated`, `ssr: false`) uses the browser Supabase client under Row Level Security (RLS).

---

## 🧩 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |

---

## 🧭 Routing & Data Flow

### Routing

- File-based routing via [TanStack Router](https://tanstack.com/router) with generated route tree (`src/routeTree.gen.ts`).
- Router is configured in `src/router.tsx` with a per-request `QueryClient` to avoid cache leaks between SSR requests.
- Query cache is shipped to the browser via `dehydrate`/`hydrate` for seamless SSR hydration without refetching.

### Public Data (SSR)

`src/lib/public.functions.ts` exposes server functions for read-only public data:

- `getSiteMeta` – game info, site settings, active social links, published notices
- `listAnnouncements` – published announcements
- `listOpenPositions` – active application forms with their fields

---

## 🎨 Brand Guidelines

Brand logos (socials, Roblox) are centralized in **`src/components/site/brand.tsx`**:

- `brandFor(platform, url?)` – picks the right logo by platform name, then by link host
- `RobloxIcon` – dedicated Roblox icon component
- Supported platforms: Roblox, Discord, X (Twitter), YouTube, TikTok, Instagram, Twitch, Reddit, Facebook, GitHub

Add new platforms in `brand.tsx` with a `--brand-*` Tailwind token to keep logos consistent across the site.

---

## 🧪 Testing

Tests are written with [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com).

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

Test files live alongside source (e.g., `src/lib/access.test.ts`, `src/components/site/brand.test.ts`) and in `src/test/`.

---

## 📦 Deployment

### Deploy to Vercel

Import the repository into [Vercel](https://vercel.com), use `npm ci` to install dependencies and `npm run build` as the build command. Nitro's Vercel preset generates Vercel's Build Output API output automatically.

Add these environment variables in the Vercel project settings for each environment:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are required at build time; they are embedded into the browser bundle.
- `SUPABASE_SECRET_KEY` is required at runtime for server-side admin operations. Never expose it to the browser.
- `DATABASE_URL` is only needed when running Drizzle migrations.
- `CRON_SECRET` is needed only if scheduled tasks are enabled; `CRON_SECRET_PREVIOUS` is optional during secret rotation.

Redeploy after changing environment variables. `npm run build` can also be run locally to verify the deployment build.


---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Code Style

- Run `npm run format` before committing
- Follow the existing component patterns in `src/components/ui/`
- Keep access control logic in both the database (source of truth) and `src/lib/access.ts` (UI mirror)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://roshan.is-a.dev">Roshan</a></p>
</div>
