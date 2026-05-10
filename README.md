# NoraLingua Hub

> A personalized English-learning platform that matches adult learners to their CEFR level and learning purpose, then delivers structured Reading, Listening, Writing, and Speaking practice with AI-graded feedback.

**Author:** Nora Aldossari
**Year:** 2026
**Course:** CSCI E-50, Harvard Extension School
**Concentration:** Computer Science
**Location:** Riyadh, Saudi Arabia

**Video demo:** [https://youtu.be/yb8lrP7Impw](https://youtu.be/yb8lrP7Impw)

---

## Table of Contents

1. [Overview](#overview)
2. [Live Preview](#live-preview)
3. [Statistics](#statistics)
4. [Tech Stack](#tech-stack)
5. [Key Features](#key-features)
6. [File Structure](#file-structure)
7. [Database Schema (Quick Reference)](#database-schema-quick-reference)
8. [Routes Reference](#routes-reference)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)
11. [Test Accounts for Graders](#test-accounts-for-graders)
12. [Suggested Test Scenarios](#suggested-test-scenarios)
13. [Demo Video Reference](#demo-video-reference)
14. [Troubleshooting](#troubleshooting)
15. [Architecture and Design](#architecture-and-design)
16. [Submission Notes](#submission-notes)
17. [Acknowledgements](#acknowledgements)

---

## Overview

**NoraLingua Hub** is a full-stack web application that personalizes English language learning for adult learners. Most language platforms either treat all learners the same or focus on a single skill in isolation. NoraLingua Hub takes a different approach: it asks each learner two questions during onboarding -- their CEFR level (A1 through C2) and their learning purpose (e.g. Job, Travel, IELTS, University, Business, General) -- and then delivers a curated study path that combines all four core language skills: Reading, Listening, Writing, and Speaking.

What makes this project distinct is the integration of an **AI examiner** (powered by Anthropic Claude) that grades writing assignments using the official IELTS rubric, gives band scores from 0 to 9 across four criteria (Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy), and produces a Band 9 rewrite of the learner text so they can see exactly what excellent looks like.

The platform supports two roles: **students** (who follow a personalized path through their lessons and assignments) and **administrators** (who can monitor progress across the cohort and manage content). Speaking practice is implemented as a booking system where students reserve sessions with assigned teachers and join via Zoom -- a deliberately practical choice that reflects how live conversation practice actually works.

The project was built from scratch over several months as a demonstration of full-stack engineering: database design, server-side rendering, authentication, AI integration, role-based access control, and accessible, polished UI design.

---

## Live Preview

**Live deployment:** [https://nora-lingua-hub.vercel.app](https://nora-lingua-hub.vercel.app)

**Demo walkthrough:** [https://youtu.be/yb8lrP7Impw](https://youtu.be/yb8lrP7Impw)

To run the project locally instead, follow [Getting Started](#getting-started) below.

---

## Statistics

NoraLingua Hub includes substantial seeded content out of the box:

| Metric | Count |
|---|---|
| **Active learning paths** | 9 (across A2, B1, B2 levels) |
| **Total lessons** | 55 (~30 reading + ~25 listening) |
| **Writing assignments** | 24 (IELTS Task 2 style) |
| **Comprehension questions** | 165+ multiple choice |
| **CEFR levels supported** | A1 to C2 (paths seeded for A2, B1, B2) |
| **Learning purposes** | Job, Travel, IELTS, Business, University, General |
| **Database tables** | 12 |
| **Server actions** | 8 |
| **API routes** | 12+ |
| **TypeScript files** | 100+ |

Larger tracks (B2 University, B2 General, B2 Job) include 10 lessons + 4 writing assignments each, with full reading + listening alternation and IELTS-rubric writing prompts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, React Server Components) |
| **Language** | TypeScript (strict mode, no `any`) |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ORM** | Prisma 7 with PrismaPg driver adapter |
| **Authentication** | Supabase Auth (email + password) |
| **AI grading** | Anthropic Claude API (Claude Sonnet 4) |
| **Styling** | Tailwind CSS v4 + shadcn/ui components |
| **Icons** | Lucide React (no emoji) |
| **Fonts** | Playfair Display (serif), Inter (sans) |
| **Charts** | Recharts |
| **Audio** | Browser Web Speech API (TTS for listening lessons) |
| **Validation** | Zod |
| **Deployment** | Vercel |

### Why these choices?

- **Next.js 16 with App Router** lets us mix Server Components (fast initial load, secure data fetching) with Client Components (interactive UI) without ceremony.
- **Prisma + Supabase** gives a typed schema with managed Postgres, generous free tier, and built-in authentication.
- **Anthropic Claude** was chosen over GPT for the writing examiner role because Claude follows long structured rubrics more reliably and produces more nuanced literary feedback in our testing.
- **Web Speech API** for audio avoids the cost of hosting recorded files while still giving learners a real listening experience.
- **No emoji, only Lucide icons** is a deliberate aesthetic choice for a polished, professional look appropriate for adult learners.

---

## Key Features

### For Students

- **3-step onboarding** that determines the learner CEFR level, learning purpose, and target skill, then assigns a teacher and routes them into the correct path.
- **Personalized dashboard** showing skill mastery rings (Reading / Listening / Writing / Speaking), upcoming Speaking sessions, latest writing feedback excerpt, writing progress chart, milestone tracking, and activity feed.
- **Reading lessons** with comprehension questions and instant per-question feedback (correct = green check, incorrect = red X with explanation).
- **Listening lessons** with audio playback (Web Speech API, British and American voices) and a "Show transcript" disclosure for stuck learners.
- **Writing assignments** that are graded by Claude using the IELTS 0-9 band system. Each submission receives:
  - An overall band score (0-9)
  - Four per-criterion bands (Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy)
  - An "examiner summary" explaining what worked and what to refine
  - A **Band 9 rewrite** of the student text
  - Annotations highlighting specific issues in the original text
- **Speaking sessions** that students book with their assigned teacher and join via embedded Zoom links.
- **Submission recovery** - if a learner returns to a writing assignment they previously submitted, a gold banner shows their score and links to the graded feedback. The textarea remains active for re-attempts.
- **Draft autosave** for writing assignments via browser localStorage with debounced 1.2-second writes.
- **Progress persistence** -- scores are saved to the database, so a student can refresh, sign out, or come back tomorrow without losing their work.

### For Administrators

- **Role-based dashboard** restricted to admin accounts.
- **Read-only view** of cohort progress across students.
- **Authorization filters** so admins see all students, but students cannot access admin routes.
- **Six institutional dashboards** with bulk operations (lock/unlock submissions in batch).



### Cross-cutting

- **Path ownership enforcement** -- students cannot view paths outside their assigned level + purpose.
- **Loading states** for every async route (skeleton placeholders matching the final layout).
- **WCAG AA color contrast** throughout.
- **Server-side input validation** with Zod on every server action.

---

## File Structure

```
noralingua-hub/
+-- prisma/
|   +-- schema.prisma           # Database schema (12 models)
|   +-- seed.ts                 # Original seed (6 tracks)
|   +-- seed-extra.ts           # Extended seed (B2 University, General, Job tracks)
+-- src/
|   +-- app/
|   |   +-- (auth)/             # Login, register, onboarding
|   |   +-- dashboard/          # Student and admin dashboards
|   |   +-- paths/              # Skill-filtered lesson lists
|   |   +-- lessons/[id]/       # Reading and listening lessons
|   |   +-- assignments/[id]/   # Writing assignments
|   |   +-- submissions/[id]/   # Graded writing feedback view
|   |   +-- admin/              # Admin-only pages
|   |   +-- actions/            # Next.js server actions
|   |   +-- api/                # API routes
|   +-- components/
|   |   +-- lessons/            # LessonReader, ListeningPlayer
|   |   +-- writing/            # WritingComposer
|   |   +-- speaking/           # SpeakingBooker
|   |   +-- progress/           # Dashboard cards
|   |   +-- admin/              # Admin sections
|   |   +-- shared/             # TopNav, FlashMessage, Skeleton
|   +-- lib/
|   |   +-- prisma.ts           # Prisma singleton
|   |   +-- path-guard.ts       # Path ownership enforcement
|   |   +-- progress-stats.ts   # Dashboard data aggregation
|   |   +-- supabase/           # Supabase client setup
|   |   +-- claude/             # Anthropic API integration
|   |   +-- constants.ts        # CEFR levels, purposes, skill metadata
|   +-- generated/
|       +-- prisma/             # Generated Prisma client (gitignored)
+-- public/                     # Static assets
+-- .env.local                  # Environment variables (NOT committed)
+-- .env.example                # Template
+-- DESIGN.md                   # Technical design document
+-- README.md                   # This file
+-- package.json
```

---

## Database Schema (Quick Reference)

| Model | Purpose |
|---|---|
| `User` | Student or admin account, linked to Supabase Auth |
| `Level` | CEFR levels (A1, A2, B1, B2, C1, C2) |
| `Purpose` | Learning purposes (JOB, TRAVEL, IELTS, BUSINESS, UNIVERSITY, GENERAL) |
| `MaterialSet` | Joins one Level + one Purpose; container for a learner path |
| `Lesson` | Reading or Listening lesson within a MaterialSet |
| `Question` | Multiple-choice comprehension question on a Lesson |
| `Answer` | One option for a Question (one is marked correct) |
| `WritingAssignment` | An IELTS-style writing prompt within a MaterialSet |
| `Submission` | A student writing response, graded by Claude |
| `Progress` | Per-student lesson completion tracking |
| `Teacher` | Speaking-session teacher with bio and Zoom URL |
| `SpeakingBooking` | A student reserved Speaking session |

For full design rationale, see [DESIGN.md](./DESIGN.md).

---

## Routes Reference

| Path | Type | Access |
|---|---|---|
| `/` | Public landing page | Public |
| `/login` | Sign in | Public |
| `/register` | Sign up | Public |
| `/onboarding` | 3-step CEFR + purpose + skill selection | Authenticated, not yet onboarded |
| `/dashboard` | Student or admin dashboard (role-aware) | Authenticated, onboarded |
| `/paths/[level]/[purpose]` | Path overview (4 skill cards) | Owns this path |
| `/paths/[level]/[purpose]/[skill]` | Skill-filtered list | Owns this path |
| `/lessons/[id]` | Reading or listening lesson | Owns this path |
| `/assignments/[id]` | Writing assignment composer | Owns this path |
| `/submissions/[id]` | Graded writing feedback | Owner of submission |
| `/admin/*` | Admin-only pages | ADMIN role |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- A **Supabase account** (free tier) -- [supabase.com](https://supabase.com)
- An **Anthropic API key** -- [console.anthropic.com](https://console.anthropic.com)

### Installation

1. **Clone or extract:**

   ```bash
   git clone <repo-url>
   cd noralingua-hub
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your own values (see [Environment Variables](#environment-variables)).

4. **Generate the Prisma client:**

   ```bash
   npx prisma generate
   ```

5. **Push the schema to your Supabase database:**

   ```bash
   npx prisma db push
   ```

6. **Seed the database:**

   ```bash
   npx tsx prisma/seed.ts
   npx tsx prisma/seed-extra.ts
   ```

7. **Run the dev server:**

   ```bash
   npm run dev
   ```

8. **Open** [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# === Supabase ===
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

# === Anthropic Claude ===
ANTHROPIC_API_KEY="sk-ant-..."
```

Find Supabase credentials in **Settings -> API**. Find Anthropic key at [console.anthropic.com](https://console.anthropic.com).

---

## Test Accounts for Graders

> **Note:** This is a sandbox account seeded specifically for grading. It contains no real personal data.

A verified test account is provided below. It is signed up at the **B2 + University** path, which is the largest seeded track (10 lessons + 4 writing assignments) and includes a previously graded writing submission so you can immediately see the AI feedback flow.

| Role | Email | Password | Level | Purpose |
|---|---|---|---|---|
| Student (Primary) | `b2jobb@noralingua.com` | `12345678` | B2 | JOB |
| Student (Backup) | `a2trav@noralingua.com` | `12345678` | A2 | TRAVEL |
| Admin | `admin@noralingua.edu.sa` | `NoraAdmin2026` | - | - |

### If the test account does not work

You can create a fresh account in under one minute:

1. Go to [http://localhost:3000/register](http://localhost:3000/register) (or the equivalent Vercel URL)
2. Enter any email, your name, and a password (8+ characters)
3. Complete the 3-step onboarding by selecting:
   - **Level:** B2 (recommended for the fullest content experience)
   - **Purpose:** University, Job, or General (each has 10 lessons + 4 writing assignments)
   - **Skill:** Any
4. You will be routed to the dashboard with full access to your assigned path

### Why two test accounts plus admin

A verified primary account at the largest seeded path (B2 + JOB) gives you the fullest content experience. The backup account (A2 + TRAVEL) is provided in case the primary account is affected by any password reset during grading. The admin account lets you explore the role-aware admin dashboards.

### Why one test account instead of many

A single verified account that we know works is more reliable than a long list of accounts that may have been affected by password resets during development. The `/register` flow takes under a minute and gives you the complete student experience from onboarding onward.


## Suggested Test Scenarios

### Scenario 1: Full student journey (~5 min)

1. Sign in as `b2jobb@noralingua.com` / `12345678`
2. From the dashboard, click the **Listening** skill ring
3. Click into "Office hours: a student-tutor exchange"
4. Press play -- audio is generated by the browser Web Speech API
5. Answer the 3 comprehension questions and submit
6. Observe per-question feedback (green check / red X + explanation)
7. Refresh the page -- score persists from the database

### Scenario 2: AI-graded writing (~3 min)

1. Still signed in as `b2jobb@noralingua.com`
2. Click **Writing** on the dashboard
3. Open "Universities and employment"
4. Type at least 200 words
5. Submit for grading
6. Wait ~10 seconds for Claude to return:
   - An overall band score (0-9)
   - Four per-criterion bands
   - An examiner summary
   - A Band 9 rewrite

### Scenario 3: Submission recovery (~1 min)

1. After completing Scenario 2, navigate back to the Writing tab
2. Open the same "Universities and employment" assignment
3. Notice the gold "Previously submitted" banner showing your score and date
4. Click "View feedback" to return to the graded view, or write a new response below to re-attempt

### Scenario 4: Speaking session booking (~2 min)

1. Click **Speaking** on the dashboard
2. View available time slots
3. Reserve a slot
4. Observe the booking with a "Join Zoom" button


---

## Demo Video Reference

The 3-minute demo video walks through:

1. **Project introduction** (0:00 - 0:30): title, author (Nora Aldossari), year (2026), CSCI E-50 affiliation, Computer Science concentration, location (Riyadh, Saudi Arabia)
2. **The problem** (0:30 - 1:00): why personalized language learning matters, why level + purpose combinations are necessary
3. **Live demo** (1:00 - 2:30): walking through the student journey using `b2jobb@noralingua.com`:
   - Dashboard with skill rings
   - Reading lesson + comprehension questions
   - Listening lesson with audio playback
   - Writing assignment with AI grading
4. **Closing** (2:30 - 3:00): tech stack summary, future plans, acknowledgements

The video uses the test accounts in this README, so graders can replicate the demo themselves.

---

## Troubleshooting

### `npx prisma db push` fails with connection error

Verify your `DATABASE_URL` is the **pooled** connection string (port 6543, includes `pgbouncer=true`).

### "Lessons seeded: 0" when running the seed scripts

The seed scripts are idempotent and skip rows that already exist. If you want to wipe and re-seed, run `npx prisma migrate reset` followed by the seed commands.

### Anthropic Claude API returns an error during writing grading

Confirm `ANTHROPIC_API_KEY` is set in `.env.local` and that the key has an active billing plan.

### TypeScript errors when running `npm run build`

Some pre-existing TypeScript strictness warnings may surface during the production build. They do not affect functionality. The dev server (`npm run dev`) runs fine.

### Audio does not play on listening lessons

The Web Speech API requires a modern browser (Chrome, Edge, Safari, Firefox all supported). Check system volume and browser audio permissions for `localhost:3000`.

### Onboarding seems stuck

Complete all 3 onboarding steps. Clicking the browser back button mid-onboarding can leave the user in an inconsistent state. Sign out and back in to recover.

---

## Architecture and Design

For a detailed walkthrough of the database schema, the rationale behind the IELTS 0-9 grading scale, the role-aware UI architecture, and the Claude prompt-engineering decisions, see **[DESIGN.md](./DESIGN.md)**.

A few highlights:

- **The path system** is built around a `MaterialSet` table that joins one `Level` to one `Purpose`. A learner level + purpose choice during onboarding maps them to exactly one MaterialSet.
- **Writing grading** is fully server-side via Anthropic API. The grading prompt asks Claude to act as an IELTS examiner, return strictly structured JSON, and produce a Band 9 rewrite.
- **Audio** uses the browser Web Speech API rather than pre-recorded files. This avoids hosting costs and supports multiple accents (en-GB, en-US).
- **Authentication** is handled by Supabase. Server components verify the user, and a `path-guard` utility ensures students cannot view paths outside their assigned level + purpose.
- **Submission recovery pattern** ensures learners returning to a previously-submitted writing assignment see a gold banner with their score and a link to the graded feedback, while keeping the textarea active for re-attempts.

---

## Submission Notes

- The video demo is uploaded to YouTube as **unlisted** and linked at the top of this README.
- The Gradescope zip excludes `node_modules`, `.next`, `.env`, and any backup folders.
- The verified test account and a register-fallback option are provided in the [Test Accounts](#test-accounts-for-graders) section.

---

## Acknowledgements

This project was built as the final project for **CSCI E-50 at Harvard Extension School (2026)**. The course gave me the structured foundation to grow from beginner to building production-grade full-stack systems.

Special thanks to David Malan, Carter Zenke, and the CS50 staff for designing a course that demands genuine effort and rewards it with real understanding.

---

_Built with intention, in Riyadh, 2026._
