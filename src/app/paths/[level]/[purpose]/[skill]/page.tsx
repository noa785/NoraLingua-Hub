import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Headphones,
  PenLine,
  MessagesSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { enforcePathOwnership } from "@/lib/path-guard";
import { createClient } from "@/lib/supabase/server";
import { CEFR_LEVELS, PURPOSES } from "@/lib/constants";
import { SpeakingBooker } from "@/components/speaking/SpeakingBooker";

import type { Metadata } from "next";
import type { CefrLevel, PurposeKey, SkillType } from "@/generated/prisma";


type PageProps = {
  params: Promise<{
    level:   string;
    purpose: string;
    skill:   string;
  }>;
};


/*
  Skill-filtered path page.

  URL shape: /paths/[level]/[purpose]/[skill]
  Examples:  /paths/B1/JOB/reading
             /paths/A2/TRAVEL/speaking

  For SPEAKING, we additionally fetch:
    1. The user's assigned teacher (with bio and Zoom URL).
    2. Each booking's teacher row (so the Join Zoom button on
       each booking card can read the right URL even if the user
       was reassigned to a different teacher mid-cohort).
*/


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { level, purpose, skill } = await params;
  const skillName = capitalizeSkill(skill);
  return {
    title:       skillName + " - " + level.toUpperCase() + " " + purpose.toUpperCase(),
    description: skillName + " content for the " + level.toUpperCase() + " " + purpose.toUpperCase() + " path.",
  };
}


