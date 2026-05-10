import { prisma } from "@/lib/prisma";


/*
  Admin overview page.
  Top-level dashboard showing system-wide counts. This is the
  landing page after an admin signs in or clicks the Admin nav
  link. All counts come from a single Promise.all so the page
  resolves with one database round-trip latency.
*/


export const metadata = {
  title: "Admin overview",
};


export default async function AdminOverviewPage(): Promise<JSX.Element> {

  const [
    studentCount,
    materialSetCount,
    lessonCount,
    submissionCount,
    bookingCount,
    classCount,
    teacherCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.materialSet.count(),
    prisma.lesson.count(),
    prisma.submission.count(),
    prisma.speakingBooking.count(),
    prisma.scheduledClass.count(),
    prisma.teacher.count(),
  ]);

  const stats = [
    { label: "Students",        value: studentCount,     hint: "Registered learner accounts" },
    { label: "Material sets",   value: materialSetCount, hint: "Level + purpose combinations" },
    { label: "Lessons",         value: lessonCount,      hint: "Reading and listening lessons" },
    { label: "Submissions",     value: submissionCount,  hint: "Writing submissions on record" },
    { label: "Speaking bookings", value: bookingCount,   hint: "Sessions booked by learners" },
    { label: "Classes",         value: classCount,       hint: "Scheduled speaking sessions" },
    { label: "Teachers",        value: teacherCount,     hint: "Teaching staff on record" },
  ];

  return (
    <div className="space-y-10">

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#B8985A]">
          Overview
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground">
          The state of the platform.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          A snapshot of every entity admins can manage. Use the
          navigation above to drill into a specific area.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-foreground/10 bg-background p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              {stat.label}
            </p>
            <p className="mt-3 font-serif text-4xl text-foreground">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              {stat.hint}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
