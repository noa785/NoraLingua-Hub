import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, BookOpen, Headphones, PenLine, Sparkles, Clock } from "lucide-react";

import { LessonReader } from "@/components/lessons/LessonReader";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

import type { Metadata } from "next";
import type { SkillType } from "@/generated/prisma";


type PageProps = {
  params: Promise<{ id: string }>;
};


export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where:  { id },
    select: { title: true },
  });
  return {
    title:       lesson?.title ?? "Lesson",
    description: "Read the lesson, then answer the comprehension questions.",
  };
}


/*
  Lesson page (Server Component).

  Fetches the lesson plus its questions, answers, and the user's
  existing progress. Passes everything to LessonReader, which is
  a Client Component that handles answer selection, audio
  playback (for listening lessons), submission, and feedback.

  Why split server and client like this?
    Reading the lesson and seeing the questions is server work.
    Selecting answers, hearing audio, and showing feedback after
    submit is client work. The boundary keeps the initial paint
    fast while still letting us ship rich interaction.

  Why hide the article body for listening lessons?
    For listening lessons, the audio player owns the experience.
    Showing the full transcript above the audio defeats the
    purpose -- the learner could just read instead of listen.
    The transcript still lives behind a "Show transcript"
    disclosure inside the audio player, which lets a stuck
    learner peek if they need to.
*/


export default async function LessonPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      materialSet: {
        include: {
          level:   true,
          purpose: true,
        },
      },
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          answers: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!lesson) notFound();

  // Existing progress (if user revisits a lesson they already finished)
  const progress = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId:   user.id,
        lessonId: lesson.id,
      },
    },
  });

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

      {/* LESSON HEADER */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl" />
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10 lg:px-8 lg:pt-20">

          <Link
            href={`/paths/${lesson.materialSet.level.key.toLowerCase()}/${lesson.materialSet.purpose.key.toLowerCase()}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to {lesson.materialSet.title}
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
              {lesson.materialSet.level.key} &middot; {lesson.materialSet.purpose.name}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              {renderSkillIcon(lesson.skill)}
              {capitalizeSkill(lesson.skill)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              <Clock className="h-3 w-3" strokeWidth={2} />
              {lesson.estimatedMinutes} min
            </span>
          </div>

          <h1 className="font-serif text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
            {lesson.title}
          </h1>

        </div>
      </section>

      {/*
        LessonReader handles everything below the title:
        the listening audio player (if any), the article body
        (for reading lessons), the comprehension questions, the
        submit button, and the per-question feedback.
      */}
      <section>
        <div className="mx-auto max-w-3xl px-6 pb-20 lg:px-8 lg:pb-28">
          <LessonReader
            lesson={{
              id:               lesson.id,
              title:            lesson.title,
              skill:            lesson.skill,
              content:          lesson.content,
              audioUrl:         lesson.audioUrl,
              estimatedMinutes: lesson.estimatedMinutes,
            }}
            questions={lesson.questions.map((q) => ({
              id:          q.id,
              prompt:      q.prompt,
              sortOrder:   q.sortOrder,
              explanation: q.explanation,
              answers:     q.answers.map((a) => ({
                id:   a.id,
                text: a.text,
              })),
            }))}
            alreadyCompleted={Boolean(progress?.isCompleted)}
            savedScore={
              progress && progress.isCompleted && progress.totalQuestions > 0
                ? {
                    correct: progress.correctAnswers,
                    total:   progress.totalQuestions,
                  }
                : null
            }
          />
        </div>
      </section>

    </main>
  );
}


/* Renderers and small helpers below. */

function capitalizeSkill(skill: SkillType): string {
  return skill[0].toUpperCase() + skill.slice(1).toLowerCase();
}

function renderSkillIcon(skill: SkillType) {
  if (skill === "READING")   return <BookOpen   className="h-3 w-3" strokeWidth={2} />;
  if (skill === "LISTENING") return <Headphones className="h-3 w-3" strokeWidth={2} />;
  if (skill === "WRITING")   return <PenLine    className="h-3 w-3" strokeWidth={2} />;
  return <BookOpen className="h-3 w-3" strokeWidth={2} />;
}
