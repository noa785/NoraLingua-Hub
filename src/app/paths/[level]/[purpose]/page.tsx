import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  PenLine,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { enforcePathOwnership } from "@/lib/path-guard";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";
import type { CefrLevel, PurposeKey, SkillType } from "@/generated/prisma";


type PageProps = {
  params: Promise<{
    level:   string;
    purpose: string;
  }>;
};


export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { level, purpose } = await params;
  return {
    title: `${level.toUpperCase()} ${capitalize(purpose)} path`,
    description: `Lessons for the ${level.toUpperCase()} ${capitalize(purpose)} learning path.`,
  };
}


/*
  Path detail page.

  Shows every lesson inside one MaterialSet, plus the path's
  writing assignment at the bottom. Lessons render as a vertical
  list so the order (sortOrder) reads naturally top-to-bottom,
  the way a book table of contents reads.

  Why fetch user progress here?
    The lesson list shows a subtle check badge next to lessons
    the user has already completed. That requires joining the
    Progress table by userId for each lesson. Fetching all
    progress rows for this user once and matching by lesson id
    is simpler than per-lesson queries.

  Why notFound() instead of redirect()?
    Hitting /paths/zz/garbage means the URL is bad, not that
    the user is unauthorized. notFound() is the correct
    semantic response: it shows the 404 page.
*/


