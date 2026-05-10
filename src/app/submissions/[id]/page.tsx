import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  PenLine,
  Quote,
  Clock,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CEFR_LEVELS, PURPOSES } from "@/lib/constants";

import type { Metadata } from "next";


type PageProps = {
  params: Promise<{ id: string }>;
};


/*
  Submission result page.

  This is the wow page of the writing flow. It displays:
    1. Overall IELTS band score (large gold serif)
    2. Examiner summary
    3. Four criterion cards with score bars + per-criterion narrative
    4. Side-by-side: student's original text WITH inline coloured
       annotations (grammar=red, vocab=orange, content=blue) vs
       Claude's Band 9 rewrite
    5. Action: link back to the assignment / paths

  Why parse detailedFeedback from JSON in the page?
    The flat columns (bandOverall, bandCriterion1..4) hold the
    numbers. The string column detailedFeedback is JSON-encoded
    because it contains structured arrays (criteria narratives,
    annotations, rewrite) that don't justify their own tables.

  Why match annotations against the text via simple substring search?
    Claude is asked to copy phrases verbatim. A flat indexOf scan
    is enough to highlight them, and it tolerates Claude returning
    annotations in any order. We sort matched ranges by start index
    before rendering, then walk the text once, splitting it into
    plain chunks and highlighted spans.
*/


type Annotation = {
  text:    string;
  type:    "grammar" | "vocab" | "content";
  comment: string;
};


type DetailedFeedback = {
  rubricMode: "IELTS" | "EMAIL" | "POSTCARD" | "GENERAL";
  criteria: Array<{
    name:       string;
    score:      number;
    feedback:   string;
    evidence?:  string;
  }>;
  annotations?: Annotation[];
  rewrite: {
    title:       string;
    text:        string;
    explanation: string;
  };
};


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sub = await prisma.submission.findUnique({
    where:  { id },
    select: { assignment: { select: { title: true } } },
  });
  return {
    title:       sub?.assignment.title ?? "Your submission",
    description: "AI-graded writing submission with band scores and rewrite.",
  };
}


