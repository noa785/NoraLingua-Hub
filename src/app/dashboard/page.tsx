import { redirect } from "next/navigation";

import { Sparkles } from "lucide-react";

import { CEFR_LEVELS, PURPOSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { computeDashboardStats } from "@/lib/progress-stats";

import { TopNav } from "@/components/shared/TopNav";
import { FlashMessage } from "@/components/shared/FlashMessage";
import { AdminPanelCard } from "@/components/admin/AdminPanelCard";
import { AdminDashboardSections } from "@/components/admin/AdminDashboardSections";
import { HeroLearnerCard } from "@/components/progress/HeroLearnerCard";
import { SkillMasteryGrid } from "@/components/progress/SkillMasteryGrid";
import { WritingJourneyChart } from "@/components/progress/WritingJourneyChart";
import { ActivityFeed } from "@/components/progress/ActivityFeed";
import { MilestonesAndShare } from "@/components/progress/MilestonesAndShare";
import { NextClassCard } from "@/components/progress/NextClassCard";
import { LatestFeedbackCard } from "@/components/progress/LatestFeedbackCard";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title:       "Dashboard",
  description: "Your personal English learning progress and milestones.",
};


type SearchParamsPromise = Promise<{ flash?: string }>;


/*
  Dashboard page.

  Renders one of two layouts depending on the signed-in user's
  role:

    Admin (role = ADMIN):
      - TopNav with Admin pill
      - AdminPanelCard with four operational stats
      - AdminDashboardSections with Teaching Team + Learners
      - No learner-flavored sections (Skill Mastery, Writing,
        Milestones, Activity Feed) because those are not
        meaningful for an admin who has no learning path.

    Student (role = STUDENT):
      - TopNav without Admin pill
      - Welcome banner + Hero learner card
      - Skill Mastery rings
      - Writing Journey chart
      - Milestones + Share
      - Activity feed

  Why one URL for both roles?
    Predictable. Bookmarks survive role changes. Links from emails
    or marketing materials always work. The role check is cheap
    and happens once per render.
*/


