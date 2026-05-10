"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, Loader2 } from "lucide-react";

import { ListeningPlayer } from "@/components/lessons/ListeningPlayer";
import { submitAnswers } from "@/app/actions/lessons";


/*
  LessonReader

  Client-side reader for a single lesson. Layout:
    1. Optional listening player (only for LISTENING lessons)
    2. Lesson body (article or transcript)
    3. Comprehension questions, all on one page
    4. Submit button (disabled until all answered)
    5. After submit: score summary + per-question feedback

  Feedback rules (matched to the user's request):
    - Selected wrong: red border, red X badge, red explanation
    - Selected right: green border, green check badge, green explanation
    - Correct answer the user did not pick: outlined in green so
      the learner can see what they should have chosen
    - Each question shows a brief explanation under the answers
      after submission, sourced from the question.explanation field
    - Score summary at the top: "You scored 4/5" with a percentage
*/


type AnswerOption = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  prompt: string;
  sortOrder: number;
  explanation: string | null;
  answers: AnswerOption[];
  // Note: the correctAnswerId is NOT sent to the client. We
  // only learn which is correct after the server grades.
};

type Lesson = {
  id: string;
  title: string;
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  content: string;
  audioUrl: string | null;
  estimatedMinutes: number;
};

type Props = {
  lesson: Lesson;
  questions: Question[];
  alreadyCompleted: boolean;
  /*
    savedScore comes from the Progress row on revisit. We use
    only aggregate correct/total because per-question selections
    are not stored in the database. On revisit we show the score
    banner; per-question color feedback only appears after a fresh
    re-attempt within the current session.
  */
  savedScore: { correct: number; total: number } | null;
};


type GradedResult = {
  questionId: string;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
};