export default async function SkillFilteredPathPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { level: rawLevel, purpose: rawPurpose, skill: rawSkill } = await params;

  await enforcePathOwnership(user.id, rawLevel, rawPurpose);

  const levelKey   = rawLevel.toUpperCase()   as CefrLevel;
  const purposeKey = rawPurpose.toUpperCase() as PurposeKey;
  const skillKey   = rawSkill.toUpperCase()   as SkillType;

  const validSkills: SkillType[] = ["READING", "LISTENING", "WRITING", "SPEAKING"];
  if (!validSkills.includes(skillKey)) notFound();

  const set = await prisma.materialSet.findFirst({
    where: {
      level:   { key: levelKey },
      purpose: { key: purposeKey },
    },
    include: {
      level:   true,
      purpose: true,
    },
  });

  const lessons = (set && (skillKey === "READING" || skillKey === "LISTENING"))
    ? await prisma.lesson.findMany({
        where:   { materialSetId: set.id, skill: skillKey },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { questions: true } } },
      })
    : [];

  const writingAssignments = (set && skillKey === "WRITING")
    ? await prisma.writingAssignment.findMany({
        where:   { materialSetId: set.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  /* For SPEAKING, fetch bookings with their teacher (Join Zoom button
     reads the URL from the booking's teacher relation). */
  const speakingBookings = skillKey === "SPEAKING"
    ? await prisma.speakingBooking.findMany({
        where:   { userId: user.id },
        orderBy: { sessionDate: "asc" },
        include: {
          teacher: {
            select: { id: true, fullName: true, zoomUrl: true },
          },
        },
      })
    : [];

  /* For SPEAKING, also fetch the user's assigned teacher with full
     bio so the right column can render a teacher card. Returns null
     if the account predates teacher assignment (in which case the
     UI shows a friendly message asking them to finish onboarding). */
  const assignedTeacher = skillKey === "SPEAKING"
    ? await (async () => {
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { assignedTeacherId: true },
        });
        if (!dbUser?.assignedTeacherId) return null;
        return prisma.teacher.findUnique({
          where:  { id: dbUser.assignedTeacherId },
          select: {
            id:       true,
            fullName: true,
            email:    true,
            bio:      true,
            zoomUrl:  true,
          },
        });
      })()
    : null;

  const progressByLesson = new Map<string, boolean>();
  if (lessons.length > 0) {
    const progress = await prisma.progress.findMany({
      where: {
        userId:   user.id,
        lessonId: { in: lessons.map((l) => l.id) },
      },
      select: { lessonId: true, isCompleted: true },
    });
    for (const p of progress) progressByLesson.set(p.lessonId, p.isCompleted);
  }

  const purposeName = PURPOSES.find((p) => p.key === purposeKey)?.name ?? purposeKey;
  const skillLabel  = capitalizeSkill(skillKey);

  const hasContent = lessons.length > 0 || writingAssignments.length > 0 || skillKey === "SPEAKING";

  return (
    <main className="min-h-screen">

      <TopNav />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
        />
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10 lg:px-8 lg:pt-20">

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Link
              href={`/paths/${levelKey}/${purposeKey}`}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Back to {set?.title ?? "your path"}
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
              {levelKey} {purposeName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCE6F2]/40 px-3 py-1 text-xs font-medium text-foreground/70">
              {renderSkillIcon(skillKey)}
              {skillLabel}
            </span>
          </div>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            {skillLabel} {skillKey === "WRITING" ? "prompts" : skillKey === "SPEAKING" ? "sessions" : "lessons"}.
          </h1>

          {hasContent ? (
            <p className="mt-4 max-w-2xl text-base leading-[1.65] text-foreground/70 sm:text-lg">
              {skillKey === "WRITING"
                ? "Two prompts at this level. Write your response and submit for AI grading."
                : skillKey === "SPEAKING"
                ? "Three live one-on-one sessions with your teacher. Pick the times that work for you."
                : `${lessons.length} ${skillLabel.toLowerCase()} ${lessons.length === 1 ? "lesson" : "lessons"} in the ${set?.title ?? "this"} path.`}
            </p>
          ) : null}

        </div>
      </section>

      <section className="bg-[#DCE6F2]/50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">

          <SkillSwitcher
            currentSkill={skillKey}
            levelKey={levelKey}
            purposeKey={purposeKey}
          />

          {!hasContent ? (
            <EmptyState
              skillKey={skillKey}
              levelKey={levelKey}
              purposeKey={purposeKey}
              setTitle={set?.title ?? `${levelKey} ${purposeName}`}
            />
          ) : skillKey === "SPEAKING" ? (
            <div className="mt-10">
              <SpeakingBooker
                teacher={assignedTeacher}
                bookings={speakingBookings.map((b) => ({
                  id:          b.id,
                  sessionDate: b.sessionDate.toISOString(),
                  status:      b.status,
                  teacher:     b.teacher
                    ? {
                        id:       b.teacher.id,
                        fullName: b.teacher.fullName,
                        zoomUrl:  b.teacher.zoomUrl,
                      }
                    : null,
                }))}
              />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4">

              {lessons.map((lesson, idx) => {
                const completed = progressByLesson.get(lesson.id) ?? false;
                return (
                  <LessonCard
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    index={idx + 1}
                    skill={lesson.skill}
                    title={lesson.title}
                    minutes={lesson.estimatedMinutes}
                    questionCount={lesson._count.questions}
                    completed={completed}
                  />
                );
              })}

              {writingAssignments.map((wa, idx) => (
                <WritingCard
                  key={wa.id}
                  id={wa.id}
                  index={idx + 1}
                  title={wa.title}
                  prompt={wa.prompt}
                  minWords={wa.minWords}
                  maxWords={wa.maxWords}
                />
              ))}

            </div>
          )}
        </div>
      </section>

    </main>
  );
}


function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">

        <Link
          href="/dashboard"
          className="group flex items-center font-serif text-xl tracking-tight text-foreground"
        >
          NoraLingua
          <span
            aria-hidden="true"
            className="mx-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#B8985A] transition-transform duration-200 group-hover:scale-125"
          />
          Hub
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/paths"
            className="rounded-full px-4 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Paths
          </Link>
        </nav>

      </div>
    </header>
  );
}