export default async function SubmissionPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: {
        include: {
          materialSet: {
            include: {
              level:   true,
              purpose: true,
            },
          },
        },
      },
    },
  });

  if (!submission) notFound();
  if (submission.userId !== user.id) {
    notFound();
  }

  let detailed: DetailedFeedback | null = null;
  if (submission.detailedFeedback) {
    try {
      detailed = JSON.parse(submission.detailedFeedback) as DetailedFeedback;
    } catch {
      detailed = null;
    }
  }

  const assignment = submission.assignment;
  const levelKey   = assignment.materialSet.level.key;
  const purposeKey = assignment.materialSet.purpose.key;
  const purposeName = PURPOSES.find((p) => p.key === purposeKey)?.name ?? purposeKey;

  // Pending fallback
  if (!submission.gradedAt || submission.bandOverall === null || !detailed) {
    return (
      <PendingView
        assignmentTitle={assignment.title}
        levelKey={levelKey}
        purposeKey={purposeKey}
        purposeName={purposeName}
      />
    );
  }

  const annotations = detailed.annotations ?? [];

  return (
    <main className="min-h-screen pb-24">

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
        <div className="mx-auto max-w-5xl px-6 pt-12 pb-8 lg:px-8 lg:pt-16">

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
              Graded
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              {levelKey} &middot; {purposeName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              <Clock className="h-3 w-3" strokeWidth={2} />
              {submission.wordCount} words
            </span>
          </div>

          <h1 className="font-serif text-[clamp(1.875rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
            {assignment.title}
          </h1>

        </div>
      </section>

      {/* BAND OVERALL HERO CARD */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pb-12 lg:px-8">
          <div className="rounded-3xl border border-[#B8985A]/30 bg-background p-8 ring-1 ring-[#B8985A]/15 sm:p-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:items-center">
              <div className="lg:col-span-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                  Overall band score
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-[clamp(4rem,10vw,8rem)] font-medium leading-none tracking-tight text-foreground">
                    {submission.bandOverall?.toFixed(1)}
                  </span>
                  <span className="text-2xl text-foreground/50">/ 9</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[#B8985A]">
                  {bandDescriptor(submission.bandOverall ?? 0)}
                </p>
              </div>

              <div className="lg:col-span-3 lg:border-l lg:border-foreground/10 lg:pl-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                  Examiner summary
                </p>
                <p className="font-serif text-lg leading-[1.5] tracking-tight text-foreground sm:text-xl">
                  {submission.feedback ?? "No summary provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRITERIA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pb-12 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
            By criterion
          </p>
          <h2 className="mb-8 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            What worked, what to refine.
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {detailed.criteria.map((c, idx) => (
              <CriterionCard key={idx} criterion={c} />
            ))}
          </div>
        </div>
      </section>

      {/* REWRITE COMPARISON WITH ANNOTATED ORIGINAL */}
      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
            {detailed.rewrite.title}
          </p>
          <h2 className="mb-3 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            See what your essay can be.
          </h2>
          <p className="mb-6 max-w-2xl text-sm leading-[1.65] text-foreground/70">
            {detailed.rewrite.explanation}
          </p>

          {/* Legend -- shown if there are any annotations */}
          {annotations.length > 0 ? (
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-background/70 px-4 py-3 text-xs">
              <span className="font-semibold uppercase tracking-[0.16em] text-foreground/50">
                Highlights
              </span>
              <LegendDot color="grammar" label="Grammar" />
              <LegendDot color="vocab"   label="Vocabulary" />
              <LegendDot color="content" label="Content / structure" />
              <span className="hidden text-foreground/50 sm:inline">
                Hover any highlight for the comment.
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Original WITH annotations */}
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DCE6F2] text-foreground">
                  <PenLine className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                  Your original
                </p>
              </div>
              <div className="whitespace-pre-line text-sm leading-[1.7] text-foreground/85">
                <AnnotatedText
                  text={submission.text}
                  annotations={annotations}
                />
              </div>
            </div>

            {/* Rewrite */}
            <div className="rounded-2xl border border-[#B8985A]/40 bg-background p-6 ring-1 ring-[#B8985A]/15">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#B8985A] text-[#0B1C3F]">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                  {detailed.rewrite.title}
                </p>
              </div>
              <p className="whitespace-pre-line text-sm leading-[1.7] text-foreground/85">
                {detailed.rewrite.text}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pt-16 lg:px-8">
        <div className="flex flex-col items-center gap-3 border-t border-foreground/10 pt-12 text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            Try another prompt.
          </h2>
          <p className="text-sm text-foreground/70">
            Practice makes the difference. Pick another writing assignment when you are ready.
          </p>
          <Link
            href={`/paths/${levelKey}/${purposeKey}/writing`}
            className="group mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90"
          >
            See writing prompts
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>
        </div>
      </section>

    </main>
  );
}


/* ============================================================
   COMPONENTS
   ============================================================ */


function LegendDot({ color, label }: { color: Annotation["type"]; label: string }) {
  const cls = colorClassFor(color);
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground/70">
      <span className={`h-2.5 w-2.5 rounded-full ${cls.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}


function CriterionCard({ criterion }: { criterion: DetailedFeedback["criteria"][number] }) {
  const widthPct = Math.min(100, (criterion.score / 9) * 100);
  const bandLabel = criterion.score.toFixed(1);

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-6">

      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="font-serif text-base font-medium tracking-tight text-foreground sm:text-lg">
          {criterion.name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-3xl font-medium leading-none tracking-tight text-[#B8985A]">
            {bandLabel}
          </span>
          <span className="text-xs text-foreground/50">/ 9</span>
        </div>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-foreground/5">
        <div
          className="h-full bg-[#B8985A] transition-all duration-500 ease-out"
          style={{ width: `${widthPct}%` }}
          aria-hidden="true"
        />
      </div>

      <p className="text-sm leading-[1.6] text-foreground/80">
        {criterion.feedback}
      </p>

      {criterion.evidence ? (
        <div className="mt-4 border-l-2 border-[#B8985A] bg-[#DCE6F2]/30 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            <Quote className="h-3 w-3" strokeWidth={2} />
            From your text
          </div>
          <p className="text-sm italic leading-[1.5] text-foreground/75">
            &quot;{criterion.evidence}&quot;
          </p>
        </div>
      ) : null}

    </div>
  );
}


/*
  AnnotatedText -- walks the original text once and produces a
  flat array of plain chunks and coloured highlight spans.

  Algorithm:
    1. For each annotation, find its first occurrence in the text
       (case-sensitive substring match). Skip ones that don't match.
    2. Sort matched ranges by start index. Drop overlaps -- if two
       annotations cover the same span, keep the first.
    3. Walk the text from index 0, alternating between plain text
       chunks and highlighted spans, until the end.

  The hover comment is shown via the native title attribute, which
  works without JavaScript and keeps the component as a server
  component (no useState needed).
*/

function AnnotatedText({ text, annotations }: { text: string; annotations: Annotation[] }) {
  if (annotations.length === 0) {
    return <>{text}</>;
  }

  type Range = { start: number; end: number; annotation: Annotation };
  const ranges: Range[] = [];

  for (const a of annotations) {
    if (!a.text) continue;
    const idx = text.indexOf(a.text);
    if (idx === -1) continue;
    ranges.push({ start: idx, end: idx + a.text.length, annotation: a });
  }

  ranges.sort((x, y) => x.start - y.start);

  // Drop overlaps: keep the earlier-starting range, skip any range
  // that starts before the previous one ended.
  const filtered: Range[] = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start < lastEnd) continue;
    filtered.push(r);
    lastEnd = r.end;
  }

  const parts: Array<{ kind: "plain"; text: string } | { kind: "mark"; range: Range }> = [];
  let cursor = 0;
  for (const r of filtered) {
    if (r.start > cursor) {
      parts.push({ kind: "plain", text: text.slice(cursor, r.start) });
    }
    parts.push({ kind: "mark", range: r });
    cursor = r.end;
  }
  if (cursor < text.length) {
    parts.push({ kind: "plain", text: text.slice(cursor) });
  }

  return (
    <>
      {parts.map((p, idx) => {
        if (p.kind === "plain") {
          return <span key={idx}>{p.text}</span>;
        }
        const cls = colorClassFor(p.range.annotation.type);
        return (
          <span
            key={idx}
            title={p.range.annotation.comment}
            className={`rounded px-1 py-px ${cls.span} cursor-help`}
          >
            {text.slice(p.range.start, p.range.end)}
          </span>
        );
      })}
    </>
  );
}


function colorClassFor(type: Annotation["type"]): { span: string; dot: string } {
  switch (type) {
    case "grammar":
      return {
        span: "bg-[#B8345A]/[0.12] text-[#7A1F3D] underline decoration-[#B8345A]/40 decoration-2 underline-offset-2",
        dot:  "bg-[#B8345A]",
      };
    case "vocab":
      return {
        span: "bg-[#D97744]/[0.14] text-[#854C20] underline decoration-[#D97744]/40 decoration-2 underline-offset-2",
        dot:  "bg-[#D97744]",
      };
    case "content":
      return {
        span: "bg-[#3D6FA8]/[0.12] text-[#1F4470] underline decoration-[#3D6FA8]/40 decoration-2 underline-offset-2",
        dot:  "bg-[#3D6FA8]",
      };
    default:
      return {
        span: "bg-foreground/10 text-foreground",
        dot:  "bg-foreground/40",
      };
  }
}


function PendingView({
  assignmentTitle,
  levelKey,
  purposeKey,
  purposeName,
}: {
  assignmentTitle: string;
  levelKey: string;
  purposeKey: string;
  purposeName: string;
}) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/dashboard" className="font-serif text-xl tracking-tight text-foreground">
            NoraLingua <span className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A]" /> Hub
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Grading in progress
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          We are still grading your submission.
        </h1>
        <p className="mt-4 text-base leading-[1.65] text-foreground/70">
          Your response to <span className="font-medium text-foreground">{assignmentTitle}</span> ({levelKey} &middot; {purposeName}) was received but the AI examiner has not yet returned a verdict. Refresh this page in a minute.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href={`/paths/${levelKey}/${purposeKey}/writing`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/30"
          >
            Back to writing prompts
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}


function bandDescriptor(score: number): string {
  if (score >= 9.0) return "Expert user";
  if (score >= 8.0) return "Very good user";
  if (score >= 7.0) return "Good user";
  if (score >= 6.0) return "Competent user";
  if (score >= 5.0) return "Modest user";
  if (score >= 4.0) return "Limited user";
  if (score >= 3.0) return "Extremely limited user";
  return "Intermittent user";
}
