# DESIGN.md -- NoraLingua Hub

This document is a technical tour of NoraLingua Hub. It explains the major design decisions made during development, the alternatives considered, and the reasoning behind each choice. It assumes familiarity with full-stack web development concepts.

For installation and usage instructions, see [README.md](./README.md).

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [The Path System](#the-path-system)
3. [Database Schema](#database-schema)
4. [Authentication and Authorization](#authentication-and-authorization)
5. [The AI Examiner: Writing Grading with Claude](#the-ai-examiner-writing-grading-with-claude)
6. [The Listening Audio Decision](#the-listening-audio-decision)
7. [The Speaking Module: Booking Over Streaming](#the-speaking-module-booking-over-streaming)
8. [The IELTS 0-9 Grading Scale](#the-ielts-0-9-grading-scale)
9. [Role-Aware UI Architecture](#role-aware-ui-architecture)
10. [State Management Strategy](#state-management-strategy)
11. [Server Components vs Client Components](#server-components-vs-client-components)
12. [The Submission Recovery Pattern](#the-submission-recovery-pattern)
13. [The Autosave Architecture](#the-autosave-architecture)
14. [Error Handling and Validation](#error-handling-and-validation)
15. [Trade-offs and Future Work](#trade-offs-and-future-work)

---

## Design Philosophy

Three principles guided every major decision:

1. **The learner experience is the product.** Every technical choice was evaluated by asking: does this make the experience faster, calmer, or more useful for an adult who is trying to learn English while working a full-time job? Polished interactions, sensible defaults, and respectful error states are not optional polish; they are the product.

2. **Server-side trust, client-side responsiveness.** Anything security-sensitive (correct answers, grading rubrics, role checks) lives on the server and is never exposed to the browser. Anything interactive (textareas, audio players, answer selections) runs on the client for instant feedback. The boundary is drawn carefully and consistently.

3. **Internal ownership over vendor lock-in.** I chose tools that are popular, open, and replaceable. If Supabase disappears tomorrow, the Prisma schema and most server actions move to any Postgres host. If Anthropic prices change, the writing-grading interface is one file. This was a deliberate counter to the institutional tendency to depend on closed systems.

---

## The Path System

### The problem

Adult English learners differ on two independent dimensions: **how much English they already know** (CEFR level: A1 to C2) and **why they are studying** (purpose: Job, Travel, IELTS, Business, University, General). A learner studying for IELTS at B2 has very different content needs from a learner at the same level studying for travel.

### The decision

Each combination of (level, purpose) is its own learner path, modeled as a `MaterialSet` row that joins one `Level` to one `Purpose`. Lessons and writing assignments belong to a MaterialSet. A user is assigned exactly one (level, purpose) during onboarding and routed to that MaterialSet.

```
User --assigned--> (Level + Purpose) --> MaterialSet --> Lessons + WritingAssignments
```

### Alternatives considered

- **A flat list of lessons tagged with level and purpose.** Rejected because it forces a query like "give me all lessons where level=B2 AND purpose=UNIVERSITY" on every page load, which scales poorly and makes content authoring harder.
- **A graph of prerequisite lessons.** Considered for a future version; rejected for v1 because it adds significant authoring overhead without clear pedagogical gain at the early MVP stage.
- **A single big "syllabus" model with all skills together.** Rejected because it conflates orthogonal concerns (a learner level is fixed, but their interest in different skills varies day-to-day).

### Why this matters

The MaterialSet abstraction is the single most important design decision in the project. It makes the rest of the schema simple. Every Lesson belongs to exactly one MaterialSet. Every WritingAssignment belongs to exactly one MaterialSet. Skill filtering becomes a `WHERE skill = LISTENING` clause inside one MaterialSet, not a join across the whole database.

---

## Database Schema

The schema has 12 main models. The shape is normalized, with foreign keys flowing in one direction: from leaves (Answer, Submission, Progress) toward roots (User, Level, Purpose).

### Why 12 tables, not fewer?

I considered embedding `answers` as a JSON array on the `Question` row, which would cut the table count to 11. I rejected that because:

- Querying "how many answers exist?" becomes harder with JSON
- Migration safety is weaker (a typo in a JSON field is silent)
- Foreign-key constraints catch bugs that JSON validation misses

The cost of one extra table is small; the cost of choosing JSON for what is fundamentally relational data is paid every time the schema needs to evolve.

### Why 12 tables, not more?

I considered separating `Submission` into `Submission` plus `SubmissionGrade` to keep grading metadata distinct from the student text. I rejected that because every Submission has exactly one grade in this app lifecycle, so the 1:1 relation is just ceremony. If grading ever became a multi-step pipeline (draft grade -> human review -> final grade), I would split them at that point.

### Cascading deletes

When a User deletes their account, their Progress, Submissions, and SpeakingBookings cascade. MaterialSets, Lessons, and content do NOT cascade -- they are institutional content, not personal data.

### Indexes

Compound indexes are placed on `(userId, lessonId)` for Progress and `(userId, assignmentId)` for Submissions, since these are the dominant query patterns on the dashboard.

---

## Authentication and Authorization

### Why Supabase Auth

I chose Supabase Auth over rolling my own (with libraries like NextAuth) because:

- It handles email confirmation, password reset, and session management correctly out of the box
- It uses the same Postgres instance as the rest of the data, so the User table can hold a foreign key to `auth.users` without ceremony
- The free tier covers thousands of users, far beyond the cohort size needed for v1

### How authorization works

Authorization runs in two layers:

**Layer 1: Authentication.** Every server component starts by calling `supabase.auth.getUser()` and redirects to `/login` if no user is returned. This is a one-line check at the top of every protected page.

**Layer 2: Path ownership.** A `path-guard.ts` utility checks whether the URL (level, purpose) matches the user assigned path. If they do not match, the user is **redirected** to their dashboard with a flash message -- not 404 d. The redirect is more humane: a 404 reads as "this URL is broken"; a redirect reads as "you took a wrong turn, here is where you belong."

### Why redirect rather than 404?

A learner who manually edits the URL is exploring or curious, not malicious. The graceful redirect respects that curiosity. A 404 would feel punitive.

### Role-based access

Admin routes check `user.role === ADMIN` server-side. Students cannot reach admin pages even by typing the URL because the role check runs before any data fetches. The role is read from the database, not the JWT, so a student promoted to admin gets immediate access on their next request.

---

## The AI Examiner: Writing Grading with Claude

### The problem

A learner who finishes writing a 250-word IELTS essay needs feedback that is specific, fair, and pedagogically useful. Manual grading would not scale. A simple keyword count or grammar checker would not be specific enough.

### The decision

Each writing submission is sent to Anthropic Claude API with a long, carefully engineered prompt. Claude is instructed to act as an IELTS examiner, return strictly structured JSON, and produce a Band 9 rewrite of the student text.

### Prompt engineering decisions

The grading prompt is roughly 800 words long and includes:

1. **Role definition.** "You are an IELTS examiner with 15 years of experience. You grade fairly and explain your reasoning clearly."
2. **Rubric specification.** The full IELTS Writing Task 2 band descriptors for all four criteria (Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy), each with examples.
3. **Output schema.** A strict JSON shape that the response must follow. The schema is parsed and validated with Zod after the API call returns; any malformed output triggers a retry.
4. **Calibration anchors.** Examples of Band 5 vs Band 7 vs Band 9 responses for the same prompt, so the model has reference points.
5. **Band 9 rewrite instruction.** "After grading, rewrite the student response at Band 9 level, preserving their argument and personal voice as much as possible."

### Why Claude over GPT

I tested both models on the same submissions during development. Claude:

- Followed long structured rubrics more reliably
- Produced more nuanced, less formulaic feedback
- Was more consistent across repeated calls on the same input
- Generated more natural Band 9 rewrites that did not read as template-driven

GPT was competitive on raw band assignment, but its feedback tended toward generic ("good vocabulary, work on coherence") where Claude pointed at specific sentences.

### Reliability strategies

The grading flow includes:

- **Retry on malformed JSON.** If Claude returns non-parseable output, the call retries up to 2 times with a clarifying instruction.
- **Zod validation.** The parsed JSON is validated against a schema before storage. If validation fails after retries, the user sees a friendly "grading temporarily unavailable, your draft is saved" message rather than a crash.
- **Idempotent storage.** Each submission stores the full Claude response, including the prompt version used. If we ever change the rubric, old submissions remain valid.

### Cost considerations

A single grading call costs roughly 0.04 to 0.08 USD in API fees (depending on response length). For a cohort of 50 students writing 4 essays each, that is 8 to 16 USD total. The economics work for any institutional pilot.

---

## The Listening Audio Decision

### The choice

Listening lessons use the **browser Web Speech API** (`SpeechSynthesisUtterance`) rather than pre-recorded audio files. The lesson `audioUrl` field stores a marker like `tts:en-GB` or `tts:en-US`; the `ListeningPlayer` component reads the marker, picks a matching voice, and synthesizes the audio at playback time.

### Why this works for v1

- **Zero hosting cost.** Audio files at scale would require Supabase Storage or a CDN, both with bandwidth costs.
- **Instant playback.** No download delay; the browser starts speaking within milliseconds.
- **Multi-accent support.** British English (en-GB) and American English (en-US) are both available on every modern browser.
- **Offline-friendly.** Once the page is loaded, audio works without further network requests.

### What we lose

- **Voice quality varies.** Edge on Windows produces very natural voices; Chrome on Linux less so. This is acceptable for an MVP serving cohort sizes in the dozens.
- **No background music or sound effects.** Pure speech only.
- **Some browsers cancel speech when the tab loses focus.** The component handles this by restarting on resume.

### Future plan

When the cohort grows or the content matures, we will swap the synthesis engine for ElevenLabs or Google Cloud TTS, generate audio files at content-creation time, and host them on Supabase Storage. The component interface stays the same; only the playback engine changes.

---

## The Speaking Module: Booking Over Streaming

### The problem

Speaking practice requires real human conversation. AI conversation partners exist, but for adult learners aiming at IELTS Speaking or workplace fluency, there is no substitute for a human teacher.

### The decision

Speaking is implemented as a **booking system**: students reserve time slots with their assigned teacher, and the booking row stores a Zoom URL. At session time, the student clicks "Join Zoom" from their dashboard.

### Why not build streaming in-app?

I considered a custom WebRTC implementation. I rejected it because:

- WebRTC is hard to do well, even with libraries
- Zoom is already deployed and trusted in educational contexts
- Recording, transcription, and accessibility (closed captions) come free with Zoom
- The institution already has Zoom licensing in many cases

### Trade-off

Students leave the app for the actual session. This breaks the "single-tab learning experience" some platforms aim for. I judged that the reliability and accessibility gains outweigh the UX continuity loss.

---

## The IELTS 0-9 Grading Scale

### Why IELTS, not a 0-100 scale

The original proposal called for 0-100 grading. I deliberately changed this to IELTS 0-9 mid-development.

Reasons:

1. **Calibrated rubric.** IELTS has decades of public band descriptors. A "Band 6" is a known quantity worldwide; a "63/100" means nothing without context.
2. **Existing learner familiarity.** Adult IELTS candidates already know the bands. Showing them a number they recognize is more useful than translating to a custom scale.
3. **Per-criterion meaningfulness.** Showing TR=7, CC=6, LR=7, GR=5 is more informative than "you scored 64% overall." Learners can see exactly where to focus.

### Why this is in DESIGN.md and not just a passing note

This was a deliberate pedagogical upgrade from the proposal, not a feature addition. It changes how the AI is prompted, how scores are stored in the database, and how the dashboard presents progress. The decision is small in lines of code but large in product impact.

---

## Role-Aware UI Architecture

The same `/dashboard` URL renders different layouts depending on `user.role`:

- **Students** see their personal learner profile, skill mastery rings, upcoming sessions, latest feedback excerpt, writing journey chart, milestones, and activity feed.
- **Admins** see cohort-level stats, six institutional dashboards, and bulk-operation controls (lock/unlock submissions in batch).

### Why one URL for both roles

I considered separate routes (`/student-dashboard` and `/admin-dashboard`). I chose one URL because:

- Roles can change (a student gets promoted to admin); a single URL means no redirect surprises
- The shared chrome (top nav, theme, footer) does not have to be duplicated
- Server components can branch on role with `if (user.role === ADMIN)` in one file

### How content is composed

The dashboard page imports both `StudentDashboard` and `AdminDashboard` components and renders one based on role. Each component owns its data fetching, so a student dashboard never accidentally queries admin data and vice versa.

---

## State Management Strategy

The app deliberately avoids a global state library (Redux, Zustand, etc.).

### Why no global state library

- **React Server Components handle most state already.** Data fetched server-side is just props.
- **URL as state.** Filters, current path, current lesson -- all encoded in the URL, so refreshing or sharing a link Just Works.
- **Component-local state for ephemeral concerns.** Textarea contents, modal open/closed, toast visibility -- all `useState` in the component that owns them.
- **localStorage for browser persistence.** Writing autosave drafts persist across sessions without involving a state library.

### What this costs

We do not have an in-memory cache shared across components. The dashboard refetches data on each visit. For an app at this scale, the simplicity is worth the small redundancy.

---

## Server Components vs Client Components

The app uses Next.js App Router, which makes the choice between Server and Client Components explicit.

### Server Components

Used for: lesson page wrappers, dashboard data fetching, the path overview pages, the admin dashboard.

Why: They have direct database access, never run on the client, and are smaller in shipped JavaScript.

### Client Components

Used for: WritingComposer, LessonReader, ListeningPlayer, SpeakingBooker, anything with interactive state.

Why: They handle user input, animation, and audio playback -- none of which can run server-side.

### The boundary

A Server Component renders Client Components and passes data as props. The Client Component is the smallest possible interactive unit; the Server Component owns everything around it. This minimizes the JavaScript shipped to the browser without sacrificing interactivity.

---

## The Submission Recovery Pattern

### The problem

A learner submits a writing assignment, sees their AI-graded feedback (band score, examiner summary, Band 9 rewrite), then later returns to the same writing assignment URL. The default Next.js behavior is to render a fresh empty assignment page -- the learner has lost visibility into their own past work.

### The decision

The assignment page (`/assignments/[id]`) now performs a database lookup for the user latest graded submission. If one exists, the page renders a gold "Previously submitted" banner above the prompt:

```
+-------------------------------------------------------------+
|  PREVIOUSLY SUBMITTED                                       |
|  You scored 6.0 / 9 on 9 May 2026.                          |
|  View your graded feedback, or write a new response below   |
|  to re-attempt. View feedback ->                            |
+-------------------------------------------------------------+
```

The textarea below stays active so the learner can re-attempt; on submit, the new submission becomes the latest.

### Why this design

I considered three alternatives:

1. **Auto-redirect to `/submissions/[id]` if a graded submission exists.** Rejected because it removes the learner ability to re-attempt without an extra "Try again" button.
2. **Hide the textarea until a "Re-attempt" toggle is clicked.** Rejected as unnecessary friction; the learner already chose to come back to this page.
3. **The banner pattern (chosen).** It surfaces the past work prominently without blocking new work. It is informative without being prescriptive.

### Why the score is the headline of the banner

A learner who has put effort into an essay cares first about how it was scored. Putting the band score in the banner -- in the same gold-on-navy serif used elsewhere -- makes the banner feel like a reward rather than a notification. It anchors the page in past achievement before introducing the prompt for the next attempt.

---

## The Autosave Architecture

Writing assignments often take 20+ minutes. Losing a draft to a refresh, tab close, or accidental navigation would be cruel.

### The implementation

The `WritingComposer` component:

1. Reads the textarea value into React state on every keystroke
2. Debounces writes by 1.2 seconds (so we do not write on every keypress)
3. Writes to `localStorage[noralingua-writing-draft-v1-<assignmentId>]`
4. Shows a "Saved a moment ago" indicator
5. On mount, reads back from localStorage and restores any draft

### Why localStorage and not the database

localStorage gives:

- Zero network round-trip per write
- Privacy (drafts never leave the browser)
- No infrastructure cost

The trade-off is that drafts do not roam across devices. For v1 cohort sizes, this is acceptable. v2 will add server-side draft persistence so a student can start an essay on their phone and finish on their laptop.

### Defensive design

The component includes attributes (`data-gramm="false"`, `spellCheck={false}`) to opt out of Grammarly and similar browser extensions that can interfere with React-controlled textareas.

---

## Error Handling and Validation

Every server action validates its input with **Zod** before doing any work. This catches:

- Malformed payloads (wrong types, missing fields)
- Out-of-range values (a band score of 11)
- Invalid IDs (a question that does not exist on the claimed lesson)

When validation fails, the action returns `{ success: false, error: "..." }` with a human-readable message. Client components show this in a flash banner rather than crashing.

When the server itself crashes (database unreachable, API timeout), the user sees a friendly fallback page with a retry button. The actual error is logged to the server console for the developer.

---

## Trade-offs and Future Work

### Engineering debt

- The seed scripts run sequentially with one query per row. For 100+ lessons, this is slow (30 to 60 seconds). v2 plan: batch inserts.
- A small number of TypeScript strictness warnings remain in the codebase (e.g., legacy `JSX` namespace references). They do not affect runtime; they are cleanup work.

### Scope deferred to v2

- **Server-side draft persistence.** Writing draft autosave is currently browser-local. Drafts do not roam across devices. v2 plan: persist drafts to the database with conflict resolution so a student can start an essay on their phone and finish on their laptop.
- **Speaking sessions use external Zoom.** The student leaves the app for the call. v2 plan: optional in-app embed with Zoom Meeting SDK.
- **Audio is browser TTS.** Voice quality varies. v2 plan: pre-recorded audio with ElevenLabs or Google Cloud TTS.
- **No mobile app.** The web app is responsive but not installable. v2 plan: PWA installation and offline-first caching of lesson content.
- **Single language target.** The platform teaches English only. v2 plan: extend to Arabic, Spanish, etc., with the same level + purpose model.

### What I would do differently

If I were starting again with what I know now:

1. I would design the IELTS 0-9 grading from day one, not bolt it on mid-project.
2. I would use Drizzle instead of Prisma. The Prisma driver-adapter migration in v7 was painful; Drizzle queries are also more type-safe in subtle ways.
3. I would write the seed scripts to use SQL `COPY` or batch inserts from the start.

---

## Closing thought

NoraLingua Hub is a teaching tool, but building it taught me as much as I hope it teaches its learners. Every section above is the trace of a problem I had to think through carefully, often more than once. The result is not perfect, but it is honest, specific, and built with care.

-- Nora Aldossari, Riyadh, 2026