function SkillSwitcher({
  currentSkill,
  levelKey,
  purposeKey,
}: {
  currentSkill: SkillType;
  levelKey: CefrLevel;
  purposeKey: PurposeKey;
}) {
  const skills: Array<{ key: SkillType; label: string; icon: React.ReactNode }> = [
    { key: "READING",   label: "Reading",   icon: <BookOpen        className="h-3.5 w-3.5" strokeWidth={2} /> },
    { key: "LISTENING", label: "Listening", icon: <Headphones      className="h-3.5 w-3.5" strokeWidth={2} /> },
    { key: "WRITING",   label: "Writing",   icon: <PenLine         className="h-3.5 w-3.5" strokeWidth={2} /> },
    { key: "SPEAKING",  label: "Speaking",  icon: <MessagesSquare  className="h-3.5 w-3.5" strokeWidth={2} /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50 mr-2">
        Skill
      </p>
      {skills.map((s) => {
        const isActive = s.key === currentSkill;
        return (
          <Link
            key={s.key}
            href={`/paths/${levelKey}/${purposeKey}/${s.key.toLowerCase()}`}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-foreground text-background"
                : "border border-foreground/10 bg-background text-foreground/70 hover:border-foreground/25 hover:text-foreground",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {s.icon}
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}


function LessonCard({
  href,
  index,
  skill,
  title,
  minutes,
  questionCount,
  completed,
}: {
  href: string;
  index: number;
  skill: SkillType;
  title: string;
  minutes: number;
  questionCount: number;
  completed: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 rounded-2xl border border-foreground/10 bg-background p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#B8985A] hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.12)] sm:p-6"
    >
      <div className={[
        "inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
        completed
          ? "bg-[#B8985A] text-[#0B1C3F]"
          : "bg-[#DCE6F2] text-foreground group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F]",
      ].join(" ")}>
        {completed
          ? <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          : renderSkillIcon(skill)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
          Lesson {index} {capitalizeSkill(skill)}
        </p>
        <h3 className="mt-1 font-serif text-lg font-medium leading-snug tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {minutes} min
          </span>
          <span>{questionCount} {questionCount === 1 ? "question" : "questions"}</span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        {completed ? (
          <span className="hidden rounded-full bg-[#B8985A] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0B1C3F] sm:inline-block">
            Complete
          </span>
        ) : null}
        <ArrowRight className="h-4 w-4 text-foreground/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground" strokeWidth={2} />
      </div>
    </Link>
  );
}


function WritingCard({
  id,
  index,
  title,
  prompt,
  minWords,
  maxWords,
}: {
  id: string;
  index: number;
  title: string;
  prompt: string;
  minWords: number;
  maxWords: number;
}) {
  return (
    <Link
      href={`/assignments/${id}`}
      className="group block rounded-2xl border border-foreground/10 bg-background p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#B8985A] hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.15)] sm:p-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE6F2] text-foreground transition-colors duration-300 group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F]">
          <PenLine className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
          Prompt {index} Writing
        </p>
      </div>

      <h3 className="font-serif text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-[1.65] text-foreground/70">
        {prompt}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-4">
        <p className="text-xs text-foreground/60">
          {minWords}-{maxWords} words
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors group-hover:text-[#B8985A]">
          Start writing
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}


function EmptyState({
  skillKey,
  levelKey,
  purposeKey,
  setTitle,
}: {
  skillKey: SkillType;
  levelKey: CefrLevel;
  purposeKey: PurposeKey;
  setTitle: string;
}) {
  const skillLabel = capitalizeSkill(skillKey);
  const isSpeaking = skillKey === "SPEAKING";

  return (
    <div className="mt-10 rounded-2xl border border-foreground/10 bg-background p-8 text-center dark:bg-foreground/[0.04] sm:p-12">
      <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE6F2] text-foreground dark:bg-foreground/[0.10]">
        {renderSkillIcon(skillKey, "lg")}
      </div>

      <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {isSpeaking
          ? "Speaking is launching very soon."
          : skillLabel + " content is coming very soon."}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-[1.65] text-foreground/70 sm:text-base">
        {isSpeaking
          ? "Live one-on-one Zoom sessions with real teachers will land here in a coming update. In the meantime, try a different skill below."
          : "We are putting the finishing touches on the " + skillLabel.toLowerCase() + " material for this path. While you wait, try a different skill."}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-all duration-200 hover:scale-[1.02] hover:bg-foreground/90"
        >
          Back to dashboard
        </Link>
        <Link
          href={`/paths/${levelKey}/${purposeKey}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/30"
        >
          See full path
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}


function capitalizeSkill(skill: string): string {
  if (!skill) return "";
  return skill[0].toUpperCase() + skill.slice(1).toLowerCase();
}


function renderSkillIcon(skill: SkillType, size: "sm" | "lg" = "sm") {
  const cls = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  if (skill === "READING")   return <BookOpen        className={cls} strokeWidth={1.75} />;
  if (skill === "LISTENING") return <Headphones      className={cls} strokeWidth={1.75} />;
  if (skill === "WRITING")   return <PenLine         className={cls} strokeWidth={1.75} />;
  if (skill === "SPEAKING")  return <MessagesSquare  className={cls} strokeWidth={1.75} />;
  return <BookOpen className={cls} strokeWidth={1.75} />;
}
