import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";


/*
  Admin Submission detail page.

  Renders a writing submission with full IELTS-style breakdown.
  The detailedFeedback field is a JSON string produced by the
  Claude grading prompt; it contains a per-criterion array of
  scores, narrative feedback, and evidence quotes from the
  learner's response. We parse it defensively here -- if parsing
  fails we fall back to showing the raw text rather than crashing.
*/


export const metadata = {
  title: "Submission detail - Admin",
};


type Props = {
  params: Promise<{ id: string }>;
};


type CriterionEntry = {
  name:     string;
  score:    number;
  feedback: string;
  evidence?: string;
};

type Annotation = {
  text:    string;
  type:    string;
  comment: string;
};

type DetailedFeedback = {
  rubricMode?: string;
  criteria?:    CriterionEntry[];
  annotations?: Annotation[];
};


function parseDetailedFeedback(raw: string | null): DetailedFeedback | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DetailedFeedback;
    return parsed;
  } catch {
    return null;
  }
}


function annotationColor(type: string): string {
  switch (type.toLowerCase()) {
    case "grammar":
      return "border-rose-500/30 bg-rose-500/[0.04] text-rose-300";
    case "content":
      return "border-amber-500/30 bg-amber-500/[0.04] text-amber-300";
    case "vocabulary":
    case "lexical":
      return "border-sky-500/30 bg-sky-500/[0.04] text-sky-300";
    case "style":
    case "register":
      return "border-violet-500/30 bg-violet-500/[0.04] text-violet-300";
    default:
      return "border-foreground/20 bg-foreground/[0.03] text-foreground/80";
  }
}


export default async function AdminSubmissionDetailPage({ params }: Props) {

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user:       { select: { fullName: true, email: true } },
      assignment: true,
    },
  });

  if (!submission) notFound();

  const detailed = parseDetailedFeedback(submission.detailedFeedback);

  /* Build the criterion list. If the JSON parsed cleanly we use
     the named criteria from Claude. Otherwise we fall back to the
     four band columns stored on the row directly so the page
     still shows the score breakdown either way. */
  const fallbackCriteria = [
    { name: "Task Response",                  score: submission.bandCriterion1, feedback: "" },
    { name: "Coherence and Cohesion",         score: submission.bandCriterion2, feedback: "" },
    { name: "Lexical Resource",               score: submission.bandCriterion3, feedback: "" },
    { name: "Grammatical Range and Accuracy", score: submission.bandCriterion4, feedback: "" },
  ];

  const criteria = detailed?.criteria && detailed.criteria.length > 0
    ? detailed.criteria
    : fallbackCriteria.filter((c) => c.score != null) as CriterionEntry[];

  return (
    <div className="space-y-10">

      {/* Breadcrumb */}
      <div className="text-sm text-foreground/60">
        <Link href="/admin/submissions" className="hover:text-foreground">Submissions</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">{submission.user.fullName}</span>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          {submission.assignment.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          {submission.user.fullName}
        </h1>
        <p className="mt-2 text-xs text-foreground/60">
          {submission.user.email}
          {" \u00b7 "}
          submitted {new Date(submission.createdAt).toLocaleString("en-GB")}
          {submission.gradedAt
            ? ` \u00b7 graded ${new Date(submission.gradedAt).toLocaleString("en-GB")}`
            : ""}
        </p>
      </div>

      {/* Overall band */}
      <section className="rounded-2xl border border-foreground/10 bg-background p-6">

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Overall band
            </p>
            <p className="mt-2 font-serif text-5xl text-foreground">
              {submission.bandOverall != null ? submission.bandOverall.toFixed(1) : "-"}
              <span className="ml-2 text-2xl text-foreground/40">/ 9</span>
            </p>
          </div>

          {detailed?.rubricMode ? (
            <span className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70">
              {detailed.rubricMode} rubric
            </span>
          ) : null}
        </div>

      </section>

      {/* Per-criterion breakdown */}
      {criteria.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-foreground">By criterion</h2>

          <div className="space-y-4">
            {criteria.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-foreground/10 bg-background p-6">

                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-lg text-foreground">{c.name}</h3>
                  <span className="font-mono text-base text-foreground">
                    {c.score != null ? `${c.score.toFixed(1)} / 9` : "-"}
                  </span>
                </div>

                {c.feedback ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {c.feedback}
                  </p>
                ) : null}

                {c.evidence ? (
                  <p className="mt-3 border-l-2 border-[#B8985A]/40 pl-3 text-xs italic text-foreground/60">
                    Evidence: &ldquo;{c.evidence}&rdquo;
                  </p>
                ) : null}

              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Inline annotations */}
      {detailed?.annotations && detailed.annotations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">
            Annotations ({detailed.annotations.length})
          </h2>
          <div className="space-y-2">
            {detailed.annotations.map((a, idx) => (
              <div
                key={idx}
                className={`rounded-lg border px-4 py-3 ${annotationColor(a.type)}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {a.type}
                </p>
                <p className="mt-1 text-sm">
                  &ldquo;{a.text}&rdquo;
                </p>
                <p className="mt-2 text-xs opacity-90">
                  {a.comment}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Summary feedback */}
      {submission.feedback ? (
        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Summary</h2>
          <div className="rounded-2xl border border-foreground/10 bg-background p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {submission.feedback}
            </p>
          </div>
        </section>
      ) : null}

      {/* Prompt */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl text-foreground">Prompt</h2>
        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {submission.assignment.prompt}
          </p>
        </div>
      </section>

      {/* Learner's response */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl text-foreground">Learner response</h2>
        <div className="rounded-2xl border border-foreground/10 bg-background p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {submission.text}
          </p>
          <p className="mt-4 text-xs text-foreground/50">
            {submission.wordCount} words
          </p>
        </div>
      </section>

    </div>
  );
}