export function LessonReader({ lesson, questions, alreadyCompleted, savedScore }: Props) {
  const router = useRouter();

  // Map of questionId -> selected answerId
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<GradedResult[] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);


  /* Derived state. allAnswered controls whether the submit button
     is enabled. score totals the correct count after submission. */
  const allAnswered = useMemo(
    () => questions.every((q) => Boolean(selections[q.id])),
    [questions, selections]
  );

  const score = useMemo(() => {
    if (!results) return null;
    const correct = results.filter((r) => r.isCorrect).length;
    return { correct, total: results.length, percent: Math.round((correct / results.length) * 100) };
  }, [results]);

  /*
    displayScore is what we actually render in the summary banner.
    It prefers the just-submitted score over the saved one, so a
    re-attempt that has not yet been submitted still falls back to
    the saved aggregate from the database.
  */
  const displayScore = score
    ?? (savedScore
        ? { ...savedScore, percent: Math.round((savedScore.correct / savedScore.total) * 100) }
        : null);


  function handleSelect(questionId: string, answerId: string) {
    if (results) return; // locked after submission
    setSelections((prev) => ({ ...prev, [questionId]: answerId }));
  }


  async function handleSubmit() {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const submissions = questions.map((q) => ({
        questionId: q.id,
        answerId:   selections[q.id],
      }));

      const response = await submitAnswers({
        lessonId: lesson.id,
        submissions,
      });

      if (!response.success) {
        setServerError(response.error);
        setIsSubmitting(false);
        return;
      }

      setResults(response.results);
      // Refresh server state so the dashboard sees the new completion
      router.refresh();
    } catch (err) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }


  /* Helper: find the result row for a question (after grading) */
  function resultFor(questionId: string): GradedResult | undefined {
    return results?.find((r) => r.questionId === questionId);
  }


  return (
    <div className="space-y-12">

      {/* LISTENING -- audio player (READING lessons skip this) */}
      {lesson.skill === "LISTENING" && lesson.audioUrl ? (
        <ListeningPlayer
          text={lesson.content}
          locale={parseLocale(lesson.audioUrl)}
        />
      ) : null}

      {/* LESSON BODY -- the article (always shown for reading;
         listening lessons rely on the audio player + "show transcript"
         disclosure inside it, so we hide the body for listening) */}
      {lesson.skill === "READING" ? (
        <article className="rounded-2xl border border-foreground/10 bg-background p-8 sm:p-10">
          <div className="prose-lesson space-y-4 text-base leading-[1.75] text-foreground/85">
            {lesson.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>
      ) : null}

      {/*
        SCORE SUMMARY
          - shown immediately after submission (`score` derived from `results`)
          - also shown on revisit using the saved aggregate from the database
            (`savedScore`), so refreshing or returning to the lesson keeps the
            score visible
      */}
      {displayScore ? (
        <div className="rounded-2xl border border-[#B8985A]/40 bg-background p-8 ring-1 ring-[#B8985A]/15">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Your score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-medium leading-none tracking-tight text-foreground">
                {displayScore.correct}
              </span>
              <span className="text-lg text-foreground/60">/ {displayScore.total}</span>
              <span className="ml-3 text-sm font-medium text-[#B8985A]">
                {displayScore.percent}%
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-[1.6] text-foreground/70">
            {scoreMessage(displayScore.percent)}
          </p>
        </div>
      ) : null}

      {/* QUESTIONS */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
          Comprehension
        </p>
        <h2 className="mb-8 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Check your understanding.
        </h2>

        <ol className="space-y-8">
          {questions.map((q, idx) => {
            const result = resultFor(q.id);
            const selectedId = selections[q.id];

            return (
              <li
                key={q.id}
                className="rounded-2xl border border-foreground/10 bg-background p-6 sm:p-8"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                  Question {idx + 1}
                </p>
                <p className="mb-6 font-serif text-xl font-medium leading-snug tracking-tight text-foreground">
                  {q.prompt}
                </p>

                <ul className="space-y-2.5">
                  {q.answers.map((a) => {
                    const isSelected = selectedId === a.id;
                    const status = answerStatus(a.id, isSelected, result);

                    return (
                      <li key={a.id}>
                        <AnswerButton
                          text={a.text}
                          isSelected={isSelected}
                          status={status}
                          locked={Boolean(result)}
                          onSelect={() => handleSelect(q.id, a.id)}
                        />
                      </li>
                    );
                  })}
                </ul>

                {/* Per-question explanation -- shown only after grading */}
                {result && q.explanation ? (
                  <div
                    className={[
                      "mt-5 rounded-xl border-l-2 p-4 text-sm leading-[1.6]",
                      result.isCorrect
                        ? "border-l-[#1F7A3A] bg-[#1F7A3A]/[0.04] text-foreground/85"
                        : "border-l-[#B8345A] bg-[#B8345A]/[0.04] text-foreground/85",
                    ].join(" ")}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      Explanation
                    </p>
                    {q.explanation}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Server error */}
        {serverError ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-6 rounded-xl border border-[#B8345A]/30 bg-[#B8345A]/[0.04] px-4 py-3 text-sm text-foreground"
          >
            {serverError}
          </div>
        ) : null}

        {/* SUBMIT or NEXT button */}
        <div className="mt-10 flex flex-col items-center gap-4">
          {!results ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              aria-busy={isSubmitting}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Grading
                </>
              ) : (
                <>
                  Submit answers
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90"
            >
              Back to lessons
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </button>
          )}

          {!results ? (
            <p className="text-xs text-foreground/60">
              {allAnswered
                ? "All questions answered. Submit when ready."
                : `Answer all ${questions.length} questions to submit.`}
            </p>
          ) : alreadyCompleted ? (
            <p className="text-xs text-foreground/60">
              Lesson re-attempted. Best score is kept on your dashboard.
            </p>
          ) : (
            <p className="text-xs text-foreground/60">
              Lesson marked complete on your dashboard.
            </p>
          )}
        </div>
      </section>

    </div>
  );
}


/* ============================================================
   Sub-components and helpers
   ============================================================ */


type AnswerStatus =
  | "idle"               // not selected, not graded
  | "selected"           // selected but not graded yet
  | "correct"            // graded right
  | "wrong"              // graded wrong
  | "missed-correct";    // user picked something else but THIS was the right one

function answerStatus(
  answerId: string,
  isSelected: boolean,
  result: GradedResult | undefined
): AnswerStatus {
  if (!result) return isSelected ? "selected" : "idle";
  if (answerId === result.correctAnswerId && answerId === result.selectedAnswerId) return "correct";
  if (answerId === result.selectedAnswerId) return "wrong";
  if (answerId === result.correctAnswerId) return "missed-correct";
  return "idle";
}


function AnswerButton({
  text,
  isSelected,
  status,
  locked,
  onSelect,
}: {
  text: string;
  isSelected: boolean;
  status: AnswerStatus;
  locked: boolean;
  onSelect: () => void;
}) {
  const isLocked = locked;

  /* Style ramp by status. Colors are local-only -- they do not
     leak into the global palette because they only appear here
     and only after grading. */
  const ringClass = (() => {
    switch (status) {
      case "correct":
        return "border-[#1F7A3A] bg-[#1F7A3A]/[0.06] ring-1 ring-[#1F7A3A]/30";
      case "wrong":
        return "border-[#B8345A] bg-[#B8345A]/[0.06] ring-1 ring-[#B8345A]/30";
      case "missed-correct":
        return "border-[#1F7A3A] bg-background ring-1 ring-[#1F7A3A]/40 border-dashed";
      case "selected":
        return "border-[#B8985A] bg-background ring-1 ring-[#B8985A]/30";
      case "idle":
      default:
        return "border-foreground/10 bg-[#DCE6F2]/30 hover:border-foreground/20 hover:bg-[#DCE6F2]/50";
    }
  })();

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      role="radio"
      aria-checked={isSelected}
      className={[
        "relative flex w-full items-center gap-3 rounded-full px-5 py-3.5 text-left text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8985A] focus-visible:ring-offset-2",
        "disabled:cursor-default",
        ringClass,
      ].join(" ")}
    >
      <span className="flex-1 text-foreground">{text}</span>

      {/* Status badge */}
      {status === "correct" ? <StatusBadge tone="green" label="Correct" icon={<Check className="h-3 w-3" strokeWidth={3} />} /> : null}
      {status === "wrong" ? <StatusBadge tone="red" label="Wrong" icon={<X className="h-3 w-3" strokeWidth={3} />} /> : null}
      {status === "missed-correct" ? <StatusBadge tone="green-outline" label="Correct answer" icon={<Check className="h-3 w-3" strokeWidth={3} />} /> : null}
    </button>
  );
}


function StatusBadge({
  tone,
  label,
  icon,
}: {
  tone: "green" | "red" | "green-outline";
  label: string;
  icon: React.ReactNode;
}) {
  const cls = (() => {
    switch (tone) {
      case "green":
        return "bg-[#1F7A3A] text-white";
      case "red":
        return "bg-[#B8345A] text-white";
      case "green-outline":
        return "border border-[#1F7A3A] text-[#1F7A3A]";
    }
  })();
  return (
    <span
      className={[
        "ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        cls,
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  );
}


function parseLocale(audioUrl: string): string {
  // audioUrl is expected to look like "tts:en-GB" or "tts:en-US"
  const parts = audioUrl.split(":");
  if (parts.length === 2 && parts[0] === "tts") {
    return parts[1];
  }
  return "en-US";
}


function scoreMessage(percent: number): string {
  if (percent === 100) return "Perfect score. Every question right.";
  if (percent >= 80)   return "Strong work. You picked up almost everything.";
  if (percent >= 60)   return "Solid. Review the explanations below for the ones you missed.";
  if (percent >= 40)   return "Some gaps. Take a moment with the explanations and try the next lesson.";
  return "This was a tricky one. Read the explanations carefully and consider re-reading the article before moving on.";
}
