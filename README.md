# AGNXI - Agent Skills Directory

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)

**AGNXI** is a curated directory for discovering and installing agent skills for AI coding assistants like Claude Code, Cursor, Windsurf, and more.

🌐 **Live**: [agnxi.com](https://agnxi.com)

## Features

- 🔍 **Discover Skills** - Browse 1000+ curated SKILL.md files from GitHub
- 📂 **Categories** - Filter by development, testing, documentation, DevOps, and more
- ⭐ **Favorites** - Save and organize your favorite skills
- 🚀 **One-Click Install** - Copy install commands for any compatible agent
- 🔄 **Auto-Sync** - Automatic discovery of new skills from GitHub
- 📊 **Rankings** - See trending and top-rated skills

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | Bun |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | Clerk |
| **UI** | Base UI + shadcn-style components |
| **AI** | Vercel AI SDK + Google Gemini |
| **Cache** | Upstash Redis |
| **Background Jobs** | Inngest |

## Quick Start

```bash
# Clone repository
git clone https://github.com/doanbactam/kk.git
cd kk

# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
bun db:push

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Commands

```bash
# Development
bun dev              # Start dev server

# Build & Production
bun build            # Production build
bun start            # Start production server

# Code Quality
bun lint             # Run ESLint

# Database
bun db:generate      # Generate migrations
bun db:migrate       # Run migrations
bun db:push          # Push schema to database
bun db:studio        # Open Drizzle Studio

# Scripts
bun db:seed:categories    # Seed category data
bun ping:indexnow         # Submit sitemap to search engines
```

## Project Structure

```
app/                    # Next.js App Router
├── (auth)/            # Auth pages (sign-in, sign-up)
├── [owner]/           # Dynamic owner/skill pages
├── admin/             # Admin dashboard
├── api/               # API routes
├── categories/        # Category listing
├── ranking/           # Skills ranking
└── skills/            # Skills browsing

components/            # Shared React components
├── layouts/           # Layout components
├── seo/               # SEO components
└── ui/                # Base UI components

features/              # Feature-specific components
├── examples/          # Example components
├── marketing/         # Marketing/landing
├── skills/            # Skill cards, grids
└── submissions/       # Skill submission

lib/                   # Core utilities
├── actions/           # Server actions
├── ai/                # AI integration
├── categories/        # Category logic
├── db/                # Database schema & queries
├── features/skills/   # Skill discovery & indexing
├── hooks/             # React hooks
└── inngest/           # Background job functions

config/                # App configuration
drizzle/               # Database migrations
public/                # Static assets
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# GitHub
GITHUB_TOKEN=

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

## How It Works

1. **Discovery** - Scans GitHub for `SKILL.md` files using Code Search API
2. **Indexing** - Parses skill metadata (name, description, tools, compatibility)
3. **Categorization** - AI-powered category assignment using Gemini
4. **Sync** - Scheduled jobs keep the directory updated

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT © [doanbactam](https://github.com/doanbactam)
