import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, PenLine, Sparkles, FileText, CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CEFR_LEVELS, PURPOSES } from "@/lib/constants";
import { WritingComposer } from "@/components/writing/WritingComposer";

import type { Metadata } from "next";


type PageProps = {
  params: Promise<{ id: string }>;
};


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const a = await prisma.writingAssignment.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title:       a?.title ?? "Writing assignment",
    description: "Submit your response and get instant AI grading.",
  };
}


/*
  Writing assignment page (Server Component).

  Fetches one assignment plus its parent MaterialSet (for the
  back link and the level/purpose tags). Renders the assignment
  header server-side, then hands the prompt down to
  WritingComposer (Client Component) which handles the textarea,
  word count, and submit action.
*/


export default async function AssignmentPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const assignment = await prisma.writingAssignment.findUnique({
    where: { id },
    include: {
      materialSet: {
        include: {
          level:   true,
          purpose: true,
        },
      },
    },
  });

  if (!assignment) notFound();

  /*
    Look up the user's most recent graded submission for this
    assignment. If one exists, we render a gold "previous attempt"
    banner above the prompt with a link to the graded feedback
    page. The textarea below stays usable so the learner can
    re-attempt; on submit the new submission becomes the latest.
  */
  const previousSubmission = await prisma.submission.findFirst({
    where: {
      userId:       user.id,
      assignmentId: assignment.id,
      bandOverall:  { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id:          true,
      bandOverall: true,
      createdAt:   true,
    },
  });

  const levelKey   = assignment.materialSet.level.key;
  const purposeKey = assignment.materialSet.purpose.key;
  const purposeName = PURPOSES.find((p) => p.key === purposeKey)?.name ?? purposeKey;
  const levelName   = CEFR_LEVELS.find((l) => l.key === levelKey)?.name ?? levelKey;

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
            <Link href="/dashboard" className="text-sm text-foreground/70 transition-colors hover:text-foreground">Dashboard</Link>
            <Link href="/paths" className="text-sm font-medium text-foreground transition-colors">Paths</Link>
          </nav>
        </div>
      </header>

      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl" />
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10 lg:px-8 lg:pt-20">

          <Link
            href={`/paths/${levelKey}/${purposeKey}/writing`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to writing prompts
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
              {levelKey} &middot; {purposeName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              <PenLine className="h-3 w-3" strokeWidth={2} />
              Writing
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              {assignment.minWords}-{assignment.maxWords} words
            </span>
          </div>

          <h1 className="font-serif text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
            {assignment.title}
          </h1>

        </div>
      </section>

      {/*
        PREVIOUS ATTEMPT BANNER

        Renders above the prompt when the learner has a graded
        submission on record for this assignment. Provides a
        direct link to the graded feedback page. The textarea
        below remains active so a re-attempt is possible.
      */}
      {previousSubmission ? (
        <section>
          <div className="mx-auto max-w-3xl px-6 pb-6 lg:px-8">
            <Link
              href={"/submissions/" + previousSubmission.id}
              className="group flex items-start gap-4 rounded-2xl border border-[#B8985A]/40 bg-[#B8985A]/[0.06] p-5 transition-colors hover:bg-[#B8985A]/[0.10]"
            >
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#B8985A] text-background">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                  Previously submitted
                </p>
                <p className="mt-1 text-base text-foreground">
                  You scored <span className="font-serif text-lg font-medium tracking-tight">{(previousSubmission.bandOverall ?? 0).toFixed(1)}</span> / 9 on{" "}
                  {previousSubmission.createdAt.toLocaleDateString("en-GB", {
                    day:   "numeric",
                    month: "long",
                    year:  "numeric",
                  })}
                  .
                </p>
                <p className="mt-1 text-sm text-foreground/65">
                  View your graded feedback, or write a new response below to re-attempt.
                </p>
              </div>
              <span className="self-center text-sm font-medium text-[#B8985A] group-hover:underline">
                View feedback -&gt;
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* PROMPT CARD */}
      <section>
        <div className="mx-auto max-w-3xl px-6 pb-10 lg:px-8">
          <div className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              The prompt
            </div>
            <p className="whitespace-pre-line text-base leading-[1.7] text-foreground/85">
              {assignment.prompt}
            </p>
          </div>
        </div>
      </section>

      {/* COMPOSER (client) */}
      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Your response
            </p>
            <h2 className="mt-1 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-tight tracking-tight text-foreground">
              Write below.
            </h2>
            <p className="mt-3 text-sm leading-[1.65] text-foreground/70">
              Take your time. When you submit, an AI examiner will grade your response across {rubricCriteriaCount(assignment.rubricMode)} criteria and produce a Band 9 rewrite of your text.
            </p>
          </div>

          <WritingComposer
            assignmentId={assignment.id}
            minWords={assignment.minWords}
            maxWords={assignment.maxWords}
          />

        </div>
      </section>

    </main>
  );
}


function rubricCriteriaCount(_mode: string | null | undefined): string {
  // All rubric modes use 4 criteria; included as a function so future
  // rubrics with different counts are easy to support.
  return "four";
}