export default async function PathDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Path access guard -- main path page
  const { level: _gLevel, purpose: _gPurpose } = await params;
  await enforcePathOwnership(user.id, _gLevel, _gPurpose);

  const { level: levelParam, purpose: purposeParam } = await params;
  const levelKey   = levelParam.toUpperCase()   as CefrLevel;
  const purposeKey = purposeParam.toUpperCase() as PurposeKey;

  // Validate the params before hitting the DB
  const validLevels: CefrLevel[]     = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const validPurposes: PurposeKey[]  = ["JOB", "TRAVEL", "UNIVERSITY", "IELTS", "BUSINESS", "GENERAL"];
  if (!validLevels.includes(levelKey))     notFound();
  if (!validPurposes.includes(purposeKey)) notFound();

  // Fetch the matching MaterialSet
  const materialSet = await prisma.materialSet.findFirst({
    where: {
      level:   { key: levelKey },
      purpose: { key: purposeKey },
    },
    include: {
      level:    true,
      purpose:  true,
      lessons:  {
        orderBy: { sortOrder: "asc" },
        include: {
          questions: { select: { id: true } },
        },
      },
      writingAssignments: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!materialSet) notFound();

  // Fetch the user's progress for these lessons in one query
  const progress = await prisma.progress.findMany({
    where: {
      userId:   user.id,
      lessonId: { in: materialSet.lessons.map((l) => l.id) },
    },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  return (
    <main className="min-h-screen">

      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/dashboard" className="group flex items-center font-serif text-xl tracking-tight text-foreground">
            NoraLingua
            <span aria-hidden="true" className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125" />
            Hub
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/dashboard" className="text-sm text-foreground/70 transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/paths" className="text-sm font-medium text-foreground transition-colors">
              Paths
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10 lg:px-8 lg:pt-20">

          <Link
            href="/paths"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All paths
          </Link>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            {materialSet.level.key} &middot; {materialSet.purpose.name}
          </div>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            {materialSet.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-[1.65] text-foreground/70 sm:text-lg">
            {materialSet.description}
          </p>

        </div>
      </section>

      {/* LESSONS */}
      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Lessons
            </p>
            <h2 className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-tight text-foreground">
              {materialSet.lessons.length} lessons in this path.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {materialSet.lessons.map((lesson, idx) => {
              const lessonProgress = progressByLesson.get(lesson.id);
              const isComplete = lessonProgress?.isCompleted ?? false;

              return (
                <LessonCard
                  key={lesson.id}
                  index={idx + 1}
                  lessonId={lesson.id}
                  title={lesson.title}
                  skill={lesson.skill}
                  estimatedMinutes={lesson.estimatedMinutes}
                  questionCount={lesson.questions.length}
                  isComplete={isComplete}
                />
              );
            })}
          </div>

        </div>
      </section>

      {/* WRITING ASSIGNMENT */}
      {materialSet.writingAssignments.length > 0 ? (
        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                Writing
              </p>
              <h2 className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-tight text-foreground">
                Practice your writing.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-[1.65] text-foreground/70">
                Submit a short response to be graded by AI. You will get a
                score and written feedback within seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {materialSet.writingAssignments.map((assignment) => (
                <WritingCard
                  key={assignment.id}
                  assignmentId={assignment.id}
                  title={assignment.title}
                  prompt={assignment.prompt}
                  minWords={assignment.minWords}
                  maxWords={assignment.maxWords}
                />
              ))}
            </div>

          </div>
        </section>
      ) : null}

    </main>
  );
}


/*
  LessonCard: one row in the lesson list. Layout:
    [skill icon] [number + title + meta]  [check or arrow]
  Hover lifts the card, border turns gold; completed lessons get
  a subtle gold ring and a check badge.
*/

const SKILL_ICONS: Record<SkillType, typeof BookOpen> = {
  READING:   BookOpen,
  LISTENING: Headphones,
  WRITING:   PenLine,
  SPEAKING:  PenLine,
};

const SKILL_LABELS: Record<SkillType, string> = {
  READING:   "Reading",
  LISTENING: "Listening",
  WRITING:   "Writing",
  SPEAKING:  "Speaking",
};

function LessonCard(props: {
  index:            number;
  lessonId:         string;
  title:            string;
  skill:            SkillType;
  estimatedMinutes: number;
  questionCount:    number;
  isComplete:       boolean;
}) {
  const Icon = SKILL_ICONS[props.skill];

  return (
    <Link
      href={`/lessons/${props.lessonId}`}
      className={[
        "group flex items-center gap-5 rounded-2xl border bg-background p-5 transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-[#B8985A] hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.15)]",
        props.isComplete
          ? "border-[#B8985A]/40 ring-1 ring-[#B8985A]/20"
          : "border-foreground/10",
      ].join(" ")}
    >
      {/* Skill icon tile */}
      <div
        className={[
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
          props.isComplete
            ? "bg-[#B8985A] text-[#0B1C3F]"
            : "bg-[#DCE6F2] text-foreground group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F]",
        ].join(" ")}
      >
        {props.isComplete ? (
          <Check className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        )}
      </div>

      {/* Title and meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
          <span>Lesson {props.index}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{SKILL_LABELS[props.skill]}</span>
        </div>
        <h3 className="mt-1 truncate font-serif text-lg font-medium tracking-tight text-foreground">
          {props.title}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-foreground/60">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {props.estimatedMinutes} min
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>{props.questionCount} questions</span>
        </div>
      </div>

      {/* Right-side arrow or completion label */}
      <div className="flex-shrink-0">
        {props.isComplete ? (
          <span className="rounded-full bg-[#B8985A]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B8985A]">
            Complete
          </span>
        ) : (
          <ArrowRight className="h-5 w-5 text-foreground/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground" strokeWidth={2} />
        )}
      </div>
    </Link>
  );
}


/* WritingCard: writing assignment teaser. Same shape as a path card. */

function WritingCard(props: {
  assignmentId: string;
  title:        string;
  prompt:       string;
  minWords:     number;
  maxWords:     number;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-foreground/10 bg-background p-6 transition-all duration-300 ease-out">

      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground">
        <PenLine className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <h3 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground">
        {props.title}
      </h3>
      <p className="mt-3 text-sm leading-[1.65] text-foreground/70">
        {props.prompt}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
        <span className="text-xs text-foreground/60">
          {props.minWords} to {props.maxWords} words
        </span>
        <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/60">
          AI grading coming soon
        </span>
      </div>

    </div>
  );
}


function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}
