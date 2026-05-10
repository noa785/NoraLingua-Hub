/*
  App Constants
  Static reference data used across the app. Mirrors the database
  reference tables (Level, Purpose) for use in forms and UI.
*/

import { CefrLevel, PurposeKey, SkillType } from "@/generated/prisma";


// Brand identity
export const APP = {
  name: "NoraLingua Hub",
  tagline: "Personal English. Real Progress.",
  description:
    "A personalized English learning platform for adult learners.",
  author: "Nora Aldossari",
  year: 2026,
} as const;


// CEFR levels for self-assessment during onboarding
export const CEFR_LEVELS: ReadonlyArray<{
  key: CefrLevel;
  name: string;
  description: string;
}> = [
  {
    key: "A1",
    name: "Beginner",
    description:
      "I can introduce myself and use simple words and phrases.",
  },
  {
    key: "A2",
    name: "Elementary",
    description:
      "I can handle short conversations on familiar topics.",
  },
  {
    key: "B1",
    name: "Intermediate",
    description:
      "I can describe experiences, opinions, and plans clearly.",
  },
  {
    key: "B2",
    name: "Upper-Intermediate",
    description:
      "I can interact with fluency on a wide range of topics.",
  },
  {
    key: "C1",
    name: "Advanced",
    description:
      "I can express ideas precisely in academic and professional contexts.",
  },
  {
    key: "C2",
    name: "Mastery",
    description:
      "I can communicate at a near-native level with subtle nuance.",
  },
];


// Learning purposes selectable during onboarding
export const PURPOSES: ReadonlyArray<{
  key: PurposeKey;
  name: string;
  description: string;
}> = [
  {
    key: "JOB",
    name: "Job",
    description: "Workplace communication, emails, meetings.",
  },
  {
    key: "TRAVEL",
    name: "Travel",
    description: "Practical English for trips and everyday situations.",
  },
  {
    key: "UNIVERSITY",
    name: "University",
    description: "Academic English for lectures, essays, and discussion.",
  },
  {
    key: "IELTS",
    name: "IELTS",
    description: "Targeted preparation for the IELTS exam.",
  },
  {
    key: "BUSINESS",
    name: "Business",
    description: "Professional English for client and partner contexts.",
  },
  {
    key: "GENERAL",
    name: "General",
    description: "Well-rounded English across all everyday situations.",
  },
];


// Four skills tracked across the platform
export const SKILLS: ReadonlyArray<{
  key: SkillType;
  name: string;
  description: string;
}> = [
  { key: "READING", name: "Reading", description: "Comprehension passages and questions." },
  { key: "LISTENING", name: "Listening", description: "Audio with comprehension checks." },
  { key: "WRITING", name: "Writing", description: "Prompts graded by AI." },
  { key: "SPEAKING", name: "Speaking", description: "Live one on one Zoom sessions." },
];


// Speaking sessions allotted per learner
export const SPEAKING_CLASSES_TOTAL = 3;


// Default writing assignment word limits
export const WRITING_DEFAULTS = {
  minWords: 150,
  maxWords: 400,
} as const;