export default async function DashboardPage({ searchParams }: { searchParams: SearchParamsPromise }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const flashRaw = sp?.flash ?? null;
  const flashMessage = flashRaw && flashRaw.length > 0 ? flashRaw : null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email:       true,
      fullName:    true,
      role:        true,
      level:       true,
      purpose:     true,
      targetSkill: true,
      onboardedAt: true,
      createdAt:   true,
    },
  });
  if (!profile) redirect("/onboarding");
  if (!profile.onboardedAt) redirect("/onboarding");

  const isAdmin = profile.role === "ADMIN";
  const firstName = profile.fullName.split(" ")[0];


  /* ============================================================
     ADMIN BRANCH
     Fetch admin-specific data and render the operational view.
     ============================================================ */

  if (isAdmin) {

    /* Quick aggregate stats for the AdminPanelCard. */
    const [studentCount, teacherCount, bookedSessionCount, ungradedCount] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.speakingBooking.count({ where: { status: "BOOKED" } }),
      prisma.submission.count({ where: { gradedAt: null } }),
    ]);

    /* Per-teacher stats. We fetch teachers and their relation
       counts, plus a separate groupBy for bookings to count
       BOOKED, COMPLETED, and CANCELLED in one round trip. */
    const teachersRaw = await prisma.teacher.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id:        true,
        fullName:  true,
        isActive:  true,
        _count:    { select: { assignedStudents: true } },
      },
    });

    const teacherBookingGroups = await prisma.speakingBooking.groupBy({
      by:     ["teacherId", "status"],
      _count: { _all: true },
    });

    const teacherBookingMap = new Map<string, { booked: number; completed: number; cancelled: number }>();
    for (const row of teacherBookingGroups) {
      if (!row.teacherId) continue;
      const current = teacherBookingMap.get(row.teacherId) ?? { booked: 0, completed: 0, cancelled: 0 };
      if (row.status === "BOOKED")    current.booked    = row._count._all;
      if (row.status === "COMPLETED") current.completed = row._count._all;
      if (row.status === "CANCELLED") current.cancelled = row._count._all;
      teacherBookingMap.set(row.teacherId, current);
    }

    const teacherRows = teachersRaw.map((t) => {
      const counts = teacherBookingMap.get(t.id) ?? { booked: 0, completed: 0, cancelled: 0 };
      return {
        id:                t.id,
        fullName:          t.fullName,
        isActive:          t.isActive,
        studentCount:      t._count.assignedStudents,
        bookingsBooked:    counts.booked,
        bookingsCompleted: counts.completed,
        bookingsCancelled: counts.cancelled,
      };
    });


    /* Per-student stats. We fetch all students with their
       assigned teacher and relation counts, then enrich with
       writing average. */
    const studentsRaw = await prisma.user.findMany({
      where:   { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id:                true,
        fullName:          true,
        email:             true,
        level:             true,
        purpose:           true,
        assignedTeacher:   { select: { fullName: true } },
        progress:          {
          where:  { isCompleted: true },
          select: { lessonId: true },
        },
        submissions: {
          where:  { bandOverall: { not: null } },
          select: { bandOverall: true },
        },
        speakingBookings: {
          where:  { status: "BOOKED" },
          select: { id: true },
        },
      },
    });

    /* Lessons total per (level, purpose) so we can show 0/30
       instead of just 0. */
    const materialSets = await prisma.materialSet.findMany({
      include: {
        level:   { select: { key: true } },
        purpose: { select: { key: true } },
        _count:  { select: { lessons: true } },
      },
    });

    const lessonsTotalByPath = new Map<string, number>();
    for (const ms of materialSets) {
      const key = ms.level.key + "::" + ms.purpose.key;
      lessonsTotalByPath.set(key, ms._count.lessons);
    }

    const studentRows = studentsRaw.map((s) => {

      const purposeName = s.purpose
        ? (PURPOSES.find((p) => p.key === s.purpose)?.name ?? s.purpose)
        : null;

      const lessonsTotalKey = s.level && s.purpose ? s.level + "::" + s.purpose : "";
      const lessonsTotal = lessonsTotalByPath.get(lessonsTotalKey) ?? 0;

      /* Average writing band, only across submissions that have
         been graded (bandOverall not null). */
      const bandValues = s.submissions
        .map((sub) => sub.bandOverall)
        .filter((v): v is number => v !== null);
      const writingBandAverage = bandValues.length > 0
        ? bandValues.reduce((sum, v) => sum + v, 0) / bandValues.length
        : null;

      return {
        id:                  s.id,
        fullName:            s.fullName,
        email:               s.email,
        level:               s.level,
        purposeName,
        teacherName:         s.assignedTeacher?.fullName ?? null,
        lessonsCompleted:    s.progress.length,
        lessonsTotal,
        writingBandAverage,
        bookedSessions:      s.speakingBookings.length,
      };
    });

    return (
      <main className="min-h-screen pb-24">

        <TopNav firstName={firstName} active="dashboard" isAdmin={true} />

        <FlashMessage message={flashMessage} />

        <AdminPanelCard
          studentCount={studentCount}
          teacherCount={teacherCount}
          bookedSessionCount={bookedSessionCount}
          ungradedCount={ungradedCount}
        />

        <AdminDashboardSections
          teachers={teacherRows}
          students={studentRows}
        />

      </main>
    );
  }


  /* ============================================================
     STUDENT BRANCH
     Fetch learner-specific data and render the standard dashboard.
     ============================================================ */

  const materialSet = (profile.level && profile.purpose)
    ? await prisma.materialSet.findFirst({
        where: {
          level:   { key: profile.level },
          purpose: { key: profile.purpose },
        },
        include: {
          lessons:            { select: { id: true, skill: true, title: true } },
          writingAssignments: { select: { id: true, title: true } },
        },
      })
    : null;

  const [progress, submissions, speakingBookings] = await Promise.all([
    prisma.progress.findMany({
      where:  { userId: user.id },
      select: {
        lessonId:       true,
        isCompleted:   true,
        correctAnswers: true,
        totalQuestions: true,
        completedAt:    true,
        lastAccessedAt: true,
      },
    }),
    prisma.submission.findMany({
      where:  { userId: user.id },
      select: {
        id:           true,
        assignmentId: true,
        bandOverall:  true,
        /* Per-criterion bands and both feedback fields are pulled so the
           dashboard's LatestFeedbackCard can render the full rubric snapshot
           without an extra query. detailedFeedback pairs with the IELTS
           rubric upgrade; feedback remains for legacy submissions. */
        bandCriterion1:   true,
        bandCriterion2:   true,
        bandCriterion3:   true,
        bandCriterion4:   true,
        feedback:         true,
        detailedFeedback: true,
        gradedAt:     true,
        createdAt:    true,
      },
    }),
    prisma.speakingBooking.findMany({
      where:  { userId: user.id },
      select: {
        id:          true,
        sessionDate: true,
        status:      true,
        createdAt:   true,
        /* Pull teacher name and personal Zoom URL so the
           NextClassCard on the dashboard can render a Join button
           without an extra round trip. zoomUrl is nullable because
           a teacher record may exist before their Personal Meeting
           Room is set up. */
        teacher: {
          select: {
            fullName: true,
            zoomUrl:  true,
          },
        },
      },
    }),
  ]);

  const stats = computeDashboardStats({
    userJoinedAt:       profile.createdAt,
    lessons:            materialSet?.lessons ?? [],
    writingAssignments: materialSet?.writingAssignments ?? [],
    progress,
    submissions,
    speakingBookings,
  });

  const levelData   = profile.level   ? CEFR_LEVELS.find((l) => l.key === profile.level)        : null;
  const purposeData = profile.purpose ? PURPOSES.find((p) => p.key === profile.purpose)         : null;

  const pathPrefix = (profile.level && profile.purpose)
    ? "/paths/" + profile.level + "/" + profile.purpose
    : "/paths";

  const writingPath = pathPrefix + "/writing";

  return (
    <main className="min-h-screen pb-24">

      <TopNav firstName={firstName} active="dashboard" isAdmin={false} />

      <FlashMessage message={flashMessage} />

      {/* INTRO STRIP */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#DCE6F2] opacity-40 blur-3xl dark:opacity-10" />
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-2 lg:px-8 lg:pt-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#B8985A]" strokeWidth={2} />
            Welcome back, {firstName}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 pb-12 lg:px-8">
          <HeroLearnerCard
            fullName={profile.fullName}
            levelKey={profile.level}
            levelName={levelData?.name ?? null}
            purposeName={purposeData?.name ?? null}
            joinedAt={profile.createdAt}
            lessonsCompleted={stats.lessonsCompleted}
            writingBandAverage={stats.writingBandAverage}
            speakingSessionsBooked={stats.speakingSessionsBooked}
            daysActive={stats.daysActive}
          />
        </div>
      </section>

      {/* NEXT CLASS
          Surface upcoming Speaking sessions on the dashboard so
          the learner does not have to navigate elsewhere to find
          their next Zoom session. We filter to BOOKED + future
          here (rather than in the Prisma query) so the rest of
          speakingBookings stays available for computeDashboardStats
          which counts all bookings regardless of status. */}
      <NextClassCard
        bookings={speakingBookings
          .filter((b) => b.status === "BOOKED" && b.sessionDate.getTime() > Date.now())
          .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())
          .map((b) => ({
            id:          b.id,
            sessionDate: b.sessionDate,
            teacher:     b.teacher,
          }))}
      />

      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Skill mastery
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Where you stand in each skill.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-foreground/70">
              Each ring shows how much of your path you have completed for that skill.
            </p>
          </div>
          <SkillMasteryGrid skills={stats.skills} pathPrefix={pathPrefix} />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Writing
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Your improvement, plotted.
            </h2>
          </div>
          {/* Writing analytics: chart of bands over time on the left, the
              most recent feedback excerpt with per-criterion bars on the
              right. Side by side on lg+, stacked below. The chart is the
              quantitative trend; the feedback card is the qualitative voice
              behind the latest score, so a learner sees both numerator and
              meaning without leaving the dashboard. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <WritingJourneyChart writing={stats.writing} pathHref={writingPath} />
            <LatestFeedbackCard feedback={stats.writing.latestFeedback} />
          </div>
        </div>
      </section>

      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Milestones
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Achievements worth celebrating.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-foreground/70">
              Two prestigious milestones recognising real progress, ready to share when unlocked.
            </p>
          </div>
          <MilestonesAndShare
            milestones={stats.milestones}
            fullName={profile.fullName}
            levelKey={profile.level}
            purposeName={purposeData?.name ?? null}
            lessonsCompleted={stats.lessonsCompleted}
            bandAverage={stats.writingBandAverage}
          />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <ActivityFeed items={stats.activity} pathHref={pathPrefix} />
        </div>
      </section>

    </main>
  );
}