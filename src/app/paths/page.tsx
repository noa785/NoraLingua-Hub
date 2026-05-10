import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CEFR_LEVELS, PURPOSES } from "@/lib/constants";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "All paths",
  description: "Choose your English learning path. Matched to your level and goal.",
};


/*
  Paths page

  Layout:
    1. Top nav (lightweight, matches the dashboard)
    2. Hero with personalized greeting
    3. "Your path" -- one big featured card matching the user's
       level and goal, with a YOUR PATH ribbon
  Why show only the matched path?
    Showing other paths to a learner adds noise without value: a
    B1 user clicking on a B2 path lands on content that is too
    hard, and an A2 path is too easy. Either way the click is
    a dead end. We focus the page on the user'\''s own path and
    surface other paths only when there is a real reason for
    a learner to switch (e.g. they finish their current path).
*/


export default async function PathsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      level: true,
      purpose: true,
      onboardedAt: true,
    },
  });
  if (!profile?.onboardedAt) redirect("/onboarding");

  // Fetch all material sets with level + purpose so we can sort
  const allSets = await prisma.materialSet.findMany({
    include: {
      level:    true,
      purpose:  true,
      _count: { select: { lessons: true, writingAssignments: true } },
    },
  });

  // Find the user's matched MaterialSet (if any)
  const matchedSet = allSets.find(
    (s) => s.level.key === profile.level && s.purpose.key === profile.purpose
  );

  const firstName = profile.fullName.split(" ")[0];

  return (
    <main className="min-h-screen">

      <TopNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl"
        />
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-12 lg:px-8 lg:pt-20">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            All paths
          </div>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            Hi {firstName}, your path is ready.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-[1.65] text-foreground/70 sm:text-lg">
            This is the path matched to your level and goal. Open it to see
            your reading, listening, and writing lessons.
          </p>

        </div>
      </section>

      {/* MATCHED PATH -- one big hero card */}
      {matchedSet ? (
        <section className="bg-[#DCE6F2]/50">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Your path
            </p>
            <h2 className="mb-10 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Personalized for your level and goal.
            </h2>

            <FeaturedPathCard
              href={`/paths/${matchedSet.level.key}/${matchedSet.purpose.key}`}
              levelKey={matchedSet.level.key}
              levelName={CEFR_LEVELS.find((l) => l.key === matchedSet.level.key)?.name ?? matchedSet.level.key}
              purposeName={PURPOSES.find((p) => p.key === matchedSet.purpose.key)?.name ?? matchedSet.purpose.key}
              title={matchedSet.title}
              description={matchedSet.description ?? ""}
              lessonCount={matchedSet._count.lessons}
              writingCount={matchedSet._count.writingAssignments}
            />

          </div>
        </section>
      ) : (
        /* No matched path? Tell the user clearly. */
        <section className="bg-[#DCE6F2]/50">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="rounded-2xl border border-foreground/10 bg-background p-8 sm:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
                No path yet
              </p>
              <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                We do not yet have a path for {profile.level} + {profile.purpose}.
              </h2>
              <p className="mt-3 text-sm leading-[1.65] text-foreground/70">
                We are adding more paths every month. In the meantime you can
                explore the paths below.
              </p>
            </div>
          </div>
        </section>
      )}


    </main>
  );
}


/* ============================================================
   SUBCOMPONENTS
   ============================================================ */


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
          <span className="rounded-full bg-foreground/[0.04] px-4 py-1.5 text-sm font-medium text-foreground">
            Paths
          </span>
        </nav>

      </div>
    </header>
  );
}


/* Featured (big) card for the user's matched path */
function FeaturedPathCard({
  href,
  levelKey,
  levelName,
  purposeName,
  title,
  description,
  lessonCount,
  writingCount,
}: {
  href: string;
  levelKey: string;
  levelName: string;
  purposeName: string;
  title: string;
  description: string;
  lessonCount: number;
  writingCount: number;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-[#B8985A]/40 bg-background p-8 ring-1 ring-[#B8985A]/15 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(11,28,63,0.18)] sm:p-10 lg:p-12"
    >
      {/* YOUR PATH ribbon */}
      <span className="absolute right-6 top-6 rounded-full bg-[#B8985A] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0B1C3F] sm:right-8 sm:top-8">
        Your path
      </span>

      {/* Eyebrow tags */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#B8985A]/10 px-3 py-1 text-xs font-semibold text-foreground">
          <Sparkles className="h-3 w-3 text-[#B8985A]" strokeWidth={2} />
          {levelKey}
        </span>
        <span className="text-foreground/40">&middot;</span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          {purposeName}
        </span>
        <span className="text-foreground/40">&middot;</span>
        <span className="text-xs font-medium text-foreground/60">
          {levelName}
        </span>
      </div>

      <h3 className="font-serif text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-4 max-w-2xl text-base leading-[1.65] text-foreground/70">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6">
        <p className="text-sm text-foreground/70">
          <span className="font-medium text-foreground">{lessonCount}</span> lessons,{" "}
          <span className="font-medium text-foreground">{writingCount}</span> writing prompt{writingCount === 1 ? "" : "s"}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-[#B8985A]">
          Open path
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}


