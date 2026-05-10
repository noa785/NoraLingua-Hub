"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

/*
  saveOnboarding: server action called by OnboardingForm.

  Order of operations:
    1. Re-validate input.
    2. Confirm session.
    3. Upsert User row with onboarding answers.
    4. Assign user to a teacher (load-balanced) if not already assigned.
    5. Revalidate.

  Why assign at onboarding instead of at booking time?
    Teacher continuity is part of the pedagogy: each learner stays
    with the same teacher across all three speaking sessions. The
    earliest moment we know a learner exists as a "real" student
    is the end of onboarding, so that is when we lock the pairing.

  Load-balancing rule:
    Pick the active teacher with the fewest currently assigned
    students. Ties break by createdAt (the older teacher wins).
    This keeps the cohort spread even as new students sign up.
*/

type ActionResult =
  | { success: true }
  | { success: false; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOT_AUTHENTICATED = "You must be signed in to continue.";

export async function saveOnboarding(
  input: OnboardingInput,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_ERROR,
    };
  }

  const { level, purpose, targetSkill } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: NOT_AUTHENTICATED };
  }

  const email = user.email ?? "";
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    email.split("@")[0] ??
    "Learner";

  try {
    /* Upsert user with onboarding answers. */
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        level,
        purpose,
        targetSkill,
        onboardedAt: new Date(),
      },
      create: {
        id: user.id,
        email,
        fullName,
        level,
        purpose,
        targetSkill,
        onboardedAt: new Date(),
      },
    });

    /* Assign teacher only if not already assigned, and only for STUDENT role. */
    if (!dbUser.assignedTeacherId && dbUser.role === "STUDENT") {
      const teachersWithCounts = await prisma.teacher.findMany({
        where: { isActive: true },
        select: {
          id: true,
          createdAt: true,
          _count: {
            select: { assignedStudents: true },
          },
        },
        orderBy: [{ createdAt: "asc" }],
      });

      if (teachersWithCounts.length > 0) {
        /* Pick the teacher with the fewest assigned students.
           Sort: count ascending, then createdAt ascending. */
        const sorted = [...teachersWithCounts].sort((a, b) => {
          const diff = a._count.assignedStudents - b._count.assignedStudents;
          if (diff !== 0) return diff;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const chosenTeacher = sorted[0];

        await prisma.user.update({
          where: { id: dbUser.id },
          data:  { assignedTeacherId: chosenTeacher.id },
        });
      }
    }
  } catch (e) {
    console.error("Prisma upsert error in saveOnboarding:", e);
    return { success: false, error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
