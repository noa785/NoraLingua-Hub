import Link from "next/link";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";


/*
  AdminDashboardSections

  Renders two read-only operational sections that replace the
  learner-flavored sections (Skill Mastery, Writing Journey,
  Milestones, Activity Feed) when the dashboard is viewed by an
  admin. The intent is to give the administrator descriptive but
  simple visibility into:

    1. Teaching Team   - per-teacher load and session outcomes
    2. Learners        - per-student progress at a glance

  Why two flat sections instead of charts or sparklines?
    Glance reading. Numbers in monospace align well, plurals are
    handled, and the page stays readable on mobile. Charts can
    arrive in v2 once we have enough data to make them meaningful.

  Why client-side rendering of computed rates?
    The data shapes are small (handful of teachers, handful of
    students) so passing pre-computed primitives from the server
    keeps this file pure presentation. No useEffect, no charts,
    no client state.
*/


type TeacherRow = {
  id:                string;
  fullName:          string;
  isActive:          boolean;
  studentCount:      number;
  bookingsBooked:    number;
  bookingsCompleted: number;
  bookingsCancelled: number;
};

type StudentRow = {
  id:                  string;
  fullName:            string;
  email:               string;
  level:               string | null;
  purposeName:         string | null;
  teacherName:         string | null;
  lessonsCompleted:    number;
  lessonsTotal:        number;
  writingBandAverage:  number | null;
  bookedSessions:      number;
};


type Props = {
  teachers: TeacherRow[];
  students: StudentRow[];
};


export function AdminDashboardSections({ teachers, students }: Props): JSX.Element {
  return (
    <>

      {/* SECTION 1: TEACHING TEAM */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Teaching team
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              How each teacher is performing.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-foreground/70">
              Student load and session outcomes per teacher.
            </p>
          </div>

          {/* Teacher cards grid */}
          {teachers.length === 0 ? (
            <EmptyHint
              message="No teachers added yet. Open the admin panel and add a teacher record so students can be assigned."
              ctaHref="/admin/teachers"
              ctaLabel="Manage teachers"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION 2: LEARNERS */}
      <section className="bg-[#DCE6F2]/40 dark:bg-foreground/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8985A]">
              Learners
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              How each student is progressing.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-foreground/70">
              One row per student, sorted by signup date (newest first).
            </p>
          </div>

          {students.length === 0 ? (
            <EmptyHint
              message="No students yet. The platform will populate this view as learners complete onboarding."
              ctaHref="/admin"
              ctaLabel="Open admin overview"
            />
          ) : (
            <StudentsTable students={students} />
          )}

        </div>
      </section>

    </>
  );
}


/* ============================================================
   TeacherCard
   ============================================================ */

/*
  Single teacher tile. Shows student load + session outcomes, plus
  a derived completion rate. We keep the math local so the parent
  data shape stays simple primitives.
*/
function TeacherCard({ teacher }: { teacher: TeacherRow }): JSX.Element {

  /* Completion rate is COMPLETED divided by COMPLETED + CANCELLED.
     We exclude BOOKED-but-not-yet-due sessions from the denominator
     because they have not happened yet and would unfairly drag the
     ratio toward zero for new teachers. If both completed and
     cancelled are zero, the ratio is undefined and we display a
     dash. */
  const finishedTotal = teacher.bookingsCompleted + teacher.bookingsCancelled;
  const completionRate = finishedTotal > 0
    ? Math.round((teacher.bookingsCompleted / finishedTotal) * 100)
    : null;

  return (
    <article className="rounded-2xl border border-foreground/10 bg-background p-6">

      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#B8985A]/10 text-[#B8985A]">
              <GraduationCap className="h-4 w-4" strokeWidth={2} />
            </span>
            <h3 className="font-serif text-lg font-medium tracking-tight text-foreground">
              {teacher.fullName}
            </h3>
          </div>
          <p className="mt-2 text-sm text-foreground/70">
            {teacher.studentCount === 1
              ? "1 student"
              : teacher.studentCount + " students"} assigned
          </p>
        </div>

        <span
          className={
            teacher.isActive
              ? "inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs font-medium text-emerald-400"
              : "inline-flex rounded-full border border-foreground/20 px-2.5 py-0.5 text-xs font-medium text-foreground/60"
          }
        >
          {teacher.isActive ? "Active" : "Inactive"}
        </span>
      </header>

      {/* Stats */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-foreground/10 pt-5">

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Booked
          </dt>
          <dd className="mt-1 font-serif text-2xl text-foreground">
            {teacher.bookingsBooked}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Completed
          </dt>
          <dd className="mt-1 font-serif text-2xl text-emerald-400">
            {teacher.bookingsCompleted}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Cancelled
          </dt>
          <dd className="mt-1 font-serif text-2xl text-foreground/50">
            {teacher.bookingsCancelled}
          </dd>
        </div>

      </dl>

      {/* Completion rate footer */}
      <footer className="mt-5 flex items-center justify-between border-t border-foreground/10 pt-4 text-xs">
        <span className="text-foreground/60">
          Completion rate
        </span>
        <span className="font-medium text-foreground">
          {completionRate === null ? "--" : completionRate + "%"}
        </span>
      </footer>

    </article>
  );
}


/* ============================================================
   StudentsTable
   ============================================================ */

/*
  Flat table of students. Columns are kept narrow for mobile and
  the layout collapses to horizontal scroll if the viewport is
  too small. Every cell is plain text, no icons, no graphics, by
  design.
*/
function StudentsTable({ students }: { students: StudentRow[] }): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-left">

          <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Student</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Level</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Purpose</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Teacher</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Lessons</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Writing</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Sessions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-foreground/10">
            {students.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-foreground/[0.02]">

                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-foreground">
                    {s.fullName}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/60">
                    {s.email}
                  </p>
                </td>

                <td className="px-4 py-4 text-sm text-foreground">
                  {s.level ?? "--"}
                </td>

                <td className="px-4 py-4 text-sm text-foreground">
                  {s.purposeName ?? "--"}
                </td>

                <td className="px-4 py-4 text-sm">
                  {s.teacherName ? (
                    <span className="text-foreground">{s.teacherName}</span>
                  ) : (
                    <span className="text-amber-500">Unassigned</span>
                  )}
                </td>

                <td className="px-4 py-4 text-sm text-foreground">
                  {s.lessonsCompleted}
                  <span className="text-foreground/40">
                    {" / "}{s.lessonsTotal}
                  </span>
                </td>

                <td className="px-4 py-4 text-sm text-foreground">
                  {s.writingBandAverage === null
                    ? "--"
                    : s.writingBandAverage.toFixed(1)}
                </td>

                <td className="px-4 py-4 text-sm text-foreground">
                  {s.bookedSessions}
                  <span className="text-foreground/40">{" / 3"}</span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}


/* ============================================================
   EmptyHint
   ============================================================ */

/*
  Friendly empty-state used when there are no teachers or no
  students yet. Includes a CTA so the admin can act immediately.
*/
function EmptyHint({
  message,
  ctaHref,
  ctaLabel,
}: {
  message:  string;
  ctaHref:  string;
  ctaLabel: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background p-10 text-center">
      <p className="mx-auto max-w-md text-sm text-foreground/70">
        {message}
      </p>
      <div className="mt-5">
        <Link
          href={ctaHref}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/30 hover:bg-foreground/5"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
