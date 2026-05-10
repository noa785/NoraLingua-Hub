import { redirect } from "next/navigation";

import {
  ArrowRight,
  BookOpen,
  Headphones,
  PenLine,
  MessagesSquare,
  Target,
  Compass,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { CEFR_LEVELS, PURPOSES, SKILLS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/shared/TopNav";

import type { Metadata } from "next";
import type { SkillType } from "@/generated/prisma";


export const metadata: Metadata = {
  title:       "Practice",
  description: "Pick a skill and start practicing your English.",
};


const SKILL_ICONS: Record<SkillType, typeof BookOpen> = {
  READING:   BookOpen,
  LISTENING: Headphones,
  WRITING:   PenLine,
  SPEAKING:  MessagesSquare,
};


export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName:    true,
      level:       true,
      purpose:     true,
      targetSkill: true,
      onboardedAt: true,
    },
  });
  if (!profile)              redirect("/onboarding");
  if (!profile.onboardedAt)  redirect("/onboarding");

  const levelData   = profile.level   ? CEFR_LEVELS.find((l) => l.key === profile.level)        : null;
  const purposeData = profile.purpose ? PURPOSES.find((p) => p.key === profile.purpose)         : null;
  const skillData   = profile.targetSkill ? SKILLS.find((s) => s.key === profile.targetSkill)   : null;

  const purposeWord = purposeData?.name.toLowerCase() ?? "your goal";

  const pathPrefix = (profile.level && profile.purpose)
    ? `/paths/${profile.level}/${profile.purpose}`
    : "/paths";

  const firstName = profile.fullName.split(" ")[0];

  return (
    <main className="min-h-screen">

      <TopNav firstName={firstName} active="practice" />

      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl dark:opacity-10" />
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10 lg:px-8 lg:pt-20">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            Pick a skill to practice
          </div>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            Ready to learn.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-[1.65] text-foreground/70 sm:text-lg">
            Each skill is its own focused list within your {purposeWord}
            path. Click a tile to begin.
          </p>

        </div>
      </section>

      {/* PATH STRIP */}
      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                Your path
              </p>
              <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground">
                Personalized for you.
              </h2>
            </div>
            <Link
              href="/onboarding"
              className="hidden items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-[#B8985A] sm:inline-flex"
            >
              Update preferences
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PathCard
              icon={<Target className="h-5 w-5" strokeWidth={1.75} />}
              eyebrow="Level"
              title={profile.level ?? "Not set"}
              description={levelData?.name ?? "Update your preferences"}
            />
            <PathCard
              icon={<Compass className="h-5 w-5" strokeWidth={1.75} />}
              eyebrow="Goal"
              title={purposeData?.name ?? "Not set"}
              description={purposeData?.description ?? "Update your preferences"}
            />
            <PathCard
              icon={skillData ? renderSkillIcon(skillData.key as SkillType) : <BookOpen className="h-5 w-5" strokeWidth={1.75} />}
              eyebrow="Focus"
              title={skillData?.name ?? "Not set"}
              description={skillData?.description ?? "Update your preferences"}
              accent
            />
          </div>
        </div>
      </section>

      {/* SKILLS GRID */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">

          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Practice
            </p>
            <h2 className="mt-1 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.1] tracking-tight text-foreground">
              Choose a skill.
            </h2>
            <p className="mt-3 text-base leading-[1.65] text-foreground/70">
              Start with the skill you want to focus on today. You can switch any time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((skill) => {
              const isFocus = profile.targetSkill === skill.key;
              const Icon = SKILL_ICONS[skill.key as SkillType];
              const href = `${pathPrefix}/${skill.key.toLowerCase()}`;

              return (
                <SkillTile
                  key={skill.key}
                  href={href}
                  icon={<Icon className="h-5 w-5" strokeWidth={1.75} />}
                  title={skill.name}
                  description={skill.description}
                  isFocus={isFocus}
                />
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={pathPrefix}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 py-2.5 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-foreground/30 hover:text-foreground"
            >
              View full path with all skills
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}


function PathCard({
  icon, eyebrow, title, description, accent = false,
}: {
  icon: React.ReactNode; eyebrow: string; title: string; description: string; accent?: boolean;
}) {
  return (
    <div className={[
      "rounded-2xl border p-6 transition-colors",
      accent
        ? "border-[#B8985A]/20 bg-[#B8985A]/[0.05]"
        : "border-[#3D6FA8]/15 bg-[#DCE6F2]/40 dark:border-foreground/10 dark:bg-foreground/[0.07]",
    ].join(" ")}>
      <div className={[
        "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
        accent ? "bg-[#B8985A] text-[#0B1C3F]" : "bg-background/70 text-foreground dark:bg-foreground/[0.12]",
      ].join(" ")}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">{eyebrow}</p>
      <p className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-[1.5] text-foreground/70">{description}</p>
    </div>
  );
}


function SkillTile({
  href, icon, title, description, isFocus,
}: {
  href: string; icon: React.ReactNode; title: string; description: string; isFocus: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative flex flex-col rounded-2xl border bg-[#DCE6F2]/30 p-6 text-left transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-[#B8985A] hover:bg-[#DCE6F2]/55 hover:shadow-[0_8px_30px_-12px_rgba(11,28,63,0.15)]",
        "dark:bg-foreground/[0.07] dark:hover:bg-foreground/[0.11]",
        isFocus
          ? "border-[#B8985A]/50 ring-1 ring-[#B8985A]/20"
          : "border-[#3D6FA8]/15 dark:border-foreground/10",
      ].join(" ")}
    >
      {isFocus ? (
        <span className="absolute right-4 top-4 rounded-full bg-[#B8985A] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0B1C3F]">
          Focus
        </span>
      ) : null}

      <div className={[
        "mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
        isFocus
          ? "bg-[#B8985A] text-[#0B1C3F]"
          : "bg-background/70 text-foreground group-hover:bg-[#B8985A] group-hover:text-[#0B1C3F] dark:bg-foreground/[0.12]",
      ].join(" ")}>
        {icon}
      </div>

      <h3 className="font-serif text-xl font-medium leading-tight tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-[1.6] text-foreground/70">{description}</p>

      <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground">
        Open
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
      </div>
    </Link>
  );
}


function renderSkillIcon(skill: SkillType): React.ReactNode {
  const Icon = SKILL_ICONS[skill];
  return <Icon className="h-5 w-5" strokeWidth={1.75} />;
}
