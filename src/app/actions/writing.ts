"use server";

import { gradeWriting, type RubricMode } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";


/*
  Writing server actions.

  submitWriting
    Validates the student's submission (word count, text length),
    fetches the learner's CEFR level and purpose so the grader can
    apply per-level expectations, calls Claude API for grading,
    persists the result in the Submission table, and returns the
    new submission's id so the UI can navigate to the result page.

  Why a 50-word hard floor instead of the prompt's minWords?
    A learner may want to submit a draft early and get feedback on
    what they have so far. Forty words is too thin for the AI
    examiner to grade meaningfully, but fifty is enough for a
    useful first read. The prompt's minWords stays in the UI as
    the target; it just stops being a hard barrier on submission.

  Why fetch the user's level and purpose for grading?
    The Claude grader uses the declared CEFR level to set a band
    ceiling (an A1 learner cannot score above 3.5, a B1 above 6.0,
    etc.) and to adjust grading expectations. The purpose
    influences which criteria get extra weight (IELTS leans on
    examiner-style criteria, Job leans on professional tone). This
    keeps grading honest relative to where the learner actually
    is in their journey rather than treating every submission as
    if it were a Cambridge proficiency exam.

  Why store both the flat scores and the detailed JSON?
    The flat columns (bandOverall, bandCriterion1..4) are queryable
    for analytics. The detailed JSON holds the per-criterion
    feedback strings, evidence quotes, annotations, and the rewrite,
    which never need to be queried, only rendered. This split keeps
    the schema clean.
*/


const HARD_MIN_WORDS = 50;


type SubmitInput = {
  assignmentId: string;
  text:         string;
};

type SubmitResult =
  | { success: true; submissionId: string }
  | { success: false; error: string };


export async function submitWriting(input: SubmitInput): Promise<SubmitResult> {
  /* Auth */
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to submit." };

  /* Fetch the assignment and the user's profile in parallel.
     We need:
       - assignment for prompt text, word limits, rubric mode
       - user.level and user.purpose for the grader's per-level
         expectations and band ceiling */
  const [assignment, profile] = await Promise.all([
    prisma.writingAssignment.findUnique({
      where: { id: input.assignmentId },
    }),
    prisma.user.findUnique({
      where:  { id: user.id },
      select: { level: true, purpose: true },
    }),
  ]);

  if (!assignment) return { success: false, error: "Assignment not found." };

  /* Validate text */
  const text = input.text.trim();
  if (text.length === 0) {
    return { success: false, error: "Please write something before submitting." };
  }

  const wordCount = countWords(text);

  if (wordCount < HARD_MIN_WORDS) {
    return {
      success: false,
      error: "Your response is very short (" + wordCount + " words). Please write at least " + HARD_MIN_WORDS + " words so the AI can grade you fairly.",
    };
  }
  if (wordCount > assignment.maxWords + 50) {
    /* Allow a small overflow above maxWords; over 50 words past
       the cap is genuinely too long for the task. */
    return {
      success: false,
      error: "Your response is much longer than the prompt asks for (" + wordCount + " words; cap is " + assignment.maxWords + "). Please tighten before submitting.",
    };
  }

  /* Create the submission row first, ungraded. This means the
     user has a record even if grading fails for any reason. */
  const submission = await prisma.submission.create({
    data: {
      userId:       user.id,
      assignmentId: assignment.id,
      text,
      wordCount,
    },
  });

  /* Call Claude to grade. Wrap in try/catch so a Claude API error
     does not lose the submission -- we still return a friendly
     message so the user knows their text was saved. */
  try {
    const rubricMode = (assignment.rubricMode ?? "IELTS") as RubricMode;

    const result = await gradeWriting({
      prompt:      assignment.prompt,
      text,
      wordCount,
      rubricMode,
      userLevel:   profile?.level   ?? null,
      userPurpose: profile?.purpose ?? null,
    });

    /* Persist grading result. Flat columns for query speed; the
       detailed JSON for the result page UI. */
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        score:            Math.round((result.bandOverall / 9) * 100),
        feedback:         result.summary,
        bandOverall:      result.bandOverall,
        bandCriterion1:   result.criteria[0].score,
        bandCriterion2:   result.criteria[1].score,
        bandCriterion3:   result.criteria[2].score,
        bandCriterion4:   result.criteria[3].score,
        detailedFeedback: JSON.stringify({
          rubricMode:  result.rubricMode,
          criteria:    result.criteria,
          annotations: result.annotations,
          rewrite:     result.rewrite,
        }),
        gradedAt: new Date(),
      },
    });

    return { success: true, submissionId: submission.id };
  } catch (err) {
    /* Grading failed but the submission saved. Return a friendly
       error so the UI can show "we received your submission but
       grading is still pending" rather than losing the text. */
    console.error("Claude grading failed:", err);
    return {
      success: false,
      error: "Grading is taking longer than expected. Your submission has been saved -- check back in a minute.",
    };
  }
}


function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}