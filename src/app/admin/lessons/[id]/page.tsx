import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";


/*
  Admin Lesson detail page.

  Shows the full lesson: content body, all comprehension questions,
  and each question's answers with the correct one highlighted.
  Read-only for now -- editing comes later if time allows.
*/


export const metadata = {
  title: "Lesson detail - Admin",
};


type Props = {
  params: Promise<{ id: string }>;
};


export default async function AdminLessonDetailPage({ params }: Props): Promise<JSX.Element> {

  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      materialSet: {
        include: { level: true, purpose: true },
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

  const skillLabels: Record<string, string> = {
    READING:   "Reading",
    LISTENING: "Listening",
    WRITING:   "Writing",
    SPEAKING:  "Speaking",
  };

  return (
    <div className="space-y-10">

      {/* Breadcrumb */}
      <div className="text-sm text-foreground/60">
        <Link href="/admin/lessons" className="hover:text-foreground">Lessons</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">{lesson.title}</span>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          {lesson.materialSet.level.key} &middot; {lesson.materialSet.purpose.name} &middot; {skillLabels[lesson.skill] ?? lesson.skill}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          {lesson.title}
        </h1>
        {lesson.estimatedMinutes ? (
          <p className="mt-2 text-sm text-foreground/60">
            ~{lesson.estimatedMinutes} minutes
          </p>
        ) : null}
      </div>

      {/* Lesson body */}
      {lesson.body ? (
        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Content</h2>
          <div className="rounded-2xl border border-foreground/10 bg-background p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {lesson.body}
            </p>
          </div>
        </section>
      ) : null}

      {/* Questions */}
      <section className="space-y-3">

        <h2 className="font-serif text-xl text-foreground">
          Comprehension questions ({lesson.questions.length})
        </h2>

        {lesson.questions.length === 0 ? (
          <p className="text-sm text-foreground/60">No questions on this lesson.</p>
        ) : (
          <div className="space-y-4">
            {lesson.questions.map((question, idx) => (
              <div key={question.id} className="rounded-2xl border border-foreground/10 bg-background p-6">

                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                  Question {idx + 1} &middot; {question.type}
                </p>
                <p className="mt-2 font-medium text-foreground">{question.prompt}</p>

                <ul className="mt-4 space-y-2">
                  {question.answers.map((answer) => (
                    <li
                      key={answer.id}
                      className={
                        answer.isCorrect
                          ? "rounded-lg border border-emerald-500/40 bg-emerald-500/[0.04] px-3 py-2 text-sm text-foreground"
                          : "rounded-lg border border-foreground/10 px-3 py-2 text-sm text-foreground/75"
                      }
                    >
                      <span className="font-mono text-xs text-foreground/50">
                        {answer.isCorrect ? "CORRECT" : "       "}
                      </span>
                      <span className="ml-3">{answer.text}</span>
                    </li>
                  ))}
                </ul>

                {question.explanation ? (
                  <p className="mt-3 border-t border-foreground/10 pt-3 text-xs italic text-foreground/60">
                    {question.explanation}
                  </p>
                ) : null}

              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
