"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";


/*
  Server actions for lessons.

  submitAnswers
    Receives a batch of {questionId, answerId} from the client.
    Grades each one server-side (the source of truth for which
    answer is correct lives only on the server). Writes a Progress
    row marking the lesson complete, with the count of correct
    answers. Returns per-question results so the client can render
    feedback colors and explanations.

  Why grade on the server?
    The client never sees the isCorrect flag on Answer rows. If we
    sent it down with the question, a determined learner could
    inspect the React props and "cheat" by reading the answer.
    Grading on the server means the client only ever knows results
    after explicitly submitting.

  Why upsert Progress instead of insert?
    A learner can re-attempt a lesson. Rather than creating a new
    Progress row each attempt, we upsert on (userId, lessonId).
    The new row replaces the old. We keep the highest score by
    only writing if the new attempt scored at least as high as
    the previous one (see logic below).
*/


type SubmitAnswersInput = {
  lessonId: string;
  submissions: Array<{
    questionId: string;
    answerId: string;
  }>;
};


type GradedResult = {
  questionId: string;
  selectedAnswerId: string;
  correctAnswerId: string;
  isCorrect: boolean;
};


type SubmitAnswersResult =
  | { success: true; results: GradedResult[] }
  | { success: false; error: string };


export async function submitAnswers(input: SubmitAnswersInput): Promise<SubmitAnswersResult> {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in to submit answers." };
  }

  // Fetch the lesson with its questions and answers in a single query.
  // We need both the questions (to validate input) and the answers
  // (to know which is correct).
  const lesson = await prisma.lesson.findUnique({
    where: { id: input.lessonId },
    include: {
      questions: {
        include: { answers: true },
      },
    },
  });
  if (!lesson) {
    return { success: false, error: "Lesson not found." };
  }

  // Build the grading map. For each questionId, we need the correctAnswerId.
  const correctMap = new Map<string, string>();
  for (const q of lesson.questions) {
    const correct = q.answers.find((a) => a.isCorrect);
    if (correct) correctMap.set(q.id, correct.id);
  }

  // Validate that every question on the lesson has been submitted.
  const submittedQuestionIds = new Set(input.submissions.map((s) => s.questionId));
  for (const q of lesson.questions) {
    if (!submittedQuestionIds.has(q.id)) {
      return { success: false, error: "Some questions are missing answers. Please answer all questions before submitting." };
    }
  }

  // Grade each submission.
  const results: GradedResult[] = input.submissions.map((s) => {
    const correctAnswerId = correctMap.get(s.questionId) ?? "";
    return {
      questionId:       s.questionId,
      selectedAnswerId: s.answerId,
      correctAnswerId,
      isCorrect:        s.answerId === correctAnswerId,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;

  // Upsert Progress -- keep best score on re-attempts.
  const existing = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId:   user.id,
        lessonId: lesson.id,
      },
    },
  });

  /*
    totalQuestions is the number of questions we just graded.
    We write it alongside correctAnswers so the page can show
    "you scored X/Y" on revisit without re-grading. completedAt
    is set on first completion and on any subsequent improvement;
    it is the canonical timestamp for "this lesson is done."
  */
  const totalQuestions = lesson.questions.length;

  if (!existing) {
    await prisma.progress.create({
      data: {
        userId:         user.id,
        lessonId:       lesson.id,
        isCompleted:    true,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        completedAt:    new Date(),
      },
    });
  } else if (correctCount >= existing.correctAnswers) {
    // Only overwrite if the new attempt is at least as good.
    await prisma.progress.update({
      where: { id: existing.id },
      data:  {
        isCompleted:    true,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        completedAt:    new Date(),
      },
    });
  }
  // else: existing score was higher; leave it alone.

  return { success: true, results };
}
