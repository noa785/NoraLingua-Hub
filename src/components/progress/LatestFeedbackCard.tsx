import Link from "next/link";

import { ArrowRight, Quote } from "lucide-react";

import type { LatestFeedback } from "@/lib/progress-stats";


/*
  LatestFeedbackCard
  ------------------

  Surfaces the most recent AI-graded writing feedback on the
  dashboard at a glance: assignment title, overall IELTS band,
  four per-criterion bars, and a short excerpt of the actual
  feedback text. From the proposal (Q7 Better Outcome): the most
  recent AI feedback is meant to live on the dashboard, not just
  on the submission detail page.

  Why a card alongside the WritingJourneyChart:
    The chart shows numbers over time. This card shows the meaning
    behind the most recent number. Together they tell the writing
    story: trend plus voice.

  Why per-criterion mini-bars rather than a number list:
    A line of four numbers is hard to scan. Horizontal bars give
    the eye a quick "which is weakest" read, which is the
    pedagogical question the learner is actually asking.
*/


type Props = {
  feedback: LatestFeedback | null;
};


export function LatestFeedbackCard({ feedback }: Props) {

  if (!feedback) {
    return (
      <article className="rounded-2xl border border-dashed border-foreground/15 bg-background/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Latest feedback
        </p>
        <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          Your AI feedback will appear here.
        </h3>
        <p className="mt-3 text-sm leading-[1.6] text-foreground/70">
          Submit a writing assignment and the most recent score and feedback
          excerpt will surface on this card automatically.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8">

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
            Latest feedback
          </p>
          <h3 className="mt-1 truncate font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            {feedback.assignmentTitle}
          </h3>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Overall band
          </span>
          <span className="font-serif text-3xl font-medium leading-none tracking-tight text-[#B8985A]">
            {feedback.bandOverall.toFixed(1)}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-foreground/40">
            of 9
          </span>
        </div>
      </div>

      <dl className="mb-5 space-y-2">
        <CriterionRow label="TR" name="Task Response"             band={feedback.bandCriterion1} />
        <CriterionRow label="CC" name="Coherence and Cohesion"    band={feedback.bandCriterion2} />
        <CriterionRow label="LR" name="Lexical Resource"          band={feedback.bandCriterion3} />
        <CriterionRow label="GR" name="Grammar"                   band={feedback.bandCriterion4} />
      </dl>

      <div className="rounded-xl border border-foreground/10 bg-[#DCE6F2]/40 p-4">
        <Quote className="mb-2 h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} aria-hidden="true" />
        <p className="text-sm leading-[1.6] text-foreground/80">
          {feedback.excerpt}
        </p>
      </div>

      <Link
        href={"/submissions/" + feedback.submissionId}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#B8985A] transition-colors hover:text-foreground"
      >
        Read full feedback
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>

    </article>
  );
}


function CriterionRow({
  label,
  name,
  band,
}: {
  label: string;
  name:  string;
  band:  number | null;
}) {
  if (band === null) {
    return (
      <div className="flex items-center gap-3">
        <dt className="w-8 text-xs font-semibold tracking-wider text-foreground/50">
          {label}
        </dt>
        <dd className="flex-1 text-xs italic text-foreground/40">
          {name} score not recorded
        </dd>
      </div>
    );
  }

  const widthPct = Math.max(0, Math.min(100, (band / 9) * 100));

  return (
    <div className="flex items-center gap-3">
      <dt
        className="w-8 text-xs font-semibold tracking-wider text-foreground/70"
        title={name}
      >
        {label}
      </dt>
      <dd className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div
            className="h-full rounded-full bg-[#B8985A]"
            style={{ width: widthPct + "%" }}
          />
        </div>
        <span className="w-8 text-right text-xs tabular-nums text-foreground/70">
          {band.toFixed(1)}
        </span>
      </dd>
    </div>
  );
}