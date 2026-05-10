import { z } from "zod";

import { CefrLevel, PurposeKey, SkillType } from "@/generated/prisma";

/*
  Onboarding validation schema.

  Why z.nativeEnum?
    Our Prisma schema defines three enums: CefrLevel (A1..C2),
    PurposeKey (JOB, TRAVEL, UNIVERSITY, IELTS, BUSINESS, GENERAL),
    and SkillType (READING, LISTENING, WRITING, SPEAKING).
    z.nativeEnum binds the Zod check to those exact values, so:
      - The client form can only submit a value the database accepts.
      - If we add a new level to the Prisma enum later, this schema
        and every consumer of OnboardingInput automatically picks it
        up at compile time.
    No magic strings, no drift between schema and database.

  Why required_error?
    Without it, react-hook-form would show a generic "Required" or
    nothing at all when the user submits without choosing. The custom
    messages here are what shows up under each Select on screen.
*/

export const onboardingSchema = z.object({
  level: z.nativeEnum(CefrLevel, {
    error: "Please choose your level",
  }),
  purpose: z.nativeEnum(PurposeKey, {
    error: "Please choose a purpose",
  }),
  targetSkill: z.nativeEnum(SkillType, {
    error: "Please choose a skill",
  }),
});

/*
  Inferring the type from the schema means the form values, the server
  action input, and the database write all share one source of truth.
  If the schema changes, every site using OnboardingInput sees the
  change as a TypeScript error.
*/
export type OnboardingInput = z.infer<typeof onboardingSchema>;
